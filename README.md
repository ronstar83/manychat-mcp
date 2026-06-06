# ManyChat MCP Server

An MCP (Model Context Protocol) server for the ManyChat API. Manage subscribers, tags, custom fields, flows, and messaging directly from any MCP-compatible AI client.

## Features

- **Page Operations**: Read page info, list tags, flows, custom fields, bot fields. Create and delete tags, create and set custom/bot fields.
- **Subscriber Management**: Get subscriber data, find by name or custom field, add/remove tags, set custom fields, create subscribers.
- **Messaging**: Send flows or simple content messages to subscribers across Instagram, Messenger, and WhatsApp.

## Prerequisites

- Node.js >= 20
- A ManyChat API Token. You can generate one at [manychat.com → Settings → API](https://help.manychat.com/hc/en-us/articles/14959510331420).

## Installation

### 1. Claude Desktop (stdio via npx)

Add this configuration to your Claude Desktop config file (usually `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "manychat": {
      "command": "npx",
      "args": ["-y", "manychat-mcp-server"],
      "env": {
        "MANYCHAT_API_TOKEN": "your-manychat-api-token-here"
      }
    }
  }
}
```

### 2. Remote HTTP Server (Docker)

You can run the server in HTTP mode to expose it over the network (e.g., using Docker Compose with Traefik).

```bash
MANYCHAT_API_TOKEN=your_token_here docker-compose up -d
```
Then configure your remote MCP client to connect via HTTP to your deployment URL.

### 3. Other MCP Clients (Node.js)

```bash
npx manychat-mcp-server
# or for http transport
npx manychat-mcp-server --transport http
```

## Available Tools

### Page Tools
- `manychat_get_page_info`: Get account status, page name, and connected channels.
- `manychat_list_tags`: List all tags with IDs and names.
- `manychat_list_flows`: List all automation flows.
- `manychat_list_growth_tools`: List all growth tools.
- `manychat_list_custom_fields`: List all custom user fields.
- `manychat_list_bot_fields`: List all bot fields (global variables).
- `manychat_list_otn_topics`: List all OTN (One-Time Notification) topics.
- `manychat_create_tag`: Create a new tag.
- `manychat_delete_tag`: Delete a tag by ID or name.
- `manychat_create_custom_field`: Create a new custom user field.
- `manychat_create_bot_field`: Create a new bot field.
- `manychat_set_bot_field`: Set a bot field value by ID or name.
- `manychat_set_bot_fields`: Set multiple bot field values at once.

### Subscriber Tools
- `manychat_get_subscriber`: Get subscriber data by ID.
- `manychat_find_subscribers_by_name`: Search for a subscriber by name.
- `manychat_find_subscribers_by_field`: Search for a subscriber by a text/number custom field value.
- `manychat_create_subscriber`: Create a new subscriber (requires phone or email).
- `manychat_add_tag`: Add a tag to a subscriber by tag ID or name.
- `manychat_remove_tag`: Remove a tag from a subscriber by tag ID or name.
- `manychat_set_custom_field`: Set a custom field for a subscriber by field ID or name.
- `manychat_set_custom_fields`: Set multiple custom fields for a subscriber.

### Sending Tools
- `manychat_send_flow`: Send a flow to a subscriber using the flow namespace.
- `manychat_send_content`: Send a direct text message to a subscriber (supports Instagram, Messenger, WhatsApp).

## Known Limitations

The following ManyChat features are **not available via their API** and thus cannot be used through this MCP server:
- Creating or sending Broadcasts
- Creating or editing Flow content
- Fetching Analytics & Metrics
- Managing Templates
- Creating Growth Tools

*Source: ManyChat official Swagger API documentation.*

## License

MIT
