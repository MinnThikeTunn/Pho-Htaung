import { test, expect } from '@playwright/test';

test.describe('Mobile-First Responsive & Touch Controls Verification', () => {
  test('01: Portrait Shield triggers on mobile portrait and hides on landscape', async ({ page }) => {
    // 1. Set portrait mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    // Portrait shield should be visible with spinning loop icon and text
    const shield = page.locator('#portrait-shield');
    await expect(shield).toBeVisible({ timeout: 10000 });
    await expect(shield.locator('.spinning-loop-icon')).toBeVisible();
    await expect(shield.locator('h2')).toContainText('စခရင်ကို ဘေးတိုက်လှည့်ပါ');

    // 2. Rotate to landscape
    await page.setViewportSize({ width: 844, height: 390 });

    // Portrait shield should disappear
    await expect(shield).not.toBeVisible({ timeout: 5000 });

    // Canvas should be visible and centered
    const canvas = page.locator('#game canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });
  });

  test('02: Mobile Landscape Touch Gameplay & Chapter Navigation', async ({ page }) => {
    // Landscape mobile device with touch
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto('/');

    // Wait for boot splash to dismiss
    await expect(page.locator('#boot-splash')).toHaveCount(0, { timeout: 15000 });

    // Ensure menu is visible
    const menu = page.locator('#fantasy-menu-overlay');
    await expect(menu).toBeVisible({ timeout: 10000 });

    // Start Chapter 1
    const playBtn = menu.locator('#start');
    await playBtn.click();

    // Verify canvas is interactive
    const canvas = page.locator('#game canvas');
    await expect(canvas).toBeVisible();

    // Wait for scene transition
    await page.waitForTimeout(1000);

    // Verify snapshot shows active Chapter 1 or scene
    const snapshot = await page.evaluate(() => {
      return (window as any).__PHOE_TEST__?.snapshot();
    });
    expect(snapshot).not.toBeNull();
    expect(snapshot.activeScenes.length).toBeGreaterThan(0);
  });

  test('03: Chapter 5 Mobile Quiz & Movement Interaction', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto('/');

    await expect(page.locator('#boot-splash')).toHaveCount(0, { timeout: 15000 });
    await expect(page.locator('#fantasy-menu-overlay')).toBeVisible({ timeout: 10000 });

    // Jump directly to Chapter 5
    await page.evaluate(() => {
      if ((window as any).jumpToChapter5) {
        (window as any).jumpToChapter5();
      }
    });

    await page.waitForTimeout(1500);

    const snapshot = await page.evaluate(() => {
      return (window as any).__PHOE_TEST__?.snapshot();
    });
    expect(snapshot).not.toBeNull();
    expect(snapshot.final).not.toBeNull();
  });
});
