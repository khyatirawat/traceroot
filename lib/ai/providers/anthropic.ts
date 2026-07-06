import type { AiProvider, AiCompletion, AiChatCompletion } from "../types";

const ENDPOINT = "https://api.anthropic.com/v1";
const DEFAULT_MODEL = "claude-3-5-haiku-20241022";

export function anthropicProvider(): AiProvider {
  return {
    name: "anthropic",
    async complete(prompt, opts = {}) {
      const key = process.env.ANTHROPIC_API_KEY;
      if (!key) throw new Error("[ai] ANTHROPIC_API_KEY not set");
      const start = Date.now();
      const res = await fetch(`${ENDPOINT}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: process.env.AI_MODEL ?? DEFAULT_MODEL,
          max_tokens: opts.maxTokens ?? 900,
          temperature: opts.temperature ?? 0.2,
          system: "You are traceroot, an AI engineering assistant. Be precise and concise.",
          messages: [{ role: "user", content: prompt }],
        }),
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`[ai] anthropic HTTP ${res.status}: ${(await res.text().catch(() => "")).slice(0, 400)}`);
      const body = (await res.json()) as { content: { type: string; text: string }[]; model: string };
      const text = body.content.filter(b => b.type === "text").map(b => b.text).join("").trim();
      const c: AiCompletion = {
        text, modelId: body.model ?? DEFAULT_MODEL,
        latencyMs: Date.now() - start, provider: "anthropic",
      };
      return c;
    },
    async completeChat(messages, opts = {}) {
      const key = process.env.ANTHROPIC_API_KEY;
      if (!key) throw new Error("[ai] ANTHROPIC_API_KEY not set");
      // Anthropic requires system messages separately from user/assistant.
      const systemMsgs = messages.filter(m => m.role === "system").map(m => m.content);
      const userMsgs   = messages.filter(m => m.role !== "system");
      const systemPayload = systemMsgs.length === 1 ? systemMsgs[0] : systemMsgs.join("\n\n");
      const start = Date.now();
      const res = await fetch(`${ENDPOINT}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: process.env.AI_MODEL ?? DEFAULT_MODEL,
          max_tokens: opts.maxTokens ?? 1500,
          temperature: opts.temperature ?? 0.4,
          system: systemPayload,
          messages: userMsgs,
        }),
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`[ai] anthropic HTTP ${res.status}: ${(await res.text().catch(() => "")).slice(0, 400)}`);
      const body = (await res.json()) as { content: { type: string; text: string }[]; model: string };
      const text = body.content.filter(b => b.type === "text").map(b => b.text).join("").trim();
      const c: AiChatCompletion = {
        text, modelId: body.model ?? DEFAULT_MODEL,
        latencyMs: Date.now() - start, provider: "anthropic",
      };
      return c;
    },
  };
}
