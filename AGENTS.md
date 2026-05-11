# AGENTS.md

This is the canonical agent manifest for this project. Claude Code, OpenAI Codex, and Google Gemini all read from here.
Directives, prompts, and reference assets live under `.agents/`. Tool-specific config (`.claude/`, `.codex/`, `.gemini/`) only holds tool-local settings.

## Project context

`clean-gantt` is a standalone hosted Gantt chart web app built with Next.js, React, TypeScript, Tailwind CSS, NextAuth, MongoDB, Vitest, and Playwright.

Core product direction:

- This is a hosted user-facing site, not a self-deploy/admin project.
- No admin dashboard is planned; owner/operator work happens directly in source code.
- Anonymous users can create and edit Gantt charts in the browser.
- Anonymous charts persist only in browser localStorage until the user clears browser data.
- The app must keep a visible warning when a user is not logged in, explaining local-only persistence.
- Signed-in users will persist charts to MongoDB.
- Authentication supports only Google OAuth and GitHub OAuth.
- The editable Gantt UI should combine the existing local-first Gantt functionality with a split task-grid + timeline experience inspired by OnlineGantt.

## User directives (canonical)

Direct edits go here.

- [.agents/directives/01-behavior.md](.agents/directives/01-behavior.md) — Persona, chat rules, autonomous workflow (TODO.md), behavioral guidelines.
- [.agents/directives/02-code.md](.agents/directives/02-code.md) — Coding rules, comment formatting, file naming, testing policy.
- [.agents/directives/03-design.md](.agents/directives/03-design.md) — Design system, Tailwind usage, UI implementation details.
- [.agents/directives/04-workflow.md](.agents/directives/04-workflow.md) — Branch strategy, commit/PR conventions, testing gates, documentation.
- [.agents/directives/05-architecture.md](.agents/directives/05-architecture.md) — Project structure, Next.js app layout, MongoDB persistence, Gantt editor pitfalls, MCP guide.
- [.agents/directives/06-security.md](.agents/directives/06-security.md) — Trust boundaries, OAuth-only auth, localStorage caveats, MongoDB/route guard-rails.

## OMC directives (auto-synced from `.claude/rules/`)

Do not edit directly — managed by oh-my-claudecode. `scripts/sync-omc-directives.mjs` mirrors `.claude/rules/` (gitignored) into `.agents/directives/omc/` (tracked snapshot) on `pnpm install` and pre-commit.

- [.agents/directives/omc/coding-style.md](.agents/directives/omc/coding-style.md)
- [.agents/directives/omc/git-workflow.md](.agents/directives/omc/git-workflow.md)
- [.agents/directives/omc/karpathy-guidelines.md](.agents/directives/omc/karpathy-guidelines.md)
- [.agents/directives/omc/performance.md](.agents/directives/omc/performance.md)
- [.agents/directives/omc/security.md](.agents/directives/omc/security.md)
- [.agents/directives/omc/testing.md](.agents/directives/omc/testing.md)

User directives take precedence over OMC directives on conflict.

## Other shared resources

- `.agents/prompts/` — reusable prompt templates.
- `.agents/prompt-assets/` — reference images for prompts (gitignored).

## File locations (must follow)

| Kind                      | Location                                      |
| ------------------------- | --------------------------------------------- |
| Active plan               | `docs/plans/active/<slug>.md` (gitignored)    |
| Archived plan             | `docs/plans/archive/<slug>.md` (gitignored)   |
| PR body per branch        | `docs/pr/<branch-name>.md` (gitignored)       |
| Working TODO              | `docs/TODO.md` (gitignored)                   |
| Operator notes            | `docs/USER_TASKS.md` (gitignored)             |
| Vendored 3rd-party source | `vendor/<package>-<version>/` (gitignored)    |
| Shared agent assets       | `.agents/{directives,prompts,prompt-assets}/` |

Never create `.md` at repo root except whitelist (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `README.md`).
Plan slugs use kebab-case without `PLAN_` prefix — folder location encodes status.
Detailed naming and commit policy: see [.agents/directives/04-workflow.md](.agents/directives/04-workflow.md).

## Tool-specific entry points

- Claude Code: this file is auto-loaded. `.claude/CLAUDE.md` is a thin redirect.
- Codex CLI: this file is auto-loaded.
- Gemini CLI: `GEMINI.md` redirects here.
