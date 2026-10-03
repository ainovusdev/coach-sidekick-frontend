# CLAUDE.md — coach-sidekick-frontend

Guidance for coding agents working in this repo. Workspace-wide rules (deploy flow, session log, dev-server restarts) live in `../AGENTS.md`; the system overview is `../ARCHITECTURE.md`; the glossary is `CONTEXT.md`.

## What this is

A thin Next.js 15 (App Router, Turbopack) + React 19 + TypeScript client over the FastAPI backend in `../coach-sidekick-backend`. All data goes through the backend REST API (`NEXT_PUBLIC_API_URL`) and its WebSockets (`NEXT_PUBLIC_WS_URL`, `src/contexts/websocket-context.tsx`). Auth is a backend-issued JWT held by `authService`. There is no Supabase and there are no Next API routes. Deployed on Vercel from `main`.

## Commands

```bash
pnpm dev     # Turbopack dev server on :3000
pnpm lint    # next lint
pnpm e2e     # Playwright (see ../SANDBOX_HANDOFF.md for the harness rules)
pnpm build   # ONLY when explicitly asked; the pre-PR hook runs it for you
```

Package manager is **pnpm** (`packageManager` in `package.json`); never npm or yarn. Husky pre-commit runs lint-staged. There is no unit-test script; the one file under `src/services/__tests__/` is not wired up.

## Layout

- `src/app/` routes: `clients`, `sessions`, `meeting`, `commitments`, `sandboxes`, `client-portal`, `admin`, `agent`, `settings`, `resources`, `invitations`, `questionnaire`, `checkin`, `auth`
- `src/types/` interfaces matching backend schemas
- `src/services/` static-method classes on `ApiClient` from `@/lib/api-client`
- `src/hooks/queries/` TanStack Query v5 hooks; `src/hooks/mutations/` mutations with toast + cache invalidation
- `src/lib/query-client.ts` query-key factories and defaults; its PostHog error capture skips 4xx, so thrown errors must carry `.status`
- `src/components/ui/` shadcn/Radix components; `src/components/layout/navigation.tsx` coach nav (`allNavItems`); `src/components/client-portal/client-navigation.tsx` portal nav (`navItems`); `src/components/sandboxes/` the sandbox UI (read `../SANDBOX_HANDOFF.md` first)
- `src/lib/roles.ts` (`isCoachRole()`: `trainee` counts as a coach); `src/contexts/permission-context.tsx` (`PermissionGate`, `isViewer`)

## Rules

- **Impersonation headers.** `sessionStorage` `view_as_client_id` / `view_as_coach_id` become `X-View-As-Client` / `X-View-As-Coach`; a coachee's chosen profile `active_client_id` becomes `X-Active-Client`. `api-client.ts` and `axios-config.ts` add them automatically. Any raw `fetch()` (file uploads with `FormData`, a few portal pages) must add them by hand or super-admin view-as silently breaks.
- **Client portal** (`src/app/client-portal/*`): new per-coachee data is keyed by `client_id`, never `user_id`. One user can have several client profiles (`profile-switcher.tsx`).
- Client email is unique per coach, not globally.
- Keep the `useCommitments` filter object shape unchanged; its cache keys are shared across pages.
- **Feature flags** via `useFeatureFlagEnabled('…')` from `src/hooks/use-feature-flag.ts`: `proficiency-rubric`, `sandboxes` (ON for everyone), `notifications` and `comment-threads` (OFF). `THRILL_FORM_ENABLED` is hard-coded in `src/lib/features.ts`. `NEXT_PUBLIC_FEATURE_FLAGS_FORCE_ON` forces flags on locally.
- **PostHog**: initialised in `instrumentation-client.ts`; helpers `posthog-capture.ts`, `posthog-replay.ts`, `posthog-server.ts`; source maps upload from `next.config.ts` only when `POSTHOG_API_KEY` is set. Never enable session recording before the masking code is deployed.
- **Design system**: tokens `bg-paper`, `text-ink*`, `border-line`, status pairs. No raw Tailwind palette colours, no gradients. Conventions: `.design-sync/conventions.md` (currently only on the local `chore/design-sync-setup` branch). Theme is class-based (`localStorage.theme`).
- A green Playwright run cannot see occlusion, dark mode or overflow. Finish UI work with a real-browser pass at desktop, tablet and phone widths in light and dark.

## Environment (`.env.local`)

`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`, `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`, `NEXT_PUBLIC_POSTHOG_HOST`; build-time `POSTHOG_API_KEY`, `POSTHOG_PROJECT_ID`; e2e `E2E_BASE_URL`, `E2E_API_URL`. `RECALL_API_KEY` in `src/lib/config.ts` is vestigial.

## Conventions

- kebab-case files (`meeting-form.tsx`), PascalCase components (`MeetingForm`); `@/` alias for `src/`
- Import order: React/Next → third-party → `@/` internal → relative
- Git: no `Co-Authored-By: Claude` trailer; commit messages say why, not just what
