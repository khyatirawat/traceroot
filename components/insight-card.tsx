import type { Insight } from "@/lib/insights";
import { Pill } from "@/components/ui";
const tone = { info: "muted", warn: "warn", alert: "alert" } as const;
export function InsightCard({ i }: { i: Insight }) {
  return (
    <div className="rounded-lg border border-border bg-bg-elevated p-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-text">{i.title}</h3>
        <Pill tone={tone[i.severity]}>{i.severity}</Pill>
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-text-muted">{i.body}</p>
    </div>
  );
}
