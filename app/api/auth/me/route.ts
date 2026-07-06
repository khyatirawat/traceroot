import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
export async function GET() {
  const u = await currentUser();
  if (!u) return NextResponse.json({ user: null }, { status: 200 });
  return NextResponse.json({ user: { id: u.id, name: u.name, email: u.email, createdAt: u.createdAt } });
}
