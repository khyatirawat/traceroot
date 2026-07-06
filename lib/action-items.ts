import type { IssueData, PullData } from "@/lib/github";

export type Priority = "critical" | "high" | "medium";
export interface ActionItem {
  id: string; title: string; rationale: string; priority: Priority; kind: string; href: string;
}

const CRITICAL_RX = /\b(critical|p0|severity-1|blocker|cve|vulnerability)\b/i;
const DOC_RX      = /^(doc|docs|documentation|readme)\b/i;

export function actionItemsFromData(issues: IssueData[], pulls: PullData[]): ActionItem[] {
  const items: ActionItem[] = [];
  const open = issues.filter((i) => !i.pull_request && i.state === "open");

  // Critical issues → critical action items
  for (const i of open) {
    const labelBlob = i.labels.map((l) => l.name).join(" ");
    if (CRITICAL_RX.test(labelBlob) || CRITICAL_RX.test(i.title)) {
      items.push({
        id: `crit-${i.number}`,
        title: `Resolve critical issue #${i.number}: ${i.title}`,
        rationale: `Tagged critical — must close before release.`,
        priority: "critical",
        kind: "fix",
        href: i.html_url,
      });
    }
  }

  // Stale high-comment issues → high
  for (const i of open) {
    if (i.comments >= 5 && items.length < 25) items.push({
      id: `engage-${i.number}`,
      title: `Respond to #${i.number}: ${i.title}`,
      rationale: `${i.comments} comments — community is waiting.`,
      priority: "high",
      kind: "respond",
      href: i.html_url,
    });
  }

  // Stale PRs → medium
  const stalePRs = pulls.filter((p) => p.state === "open" && (Date.now() - Date.parse(p.updated_at)) > 30 * 86_400_000);
  for (const p of stalePRs) items.push({
    id: `pr-${p.number}`, title: `Triage stale PR #${p.number}: ${p.title}`,
    rationale: "Idle for 30+ days — review, request changes, or close.",
    priority: "medium", kind: "review", href: p.html_url,
  });

  // Doc issues → medium
  const docIssues = open.filter((i) => DOC_RX.test(i.title) || i.labels.some((l) => DOC_RX.test(l.name)));
  for (const i of docIssues.slice(0, 6)) items.push({
    id: `doc-${i.number}`, title: `Address docs issue #${i.number}: ${i.title}`,
    rationale: "Documentation debt — close to lower friction for newcomers.",
    priority: "medium", kind: "docs", href: i.html_url,
  });

  // Long-lived in-progress issues
  const oldIssues = open.filter((i) => (Date.now() - Date.parse(i.created_at)) > 90 * 86_400_000);
  for (const i of oldIssues.slice(0, 4)) items.push({
    id: `triage-${i.number}`, title: `Re-triage #${i.number}: ${i.title}`,
    rationale: "Open >90 days. Close or label.",
    priority: "medium", kind: "triage", href: i.html_url,
  });

  return items.sort((a, b) => priorityOrder(a.priority) - priorityOrder(b.priority));
}
function priorityOrder(p: Priority): number { return p === "critical" ? 0 : p === "high" ? 1 : 2; }
