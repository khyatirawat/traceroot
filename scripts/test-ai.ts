#!/usr/bin/env tsx
/**
 * Standalone AI smoke test — no Next.js, no DB.
 * Verifies: provider toggle, JSON-mode parsing, deterministic stub output.
 *
 *   npx tsx scripts/test-ai.ts
 *
 * Exit code 0 on success, non-zero on failure.
 */
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";

// 1) Without keys: provider returns null.
process.env.AI_PROVIDER = "github-models";
delete process.env.GITHUB_TOKEN; delete process.env.AI_GITHUB_TOKEN;
delete process.env.OPENAI_API_KEY; delete process.env.ANTHROPIC_API_KEY;

const providerMod = await import("../lib/ai/provider");
providerMod.resetAiProviderForTests();
const p = await providerMod.getAiProvider();
console.log("[test] provider null when no keys:", p === null);
assert.equal(p, null);

// 2) Stub provider: deterministic.
process.env.AI_PROVIDER = "stub";
providerMod.resetAiProviderForTests();
const stubP = await providerMod.getAiProvider();
assert.ok(stubP, "stub provider should resolve");
const completion = await stubP!.complete("Insight code: auth_hotspot\nEvidence: []");
const parsed = JSON.parse(completion.text);
assert.ok(parsed.summary && parsed.summary.includes("auth_hotspot"));
console.log("[test] stub completes with insight-in-summary:", parsed.summary);

// 3) prompts.ts builds valid prompt with JSON tail.
const promptsMod = await import("../lib/ai/prompts");
const built = promptsMod.buildPrompt({
  insightCode: "perf_backlog",
  repoOwner: "facebook",
  repoName: "react",
  evidence: { issue_count: 5, labels: ["performance"] },
  repoContext: { language: "JavaScript", description: "React lib",
                 primaryFiles: [{ path: "src/index.js", riskScore: 0.42, reasons: ["todo", "perf"] }] },
});
assert.ok(built.prompt.includes("facebook/react"), "has repo");
assert.ok(built.prompt.includes("perf_backlog"), "has insight code");
assert.ok(built.prompt.includes('"summary":'), "requests JSON shape");
assert.ok(built.prompt.includes('"regressionRisk":'), "requests regressionRisk field");
assert.equal(built.jsonMode, true);
console.log("[test] prompt built OK, length:", built.prompt.length, "json-mode:", built.jsonMode);

// 4) parseJsonLenient tolerates malformed input.
const suggestMod = await import("../lib/ai/suggest");
const samples = [
  '{"summary":"a","rootCause":"b","suggestedFix":"c","suggestedTests":"d","regressionRisk":"e"}',
  '```json\n{"summary":"a","rootCause":"b","suggestedFix":"c","suggestedTests":"d","regressionRisk":"e"}\n```',
  'preamble {"summary":"a"} garbage',
  'totally broken',
  '["array","not","object"]',
];
for (const s of samples) {
  const fn = (suggestMod as unknown as { parseJsonLenient?: (t: string) => Record<string, unknown> }).parseJsonLenient;
  assert.ok(fn, "should expose parseJsonLenient for testing");
  const result = fn!(s);
  assert.ok(typeof result === "object", `parsed to object: ${s.slice(0, 30)}`);
}
console.log("[test] parseJsonLenient robust to", samples.length, "shapes");

console.log("✅ ai subsystem smoke test passed");
