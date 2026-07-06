"use client";
import type { IssueData, PullData, CommitData, Contributor, RepoMeta, ReleaseData } from "@/lib/github";
import type { Insight } from "@/lib/insights";
import type { ReleaseScore } from "@/lib/release-score";
import type { ActionItem } from "@/lib/action-items";
import type { Alert } from "@/lib/alerts";
import { Panel, SectionHeader, Pill, ExternalLink } from "@/components/ui";
import { Sparkline, Donut, ReleaseGauge } from "@/components/charts";
import { StatCard } from "@/components/stat-card";
import { InsightCard } from "@/components/insight-card";
import { AlertCard } from "@/components/alert-card";
import { num, relTime, pct } from "@/lib/formatters";

interface Props {
  repo: RepoMeta; issues: IssueData[]; pulls: PullData[]; commits: CommitData[];
  contribs: Contributor[]; releases: ReleaseData[]; insights: Insight[];
  releaseScore: ReleaseScore; alerts: Alert[]; actionItems: ActionItem[];
  openIssuesCount: number; closedIssuesCount: number; openPullsCount: number; criticalIssuesCount: number;
}

const BUG=/bug|defect|fix|crash/i, FEAT=/enhancement|feature|proposal/i, DOC=/doc|readme|guide|migration/i, QST=/question|help/i;

export function OverviewPanel(p: Props) {
  const now = Date.now();
  const buckets = new Array(30).fill(0);
  for (const c of p.commits) {
    const ts = Date.parse(c.commit?.author?.date ?? "");
    if (Number.isNaN(ts)) continue;
    const d = Math.floor((now - ts) / 86_400_000);
    if (d >= 0 && d < 30) buckets[d]++;
  }
  buckets.reverse();

  let bug = 0, feat = 0, doc = 0, qst = 0, other = 0;
  for (const i of p.issues) {
    if (i.pull_request) continue;
    if (i.state !== "open") continue;
    const lbl = i.labels.map((l) => l.name).join(" ");
    if (BUG.test(lbl)) bug++;
    else if (FEAT.test(lbl)) feat++;
    else if (DOC.test(lbl)) doc++;
    else if (QST.test(lbl)) qst++;
    else other++;
  }
  const donut = [
    { label: "bug",      value: bug,   color: "#c94040" },
    { label: "feature",  value: feat,  color: "#2d8659" },
    { label: "docs",     value: doc,   color: "#6d5cae" },
    { label: "question", value: qst,   color: "#b8730a" },
    { label: "other",    value: other, color: "#8b95a5" },
  ];

  const topContributors = [...p.contribs].sort((a, b) => b.contributions - a.contributions).slice(0, 6);
  const totalContribs = topContributors.reduce((s, c) => s + c.contributions, 0);
  const topMax = topContributors[0]?.contributions ?? 1;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 md:grid-cols-2">
      <Panel className="lg:col-span-3 md:col-span-2">
        <SectionHeader title="Insights" sub="Heuristics from open issues, PRs, commits and contributors."
                       right={<span className="text-[11px] text-text-dim">{p.insights.length} detected</span>} />
        {p.insights.length === 0 ? (
          <p className="px-5 py-4 text-xs text-text-muted">No signals detected — repo looks healthy.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 px-5 py-4 md:grid-cols-2 lg:grid-cols-3">
            {p.insights.slice(0, 9).map((i) => <InsightCard key={i.id} i={i} />)}
          </div>
        )}
      </Panel>

      <Panel>
        <SectionHeader title="Release readiness" sub="0–100 score from critical issues, churn, and signal severity." />
        <ReleaseGauge score={p.releaseScore.score} band={p.releaseScore.band} />
        <ul className="border-t border-border divide-y divide-border">
          {p.releaseScore.factors.map((f) => (
            <li key={f.name} className="flex items-center justify-between px-5 py-2 text-xs">
              <span className="text-text-muted">{f.name}</span>
              <span className="text-text">{f.reason}</span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel className="md:col-span-2 lg:col-span-2">
        <SectionHeader title="Pulse" />
        <div className="grid grid-cols-2 gap-3 px-5 py-4 md:grid-cols-4">
          <StatCard label="Open issues"      value={p.openIssuesCount} accent sub={`${p.criticalIssuesCount} critical`} />
          <StatCard label="Closed (recent)"  value={p.closedIssuesCount} />
          <StatCard label="Open PRs"         value={p.openPullsCount} />
          <StatCard label="Last commit"      value={relTime(p.commits[0]?.commit?.author?.date ?? new Date().toISOString())} />
        </div>
        <ul className="border-t border-border divide-y divide-border">
          {p.releases.slice(0, 4).map((rel) => (
            <li key={rel.tag_name} className="flex items-center justify-between gap-3 px-5 py-2 text-xs">
              <ExternalLink href={rel.html_url}><code className="text-text-muted">{rel.tag_name}</code></ExternalLink>
              <span className="truncate text-text-muted">{rel.name || "Release"}</span>
              <Pill tone={rel.prerelease ? "warn" : "muted"}>{rel.prerelease ? "pre-release" : "stable"}</Pill>
              <span className="text-text-dim">{relTime(rel.published_at)}</span>
            </li>
          ))}
          {p.releases.length === 0 ? <li className="px-5 py-3 text-xs text-text-muted">No published releases.</li> : null}
        </ul>
      </Panel>

      <Panel className="lg:col-span-2 md:col-span-2">
        <SectionHeader title="Commits, last 30 days" sub="Up to 30 most recent commits, bucketed by day." />
        <div className="px-5 py-4">
          <Sparkline values={buckets} height={84} />
          <p className="mt-2 flex items-center justify-between text-xs text-text-muted">
            <span>{Math.min(p.commits.length, 30)} commits shown · {p.commits.reduce((s, c) => s + (c.stats?.additions ?? 0), 0).toLocaleString()} lines added total</span>
            <span>peak {Math.max(0, ...buckets)} commits/day</span>
          </p>
        </div>
      </Panel>

      <Panel>
        <SectionHeader title="Open issues by type" sub="First 20 open issues; labels-first classification." />
        <Donut data={donut} />
      </Panel>

      <Panel className="lg:col-span-3 md:col-span-2">
        <SectionHeader title="Top contributors" sub="Most active committers by contribution count." />
        <ul className="divide-y divide-border">
          {topContributors.length === 0 ? (
            <li className="px-5 py-4 text-xs text-text-muted">Contributors hidden by repository owner.</li>
          ) : topContributors.map((c) => (
            <li key={c.login} className="px-5 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={c.avatar_url} alt="" className="h-7 w-7 rounded-full border border-border" />
                  <div>
                    <ExternalLink href={c.html_url}>{c.login}</ExternalLink>
                    <div className="text-[11px] text-text-dim">{num(c.contributions)} contributions</div>
                  </div>
                </div>
                <div className="text-[11px] text-text-dim">{pct(c.contributions, totalContribs)}</div>
              </div>
              <div className="mt-1 h-1 w-full overflow-hidden rounded bg-bg/80">
                <div className="h-full bg-accent" style={{ width: `${(c.contributions / Math.max(1, topMax)) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel className="lg:col-span-2 md:col-span-2">
        <SectionHeader title="Recent issues & PRs" sub="Latest updates from GitHub." right={<ExternalLink href={`https://github.com/${p.repo.full_name}/issues`}>view all ↗</ExternalLink>} />
        <ul className="divide-y divide-border">
          {p.issues.slice(0, 10).map((i) => (
            <li key={i.number} className="flex items-start gap-3 px-5 py-3 text-sm">
              <span className={i.state === "open" ? "text-warn" : "text-accent"}>●</span>
              <div className="min-w-0 flex-1">
                <ExternalLink href={i.html_url}>#{i.number} {i.title}</ExternalLink>
                <p className="text-[11px] text-text-dim">{i.user?.login ?? "ghost"} · {relTime(i.updated_at)} · {i.comments} comments</p>
              </div>
              <div className="hidden flex-wrap items-center gap-1 sm:flex">
                {i.labels.slice(0, 3).map((l) => <Pill key={l.name} className="capitalize" tone="muted">{l.name}</Pill>)}
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel>
        <SectionHeader title="Recent commits" />
        <ul className="divide-y divide-border">
          {p.commits.slice(0, 10).map((c) => (
            <li key={c.sha} className="flex items-start gap-3 px-5 py-3 text-sm">
              <code className="text-[11px] text-accent">{c.sha.slice(0, 7)}</code>
              <div className="min-w-0 flex-1">
                <ExternalLink href={c.html_url}>{c.commit.message.split("\n")[0]}</ExternalLink>
                <p className="text-[11px] text-text-dim">{c.commit.author?.name ?? c.author?.login ?? "ghost"} · {relTime(c.commit.author?.date)}</p>
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel className="lg:col-span-2 md:col-span-2">
        <SectionHeader title="Active alerts" sub="Only warn/alert severity from the insight engine." />
        {p.alerts.length === 0 ? (
          <p className="px-5 py-4 text-xs text-text-muted">None.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 px-5 py-4 md:grid-cols-2">
            {p.alerts.map((a) => <AlertCard key={a.id} a={a} />)}
          </div>
        )}
      </Panel>

      <Panel className="md:col-span-2 lg:col-span-3">
        <SectionHeader title="Top action items" sub="Top 3 priorities from the action-items engine."
                       right={<ExternalLink href={`/dashboard/r/${p.repo.owner.login}/${p.repo.name}/action-items`}>view all ↗</ExternalLink>} />
        <ul className="divide-y divide-border">
          {p.actionItems.slice(0, 3).map((it) => (
            <li key={it.id} className="flex items-start gap-3 px-5 py-3 text-sm">
              <Pill tone={it.priority === "critical" ? "alert" : it.priority === "high" ? "warn" : "muted"}>{it.priority}</Pill>
              <div className="flex-1">
                <ExternalLink href={it.href}>{it.title}</ExternalLink>
                <p className="text-[11px] text-text-dim">{it.rationale}</p>
              </div>
              <Pill tone="muted">{it.kind}</Pill>
            </li>
          ))}
          {p.actionItems.length === 0 ? <li className="px-5 py-4 text-xs text-text-muted">No action items generated.</li> : null}
        </ul>
      </Panel>
    </div>
  );
}
