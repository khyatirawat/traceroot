import { NextResponse } from "next/server";
import { z } from "zod";
import { loginUser, getSession } from "@/lib/auth";

const Schema = z.object({
  email:    z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ message: "Invalid JSON" }, { status: 400 }); }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  const u = await loginUser(parsed.data.email, parsed.data.password);
  if (!u) return NextResponse.json({ message: "Wrong email or password." }, { status: 401 });
  const session = await getSession();
  session.userId = u.id;
  session.email = u.email;
  session.name = u.name;
  await session.save();
  return NextResponse.json({ ok: true, user: { id: u.id, name: u.name, email: u.email } });
}
