"use client";
import { Wrench, TestTube2, Check, ShieldAlert, Sparkles, RefreshCw } from "lucide-react";

export interface AiSuggestionView {
  summary: string;
  suggestedFix: string;
  suggestedTests: string;
  rootCause: string;
  regressionRisk: string;
  modelId: string;
  provider: string;
  latencyMs: number;
  cached: boolean;
}

export function AiSuggestionCard({
  insightTitle,
  suggestion,
  onRefresh,
}: {
  insightTitle: string;
  suggestion: AiSuggestionView | null;
  onRefresh?: () => void;
}) {
  if (!suggestion) return null;
  return (
    <article className="mt-3 rounded-xl border border-[#2a2a35] bg-[#17161b] p-5 shadow-lg">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-[#a0c0a0]">
            <Sparkles size={14} className="text-[#7ab08a]" /> AI suggestion · {insightTitle}
          </h3>
          <p className="text-[11px] text-[#6b6b78] mt-0.5">
            {suggestion.provider} · {suggestion.modelId}
            {suggestion.cached ? " · cached" : ` · ${suggestion.latencyMs}ms`}
          </p>
        </div>
        {onRefresh && (
          <button onClick={onRefresh} className="text-[#6b6b78] hover:text-[#a0c0a0] transition" title="Refresh">
            <RefreshCw size={14} />
          </button>
        )}
      </header>
      <p className="mt-3 text-sm text-[#d0d0d8]">{suggestion.summary}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Section icon={<Wrench       size={12} />} title="Suggested fix"   body={suggestion.suggestedFix} />
        <Section icon={<TestTube2    size={12} />} title="Tests to add"    body={suggestion.suggestedTests} />
        <Section icon={<Check        size={12} />} title="Root cause"      body={suggestion.rootCause} />
        <Section icon={<ShieldAlert  size={12} />} title="Regression risk" body={suggestion.regressionRisk} />
      </div>
    </article>
  );
}

function Section({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-lg border border-[#252530] bg-[#1c1b22] p-3">
      <h4 className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[#7ab08a]">
        {icon}{title}
      </h4>
      <p className="mt-2 whitespace-pre-wrap text-[12px] leading-relaxed text-[#b0b0bc]">{body}</p>
    </div>
  );
}
