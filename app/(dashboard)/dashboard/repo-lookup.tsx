"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, PrimaryButton } from "@/components/ui";

const SUGGESTIONS = ["facebook/react", "vercel/next.js", "microsoft/typescript", "denoland/deno", "tokio-rs/tokio", "python/cpython"];

function parseRepoUrl(s: string): { owner: string; name: string } | null {
  if (!s) return null;
  const trimmed = s.trim().replace(/^https?:\/\/(www\.)?github\.com\//i, "").replace(/^github\.com\//i, "").replace(/\.git$/, "");
  const m = trimmed.match(/^([\w.-]{1,64})\/([\w.-]{1,128})(?:\/.*)?$/);
  return m ? { owner: m[1]!, name: m[2]! } : null;
}

export function RepoLookup() {
  const [v, setV] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();
  function go(pair: string) {
    const parsed = parseRepoUrl(pair);
    if (!parsed) { setErr("Please enter a valid owner/name or URL."); return; }
    setErr(null);
    router.push(`/dashboard/r/${parsed.owner}/${parsed.name}`);
  }
  return (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); go(v); }} className="flex gap-2">
        <Input placeholder="github.com/owner/name or owner/name" value={v} onChange={(e) => setV(e.target.value)} />
        <PrimaryButton type="submit">Open</PrimaryButton>
      </form>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] uppercase tracking-wider text-text-dim">Try:</span>
        {SUGGESTIONS.map((s) => (
          <button key={s} type="button" onClick={() => go(s)}
            className="rounded-md border border-border-strong px-2 py-0.5 text-[11px] text-text-muted hover:bg-panel-hover hover:text-text">
            {s}
          </button>
        ))}
      </div>
      {err ? <p className="mt-2 text-xs text-error">{err}</p> : null}
    </div>
  );
}
