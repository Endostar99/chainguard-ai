/**
 * Pricing Page Tests
 *
 * Covers /pricing — plan cards, prices, feature lists, and CTAs.
 * No auth required.
 */

import { test, expect } from '@playwright/test';

test.describe('Pricing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pricing');
  });

  // ─── Page structure ───────────────────────────────────────────────────────

  test('renders the pricing heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /simple, transparent pricing/i })
    ).toBeVisible();
  });

  test('shows "Cancel or change plans any time" message', async ({ page }) => {
    await expect(page.getByText(/cancel or change plans any time/i)).toBeVisible();
  });

  // ─── Plan cards ───────────────────────────────────────────────────────────

  test('shows all three plan names', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Free' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Starter' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pro' })).toBeVisible();
  });

  test('Free plan shows $0/month', async ({ page }) => {
    const freeCard = page.locator('div').filter({ hasText: /^Free/ }).first();
    await expect(freeCard.getByText('$0')).toBeVisible();
  });

  test('Starter plan is marked as "Most popular"', async ({ page }) => {
    await expect(page.getByText('Most popular')).toBeVisible();
  });

  test('all plans show a price per month', async ({ page }) => {
    const monthLabels = page.getByText('/month');
    await expect(monthLabels).toHaveCount(3);
  });

  // ─── Free plan features ───────────────────────────────────────────────────

  test('Free plan lists 3 audits per month', async ({ page }) => {
    await expect(page.getByText('3 audits per month')).toBeVisible();
  });

  test('Free plan includes PDF export', async ({ page }) => {
    await expect(page.getByText('PDF export')).toBeVisible();
  });

  test('Free plan includes Trust score', async ({ page }) => {
    await expect(page.getByText(/trust score/i).first()).toBeVisible();
  });

  // ─── Starter plan features ────────────────────────────────────────────────

  test('Starter plan lists 20 audits per month', async ({ page }) => {
    await expect(page.getByText('20 audits per month')).toBeVisible();
  });

  test('Starter plan includes Trust badge', async ({ page }) => {
    await expect(page.getByText(/trust badge/i)).toBeVisible();
  });

  // ─── Pro plan features ────────────────────────────────────────────────────

  test('Pro plan lists 100 audits per month', async ({ page }) => {
    await expect(page.getByText('100 audits per month')).toBeVisible();
  });

  test('Pro plan includes Bulk contract upload', async ({ page }) => {
    await expect(page.getByText(/bulk contract upload/i)).toBeVisible();
  });

  // ─── CTAs (logged-out state) ──────────────────────────────────────────────

  test('Free plan shows "Get started free" CTA when logged out', async ({ page }) => {
    await expect(
      page.getByRole('link', { name: /get started free/i })
    ).toBeVisible();
  });

  test('"Get started free" on Free plan links to /signup', async ({ page }) => {
    const link = page.getByRole('link', { name: /get started free/i });
    await expect(link).toHaveAttribute('href', '/signup');
  });

  test('paid plan CTAs link to signup when logged out', async ({ page }) => {
    const starterBtn = page.getByRole('link', { name: /get started/i }).first();
    await expect(starterBtn).toHaveAttribute('href', /\/signup/);
  });

  // ─── Footer ───────────────────────────────────────────────────────────────

  test('shows "Payments processed securely by Stripe" note', async ({ page }) => {
    await expect(page.getByText(/payments processed securely by stripe/i)).toBeVisible();
  });
});
