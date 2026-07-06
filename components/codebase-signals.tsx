"use client";
import type { CodebaseSignal } from "@/lib/analytics";
import { Panel, SectionHeader, Pill } from "@/components/ui";
import { relTime } from "@/lib/formatters";
export function CodebaseSignals({ signals }: { signals: CodebaseSignal[] }) {
  return (<Panel><SectionHeader title="File Risk Heatmap" sub="Files ranked by risk score." />{signals.length===0 ? <p className="px-5 py-4 text-xs text-text-muted">No file-level signals detected.</p> : <ul className="divide-y divide-border">{signals.map((s)=>(<li key={s.path} className="px-5 py-3 text-sm"><div className="flex items-start justify-between gap-3"><div className="min-w-0 flex-1"><code className="text-xs text-accent">{s.path}</code><div className="mt-1 flex flex-wrap gap-1">{s.reasons.map((r,i)=><Pill key={i} tone={s.riskScore>60?"alert":s.riskScore>30?"warn":"muted"}>{r}</Pill>)}</div>{s.linkedIssueNumbers.length>0 && <p className="mt-1 text-[11px] text-text-dim">Linked: {s.linkedIssueNumbers.map((n)=><span key={n}>#{n} </span>)}</p>}</div><div className="text-right"><div className={`text-2xl font-bold ${s.riskScore>60?"text-error":s.riskScore>30?"text-warn":"text-accent"}`}>{s.riskScore}</div><p className="text-[10px] text-text-dim">risk</p>{s.lastChangedAt && <p className="text-[10px] text-text-dim">{relTime(s.lastChangedAt)}</p>}</div></div></li>))}</ul>}</Panel>);
}
