import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id:            text("id").primaryKey(),
  email:         text("email").notNull().unique(),
  name:          text("name").notNull(),
  passwordHash:  text("password_hash").notNull(),
  createdAt:     integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt:     integer("updated_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

export const sessions = sqliteTable("sessions", {
  // We don't actually persist these — handled by iron-session cookies.
  // This table exists only to keep Drizzle happy if you want to migrate to DB sessions later.
  id:        text("id").primaryKey(),
  userId:    text("user_id").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

export const savedRepos = sqliteTable("saved_repos", {
  id:           text("id").primaryKey(),
  userId:       text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  owner:        text("owner").notNull(),
  name:         text("name").notNull(),
  lastViewedAt: integer("last_viewed_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
  createdAt:    integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

export type User      = typeof users.$inferSelect;
export type SavedRepo = typeof savedRepos.$inferSelect;
export type NewSavedRepo = typeof savedRepos.$inferInsert;

// ─── AI suggestion layer (addon; see lib/ai/*.ts) ────────────────────────────
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
