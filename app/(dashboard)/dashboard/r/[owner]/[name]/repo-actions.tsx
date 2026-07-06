"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, PrimaryButton } from "@/components/ui";
import { BookmarkPlus, Check, Copy, RefreshCw } from "lucide-react";
export function RepoActions({ owner, name }: { owner: string; name: string }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    try {
      await fetch(`/api/repos/${owner}/${name}`, { method: "POST" });
      setSaved(true);
      router.refresh();
    } finally { setBusy(false); }
  }
  async function copyUrl() {
    await navigator.clipboard.writeText(`https://github.com/${owner}/${name}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div className="flex items-center gap-2 text-xs">
      <Button type="button" onClick={copyUrl} title={"Copy GitHub URL"}>
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copied" : "Copy URL"}
      </Button>
      <Button type="button" onClick={() => router.refresh()} title="Re-fetch">
        <RefreshCw className="h-3.5 w-3.5" /> Refresh
      </Button>
      <PrimaryButton type="button" onClick={save} disabled={busy || saved}>
        <BookmarkPlus className="h-3.5 w-3.5" />
        {saved ? "Saved" : busy ? "Saving…" : "Save"}
      </PrimaryButton>
    </div>
  );
}
