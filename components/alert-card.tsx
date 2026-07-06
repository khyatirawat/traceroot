import type { Alert } from "@/lib/alerts";
import { Pill } from "@/components/ui";
import { AlertTriangle, ShieldAlert } from "lucide-react";
export function AlertCard({ a }: { a: Alert }) {
  const Icon = a.severity === "alert" ? ShieldAlert : AlertTriangle;
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-bg-elevated p-3">
      <Icon className={a.severity === "alert" ? "h-4 w-4 text-error" : "h-4 w-4 text-warn"} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-text">{a.title}</p>
          <Pill tone={a.severity === "alert" ? "alert" : "warn"}>{a.severity}</Pill>
        </div>
        <p className="mt-0.5 text-[11px] text-text-muted">{a.body}</p>
      </div>
    </div>
  );
}
