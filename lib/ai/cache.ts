import crypto from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import type { AiProviderName, AiSettings } from "./types";
import { DEFAULT_AI_SETTINGS } from "./types";

const TTL_MS = 24 * 60 * 60 * 1000;   // 24h

function sha1(s: string): string {
  return crypto.createHash("sha1").update(s).digest("hex");
}
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface CachedSuggestion {
  summary: string; suggestedFix: string; suggestedTests: string;
  rootCause: string; regressionRisk: string;
  modelId: string; provider: string; latencyMs: number;
  createdAt: Date; expiresAt: Date;
}

export async function getCached(
  userId: string, repoOwner: string, repoName: string, insightCode: string, evidenceJson: string,
): Promise<CachedSuggestion | null> {
  const key = sha1(`${insightCode}:${evidenceJson.slice(0, 256)}`);
  const now = new Date();
  try {
    const { aiSuggestions } = await import("@/db/schema");
    const rows = await db.select().from(aiSuggestions).where(
      and(
        eq(aiSuggestions.userId, userId),
        eq(aiSuggestions.repoOwner, repoOwner),
        eq(aiSuggestions.repoName, repoName),
        eq(aiSuggestions.insightCode, insightCode),
        eq(aiSuggestions.evidenceKey, key),
        sql`${aiSuggestions.expiresAt} > ${now}`,
      ),
    ).limit(1);
    const r = rows[0];
    if (!r) return null;
    return {
      summary: r.summary, suggestedFix: r.suggestedFix, suggestedTests: r.suggestedTests,
      rootCause: r.rootCause, regressionRisk: r.regressionRisk,
      modelId: r.modelId, provider: r.provider, latencyMs: r.latencyMs,
      createdAt: r.createdAt, expiresAt: r.expiresAt,
    };
  } catch {
    // Schema not yet migrated — treat as miss.
    return null;
  }
}

export async function writeCached(
  userId: string, repoOwner: string, repoName: string, insightCode: string, evidenceJson: string,
  suggestion: { summary: string; suggestedFix: string; suggestedTests: string;
                rootCause: string; regressionRisk: string;
                modelId: string; provider: string; latencyMs: number },
): Promise<void> {
  const key = sha1(`${insightCode}:${evidenceJson.slice(0, 256)}`);
  const id = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TTL_MS);
  try {
    const { aiSuggestions } = await import("@/db/schema");
    await db.insert(aiSuggestions).values({
      id, userId, repoOwner, repoName, insightCode, evidenceKey: key,
      summary: suggestion.summary, suggestedFix: suggestion.suggestedFix,
      suggestedTests: suggestion.suggestedTests, rootCause: suggestion.rootCause,
      regressionRisk: suggestion.regressionRisk, modelId: suggestion.modelId,
      provider: suggestion.provider, latencyMs: suggestion.latencyMs,
      expiresAt,
    });
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[ai] cache write failed (schema missing?):", (e as Error).message);
    }
  }
}

export async function getUserSettings(userId: string): Promise<AiSettings> {
  try {
    const { userAiSettings } = await import("@/db/schema");
    const rows = await db.select().from(userAiSettings).where(eq(userAiSettings.userId, userId)).limit(1);
    const r = rows[0];
    if (!r) return DEFAULT_AI_SETTINGS;
    const provider = (r.provider as AiProviderName | null) ?? null;
    return { enabled: r.enabled, provider, scope: r.scope as AiSettings["scope"], maxPerDay: r.maxPerDay };
  } catch {
    return DEFAULT_AI_SETTINGS;
  }
}

export async function setUserSettings(userId: string, s: AiSettings): Promise<void> {
  const { userAiSettings } = await import("@/db/schema");
  await db.insert(userAiSettings).values({
    userId, enabled: s.enabled, provider: s.provider,
    scope: s.scope, maxPerDay: s.maxPerDay, updatedAt: new Date(),
  }).onConflictDoUpdate({
    target: userAiSettings.userId,
    set: { enabled: s.enabled, provider: s.provider,
           scope: s.scope, maxPerDay: s.maxPerDay, updatedAt: new Date() },
  });
}

export async function consumeQuota(userId: string, max: number): Promise<boolean> {
  const day = today();
  const { aiSuggestionUsage } = await import("@/db/schema");
  const rows = await db.select().from(aiSuggestionUsage).where(
    and(eq(aiSuggestionUsage.userId, userId), eq(aiSuggestionUsage.day, day)),
  ).limit(1);
  const existing = rows[0];
  if (existing) {
    if (existing.count + 1 > max) return false;
    await db.update(aiSuggestionUsage).set({ count: existing.count + 1 })
      .where(and(eq(aiSuggestionUsage.userId, userId), eq(aiSuggestionUsage.day, day)));
    return true;
  }
  await db.insert(aiSuggestionUsage).values({
    id: crypto.randomUUID(), userId, day, count: 1,
  });
  return true;
}
