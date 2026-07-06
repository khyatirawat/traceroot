"use client";
import { useState, type ReactNode } from "react";
const TABS = ["overview","issues","ai-suggestions","ai-fixes","prs","contributors","activity","codebase","security"] as const;
type TabKey = typeof TABS[number];
const LABELS: Record<TabKey, string> = { overview: "Overview", issues: "Issues", "ai-suggestions": "AI Suggestions", "ai-fixes": "AI Fixes", prs: "PRs", contributors: "Contributors", activity: "Activity", codebase: "Codebase", security: "Security" };
export function RepoTabs({ panels }: { panels: Record<TabKey, ReactNode> }) {
  const [active, setActive] = useState<TabKey>("overview");
  return (<div className="space-y-4"><nav className="flex flex-wrap gap-1 rounded-lg border border-border bg-panel p-1">{TABS.map((t) => (<button key={t} onClick={() => setActive(t)} className={"rounded-md px-3 py-1.5 text-xs font-medium transition-colors " + (active === t ? "bg-bg-elevated text-text" : "text-text-muted hover:text-text hover:bg-bg-elevated/50")}>{LABELS[t]}</button>))}</nav><div>{panels[active]}</div></div>);
}
