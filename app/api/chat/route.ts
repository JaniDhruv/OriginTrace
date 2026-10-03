import { createMCPClient } from '@ai-sdk/mcp';
import { streamText } from 'ai';
import { google } from '@ai-sdk/google';
import { EventSource } from 'eventsource';

export const maxDuration = 60;

// Add EventSource to global so the SSE client can use it in Node.js
if (!global.EventSource) {
  (global as any).EventSource = EventSource;
}

export async function POST(req: Request) {
  const { messages } = await req.json();

  const token = process.env.SANITY_API_READ_TOKEN;
  if (!token) {
    return new Response('SANITY_API_READ_TOKEN is missing in env', { status: 500 });
  }

  // The endpoint URL from the Sanity Context dashboard
  const endpointUrl = 'https://api.sanity.io/v1/context/organizations/os697e03r/mcp/origintrace-ledger';

  // 1. Connect the MCP Client via Server-Sent Events (SSE)
  const mcpClient = await createMCPClient({
    transport: {
      type: 'sse',
      url: endpointUrl,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  try {
    // 2. Fetch the tools dynamically from the Sanity Context MCP endpoint
    const tools = await mcpClient.tools();

    // 3. Stream the response from Gemini using the MCP tools
    const result = streamText({
      model: google('gemini-1.5-pro'),
      messages,
      tools,
      maxToolRoundtrips: 10,
    });

    // The stream will keep resolving tool calls until the agent answers the question
    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error('MCP Chat Error:', error);
    return new Response(error.message, { status: 500 });
  }
}
