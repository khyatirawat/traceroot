// Provider-agnostic types for the AI suggestion engine.
// Every consumer imports from this module only — never from a provider directly.

export type AiProviderName = "openai" | "anthropic" | "github-models" | "stub";
export type AiScope = "insights" | "issues" | "prs" | "all";

export interface AiProvider {
  readonly name: AiProviderName;
  /** Single-prompt completion (used by suggestion cards). */
  complete(prompt: string, opts?: { maxTokens?: number; temperature?: number; jsonMode?: boolean }): Promise<AiCompletion>;
  /** Multi-turn chat completion (used by chat assistant). Returns when stream ends. */
  completeChat(messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
               opts?: { maxTokens?: number; temperature?: number }): Promise<AiChatCompletion>;
}

export interface AiCompletion {
  text: string;
  modelId: string;
  latencyMs: number;
  provider: AiProviderName;
}

export interface AiChatCompletion extends AiCompletion {}

export interface AiSuggestionInput {
  insightCode: string;
  repoOwner: string;
  repoName: string;
  evidence: unknown;
  repoContext: {
    description?: string;
    language?: string;
    primaryFiles?: { path: string; riskScore: number; reasons: string[] }[];
  };
}

export interface AiSuggestion {
  summary: string;
  suggestedFix: string;
  suggestedTests: string;
  rootCause: string;
  regressionRisk: string;
  modelId: string;
  provider: AiProviderName;
  latencyMs: number;
}

export interface AiSettings {
  enabled: boolean;
  provider: AiProviderName | null;
  scope: AiScope;
  maxPerDay: number;
}

export const DEFAULT_AI_SETTINGS: AiSettings = {
  enabled: false,
  provider: null,
  scope: "insights",
  maxPerDay: 20,
};

export function aiEnabled(): boolean {
  return Boolean(
    process.env.OPENAI_API_KEY    ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.AI_GITHUB_TOKEN   ||
    process.env.GITHUB_TOKEN,
  );
}
