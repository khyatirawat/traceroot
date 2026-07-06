"use client";
import { useState } from "react";
import { Button } from "@/components/ui";
import { Share2, Check } from "lucide-react";
export function ShareButton({ owner, name }: { owner: string; name: string }) {
  const [copied, setCopied] = useState(false);
  async function share() { const url = `${window.location.origin}/share/${owner}/${name}`; try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {} }
  return <Button type="button" onClick={share}>{copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}{copied ? "Link copied" : "Share"}</Button>;
}
