"use client";
export function DistributionChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return <p className="px-5 py-4 text-xs text-text-muted">No data.</p>;
  return <div className="px-5 py-4 space-y-2">{data.filter((d) => d.value > 0).map((d) => (<div key={d.label} className="flex items-center gap-3 text-xs"><span className="w-20 truncate text-text-muted">{d.label}</span><div className="flex-1 h-5 rounded bg-bg-elevated overflow-hidden"><div className="h-full rounded" style={{ width: `${(d.value/total)*100}%`, background: d.color }} /></div><span className="w-8 text-right text-text">{d.value}</span><span className="w-10 text-right text-text-dim">{Math.round((d.value/total)*100)}%</span></div>))}</div>;
}
