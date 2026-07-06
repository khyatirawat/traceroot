import { Star, GitFork, AlertCircle, GitPullRequest, Lock, Globe2, Eye, Archive } from "lucide-react";
import { ExternalLink } from "@/components/ui";
import type { RepoMeta } from "@/lib/github";
import { num } from "@/lib/formatters";

export function RepoHeader({ r }: { r: RepoMeta }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border bg-panel px-5 py-4">
      <div>
        <p className="flex items-center gap-1 text-xs text-text-dim">
          <ExternalLink href={`https://github.com/${r.owner.login}`}>{r.owner.login}</ExternalLink>
          <span>/</span>
        </p>
        <h1 className="text-2xl font-semibold leading-tight">
          <ExternalLink href={r.html_url}>{r.name}</ExternalLink>
        </h1>
        {r.description ? <p className="mt-1 max-w-2xl text-sm text-text-muted">{r.description}</p> : null}
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
          {r.language ? <span className="rounded-md border border-border bg-bg-elevated px-1.5 py-0.5 text-text-muted">{r.language}</span> : null}
          {r.license ? <span className="rounded-md border border-border bg-bg-elevated px-1.5 py-0.5 text-text-muted">{r.license.spdx_id}</span> : <span className="rounded-md border border-warn bg-bg-elevated px-1.5 py-0.5 text-warn">no license</span>}
          {r.archived ? <span className="inline-flex items-center gap-1 rounded-md border border-warn bg-bg-elevated px-1.5 py-0.5 text-warn"><Archive className="h-3 w-3" /> archived</span> : null}
          {r.private ? <span className="inline-flex items-center gap-1 rounded-md border border-border bg-bg-elevated px-1.5 py-0.5 text-text-muted"><Lock className="h-3 w-3" /> private</span> : <span className="inline-flex items-center gap-1 rounded-md border border-border bg-bg-elevated px-1.5 py-0.5 text-accent"><Globe2 className="h-3 w-3" /> public</span>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs">
        <Stat icon={<Star className="h-3.5 w-3.5 text-warn" />} label="stars" value={num(r.stargazers_count)} />
        <Stat icon={<GitFork className="h-3.5 w-3.5" />} label="forks" value={num(r.forks_count)} />
        <Stat icon={<Eye className="h-3.5 w-3.5" />} label="watchers" value={num(r.watchers_count)} />
        <Stat icon={<AlertCircle className="h-3.5 w-3.5 text-warn" />} label="open issues" value={num(r.open_issues_count)} />
        <Stat icon={<GitPullRequest className="h-3.5 w-3.5 text-accent" />} label="default" value={r.default_branch} />
      </div>
    </div>
  );
}
function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-bg-elevated px-2 py-1">
      {icon} <span className="font-semibold text-text">{value}</span><span className="text-text-dim">{label}</span>
    </span>
  );
}
