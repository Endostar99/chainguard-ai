import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    // 1. Auth setup — logs in once, saves session state to disk
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },

    // 2. Public tests — no login required, run across all 3 browsers
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /authenticated\/.*/,
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: /authenticated\/.*/,
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: /authenticated\/.*/,
    },

    // 3. Authenticated tests — reuse saved login session, Chromium only
    //    Requires TEST_USER_EMAIL and TEST_USER_PASSWORD env vars to be set
    {
      name: 'authenticated',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
      testMatch: /authenticated\/.*/,
    },
  ],

  // Uncomment to auto-start the dev server before running tests:
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: true,
  // },
});
