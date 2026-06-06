/**
 * List tools: folders and documents
 */

import { SyncPenClient } from "../client.js";

export async function listFolders(client: SyncPenClient): Promise<string> {
  const folders = await client.listFolders();

  if (folders.length === 0) {
    return "No folders found.";
  }

  const lines = folders.map(
    (f) => `- ${f.name} (${f.documentCount} docs) [id: ${f.id}]`
  );

  return `Found ${folders.length} folder(s):\n\n${lines.join("\n")}`;
}

export async function listDocuments(
  client: SyncPenClient,
  folderId?: string,
  limit?: number
): Promise<string> {
  const documents = await client.listDocuments({ folderId, limit });

  if (documents.length === 0) {
    return folderId
      ? "No documents found in this folder."
      : "No documents found.";
  }

  const lines = documents.map((d) => {
    const ownership = d.isOwner ? "owner" : "shared";
    const folder = d.folderId ? ` [folder: ${d.folderId}]` : "";
    return `- ${d.title} (${ownership})${folder} [id: ${d.id}]`;
  });

  const header = folderId
    ? `Found ${documents.length} document(s) in folder:`
    : `Found ${documents.length} document(s):`;

  return `${header}\n\n${lines.join("\n")}`;
}
