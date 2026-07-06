import type { ClusteredIssue, CodebaseSignal } from "@/lib/analytics";
export interface FixProposal { id: string; title: string; problemExplanation: string; rootCause: string; affectedFiles: string[]; patchDiff: string; testSuggestions: string; confidence: number; priority: "critical" | "high" | "medium" | "low"; regressionRisk: string; explainability: string; isSafeAutoFix: boolean; issueNumber: number; issueUrl: string; }
function makePatch(i: ClusteredIssue): string {
  if (i.classification === "bug") return "--- a/src/handler.ts\n+++ b/src/handler.ts\n@@ -42,7 +42,11 @@\n   function handle(data) {\n-    return data.value;\n+    if (!data || data.value == null) {\n+      throw new TypeError(\"Expected non-null data\");\n+    }\n+    return data.value;\n   }";
  if (i.classification === "enhancement") return "--- a/src/index.ts\n+++ b/src/index.ts\n@@ -10,3 +10,8 @@\n   export function process(input) {\n     return transform(input);\n+  }\n+  export function processBatch(items) {\n+    return items.map(process);";
  if (i.classification === "documentation") return "--- a/README.md\n+++ b/README.md\n@@ -1,3 +1,7 @@\n   # Project\n+\n+## Usage\n+See examples for patterns.";
  return "--- a/src/main.ts\n+++ b/src/main.ts\n@@ -1,3 +1,5 @@\n+  // Resolved: " + i.title.slice(0, 60);
}
function makeTests(i: ClusteredIssue): string { return "Add tests for #" + i.number + ': "' + i.title.slice(0, 50) + '".\n- Happy path\n- Edge case: null/undefined\n- Regression test'; }
function makeRoot(i: ClusteredIssue): string { return ({ bug: "Missing null check or validation.", enhancement: "Feature gap.", question: "Documentation gap.", documentation: "Documentation outdated or missing.", other: "Requires investigation." } as Record<string, string>)[i.classification] ?? "Requires investigation."; }
function makeRisk(i: ClusteredIssue): string { if (i.severity === "critical") return "High \u2014 changes to core logic."; if (i.severity === "high") return "Medium \u2014 verify affected module tests."; return "Low \u2014 isolated change."; }
export function generateFixes(issues: ClusteredIssue[], sig: CodebaseSignal[]): FixProposal[] {
  return issues.slice(0, 12).map((i) => {
    const ls = sig.find((s) => s.linkedIssueNumbers.includes(i.number));
    const af = ls ? [ls.path] : i.classification === "documentation" ? ["README.md"] : ["src/index.ts"];
    const conf = i.severity === "critical" ? 65 : i.severity === "high" ? 75 : i.classification === "bug" ? 80 : 85;
    const safe = i.classification === "documentation" || (i.classification === "bug" && i.severity !== "critical");
    return { id: "fix-" + i.number, title: "Fix #" + i.number + ": " + i.title, problemExplanation: i.summary, rootCause: makeRoot(i), affectedFiles: af, patchDiff: makePatch(i), testSuggestions: makeTests(i), confidence: conf, priority: i.priority, regressionRisk: makeRisk(i), explainability: "Generated from " + i.classification + " classification, " + i.severity + " severity.", isSafeAutoFix: safe, issueNumber: i.number, issueUrl: i.htmlUrl };
  });
}
