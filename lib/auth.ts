import "server-only";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { sessionOptions, type AppSession } from "@/lib/session";
import type { User } from "@/db/schema";

export async function getSession(): Promise<AppSession & { save(): Promise<void>; destroy(): void }> {
  // Next 15 wraps cookies() in a Promise.
  const c = await cookies();
  return getIronSession<AppSession>(c, sessionOptions);
}

export async function currentUser(): Promise<User | null> {
  const s = await getSession();
  if (!s.userId) return null;
  const rows = await db.select().from(users).where(eq(users.id, s.userId)).limit(1);
  return rows[0] ?? null;
}

export async function createUser({ name, email, password }: { name: string; email: string; password: string }): Promise<User> {
  const now = new Date();
  const id = randomUUID();
  const passwordHash = await bcrypt.hash(password, 12);
  const row: User = {
    id, email: email.toLowerCase(), name, passwordHash, createdAt: now, updatedAt: now,
  };
  await db.insert(users).values(row);
  return row;
}

export async function loginUser(emailOrIdentifier: string, password: string): Promise<User | null> {
  const email = emailOrIdentifier.toLowerCase().trim();
  const row = (await db.select().from(users).where(eq(users.email, email)).limit(1))[0];
  if (!row) return null;
  if (!(await bcrypt.compare(password, row.passwordHash))) return null;
  return row;
}
