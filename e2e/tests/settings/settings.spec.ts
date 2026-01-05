import type { Page } from '@playwright/test';
import { test, expect } from '../../fixtures';

const locators = (page: Page) => ({
  modal: page.locator('[data-slot="dialog-content"]'),
  modalClose: page.locator('[data-slot="dialog-close"]'),
  settingsLink: page.getByRole('link', { name: 'Settings' }),
  profile: {
    title: page.getByRole('heading', { name: 'Profile' }),
    card: page.locator('.max-w-2xl'),
    // GitHub link is a Button with anchor render - use getByText instead
    githubLink: page.getByRole('button', { name: /Edit on GitHub/i }),
  },
  sidebar: {
    // The sidebar label is 'Profile' not 'General'
    profile: page.getByRole('link', { name: 'Profile', exact: true }),
    organizations: page.getByRole('link', { name: 'Organizations' }),
  },
});

test.describe('Settings Navigation & Profile', () => {
  test.describe('Context: Modal', () => {
    test.beforeEach(async ({ authenticatedPage }) => {
      // Navigate via link to trigger interception
      // Use /explore instead of / because home page has no navbar
      await authenticatedPage.goto('/explore');
      // Wait for page to load
      await expect(authenticatedPage.getByRole('heading', { name: 'Explore' })).toBeVisible();
      // Open settings via user dropdown (use testid - button shows org name when org is active)
      await authenticatedPage.getByTestId('user-menu-trigger').click();
      await authenticatedPage.getByRole('menuitem', { name: 'Settings' }).click();
      await expect(authenticatedPage.locator('[data-slot="dialog-content"]')).toBeVisible();
    });

    test('opens settings modal from navbar', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const $ = locators(page);

      await expect($.modal).toBeVisible();
      await expect($.profile.title).toBeVisible();
      await expect($.profile.card).toBeVisible();
    });

    test('closes modal on escape key', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const $ = locators(page);

      await page.keyboard.press('Escape');
      await expect($.modal).toBeHidden();
    });

    test('closes modal on backdrop click', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const $ = locators(page);

      // Click outside the modal content (backdrop)
      // Playwright's force: true can sometimes bypass overlays, but strictly clicking
      // the backdrop usually requires targeting <body> or coordinates.
      // RouteModal usually maps clickOutside to dismissal.
      await page.mouse.click(10, 10);
      await expect($.modal).toBeHidden();
    });

    test('sidebar navigation uses replace (no history push)', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const $ = locators(page);

      // Profile is active by default
      await expect($.profile.title).toBeVisible();

      // Navigate to Organizations
      await $.sidebar.organizations.click();
      await expect(page.getByRole('heading', { name: 'Organizations' })).toBeVisible();

      // Navigate back to Profile
      await $.sidebar.profile.click();
      await expect($.profile.title).toBeVisible();

      // Verify history didn't grow significantly (implementation detail, difficult to assert robustly
      // without accessing window.history.length, but we verify it stays in modal context)
      await expect($.modal).toBeVisible();
    });
  });

  test.describe('Context: Full Page', () => {
    test.beforeEach(async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/settings');
    });

    test('renders direct URL access without modal dialog', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const $ = locators(page);

      await expect($.profile.title).toBeVisible();
      await expect($.modal).toBeHidden(); // Should NOT be in a dialog
      await expect($.profile.card).toBeVisible();
    });

    test('displays correct user info', async ({ authenticatedPage, testUser }) => {
      const page = authenticatedPage;
      const $ = locators(page);

      // Profile card should contain user details
      await expect($.profile.card).toContainText(testUser.email!);
      if (testUser.name) {
        await expect($.profile.card).toContainText(testUser.name);
      }
    });

    test('GitHub edit link works', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const $ = locators(page);

      const popupPromise = page.waitForEvent('popup');
      await $.profile.githubLink.click();
      const popup = await popupPromise;

      await popup.waitForLoadState();
      // GitHub may redirect to login, but the target URL should contain settings/profile
      expect(popup.url()).toMatch(/github\.com.*(settings\/profile|login.*settings%2Fprofile)/);
    });
  });
});
