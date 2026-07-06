import { notFound } from "next/navigation";
import { getRepo, getRecentIssues, GithubError } from "@/lib/github";
import { RepoHeader } from "@/components/repo-header";
import { Panel, SectionHeader, ExternalLink, Pill } from "@/components/ui";
import { RepoTabs } from "../repo-tabs";
import { RepoActions } from "../repo-actions";
import { relTime } from "@/lib/formatters";
interface Props { params: Promise<{ owner: string; name: string }>; }

export default async function IssuesPage({ params }: Props) {
  const { owner, name } = await params;
  let r;
  try { r = await getRepo({ owner, name, fullName: `${owner}/${name}` }); } catch (e) { if (e instanceof GithubError) return notFound(); throw e; }
  const issues = await getRecentIssues({ owner, name, fullName: r.full_name });
  const real = issues.filter((i) => !i.pull_request);
  const pulls = issues.filter((i) => !!i.pull_request);
  const open   = (xs: typeof real) => xs.filter((i) => i.state === "open");
  const closed = (xs: typeof real) => xs.filter((i) => i.state === "closed");

  function Group({ title, list }: { title: string; list: typeof real }) {
    return (
      <Panel>
        <SectionHeader title={title} sub={`${list.length} items`} />
        <ul className="divide-y divide-border">
          {list.map((i) => (
            <li key={i.number} className="flex items-start gap-3 px-5 py-3 text-sm">
              <Pill tone={i.state === "open" ? "warn" : "ok"}>{i.state}</Pill>
              <div className="flex-1">
                <ExternalLink href={i.html_url}>#{i.number} {i.title}</ExternalLink>
                <p className="text-[11px] text-text-dim">{i.user?.login ?? "ghost"} · {relTime(i.updated_at)} · {i.comments} comments</p>
              </div>
              <div className="hidden flex-wrap items-center gap-1 sm:flex">
                {i.labels.slice(0, 4).map((l) => <Pill key={l.name} className="capitalize" tone="muted">{l.name}</Pill>)}
              </div>
            </li>
          ))}
          {list.length === 0 ? <li className="px-5 py-4 text-xs text-text-muted">No items in this group.</li> : null}
        </ul>
      </Panel>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <RepoHeader r={r} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <RepoTabs owner={owner} name={name} />
        <RepoActions owner={owner} name={name} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Group title="Open issues"   list={open(real)} />
        <Group title="Closed issues" list={closed(real)} />
        <Group title="Open PRs"      list={open(pulls)} />
        <Group title="Closed PRs"    list={closed(pulls)} />
      </div>
      <p className="text-center text-xs text-text-dim">
        Showing up to 20 most recently updated items. <ExternalLink href={`https://github.com/${r.full_name}/issues`}>view all on GitHub ↗</ExternalLink>
      </p>
    </div>
  );
}
