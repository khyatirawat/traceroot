import { ReactNode } from "react";
export function EmptyState({ title, body, cta }: { title: string; body?: string; cta?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong bg-panel px-5 py-10 text-center">
      <h3 className="text-sm font-semibold text-text">{title}</h3>
      {body ? <p className="max-w-md text-xs text-text-muted">{body}</p> : null}
      {cta ? <div className="mt-2">{cta}</div> : null}
    </div>
  );
}
