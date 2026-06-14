import { SyncPenClient } from "../client.js";

export async function createFolder(
  client: SyncPenClient,
  name: string,
  parentId?: string
): Promise<string> {
  if (!name || name.trim().length === 0) {
    return "Error: Folder name is required.";
  }

  const folder = await client.createFolder(name.trim(), parentId ?? null);

  return [
    "Folder created successfully.",
    "",
    `**Folder ID:** ${folder.id}`,
    `**Name:** ${folder.name}`,
    `**Parent:** ${folder.parentId || "(root)"}`,
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

export async function moveFolder(
  client: SyncPenClient,
  folderId: string,
  parentId?: string
): Promise<string> {
  if (!folderId || folderId.trim().length === 0) {
    return "Error: Folder ID is required.";
  }

  // Omitting parentId moves the folder to the root.
  const folder = await client.moveFolder(folderId, parentId ?? null);

  return [
    "Folder moved successfully.",
    "",
    `**Folder ID:** ${folder.id}`,
    `**Name:** ${folder.name}`,
    `**New parent:** ${folder.parentId || "(root)"}`,
    `**Updated:** ${folder.updatedAt}`,
  ].join("\n");
}

export async function deleteFolder(
  client: SyncPenClient,
  folderId: string
): Promise<string> {
  if (!folderId || folderId.trim().length === 0) {
    return "Error: Folder ID is required.";
  }

  await client.deleteFolder(folderId);

  return `Folder ${folderId} deleted (it and its subfolders/owned documents were moved to trash).`;
}
