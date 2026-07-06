# TraceRoot

AI-powered engineering intelligence for any public GitHub repository.

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local — at minimum set SESSION_SECRET to a 32+ char random string

# 3. Run dev server
npm run dev
```

Open http://localhost:3000

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `SESSION_SECRET` | Yes (prod) | Iron-session encryption key, 32+ chars. Dev fallback exists. |
| `GITHUB_TOKEN` | Recommended | GitHub PAT for 5k/hr API limit (vs 60/hr without). No scopes needed. |
| `DATABASE_URL` | No | SQLite path. Defaults to `./data/traceroot.db` |
| `OPENAI_API_KEY` | No | Enables AI suggestions + chat copilot via OpenAI |
| `ANTHROPIC_API_KEY` | No | Enables AI suggestions + chat copilot via Anthropic |
| `AI_GITHUB_TOKEN` | No | Enables AI via GitHub Models |
| `AI_PROVIDER` | No | `openai` / `anthropic` / `github-models` / `stub` |

Without any AI keys, the app runs in **heuristic-only mode** — all insights,
release scores, action items, and fix proposals still work.

## Features

- **Split-screen auth**: Green brand panel + white form for login/signup
- **9-tab repo dashboard**: Overview, Issues, AI Suggestions, AI Fixes, PRs, Contributors, Activity, Codebase, Security
- **Release readiness score** (0–100) with explainable factors
- **Issue intelligence**: classification, severity, priority, duplicate detection
- **PR risk analysis**: stale PRs, draft pile-up, missing tests
- **Contributor analytics**: bus factor, top contributors, contribution bars
- **Codebase signals**: file risk heatmap, hotspot detection
- **30-day activity trends**: commits, issues, PRs
- **AI fix engine**: patch diffs, confidence scores, regression risk, test suggestions
- **AI chat copilot**: streaming chat with repo context (floating widget)
- **Shareable reports**: public `/share/{owner}/{name}` links
- **Export**: download JSON report

## Tech stack

- Next.js 15 (App Router, Server Components)
- React 19
- Tailwind CSS 3 (custom light theme)
- Drizzle ORM + better-sqlite3
- iron-session (cookie-based auth)
- lucide-react icons

## Color theme

Light theme with:
- Background: `#f7f8fa` / `#ffffff` (panels)
- Text: `#1a1b26` (dark) / `#525c6e` (muted) / `#8b95a5` (dim)
- Accent: `#2d8659` (forest green)
- Warning: `#b8730a` (amber)
- Error: `#c94040` (red)
- Ring/focus: `#3b6dd4` (blue)
- Dark code sections: `#131826`
- AI suggestion cards: dark `#17161b` with green `#a0c0a0` accents
- Chat widget: violet/fuchsia floating panel

## Build

```bash
npm run build    # production build
npm start        # start production server
npm run typecheck  # TypeScript check
```
