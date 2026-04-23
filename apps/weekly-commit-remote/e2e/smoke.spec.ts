import { expect, test } from '@playwright/test';

test.describe('Weekly Commit Remote — smoke tests', () => {
  test('planner page loads with commits', async ({ page }) => {
    await page.goto('/me');

    // Wait for MSW-backed data to render — a known commit title from mock handlers
    await page.waitForSelector('text=Ship audit-log export beta to 5 design partners');

    // Verify multiple commit cards are visible
    await expect(page.locator('text=Draft Q3 pricing experiment spec with Finance')).toBeVisible();
    await expect(page.locator('text=Onboard Finch as enterprise design partner')).toBeVisible();

    // Sidebar summary card should show the commit count
    await expect(page.locator('text=Planned')).toBeVisible();
  });

  test('can navigate to team page', async ({ page }) => {
    await page.goto('/me');

    // Wait for initial page to be ready
    await page.waitForSelector('text=Ship audit-log export beta to 5 design partners');

    // Click the Team nav link
    await page.click('text=Team');

    // Manager queue should load with exception cards from MSW data
    await expect(page.locator('text=things need you')).toBeVisible();
    await expect(page.locator('text=Sarah Mitchell')).toBeVisible();
  });

  test('can navigate to reconcile page', async ({ page }) => {
    await page.goto('/me');

    // Wait for initial page to be ready
    await page.waitForSelector('text=Ship audit-log export beta to 5 design partners');

    // Click the Reconcile nav link
    await page.click('text=Reconcile');

    // In DRAFT state, reconcile page shows the "not yet" message
    await expect(page.locator('text=Not quite time yet')).toBeVisible();
    await expect(page.locator('text=Lock your plan first')).toBeVisible();
  });

  test('can open edit form modal', async ({ page }) => {
    await page.goto('/me');

    // Wait for commits to render
    await page.waitForSelector('text=Ship audit-log export beta to 5 design partners');

    // Click the first Edit button on a commit card
    await page.locator('button:has-text("Edit")').first().click();

    // The modal should open with the edit form
    await expect(page.locator('text=Edit commit')).toBeVisible();

    // Form fields should be present
    await expect(page.locator('label:has-text("Title")')).toBeVisible();
    await expect(page.locator('label:has-text("Expected evidence")')).toBeVisible();

    // Cancel button should be available to close the modal
    await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
  });

  test('lifecycle bar shows DRAFT state', async ({ page }) => {
    await page.goto('/me');

    // Wait for page content to load
    await page.waitForSelector('text=Ship audit-log export beta to 5 design partners');

    // The LifecycleBar renders four step labels; "Draft" should be the active one
    await expect(page.locator('text=Draft').first()).toBeVisible();
    await expect(page.locator('text=Locked').first()).toBeVisible();
    await expect(page.locator('text=Reconciling').first()).toBeVisible();
    await expect(page.locator('text=Reconciled').first()).toBeVisible();

    // The instructional text for DRAFT state should be visible in the PlanHeader
    await expect(
      page.locator('text=Lock your week by Monday 10am')
    ).toBeVisible();
  });
});
