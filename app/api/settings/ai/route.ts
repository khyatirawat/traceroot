import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { setUserSettings } from "@/lib/ai/cache";

const Body = z.object({
  enabled: z.boolean(),
  scope: z.enum(["insights", "issues", "prs", "all"]),
  maxPerDay: z.number().int().min(1).max(500),
  provider: z.string().nullable(),
});

export async function POST(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ message: "Invalid settings" }, { status: 400 });
  try {
    await setUserSettings(me.id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ message: (e as Error).message }, { status: 500 });
  }
}
