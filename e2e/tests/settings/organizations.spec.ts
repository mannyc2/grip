import type { Page } from '@playwright/test';
import { test, expect } from '../../fixtures';

const locators = (page: Page) => ({
  heading: page.getByRole('heading', { name: 'Organizations' }),
  createButton: page.getByRole('button', { name: 'Create Organization' }),
  // Inline modal back button has arrow prefix
  backButton: page.getByRole('button', { name: /Back/ }),

  // Tabs
  myOrgsTab: page.getByRole('tab', { name: 'My Organizations' }),
  invitationsTab: page.getByRole('tab', { name: 'Pending Invitations' }),

  // Create flow - first select type, then form
  standaloneTypeButton: page.getByRole('button', { name: /Create Standalone/i }),
  // Forms - standalone org form uses "Organization Name" label
  nameInput: page.getByLabel('Organization Name'),
  submitCreateButton: page.getByRole('button', { name: /Create Organization/i }),

  // List Items - Cards in .space-y-3 container
  orgCards: page.locator('.space-y-3 > div'),
  leaveButton: page.getByRole('button', { name: 'Leave' }),

  // Alert Dialog
  alertDialog: page.getByRole('alertdialog'),
  confirmLeaveButton: page.getByRole('button', { name: 'Leave Organization' }),
  cancelLeaveButton: page.getByRole('button', { name: 'Cancel' }),

  // Invitations
  acceptButton: page.getByRole('button', { name: 'Accept' }),
  declineButton: page.getByRole('button', { name: 'Decline' }),
});

test.describe('Organizations Settings', () => {
  test.describe('Modal Context', () => {
    test.beforeEach(async ({ authenticatedPage }) => {
      // Use /explore which has navbar (home page has no navbar)
      await authenticatedPage.goto('/explore');
      await expect(authenticatedPage.getByRole('heading', { name: 'Explore' })).toBeVisible();

      // Open settings via user dropdown (use testid - button shows org name when org is active)
      await authenticatedPage.getByTestId('user-menu-trigger').click();
      await authenticatedPage.getByRole('menuitem', { name: 'Settings' }).click();
      await expect(authenticatedPage.locator('[data-slot="dialog-content"]')).toBeVisible();

      // Navigate to Organizations and wait for it to load
      await authenticatedPage.getByRole('link', { name: 'Organizations' }).click();
      await expect(authenticatedPage.getByRole('heading', { name: 'Organizations' })).toBeVisible();
    });

    test('Create Organization: Inline Flow', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const $ = locators(page);

      await $.createButton.click();

      // Wait for inline create flow to appear (type selector with Back button)
      await expect($.backButton).toBeVisible({ timeout: 5000 });

      // Select standalone type
      await $.standaloneTypeButton.click();

      // Wait for name input to be visible
      await expect($.nameInput).toBeVisible({ timeout: 5000 });

      // Create logic - use simpler name to avoid any potential issues
      const orgName = `TestOrg${Date.now()}`;
      await $.nameInput.fill(orgName);

      // Wait for any pending network requests before clicking submit
      const submitPromise = page
        .waitForResponse(
          (resp) => resp.url().includes('/api/') && resp.request().method() === 'POST',
          { timeout: 15000 }
        )
        .catch(() => null); // Don't fail if no request is made

      await $.submitCreateButton.click();

      // Wait for submission to complete
      await submitPromise;
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      // Success check: should see it in the list (use first() since name appears in sidebar too)
      // The page does router.refresh() after success, so wait longer for data to load
      await expect(page.getByText(orgName).first()).toBeVisible({ timeout: 20000 });
      // Should return to main view (no back button)
      await expect($.backButton).toBeHidden();
    });
  });

  test.describe('Full Page Context', () => {
    test.beforeEach(async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/settings/organizations');
    });

    test('Create Organization: Dialog Flow', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const $ = locators(page);

      await $.createButton.click();

      // Dialog check
      await expect(page.getByRole('dialog')).toBeVisible();

      // Select standalone type first
      await $.standaloneTypeButton.click();

      // Now name input should be visible
      await expect($.nameInput).toBeVisible();

      // Use simpler name to avoid any potential issues
      const orgName = `FullPageOrg${Date.now()}`;
      await $.nameInput.fill(orgName);

      // Wait for any pending network requests
      const submitPromise = page
        .waitForResponse(
          (resp) => resp.url().includes('/api/') && resp.request().method() === 'POST',
          { timeout: 15000 }
        )
        .catch(() => null);

      await $.submitCreateButton.click();

      // Wait for submission to complete
      await submitPromise;
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      // Dialog should close after successful creation
      // setActive() call can be slow, give it extra time
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 25000 });

      // Wait for org to appear in list (router.refresh() loads new data)
      // Use first() since name appears in sidebar too
      await expect(page.getByText(orgName).first()).toBeVisible({ timeout: 20000 });
    });

    test.skip('Leave Organization', async ({ authenticatedPage }) => {
      // Skip: When you create an org, you're the owner and can't leave it
      // This test would need a fixture that creates an org and adds the test user as a non-owner member
      const page = authenticatedPage;
      const $ = locators(page);

      // Ensure we have an org to leave (create one)
      const orgName = `Leave Me ${Date.now()}`;
      await $.createButton.click();
      await $.standaloneTypeButton.click();
      await $.nameInput.fill(orgName);
      await $.submitCreateButton.click();

      // Wait for dialog to close
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10000 });

      // Find the org card
      const card = page.locator('.space-y-3 > div').filter({ hasText: orgName });
      await expect(card).toBeVisible({ timeout: 10000 });

      // Click leave (only visible for non-owners)
      await card.getByRole('button', { name: 'Leave' }).click();

      // Confirm Dialog
      await expect($.alertDialog).toBeVisible();
      await $.confirmLeaveButton.click();

      // Verify removal
      await expect(page.getByText(orgName)).toBeHidden();
    });

    test('Pending Invitations Tab', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const $ = locators(page);

      await $.invitationsTab.click();

      // Expect either empty state or list
      // Just verifying navigation works without crash
      await expect(
        page.getByRole('tab', { name: 'Pending Invitations', selected: true })
      ).toBeVisible();
    });
  });
});
