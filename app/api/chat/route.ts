import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createMCPClient } from '@ai-sdk/mcp';
import { convertToModelMessages, stepCountIs, streamText, type UIMessage, tool } from 'ai';
import { z } from 'zod';
import { sanityReadClient } from '@/sanity/client';

export const maxDuration = 60;

const NIM_MODEL = process.env.NIM_MODEL || 'nvidia/nemotron-3.5-lightning-30b-a3b';
const SANITY_CONTEXT_ENDPOINT = process.env.SANITY_MCP_ENDPOINT
  || 'https://api.sanity.io/v1/context/organizations/os697e03r/mcp/origintrace-ledger';

// NVIDIA NIM provider — OpenAI-compatible, backed by free inference credits
const nim = createOpenAICompatible({
  name: 'nim',
  baseURL: 'https://integrate.api.nvidia.com/v1',
  headers: {
    Authorization: `Bearer ${process.env.NIM_API_KEY}`,
  },
});

/**
 * Fetch all relevant structured content from Sanity Content Lake
 * to give the agent full context about scanned articles and provenance checks.
 */
async function fetchSanityContext(): Promise<string> {
  try {
    // Query articles with their provenance checks — this is the structured content
    const articles = await sanityReadClient.fetch(`
      *[_type == "article"] | order(publishedAt desc)[0...20] {
        _id,
        title,
        canonicalUrl,
        publishedAt,
        platform,
        "authorName": author->name,
        "authorHandle": author->handle,
        "checks": *[_type == "provenanceCheck" && matchedArticle._ref == ^._id] | order(checkedAt desc) {
          checkedUrl,
          checkedTitle,
          verdict,
          overlapPercent,
          "hasAuthorName": attribution.hasAuthorName,
          "hasOriginalLink": attribution.hasOriginalLink,
          "attributionSignals": attribution.signals,
          "missingAttribution": attribution.missing,
          checkedAt
        }
      }
    `);

    if (!articles || articles.length === 0) {
      return 'No articles have been scanned yet. The Sanity Content Lake is empty.';
    }

    // Format the structured content as context
    const lines: string[] = [
      `=== SANITY CONTENT LAKE: ${articles.length} ARTICLES INDEXED ===\n`,
    ];

    for (const article of articles) {
      const checks = article.checks || [];
      const actionable = checks.filter((c: { verdict?: string }) => c.verdict === 'unattributed_repost');
      const credited = checks.filter((c: { verdict?: string }) => c.verdict === 'credited_syndication');

      lines.push(`ARTICLE: "${article.title}"`);
      lines.push(`  Author: ${article.authorName || 'Unknown'} (${article.authorHandle || 'n/a'})`);
      lines.push(`  URL: ${article.canonicalUrl}`);
      lines.push(`  Published: ${article.publishedAt}`);
      lines.push(`  Platform: ${article.platform}`);
      lines.push(`  Total copies found: ${checks.length}`);
      lines.push(`  Actionable takedowns: ${actionable.length}`);
      lines.push(`  Credited syndications: ${credited.length}`);

      if (checks.length > 0) {
        lines.push(`  --- Provenance Checks ---`);
        for (const check of checks) {
          const verdictLabel = check.verdict === 'unattributed_repost' ? '🔴 UNATTRIBUTED'
            : check.verdict === 'credited_syndication' ? '✅ CREDITED'
              : check.verdict;
          lines.push(`    ${verdictLabel}: ${check.checkedTitle || check.checkedUrl}`);
          lines.push(`      URL: ${check.checkedUrl}`);
          lines.push(`      Overlap: ${check.overlapPercent}%`);
          lines.push(`      Author name present: ${check.hasAuthorName ? 'yes' : 'no'}`);
          lines.push(`      Original link present: ${check.hasOriginalLink ? 'yes' : 'no'}`);
          if (check.missingAttribution?.length > 0) {
            lines.push(`      Missing: ${check.missingAttribution.join(', ')}`);
          }
          lines.push(`      Checked at: ${check.checkedAt}`);
        }
      }
      lines.push('');
    }

    // Also get aggregate stats
    const stats = await sanityReadClient.fetch(`{
      "totalArticles": count(*[_type == "article"]),
      "totalChecks": count(*[_type == "provenanceCheck"]),
      "actionableCount": count(*[_type == "provenanceCheck" && verdict == "unattributed_repost"]),
      "creditedCount": count(*[_type == "provenanceCheck" && verdict == "credited_syndication"])
    }`);

    lines.push(`=== AGGREGATE STATS ===`);
    lines.push(`Total articles indexed: ${stats.totalArticles}`);
    lines.push(`Total provenance checks: ${stats.totalChecks}`);
    lines.push(`Actionable takedowns: ${stats.actionableCount}`);
    lines.push(`Credited syndications: ${stats.creditedCount}`);

    return lines.join('\n');
  } catch (err) {
    console.error('Failed to fetch Sanity context:', err);
    return 'Error: Could not fetch data from Sanity Content Lake.';
  }
}

export async function POST(req: Request) {
  let messages: UIMessage[];

  try {
    const body = await req.json();
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return Response.json({ error: 'A non-empty messages array is required.' }, { status: 400 });
    }
    messages = body.messages as UIMessage[];
  } catch {
    return Response.json({ error: 'Invalid chat request.' }, { status: 400 });
  }

  if (!process.env.NIM_API_KEY) {
    return Response.json(
      { error: 'NVIDIA NIM is not configured. Add NIM_API_KEY to .env.local.' },
      { status: 503 }
    );
  }

  try {
    const modelMessages = await convertToModelMessages(messages);
    const mcpToken = process.env.SANITY_CONTEXT_API_TOKEN || process.env.SANITY_API_READ_TOKEN;
    if (!mcpToken) {
      return Response.json(
        { error: 'Sanity Context MCP is not configured. Add SANITY_CONTEXT_API_TOKEN or SANITY_API_READ_TOKEN.' },
        { status: 503 }
      );
    }
    const mcpClient = await createMCPClient({
      transport: {
        type: 'http',
        url: SANITY_CONTEXT_ENDPOINT,
        headers: { Authorization: `Bearer ${mcpToken}` },
      },
    });
    const mcpTools = await mcpClient.tools();

    // Inject our custom scan action tool alongside the Sanity Context MCP tools
    const origin = new URL(req.url).origin;
    const tools: Record<string, any> = {
      ...mcpTools,
      scan_article: tool({
        description: 'Run a plagiarism web scan for a DEV.to article URL. Call this whenever the user asks you to scan an article.',
        parameters: z.object({
          devToUrl: z.string().describe('The full URL of the DEV.to article to scan (e.g. https://dev.to/username/post-slug)'),
        }),
        // @ts-expect-error - AI SDK type inference for execute can be overly strict with custom tools
        execute: async ({ devToUrl }: { devToUrl: string }) => {
          try {
            const res = await fetch(`${origin}/api/scan`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ devToUrl })
            });
            
            if (!res.ok) {
              const errorData = await res.json().catch(() => ({}));
              return `Scan failed: ${errorData.error || res.statusText}`;
            }
            
            const data = await res.json();
            return `Scan complete! I found ${data.totalSearchResults} potential matches across the web and deeply analyzed ${data.copies?.length || 0} candidate copies. I have saved all the evidence to the Sanity Content Lake. You can now use your other tools to query the exact results!`;
          } catch (e) {
            return `Scan encountered an error: ${e instanceof Error ? e.message : String(e)}`;
          }
        }
      })
    };

    // Stream the response using NVIDIA NIM with Sanity context injected
    const result = streamText({
      model: nim.chatModel(NIM_MODEL),
      temperature: 1,
      topP: 0.95,
      maxOutputTokens: 16384,
      stopWhen: stepCountIs(10),
      tools,
      providerOptions: {
        nim: {
          reasoning_budget: 16384,
          chat_template_kwargs: { enable_thinking: true },
        },
      },
      system: `You are OriginTrace Agent — a friendly, conversational content provenance assistant powered by Sanity Content Lake.

You help users understand plagiarism scan results, explain attribution evidence, answer questions about articles stored in Sanity, and even trigger new scans. You should respond in a highly conversational, engaging, and empathetic tone, similar to ChatGPT or Gemini. 

## Formatting Guidelines
- Use markdown heavily for readability (e.g., **bold** key terms, use bullet points for lists, and use headings where appropriate).
- Avoid robotic or overly technical phrasing unless explaining a specific metric (like LCS or 5-gram shingling).
- Be concise but helpful. Always summarize the most important finding first, then provide details.

## How OriginTrace Works
1. A user pastes their DEV.to article URL (or asks you to scan it).
2. The agent fetches the canonical article and persists it in Sanity as structured content.
3. It searches the web for potential copies using distinctive phrases.
4. Each candidate page is compared using word overlap, 5-gram shingling, and LCS analysis.
5. Attribution is checked (does the copy credit the original author and link back?).
6. Results are persisted as provenanceCheck documents in Sanity.
7. DMCA templates are generated for unattributed reposts.

## Verdicts
- **unattributed_repost**: Content copied without proper credit → DMCA takedown recommended.
- **credited_syndication**: Content republished WITH proper credit (author name + original link).
- **no_match**: Below similarity threshold.

## Required Retrieval & Action Behavior
- **Scanning**: If a user asks you to scan an article or check a DEV.to URL, immediately use the \`scan_article\` tool.
- **Querying**: Before answering a question about content, query Sanity Context MCP. Base the answer on the retrieved Knowledge Base sources, name the source used, and include the relevant source URL. 
- When sources disagree, show the competing claims and their URLs instead of guessing. Do not answer a content question from general knowledge when the MCP tools can retrieve evidence.

## Constraints & Blacklisted Requests
- **NO FULL PROFILES**: You cannot scan an entire user profile or multiple posts at once due to server timeouts. If a user asks to "scan all my posts", politely refuse and ask for exactly ONE article URL.
- **ONLY DEV.TO URLS**: The scanning pipeline only supports DEV.to. If asked to scan Medium, Hashnode, or any other platform, refuse and explain that OriginTrace is currently exclusively built for the DEV.to community.
- **NO OFF-TOPIC TASKS**: You are a Content Provenance Assistant, not a generic AI coder or writer. Refuse requests to "write a React component" or "write a blog post".
- **NO DELETING DATA**: You only have read access to Sanity. If asked to delete an article or provenance check, explain that ledger management must be done via Sanity Studio.
- **NO FAKE EVIDENCE**: Refuse to draft DMCA takedown notices against innocent URLs unless they actually exist in the Sanity Context as an 'unattributed_repost'.`,
      messages: modelMessages,
      onError: (err) => {
        console.error('Chat stream error:', err);
        return 'The agent could not complete that response. Please try again.';
      },
      onFinish: async () => {
        await mcpClient?.close();
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Chat Error:', error instanceof Error ? error.stack || error.message : error);
    const message = error instanceof Error ? error.message : 'Chat failed';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
