import type { Insight } from "@/lib/insights";
import type { CommitData } from "@/lib/github";

export interface ReleaseFactor { name: string; reason: string; }
export interface ReleaseScore  { score: number; band: "safe" | "moderate" | "high-risk"; factors: ReleaseFactor[]; }

interface Input {
  openCriticalIssues: number;
  openIssues: number;
  recentCommits: CommitData[];
  insights: Insight[];
}

export function releaseReadiness(input: Input): ReleaseScore {
  let score = 100;
  const factors: ReleaseFactor[] = [];

  const alerts   = input.insights.filter((i) => i.severity === "alert").length;
  const warns    = input.insights.filter((i) => i.severity === "warn").length;
  const critFactor = Math.min(40, input.openCriticalIssues * 12);
  const issueFactor = Math.min(15, Math.max(0, input.openIssues - 20) * 0.5);
  const insightFactor = Math.min(35, alerts * 9 + warns * 19);

  if (input.openCriticalIssues > 0) factors.push({ name: "Critical issues", reason: `${input.openCriticalIssues} open, -${critFactor}` });
  if (input.openIssues > 20) factors.push({ name: "Issue backlog", reason: `${input.openIssues} open, -${issueFactor}` });
  if (alerts > 0) factors.push({ name: "Severity: alert", reason: `${alerts} flagged, -${alerts * 9}` });
  if (warns > 0)  factors.push({ name: "Severity: warn",  reason: `${warns} flagged, -${warns * 5}` });

  const additions = input.recentCommits.reduce((s, c) => s + (c.stats?.additions ?? 0), 0);
  const churnPenalty = Math.min(10, Math.max(0, additionRatio(additions) - 0.9) * 25);
  if (churnPenalty > 0) factors.push({ name: "Recent churn", reason: `large diff size, -${Math.round(churnPenalty)}` });

  score -= critFactor + issueFactor + insightFactor + churnPenalty;
  score = Math.max(0, Math.min(100, Math.round(score)));

  let band: ReleaseScore["band"] = "safe";
  if (score < 70) band = "moderate";
  if (score < 50) band = "high-risk";

  if (factors.length === 0) factors.push({ name: "Clean", reason: "no material risk signals" });
  return { score, band, factors };
}

function additionRatio(adds: number): number {
  // Heuristic: 1 commit ~ 300 adds ⇒ ratio=1
  return adds / 300;
}
