/**
 * Related documents: a learned "what to read next" signal for a given document.
 * Blends CO-ACCESS (docs worked on in the same sessions, from the change log)
 * with the explicit /editor links in the markdown (both directions), and returns
 * the results ranked by relevance with a plain-language reason for each.
 */

import { SyncPenClient } from "../client.js";

export async function relatedDocuments(
  client: SyncPenClient,
  documentId: string,
  limit?: number
): Promise<string> {
  const related = await client.relatedDocuments(documentId, { limit });

  if (related.length === 0) {
    return (
      "No related documents yet. This signal grows as you work across documents " +
      "in the same sessions and link them together with /editor links."
    );
  }

  const lines = related.map(
    (r) => `- "${r.title}" — ${r.reason} [id: ${r.documentId}]`
  );

  return `${related.length} related document(s), most relevant first:\n\n${lines.join(
    "\n"
  )}`;
}
