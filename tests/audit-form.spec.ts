/**
 * Audit Form Tests
 *
 * Covers the /audit page input form — both Paste Code and Upload .sol modes.
 * No AI call is triggered; tests validate UI state, tab switching,
 * input validation, and error messages only.
 */

import { test, expect } from '@playwright/test';
import path from 'path';

const SOL_FIXTURE = path.join(__dirname, 'fixtures/simple.sol');

const VALID_CONTRACT = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VaultTest {
    address public owner;
    mapping(address => uint256) public balances;

    constructor() {
        owner = msg.sender;
    }

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
    }
}`;

test.describe('Audit form — page structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/audit');
  });

  test('renders the New Audit heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /new audit/i })).toBeVisible();
  });

  test('shows optional contract name field', async ({ page }) => {
    await expect(page.getByPlaceholder(/MyToken|StakingVault/i)).toBeVisible();
  });

  test('shows "Paste Code" tab active by default', async ({ page }) => {
    const pasteTab = page.getByRole('button', { name: /paste code/i });
    await expect(pasteTab).toBeVisible();
    // The active tab has a lighter background class
    await expect(pasteTab).toHaveClass(/bg-zinc-700/);
  });

  test('shows "Upload .sol" tab', async ({ page }) => {
    await expect(page.getByRole('button', { name: /upload \.sol/i })).toBeVisible();
  });

  test('shows "Run Security Audit" submit button', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /run security audit/i })
    ).toBeVisible();
  });

  test('shows advisory disclaimer', async ({ page }) => {
    await expect(page.getByText(/advisory only/i)).toBeVisible();
  });
});

// ─── Tab switching ────────────────────────────────────────────────────────────

test.describe('Audit form — tab switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/audit');
  });

  test('clicking "Upload .sol" tab shows the upload drop zone', async ({ page }) => {
    await page.getByRole('button', { name: /upload \.sol/i }).click();
    await expect(page.getByText(/drop your.*\.sol.*file here/i)).toBeVisible();
  });

  test('clicking back to "Paste Code" tab shows the editor', async ({ page }) => {
    await page.getByRole('button', { name: /upload \.sol/i }).click();
    await page.getByRole('button', { name: /paste code/i }).click();
    // CodeMirror editor should be visible
    await expect(page.locator('.cm-editor')).toBeVisible();
  });

  test('upload zone shows "Choose file" button', async ({ page }) => {
    await page.getByRole('button', { name: /upload \.sol/i }).click();
    await expect(page.getByRole('button', { name: /choose file/i })).toBeVisible();
  });

  test('upload zone mentions max 100KB limit', async ({ page }) => {
    await page.getByRole('button', { name: /upload \.sol/i }).click();
    await expect(page.getByText(/100kb/i)).toBeVisible();
  });
});

// ─── Validation errors ────────────────────────────────────────────────────────

test.describe('Audit form — input validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/audit');
  });

  test('submitting with too-short code shows validation error', async ({ page }) => {
    // Button is disabled when empty; type something short to enable it
    await page.locator('.cm-content').click();
    await page.keyboard.type('hi'); // < 10 chars triggers "too short" error
    await page.getByRole('button', { name: /run security audit/i }).click();
    await expect(
      page.getByText(/contract code is too short/i)
    ).toBeVisible();
  });

  test('submit button is disabled when no code is entered', async ({ page }) => {
    const submitBtn = page.getByRole('button', { name: /run security audit/i });
    await expect(submitBtn).toBeDisabled();
  });

  test('submit button becomes enabled after typing code', async ({ page }) => {
    // Click into the CodeMirror editor and type
    await page.locator('.cm-content').click();
    await page.keyboard.type(VALID_CONTRACT);
    const submitBtn = page.getByRole('button', { name: /run security audit/i });
    await expect(submitBtn).toBeEnabled();
  });

  test('uploading a non-.sol file shows a file type error', async ({ page }) => {
    await page.getByRole('button', { name: /upload \.sol/i }).click();
    const fileInput = page.locator('input[type="file"]');

    // Create a fake .txt file via Buffer
    await fileInput.setInputFiles({
      name: 'malicious.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not a contract'),
    });

    await expect(
      page.getByText(/only \.sol files are supported/i)
    ).toBeVisible();
  });

  test('uploading a valid .sol file shows file preview', async ({ page }) => {
    await page.getByRole('button', { name: /upload \.sol/i }).click();
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(SOL_FIXTURE);

    // File name should appear in the preview card
    await expect(page.getByText('simple.sol')).toBeVisible();
  });

  test('uploaded .sol file pre-fills contract name field', async ({ page }) => {
    await page.getByRole('button', { name: /upload \.sol/i }).click();
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(SOL_FIXTURE);

    const nameInput = page.getByPlaceholder(/MyToken|StakingVault/i);
    await expect(nameInput).toHaveValue('simple');
  });

  test('removing uploaded file returns to empty drop zone', async ({ page }) => {
    await page.getByRole('button', { name: /upload \.sol/i }).click();
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(SOL_FIXTURE);

    await page.getByRole('button', { name: /remove file/i }).click();
    await expect(page.getByText('simple.sol')).not.toBeVisible();
  });

  test('uploading .sol file enables the submit button', async ({ page }) => {
    await page.getByRole('button', { name: /upload \.sol/i }).click();
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(SOL_FIXTURE);

    const submitBtn = page.getByRole('button', { name: /run security audit/i });
    await expect(submitBtn).toBeEnabled();
  });
});

// ─── Contract name field ──────────────────────────────────────────────────────

test.describe('Audit form — contract name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/audit');
  });

  test('contract name field is optional (shown with "(optional)" label)', async ({ page }) => {
    await expect(page.getByText(/optional/i)).toBeVisible();
  });

  test('can type a contract name', async ({ page }) => {
    const nameInput = page.getByPlaceholder(/MyToken|StakingVault/i);
    await nameInput.fill('MyVault');
    await expect(nameInput).toHaveValue('MyVault');
  });

  test('contract name is limited to 100 characters', async ({ page }) => {
    const nameInput = page.getByPlaceholder(/MyToken|StakingVault/i);
    await expect(nameInput).toHaveAttribute('maxlength', '100');
  });
});
