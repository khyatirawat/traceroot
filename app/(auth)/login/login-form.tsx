"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, PrimaryButton } from "@/components/ui";
import { LogIn } from "lucide-react";

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const r = useRouter();
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null); setBusy(true);
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setMsg(data.message ?? "Login failed."); return; }
      r.push(nextPath ?? "/dashboard");
      r.refresh();
    } finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="space-y-4 text-sm">
      <label className="block">
        <span className="text-xs font-medium text-text-muted">Email</span>
        <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1" />
      </label>
      <label className="block">
        <span className="text-xs font-medium text-text-muted">Password</span>
        <Input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-1" />
      </label>
      {msg ? <p className="text-xs text-error">{msg}</p> : null}
      <PrimaryButton type="submit" disabled={busy}>
        <LogIn className="h-4 w-4" /> {busy ? "Signing in…" : "Log in"}
      </PrimaryButton>
    </form>
  );
}
