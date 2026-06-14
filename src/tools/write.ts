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

export async function moveDocument(
  client: SyncPenClient,
  documentId: string,
  folderId?: string
): Promise<string> {
  if (!documentId || documentId.trim().length === 0) {
    return "Error: Document ID is required.";
  }

  // Omitting folderId moves the document to the root (un-foldered).
  const document = await client.moveDocument(documentId, folderId ?? null);

  return [
    "Document moved successfully.",
    "",
    `**Document ID:** ${document.id}`,
    `**Title:** ${document.title}`,
    `**Folder:** ${folderId || "(root)"}`,
    `**Last updated:** ${document.updatedAt}`,
  ].join("\n");
}

export async function deleteDocument(
  client: SyncPenClient,
  documentId: string
): Promise<string> {
  if (!documentId || documentId.trim().length === 0) {
    return "Error: Document ID is required.";
  }

  await client.deleteDocument(documentId);

  return `Document ${documentId} deleted (moved to trash).`;
}
