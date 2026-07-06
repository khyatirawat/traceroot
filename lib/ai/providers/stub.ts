import type { AiProvider, AiCompletion, AiChatCompletion } from "../types";

export function stubProvider(answers?: Record<string, string>): AiProvider {
  return {
    name: "stub",
    async complete(prompt, opts = {}) {
      const m = prompt.match(/Insight code:\s*(\S+)/);
      const code = m?.[1] ?? "unknown";
      const a = answers?.[code];
      const text = a ?? JSON.stringify({
        summary:          `[stub] AI provider not configured; insight code = ${code}.`,
        rootCause:        `(insufficient evidence)`,
        suggestedFix:     `(insufficient evidence)`,
        suggestedTests:   `(insufficient evidence)`,
        regressionRisk:   `(insufficient evidence)`,
      });
      const c: AiCompletion = { text, modelId: "stub-1", latencyMs: 0, provider: "stub" };
      return c;
    },
    async completeChat(messages, opts = {}) {
      const last = messages[messages.length - 1]?.content ?? "";
      const c: AiChatCompletion = {
        text: `[stub echo] I received ${messages.length} message(s). Last: "${last.slice(0, 80)}"`,
        modelId: "stub-1",
        latencyMs: 0,
        provider: "stub",
      };
      return c;
    },
  };
}
