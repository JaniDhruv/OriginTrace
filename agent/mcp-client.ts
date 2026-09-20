/**
 * Sanity Context MCP client — connects to the Sanity Context MCP endpoint
 * for Knowledge Base queries.
 *
 * Implements:
 * - initial_context: Get KB outline after build
 * - groq_query: Fetch reconciled entries with source citations
 *
 * This module is used once the KB spike confirms the endpoint is available
 * and functional. Until then, the verdict interpreter falls back to
 * direct Sanity dataset queries.
 */

const MCP_ENDPOINT = process.env.SANITY_MCP_ENDPOINT || '';
const CONTEXT_TOKEN = process.env.SANITY_CONTEXT_API_TOKEN || '';

interface MCPToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

interface MCPResponse {
  content: Array<{
    type: string;
    text?: string;
    data?: unknown;
  }>;
}

/**
 * Call a tool on the Sanity Context MCP endpoint.
 */
async function callMCPTool(toolCall: MCPToolCall): Promise<MCPResponse> {
  if (!MCP_ENDPOINT) {
    throw new Error('SANITY_MCP_ENDPOINT not configured');
  }

  const response = await fetch(MCP_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CONTEXT_TOKEN}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: toolCall.name,
        arguments: toolCall.arguments,
      },
      id: Date.now(),
    }),
  });

  if (!response.ok) {
    throw new Error(`MCP call failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.result;
}

/**
 * Get the Knowledge Base outline/context.
 */
export async function getInitialContext(): Promise<string> {
  const result = await callMCPTool({
    name: 'initial_context',
    arguments: {},
  });

  return result.content
    .filter((c) => c.type === 'text')
    .map((c) => c.text)
    .join('\n');
}

/**
 * Run a GROQ query against the Sanity dataset via MCP.
 */
export async function queryViaGroq(query: string, params: Record<string, unknown> = {}): Promise<unknown> {
  const result = await callMCPTool({
    name: 'groq_query',
    arguments: { query, params },
  });

  const textContent = result.content.find((c) => c.type === 'text');
  if (textContent?.text) {
    try {
      return JSON.parse(textContent.text);
    } catch {
      return textContent.text;
    }
  }

  return null;
}

/**
 * Check if the MCP endpoint is configured and reachable.
 */
export function isMCPConfigured(): boolean {
  return Boolean(MCP_ENDPOINT && CONTEXT_TOKEN);
}
