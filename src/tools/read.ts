/**
 * Read tool: read document content
 */

import { SyncPenClient } from "../client.js";

export async function readDocument(
  client: SyncPenClient,
  documentId: string
): Promise<string> {
  if (!documentId || documentId.trim().length === 0) {
    return "Error: Document ID is required.";
  }

  const document = await client.readDocument(documentId);

  const header = [
    `# ${document.title}`,
    "",
    `**Document ID:** ${document.id}`,
    `**Access:** ${document.isOwner ? "Owner" : "Shared with you"}`,
    `**Last updated:** ${document.updatedAt}`,
    "",
    "---",
    "",
  ].join("\n");

  return header + document.content;
}
