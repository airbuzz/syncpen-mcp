/**
 * Write tools: create and update documents
 */

import { SyncPenClient } from "../client.js";

export async function createDocument(
  client: SyncPenClient,
  title?: string,
  content?: string,
  folderId?: string
): Promise<string> {
  const document = await client.createDocument({ title, content, folderId });

  return [
    "Document created successfully.",
    "",
    `**Document ID:** ${document.id}`,
    `**Title:** ${document.title}`,
    `**Folder:** ${document.folderId || "(none)"}`,
    `**Created:** ${document.createdAt}`,
  ].join("\n");
}

export async function updateDocument(
  client: SyncPenClient,
  documentId: string,
  title?: string,
  content?: string
): Promise<string> {
  if (!documentId || documentId.trim().length === 0) {
    return "Error: Document ID is required.";
  }

  if (title === undefined && content === undefined) {
    return "Error: At least one of title or content must be provided.";
  }

  const document = await client.updateDocument(documentId, { title, content });

  const updates: string[] = [];
  if (title !== undefined) updates.push("title");
  if (content !== undefined) updates.push("content");

  return [
    `Document updated successfully (${updates.join(", ")}).`,
    "",
    `**Document ID:** ${document.id}`,
    `**Title:** ${document.title}`,
    `**Last updated:** ${document.updatedAt}`,
  ].join("\n");
}
