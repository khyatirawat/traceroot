# Contributing

Thanks for the interest! traceroot is small enough to hack on in a weekend.

## Local setup
```bash
npm install
cp .env.example .env.local
npm run dev
```

## Checks
```bash
npm run typecheck
npm run lint
npm run build
```

There is currently no unit-test layer. If you add logic to a heuristic
engine, please include a brief demonstration in the PR description.

## Adding a new heuristic
1. Edit `lib/insights.ts` (add a new Insight push).
2. If it should count toward the release score, edit `lib/release-score.ts`
   to include its severity weight.
3. If it's a critical/warn severity, `lib/alerts.ts` already pushes it.

## Pull-request checklist
- [ ] `npm run preflight` passes (typecheck + lint)
- [ ] `npm run build` passes
- [ ] PR includes screenshot(s) if you changed UI
