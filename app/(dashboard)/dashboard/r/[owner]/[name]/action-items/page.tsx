import { notFound } from "next/navigation";
import { getRepo, getRecentIssues, getRecentPulls, GithubError } from "@/lib/github";
import { RepoHeader } from "@/components/repo-header";
import { Panel, SectionHeader, ExternalLink, Pill } from "@/components/ui";
import { RepoTabs } from "../repo-tabs";
import { RepoActions } from "../repo-actions";
import { actionItemsFromData } from "@/lib/action-items";
interface Props { params: Promise<{ owner: string; name: string }>; }

export default async function ActionItemsPage({ params }: Props) {
  const { owner, name } = await params;
  let r;
  try { r = await getRepo({ owner, name, fullName: `${owner}/${name}` }); } catch (e) { if (e instanceof GithubError) return notFound(); throw e; }
  const [issues, pulls] = await Promise.all([
    getRecentIssues({ owner, name, fullName: r.full_name }),
    getRecentPulls({ owner, name, fullName: r.full_name }),
  ]);
  const items = actionItemsFromData(issues, pulls);
  const grouped = { critical: [], high: [], medium: [] } as Record<string, typeof items>;
  for (const it of items) grouped[it.priority]!.push(it);

  function Block({ title, list, tone }: { title: string; list: typeof items; tone: "alert" | "warn" | "muted" }) {
    return (
      <Panel>
        <SectionHeader title={title} sub={`${list.length} item${list.length === 1 ? "" : "s"}`} />
        <ul className="divide-y divide-border">
          {list.length === 0 ? <li className="px-5 py-4 text-xs text-text-muted">Nothing here.</li> : null}
          {list.map((it) => (
            <li key={it.id} className="flex items-start gap-3 px-5 py-3 text-sm">
              <Pill tone={tone}>{it.priority}</Pill>
              <div className="flex-1">
                <ExternalLink href={it.href}>{it.title}</ExternalLink>
                <p className="text-[11px] text-text-dim">{it.rationale}</p>
              </div>
              <Pill tone="muted">{it.kind}</Pill>
            </li>
          ))}
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
      <div className="grid grid-cols-1 gap-4">
        <Block title="Critical" list={grouped.critical!} tone="alert" />
        <Block title="High"     list={grouped.high!}     tone="warn"  />
        <Block title="Medium"   list={grouped.medium!}   tone="muted" />
      </div>
      <p className="text-xs text-text-dim text-center">Items generated from open issues and PRs as of the last GitHub update.</p>
    </div>
  );
}
