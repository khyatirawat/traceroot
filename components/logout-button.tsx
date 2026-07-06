"use client";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button onClick={async () => { setBusy(true); await fetch("/api/auth/logout", { method: "GET" }); router.push("/login"); }} disabled={busy}>
      <LogOut className="h-3.5 w-3.5" /> {busy ? "…" : "Sign out"}
    </Button>
  );
}
