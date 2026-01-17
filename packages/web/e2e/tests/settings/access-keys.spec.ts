import type { Page } from '@playwright/test';
import { test, expect } from '../../fixtures';

const locators = (page: Page) => ({
  emptyState: page.getByText('Wallet Required'),
  // Use first() to handle case where both header button and EmptyState button are visible
  createKeyButton: page.getByRole('button', { name: 'Enable Auto-Pay' }).first(),
  // Keys are rendered as Links with border rounded-lg class
  keysList: page.locator('a.block.border.rounded-lg'),

  // Create Flow - Input doesn't have explicit id, use role selector instead
  spendingLimitInput: page.getByRole('spinbutton'),
  submitCreateButton: page.getByRole('button', { name: /Sign & Enable Auto-Pay/i }),

  // Revoke Flow - in list view, uses native confirm()
  revokeButton: page.getByRole('button', { name: 'Revoke' }),
  // Note: List view uses confirm(), detail view uses AlertDialog

  // Section headings for verifying key status
  activeKeysHeading: page.getByRole('heading', { name: 'Active Keys' }),
  revokedKeysHeading: page.getByRole('heading', { name: 'Revoked Keys' }),
  // Badge inside key card
  revokedBadge: page.getByText('Revoked', { exact: true }),
});

// Run all tests serially - they share the same test user's wallet state
test.describe
  .serial('Access Keys Settings', () => {
    test('Empty State: Shows warning when no wallet exists', async ({
      authenticatedPage,
      cleanUserWallet,
    }) => {
      // Ensure no wallet
      await cleanUserWallet();

      await authenticatedPage.goto('/settings/access-keys');
      const $ = locators(authenticatedPage);

      await expect($.emptyState).toBeVisible();
    });

    // Tests requiring wallet - run serially to avoid database conflicts
    test.describe
      .serial('With Wallet', () => {
        test.beforeEach(async ({ authenticatedPage, virtualAuthenticator, cleanUserWallet }) => {
          // Ensure wallet exists - WebAuthn required
          if (!virtualAuthenticator) test.skip();

          // Clean up any existing wallet to ensure consistent state (like onboarding tests do)
          await cleanUserWallet();
          console.log('[access-keys.spec.ts] Cleaned user wallet, creating new wallet');

          await authenticatedPage.goto('/settings/wallet');
          const createBtn = authenticatedPage.getByRole('button', { name: 'Create Wallet' });

          const isBtnVisible = await createBtn.isVisible({ timeout: 5000 });
          console.log('[access-keys.spec.ts] Create Wallet button visible:', isBtnVisible);

          if (!isBtnVisible) {
            throw new Error('Create Wallet button should be visible after cleanUserWallet()');
          }

          // Click to open dialog
          console.log('[access-keys.spec.ts] Opening dialog');
          await createBtn.click();
          await expect(authenticatedPage.getByRole('dialog')).toBeVisible({ timeout: 5000 });

          // Click button inside dialog
          const dialogBtn = authenticatedPage
            .getByRole('dialog')
            .getByRole('button', { name: 'Create Wallet' });
          console.log('[access-keys.spec.ts] Clicking dialog button to start WebAuthn');
          await dialogBtn.click();

          // Wait for wallet creation to complete
          console.log('[access-keys.spec.ts] Waiting for wallet creation');
          await expect(authenticatedPage.getByRole('button', { name: 'Fund' })).toBeVisible({
            timeout: 20000,
          });
          console.log('[access-keys.spec.ts] Wallet created, navigating to access-keys');

          await authenticatedPage.goto('/settings/access-keys');
        });

        test('Create Flow: Successfully creates a new key', async ({ authenticatedPage }) => {
          const page = authenticatedPage;
          const $ = locators(page);

          // Click the create button (locator already uses .first() to handle multiple buttons)
          await $.createKeyButton.click();

          // Inline form or modal should appear
          // Fill spending limit
          await $.spendingLimitInput.fill('100');

          // Handle WebAuthn
          await $.submitCreateButton.click();

          // Verification
          // Should appear in list
          await expect($.keysList.first()).toBeVisible({ timeout: 10000 });
          // Check spending limit text - use first() to handle case where multiple keys exist
          await expect(page.getByText('$100 USDC').first()).toBeVisible();
        });

        test('Revoke Flow: Moves key to revoked section', async ({ authenticatedPage }) => {
          const page = authenticatedPage;
          const $ = locators(page);

          // First create a key to revoke (if none exists)
          // The createKeyButton locator already uses .first() to handle multiple buttons
          const buttonVisible = await $.createKeyButton
            .isVisible({ timeout: 2000 })
            .catch(() => false);
          console.log('[revoke-test] Enable Auto-Pay button visible:', buttonVisible);

          if (buttonVisible) {
            await $.createKeyButton.click();
            await $.spendingLimitInput.fill('50');
            console.log('[revoke-test] Submitting key creation');
            await $.submitCreateButton.click();
            // Wait longer for key creation (includes WebAuthn signing)
            await expect($.keysList.first()).toBeVisible({ timeout: 20000 });
            console.log('[revoke-test] Key created successfully');
            await page.waitForTimeout(1000); // Wait for list to settle
          }

          // Verify we have an active key with Active badge
          await expect($.activeKeysHeading).toBeVisible();
          await expect(page.getByText('Active', { exact: true })).toBeVisible();

          // Set up handler for native confirm() dialog before clicking
          let dialogHandled = false;
          page.on('dialog', async (dialog) => {
            console.log('[revoke-test] Dialog appeared:', dialog.type(), dialog.message());
            await dialog.accept();
            dialogHandled = true;
          });

          // Click revoke on the first key
          console.log('[revoke-test] Clicking revoke button');
          await $.revokeButton.first().click();

          // Wait a bit for the dialog to be handled
          await page.waitForTimeout(500);
          console.log('[revoke-test] Dialog handled:', dialogHandled);

          // Verify revoke was successful:
          // 1. Key moves to "Revoked Keys" section
          await expect($.revokedKeysHeading).toBeVisible({ timeout: 10000 });
          // 2. Key shows "Revoked" badge
          await expect($.revokedBadge).toBeVisible();
          // 3. "Active Keys" section should be gone (no active keys)
          await expect($.activeKeysHeading).toBeHidden();
          // 4. "Enable Auto-Pay" button should reappear
          await expect($.createKeyButton).toBeVisible();
        });
      });
  });
