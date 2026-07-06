import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { savedRepos } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Panel, SectionHeader } from "@/components/ui";
import { RemoveRepo } from "./remove-repo";
import { loadAiSettings } from "@/lib/settings";
import { AiSettingsForm } from "./ai-settings-form";

export default async function SettingsPage() {
  const me = await currentUser();
  const repos = await db.select().from(savedRepos).where(eq(savedRepos.userId, me!.id)).orderBy(desc(savedRepos.lastViewedAt));

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <Panel>
        <SectionHeader title="Account" />
        <dl className="divide-y divide-border">
          <Row k="Name"><span>{me!.name}</span></Row>
          <Row k="Email"><span>{me!.email}</span></Row>
          <Row k="Joined"><span>{me!.createdAt.toLocaleDateString()}</span></Row>
          <Row k="User ID"><code className="text-[11px] text-text-dim">{me!.id}</code></Row>
        </dl>
      </Panel>
      <Panel>
        <SectionHeader title="Saved repos" sub="Click to remove them from your list." />
        <ul className="divide-y divide-border">
          {repos.length === 0 ? (
            <li className="px-5 py-4 text-sm text-text-muted">No saved repos.</li>
          ) : repos.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div>
                <p className="text-sm text-text">{r.owner}/{r.name}</p>
                <p className="text-xs text-text-dim">Last viewed {new Date(r.lastViewedAt).toLocaleDateString()}</p>
              </div>
              <RemoveRepo owner={r.owner} name={r.name} />
            </li>
          ))}
        </ul>
      </Panel>
      <Panel>
        <SectionHeader title="AI suggestions" sub="Optional. Suggests fixes for your repo's insights." />
        <div className="px-5 py-4"><AiSettingsForm userId={me!.id} initial={await loadAiSettings(me!.id)} /></div>
      </Panel>
    </div>
  );
}
function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
      <dt className="w-24 text-xs text-text-dim">{k}</dt>
      <dd className="flex-1 text-text">{children}</dd>
    </div>
  );
}
