"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, PrimaryButton } from "@/components/ui";
import { BookmarkPlus, RefreshCw } from "lucide-react";
export function SaveToggle({ owner, name }: { owner: string; name: string }) {
  const router = useRouter(); const [saved, setSaved] = useState(false); const [busy, setBusy] = useState(false);
  async function save() { setBusy(true); try { await fetch(`/api/repos/${owner}/${name}`, { method: "POST" }); setSaved(true); router.refresh(); } finally { setBusy(false); } }
  return <div className="flex items-center gap-2"><Button type="button" onClick={() => router.refresh()}><RefreshCw className="h-3.5 w-3.5" />Refresh</Button><PrimaryButton type="button" onClick={save} disabled={busy || saved}><BookmarkPlus className="h-3.5 w-3.5" />{saved ? "Saved" : "Save"}</PrimaryButton></div>;
}
