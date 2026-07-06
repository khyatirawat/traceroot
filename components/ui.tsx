import type { ReactNode } from "react";
import Link from "next/link";
import { forwardRef } from "react";

export const Panel = forwardRef<HTMLDivElement, { className?: string; children: ReactNode }>(function Panel({ className = "", children }, ref) {
  return <div ref={ref} className={"rounded-xl border border-border bg-panel shadow-sm " + className}>{children}</div>;
});

export function SectionHeader({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-3">
      <div>
        <h2 className="text-[13px] font-semibold tracking-wide text-text uppercase">{title}</h2>
        {sub ? <p className="text-[11px] text-text-dim">{sub}</p> : null}
      </div>
      {right}
    </div>
  );
}

export function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noreferrer noopener" className="text-accent hover:text-accent-hover hover:underline">{children} ↗</a>;
}

export function Pill({ children, tone = "muted", className = "" }: { children: ReactNode; tone?: "ok" | "warn" | "alert" | "muted" | "accent"; className?: string }) {
  const toneCls = {
    ok:     "bg-accent-light text-accent border-accent/30",
    warn:   "bg-amber-50 text-warn border-amber-200",
    alert:  "bg-red-50 text-error border-red-200",
    accent: "bg-blue-50 text-ring border-blue-200",
    muted:  "bg-bg text-text-muted border-border",
  }[tone];
  return <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${toneCls} ${className}`}>{children}</span>;
}

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className = "", ...rest }, ref) {
  return <input ref={ref} {...rest} className={"w-full rounded-md border border-border-strong bg-white px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-ring " + className} />;
});

export const PrimaryButton = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(function PrimaryButton({ className = "", children, ...rest }, ref) {
  return (
    <button ref={ref} {...rest} className={"inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-accent bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50 " + className}>
      {children}
    </button>
  );
});

export const Button = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(function Button({ className = "", children, ...rest }, ref) {
  return (
    <button ref={ref} {...rest} className={"inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-text transition-colors hover:bg-panel-hover disabled:opacity-50 " + className}>
      {children}
    </button>
  );
});

export function InlineLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href} className="text-accent hover:text-accent-hover hover:underline">{children}</Link>;
}
