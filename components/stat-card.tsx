export function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-bg-elevated px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wider text-text-dim">{label}</p>
      <p className={"mt-0.5 text-2xl font-semibold leading-tight " + (accent ? "text-accent" : "text-text")}>{value}</p>
      {sub ? <p className="text-[11px] text-text-dim">{sub}</p> : null}
    </div>
  );
}
