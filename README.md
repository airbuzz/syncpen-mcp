# SyncPen MCP Server

Connect Claude Code to your SyncPen documents as a knowledge base.

## Quick Setup

### 1. Generate an API Key

1. Go to **Settings > API Keys** in your SyncPen account
2. Enable API Access
3. Create a new API key
4. Copy the key (you'll only see it once!)

### 2. Configure Claude Code

Add to your MCP configuration file (`~/.mcp.json` or project-level `.mcp.json`):

```json
{
  "mcpServers": {
    "syncpen": {
      "command": "npx",
      "args": ["-y", "syncpen-mcp"],
      "env": {
        "SYNCPEN_API_KEY": "sp_your_api_key_here"
      }
    }
  }
}
```

That's it! Claude Code will automatically download and run the MCP server.

## Development Setup

For local development or contributing:

```bash
git clone https://github.com/airbuzz/syncpen-mcp.git
cd syncpen-mcp
npm install
npm run build
```

Then use this configuration in your `~/.mcp.json`:

```json
{
  "mcpServers": {
    "syncpen": {
      "command": "node",
      "args": ["/path/to/syncpen-mcp/dist/index.js"],
      "env": {
        "SYNCPEN_API_KEY": "sp_your_api_key_here",
        "SYNCPEN_API_URL": "http://localhost:3000/api/mcp"
      }
    }
  }
}
```

## Available Tools

| Tool | Description |
|------|-------------|
| `syncpen_search` | Search documents by title and body content (full text) |
| `syncpen_read` | Read a document's content as markdown |
| `syncpen_list_folders` | List all folders |
| `syncpen_list_documents` | List documents, optionally by folder |
| `syncpen_create` | Create a new document |
| `syncpen_update` | Update a document's title and/or content |
| `syncpen_suggest_edit` | Propose an edit as a pending suggestion a human accepts/rejects (doc unchanged until accepted) |
| `syncpen_list_suggestions` | List a document's pending (or all) suggestions |
| `syncpen_list_comments` | Read comment threads (with replies, line numbers, authors) |
| `syncpen_reply_comment` | Reply to a comment thread (signed, notifies @mentions) |
| `syncpen_resolve_comment` | Mark a comment thread resolved |
| `syncpen_move_document` | Move a document into a folder, or to the root |
| `syncpen_delete_document` | Delete a document (moved to trash) |
| `syncpen_create_folder` | Create a folder (optionally nested) |
| `syncpen_rename_folder` | Rename a folder |
| `syncpen_move_folder` | Move a folder under a new parent, or to the root |
| `syncpen_delete_folder` | Delete a folder and its contents (moved to trash) |
| `syncpen_publish` | Publish a document to WordPress, Ghost, or Sanity |
| `syncpen_list_connections` | List connected CMS targets and their connectionIds |

## Usage Examples

Once configured, ask Claude Code:

- "List my SyncPen folders"
- "Search for documents that mention authentication"
- "Read my document titled 'API Design Notes'"
- "What documents do I have in my 'Projects' folder?"
- "Publish my 'Launch Post' document to Ghost as a draft"

## Development

```bash
# Watch mode for development
npm run dev

# Build for production
npm run build
```

## License

MIT
