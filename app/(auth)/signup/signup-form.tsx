"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, PrimaryButton } from "@/components/ui";
import { UserPlus } from "lucide-react";

export function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const r = useRouter();
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null); setBusy(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setMsg(data.message ?? "Signup failed."); return; }
      r.push("/dashboard"); r.refresh();
    } finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="space-y-4 text-sm">
      <label className="block">
        <span className="text-xs font-medium text-text-muted">Name</span>
        <Input autoComplete="name" required minLength={1} maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" className="mt-1" />
      </label>
      <label className="block">
        <span className="text-xs font-medium text-text-muted">Email</span>
        <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1" />
      </label>
      <label className="block">
        <span className="text-xs font-medium text-text-muted">Password</span>
        <Input type="password" autoComplete="new-password" required minLength={8} maxLength={200} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8+ characters" className="mt-1" />
      </label>
      {msg ? <p className="text-xs text-error">{msg}</p> : null}
      <PrimaryButton type="submit" disabled={busy}><UserPlus className="h-4 w-4" /> {busy ? "Creating…" : "Create account"}</PrimaryButton>
    </form>
  );
}
