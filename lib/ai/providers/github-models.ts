import type { AiProvider, AiCompletion, AiChatCompletion } from "../types";

const ENDPOINT = "https://models.inference.ai.azure.com";
const DEFAULT_MODEL = "gpt-4o-mini";

export function githubModelsProvider(): AiProvider {
  return {
    name: "github-models",
    async complete(prompt, opts = {}) {
      const token = process.env.AI_GITHUB_TOKEN ?? process.env.GITHUB_TOKEN;
      if (!token) throw new Error("[ai] GITHUB_TOKEN not set");
      const start = Date.now();
      const res = await fetch(`${ENDPOINT}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          model: process.env.AI_MODEL ?? DEFAULT_MODEL,
          messages: [
            { role: "system", content: "You are traceroot, an AI engineering assistant. Be precise and concise." },
            { role: "user",   content: prompt },
          ],
          max_tokens:  opts.maxTokens  ?? 900,
          temperature: opts.temperature ?? 0.2,
          ...(opts.jsonMode ? { response_format: { type: "json_object" } } : {}),
        }),
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`[ai] github-models HTTP ${res.status}: ${(await res.text().catch(() => "")).slice(0, 400)}`);
      const body = (await res.json()) as { choices: { message: { content: string } }[]; model: string };
      const c: AiCompletion = {
        text: body.choices[0]?.message.content?.trim() ?? "",
        modelId: body.model ?? DEFAULT_MODEL,
        latencyMs: Date.now() - start,
        provider: "github-models",
      };
      return c;
    },
    async completeChat(messages, opts = {}) {
      const token = process.env.AI_GITHUB_TOKEN ?? process.env.GITHUB_TOKEN;
      if (!token) throw new Error("[ai] GITHUB_TOKEN not set");
      const start = Date.now();
      const res = await fetch(`${ENDPOINT}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          model: process.env.AI_MODEL ?? DEFAULT_MODEL,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          max_tokens:  opts.maxTokens  ?? 1500,
          temperature: opts.temperature ?? 0.4,
        }),
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`[ai] github-models HTTP ${res.status}: ${(await res.text().catch(() => "")).slice(0, 400)}`);
      const body = (await res.json()) as { choices: { message: { content: string } }[]; model: string };
      const c: AiChatCompletion = {
        text: body.choices[0]?.message.content?.trim() ?? "",
        modelId: body.model ?? DEFAULT_MODEL,
        latencyMs: Date.now() - start,
        provider: "github-models",
      };
      return c;
    },
  };
}
