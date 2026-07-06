"use client";
import { usePathname } from "next/navigation";
import { Suspense, useMemo } from "react";
import { ChatRoot } from "@/components/chat/chat-panel";

interface Props {
  defaultRepo: { owner: string; name: string };
  user: { name: string; email: string };
  insights?: Array<{ id: string; title: string; body: string; severity: "info" | "warn" | "alert" | "critical" }>;
}

export function ChatMount(props: Props) {
  const pathname = usePathname();
  const parsed = useMemo(() => {
    const m = pathname?.match(/^\/dashboard\/r\/([^/]+)\/([^/]+)\/?/);
    if (m) return { owner: m[1], name: m[2] };
    return props.defaultRepo;
  }, [pathname, props.defaultRepo]);

  return (
    <Suspense fallback={null}>
      <ChatRoot repo={parsed} user={props.user} insights={props.insights} />
    </Suspense>
  );
}
