import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { getRepo, getRecentIssues, getRecentPulls, getRecentCommits, getContributors, getReleases, GithubError } from "@/lib/github";
import { generateInsights } from "@/lib/insights";
import { releaseReadiness } from "@/lib/release-score";
import { actionItemsFromData } from "@/lib/action-items";
import { alertsFromInsights } from "@/lib/alerts";

const Params = z.object({
  owner: z.string().min(1).max(64).regex(/^[A-Za-z0-9_.-]+$/),
  name:  z.string().min(1).max(128).regex(/^[A-Za-z0-9_.-]+$/),
});

export async function GET(_req: Request, ctx: { params: Promise<{ owner: string; name: string }> }) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const parsed = Params.safeParse(await ctx.params);
  if (!parsed.success) return NextResponse.json({ message: "Invalid owner/name" }, { status: 400 });
  const { owner, name } = parsed.data;
  try {
    const r = await getRepo({ owner, name, fullName: `${owner}/${name}` });
    const [issues, pulls, commits, contribs, releases] = await Promise.all([
      getRecentIssues({ owner, name, fullName: r.full_name }),
      getRecentPulls({ owner, name, fullName: r.full_name }),
      getRecentCommits({ owner, name, fullName: r.full_name }),
      getContributors({ owner, name, fullName: r.full_name }).catch(() => []),
      getReleases({ owner, name, fullName: r.full_name }).catch(() => []),
    ]);
    const openIssues = issues.filter((i) => i.state === "open" && !i.pull_request);
    const criticalIssues = openIssues.filter((i) => i.labels.some((l) => /critical|p0|severity-1|blocker/i.test(l.name))).length;
    const insights = generateInsights(r, issues, pulls, commits, contribs);
    const releaseScore = releaseReadiness({ openCriticalIssues: criticalIssues, openIssues: openIssues.length, recentCommits: commits, insights });
    const actionItems = actionItemsFromData(issues, pulls);
    const alerts = alertsFromInsights(r, insights);
    return NextResponse.json({ repo: r, issues, pulls, commits, contribs, releases, insights, releaseScore, actionItems, alerts });
  } catch (e) {
    if (e instanceof GithubError) return NextResponse.json({ message: e.message }, { status: e.status });
    return NextResponse.json({ message: (e as Error).message }, { status: 500 });
  }
}
