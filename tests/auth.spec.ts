/**
 * Auth & Routing Tests
 *
 * Covers: login page, signup page, form validation, and
 * middleware-enforced redirects. No real auth calls are made —
 * these tests verify UI behaviour only.
 */

import { test, expect } from '@playwright/test';

// ─── Login page ─────────────────────────────────────────────────────────────

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('renders the login form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /sign in/i }).or(
      page.getByText(/sign in to your account/i)
    )).toBeVisible();
  });

  test('shows email and password fields', async ({ page }) => {
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('shows a submit button', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /sign in/i })
    ).toBeVisible();
  });

  test('shows ChainGuard AI brand', async ({ page }) => {
    await expect(page.getByText(/ChainGuard/i).first()).toBeVisible();
  });

  test('has a link back to the homepage', async ({ page }) => {
    await page.getByRole('link', { name: /chainguard/i }).click();
    await expect(page).toHaveURL('/');
  });

  test('shows link to sign up', async ({ page }) => {
    await expect(
      page.getByRole('link', { name: /sign up|create account|get started/i })
    ).toBeVisible();
  });

  test('submit with empty fields shows browser validation', async ({ page }) => {
    const emailInput = page.getByLabel(/email/i);
    // HTML required attribute prevents submission; field stays focused
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(emailInput).toBeFocused();
  });

  test('displays error message for wrong credentials', async ({ page }) => {
    await page.getByLabel(/email/i).fill('wrong@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();
    // Should stay on /login with an error (not redirect)
    await expect(page).toHaveURL(/\/login/);
    // An error message should appear
    await expect(
      page.getByText(/invalid|incorrect|error|wrong|not found/i)
    ).toBeVisible({ timeout: 8_000 });
  });
});

// ─── Signup page ─────────────────────────────────────────────────────────────

test.describe('Signup page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
  });

  test('renders the signup form', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /create your account/i })
    ).toBeVisible();
  });

  test('shows "3 free audits/month" value proposition', async ({ page }) => {
    await expect(page.getByText(/3 free audits\/month/i)).toBeVisible();
  });

  test('shows email and password fields', async ({ page }) => {
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('shows a create account button', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /create.*account|get started|sign up/i })
    ).toBeVisible();
  });

  test('has link back to login', async ({ page }) => {
    await expect(
      page.getByRole('link', { name: /sign in|log in|already have/i })
    ).toBeVisible();
  });

  test('logo links back to homepage', async ({ page }) => {
    await page.getByRole('link', { name: /chainguard/i }).click();
    await expect(page).toHaveURL('/');
  });
});

// ─── Protected route redirects ────────────────────────────────────────────────

test.describe('Protected route redirects', () => {
  test('unauthenticated /history redirects to /login', async ({ page }) => {
    await page.goto('/history');
    await expect(page).toHaveURL(/\/login\?next=%2Fhistory/);
  });

  test('unauthenticated /profile redirects to /login', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login\?next=%2Fprofile/);
  });

  test('/audit is accessible without login', async ({ page }) => {
    await page.goto('/audit');
    await expect(page).toHaveURL('/audit');
    await expect(page.getByRole('heading', { name: /new audit/i })).toBeVisible();
  });

  test('/pricing is accessible without login', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page).toHaveURL('/pricing');
  });

  test('login page shows "next" redirect param after being redirected', async ({ page }) => {
    await page.goto('/history');
    await expect(page).toHaveURL(/next=%2Fhistory/);
  });
});
