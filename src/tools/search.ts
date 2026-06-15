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
    return `- ${d.title} (${ownership})${folder} [id: ${d.id}]`;
  });

  return `Found ${results.length} document(s) matching "${query}":\n\n${lines.join("\n")}`;
}
