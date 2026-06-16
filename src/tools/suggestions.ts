/**
 * Suggestion tools: propose edits a human accepts or rejects in the document.
 */

import { SyncPenClient, SuggestionAnchor } from "../client.js";

export async function suggestEdit(
  client: SyncPenClient,
  documentId: string,
  anchor: SuggestionAnchor | undefined,
  newText: string | undefined,
  note?: string
): Promise<string> {
  if (!documentId || documentId.trim().length === 0) {
    return "Error: Document ID is required.";
  }
  if (typeof newText !== "string") {
    return "Error: newText is required (the replacement text).";
  }
  const hasOffsets =
    anchor && typeof anchor.from === "number" && typeof anchor.to === "number";
  const hasText = anchor && typeof anchor.text === "string" && anchor.text.length > 0;
  if (!hasOffsets && !hasText) {
    return "Error: anchor must be { from, to } char offsets or { text } a unique snippet to replace.";
  }

  const suggestionId = await client.suggestEdit(
    documentId,
    anchor as SuggestionAnchor,
    newText,
    note
  );

  return [
    `Created suggestion \`${suggestionId}\` — pending human approval.`,
    "",
    "It is shown in the editor as a proposed change with Accept / Reject; the document is not modified until a human accepts it.",
  ].join("\n");
}

export async function listSuggestions(
  client: SyncPenClient,
  documentId: string,
  status?: string
): Promise<string> {
  if (!documentId || documentId.trim().length === 0) {
    return "Error: Document ID is required.";
  }

  const suggestions = await client.listSuggestions(documentId, status);

  if (suggestions.length === 0) {
    return status === "all"
      ? "No suggestions on this document."
      : "No pending suggestions on this document.";
  }

  const lines = suggestions.map((s) => {
    const by = s.agentName ? ` by ${s.agentName}` : "";
    const parts = [
      `- **${s.id}** [${s.status}]${by}`,
      `  - replace: ${JSON.stringify(s.originalText)}`,
      `  - with: ${JSON.stringify(s.newText)}`,
    ];
    if (s.note) parts.push(`  - note: ${s.note}`);
    return parts.join("\n");
  });

  return `Suggestions (${suggestions.length}):\n\n${lines.join("\n")}`;
}
