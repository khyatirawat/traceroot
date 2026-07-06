import Link from "next/link";
import { ReactNode } from "react";
import { LayoutDashboard, Settings, LogOut, GitBranch } from "lucide-react";
import { LogoutButton } from "./logout-button";

export function Nav({ user, children }: { user: { name: string; email: string }; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-white/90 px-5 py-2.5 backdrop-blur shadow-sm">
        <Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <GitBranch className="h-4 w-4 text-accent" />
          traceroot
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-text-muted hover:text-text hover:bg-panel-hover"><LayoutDashboard className="h-3.5 w-3.5" /> Dashboard</Link>
          <Link href="/settings" className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-text-muted hover:text-text hover:bg-panel-hover"><Settings className="h-3.5 w-3.5" /> Settings</Link>
          <span className="ml-3 hidden text-xs text-text-dim sm:inline">{user.name} · {user.email}</span>
          <LogoutButton />
        </nav>
      </header>
      <main>{children}</main>
      <footer className="border-t border-border bg-white/60 px-5 py-3 text-center text-[11px] text-text-dim">
        <Link href="/" className="hover:text-text-muted">traceroot</Link> · MIT license · real data from api.github.com
      </footer>
    </div>
  );
}
