import Link from "next/link";
import { GitBranch, Activity, ShieldAlert, Sparkles, Star, Github, ArrowRight } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Landing() {
  const me = await currentUser();
  if (me) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-bg text-text">
      <header className="border-b border-border bg-bg-elevated/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <p className="flex items-center gap-2 font-semibold"><GitBranch className="h-4 w-4 text-accent" /> traceroot</p>
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/login" className="text-text-muted hover:text-text">Log in</Link>
            <Link href="/signup" className="rounded-md bg-accent px-3 py-1.5 font-semibold text-bg hover:bg-[#246d48]">Sign up</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-12 pt-16">
        <p className="text-sm tracking-wider text-accent">AI ENGINEERING INTELLIGENCE</p>
        <h1 className="mt-2 max-w-3xl text-balance text-4xl font-bold leading-tight sm:text-5xl">
          Inspect any public GitHub repo.<br />
          Ship with a release score and a prioritized backlog.
        </h1>
        <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-text-muted">
          traceroot scans issues, pull requests, commits, release notes and contributors and turns them
          into a release-readiness score, focused insights, a prioritized action-items list, and
          severity-filtered alerts — for <em>any</em> public GitHub repository, instantly.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link href="/signup" className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 font-semibold text-bg hover:bg-[#246d48]">
            Create an account <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/login" className="inline-flex items-center gap-2 rounded-md border border-border-strong bg-bg-elevated px-4 py-2 text-text hover:bg-panel-hover">
            Try the demo account
          </Link>
          <span className="text-xs text-text-dim"><Github className="inline h-3.5 w-3.5" /> Powered by api.github.com</span>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card icon={<Sparkles className="h-5 w-5 text-accent" />} title="Heuristic engines">
            Docs debt, security hotspots, bus-factor risk, stale PRs, RFC pile-ups, code-churn warnings and more —
            all from a single repo URL.
          </Card>
          <Card icon={<Activity className="h-5 w-5 text-accent" />} title="Release readiness">
            A 0–100 score derived from the severity of every heuristic, with explainable factors so you know what to fix next.
          </Card>
          <Card icon={<ShieldAlert className="h-5 w-5 text-accent" />} title="Action items">
            Critical / high / medium priority list generated from open issues and PRs — actionable, linkable, deduplicated.
          </Card>
        </div>

        <div className="mt-12 rounded-2xl border border-border bg-panel p-6">
          <p className="text-[11px] uppercase tracking-wider text-text-dim">Try these repos</p>
          <ul className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 md:grid-cols-3">
            {[["facebook/react","react"],["vercel/next.js","next.js"],["microsoft/typescript","typescript"],["denoland/deno","deno"],["tokio-rs/tokio","tokio"],["python/cpython","cpython"]].map(([pair,name]) => (
              <li key={pair}>
                <Link href={`/signup?next=/dashboard/r/${pair}`} className="inline-flex items-center gap-2 rounded-md border border-border-strong bg-bg-elevated px-3 py-2 hover:bg-panel-hover">
                  <Star className="h-3 w-3 text-warn" /> {name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="border-t border-border bg-bg-elevated/60 px-5 py-4 text-center text-[11px] text-text-dim">
        MIT license · Next.js · React · Real data from <code>api.github.com</code>
      </footer>
    </main>
  );
}

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-panel p-5">
      <div className="flex items-center gap-2">{icon}<h3 className="text-sm font-semibold">{title}</h3></div>
      <p className="mt-2 text-sm leading-relaxed text-text-muted">{children}</p>
    </div>
  );
}
