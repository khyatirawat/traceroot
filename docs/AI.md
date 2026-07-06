# AI suggestion layer — opt-in addon

This document explains the AI suggestion subsystem that ships alongside the heuristic
engines. **Heuristics are the source of truth**; the AI layer *explains*, *drafts*,
and *rates* their findings.

---

## What it does

For each heuristic insight heuristically found on a repo page, the system asks an LLM:

1. **What** is actually happening here (≤280 chars)
2. **Why** it's happening (root cause, ≤600 chars)
3. **What to change** (suggested fix or pseudocode, ≤1200 chars)
4. **What to test** (bullet list of tests to add, ≤600 chars)
5. **What could break** (regression risk in priority order, ≤280 chars)

Results:

- Cached in the **`ai_suggestions`** table for 24 hours per `(user, repo, insight, evidence)`.
- Rendered in a violet-bordered card under each heuristic insight on the repo page.
- Daily-quota'd per user (default 20, configurable in **Settings → AI suggestions**).

## Providers (auto-selected)

| Provider             | Set this env var        | Default model              |
|----------------------|-------------------------|----------------------------|
| github-models (default) | `GITHUB_TOKEN` (or `AI_GITHUB_TOKEN`) | `gpt-4o-mini`            |
| OpenAI               | `OPENAI_API_KEY`        | `gpt-4o-mini`              |
| Anthropic            | `ANTHROPIC_API_KEY`     | `claude-3-5-haiku-20241022`|
| Stub (testing only)  | `AI_PROVIDER=stub`      | `stub-1`                   |

Switch providers via `AI_PROVIDER=openai` (or whatever) in `.env.local`.

## What gets sent to the model

We send a deliberately thin payload:

- Repo name, description, primary language.
- Insight code + the evidence that the heuristic produced (counts, severity tags, file paths).
- Top risky file paths (no file contents — to keep prompts small and avoid leaking code).

Source code is **not** sent. (A future toggle can opt in to summary-level code excerpts.)

## Privacy posture

- Per-user opt-in (toggle in `/dashboard/settings`).
- Per-user daily cap.
- Cache and quota rows are deleted with the user (`ON DELETE CASCADE`).
- Provider errors fall back to heuristic-only rendering — never an empty card.

## Never exposes secrets

No model ever sees your `SESSION_SECRET`, `DATABASE_URL`, or GitHub PAT. The token is
read server-side from the GitHub REST integration only; in the AI prompt, we send the
repo data, not the auth.

## Quick start

```bash
# 1. Update environment
cp .env.example .env.local
echo "AI_PROVIDER=\"github-models\"" >> .env.local
echo "GITHUB_TOKEN=\"github_pat_xxx\"" >> .env.local  # need 'Models: Read' permission

# 2. Migrate DB (idempotent)
npm run db:migrate-ai

# 3. Run the smoke test (no DB required)
npm run test:ai
#    `✅ ai subsystem smoke test passed`

# 4. Restart dev server
npm run dev
```

## Enabling for a user

1. Go to **Settings → AI suggestions**.
2. Toggle **Enable AI suggestions** on.
3. Pick a scope (Insights only / +Issues / +PRs / All).
4. Set a daily cap (default 20).
5. Save.

Open any repo page — heuristic cards continue to render and AI cards stack underneath
each one. Cards show "cached" when served from the local DB without re-querying the
provider.

## Architecture

```
insights (heuristic)        ─── src/lib/insights.ts
       │
       ▼
getOrCreateSuggestion (cache + provider + quota)   ─── src/lib/ai/suggest.ts
       │
       ▼
fetch (OpenAI / Anthropic / GitHub Models)
       │
       ▼
writeCache ─── src/lib/ai/cache.ts → ai_suggestions table
       │
       ▼
<RSC> AiInsightBlock (server) ──── src/app/(dashboard)/dashboard/r/[owner]/[name]/ai-insight-block.tsx
       │
       ▼
<AiSuggestionCard> (client) ──── src/components/ai-suggestion-card.tsx
```

## Adding a new provider

1. Create `lib/ai/providers/<name>.ts` exporting a function that returns `AiProvider`.
2. Add a case to `lib/ai/provider.ts:load()`.
3. Add the credential check to `lib/ai/types.ts:aiEnabled()`.

That's it — no UI changes needed.

## Adding a new insight kind

1. Add the insight code to `lib/insights.ts:generateInsights`.
2. Update `lib/ai/prompts.ts` if the prompt template needs new evidence fields.
3. The cache key (`sha1(insight_code + evidence[:256])`) automatically isolates new insights.

## Files added by this layer

```
src/lib/ai/
├── types.ts                  (AiProvider, AiSuggestion, AiSettings)
├── provider.ts               (factory + caching)
├── prompts.ts                (prompt builder, JSON-mode)
├── suggest.ts                (cache-or-fetch orchestrator)
├── cache.ts                  (DB-backed 24h cache + per-user settings + quota)
├── schema-snippet.ts         (reference: drizzle SQL alternative)
└── providers/
    ├── openai.ts
    ├── anthropic.ts
    ├── github-models.ts
    └── stub.ts               (deterministic, for tests)

src/lib/settings.ts           (settings helper wrapper)

src/app/api/repos/[owner]/[name]/suggestions/route.ts
                            (GET cached or refresh, requires login)

src/components/ai-suggestion-card.tsx
                            (visual card; uses lucide-react icons)

src/app/(dashboard)/dashboard/r/[owner]/[name]/ai-insight-block.tsx
                            (server component; one card per insight)

src/app/(dashboard)/settings/ai-settings-form.tsx
                            (per-user toggle, scope, daily cap, provider override)

scripts/test-ai.ts            (standalone smoke test)
scripts/migrate-ai.ts         (idempotent schema migration)

src/lib/db.ts                 (modified — auto-creates 3 new tables)
src/db/schema.ts              (modified — adds 3 table declarations)
src/app/(dashboard)/settings/page.tsx   (modified — adds AI panel)
src/app/(dashboard)/dashboard/r/[owner]/[name]/page.tsx  (modified — renders AI cards)
src/components/ai-suggestion-card.tsx                    (new)
.env.example                  (modified — adds 4 env vars)
package.json                  (modified — adds 2 scripts)
```

## Costs (very rough)

| Provider                        | Cost per repo page   |
|---------------------------------|----------------------|
| github-models `gpt-4o-mini`     | free for most PATs   |
| OpenAI `gpt-4o-mini`            | ~$0.001 per insight   |
| Anthropic `claude-3-5-haiku`    | ~$0.001 per insight   |

With caching the typical user hits the model only on first visit; re-visits cost $0.


## AI Chat Assistant

Beyond the read-only "AI suggestion cards" stacked under each heuristic insight,
traceroot ships a **full conversational assistant** that lives in a sliding panel
mounted on every dashboard page.

### Where it lives

- **Bottom-right floating bubble** on every dashboard route.
- Click → sliding panel opens (240 ms cubic-bezier).
- Auto-detects active repo from `usePathname()` (`/dashboard/r/{owner}/{name}`).
- One conversation per `(user, repo)` — persisted in `localStorage` only.

### Files

- `src/components/chat/chat-bubble.tsx` — floating button with `breathing` animation.
- `src/components/chat/chat-panel.tsx` — slide-in panel; owns all client state.
- `src/components/chat/chat-markdown.tsx` — zero-dependency markdown (fenced code, lists, headings, links).
- `src/components/chat/chat-message.tsx` — message bubbles + streaming dots.
- `src/components/chat/chat-chips.tsx` — 4 quick prompts: explain / fix / tests / release.
- `src/lib/ai/chat.ts` — message types + constants.
- `src/lib/ai/chat-stream.ts` — server orchestrator + system prompt.
- `src/app/api/chat/route.ts` — POST endpoint, streams Server-Sent Events.
- `src/app/(dashboard)/dashboard/r/[owner]/[name]/chat-mount.tsx` — `usePathname`-aware mount.

### What it can answer

- "Why is the auth hotspot so bad?"
- "Show me a textual diff for the perf fix."
- "Walk me through the release blockers."
- "Suggest 3 quick tests for the release_readiness regressions."

### Streaming contract

The server emits `data: {"type":"delta","text":"..."}\n\n` repeatedly, then
`data: {"type":"done","modelId":"...","provider":"...","latencyMs":...}\n\n`.

The client reads via `ReadableStream` + `TextDecoder`, accumulates into the
assistant bubble, and supports an in-flight **Stop** button (`AbortController`).

### Privacy posture

- The system prompt includes **only** heuristic findings (id, title, body excerpt, severity).
- No source code is sent.
- No conversation is persisted on the server (only in browser localStorage).
- `MAX_CHAT_HISTORY_MESSAGES=50` and `MAX_CHAT_CONTENT_CHARS=4000` cap each request.

### Quick prompts

```
1. "Explain the worst finding on this repo"           ← Wand2 icon
2. "Suggest a fix for the highest-priority finding"   ← FileCode2 icon
3. "Recommend 3-5 tests that catch the worst issues"  ← TestTube2 icon
4. "Summarize release-readiness with top 3 blockers"  ← ShieldAlert icon
```

### UI Notes

- Floating bubble has a gentle 2.4 s `breathing` animation; pauses on hover.
- Header has a green pulsing dot ("online") and a faint gradient background.
- Tailwind animations declared in `tailwind.config.ts`: `chat-pop-in`, `chat-msg-in`, `chat-breathe`.
- Reuses existing violet→fuchsia palette; no extra deps.

## Limitations

- We currently send **no source code** — fixes are necessarily textual or pseudocode.
  Heavier integrations (AST-aware suggestions, multi-file patches) are out of scope here.
- Single-call design — no tool use, no agentic RAG. Add at your own risk.
- The provider is not authenticated per-user. A shared rate-limit may apply. Cache
  aggressively if you expect heavy traffic.
