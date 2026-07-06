import { getAiProvider } from "./provider";
import { MAX_CHAT_HISTORY_MESSAGES, MAX_CHAT_CONTENT_CHARS } from "./chat";
import type { ChatMessage, ChatRequestContext } from "./chat";

const SYSTEM_PROMPT = `You are traceroot's engineering copilot. You have two missions:
1. Summarize & explain what the heuristic engine has found on a GitHub repo.
2. Help the user take action — drafting fixes, reviewing PRs, suggesting tests, walking through release decisions.

Tone: precise, helpful, no fluff. Use Markdown for code blocks, lists, and emphasis.

Rules:
- Never invent file paths, line numbers, or commits you don't have in the evidence.
- When you don't know, say "Based on the evidence I have, …" then qualify.
- Quote issue/PR numbers when relevant.
- Keep replies scannable: one heading, short paragraphs, bullets where useful.
- Address the user by name when it helps continuity.`;

/** Build the system prompt that ships with the chat request. */
export async function buildSystemPrompt(ctx: ChatRequestContext): Promise<string> {
  const insights = ctx.insights.slice(0, 12);
  const lines = [
    SYSTEM_PROMPT,
    "",
    `Active repository: ${ctx.repo.owner}/${ctx.repo.name}`,
    `Active user: ${ctx.user.name} <${ctx.user.email}>`,
    "",
    `Heuristic findings on this repo:`,
  ];
  if (insights.length === 0) {
    lines.push("- (no findings yet for this repo)");
  } else {
    for (const i of insights) {
      lines.push(`- [${i.severity}] ${i.id} :: ${i.title}`);
      if (i.body) lines.push(`  body: ${i.body.slice(0, 240).replace(/\n/g, " ")}`);
    }
  }
  lines.push("");
  lines.push(`When answering, prefer to reference findings by their id and severity. Avoid repeating the full findings list unless asked.`);
  return lines.join("\n");
}

/**
 * Send a chat request. Streams progress via onDelta chunks; when the call
 * completes, resolves with the full text. The route handler reads from onDelta
 * to send Server-Sent Events to the browser.
 */
export interface ChatRunOptions {
  messages: ChatMessage[];
  ctx: ChatRequestContext;
  onDelta?: (chunk: string) => void;
  signal?: AbortSignal;
}

export async function runChat(opts: ChatRunOptions): Promise<{ text: string; modelId: string; provider: string; latencyMs: number }> {
  const provider = await getAiProvider();
  if (!provider) throw new Error("AI provider not configured. Set GITHUB_TOKEN, OPENAI_API_KEY or ANTHROPIC_API_KEY.");

  // Trim history to last N messages and clamp each to MAX content.
  const trimmed = opts.messages
    .filter(m => m.role !== "system")
    .slice(-MAX_CHAT_HISTORY_MESSAGES)
    .map(m => ({ role: m.role, content: m.content.slice(0, MAX_CHAT_CONTENT_CHARS) }));

  const systemPrompt = await buildSystemPrompt(opts.ctx);
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt },
    ...trimmed,
  ];

  if (opts.signal?.aborted) {
    throw new Error("aborted");
  }

  const start = Date.now();
  // For v1 we rely on provider-level completeChat (non-streaming) and chunk the text manually.
  // Providers that natively stream can be added without changing this contract.
  const completion = await provider.completeChat(messages, {
    maxTokens: Number(process.env.AI_CHAT_MAX_TOKENS) || 1500,
    temperature: Number(process.env.AI_CHAT_TEMPERATURE) || 0.4,
  });

  if (opts.signal?.aborted) {
    throw new Error("aborted");
  }

  // Emit text in small chunks to give a "streaming" feel for short replies.
  const text = completion.text;
  if (opts.onDelta) {
    const step = 12;       // chars per chunk
    const stepMs = 25;     // ~50 fps
    for (let i = 0; i < text.length; i += step) {
      if (opts.signal?.aborted) throw new Error("aborted");
      opts.onDelta(text.slice(0, i + step));
      await new Promise((r) => setTimeout(r, stepMs));
    }
    opts.onDelta(text); // final
  }

  return {
    text,
    modelId: completion.modelId,
    provider: completion.provider,
    latencyMs: Date.now() - start,
  };
}
