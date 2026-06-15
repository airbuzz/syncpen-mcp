/**
 * Connections tool: list connected CMS targets (WordPress, Ghost, Sanity)
 */

import { SyncPenClient } from "../client.js";

export async function listConnections(client: SyncPenClient): Promise<string> {
  const connections = await client.listConnections();

  if (connections.length === 0) {
    return "No CMS connections. Connect WordPress, Ghost, or Sanity in SyncPen Settings before publishing.";
  }

  const lines = connections.map((c) => {
    const where =
      c.target === "sanity"
        ? `${c.projectId}/${c.dataset}`
        : c.siteUrl ?? "";
    const state = c.isActive ? "active" : "inactive";
    return `- ${c.target}: ${c.siteName}${where ? ` (${where})` : ""} — ${state} [connectionId: ${c.id}]`;
  });

  return `Found ${connections.length} CMS connection(s):\n\n${lines.join("\n")}\n\nPass connectionId to syncpen_publish when a target has more than one active connection.`;
}
