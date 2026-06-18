/**
 * Search tool: search documents by title and body content
 */

import { SyncPenClient } from "../client.js";

export async function searchDocuments(
  client: SyncPenClient,
  query: string,
  folderId?: string,
  limit?: number,
  mode?: string
): Promise<string> {
  if (!query || query.trim().length === 0) {
    return "Error: Search query is required.";
  }

  const results = await client.search({ query, folderId, limit, mode });

  if (results.length === 0) {
    return `No documents found matching "${query}".`;
  }

  const lines = results.map((d) => {
    const ownership = d.isOwner ? "owner" : "shared";
    const folder = d.folderId ? ` [folder: ${d.folderId}]` : "";
    const head = `- ${d.title} (${ownership})${folder} [id: ${d.id}]`;
    if (!d.snippet) return head;
    const where = d.matchedIn === "title" ? "preview" : "match";
    return `${head}\n    ${where}: ${d.snippet}`;
  });

  return `Found ${results.length} document(s) matching "${query}". Triage from the snippets below and read only the best match:\n\n${lines.join("\n")}`;
}
