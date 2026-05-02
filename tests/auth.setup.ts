/**
 * Auth Setup
 *
 * Logs in once with test credentials and saves the session to disk.
 * All tests in tests/authenticated/ reuse this saved session.
 *
 * Required env vars (add to .env.test or export before running):
 *   TEST_USER_EMAIL=your-test-account@example.com
 *   TEST_USER_PASSWORD=your-test-password
 *
 * Run authenticated tests:
 *   TEST_USER_EMAIL=... TEST_USER_PASSWORD=... npx playwright test --project=setup --project=authenticated
 */

import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    console.warn(
      '\n⚠️  Skipping auth setup: TEST_USER_EMAIL and TEST_USER_PASSWORD env vars not set.\n' +
      '   Authenticated tests will be skipped.\n'
    );
    // Write an empty storage state so dependent tests don't crash
    await page.context().storageState({ path: authFile });
    return;
  }

  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for redirect to /audit (authenticated users land here)
  await expect(page).toHaveURL('/audit', { timeout: 10_000 });

  // Save the session state for all authenticated tests
  await page.context().storageState({ path: authFile });
});
