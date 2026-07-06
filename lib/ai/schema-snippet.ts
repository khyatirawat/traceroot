//
// PASTE THIS BLOCK INTO db/schema.ts (after the existing exports).
// Then run scripts/migrate-ai.ts to add the tables (or let lib/db.ts boot create them).
//
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const aiSuggestions = sqliteTable("ai_suggestions", {
  id:               text("id").primaryKey(),
  userId:           text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  repoOwner:        text("repo_owner").notNull(),
  repoName:         text("repo_name").notNull(),
  insightCode:      text("insight_code").notNull(),
  evidenceKey:      text("evidence_key").notNull(),
  summary:          text("summary").notNull(),
  suggestedFix:     text("suggested_fix").notNull(),
  suggestedTests:   text("suggested_tests").notNull(),
  rootCause:        text("root_cause").notNull(),
  regressionRisk:   text("regression_risk").notNull(),
  modelId:          text("model_id").notNull(),
  provider:         text("provider").notNull(),
  latencyMs:        integer("latency_ms").notNull(),
  createdAt:        integer("created_at",  { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
  expiresAt:        integer("expires_at",  { mode: "timestamp_ms" }).notNull(),
});

export const userAiSettings = sqliteTable("user_ai_settings", {
  userId:           text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  enabled:          integer("enabled", { mode: "boolean" }).notNull().default(false),
  provider:         text("provider"),
  scope:            text("scope").notNull().default("insights"),
  maxPerDay:        integer("max_per_day").notNull().default(20),
  updatedAt:        integer("updated_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

export const aiSuggestionUsage = sqliteTable("ai_suggestion_usage", {
  id:               text("id").primaryKey(),
  userId:           text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  day:              text("day").notNull(),
  count:            integer("count").notNull().default(1),
});

//
// SAME TABLES, AS RAW SQL — paste this inside initSchema() in lib/db.ts, after the existing CREATE statements:
//
export const AI_SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS ai_suggestions (
    id                  TEXT PRIMARY KEY,
    user_id             TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    repo_owner          TEXT NOT NULL,
    repo_name           TEXT NOT NULL,
    insight_code        TEXT NOT NULL,
    evidence_key        TEXT NOT NULL,
    summary             TEXT NOT NULL,
    suggested_fix       TEXT NOT NULL,
    suggested_tests     TEXT NOT NULL,
    root_cause          TEXT NOT NULL,
    regression_risk     TEXT NOT NULL,
    model_id            TEXT NOT NULL,
    provider            TEXT NOT NULL,
    latency_ms          INTEGER NOT NULL,
    created_at          INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    expires_at          INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_ai_sug_lookup
    ON ai_suggestions(user_id, repo_owner, repo_name, insight_code, evidence_key);
  CREATE INDEX IF NOT EXISTS idx_ai_sug_ttl
    ON ai_suggestions(expires_at);

  CREATE TABLE IF NOT EXISTS user_ai_settings (
    user_id             TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    enabled             INTEGER NOT NULL DEFAULT 0,
    provider            TEXT,
    scope               TEXT NOT NULL DEFAULT 'insights',
    max_per_day         INTEGER NOT NULL DEFAULT 20,
    updated_at          INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );

  CREATE TABLE IF NOT EXISTS ai_suggestion_usage (
    id                  TEXT PRIMARY KEY,
    user_id             TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day                 TEXT NOT NULL,
    count               INTEGER NOT NULL DEFAULT 1,
    UNIQUE (user_id, day)
  );
`;
