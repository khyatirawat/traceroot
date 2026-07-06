"use client";
export function LanguageBar({ langs }: { langs: Record<string, number> }) {
  const e = Object.entries(langs).sort((a, b) => b[1] - a[1]);
  const total = e.reduce((s, [, v]) => s + v, 0);
  if (!total) return <p className="px-5 py-4 text-xs text-text-muted">No language data.</p>;
  const colors = ["#3b82f6","#f97316","#22c55e","#a855f7","#eab308","#ec4899","#06b6d4","#ef4444","#8b5cf6","#10b981"];
  return (<div className="px-5 py-4 space-y-3"><div className="flex h-3 w-full overflow-hidden rounded-full">{e.slice(0,10).map(([l,b],i)=>(<div key={l} style={{width:`${(b/total)*100}%`,background:colors[i%10]}} title={`${l}: ${Math.round((b/total)*100)}%`} />))}</div><div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">{e.slice(0,10).map(([l,b],i)=>(<span key={l} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{background:colors[i%10]}} /><span className="text-text">{l}</span><span className="text-text-dim">{Math.round((b/total)*100)}%</span></span>))}</div></div>);
}
