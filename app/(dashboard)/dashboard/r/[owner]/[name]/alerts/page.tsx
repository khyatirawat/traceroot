import { notFound } from "next/navigation";
import { getRepo, getRecentIssues, getRecentPulls, getRecentCommits, getContributors, GithubError } from "@/lib/github";
import { RepoHeader } from "@/components/repo-header";
import { Panel, SectionHeader, ExternalLink } from "@/components/ui";
import { RepoTabs } from "../repo-tabs";
import { RepoActions } from "../repo-actions";
import { generateInsights } from "@/lib/insights";
import { alertsFromInsights } from "@/lib/alerts";
import { AlertCard } from "@/components/alert-card";
interface Props { params: Promise<{ owner: string; name: string }>; }

export default async function AlertsPage({ params }: Props) {
  const { owner, name } = await params;
  let r;
  try { r = await getRepo({ owner, name, fullName: `${owner}/${name}` }); } catch (e) { if (e instanceof GithubError) return notFound(); throw e; }
  const [issues, pulls, commits, contribs] = await Promise.all([
    getRecentIssues({ owner, name, fullName: r.full_name }),
    getRecentPulls({ owner, name, fullName: r.full_name }),
    getRecentCommits({ owner, name, fullName: r.full_name }),
    getContributors({ owner, name, fullName: r.full_name }).catch(() => []),
  ]);
  const insights = generateInsights(r, issues, pulls, commits, contribs);
  const alerts = alertsFromInsights(r, insights);

  return (
    <div className="p-6 space-y-5">
      <RepoHeader r={r} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <RepoTabs owner={owner} name={name} />
        <RepoActions owner={owner} name={name} />
      </div>

      {alerts.length === 0 ? (
        <Panel>
          <SectionHeader title="No active alerts" />
          <p className="px-5 py-4 text-sm text-text-muted">
            All heuristic checks passed. <ExternalLink href={`https://github.com/${r.full_name}`}>View on GitHub</ExternalLink>
          </p>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {alerts.map((a) => <AlertCard key={a.id} a={a} />)}
        </div>
      )}

      {insights.filter((i) => i.severity === "info").length > 0 ? (
        <Panel>
          <SectionHeader title="Informational signals" sub="Below threshold but worth keeping an eye on." />
          <ul className="divide-y divide-border">
            {insights.filter((i) => i.severity === "info").map((i) => (
              <li key={i.id} className="px-5 py-3 text-sm">
                <p className="font-medium text-text">{i.title}</p>
                <p className="text-[11px] text-text-dim">{i.body}</p>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <p className="text-center text-xs text-text-dim">
        Severity: <code className="text-warn">warn</code> = needs attention · <code className="text-error">alert</code> = positively heuristic-flagged.
      </p>
    </div>
  );
}
