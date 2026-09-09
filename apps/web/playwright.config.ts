import { defineConfig, devices } from "@playwright/test";

/**
 * Base URL the E2E suite runs against, selectable via env rather than
 * hardcoded to one target:
 *   - unset / local           → http://localhost:3000 (local `pnpm dev`)
 *   - PLAYWRIGHT_BASE_URL=... → any deployed target (e.g. Vercel dev sandbox)
 *
 * Example:
 *   PLAYWRIGHT_BASE_URL=https://<preview>.vercel.app pnpm test:e2e
 */
const configuredBaseURL = process.env.PLAYWRIGHT_BASE_URL?.trim() || undefined;
const baseURL = configuredBaseURL ?? "http://localhost:3000";

/** Only boot a local dev server when we're actually targeting it. */
const isLocalTarget = !configuredBaseURL;

const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./e2e",
  // Look for files with the .integ.js or .e2e.js extension
  testMatch: "*.@(integ|e2e).?(c|m)[jt]s?(x)",
  // Timeout per test, test running locally are slower due to database connections with PGLite
  timeout: 30 * 1000,
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? [["html", { open: "never" }], ["github"], ["list"]] : "list",
  expect: {
    // Set timeout for async expect matchers
    timeout: 15 * 1000,
  },
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "Desktop Chrome",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "Desktop Safari",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 14"] },
    },
  ],
  // Only spin up `next dev` when targeting localhost — a Vercel dev sandbox
  // or any other deployed PLAYWRIGHT_BASE_URL is already running.
  webServer: isLocalTarget
    ? {
        command: "pnpm dev",
        url: baseURL,
        timeout: 60 * 1000,
        reuseExistingServer: !isCI,
        gracefulShutdown: { signal: "SIGTERM", timeout: 2 * 1000 },
        env: {
          // All-fixtures dev config — no real backend required (see
          // .env.local.example). Mirrors USE_*_MOCKS=true defaults so the
          // suite is deterministic and offline.
          SEARCH_AGENT_BACKEND: "static_mock",
        },
      }
    : undefined,
});
