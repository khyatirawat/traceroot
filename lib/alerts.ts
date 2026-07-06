import type { Insight } from "@/lib/insights";
import type { RepoMeta } from "@/lib/github";

export interface Alert { id: string; title: string; body: string; severity: "warn" | "alert"; href?: string; }

export function alertsFromInsights(repo: RepoMeta, insights: Insight[]): Alert[] {
  const out: Alert[] = [];
  for (const i of insights) {
    if (i.severity === "info") continue;
    out.push({ id: i.id, title: i.title, body: i.body, severity: i.severity, href: `https://github.com/${repo.full_name}` });
  }
  return out;
}
