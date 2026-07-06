import { getAiProvider } from "./provider";
import { buildPrompt } from "./prompts";
import { getCached, writeCached, getUserSettings, consumeQuota } from "./cache";
import type { AiSuggestion, AiSuggestionInput } from "./types";

export interface AiSuggestionResult {
  suggestion: AiSuggestion;
  cached: boolean;
}

/**
 * Get or create an AI suggestion for one (user, repo, insight) tuple.
 * Returns null when:
 *   - the engine is disabled (per-user)
 *   - no AI provider is configured
 *   - daily quota is exhausted
 *   - the provider call fails
 *
 * Callers render "no suggestion" gracefully.
 */
export async function getOrCreateSuggestion(
  userId: string, input: AiSuggestionInput,
): Promise<AiSuggestionResult | null> {
  const settings = await getUserSettings(userId);
  if (!settings.enabled) return null;

  const evidenceJson = JSON.stringify(input.evidence ?? null);
  const cached = await getCached(userId, input.repoOwner, input.repoName, input.insightCode, evidenceJson);
  if (cached) {
    return {
      cached: true,
      suggestion: {
        summary:        cached.summary,
        suggestedFix:   cached.suggestedFix,
        suggestedTests: cached.suggestedTests,
        rootCause:      cached.rootCause,
        regressionRisk: cached.regressionRisk,
        modelId:        cached.modelId,
        provider:       cached.provider as AiSuggestion["provider"],
        latencyMs:      0,
      },
    };
  }

  const provider = await getAiProvider();
  if (!provider) return null;

  const allowed = await consumeQuota(userId, settings.maxPerDay);
  if (!allowed) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[ai] user ${userId} hit daily quota (${settings.maxPerDay})`);
    }
    return null;
  }

  const { prompt, jsonMode } = buildPrompt(input);
  let completion;
  try {
    completion = await provider.complete(prompt, { maxTokens: 1200, temperature: 0.2, jsonMode });
  } catch (e) {
    console.warn(`[ai] provider ${provider.name} failed:`, (e as Error).message);
    return null;
  }

  const parsed = parseJsonLenient(completion.text);
  const suggestion: AiSuggestion = {
    summary:        String(parsed.summary        ?? "(insufficient evidence)"),
    rootCause:      String(parsed.rootCause      ?? "(insufficient evidence)"),
    suggestedFix:   String(parsed.suggestedFix   ?? "(insufficient evidence)"),
    suggestedTests: String(parsed.suggestedTests ?? "(insufficient evidence)"),
    regressionRisk: String(parsed.regressionRisk ?? "(insufficient evidence)"),
    modelId:        completion.modelId,
    provider:       completion.provider,
    latencyMs:      completion.latencyMs,
  };

  await writeCached(userId, input.repoOwner, input.repoName, input.insightCode, evidenceJson, {
    summary: suggestion.summary, suggestedFix: suggestion.suggestedFix,
    suggestedTests: suggestion.suggestedTests, rootCause: suggestion.rootCause,
    regressionRisk: suggestion.regressionRisk, modelId: suggestion.modelId,
    provider: suggestion.provider, latencyMs: suggestion.latencyMs,
  });
  return { suggestion, cached: false };
}

function parseJsonLenient(text: string): Record<string, unknown> {
  try {
    const v = JSON.parse(text);
    if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
  } catch { /* try greedy brace */ }
  const m = text.match(/\{[\s\S]*\}/);
  if (m) {
    try {
      const v = JSON.parse(m[0]);
      if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
    } catch { /* fallthrough */ }
  }
  return {};
}

/**
 * Best-effort: produce AI suggestions for many insights in one call.
 * Failures are silenced; caller renders heuristic-only on null.
 */
export async function getOrCreateSuggestionsForInsights(
  userId: string,
  insights: { code: string; evidence?: unknown }[],
  ctx: { repoOwner: string; repoName: string; description?: string; language?: string;
         primaryFiles?: { path: string; riskScore: number; reasons: string[] }[] },
): Promise<Map<string, AiSuggestionResult>> {
  const out = new Map<string, AiSuggestionResult>();
  await Promise.all(insights.map(async (i) => {
    const r = await getOrCreateSuggestion(userId, {
      insightCode: i.code, repoOwner: ctx.repoOwner, repoName: ctx.repoName,
      evidence: i.evidence ?? null,
      repoContext: { description: ctx.description, language: ctx.language,
                     primaryFiles: ctx.primaryFiles },
    });
    if (r) out.set(i.code, r);
  }));
  return out;
}
