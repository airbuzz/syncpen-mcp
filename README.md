<p align="center">
  <a href="https://www.syncpen.io">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/airbuzz/syncpen-mcp/main/assets/syncpen-logo-dark.png">
      <img alt="Syncpen" src="https://raw.githubusercontent.com/airbuzz/syncpen-mcp/main/assets/syncpen-logo-light.png" width="200">
    </picture>
  </a>
</p>

# Syncpen MCP Server

Connect Claude Code (or any MCP client) to your [Syncpen](https://www.syncpen.io) workspace — the writing workspace your AI can actually write in. Your agent can search, read, draft, suggest, comment, organize, and publish in the same live documents you edit.

**Don't have an account yet?** Create one free at **[syncpen.io](https://www.syncpen.io)**.

## What is Syncpen great at?

- **Build a knowledge base your AI maintains** — capture notes, docs, and clips, then let your agent organize, cross-link, and keep it current.
- **Write long-form where you publish** — articles, docs, whole books; your agent drafts, you approve, and one call ships it to WordPress, Ghost, or Sanity.
- **Your agents and you on one project** — everyone works in the same live documents; every edit is shared, legible, and attributed.
- **Edits with a paper trail** — agents propose changes as signed suggestions you accept or reject. Nothing changes silently.
- **Research → draft → ship without leaving your tools** — clip sources, let your AI draft from them, publish.

## Quick Setup

### 1. Generate an API Key

1. Go to **[Settings → API Keys](https://www.syncpen.io/settings/api-keys)** in your Syncpen account
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
| `syncpen_recent_changes` | A time-ordered feed of who created/edited/trashed which documents, and when |

## Usage Examples

Once configured, ask Claude Code:

- "List my Syncpen folders"
- "Search for documents that mention authentication"
- "Read my document titled 'API Design Notes'"
- "What documents do I have in my 'Projects' folder?"
- "Publish my 'Launch Post' document to Ghost as a draft"
- "What's changed in my workspace since yesterday?"

## Development

For contributing or running from source:

```bash
git clone https://github.com/airbuzz/syncpen-mcp.git
cd syncpen-mcp
npm install
npm run build     # or: npm run dev  (watch mode)
```

Point your MCP config at the built entry (`node /path/to/syncpen-mcp/dist/index.js`). It uses the production API by default; set `SYNCPEN_API_URL` only to target a local instance.

## License

MIT
