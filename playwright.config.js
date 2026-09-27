// playwright.config.js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  // The legacy scripts share global state and can overwhelm WebKit when
  // multiple pages initialize concurrently. Keep E2E deterministic locally
  // and in CI; feature-level parallelism is not needed for this small suite.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'Desktop Chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // Use Chromium with an iPhone viewport for deterministic Windows CI.
      // WebKit is still suitable for a separate device lab, but its local
      // process crashes intermittently after repeated legacy-script reloads.
      name: 'Mobile Chromium (iPhone viewport)',
      use: { ...devices['iPhone 14'], browserName: 'chromium' },
    },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5173',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60 * 1000,
  },
});
