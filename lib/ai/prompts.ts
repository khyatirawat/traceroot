import type { AiSuggestionInput } from "./types";

/** Build the prompt. Always requests JSON output. */
export function buildPrompt(input: AiSuggestionInput): { prompt: string; jsonMode: boolean } {
  const { insightCode, repoOwner, repoName, evidence, repoContext } = input;
  const ctx = JSON.stringify(repoContext.primaryFiles?.slice(0, 10) ?? [], null, 2);
  const ev  = JSON.stringify(evidence, null, 2).slice(0, 4000);
  const prompt = [
    `Repository: ${repoOwner}/${repoName}`,
    repoContext.description ? `Description: ${repoContext.description}` : "",
    repoContext.language     ? `Language:    ${repoContext.language}`     : "",
    "",
    `Insight code: ${insightCode}`,
    `Evidence:`,
    "```json",
    ev,
    "```",
    "",
    `Top risky files (max 10):`,
    "```json",
    ctx,
    "```",
    "",
    `Return JSON with this exact shape (no extra text, no code fences):`,
    `{`,
    `  "summary":          "<= 280 chars, plain English, 1 paragraph>",`,
    `  "rootCause":        "<= 600 chars, what is actually causing the issue>",`,
    `  "suggestedFix":     "<= 1200 chars, concrete textual fix or pseudocode change>"  ,`,
    `  "suggestedTests":   "<= 600 chars, bullet list of tests to add>      ",`,
    `  "regressionRisk":   "<= 280 chars, what could break, in priority order>"`,
    `}`,
    "",
    `If the evidence is empty or unclear, return values of "(insufficient evidence)" for each field rather than inventing.`,
  ].filter((s) => s !== undefined && s !== null).join("\n");
  return { prompt, jsonMode: true };
}
