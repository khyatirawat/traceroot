"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Panel, SectionHeader } from "@/components/ui";
import { Clock } from "lucide-react";
interface Viewed { owner: string; name: string; ts: number }
export function RecentlyViewed() {
  const [items, setItems] = useState<Viewed[]>([]);
  useEffect(() => { try { setItems(JSON.parse(localStorage.getItem("traceroot_viewed") ?? "[]").slice(0, 6)); } catch {} }, []);
  if (!items.length) return null;
  return (<Panel className="mb-4"><SectionHeader title="Recently viewed" /><div className="flex flex-wrap gap-2 px-5 py-3">{items.map((r) => (<Link key={r.owner+"/"+r.name} href={`/dashboard/r/${r.owner}/${r.name}`} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-bg-elevated px-3 py-1.5 text-xs text-text-muted hover:text-text hover:bg-panel-hover transition-colors"><Clock className="h-3 w-3" />{r.owner}/{r.name}</Link>))}</div></Panel>);
}
