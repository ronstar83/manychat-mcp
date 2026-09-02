# ManyChat MCP Server

An MCP (Model Context Protocol) server for the ManyChat API. Manage subscribers, tags, custom fields, flows, and messaging directly from any MCP-compatible AI client.

## Features

- **Page Operations**: Read page info, list tags, flows, custom fields, bot fields. Create and delete tags, create and set custom/bot fields.
- **Subscriber Management**: Get subscriber data (by ID, name, custom field, system field, or Messenger `user_ref`), update profile fields, verify signed requests, add/remove tags, set custom fields, create subscribers.
- **Messaging**: Send flows, plain text, or full rich content — images, video, audio, files, card galleries, buttons, quick replies, and tag/field actions — to subscribers or to pre-subscriber Messenger `user_ref`s, across Instagram, Messenger, and WhatsApp.

## Prerequisites

- Node.js >= 20
- A ManyChat API Token. You can generate one at [manychat.com → Settings → API](https://help.manychat.com/hc/en-us/articles/14959510331420).

## Configuration (Environment Variables)

| Variable | Required | Description |
|---|---|---|
| `MANYCHAT_API_TOKEN` | Yes | Your ManyChat API token. |
| `PORT` | No | Port for HTTP transport (default: `3000`). |
| `MANYCHAT_WHATSAPP_REPLY_FIELD_ID` | For WhatsApp sending | Numeric ID of the custom field that holds the reply text. Find it via `manychat_list_custom_fields`. |
| `MANYCHAT_WHATSAPP_REPLY_FLOW_NS` | For WhatsApp sending | Namespace of the flow that sends that field's content to the subscriber. Find it via `manychat_list_flows`. |

ManyChat's API rejects direct `sendContent` calls for WhatsApp subscribers. As a workaround, `manychat_send_content` with `channel: "whatsapp"` writes the text into the configured custom field and then triggers the configured flow. If these two variables are not set, WhatsApp sends fail with a clear error message. Copy `.env.example` to `.env` and fill in your account-specific values.

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
- `manychat_find_subscriber_by_system_field`: Search for a subscriber by system-level email or phone.
- `manychat_get_subscriber_by_user_ref`: Get subscriber info via a Messenger `user_ref` (pre-subscriber lookup).
- `manychat_create_subscriber`: Create a new subscriber (requires phone or email).
- `manychat_update_subscriber`: Update name/phone/email/gender on an existing subscriber.
- `manychat_verify_signed_request`: Verify a Messenger Extensions `signed_request` for a subscriber.
- `manychat_add_tag`: Add a tag to a subscriber by tag ID or name.
- `manychat_remove_tag`: Remove a tag from a subscriber by tag ID or name.
- `manychat_set_custom_field`: Set a custom field for a subscriber by field ID or name.
- `manychat_set_custom_fields`: Set multiple custom fields for a subscriber.

### Sending Tools
- `manychat_send_flow`: Send a flow to a subscriber using the flow namespace.
- `manychat_send_content`: Send a direct text message to a subscriber (supports Instagram, Messenger, WhatsApp; includes the WhatsApp custom-field workaround below).
- `manychat_send_rich_content`: Send full Dynamic Block content to a subscriber — any mix of text, image, video, audio, file, and card-gallery blocks, plus buttons (call/url/node/flow/buy/dynamic_block_callback), up to 11 quick replies, and up to 5 tag/field actions. Card galleries and node/flow/buy/dynamic_block_callback buttons are Messenger/Instagram only.
- `manychat_send_content_by_user_ref`: Same rich-content payload as above, addressed by Messenger `user_ref` instead of `subscriber_id`, for people who haven't triggered a flow yet (Checkbox Plugin / Customer Chat).

## Known Limitations

ManyChat's public API has no endpoints for these — no MCP server, official or community, can do them until ManyChat ships the endpoints:
- Creating, scheduling, or sending Broadcasts
- Listing or sending WhatsApp message Templates
- Reading or writing Flow content/structure (only triggering an existing flow by namespace is possible)
- Fetching Broadcast/Flow analytics or delivery metrics
- Creating Growth Tools (read-only via `manychat_list_growth_tools`)

See [this community request](https://community.manychat.com/ideas/manychat-api-for-the-ai-agent-era-broadcast-templates-metrics-flow-management-9298) for the case for adding them. Everything else the REST API exposes — including the less-documented `findBySystemField`, `updateSubscriber`, `*ByUserRef`, `verifyBySignedRequest`, and the full Dynamic Block content schema — is wired up in this server.

## License

MIT
