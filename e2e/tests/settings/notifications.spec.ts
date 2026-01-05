import type { Page } from '@playwright/test';
import { test, expect } from '../../fixtures';

const locators = (page: Page) => ({
  heading: page.getByRole('heading', { name: 'Notification Preferences' }),

  // Switches - use the hidden checkbox ID to find the containing group, then get the switch within it
  // Structure: group contains [label, switch, checkbox(id=xxx)]
  emailBountyFunded: page.locator('[role="group"]:has(#emailBountyFunded) [role="switch"]'),
  emailSubmissionReceived: page.locator(
    '[role="group"]:has(#emailSubmissionReceived) [role="switch"]'
  ),
  inAppEnabled: page.locator('[role="group"]:has(#inAppEnabled) [role="switch"]'),

  // Quiet Hours
  quietHoursStart: page.locator('#quietHoursStart'),
  quietHoursEnd: page.locator('#quietHoursEnd'),
  timezoneSelect: page.locator('#quietHoursTimezone'),
});

// Run serially to avoid database conflicts with notification_preferences table
test.describe
  .serial('Notification Settings', () => {
    test.beforeEach(async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/settings/notifications');
      // Ensure page content is loaded
      await expect(
        authenticatedPage.getByRole('heading', { name: 'Notification Preferences' })
      ).toBeVisible();
    });

    test('optimistically toggles preferences', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const $ = locators(page);

      await expect($.heading).toBeVisible();

      // Scroll to element and get initial state
      await $.emailBountyFunded.scrollIntoViewIfNeeded();
      const isChecked = await $.emailBountyFunded.isChecked();

      // Toggle
      await $.emailBountyFunded.click();

      // Check new state instantly (optimistic)
      await expect($.emailBountyFunded).toBeChecked({ checked: !isChecked });

      // Check persistance (reload)
      await page.reload();
      await $.emailBountyFunded.scrollIntoViewIfNeeded();
      await expect($.emailBountyFunded).toBeChecked({ checked: !isChecked });
    });

    test('Quiet Hours: inputs work correctly', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const $ = locators(page);

      // Scroll to quiet hours section
      await $.quietHoursStart.scrollIntoViewIfNeeded();

      // Set times
      await $.quietHoursStart.fill('22:00');
      await $.quietHoursEnd.fill('08:00');

      // Set Timezone (Select trigger)
      await $.timezoneSelect.click();
      await page.getByRole('option', { name: 'Pacific Time (PT)' }).click();

      // Wait for API saves to complete (optimistic updates + server sync)
      await page.waitForTimeout(1000);

      // Verify persistence
      await page.reload();
      await $.quietHoursStart.scrollIntoViewIfNeeded();
      await expect($.quietHoursStart).toHaveValue('22:00');
      await expect($.quietHoursEnd).toHaveValue('08:00');
      // Select may show value (America/Los_Angeles) or label (Pacific Time) depending on render
      await expect($.timezoneSelect).toContainText(/Pacific|Los_Angeles/);
    });

    test('In-App Notifications switch works', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const $ = locators(page);

      await $.inAppEnabled.scrollIntoViewIfNeeded();
      const isEnabled = await $.inAppEnabled.isChecked();
      await $.inAppEnabled.click();
      await expect($.inAppEnabled).toBeChecked({ checked: !isEnabled });
    });
  });
