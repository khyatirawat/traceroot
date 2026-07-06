import type { AiProvider, AiProviderName } from "./types";
import { aiEnabled } from "./types";

let cached: AiProvider | null = null;

export async function getAiProvider(): Promise<AiProvider | null> {
  if (cached) return cached;
  if (!aiEnabled()) return null;
  const name = (process.env.AI_PROVIDER ?? "github-models") as AiProviderName;
  cached = await load(name);
  return cached;
}
export function resetAiProviderForTests(): void { cached = null; }

async function load(name: AiProviderName): Promise<AiProvider> {
  if (name === "stub") return (await import("./providers/stub")).stubProvider();
  if (!aiEnabled()) throw new Error(`[ai] ${name} requested but no credentials are set`);
  switch (name) {
    case "openai":       return (await import("./providers/openai")).openaiProvider();
    case "anthropic":    return (await import("./providers/anthropic")).anthropicProvider();
    case "github-models":return (await import("./providers/github-models")).githubModelsProvider();
    default:             throw new Error(`[ai] unknown provider: ${name}`);
  }
}
