/**
 * Typed GitHub REST client + small in-process cache.
 * Exposes pure-data shapes (RepoMeta, IssueData, ...) the UI/heuristics consume.
 * Throws GithubError for upstream HTTP errors.
 */
export interface RepoMeta {
  id: number; full_name: string; name: string;
  owner: { login: string; avatar_url: string; html_url: string };
  description: string | null;
  html_url: string; stargazers_count: number; watchers_count: number;
  forks_count: number; open_issues_count: number;
  default_branch: string;
  language: string | null; archived: boolean; disabled: boolean;
  size: number; topics?: string[];
  license: { spdx_id: string; name: string } | null;
  created_at: string; updated_at: string; pushed_at: string;
  stargazers_url?: string; contributors_url?: string;
}
export interface IssueData {
  number: number; title: string; state: "open" | "closed";
  html_url: string; created_at: string; updated_at: string; closed_at: string | null;
  comments: number;
  user: { login: string; avatar_url: string; html_url: string } | null;
  labels: { name: string; color: string }[];
  pull_request?: unknown;
}
export interface PullData {
  number: number; title: string; state: "open" | "closed";
  html_url: string; created_at: string; updated_at: string;
  user: { login: string; html_url: string } | null;
  draft?: boolean; merged_at?: string | null;
}
export interface CommitData {
  sha: string; html_url: string;
  commit: { message: string; author: { name: string; date: string; email: string } | null; committer: { name: string; date: string } | null } | null;
  author: { login: string; html_url: string } | null;
  stats?: { additions?: number; deletions?: number; total?: number };
}
export interface Contributor { login: string; avatar_url: string; html_url: string; contributions: number; }
export interface ReleaseData { tag_name: string; name: string; html_url: string; published_at: string; prerelease: boolean; }

export class GithubError extends Error {
  constructor(message: string, public status: number) { super(message); this.name = "GithubError"; }
}

const BASE = "https://api.github.com";
const TTL_MS = 60_000;
const cache = new Map<string, { expires: number; value: unknown }>();
function ck<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return Promise.resolve(hit.value as T);
  return fn().then((v) => { cache.set(key, { expires: Date.now() + TTL_MS, value: v }); return v; });
}

function headers(): HeadersInit {
  const h: Record<string, string> = {
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "traceroot-dashboard/1.0",
  };
  if (process.env.GITHUB_TOKEN) h["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
}
async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: headers(), next: { revalidate: 0 } });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new GithubError(`GitHub ${res.status}: ${res.statusText} ${msg.slice(0, 240)}`, res.status);
  }
  return (await res.json()) as T;
}

export interface RefOpts { owner: string; name: string; fullName: string; pageSize?: number; }
function pages(ref: string, perPage = 30): string {
  return `${BASE}${ref}${ref.includes("?") ? "&" : "?"}per_page=${perPage}`;
}

export function getRepo(o: RefOpts): Promise<RepoMeta>              { return ck(`repo:${o.fullName}`,    () => getJson<RepoMeta>(pages(`/repos/${o.fullName}`))); }
export function getRecentIssues(o: RefOpts): Promise<IssueData[]>    { return ck(`issues:${o.fullName}`,  () => getJson<IssueData[]>(pages(`/repos/${o.fullName}/issues`))); }
export function getRecentPulls(o: RefOpts): Promise<PullData[]>      { return ck(`pulls:${o.fullName}`,   () => getJson<PullData[]>(pages(`/repos/${o.fullName}/pulls?state=all&sort=updated&direction=desc`))); }
export function getRecentCommits(o: RefOpts): Promise<CommitData[]>  { return ck(`commits:${o.fullName}`, () => getJson<CommitData[]>(pages(`/repos/${o.fullName}/commits`))); }
export function getContributors(o: RefOpts): Promise<Contributor[]>  { return ck(`contrib:${o.fullName}`, () => getJson<Contributor[]>(pages(`/repos/${o.fullName}/contributors?anon=true`))); }
export function getLanguages(o: RefOpts): Promise<Record<string, number>> { return ck(`langs:${o.fullName}`, () => getJson<Record<string, number>>(pages(`/repos/${o.fullName}/languages`))); }
export function getReleases(o: RefOpts): Promise<ReleaseData[]>      { return ck(`rels:${o.fullName}`,    () => getJson<ReleaseData[]>(pages(`/repos/${o.fullName}/releases?per_page=10`))); }

/** Pull the first line of the issue's body/title for adding inline previews. */
export function parseRepoUrl(s: string): { owner: string; name: string } | null {
  if (!s) return null;
  const trimmed = s.trim().replace(/^https?:\/\/(www\.)?github\.com\//i, "").replace(/^github\.com\//i, "").replace(/\.git$/, "");
  const m = trimmed.match(/^([\w.-]{1,64})\/([\w.-]{1,128})(?:\/.*)?$/);
  if (!m) return null;
  return { owner: m[1]!, name: m[2]! };
}
