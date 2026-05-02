/**
 * Landing Page Tests
 *
 * Covers the public home page (/) — no auth required.
 * Tests: branding, hero, feature cards, nav links, CTAs.
 */

import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // ─── Branding ───────────────────────────────────────────────────────────────

  test('shows ChainGuard AI brand name in nav', async ({ page }) => {
    await expect(page.getByRole('navigation').getByText('ChainGuard AI')).toBeVisible();
  });

  test('has correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/ChainGuard/i);
  });

  // ─── Hero section ───────────────────────────────────────────────────────────

  test('renders hero headline', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /smart contract audits/i })
    ).toBeVisible();
  });

  test('renders hero subheadline mentioning Claude AI', async ({ page }) => {
    await expect(page.getByText(/Claude AI/i)).toBeVisible();
  });

  test('shows "AI-Powered Security Audits" badge', async ({ page }) => {
    await expect(page.getByText('AI-Powered Security Audits')).toBeVisible();
  });

  // ─── CTAs ───────────────────────────────────────────────────────────────────

  test('"Run free audit" CTA links to /audit', async ({ page }) => {
    const cta = page.getByRole('link', { name: /run free audit/i });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/audit');
  });

  test('shows "No credit card · 3 free audits/month" note', async ({ page }) => {
    await expect(page.getByText(/no credit card/i)).toBeVisible();
  });

  // ─── Nav (unauthenticated) ─────────────────────────────────────────────────

  test('nav shows "Sign in" and "Get started free" when logged out', async ({ page }) => {
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /get started free/i })).toBeVisible();
  });

  test('nav shows Pricing link', async ({ page }) => {
    await expect(page.getByRole('link', { name: /pricing/i })).toBeVisible();
  });

  test('"Sign in" link navigates to /login', async ({ page }) => {
    await page.getByRole('link', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/login');
  });

  test('"Get started free" link navigates to /signup', async ({ page }) => {
    await page.getByRole('link', { name: /get started free/i }).click();
    await expect(page).toHaveURL('/signup');
  });

  // ─── Feature cards ──────────────────────────────────────────────────────────

  test('shows all 4 feature cards', async ({ page }) => {
    await expect(page.getByText('5-minute reports')).toBeVisible();
    await expect(page.getByText('Plain-English reports')).toBeVisible();
    await expect(page.getByText('OWASP Top 10 coverage')).toBeVisible();
    await expect(page.getByText('Trust score badge')).toBeVisible();
  });

  test('feature cards describe key security topics', async ({ page }) => {
    await expect(page.getByText(/reentrancy/i)).toBeVisible();
    await expect(page.getByText(/0–100 security score/i)).toBeVisible();
  });

  // ─── Footer ─────────────────────────────────────────────────────────────────

  test('footer shows copyright notice', async ({ page }) => {
    await expect(page.getByText(/ChainGuard AI. All rights reserved/i)).toBeVisible();
  });

  test('footer shows advisory disclaimer', async ({ page }) => {
    await expect(page.getByText(/advisory only/i)).toBeVisible();
  });
});
