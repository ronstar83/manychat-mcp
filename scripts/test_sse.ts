// Smoke test for the SSE transport: connects to a running server and lists tools.
// Usage:
//   npx tsx scripts/test_sse.ts [url]
//   MCP_SSE_URL=http://myhost:3000/sse npx tsx scripts/test_sse.ts
// Default: http://localhost:3000/sse
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

async function main() {
  const url = process.argv[2] || process.env.MCP_SSE_URL || "http://localhost:3000/sse";
  const transport = new SSEClientTransport(new URL(url));
  const client = new Client({ name: "test", version: "1" }, { capabilities: {} });

  try {
    await client.connect(transport);
    console.log(`Connected to ${url}!`);
    const tools = await client.listTools();
    console.log(JSON.stringify(tools, null, 2));
  } catch (e) {
    console.error("Error connecting:", e);
    process.exitCode = 1;
  } finally {
    process.exit();
  }
}

main();
