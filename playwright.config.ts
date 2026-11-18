import { defineConfig } from '@playwright/test'

/*
 * Browser tests: `npm run e2e`. First time on a machine, install the browser
 * once with `npx playwright install chromium`.
 *
 * Two projects on one preview server (:4174):
 *   e2e   every e2e/**\/*.e2e.ts spec, in parallel (`npm run e2e`);
 *   perf  the speed harness, e2e/perf/*.perf.ts, one worker (`npm run perf`).
 * In CI: an HTML report and traces for failures (uploaded as artifacts), and
 * GitHub annotations.
 */

const CI = !!process.env.CI
// One id per run, inherited by the workers, so the perf harness can fold results across a worker restart.
process.env.PERF_RUN_ID ??= String(Date.now())

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  reporter: CI ? [['list'], ['github'], ['html', { open: 'never', outputFolder: 'playwright-report' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4174',
    viewport: { width: 1440, height: 900 },
    trace: CI ? 'retain-on-failure' : 'off',
  },
  projects: [
    { name: 'e2e', testMatch: '**/*.e2e.ts' },
    // 30+ timed presses per test on a 1,000-item board: slow runners need more than the default 30s.
    { name: 'perf', testMatch: 'perf/**/*.perf.ts', fullyParallel: false, retries: 0, timeout: 180_000 },
  ],
  webServer: {
    command: 'npm run build && npx vite preview --port 4174 --strictPort',
    port: 4174,
    reuseExistingServer: !CI,
    timeout: 120_000,
  },
})
