import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { manychat } from "../api/manychat.js";

function formatResponse(data: any) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }]
  };
}

function handleError(error: any) {
  return {
    isError: true,
    content: [{ type: "text" as const, text: error.message || String(error) }]
  };
}

export function registerSubscriberTools(server: McpServer) {
  server.tool("manychat_get_subscriber",
    "Get subscriber data by ID (all fields, tags, custom fields)",
    {
      subscriber_id: z.number().int().positive()
        .describe("ManyChat Subscriber ID. Use manychat_find_subscribers_by_name to look up IDs.")
    },
    async ({ subscriber_id }) => {
      try {
        const response = await manychat.get("/fb/subscriber/getInfo", { subscriber_id });
        return formatResponse(response);
      } catch (error) {
        return handleError(error);
      }
    }
  );

  server.tool("manychat_find_subscribers_by_name",
    "Search for a subscriber by name",
    {
      name: z.string().describe("Exact or partial name of the subscriber")
    },
    async ({ name }) => {
      try {
        const response = await manychat.get("/fb/subscriber/findByName", { name });
        return formatResponse(response);
      } catch (error) {
        return handleError(error);
      }
    }
  );

  server.tool("manychat_find_subscribers_by_field",
    "Search for a subscriber by a Custom Field value (only text/number types)",
    {
      field_id: z.number().int().describe("Custom Field ID"),
      field_value: z.union([z.string(), z.number()]).describe("Value to search for")
    },
    async ({ field_id, field_value }) => {
      try {
        const response = await manychat.get("/fb/subscriber/findByCustomField", { field_id, field_value });
        return formatResponse(response);
      } catch (error) {
        return handleError(error);
      }
    }
  );

  server.tool("manychat_create_subscriber",
    "Create a new subscriber (phone or email required)",
    {
      phone: z.string().optional(),
      email: z.string().email().optional(),
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      gender: z.enum(["male", "female"]).optional(),
      has_opt_in_sms: z.boolean().default(false),
      has_opt_in_email: z.boolean().default(false),
      consent_phrase: z.string().optional()
        .describe("Required when has_opt_in_sms or has_opt_in_email is true")
    },
    async (params) => {
      try {
        if (!params.phone && !params.email) {
          throw new Error("Either phone or email must be provided");
        }
        if ((params.has_opt_in_sms || params.has_opt_in_email) && !params.consent_phrase) {
          throw new Error("consent_phrase is required when opting in to SMS or Email");
        }
        const response = await manychat.post("/fb/subscriber/createSubscriber", params);
        return formatResponse(response);
      } catch (error) {
        return handleError(error);
      }
    }
  );

  server.tool("manychat_add_tag",
    "Add a tag to a subscriber (by tag ID or Name)",
    {
      subscriber_id: z.number().int().positive(),
      tag_id: z.number().int().positive().optional()
        .describe("Tag ID. Use manychat_list_tags to find IDs."),
      tag_name: z.string().optional()
        .describe("Tag name (alternative to tag_id, case-sensitive)")
    },
    async ({ subscriber_id, tag_id, tag_name }) => {
      try {
        if (!tag_id && !tag_name) {
          throw new Error("Either tag_id or tag_name must be provided");
        }
        let response;
        if (tag_id) {
          response = await manychat.post("/fb/subscriber/addTag", { subscriber_id, tag_id });
        } else {
          response = await manychat.post("/fb/subscriber/addTagByName", { subscriber_id, tag_name });
        }
        return formatResponse(response);
      } catch (error) {
        return handleError(error);
      }
    }
  );

  server.tool("manychat_remove_tag",
    "Remove a tag from a subscriber (by tag ID or Name)",
    {
      subscriber_id: z.number().int().positive(),
      tag_id: z.number().int().positive().optional()
        .describe("Tag ID"),
      tag_name: z.string().optional()
        .describe("Tag name")
    },
    async ({ subscriber_id, tag_id, tag_name }) => {
      try {
        if (!tag_id && !tag_name) {
          throw new Error("Either tag_id or tag_name must be provided");
        }
        let response;
        if (tag_id) {
          response = await manychat.post("/fb/subscriber/removeTag", { subscriber_id, tag_id });
        } else {
          response = await manychat.post("/fb/subscriber/removeTagByName", { subscriber_id, tag_name });
        }
        return formatResponse(response);
      } catch (error) {
        return handleError(error);
      }
    }
  );

  server.tool("manychat_set_custom_field",
    "Set a Custom Field for a subscriber (by field ID or Name)",
    {
      subscriber_id: z.number().int().positive(),
      field_id: z.number().int().optional()
        .describe("Field ID. Use manychat_list_custom_fields to find IDs."),
      field_name: z.string().optional()
        .describe("Field name (alternative to field_id)"),
      field_value: z.union([z.string(), z.number(), z.null(), z.array(z.any())])
        .describe("Value to set. String, Number, null to clear, or Array for array-type fields.")
    },
    async ({ subscriber_id, field_id, field_name, field_value }) => {
      try {
        if (!field_id && !field_name) {
          throw new Error("Either field_id or field_name must be provided");
        }
        let response;
        if (field_id) {
          response = await manychat.post("/fb/subscriber/setCustomField", { subscriber_id, field_id, field_value });
        } else {
          response = await manychat.post("/fb/subscriber/setCustomFieldByName", { subscriber_id, field_name, field_value });
        }
        return formatResponse(response);
      } catch (error) {
        return handleError(error);
      }
    }
  );

  server.tool("manychat_set_custom_fields",
    "Set multiple Custom Fields for a subscriber at once",
    {
      subscriber_id: z.number().int().positive(),
      fields: z.array(z.object({
        field_id: z.number().int().optional(),
        field_name: z.string().optional(),
        field_value: z.union([z.string(), z.number(), z.null(), z.array(z.any())])
      })).min(1).describe("List of fields to set")
    },
    async ({ subscriber_id, fields }) => {
      try {
        const response = await manychat.post("/fb/subscriber/setCustomFields", { subscriber_id, fields });
        return formatResponse(response);
      } catch (error) {
        return handleError(error);
      }
    }
  );
}
