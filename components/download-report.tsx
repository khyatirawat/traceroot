"use client";
import { Button } from "@/components/ui";
import { Download } from "lucide-react";
export function DownloadReport({ owner, name, data }: { owner: string; name: string; data: unknown }) {
  function download() { const blob = new Blob([JSON.stringify({ repo: `${owner}/${name}`, generatedAt: new Date().toISOString(), data }, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${owner}-${name}-report.json`; a.click(); URL.revokeObjectURL(url); }
  return <Button type="button" onClick={download}><Download className="h-3.5 w-3.5" />Export JSON</Button>;
}
