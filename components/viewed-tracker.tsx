"use client";
import { useEffect } from "react";
export function ViewedTracker({ owner, name }: { owner: string; name: string }) {
  useEffect(() => { try { const raw = localStorage.getItem("traceroot_viewed") ?? "[]"; const list = JSON.parse(raw) as { owner: string; name: string; ts: number }[]; const filtered = list.filter((r) => !(r.owner === owner && r.name === name)); filtered.unshift({ owner, name, ts: Date.now() }); localStorage.setItem("traceroot_viewed", JSON.stringify(filtered.slice(0, 10))); } catch {} }, [owner, name]);
  return null;
}
