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
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import {
  SERVER_INSTRUCTIONS,
  NAVIGATION_SKILL,
  NAVIGATION_RESOURCE_URI,
} from "./instructions.js";
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
import { recentChanges } from "./tools/recent-changes.js";
import { suggestEdit, listSuggestions } from "./tools/suggestions.js";
import {
  listComments,
  replyComment,
  resolveComment,
} from "./tools/comments.js";
import type { SuggestionAnchor } from "./client.js";

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
    name: "syncpen_suggest_edit",
    description:
      "Propose an edit to a document as a pending suggestion that a human accepts or rejects in the editor. The document is NOT changed until accepted. Use this instead of syncpen_update when you want human approval. Anchor the edit either by character offsets {from,to} or by a unique snippet {text} to replace.",
    inputSchema: {
      type: "object",
      properties: {
        documentId: {
          type: "string",
          description: "The ID of the document to suggest an edit on",
        },
        anchor: {
          type: "object",
          description:
            "Where to apply the edit. Provide EITHER {from,to} character offsets, OR {text} — a snippet that occurs exactly once in the document and will be replaced.",
          properties: {
            from: {
              type: "number",
              description: "Start character offset (use together with 'to').",
            },
            to: {
              type: "number",
              description: "End character offset, exclusive (use together with 'from').",
            },
            text: {
              type: "string",
              description:
                "A unique snippet in the document to replace (alternative to from/to).",
            },
          },
        },
        newText: {
          type: "string",
          description: "The replacement text for the anchored range.",
        },
        note: {
          type: "string",
          description: "Optional rationale shown to the human alongside the suggestion.",
        },
      },
      required: ["documentId", "anchor", "newText"],
    },
  },
  {
    name: "syncpen_list_suggestions",
    description:
      "List a document's suggestions so you can see what is still pending. Defaults to pending only; pass status 'all' to include accepted/rejected.",
    inputSchema: {
      type: "object",
      properties: {
        documentId: {
          type: "string",
          description: "The ID of the document",
        },
        status: {
          type: "string",
          description: "Optional: 'pending' (default) or 'all'.",
          enum: ["pending", "all"],
        },
      },
      required: ["documentId"],
    },
  },
  {
    name: "syncpen_list_comments",
    description:
      "Read the comment threads on a document (top-level comments with their replies, line numbers, authors, and resolved state).",
    inputSchema: {
      type: "object",
      properties: {
        documentId: {
          type: "string",
          description: "The ID of the document",
        },
      },
      required: ["documentId"],
    },
  },
  {
    name: "syncpen_reply_comment",
    description:
      "Reply to a comment thread. The reply is posted under the agent's name and notifies any @mentioned members.",
    inputSchema: {
      type: "object",
      properties: {
        commentId: {
          type: "string",
          description: "The ID of the comment to reply to (from syncpen_list_comments).",
        },
        body: {
          type: "string",
          description: "The reply text. Supports @mentions of document members.",
        },
      },
      required: ["commentId", "body"],
    },
  },
  {
    name: "syncpen_resolve_comment",
    description: "Mark a comment thread as resolved after acting on it.",
    inputSchema: {
      type: "object",
      properties: {
        commentId: {
          type: "string",
          description: "The ID of the comment to resolve.",
        },
      },
      required: ["commentId"],
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
  {
    name: "syncpen_recent_changes",
    description:
      "A time-ordered feed of recent workspace changes — who created, edited, or trashed which documents, and when. Surfaces both in-app human edits and agent/API writes. Use it to catch up on what changed since you last looked (pass `since`), or to scope to one folder.",
    inputSchema: {
      type: "object",
      properties: {
        since: {
          type: "string",
          description:
            "Only return changes after this ISO 8601 timestamp (e.g. \"2026-07-01T00:00:00Z\").",
        },
        folderId: {
          type: "string",
          description: "Limit to changes in documents within this folder.",
        },
        limit: {
          type: "number",
          description: "Max changes to return (default 50, max 200).",
        },
      },
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
      version: "1.6.3",
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
      instructions: SERVER_INSTRUCTIONS,
    }
  );

  // Handle tool listing
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
  }));

  // Expose the long-form navigation guide as a resource (the always-on
  // `instructions` stays short; agents can pull the full guide on demand).
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: [
      {
        uri: NAVIGATION_RESOURCE_URI,
        name: "SyncPen navigation guide",
        description:
          "Token-efficient retrieval discipline and workspace conventions for the SyncPen knowledge base.",
        mimeType: "text/markdown",
      },
    ],
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    if (request.params.uri === NAVIGATION_RESOURCE_URI) {
      return {
        contents: [
          {
            uri: NAVIGATION_RESOURCE_URI,
            mimeType: "text/markdown",
            text: NAVIGATION_SKILL,
          },
        ],
      };
    }
    throw new Error(`Unknown resource: ${request.params.uri}`);
  });

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

        case "syncpen_suggest_edit":
          result = await suggestEdit(
            client,
            (args as { documentId: string }).documentId,
            (args as { anchor?: SuggestionAnchor }).anchor,
            (args as { newText?: string }).newText,
            (args as { note?: string }).note
          );
          break;

        case "syncpen_list_suggestions":
          result = await listSuggestions(
            client,
            (args as { documentId: string }).documentId,
            (args as { status?: string }).status
          );
          break;

        case "syncpen_list_comments":
          result = await listComments(
            client,
            (args as { documentId: string }).documentId
          );
          break;

        case "syncpen_reply_comment":
          result = await replyComment(
            client,
            (args as { commentId: string }).commentId,
            (args as { body?: string }).body
          );
          break;

        case "syncpen_resolve_comment":
          result = await resolveComment(
            client,
            (args as { commentId: string }).commentId
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

        case "syncpen_recent_changes":
          result = await recentChanges(client, {
            since: (args as { since?: string }).since,
            folderId: (args as { folderId?: string }).folderId,
            limit: (args as { limit?: number }).limit,
          });
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
