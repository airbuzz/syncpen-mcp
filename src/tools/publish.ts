/**
 * Publish tool: publish a document to a connected CMS (WordPress, Ghost, Sanity)
 */

import { SyncPenClient } from "../client.js";

export async function publishDocument(
  client: SyncPenClient,
  documentId: string,
  target: string,
  options?: {
    connectionId?: string;
    status?: string;
    postType?: string;
    title?: string;
  }
): Promise<string> {
  if (!documentId || documentId.trim().length === 0) {
    return "Error: Document ID is required.";
  }
  if (!target || target.trim().length === 0) {
    return "Error: target is required ('wordpress', 'ghost', or 'sanity').";
  }

  const result = await client.publishDocument(documentId, target, options);

  const lines = [
    `Published to ${result.target} (${result.status}).`,
    "",
    `**Document ID:** ${documentId}`,
    `**Post ID:** ${result.postId}`,
  ];
  if (result.url) lines.push(`**URL:** ${result.url}`);

  return lines.join("\n");
}
