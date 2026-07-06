"use client";
import { useState, useTransition } from "react";
import type { AiSettings } from "@/lib/ai/types";

interface Props { userId: string; initial: AiSettings; }

export function AiSettingsForm({ userId, initial }: Props) {
  const [enabled, setEnabled]      = useState(initial.enabled);
  const [scope, setScope]          = useState<AiSettings["scope"]>(initial.scope);
  const [maxPerDay, setMaxPerDay]  = useState(initial.maxPerDay);
  const [provider, setProvider]    = useState<string>(initial.provider ?? "");
  const [isPending, startTransition] = useTransition();
  const [savedAt, setSavedAt]      = useState<string | null>(null);
  const [err, setErr]              = useState<string | null>(null);

  function save() {
    setErr(null); setSavedAt(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/settings/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enabled, scope, maxPerDay,
            provider: provider === "" ? null : provider,
          }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.message ?? "Save failed");
        }
        setSavedAt(new Date().toLocaleTimeString());
      } catch (e) {
        setErr((e as Error).message);
      }
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-text-dim">
        AI suggestions are <strong>opt-in</strong>. When enabled, traceroot sends only
        evidence (counts, file <em>paths</em>, severity tags) to the configured model.
        Source code is not sent unless you flip a future &quot;include source&quot; flag here.
      </p>
      <label className="flex items-center justify-between gap-4">
        <span className="text-sm">Enable AI suggestions</span>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-4 w-4 accent-accent"
          aria-label="Enable AI suggestions"
        />
      </label>
      <label className="flex items-center justify-between gap-4">
        <span className="text-sm">Scope</span>
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value as AiSettings["scope"])}
          className="text-sm bg-bg border border-border rounded px-2 py-1 text-text"
        >
          <option value="insights">Insights only</option>
          <option value="issues">+ Issues</option>
          <option value="prs">+ PRs</option>
          <option value="all">All of the above</option>
        </select>
      </label>
      <label className="flex items-center justify-between gap-4">
        <span className="text-sm">Daily cap</span>
        <input
          type="number" min={1} max={500}
          value={maxPerDay}
          onChange={(e) => setMaxPerDay(Number(e.target.value))}
          className="text-sm w-20 bg-bg border border-border rounded px-2 py-1 text-text"
        />
      </label>
      <label className="flex items-center justify-between gap-4">
        <span className="text-sm">Provider override</span>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="text-sm bg-bg border border-border rounded px-2 py-1 text-text"
        >
          <option value="">(use AI_PROVIDER env)</option>
          <option value="github-models">github-models</option>
          <option value="openai">openai</option>
          <option value="anthropic">anthropic</option>
        </select>
      </label>
      <div className="flex items-center justify-end gap-3">
        {savedAt && <span className="text-xs text-text-dim">Saved at {savedAt}</span>}
        {err    && <span className="text-xs text-error">{err}</span>}
        <button
          onClick={save}
          disabled={isPending}
          className="px-3 py-1.5 rounded bg-accent hover:bg-accent-hover text-white text-sm disabled:opacity-50 transition-colors"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
