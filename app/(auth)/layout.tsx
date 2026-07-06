import type { ReactNode } from "react";
import { GitBranch, Sparkles, ShieldCheck, Zap } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Left: green brand panel */}
      <div
        className="hidden lg:flex lg:w-[45%] xl:w-[42%] flex-col justify-between p-10 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #2d8659 0%, #1f6342 50%, #164a31 100%)" }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-white/5" />
        <div className="absolute top-1/3 right-1/4 h-40 w-40 rounded-full bg-white/3" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-lg font-bold">
            <GitBranch className="h-6 w-6" />
            traceroot
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-3xl font-bold leading-tight">
              AI-powered engineering<br />intelligence for any<br />GitHub repository.
            </h1>
            <p className="mt-3 text-sm text-white/80">
              Release-readiness scores, issue intelligence, code risk analysis,<br />
              and AI-generated fix proposals — all in one dashboard.
            </p>
          </div>
          <div className="space-y-4">
            <Feature icon={<Sparkles className="h-5 w-5" />} title="AI Insights & Fixes" desc="Automated issue classification, root cause analysis, and patch generation." />
            <Feature icon={<ShieldCheck className="h-5 w-5" />} title="Release Readiness" desc="0–100 score with explainable risk factors before you ship." />
            <Feature icon={<Zap className="h-5 w-5" />} title="Action Center" desc="Prioritized task list so your team always knows what to fix next." />
          </div>
        </div>

        <div className="relative z-10 text-xs text-white/60">
          MIT · uses real api.github.com data
        </div>
      </div>

      {/* Right: white form panel */}
      <div className="flex flex-1 items-center justify-center bg-white px-6 py-10">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2 text-lg font-bold text-text lg:hidden">
            <GitBranch className="h-5 w-5 text-accent" />
            traceroot
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-white/70">{desc}</p>
      </div>
    </div>
  );
}
