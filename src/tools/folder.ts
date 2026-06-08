import { SyncPenClient } from "../client.js";

export async function createFolder(
  client: SyncPenClient,
  name: string
): Promise<string> {
  if (!name || name.trim().length === 0) {
    return "Error: Folder name is required.";
  }

  const folder = await client.createFolder(name.trim());

  return [
    "Folder created successfully.",
    "",
    `**Folder ID:** ${folder.id}`,
    `**Name:** ${folder.name}`,
    `**Created:** ${folder.createdAt}`,
  ].join("\n");
}

export async function renameFolder(
  client: SyncPenClient,
  folderId: string,
  name: string
): Promise<string> {
  if (!folderId || folderId.trim().length === 0) {
    return "Error: Folder ID is required.";
  }

  if (!name || name.trim().length === 0) {
    return "Error: New folder name is required.";
  }

  const folder = await client.renameFolder(folderId, name.trim());

  return [
    "Folder renamed successfully.",
    "",
    `**Folder ID:** ${folder.id}`,
    `**New name:** ${folder.name}`,
    `**Updated:** ${folder.updatedAt}`,
  ].join("\n");
}
