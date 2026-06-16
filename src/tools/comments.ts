/**
 * Comment tools: read comment threads, reply in-thread, and resolve them.
 */

import { SyncPenClient } from "../client.js";

export async function listComments(
  client: SyncPenClient,
  documentId: string
): Promise<string> {
  if (!documentId || documentId.trim().length === 0) {
    return "Error: Document ID is required.";
  }

  const threads = await client.listComments(documentId);

  if (threads.length === 0) {
    return "No comments on this document.";
  }

  const blocks = threads.map((t) => {
    const status = t.resolved ? " (resolved)" : "";
    const head = `- **${t.id}** · line ${t.lineNumber}${status} — ${t.author}: ${t.content}`;
    if (t.replies.length === 0) return head;
    const replies = t.replies
      .map((r) => `    - ${r.author}: ${r.content}`)
      .join("\n");
    return `${head}\n${replies}`;
  });

  return `Comments (${threads.length} thread${threads.length === 1 ? "" : "s"}):\n\n${blocks.join("\n")}`;
}

export async function replyComment(
  client: SyncPenClient,
  commentId: string,
  body: string | undefined
): Promise<string> {
  if (!commentId || commentId.trim().length === 0) {
    return "Error: Comment ID is required.";
  }
  if (typeof body !== "string" || body.trim().length === 0) {
    return "Error: body is required (the reply text).";
  }

  const result = await client.replyComment(commentId, body);
  return `Replied to comment ${commentId} (line ${result.lineNumber}). Reply ID: ${result.replyId}.`;
}

export async function resolveComment(
  client: SyncPenClient,
  commentId: string
): Promise<string> {
  if (!commentId || commentId.trim().length === 0) {
    return "Error: Comment ID is required.";
  }

  await client.resolveComment(commentId);
  return `Resolved comment ${commentId}.`;
}
