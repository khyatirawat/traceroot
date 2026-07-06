import type { ReactNode } from "react";
import { currentUser } from "@/lib/auth";
import { Nav } from "@/components/nav";
import { redirect } from "next/navigation";
import { ChatMount } from "./r/[owner]/[name]/chat-mount";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const me = await currentUser();
  if (!me) redirect("/login");
  return (
    <Nav user={{ name: me.name, email: me.email }}>
      {children}
      <ChatMount
        defaultRepo={{ owner: "facebook", name: "react" }}
        user={{ name: me.name, email: me.email }}
      />
    </Nav>
  );
}
