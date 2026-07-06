import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { db } from "../lib/db";
import { users } from "../db/schema";
const DEMO_EMAIL = "demo@traceroot.local";
const DEMO_PASS = "traceroot-demo-password-123";
(async () => {
  const exists = (await db.select().from(users).limit(1))[0];
  if (exists) { console.log(`[seed] users table already has rows (e.g. ${exists.email}). Skipping.`); return; }
  const now = new Date();
  await db.insert(users).values({
    id: randomUUID(), email: DEMO_EMAIL, name: "Demo User",
    passwordHash: await bcrypt.hash(DEMO_PASS, 12), createdAt: now, updatedAt: now,
  });
  console.log(`[seed] created demo user. email=${DEMO_EMAIL} password=${DEMO_PASS}`);
})().catch((err) => { console.error(err); process.exit(1); });
