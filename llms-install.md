# Installing the Syncpen MCP server (guide for AI agents)

You are an AI assistant helping a user connect the **Syncpen** MCP server. Syncpen is a markdown writing workspace; this server lets you read, search, create, edit, suggest, comment on, and publish the user's documents. It is a published npm package run with `npx` — there is nothing to clone or build.

## Step 1 — Make sure the user has an API key

The server authenticates with a Syncpen API key in the `SYNCPEN_API_KEY` environment variable.

- If the user does not have one, tell them: go to **https://www.syncpen.io/settings/api-keys** → **Enable API Access** → **Create Key** → copy it (it is shown only once). A free account works. Keys start with `sp_`.
- Ask the user to paste the key so you can put it in the config.

## Step 2 — Add the server to the MCP settings

Add this entry to the user's MCP configuration (for Cline, that is `cline_mcp_settings.json`; merge into any existing `mcpServers` object):

```json
{
  "mcpServers": {
    "syncpen": {
      "command": "npx",
      "args": ["-y", "syncpen-mcp"],
      "env": {
        "SYNCPEN_API_KEY": "sp_paste_the_users_key_here"
      }
    }
  }
}
```

Replace `sp_paste_the_users_key_here` with the key from Step 1. The `SYNCPEN_API_KEY` value **must** be set — without it the server starts but every tool call fails with an authentication error. Then reload/refresh MCP servers.

## Step 3 — Verify

Ask the user's permission to run a read-only check, then call `syncpen_list_folders` (or ask: "List my Syncpen folders"). A normal result means it works.

If you get **"SyncPen authentication failed — your API key is missing, invalid, or revoked"**, the key is missing or wrong: re-check the `SYNCPEN_API_KEY` value against the one from Step 1, or have the user create a fresh key.

## What the server can do (19 tools)

- **Read / search:** `syncpen_read`, `syncpen_search`, `syncpen_list_documents`, `syncpen_list_folders`, `syncpen_list_connections`
- **Write:** `syncpen_create`, `syncpen_update`
- **Suggest (you propose, the human accepts/rejects):** `syncpen_suggest_edit`, `syncpen_list_suggestions`
- **Comments:** `syncpen_list_comments`, `syncpen_reply_comment`, `syncpen_resolve_comment`
- **Organize:** `syncpen_create_folder`, `syncpen_rename_folder`, `syncpen_move_folder`, `syncpen_delete_folder`, `syncpen_move_document`, `syncpen_delete_document`
- **Publish:** `syncpen_publish` (WordPress / Ghost / Sanity)

Writes route through the live collaborative document, so an agent edit and a human edit land in the same place. See `README.md` for details.
