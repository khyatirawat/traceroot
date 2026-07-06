import type { ReactNode } from "react";
import { currentUser } from "@/lib/auth";
import { Nav } from "@/components/nav";
import { redirect } from "next/navigation";
export default async function SettingsLayout({ children }: { children: ReactNode }) {
  const me = await currentUser();
  if (!me) redirect("/login");
  return <Nav user={{ name: me.name, email: me.email }}>{children}</Nav>;
}
