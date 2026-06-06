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

export function registerPageTools(server: McpServer) {
  server.tool("manychat_get_page_info",
    "Get Account status, Page name, and connected channels",
    async () => {
      try {
        const response = await manychat.get("/fb/page/getInfo");
        return formatResponse(response);
      } catch (error) {
        return handleError(error);
      }
    }
  );

  server.tool("manychat_list_tags",
    "List all tags with IDs and names",
    async () => {
      try {
        const response = await manychat.get("/fb/page/getTags");
        return formatResponse(response);
      } catch (error) {
        return handleError(error);
      }
    }
  );

  server.tool("manychat_list_flows",
    "List all automation flows",
    async () => {
      try {
        const response = await manychat.get("/fb/page/getFlows");
        return formatResponse(response);
      } catch (error) {
        return handleError(error);
      }
    }
  );

  server.tool("manychat_list_growth_tools",
    "List all Growth Tools",
    async () => {
      try {
        const response = await manychat.get("/fb/page/getGrowthTools");
        return formatResponse(response);
      } catch (error) {
        return handleError(error);
      }
    }
  );

  server.tool("manychat_list_custom_fields",
    "List all Custom User Fields",
    async () => {
      try {
        const response = await manychat.get("/fb/page/getCustomFields");
        return formatResponse(response);
      } catch (error) {
        return handleError(error);
      }
    }
  );

  server.tool("manychat_list_bot_fields",
    "List all Bot Fields (global variables)",
    async () => {
      try {
        const response = await manychat.get("/fb/page/getBotFields");
        return formatResponse(response);
      } catch (error) {
        return handleError(error);
      }
    }
  );

  server.tool("manychat_list_otn_topics",
    "List all OTN (One-Time Notification) topics",
    async () => {
      try {
        const response = await manychat.get("/fb/page/getOtnTopics");
        return formatResponse(response);
      } catch (error) {
        return handleError(error);
      }
    }
  );

  server.tool("manychat_create_tag",
    "Create a new tag",
    {
      name: z.string().describe("Name of the new tag")
    },
    async ({ name }) => {
      try {
        const response = await manychat.post("/fb/page/createTag", { name });
        return formatResponse(response);
      } catch (error) {
        return handleError(error);
      }
    }
  );

  server.tool("manychat_delete_tag",
    "Delete a tag by ID or name",
    {
      tag_id: z.number().int().positive().optional().describe("Tag ID"),
      tag_name: z.string().optional().describe("Tag name")
    },
    async ({ tag_id, tag_name }) => {
      try {
        if (!tag_id && !tag_name) {
          throw new Error("Either tag_id or tag_name must be provided");
        }
        let response;
        if (tag_id) {
          response = await manychat.post("/fb/page/removeTag", { tag_id });
        } else {
          response = await manychat.post("/fb/page/removeTagByName", { tag_name });
        }
        return formatResponse(response);
      } catch (error) {
        return handleError(error);
      }
    }
  );

  server.tool("manychat_create_custom_field",
    "Create a new Custom User Field",
    {
      caption: z.string().describe("Field name"),
      type: z.enum(["text", "number", "date", "datetime", "boolean", "array"]).describe("Field type"),
      description: z.string().optional().describe("Field description")
    },
    async ({ caption, type, description }) => {
      try {
        const response = await manychat.post("/fb/page/createCustomField", { caption, type, description });
        return formatResponse(response);
      } catch (error) {
        return handleError(error);
      }
    }
  );

  server.tool("manychat_create_bot_field",
    "Create a new Bot Field",
    {
      name: z.string().describe("Bot Field name"),
      type: z.enum(["text", "number", "date", "datetime", "boolean", "array"]).describe("Field type"),
      description: z.string().optional().describe("Field description"),
      value: z.union([z.string(), z.number(), z.boolean(), z.array(z.any()), z.null()]).optional().describe("Initial value")
    },
    async ({ name, type, description, value }) => {
      try {
        const response = await manychat.post("/fb/page/createBotField", { name, type, description, value });
        return formatResponse(response);
      } catch (error) {
        return handleError(error);
      }
    }
  );

  server.tool("manychat_set_bot_field",
    "Set a Bot Field value by ID or Name",
    {
      field_id: z.number().int().optional().describe("Bot Field ID"),
      field_name: z.string().optional().describe("Bot Field name"),
      field_value: z.union([z.string(), z.number(), z.boolean(), z.array(z.any()), z.null()]).describe("Value to set")
    },
    async ({ field_id, field_name, field_value }) => {
      try {
        if (!field_id && !field_name) {
          throw new Error("Either field_id or field_name must be provided");
        }
        let response;
        if (field_id) {
          response = await manychat.post("/fb/page/setBotField", { field_id, field_value });
        } else {
          response = await manychat.post("/fb/page/setBotFieldByName", { field_name, field_value });
        }
        return formatResponse(response);
      } catch (error) {
        return handleError(error);
      }
    }
  );

  server.tool("manychat_set_bot_fields",
    "Set multiple Bot Field values at once",
    {
      fields: z.array(z.object({
        field_id: z.number().int().optional(),
        field_name: z.string().optional(),
        field_value: z.union([z.string(), z.number(), z.boolean(), z.array(z.any()), z.null()])
      })).min(1).describe("List of bot fields to set")
    },
    async ({ fields }) => {
      try {
        const response = await manychat.post("/fb/page/setBotFields", { fields });
        return formatResponse(response);
      } catch (error) {
        return handleError(error);
      }
    }
  );
}
