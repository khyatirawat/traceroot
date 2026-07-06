// Multi-message chat for the AI assistant widget.
// Single-file lives alongside the existing AI subsystem (cards use suggest.ts,
// chat uses chat.ts). The provider interface is shared.

export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
}

export interface ChatRequestContext {
  repo: { owner: string; name: string };
  user: { name: string; email: string };
  /** Heuristic insights for the active repo, normalized into the system prompt. */
  insights: Array<{
    id: string;
    title: string;
    body: string;
    severity: "info" | "warn" | "alert" | "critical";
  }>;
}

export interface ChatStreamChunk {
  type: "delta" | "done" | "error";
  text?: string;
  error?: string;
}

export const MAX_CHAT_HISTORY_MESSAGES = 50;
export const MAX_CHAT_CONTENT_CHARS = 4000;
