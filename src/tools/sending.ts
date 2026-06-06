import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { manychat } from "../api/manychat.js";

function formatResponse(data: any) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }]
  };
}

function handleError(error: any) {
  const details = error?.response?.data || error?.data || error?.cause || null;
  const text = details
    ? `${error.message || String(error)}\n${JSON.stringify(details, null, 2)}`
    : (error.message || String(error));
  return {
    isError: true,
    content: [{ type: "text" as const, text }]
  };
}

export function registerSendingTools(server: McpServer) {
  server.tool("manychat_send_flow",
    "Send a Flow to a subscriber",
    {
      subscriber_id: z.number().int().positive(),
      flow_ns: z.string()
        .describe("Flow namespace ID. Use manychat_list_flows to find flow_ns values."),
      message_tag: z.enum([
        "CONFIRMED_EVENT_UPDATE",
        "POST_PURCHASE_UPDATE",
        "ACCOUNT_UPDATE",
        "HUMAN_AGENT"
      ]).optional().describe("Required for Messenger. Not needed for Instagram/WhatsApp.")
    },
    async ({ subscriber_id, flow_ns, message_tag }) => {
      try {
        const payload: any = { subscriber_id, flow_ns };
        if (message_tag) {
          payload.message_tag = message_tag;
        }
        const response = await manychat.post("/fb/sending/sendFlow", payload);
        return formatResponse(response);
      } catch (error) {
        return handleError(error);
      }
    }
  );

  server.tool("manychat_send_content",
    "Send a direct text message to a subscriber",
    {
      subscriber_id: z.number().int().positive(),
      text: z.string().max(2000)
        .describe("Text message to send to the subscriber"),
      channel: z.enum(["instagram", "messenger", "whatsapp"]).default("instagram"),
      message_tag: z.enum([
        "CONFIRMED_EVENT_UPDATE",
        "POST_PURCHASE_UPDATE",
        "ACCOUNT_UPDATE",
        "HUMAN_AGENT"
      ]).optional()
    },
    async ({ subscriber_id, text, channel, message_tag }) => {
      try {
        // ManyChat's /fb/sending/sendContent rejects WhatsApp subscribers in this account
        // with code 3011 (message-tag/window handling). For WhatsApp, use the proven
        // account pattern: write the reply to the existing custom field "Antwort von GPT"
        // and trigger the existing ManyChat flow that sends that field to the subscriber.
        if (channel === "whatsapp") {
          const fieldId = Number(process.env.MANYCHAT_WHATSAPP_REPLY_FIELD_ID || 11251644);
          const flowNs = process.env.MANYCHAT_WHATSAPP_REPLY_FLOW_NS || "content20260604143026_726781";
          const setField = await manychat.post("/fb/subscriber/setCustomField", {
            subscriber_id,
            field_id: fieldId,
            field_value: text
          });
          const sendFlow = await manychat.post("/fb/sending/sendFlow", {
            subscriber_id,
            flow_ns: flowNs
          });
          return formatResponse({ status: "success", channel, setField, sendFlow, flow_ns: flowNs, field_id: fieldId });
        }

        const payload: any = {
          subscriber_id,
          data: {
            version: "v2",
            content: {
              messages: [
                {
                  type: "text",
                  text: text
                }
              ]
            }
          }
        };

        if (message_tag) {
          payload.message_tag = message_tag;
        }

        const response = await manychat.post("/fb/sending/sendContent", payload);
        return formatResponse(response);
      } catch (error) {
        return handleError(error);
      }
    }
  );
}
