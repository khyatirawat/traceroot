import Link from "next/link";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  const exists = (await db.select().from(users).limit(1)).length > 0;
  return (
    <div>
      <h1 className="text-2xl font-bold text-text">Welcome back</h1>
      <p className="mt-1.5 text-sm text-text-muted">Log in to your traceroot account.</p>
      <div className="mt-6"><LoginForm nextPath={params.next} /></div>
      <p className="mt-6 text-center text-sm text-text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold text-accent hover:text-accent-hover">Sign up</Link>
      </p>
      {exists ? null : <p className="mt-3 text-center text-xs text-text-dim">No users yet — yours would be first.</p>}
    </div>
  );
}
