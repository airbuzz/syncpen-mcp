/**
 * Guidance delivered to connected MCP clients.
 *
 * - `SERVER_INSTRUCTIONS` is returned at initialize and auto-injected into the
 *   model's context by compliant clients (no install step). Keep it short — it
 *   is always on. This is how a SyncPen *user's* agent learns to navigate the
 *   workspace token-efficiently.
 * - `NAVIGATION_SKILL` is the long-form guide, exposed as the
 *   `skill://syncpen/navigation` resource for an agent to pull on demand.
 */

export const NAVIGATION_RESOURCE_URI = "skill://syncpen/navigation";

export const SERVER_INSTRUCTIONS = `SyncPen is a markdown knowledge base. Calling a tool is cheap, but \`syncpen_read\` returns a document's *entire* body — so the cost that matters is finding the right document without reading many in full.

Retrieval discipline:
- Search before browsing. Prefer \`syncpen_search\` over \`syncpen_list_folders\`/\`syncpen_list_documents\`. Search matches title *and* body and returns, per hit, a \`snippet\` (excerpt around the match) and \`matchedIn\` ("content" | "title" | null).
- Triage from the snippets, not full reads. A "content" match whose snippet answers the question often needs no read at all.
- Then read only the single best candidate with \`syncpen_read\`. If it's wrong, go back to the snippets — don't open the rest speculatively.
- Narrow the search with \`folderId\`, \`mode\` ("title" | "content" | "all"), and \`limit\`. Reuse IDs you already have instead of re-searching.

Conventions:
- Internal links must be \`/editor/{id}\` (there is no /documents/{id} route).
- No decorative icons; keep writing direct and consistent.
- Your suggestions and comments are signed with your agent identity — edits are attributable, not silent.

Orientation: for architecture and where-things-live facts, read the "SyncPen — System Map & Conventions (read me first)" doc in the Syncpen folder before crawling folders. Full guide: read the \`${NAVIGATION_RESOURCE_URI}\` resource.`;

export const NAVIGATION_SKILL = `# Working with the SyncPen knowledge base

SyncPen is a markdown knowledge base reached through this MCP. The cost that
matters is **tokens spent finding the right document**. \`syncpen_read\` returns a
document's *entire* body, so opening several docs to triage is the main way to
waste a budget. This guide keeps discovery cheap.

## The retrieval discipline (do this every time)

1. **Search first, don't browse.** Reach for \`syncpen_search\` before
   \`syncpen_list_folders\` / \`syncpen_list_documents\`. Listing gives bare titles;
   search matches title *and* body and returns a snippet.
2. **Triage from snippets, not full reads.** Each search result carries:
   - \`snippet\` — a short excerpt around the match (or a leading preview).
   - \`matchedIn\` — "content" (body hit), "title" (title hit, snippet is a
     preview), or null.
   Decide relevance from the snippet + \`matchedIn\`. A "content" match whose
   snippet answers the question often needs **no** read at all.
3. **Read only the winner.** Open the single best candidate with \`syncpen_read\`.
   If it's wrong, go back to the snippets — don't open the rest speculatively.
4. **Scope the search when you can.** Pass \`folderId\` to confine a search, and
   \`mode\` ("title" | "content" | "all") to narrow how it matches. Use \`limit\`
   to keep the result set small.
5. **Reuse IDs you already have.** Document and folder IDs are stable. If a doc
   was referenced earlier (e.g. via an \`/editor/{id}\` link), read it directly
   instead of searching again.

## Orienting in the workspace

- The engineering source of truth is the **"SyncPen — System Map & Conventions
  (read me first)"** doc in the **Syncpen** folder. For architecture, deploy
  topology, or where-things-live facts, read that one doc — don't re-derive them
  by crawling folders.
- **Session logs** live in the Session Logs folder, one file per day titled
  \`Session Log — <YYYY-MM-DD>\`. Read the latest at the start of a session.

## Writing back

- **Internal links must be \`/editor/{id}\`** — the renderer only treats those as
  internal (there is no /documents/[id] route).
- **No decorative icons.** Icons only when functional (a status legend or table
  marker). Keep the tone direct, pragmatic, consistent.
- Suggestions and comments are **signed** via your API key's identity — an agent
  edit is attributable, not silent.

## Anti-patterns

- Don't: list folders -> list documents on several folders -> read 4-5 docs to
  find one fact. Do: one search, triage snippets, read the winner.
- Don't: re-search for a doc whose ID you already saw. Do: read the known ID.
- Don't: read a long doc in full for one section the snippet already answers.
`;
