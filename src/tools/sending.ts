import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { manychat } from "../api/manychat.js";
import { formatResponse, handleError } from "../utils/response.js";
import {
  messageSchema,
  quickReplySchema,
  actionSchema,
  messageTagSchema,
  buildContentPayload
} from "../schemas/content.js";

export function registerSendingTools(server: McpServer) {
  server.tool("manychat_send_flow",
    "Send a Flow to a subscriber",
    {
      subscriber_id: z.number().int().positive(),
      flow_ns: z.string()
        .describe("Flow namespace ID. Use manychat_list_flows to find flow_ns values."),
      message_tag: messageTagSchema.optional()
        .describe("Required for Messenger. Not needed for Instagram/WhatsApp.")
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
      message_tag: messageTagSchema.optional()
    },
    async ({ subscriber_id, text, channel, message_tag }) => {
      try {
        // ManyChat's /fb/sending/sendContent rejects WhatsApp subscribers in this account
        // with code 3011 (message-tag/window handling). For WhatsApp, use the proven
        // account pattern: write the reply to the existing custom field "Antwort von GPT"
        // and trigger the existing ManyChat flow that sends that field to the subscriber.
        if (channel === "whatsapp") {
          const fieldIdRaw = process.env.MANYCHAT_WHATSAPP_REPLY_FIELD_ID;
          const flowNs = process.env.MANYCHAT_WHATSAPP_REPLY_FLOW_NS;
          if (!fieldIdRaw) {
            throw new Error("MANYCHAT_WHATSAPP_REPLY_FIELD_ID not configured — set it in your .env");
          }
          if (!flowNs) {
            throw new Error("MANYCHAT_WHATSAPP_REPLY_FLOW_NS not configured — set it in your .env");
          }
          const fieldId = Number(fieldIdRaw);
          if (!Number.isFinite(fieldId)) {
            throw new Error("MANYCHAT_WHATSAPP_REPLY_FIELD_ID must be a numeric custom field ID — check your .env");
          }
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

  server.tool("manychat_send_rich_content",
    "Send rich content to a subscriber: images, video, audio, files, card galleries, buttons, quick replies, and field/tag actions. " +
    "Messenger and Instagram support every block and button type. WhatsApp sessions only support text/image/video/audio/file — " +
    "node/flow/buy/dynamic_block_callback buttons and card galleries are Messenger/Instagram only and will be rejected by ManyChat for WhatsApp subscribers.",
    {
      subscriber_id: z.number().int().positive(),
      messages: z.array(messageSchema).min(1).max(10)
        .describe("Up to 10 message blocks, sent in order"),
      quick_replies: z.array(quickReplySchema).max(11).optional()
        .describe("Up to 11 quick-reply buttons shown below the last message"),
      actions: z.array(actionSchema).max(5).optional()
        .describe("Up to 5 tag/field actions to run after the messages are sent"),
      message_tag: messageTagSchema.optional()
        .describe("Required for Messenger sends outside the 24h window. Not needed for Instagram/WhatsApp.")
    },
    async ({ subscriber_id, messages, quick_replies, actions, message_tag }) => {
      try {
        const payload: any = {
          subscriber_id,
          data: buildContentPayload(messages, quick_replies, actions)
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

  server.tool("manychat_send_content_by_user_ref",
    "Send rich content using a Messenger user_ref (from the Checkbox Plugin or Customer Chat widget) " +
    "for a person who has messaged your page but doesn't have a subscriber_id yet.",
    {
      user_ref: z.number().int().positive()
        .describe("Messenger user_ref, valid for 24h after the user's action"),
      messages: z.array(messageSchema).min(1).max(10),
      quick_replies: z.array(quickReplySchema).max(11).optional(),
      actions: z.array(actionSchema).max(5).optional()
    },
    async ({ user_ref, messages, quick_replies, actions }) => {
      try {
        const response = await manychat.post("/fb/sending/sendContentByUserRef", {
          user_ref,
          data: buildContentPayload(messages, quick_replies, actions)
        });
        return formatResponse(response);
      } catch (error) {
        return handleError(error);
      }
    }
  );
}
