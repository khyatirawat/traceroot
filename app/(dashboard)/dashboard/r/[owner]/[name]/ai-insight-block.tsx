import { AiSuggestionCard, type AiSuggestionView } from "@/components/ai-suggestion-card";
import { getOrCreateSuggestionsForInsights } from "@/lib/ai/suggest";
import type { Insight } from "@/lib/insights";

interface Props {
  userId: string;
  insights: Insight[];
  ctx: { repoOwner: string; repoName: string; description?: string; language?: string;
         primaryFiles?: { path: string; riskScore: number; reasons: string[] }[] };
}

export async function AiInsightBlock({ userId, insights, ctx }: Props) {
  // Stable evidence: serialize what we know about each insight (id + metric + title).
  const evList = insights.map((i) => ({
    id: i.id, title: i.title, severity: i.severity, category: i.category,
    metric: i.metric ?? null,
  }));
  const results = await getOrCreateSuggestionsForInsights(
    userId,
    insights.map((i, idx) => ({ code: i.id || `idx-${idx}`, evidence: evList[idx] })),
    ctx,
  );

  if (results.size === 0) return null; // disabled or no creds — silent fallback.

  return (
    <div className="space-y-3">
      {insights.map((insight, idx) => {
        const code = insight.id || `idx-${idx}`;
        const r = results.get(code);
        if (!r) return null;
        const view: AiSuggestionView = {
          summary:        r.suggestion.summary,
          suggestedFix:   r.suggestion.suggestedFix,
          suggestedTests: r.suggestion.suggestedTests,
          rootCause:      r.suggestion.rootCause,
          regressionRisk: r.suggestion.regressionRisk,
          modelId:        r.suggestion.modelId,
          provider:       r.suggestion.provider,
          latencyMs:      r.suggestion.latencyMs,
          cached:         r.cached,
        };
        return (
          <AiSuggestionCard key={code} insightTitle={insight.title} suggestion={view} />
        );
      })}
    </div>
  );
}
