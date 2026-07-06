import { Panel } from "@/components/ui";
export function VerdictCard({ score, band, summary }: { score: number; band: "safe" | "moderate" | "high-risk"; summary: string }) {
  const color = band === "safe" ? "#2d8659" : band === "moderate" ? "#b8730a" : "#c94040";
  const label = band === "safe" ? "Ready to ship" : band === "moderate" ? "Ship with care" : "Hold release";
  return (<Panel className="flex items-center gap-5 px-6 py-5"><div className="flex flex-col items-center"><div className="text-5xl font-bold" style={{ color }}>{score}</div><div className="text-xs text-text-dim">/ 100</div></div><div className="flex-1"><p className="text-sm font-semibold" style={{ color }}>{label}</p><p className="mt-1 text-sm text-text-muted">{summary}</p></div><div className="h-2 w-32 overflow-hidden rounded-full bg-bg"><div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} /></div></Panel>);
}
