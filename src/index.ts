#!/usr/bin/env node
/**
 * SyncPen MCP Server
 *
 * Connect Claude Code to your SyncPen documents as a knowledge base.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { getConfig } from "./config.js";
import { SyncPenClient } from "./client.js";
import { listFolders, listDocuments } from "./tools/list.js";
import { searchDocuments } from "./tools/search.js";
import { readDocument } from "./tools/read.js";
import { createDocument, updateDocument } from "./tools/write.js";

// Tool definitions
const TOOLS: Tool[] = [
  {
    name: "syncpen_search",
    description:
      "Search SyncPen documents by title. Use this to find documents about a specific topic.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query to match against document titles",
        },
        folderId: {
          type: "string",
          description: "Optional: Filter results to a specific folder",
        },
        limit: {
          type: "number",
          description: "Maximum number of results (default 20, max 50)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "syncpen_read",
    description:
      "Read a SyncPen document's content as markdown. Use the document ID from search or list results.",
    inputSchema: {
      type: "object",
      properties: {
        documentId: {
          type: "string",
          description: "The ID of the document to read",
        },
      },
      required: ["documentId"],
    },
  },
  {
    name: "syncpen_list_folders",
    description: "List all folders in your SyncPen account.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "syncpen_list_documents",
    description:
      "List documents in your SyncPen account, optionally filtered by folder.",
    inputSchema: {
      type: "object",
      properties: {
        folderId: {
          type: "string",
          description: "Optional: Filter to documents in a specific folder",
        },
        limit: {
          type: "number",
          description: "Maximum number of documents to return (default 50, max 100)",
        },
      },
    },
  },
  {
    name: "syncpen_create",
    description: "Create a new SyncPen document.",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Document title (defaults to 'Untitled')",
        },
        content: {
          type: "string",
          description: "Initial markdown content for the document",
        },
        folderId: {
          type: "string",
          description: "Optional: Folder ID to place the document in",
        },
      },
    },
  },
  {
    name: "syncpen_update",
    description: "Update an existing SyncPen document's title and/or content.",
    inputSchema: {
      type: "object",
      properties: {
        documentId: {
          type: "string",
          description: "The ID of the document to update",
        },
        title: {
          type: "string",
          description: "New title for the document",
        },
        content: {
          type: "string",
          description: "New content (replaces existing content)",
        },
      },
      required: ["documentId"],
    },
  },
];

async function main() {
  // Initialize config and client
  const config = getConfig();
  const client = new SyncPenClient(config);

  // Create MCP server
  const server = new Server(
    {
      name: "syncpen",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Handle tool listing
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
  }));

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      let result: string;

      switch (name) {
        case "syncpen_search":
          result = await searchDocuments(
            client,
            (args as { query: string }).query,
            (args as { folderId?: string }).folderId,
            (args as { limit?: number }).limit
          );
          break;

        case "syncpen_read":
          result = await readDocument(
            client,
            (args as { documentId: string }).documentId
          );
          break;

        case "syncpen_list_folders":
          result = await listFolders(client);
          break;

        case "syncpen_list_documents":
          result = await listDocuments(
            client,
            (args as { folderId?: string }).folderId,
            (args as { limit?: number }).limit
          );
          break;

        case "syncpen_create":
          result = await createDocument(
            client,
            (args as { title?: string }).title,
            (args as { content?: string }).content,
            (args as { folderId?: string }).folderId
          );
          break;

        case "syncpen_update":
          result = await updateDocument(
            client,
            (args as { documentId: string }).documentId,
            (args as { title?: string }).title,
            (args as { content?: string }).content
          );
          break;

        default:
          result = `Unknown tool: ${name}`;
      }

      return {
        content: [{ type: "text", text: result }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        content: [{ type: "text", text: `Error: ${message}` }],
        isError: true,
      };
    }
  });

  // Start server with stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log startup to stderr (stdout is used for MCP communication)
  console.error("SyncPen MCP server started");
}

main().catch((error) => {
  console.error("Failed to start SyncPen MCP server:", error);
  process.exit(1);
});
