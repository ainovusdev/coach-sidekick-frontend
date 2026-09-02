import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end tests against the LOCAL stack:
 *   backend  http://localhost:8000  (Docker Postgres on :5434)
 *   frontend http://localhost:3010  (`pnpm exec next dev --turbopack -p 3010`)
 *
 * `pnpm e2e` — the global setup reseeds the fixtures through the backend's
 * scripts/seed_local_sandbox_fixtures.py before the run.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3010',
    locale: 'en-US',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    viewport: { width: 1440, height: 900 },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
