import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, desc } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { savedRepos } from "@/db/schema";
import { currentUser } from "@/lib/auth";

const Params = z.object({
  owner: z.string().min(1).max(64).regex(/^[A-Za-z0-9_.-]+$/),
  name:  z.string().min(1).max(128).regex(/^[A-Za-z0-9_.-]+$/),
});

export async function POST(_req: Request, ctx: { params: Promise<{ owner: string; name: string }> }) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const parsed = Params.safeParse(await ctx.params);
  if (!parsed.success) return NextResponse.json({ message: "Invalid owner/name" }, { status: 400 });
  const { owner, name } = parsed.data;
  const now = new Date();
  const existing = await db.select().from(savedRepos)
    .where(and(eq(savedRepos.userId, me.id), eq(savedRepos.owner, owner), eq(savedRepos.name, name)))
    .limit(1);
  if (existing.length > 0) {
    await db.update(savedRepos).set({ lastViewedAt: now }).where(eq(savedRepos.id, existing[0]!.id));
  } else {
    await db.insert(savedRepos).values({
      id: randomUUID(), userId: me.id, owner, name, lastViewedAt: now, createdAt: now,
    });
  }
  return NextResponse.json({ ok: true });
}

export async function GET(_req: Request, ctx: { params: Promise<{ owner: string; name: string }> }) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const parsed = Params.safeParse(await ctx.params);
  if (!parsed.success) return NextResponse.json({ message: "Invalid owner/name" }, { status: 400 });
  const { owner, name } = parsed.data;
  const rows = await db.select().from(savedRepos)
    .where(and(eq(savedRepos.userId, me.id), eq(savedRepos.owner, owner), eq(savedRepos.name, name)))
    .orderBy(desc(savedRepos.lastViewedAt)).limit(1);
  return NextResponse.json({ saved: rows[0] ?? null });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ owner: string; name: string }> }) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const parsed = Params.safeParse(await ctx.params);
  if (!parsed.success) return NextResponse.json({ message: "Invalid owner/name" }, { status: 400 });
  const { owner, name } = parsed.data;
  await db.delete(savedRepos).where(and(
    eq(savedRepos.userId, me.id), eq(savedRepos.owner, owner), eq(savedRepos.name, name),
  ));
  return NextResponse.json({ ok: true });
}
