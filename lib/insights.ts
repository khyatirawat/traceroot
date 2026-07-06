import type { RepoMeta, IssueData, PullData, CommitData, Contributor } from "@/lib/github";

export type Severity = "info" | "warn" | "alert";
export interface Insight {
  id: string;
  title: string;
  body: string;
  severity: Severity;
  category: string;
  metric?: number;
}

const CRITICAL_RX = /\b(critical|p0|severity-1|blocker|security|cve|vulnerability)\b/i;
const PERF_RX     = /\b(performance|perf|slow|latency|memory\s*leak|lags?|hang)\b/i;
const DOC_RX      = /\b(doc|documentation|readme|guide|typo|comment)\b/i;
const INCOMPLETE  = /\b(todo|fixme|hack|broken|fail|unstable)\b/i;
const RFCS_RX     = /\b(rfc|proposal|discussion|spec|design)\b/i;
const DRAFT_RX    = /\b(wip|draft|do not merge|do-not-merge|broken|rfc)\b/i;

function days(_d: string): number {
  return Math.max(0, (Date.now() - Date.parse(_d)) / 86_400_000);
}

export function generateInsights(
  repo:     RepoMeta,
  issues:   IssueData[],
  pulls:    PullData[],
  commits:  CommitData[],
  contribs: Contributor[],
): Insight[] {
  const insights: Insight[] = [];
  const now = Date.now();
  const open = issues.filter((i) => !i.pull_request && i.state === "open");
  const openPRs = pulls.filter((p) => p.state === "open");

  // 1. Authorization hotspot - issues that mention auth/security keywords
  const security = open.filter((i) => /\b(auth|oauth|authorization|login|password|token|permission|csrf|xss|injection)\b/i.test(i.title + " " + i.labels.map((l) => l.name).join(" ")));
  if (security.length >= 3) insights.push({
    id: "auth-hotspot",
    title: "Authentication & security hotspot",
    body: `Found ${security.length} open issues mentioning auth/oauth/CSRF/etc., with ${security.length} of them active in the last 30 days.`,
    severity: "alert",
    category: "security",
    metric: security.length,
  });

  // 2. Performance backlog
  const perf = open.filter((i) => PERF_RX.test(i.title + " " + i.labels.map((l) => l.name).join(" ")));
  if (perf.length >= 2) insights.push({
    id: "perf-backlog",
    title: "Performance backlog",
    body: `${perf.length} open performance-related issues. Prioritize the highest-voted ones before the next release.`,
    severity: perf.length >= 5 ? "alert" : "warn",
    category: "performance",
    metric: perf.length,
  });

  // 3. Doc debt
  const doc = open.filter((i) => DOC_RX.test(i.title + " " + i.labels.map((l) => l.name).join(" ")));
  if (doc.length >= 3) insights.push({
    id: "doc-debt",
    title: "Documentation debt",
    body: `${doc.length} open docs issues. Allocate a docs day each sprint.`,
    severity: "warn",
    category: "docs",
    metric: doc.length,
  });

  // 4. Stale issues - open > 180 days, no recent activity
  const stale = open.filter((i) => days(i.updated_at) > 180);
  if (stale.length > 0) insights.push({
    id: "stale-issues",
    title: `${stale.length} stale issue${stale.length === 1 ? "" : "s"}`,
    body: `Open issues not updated in over 180 days — triage them: close, label as wontfix, or revive.`,
    severity: stale.length > 10 ? "alert" : "warn",
    category: "triage",
    metric: stale.length,
  });

  // 5. Issue spike - open > closed in last 6 weeks
  const lastClosed = issues.filter((i) => i.state === "closed" && i.closed_at && days(i.closed_at) <= 42).length;
  const recentOpened = open.filter((i) => days(i.created_at) <= 42).length;
  if (recentOpened > lastClosed * 1.4 && recentOpened >= 5) insights.push({
    id: "issue-spike",
    title: "Open issue rate exceeds close rate",
    body: `${recentOpened} new issues in the last 6 weeks vs ${lastClosed} closed. Backlog is growing — consider a mid-cycle cleanup sprint.`,
    severity: "warn",
    category: "velocity",
    metric: recentOpened - lastClosed,
  });

  // 6. PR risk - large rebases, stale PRs, draft pile-up
  const stalePRs = openPRs.filter((p) => days(p.updated_at) > 30);
  const draftPRs = openPRs.filter((p) => p.draft);
  if (stalePRs.length > 0) insights.push({
    id: "stale-prs",
    title: `${stalePRs.length} open PR${stalePRs.length === 1 ? "" : "s"} idle for 30+ days`,
    body: `Idle PRs grow merge conflict risk. Review, fast-track, or close them.`,
    severity: stalePRs.length > 5 ? "alert" : "warn",
    category: "review",
    metric: stalePRs.length,
  });
  if (draftPRs.length >= 5) insights.push({
    id: "draft-prs",
    title: `${draftPRs.length} draft PRs`,
    body: `Lots of drafts is normal but if they're in progress for >3 months, hoist or split them.`,
    severity: "info",
    category: "review",
    metric: draftPRs.length,
  });

  // 7. Bus factor - 1 contributor dominating
  if (contribs.length > 0) {
    const total = contribs.reduce((s, c) => s + c.contributions, 0);
    const top = contribs[0]!.contributions;
    if (top / Math.max(1, total) > 0.6 && contribs.length >= 3) insights.push({
      id: "bus-factor",
      title: "Bus-factor risk",
      body: `${contribs[0]!.login} owns ${Math.round((top / total) * 100)}% of all contributions. Encourage rotation of ownership on key modules.`,
      severity: "alert",
      category: "team",
      metric: Math.round((top / total) * 100),
    });
  }

  // 8. Churn - commit volume
  const totalAdds = commits.reduce((s, c) => s + (c.stats?.additions ?? 0), 0);
  const totalDels = commits.reduce((s, c) => s + (c.stats?.deletions ?? 0), 0);
  const ratio = totalDels / Math.max(1, totalAdds);
  if (ratio > 1.4 && commits.length >= 5) insights.push({
    id: "churn-warning",
    title: "High code churn",
    body: `${totalDels.toLocaleString()} deletions vs ${totalAdds.toLocaleString()} additions across the last ${commits.length} commits. Watch for over-aggressive refactors.`,
    severity: "warn",
    category: "quality",
    metric: ratio,
  });

  // 9. Incomplete code signals - issues flagged with incomplete markers
  const incomplete = open.filter((i) => INCOMPLETE.test(i.title + " " + i.labels.map((l) => l.name).join(" ")));
  if (incomplete.length >= 2) insights.push({
    id: "incomplete-signals",
    title: "Incomplete code signals",
    body: `${incomplete.length} issues mention TODO/FIXME/hack — that's front-loaded technical debt. Schedule a hardening pass.`,
    severity: "warn",
    category: "quality",
    metric: incomplete.length,
  });

  // 10. RFC pile-up
  const rfcs = open.filter((i) => RFCS_RX.test(i.title + " " + i.labels.map((l) => l.name).join(" ")));
  if (rfcs.length >= 5) insights.push({
    id: "rfc-pileup",
    title: "RFC pile-up",
    body: `${rfcs.length} open RFC/discussion threads. Move decisions into actionable tasks to keep waiters from churning.`,
    severity: "info",
    category: "process",
    metric: rfcs.length,
  });

  // 11. Critical issue backlog
  const critical = open.filter((i) => i.labels.some((l) => CRITICAL_RX.test(l.name) || CRITICAL_RX.test(i.title)));
  if (critical.length >= 1) insights.push({
    id: "critical-backlog",
    title: `${critical.length} critical / security issue${critical.length === 1 ? "" : "s"}`,
    body: `Triage critical issues ahead of any release; block release on any unfixed critical.`,
    severity: "alert",
    category: "security",
    metric: critical.length,
  });

  // 12. Repo archived / license missing
  if (repo.archived) insights.push({
    id: "archived",
    title: "Repository is archived",
    body: "This repo is archived. Expect longer response times on issues.",
    severity: "info",
    category: "meta",
  });
  if (!repo.license) insights.push({
    id: "no-license",
    title: "No software license detected",
    body: "Adding a license clarifies legal terms for contributors and downstream users.",
    severity: "warn",
    category: "meta",
  });

  // Sort by severity (alert first) then numerically for stability
  const order = { alert: 0, warn: 1, info: 2 } as const;
  insights.sort((a, b) => order[a.severity] - order[b.severity] || (a.metric ?? 0) - (b.metric ?? 0));
  return insights;
}
