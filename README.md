# Clean Gantt

Hosted Ganttfolio application scaffold.

Users can create Gantt charts freely in the browser without signing in. Anonymous charts are stored in browser `localStorage` and survive page refreshes, but they can disappear when the user clears browser data, changes devices, or uses private browsing. Signing in with Google or GitHub is the only planned way to persist charts to MongoDB.

## Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Fill `.env.local` with Auth.js OAuth and MongoDB values before testing signed-in persistence.

## Required auth providers

Only these login methods are supported:

- Google OAuth: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
- GitHub OAuth: `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`

Do not add password, credentials, magic-link, or self-host-only auth flows.

## Scripts

- `pnpm dev` — start the Next.js dev server.
- `pnpm build` — production build.
- `pnpm typecheck` — TypeScript check.
- `pnpm test` — unit tests.
- `pnpm test:e2e` — Playwright tests.
- `pnpm db:ensure-indexes` — create MongoDB indexes.
