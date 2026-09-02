import { z } from "zod";

/**
 * Dynamic Block content schema (ManyChat's rich-message format), shared by
 * sendContent and sendContentByUserRef. Button/element caps (3 buttons,
 * 10 card elements, 11 quick replies, 5 actions) mirror Meta's Send API
 * template limits, not arbitrary choices.
 */

export const messageTagSchema = z.enum([
  "CONFIRMED_EVENT_UPDATE",
  "POST_PURCHASE_UPDATE",
  "ACCOUNT_UPDATE",
  "HUMAN_AGENT"
]);

const callButton = z.object({
  type: z.literal("call"),
  caption: z.string(),
  phone: z.string().describe("E.164 phone number to dial")
});

const urlButton = z.object({
  type: z.literal("url"),
  caption: z.string(),
  url: z.string().url(),
  webview_size: z.enum(["full", "medium", "compact"]).optional()
});

const nodeButton = z.object({
  type: z.literal("node"),
  caption: z.string(),
  target: z.string().describe("Target node ID inside the current flow")
});

const flowButton = z.object({
  type: z.literal("flow"),
  caption: z.string(),
  target: z.string().describe("Flow namespace (flow_ns) to launch")
});

const dynamicBlockCallbackButton = z.object({
  type: z.literal("dynamic_block_callback"),
  caption: z.string(),
  url: z.string().url().describe("HTTPS endpoint ManyChat calls to fetch the next block"),
  method: z.literal("post").default("post"),
  headers: z.record(z.string()).optional(),
  payload: z.record(z.any()).optional()
});

const buyButton = z.object({
  type: z.literal("buy"),
  caption: z.string(),
  customer: z.object({
    shipping_address: z.boolean().optional(),
    contact_name: z.boolean().optional(),
    contact_phone: z.boolean().optional(),
    contact_email: z.boolean().optional()
  }).optional(),
  product: z.object({
    label: z.string(),
    cost: z.number().int().nonnegative().describe("Cost in cents")
  }),
  success_target: z.string().describe("Node ID to jump to after successful payment")
});

export const buttonSchema = z.discriminatedUnion("type", [
  callButton,
  urlButton,
  nodeButton,
  flowButton,
  dynamicBlockCallbackButton,
  buyButton
]);

// Quick replies only support navigation/callback buttons, not call/url/buy.
export const quickReplySchema = z.discriminatedUnion("type", [
  nodeButton,
  flowButton,
  dynamicBlockCallbackButton
]);

const buttons = z.array(buttonSchema).max(3).optional();

const textMessage = z.object({
  type: z.literal("text"),
  text: z.string().max(2000),
  buttons
});

const imageMessage = z.object({
  type: z.literal("image"),
  url: z.string().url(),
  buttons
});

const videoMessage = z.object({
  type: z.literal("video"),
  url: z.string().url(),
  buttons
});

const audioMessage = z.object({
  type: z.literal("audio"),
  url: z.string().url(),
  buttons
});

const fileMessage = z.object({
  type: z.literal("file"),
  url: z.string().url()
});

const cardElement = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  image_url: z.string().url().optional(),
  action_url: z.string().url().optional().describe("Default action when the card itself is tapped"),
  buttons: z.array(buttonSchema).max(3).optional()
});

const cardsMessage = z.object({
  type: z.literal("cards"),
  elements: z.array(cardElement).min(1).max(10),
  image_aspect_ratio: z.enum(["horizontal", "square"]).optional()
});

export const messageSchema = z.discriminatedUnion("type", [
  textMessage,
  imageMessage,
  videoMessage,
  audioMessage,
  fileMessage,
  cardsMessage
]);

const addTagAction = z.object({
  action: z.literal("add_tag"),
  tag_name: z.string()
});

const removeTagAction = z.object({
  action: z.literal("remove_tag"),
  tag_name: z.string()
});

const setFieldValueAction = z.object({
  action: z.literal("set_field_value"),
  field_name: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()])
});

const unsetFieldValueAction = z.object({
  action: z.literal("unset_field_value"),
  field_name: z.string()
});

export const actionSchema = z.discriminatedUnion("action", [
  addTagAction,
  removeTagAction,
  setFieldValueAction,
  unsetFieldValueAction
]);

export function buildContentPayload(
  messages: z.infer<typeof messageSchema>[],
  quickReplies?: z.infer<typeof quickReplySchema>[],
  actions?: z.infer<typeof actionSchema>[]
) {
  const content: Record<string, unknown> = { messages };
  if (quickReplies?.length) {
    content.quick_replies = quickReplies;
  }
  if (actions?.length) {
    content.actions = actions;
  }
  return { version: "v2" as const, content };
}
