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
import {
  createDocument,
  updateDocument,
  moveDocument,
  deleteDocument,
} from "./tools/write.js";
import {
  createFolder,
  renameFolder,
  moveFolder,
  deleteFolder,
} from "./tools/folder.js";
import { publishDocument } from "./tools/publish.js";
import { listConnections } from "./tools/connections.js";

// Tool definitions
const TOOLS: Tool[] = [
  {
    name: "syncpen_search",
    description:
      "Search SyncPen documents by title and body content (full text). Use this to find documents about a specific topic.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query to match against document titles and body content",
        },
        folderId: {
          type: "string",
          description: "Optional: Filter results to a specific folder",
        },
        mode: {
          type: "string",
          description:
            "Optional: where to match — 'title', 'content', or 'all' (default 'all').",
          enum: ["title", "content", "all"],
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
    name: "syncpen_create_folder",
    description: "Create a new folder in your SyncPen account.",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the folder to create",
        },
        parentId: {
          type: "string",
          description:
            "Optional: parent folder ID to nest under (up to 5 levels). Omit to create at the root.",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "syncpen_rename_folder",
    description: "Rename an existing SyncPen folder.",
    inputSchema: {
      type: "object",
      properties: {
        folderId: {
          type: "string",
          description: "The ID of the folder to rename",
        },
        name: {
          type: "string",
          description: "New name for the folder",
        },
      },
      required: ["folderId", "name"],
    },
  },
  {
    name: "syncpen_move_folder",
    description:
      "Move a folder under a new parent folder, or to the root. Rejects circular moves and moves that exceed the nesting depth limit.",
    inputSchema: {
      type: "object",
      properties: {
        folderId: {
          type: "string",
          description: "The ID of the folder to move",
        },
        parentId: {
          type: "string",
          description:
            "Target parent folder ID. Omit to move the folder to the root.",
        },
      },
      required: ["folderId"],
    },
  },
  {
    name: "syncpen_delete_folder",
    description:
      "Delete a folder (moved to trash) along with its subfolders and the documents you own within them.",
    inputSchema: {
      type: "object",
      properties: {
        folderId: {
          type: "string",
          description: "The ID of the folder to delete",
        },
      },
      required: ["folderId"],
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
  {
    name: "syncpen_move_document",
    description:
      "Move a document into a folder, or to the root (un-foldered).",
    inputSchema: {
      type: "object",
      properties: {
        documentId: {
          type: "string",
          description: "The ID of the document to move",
        },
        folderId: {
          type: "string",
          description:
            "Target folder ID. Omit to move the document to the root.",
        },
      },
      required: ["documentId"],
    },
  },
  {
    name: "syncpen_delete_document",
    description:
      "Delete a document (moved to trash). Only the document owner can delete it.",
    inputSchema: {
      type: "object",
      properties: {
        documentId: {
          type: "string",
          description: "The ID of the document to delete",
        },
      },
      required: ["documentId"],
    },
  },
  {
    name: "syncpen_publish",
    description:
      "Publish a SyncPen document to a connected CMS (WordPress, Ghost, or Sanity). Auto-selects the connection when only one is active for the target; otherwise pass connectionId.",
    inputSchema: {
      type: "object",
      properties: {
        documentId: {
          type: "string",
          description: "The ID of the document to publish",
        },
        target: {
          type: "string",
          description: "Where to publish: 'wordpress', 'ghost', or 'sanity'",
          enum: ["wordpress", "ghost", "sanity"],
        },
        connectionId: {
          type: "string",
          description:
            "Optional: explicit CMS connection ID. Omit to auto-select the single active connection for the target.",
        },
        status: {
          type: "string",
          description:
            "Optional: post status. WordPress: 'draft' or 'publish'. Ghost/Sanity: 'draft' or 'published'. Defaults to published.",
        },
        postType: {
          type: "string",
          description: "Optional: 'post' or 'page' (WordPress and Ghost only).",
          enum: ["post", "page"],
        },
        title: {
          type: "string",
          description:
            "Optional: override the post title (defaults to the document's first heading, then its title).",
        },
      },
      required: ["documentId", "target"],
    },
  },
  {
    name: "syncpen_list_connections",
    description:
      "List your connected CMS targets (WordPress, Ghost, Sanity) and their connectionIds. Use before syncpen_publish to find the connectionId when a target has more than one active connection.",
    inputSchema: {
      type: "object",
      properties: {},
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
      version: "1.4.0",
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
            (args as { limit?: number }).limit,
            (args as { mode?: string }).mode
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

        case "syncpen_create_folder":
          result = await createFolder(
            client,
            (args as { name: string }).name,
            (args as { parentId?: string }).parentId
          );
          break;

        case "syncpen_rename_folder":
          result = await renameFolder(
            client,
            (args as { folderId: string }).folderId,
            (args as { name: string }).name
          );
          break;

        case "syncpen_move_folder":
          result = await moveFolder(
            client,
            (args as { folderId: string }).folderId,
            (args as { parentId?: string }).parentId
          );
          break;

        case "syncpen_delete_folder":
          result = await deleteFolder(
            client,
            (args as { folderId: string }).folderId
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

        case "syncpen_move_document":
          result = await moveDocument(
            client,
            (args as { documentId: string }).documentId,
            (args as { folderId?: string }).folderId
          );
          break;

        case "syncpen_delete_document":
          result = await deleteDocument(
            client,
            (args as { documentId: string }).documentId
          );
          break;

        case "syncpen_publish":
          result = await publishDocument(
            client,
            (args as { documentId: string }).documentId,
            (args as { target: string }).target,
            {
              connectionId: (args as { connectionId?: string }).connectionId,
              status: (args as { status?: string }).status,
              postType: (args as { postType?: string }).postType,
              title: (args as { title?: string }).title,
            }
          );
          break;

        case "syncpen_list_connections":
          result = await listConnections(client);
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
