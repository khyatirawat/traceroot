/**
 * Single global SQLite connection for the process.
 * Bootstrap & migrate inline so dev:next works without drizzle-kit.
 * The same client is reused for the production server.
 */
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import * as schema from "@/db/schema";

type DB = BetterSQLite3Database<typeof schema>;
const g = globalThis as unknown as { __traceroot_db?: DB };

function rawUrl(): string {
  return (process.env.DATABASE_URL ?? "file:./data/traceroot.db").replace(/^file:/, "");
}

function make(): DB {
  const path = resolve(process.cwd(), rawUrl());
  mkdirSync(dirname(path), { recursive: true });
  const sqlite = new Database(path);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  initSchema(sqlite);
  return drizzle(sqlite, { schema });
}

function initSchema(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id              TEXT PRIMARY KEY,
      email           TEXT NOT NULL UNIQUE,
      name            TEXT NOT NULL,
      password_hash   TEXT NOT NULL,
      created_at      INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      updated_at      INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL,
      expires_at  INTEGER NOT NULL,
      created_at  INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );
    CREATE TABLE IF NOT EXISTS saved_repos (
      id              TEXT PRIMARY KEY,
      user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      owner           TEXT NOT NULL,
      name            TEXT NOT NULL,
      last_viewed_at  INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      created_at      INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      UNIQUE (user_id, owner, name)
    );
    CREATE INDEX IF NOT EXISTS idx_saved_repos_user ON saved_repos(user_id, last_viewed_at DESC);
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
}

export const db: DB = g.__traceroot_db ?? (g.__traceroot_db = make());

export type DBType = DB;
