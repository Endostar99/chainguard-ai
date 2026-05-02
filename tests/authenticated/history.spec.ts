/**
 * Authenticated Tests — History & Dashboard
 *
 * These tests run with a real logged-in session (saved by auth.setup.ts).
 *
 * To run:
 *   TEST_USER_EMAIL=... TEST_USER_PASSWORD=... npx playwright test --project=setup --project=authenticated
 */

import { test, expect } from '@playwright/test';

test.describe('History page (authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/history');
  });

  test('does not redirect to login', async ({ page }) => {
    await expect(page).toHaveURL('/history');
  });

  test('shows "Audit History" heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /audit history/i })
    ).toBeVisible();
  });

  test('shows the logged-in user email', async ({ page }) => {
    // The email is rendered as a link in the header
    const email = process.env.TEST_USER_EMAIL;
    if (email) {
      await expect(page.getByText(email)).toBeVisible();
    }
  });

  test('shows "New audit" button', async ({ page }) => {
    await expect(
      page.getByRole('link', { name: /new audit/i })
    ).toBeVisible();
  });

  test('shows "Upgrade" link to /pricing', async ({ page }) => {
    const upgradeLink = page.getByRole('link', { name: /upgrade/i });
    await expect(upgradeLink).toBeVisible();
    await expect(upgradeLink).toHaveAttribute('href', '/pricing');
  });

  test('shows "Sign out" button', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /sign out/i })
    ).toBeVisible();
  });

  test('shows audit list or empty state', async ({ page }) => {
    // Either there are audit rows or the empty state is shown
    const hasAudits = await page.locator('a[href^="/audit/"]').count() > 0;
    if (hasAudits) {
      // Audit rows should show trust score numbers
      await expect(page.locator('a[href^="/audit/"]').first()).toBeVisible();
    } else {
      await expect(page.getByText(/no audits yet/i)).toBeVisible();
      await expect(
        page.getByRole('link', { name: /run your first audit/i })
      ).toBeVisible();
    }
  });

  test('"New audit" button links to /audit', async ({ page }) => {
    await page.getByRole('link', { name: /new audit/i }).first().click();
    await expect(page).toHaveURL('/audit');
  });
});

test.describe('Authenticated nav (landing page)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows "New audit" instead of "Get started free" when logged in', async ({ page }) => {
    await expect(page.getByRole('link', { name: /new audit/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /get started free/i })).not.toBeVisible();
  });

  test('shows History and Profile links in nav', async ({ page }) => {
    await expect(page.getByRole('link', { name: /history/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /profile/i })).toBeVisible();
  });

  test('does not show "Sign in" link when logged in', async ({ page }) => {
    await expect(page.getByRole('link', { name: /sign in/i })).not.toBeVisible();
  });
});

test.describe('Authenticated redirects', () => {
  test('visiting /login redirects to /audit when logged in', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL('/audit');
  });

  test('visiting /signup redirects to /audit when logged in', async ({ page }) => {
    await page.goto('/signup');
    await expect(page).toHaveURL('/audit');
  });
});
