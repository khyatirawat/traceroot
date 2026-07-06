import { rmSync, existsSync } from "node:fs";
import { resolve } from "node:path";
const raw = process.env.DATABASE_URL ?? "file:./data/traceroot.db";
const path = resolve(process.cwd(), raw.replace(/^file:/, ""));
for (const ext of ["", "-shm", "-wal", "-journal"]) {
  const p = path + ext;
  if (existsSync(p)) { rmSync(p); console.log(`[reset] removed ${p}`); }
}
