import Link from "next/link";
export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg p-6 text-center text-text">
      <div>
        <p className="text-xs uppercase tracking-wider text-text-dim">404</p>
        <h1 className="mt-1 text-2xl font-semibold">Repo or page not found</h1>
        <p className="mt-2 text-sm text-text-muted">The repo you tried to inspect either doesn't exist, is private, or hit a GitHub rate limit.</p>
        <Link href="/dashboard" className="mt-4 inline-block rounded-md bg-accent px-4 py-2 font-semibold text-bg">Back to dashboard</Link>
      </div>
    </main>
  );
}
