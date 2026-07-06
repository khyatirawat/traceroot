import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { getOrCreateSuggestionsForInsights } from "@/lib/ai/suggest";
import { getRepo, getRecentIssues, getRecentPulls, getRecentCommits, getContributors, GithubError } from "@/lib/github";
import { generateInsights } from "@/lib/insights";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ owner: string; name: string }> }) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { owner, name } = await ctx.params;
  let repo;
  try {
    repo = await getRepo({ owner, name, fullName: `${owner}/${name}` });
  } catch (e) {
    if (e instanceof GithubError) return NextResponse.json({ error: "Repo not found" }, { status: 404 });
    throw e;
  }

  const [issues, pulls, commits, contribs] = await Promise.all([
    getRecentIssues({ owner, name, fullName: `${owner}/${name}` }),
    getRecentPulls ({ owner, name, fullName: `${owner}/${name}` }),
    getRecentCommits({owner, name, fullName: `${owner}/${name}` }),
    getContributors({owner, name, fullName: `${owner}/${name}`}).catch(() => [] as Awaited<ReturnType<typeof getContributors>>),
  ]);
  const insights = generateInsights(repo, issues, pulls, commits, contribs);

  const results = await getOrCreateSuggestionsForInsights(
    me.id,
    insights.map((i) => ({ code: i.id ?? "unknown", evidence: (i as { metric?: unknown }).metric })),
    {
      repoOwner: owner, repoName: name,
      description: repo.description, language: repo.language,
      primaryFiles: [],
    },
  );

  const out: Record<string, { cached: boolean; suggestion: unknown }> = {};
  for (const [code, r] of results.entries()) {
    out[code] = {
      cached: r.cached,
      suggestion: {
        summary:        r.suggestion.summary,
        suggestedFix:   r.suggestion.suggestedFix,
        suggestedTests: r.suggestion.suggestedTests,
        rootCause:      r.suggestion.rootCause,
        regressionRisk: r.suggestion.regressionRisk,
        modelId:        r.suggestion.modelId,
        provider:       r.suggestion.provider,
        latencyMs:      r.suggestion.latencyMs,
      },
    };
  }
  return NextResponse.json({ repo: `${owner}/${name}`, suggestions: out, generatedAt: new Date().toISOString() });
}
