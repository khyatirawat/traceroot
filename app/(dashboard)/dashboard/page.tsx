import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { savedRepos } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Panel, SectionHeader, Pill } from "@/components/ui";
import { RepoLookup } from "./repo-lookup"
import { RecentlyViewed } from "@/components/recently-viewed";

export default async function DashboardPage() {
  const me = await currentUser();
  const repos = await db.select().from(savedRepos).where(eq(savedRepos.userId, me!.id)).orderBy(desc(savedRepos.lastViewedAt));

  const SUGGEST = [
    ["facebook/react", "react"],
    ["vercel/next.js", "next.js"],
    ["microsoft/typescript", "typescript"],
    ["denoland/deno", "deno"],
    ["tokio-rs/tokio", "tokio"],
    ["python/cpython", "cpython"],
  ];

  return (
    <div className="p-6">
      <div className="mb-4">
        <p className="text-xs text-text-dim">Welcome back, <span className="text-text">{me!.name}</span></p>
        <h1 className="mt-0.5 text-2xl font-semibold">Your repos</h1>
      </div>

      <Panel className="mb-6">
        <SectionHeader title="Add a public repo" sub="Paste any github.com/owner/name URL or owner/name. We fetch metadata, issues, PRs and commits in real time." />
        <div className="px-5 py-4"><RepoLookup /></div>
      </Panel>

      {repos.length === 0 ? (
        <Panel>
          <SectionHeader title="No saved repos yet" />
          <p className="px-5 py-4 text-sm text-text-muted">
            Try one of these:{" "}
            {SUGGEST.map(([pair, label], i, a) => (
              <span key={pair}>
                <Link href={`/dashboard/r/${pair}`} className="text-accent hover:underline">{label}</Link>
                {i < a.length - 1 ? " · " : ""}
              </span>
            ))}
          </p>
        </Panel>
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {repos.map((r) => (
            <li key={r.id}>
              <Link href={`/dashboard/r/${r.owner}/${r.name}`}
                className="group block rounded-xl border border-border bg-panel p-4 transition-colors hover:bg-panel-hover">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-text-dim">{r.owner}</p>
                    <h3 className="text-base font-semibold text-text">{r.name}</h3>
                  </div>
                  <Pill tone="muted">saved</Pill>
                </div>
                <p className="mt-1 text-xs text-text-dim">Last viewed {new Date(r.lastViewedAt).toLocaleDateString()}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
