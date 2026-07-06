import { notFound } from "next/navigation";
import { getRepo, getRecentIssues, getRecentPulls, getRecentCommits, getContributors, getReleases, getLanguages, GithubError } from "@/lib/github";
import { generateInsights } from "@/lib/insights";
import { releaseReadiness } from "@/lib/release-score";
import { actionItemsFromData } from "@/lib/action-items";
import { alertsFromInsights } from "@/lib/alerts";
import { runAnalytics } from "@/lib/analytics";
import { generateFixes } from "@/lib/fix-generator";
import { RepoHeader } from "@/components/repo-header";
import { Panel, SectionHeader, Pill, ExternalLink } from "@/components/ui";
import { Sparkline, Donut, ReleaseGauge } from "@/components/charts";
import { StatCard } from "@/components/stat-card";
import { InsightCard } from "@/components/insight-card";
import { AlertCard } from "@/components/alert-card";
import { VerdictCard } from "@/components/verdict-card";
import { IssuesInsights } from "@/components/issues-insights";
import { PRInsights } from "@/components/pr-insights";
import { ContributorsInsights } from "@/components/contributors-insights";
import { ActivityTrends } from "@/components/activity-trends";
import { CodebaseSignals } from "@/components/codebase-signals";
import { SecurityPanel } from "@/components/security-panel";
import { LanguageBar } from "@/components/language-bar";
import { ShareButton } from "@/components/share-button";
import { SaveToggle } from "@/components/save-toggle";
import { DownloadReport } from "@/components/download-report";
import { ViewedTracker } from "@/components/viewed-tracker";
import { FixCard } from "@/components/fix-card";
import { RepoTabs } from "./repo-tabs";
import { AiInsightBlock } from "./ai-insight-block";
import { InsightsEmitter } from "./insights-emitter";
import { currentUser } from "@/lib/auth";
import { num, relTime, pct } from "@/lib/formatters";

interface Props { params: Promise<{ owner: string; name: string }>; }
export async function generateMetadata({ params }: Props) { const { owner, name } = await params; return { title: `${owner}/${name}` }; }


function Section({ title, children, dark }: { title?: string; children: React.ReactNode; dark?: boolean }) {
  return (
    <section className={dark ? "rounded-xl border border-[#252836] bg-[#131826] p-5" : "rounded-xl border border-border bg-white p-5 shadow-sm"}>
      {title && <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-dim">{title}</h2>}
      {children}
    </section>
  );
}

export default async function RepoPage({ params }: Props) {
  const { owner, name } = await params;
  let r;
  try { r = await getRepo({ owner, name, fullName: `${owner}/${name}` }); }
  catch (e) { if (e instanceof GithubError) return notFound(); throw e; }

  const [issues, pulls, commits, contribs, releases, langs] = await Promise.all([
    getRecentIssues({ owner, name, fullName: r.full_name }),
    getRecentPulls({ owner, name, fullName: r.full_name }),
    getRecentCommits({ owner, name, fullName: r.full_name }),
    getContributors({ owner, name, fullName: r.full_name }).catch(() => []),
    getReleases({ owner, name, fullName: r.full_name }).catch(() => []),
    getLanguages({ owner, name, fullName: r.full_name }).catch(() => ({} as Record<string, number>)),
  ]);

  const openIssues = issues.filter((i) => i.state === "open" && !i.pull_request);
  const closedIssues = issues.filter((i) => i.state === "closed" && !i.pull_request);
  const openPulls = pulls.filter((p) => p.state === "open");
  const criticalIssues = openIssues.filter((i) => i.labels.some((l) => /critical|p0|severity-1|blocker/i.test(l.name))).length;

  const me = await currentUser();
  const insights = generateInsights(r, issues, pulls, commits, contribs);
  const releaseScore = releaseReadiness({ openCriticalIssues: criticalIssues, openIssues: openIssues.length, recentCommits: commits, insights });
  const actionItems = actionItemsFromData(issues, pulls);
  const alerts = alertsFromInsights(r, insights);
  const analytics = runAnalytics(r, issues, pulls, commits, contribs);
  const fixes = generateFixes(analytics.clusteredIssues, analytics.codebaseSignals);

  const BUG = /bug|defect|fix|crash/i, FEAT = /enhancement|feature|proposal/i, DOC = /doc|readme|guide/i, QST = /question|help/i;
  let bug = 0, feat = 0, doc = 0, qst = 0, other = 0;
  for (const i of openIssues) { const lbl = i.labels.map((l) => l.name).join(" "); if (BUG.test(lbl)) bug++; else if (FEAT.test(lbl)) feat++; else if (DOC.test(lbl)) doc++; else if (QST.test(lbl)) qst++; else other++; }
  const donut = [{ label: "bug", value: bug, color: "#c94040" }, { label: "feature", value: feat, color: "#2d8659" }, { label: "docs", value: doc, color: "#6d5cae" }, { label: "question", value: qst, color: "#b8730a" }, { label: "other", value: other, color: "#8b95a5" }];

  const now = Date.now(); const sparkBuckets = new Array(30).fill(0);
  for (const c of commits) { const ts = Date.parse(c.commit?.author?.date ?? ""); if (Number.isNaN(ts)) continue; const d = Math.floor((now - ts) / 86_400_000); if (d >= 0 && d < 30) sparkBuckets[d]++; }
  sparkBuckets.reverse();

  const topContribs = [...contribs].sort((a, b) => b.contributions - a.contributions).slice(0, 6);
  const totalContribs = topContribs.reduce((s, c) => s + c.contributions, 0);
  const topMax = topContribs[0]?.contributions ?? 1;

  const reportData = { releaseReadiness: analytics.releaseReadiness, clusteredIssues: analytics.clusteredIssues, prRisks: analytics.prRisks, contributorAnalytics: analytics.contributorAnalytics, codebaseSignals: analytics.codebaseSignals, busFactor: analytics.busFactor };

  return (
    <div className="p-6 space-y-5">
      <ViewedTracker owner={owner} name={name} />
      <RepoHeader r={r} />
      <InsightsEmitter repo={{ owner, name }} insights={insights} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2"><SaveToggle owner={owner} name={name} /><ShareButton owner={owner} name={name} /></div>
        <DownloadReport owner={owner} name={name} data={reportData} />
      </div>
      <VerdictCard score={analytics.releaseReadiness.score} band={analytics.releaseReadiness.band} summary={analytics.releaseReadiness.summary} />
      <RepoTabs panels={{
        "overview": (<div className="space-y-4">
          <section className="rounded-xl border border-border bg-white p-5 shadow-sm"><h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-dim">AI Insights</h2><Panel><SectionHeader title="Insights" sub="Heuristics from open issues, PRs, commits and contributors." right={<span className="text-[11px] text-text-dim">{insights.length} detected</span>} />{insights.length === 0 ? <p className="px-5 py-4 text-xs text-text-muted">No signals detected.</p> : <div className="grid grid-cols-1 gap-2 px-5 py-4 md:grid-cols-2 lg:grid-cols-3">{insights.slice(0, 9).map((i) => <InsightCard key={i.id} i={i} />)}</div>}</Panel></section>
          <section className="rounded-xl border border-border bg-white p-5 shadow-sm"><h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-dim">Activity Overview</h2><div className="grid grid-cols-1 gap-4 lg:grid-cols-3 md:grid-cols-2">
            <Panel><SectionHeader title="Release readiness" /><ReleaseGauge score={releaseScore.score} band={releaseScore.band} /><ul className="border-t border-border divide-y divide-border">{releaseScore.factors.map((f) => <li key={f.name} className="flex items-center justify-between px-5 py-2 text-xs"><span className="text-text-muted">{f.name}</span><span className="text-text">{f.reason}</span></li>)}</ul></Panel>
            <Panel className="md:col-span-2 lg:col-span-2"><SectionHeader title="Pulse" /><div className="grid grid-cols-2 gap-3 px-5 py-4 md:grid-cols-4"><StatCard label="Open issues" value={openIssues.length} accent sub={`${criticalIssues} critical`} /><StatCard label="Closed (recent)" value={closedIssues.length} /><StatCard label="Open PRs" value={openPulls.length} /><StatCard label="Last commit" value={relTime(commits[0]?.commit?.author?.date ?? new Date().toISOString())} /></div><ul className="border-t border-border divide-y divide-border">{releases.slice(0, 4).map((rel) => <li key={rel.tag_name} className="flex items-center justify-between gap-3 px-5 py-2 text-xs"><ExternalLink href={rel.html_url}><code className="text-text-muted">{rel.tag_name}</code></ExternalLink><span className="truncate text-text-muted">{rel.name || "Release"}</span><Pill tone={rel.prerelease ? "warn" : "muted"}>{rel.prerelease ? "pre-release" : "stable"}</Pill><span className="text-text-dim">{relTime(rel.published_at)}</span></li>)}{releases.length === 0 ? <li className="px-5 py-3 text-xs text-text-muted">No published releases.</li> : null}</ul></Panel>
            <Panel className="lg:col-span-2 md:col-span-2"><SectionHeader title="Commits, last 30 days" /><div className="px-5 py-4"><Sparkline values={sparkBuckets} height={84} /><p className="mt-2 flex items-center justify-between text-xs text-text-muted"><span>{Math.min(commits.length, 30)} commits</span><span>peak {Math.max(0, ...sparkBuckets)}/day</span></p></div></Panel>
            <Panel><SectionHeader title="Open issues by type" /><Donut data={donut} /></Panel>
            <Panel><SectionHeader title="Languages" /><LanguageBar langs={langs} /></Panel>
            <Panel className="lg:col-span-2 md:col-span-2"><SectionHeader title="Top contributors" sub="Most active committers." /><ul className="divide-y divide-border">{topContribs.length === 0 ? <li className="px-5 py-4 text-xs text-text-muted">Contributors hidden by repository owner.</li> : topContribs.map((c) => <li key={c.login} className="px-5 py-3"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><img src={c.avatar_url} alt="" className="h-7 w-7 rounded-full border border-border" /><div><ExternalLink href={c.html_url}>{c.login}</ExternalLink><div className="text-[11px] text-text-dim">{num(c.contributions)} contributions</div></div></div><div className="text-[11px] text-text-dim">{pct(c.contributions, totalContribs)}</div></div><div className="mt-1 h-1 w-full overflow-hidden rounded bg-bg/80"><div className="h-full bg-accent" style={{ width: `${(c.contributions / Math.max(1, topMax)) * 100}%` }} /></div></li>)}</ul></Panel>
            <Panel><SectionHeader title="Recent commits" /><ul className="divide-y divide-border">{commits.slice(0, 10).map((c) => <li key={c.sha} className="flex items-start gap-3 px-5 py-3 text-sm"><code className="text-[11px] text-accent">{c.sha.slice(0, 7)}</code><div className="min-w-0 flex-1"><ExternalLink href={c.html_url}>{c.commit.message.split("\n")[0]}</ExternalLink><p className="text-[11px] text-text-dim">{c.commit.author?.name ?? c.author?.login ?? "ghost"} \u00b7 {relTime(c.commit.author?.date)}</p></div></li>)}</ul></Panel>
            {alerts.length > 0 && <Panel className="md:col-span-2 lg:col-span-3"><SectionHeader title="Alerts" sub={`${alerts.length} active`} /><div className="grid grid-cols-1 gap-2 px-5 py-4 md:grid-cols-2 lg:grid-cols-3">{alerts.slice(0, 6).map((a) => <AlertCard key={a.id} a={a} />)}</div></Panel>}
            <Panel className="md:col-span-2 lg:col-span-3"><SectionHeader title="Top action items" sub="Top 3 priorities." right={<ExternalLink href={`/dashboard/r/${owner}/${name}/action-items`}>view all</ExternalLink>} /><ul className="divide-y divide-border">{actionItems.slice(0, 3).map((it) => <li key={it.id} className="flex items-start gap-3 px-5 py-3 text-sm"><Pill tone={it.priority === "critical" ? "alert" : it.priority === "high" ? "warn" : "muted"}>{it.priority}</Pill><div className="flex-1"><ExternalLink href={it.href}>{it.title}</ExternalLink><p className="text-[11px] text-text-dim">{it.rationale}</p></div><Pill tone="muted">{it.kind}</Pill></li>)}{actionItems.length === 0 ? <li className="px-5 py-4 text-xs text-text-muted">No action items generated.</li> : null}</ul></Panel>
          </div>
        </section>
        </div>),
        "issues": <IssuesInsights issues={analytics.clusteredIssues} duplicates={analytics.duplicateGroups} />,
        "ai-suggestions": me ? <section className="max-w-6xl"><AiInsightBlock userId={me.id} insights={insights} ctx={{ repoOwner: owner, repoName: name, description: r.description ?? undefined, language: r.language ?? undefined, primaryFiles: analytics.codebaseSignals.map((s) => ({ path: s.path, riskScore: s.riskScore, reasons: s.reasons })).slice(0, 5) }} /></section> : <Panel><SectionHeader title="AI Suggestions" /><p className="px-5 py-4 text-sm text-text-muted">Log in to get AI-powered fix suggestions.</p></Panel>,
        "ai-fixes": (<div className="space-y-4"><Panel><SectionHeader title="AI Fix Engine" sub={`${fixes.length} fix proposals generated.`} /><div className="px-5 py-3 text-xs text-text-dim">Fixes are generated heuristically from issue classification, severity, and file linkage. Safe auto-fixes can be applied with preview.</div></Panel>{fixes.map((fix) => <FixCard key={fix.id} fix={fix} />)}{fixes.length === 0 && <Panel><SectionHeader title="No fixes to propose" /><p className="px-5 py-4 text-sm text-text-muted">No open issues to generate fixes for.</p></Panel>}</div>),
        "prs": <PRInsights prs={analytics.prRisks} />,
        "contributors": <ContributorsInsights contribs={analytics.contributorAnalytics} busFactor={analytics.busFactor} />,
        "activity": <ActivityTrends buckets={analytics.activityBuckets} />,
        "codebase": (<div className="space-y-4"><Panel><SectionHeader title="Language Breakdown" /><LanguageBar langs={langs} /></Panel><CodebaseSignals signals={analytics.codebaseSignals} /></div>),
        "security": <SecurityPanel issues={analytics.clusteredIssues} insights={insights} repoInfo={{ license: r.license?.spdx_id ?? null, archived: r.archived, disabled: r.disabled }} />,
      }} />
      <Panel className="text-xs text-text-dim"><SectionHeader title="Metadata" /><ul className="grid grid-cols-1 gap-1 px-5 py-4 sm:grid-cols-2 md:grid-cols-3"><li>Created: <span className="text-text-muted">{new Date(r.created_at).toLocaleDateString()}</span></li><li>Last push: <span className="text-text-muted">{new Date(r.pushed_at).toLocaleDateString()}</span></li><li>Last update: <span className="text-text-muted">{new Date(r.updated_at).toLocaleDateString()}</span></li><li>Size: <span className="text-text-muted">{(r.size ?? 0).toLocaleString()} KB</span></li><li>Topics: <span className="text-text-muted">{(r.topics ?? []).join(", ") || "\u2014"}</span></li><li>License: <span className="text-text-muted">{r.license?.spdx_id ?? "\u2014"}</span></li></ul></Panel>
      <p className="text-xs text-text-dim text-center">Data from <ExternalLink href={`https://github.com/${r.full_name}`}>github.com/{r.full_name}</ExternalLink>.</p>
    </div>
  );
}
