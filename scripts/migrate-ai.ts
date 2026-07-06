#!/usr/bin/env tsx
/**
 * Adds the three AI tables to an existing traceroot SQLite DB.
 * Idempotent — safe to run repeatedly.
 *
 *   npx tsx scripts/migrate-ai.ts
 */
import Database from "better-sqlite3";
import { resolve } from "node:path";

const url = (process.env.DATABASE_URL ?? "file:./data/traceroot.db").replace(/^file:/, "");
const path = resolve(process.cwd(), url);
console.log("[migrate-ai] DB:", path);

const sqlite = new Database(path);
sqlite.exec(`
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
  CREATE INDEX IF NOT EXISTS idx_ai_sug_lookup ON ai_suggestions(user_id, repo_owner, repo_name, insight_code, evidence_key);
  CREATE INDEX IF NOT EXISTS idx_ai_sug_ttl ON ai_suggestions(expires_at);

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
`);
sqlite.close();
console.log("[migrate-ai] done.");
