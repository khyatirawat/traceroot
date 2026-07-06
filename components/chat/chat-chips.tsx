"use client";
import { Wand2, ShieldAlert, FileCode2, TestTube2, GitPullRequestArrow, ListChecks } from "lucide-react";

export interface QuickPrompt {
  id: string;
  label: string;
  iconName: "explain" | "fix" | "tests" | "pr" | "actions" | "risk";
  prompt: string;
}

const ic = {
  explain:  Wand2,
  fix:      FileCode2,
  tests:    TestTube2,
  pr:       GitPullRequestArrow,
  actions:  ListChecks,
  risk:     ShieldAlert,
};

export const DEFAULT_QUICK_PROMPTS: QuickPrompt[] = [
  { id: "explain",  label: "Explain the worst finding",       iconName: "explain", prompt: "Looking at the heuristic findings on this repo, explain the most severe one in plain English. What's happening? Why is it severe?" },
  { id: "fix",      label: "Suggest a fix",                   iconName: "fix",     prompt: "For the highest-priority finding on this repo, give me a concrete textual fix or pseudocode change. Keep it under 60 lines." },
  { id: "tests",    label: "Recommend tests",                 iconName: "tests",   prompt: "Recommend 3-5 specific unit or integration tests that would have caught the most serious issue on this repo. Include the file you'd add them to." },
  { id: "risk",     label: "Release-readiness summary",       iconName: "risk",    prompt: "Based on the heuristic findings, summarize whether this repo is ready to ship. List the top 3 blockers. Don't repeat more than 3." },
];

export function ChatChips({ onPick, disabled }: { onPick: (p: QuickPrompt) => void; disabled?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1.5 px-3.5 pt-2 pb-1">
      {DEFAULT_QUICK_PROMPTS.map((p) => {
        const Icon = ic[p.iconName];
        return (
          <button
            key={p.id}
            type="button"
            disabled={disabled}
            onClick={() => onPick(p)}
            className="group inline-flex items-center gap-1.5 rounded-full border border-violet-700/40 bg-violet-950/40 px-2.5 py-1 text-[11.5px] font-medium text-violet-200 hover:border-violet-500/60 hover:bg-violet-900/40 hover:text-violet-50 disabled:opacity-50 transition-colors"
          >
            <Icon size={11.5} className="text-violet-300 group-hover:text-violet-100" />
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
