/**
 * Recent changes: a time-ordered feed of who changed what, when — across the
 * workspace (or a single folder). Reads the shared change log, so it surfaces
 * both in-app human edits and agent/API writes (including this package's own).
 */

import { SyncPenClient, RecentChange } from "../client.js";

const VERB: Record<RecentChange["type"], string> = {
  INSERT: "created",
  EDIT: "edited",
  DELETE: "trashed",
};

function actorLabel(c: RecentChange): string {
  if (c.actor === "AGENT") return c.agentName ? `${c.agentName} (agent)` : "an agent";
  return "you";
}

function delta(c: RecentChange): string {
  if (c.type !== "EDIT") return "";
  const d = c.charsAfter - c.charsBefore;
  if (d === 0) return "";
  return d > 0 ? ` (+${d} chars)` : ` (${d} chars)`;
}

export async function recentChanges(
  client: SyncPenClient,
  options?: { since?: string; folderId?: string; limit?: number }
): Promise<string> {
  const changes = await client.recentChanges(options);

  if (changes.length === 0) {
    return options?.since
      ? "No changes since that time."
      : "No recent changes.";
  }

  const lines = changes.map((c) => {
    return `- ${c.at} — ${actorLabel(c)} ${VERB[c.type]} "${c.documentTitle}"${delta(
      c
    )} [id: ${c.documentId}]`;
  });

  return `${changes.length} recent change(s), newest first:\n\n${lines.join("\n")}`;
}
