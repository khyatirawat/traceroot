"use client";
import { Button } from "@/components/ui";
import { useState } from "react";
export function RemoveRepo({ owner, name }: { owner: string; name: string }) {
  const [busy, setBusy] = useState(false);
  const remove = async () => {
    if (!confirm(`Remove ${owner}/${name} from your saved list?`)) return;
    setBusy(true);
    try {
      await fetch(`/api/repos/${owner}/${name}`, { method: "DELETE" });
      location.reload();
    } finally { setBusy(false); }
  };
  return <Button type="button" onClick={remove} disabled={busy}>{busy ? "Removing…" : "Remove"}</Button>;
}
