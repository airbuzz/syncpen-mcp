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
| `syncpen_search` | Search documents by title |
| `syncpen_read` | Read a document's content as markdown |
| `syncpen_list_folders` | List all folders |
| `syncpen_list_documents` | List documents, optionally by folder |
| `syncpen_create` | Create a new document |
| `syncpen_update` | Update an existing document |

## Usage Examples

Once configured, ask Claude Code:

- "List my SyncPen folders"
- "Search for documents about authentication"
- "Read my document titled 'API Design Notes'"
- "What documents do I have in my 'Projects' folder?"

## Development

```bash
# Watch mode for development
npm run dev

# Build for production
npm run build
```

## License

MIT
