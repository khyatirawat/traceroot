import type { Config } from "drizzle-kit";
const url = (process.env.DATABASE_URL ?? "file:./data/traceroot.db").replace(/^file:/, "");
export default {
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "sqlite",
  dbCredentials: { url },
} satisfies Config;
