# Coach Sidekick — frontend

Next.js 15 / React 19 web app for the Coach Sidekick coaching platform: the coach app, the client portal ("Sidekick"), the admin panel and the sandbox cockpit. It is a client over the FastAPI backend in `../coach-sidekick-backend`; it has no database or API routes of its own.

## Run it locally

```bash
pnpm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8001, NEXT_PUBLIC_WS_URL, PostHog keys
pnpm dev                     # http://localhost:3000
```

Start the backend first (`make run` in `../coach-sidekick-backend`, port 8001). The workspace `/start` skill boots both.

## Check and test

`pnpm lint`; `pnpm e2e` runs the Playwright suite against a dedicated backend and frontend (see `../SANDBOX_HANDOFF.md`). Do not run `pnpm build` locally unless asked; the pre-PR hook does it.

## Ship

Branch off `main`, open a PR to `main`, merge. Vercel deploys `main`.

## More

- `CLAUDE.md` — layout, rules and conventions (written for coding agents, useful for people)
- `CONTEXT.md` — UI glossary
- `../ARCHITECTURE.md` — whole-system overview
