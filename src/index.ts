import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { registerPageTools } from "./tools/page.js";
import { registerSubscriberTools } from "./tools/subscriber.js";
import { registerSendingTools } from "./tools/sending.js";

const token = process.env.MANYCHAT_API_TOKEN;
if (!token) {
  console.error("ERROR: MANYCHAT_API_TOKEN environment variable is required.");
  console.error("Get your token at: https://manychat.com → Settings → API");
  process.exit(1);
}

const server = new McpServer({
  name: "manychat-mcp-server",
  version: "1.0.0",
  description: "MCP server for ManyChat — manage subscribers, tags, custom fields, flows and messaging"
});

registerPageTools(server);
registerSubscriberTools(server);
registerSendingTools(server);

const useHttp = process.argv.includes("--transport") &&
  process.argv[process.argv.indexOf("--transport") + 1] === "http";

if (useHttp) {
  const app = express();
  app.use(express.json());

  // Using sessionIdGenerator: undefined to make it stateless
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined
  });

  app.all("/sse", async (req, res) => {
    try {
      await transport.handleRequest(req, res, req.body);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.get("/health", (_, res) => res.json({
    status: "ok",
    server: "manychat-mcp-server",
    version: "1.0.0"
  }));

  const connectServer = async () => {
    await server.connect(transport);
  };
  connectServer().catch(console.error);

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, () => {
    console.error(`ManyChat MCP Server (HTTP) running on port ${PORT}`);
  });
} else {
  const transport = new StdioServerTransport();
  server.connect(transport).catch(console.error);
  console.error("ManyChat MCP Server (stdio) started");
}
