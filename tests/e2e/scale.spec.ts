import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { newCampaign } from '../../src/domain/settlement';

// Isolated chapter entry fixture, not proof of completing Chapters 1 and 2.
// All Chapter 3 progress below uses the production UI from its real spawn.
test.beforeEach(async ({ page }) => {
  test.setTimeout(90000);
  const campaign = newCampaign('scale-browser-fixture');
  campaign.bridgeCompleted = true; campaign.chapter2Completed = true;
  campaign.walletCoins = 5; campaign.deathCount = 3; campaign.resumeAt = 'CHAPTER_3_PENDING';
  await page.addInitScript(c => {
    if (!sessionStorage.getItem('scale-test-init')) {
      sessionStorage.setItem('scale-test-init', '1');
      localStorage.setItem('phoe-htaung.adventure.v2', JSON.stringify(c));
    }
  }, campaign);
  await page.goto('/'); await page.locator('#start').click(); await expect(page.locator('#scale-pan')).toBeVisible();
});
async function pick(page: Page, id: string) {
  await page.locator(`#world-${id}`).click(); await expect(page.locator(`#bag-${id}`)).toBeVisible({ timeout: 10000 });
}
async function place(page: Page, id: string) {
  const slot = page.locator(`#bag-${id}`);
  if (await slot.getAttribute('aria-pressed') !== 'true') await slot.click();
  await page.locator('#scale-pan').click(); await expect(slot).toBeHidden({ timeout: 10000 });
}
async function open(page: Page) {
  await pick(page, 'stone'); await pick(page, 'treasure'); await place(page, 'stone'); await place(page, 'treasure');
  await expect(page.locator('#scale-state')).toContainText('တံခါးအပြည့်ပွင့်ပြီ', { timeout: 10000 });
}
async function walkOut(page: Page) {
  await page.locator('canvas').focus(); await page.keyboard.down('d');
  await expect(page.locator('#scale-next')).toBeVisible({ timeout: 15000 }); await page.keyboard.up('d');
}
test('Chapter 3 no-treasure clear → Chapter 4 arena → reload keeps progress', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await open(page); await walkOut(page); await expect(page.locator('.result-stats')).toContainText('ထားခဲ့သည်');
  await page.locator('#scale-next').click(); await expect(page.locator('#arena-hp')).toBeVisible();
  await page.reload(); await page.locator('#start').click(); await expect(page.locator('#arena-hp')).toBeVisible();
  expect(errors).toEqual([]);
});
test('pin route recovers treasure and does not mint wallet currency', async ({ page }) => {
  await pick(page, 'pin'); await open(page); await page.locator('#bag-pin').click(); await page.locator('#scale-latch').click();
  await expect(page.locator('#scale-state')).toHaveText('ထိန်းတံ ခံထားပြီ', { timeout: 10000 }); await pick(page, 'treasure');
  await walkOut(page); await expect(page.locator('.result-stats')).toContainText('ပါလာပြီ');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('phoe-htaung.adventure.v2')!));
  expect(saved.walletCoins).toBe(5); expect(saved.deathCount).toBe(3); expect(saved.chapter3TreasureRecovered).toBe(true);
});
test('journal pauses time and whole-attempt retry restores every item', async ({ page }) => {
  await pick(page, 'stone'); await page.locator('#scale-journal').click();
  const time = await page.locator('#scale-time').textContent();
  await page.keyboard.press('d'); await expect(page.locator('#scale-time')).toHaveText(time!);
  await expect(page.locator('#scale-history')).toContainText('ကျောက်တုံး'); await page.locator('#scale-resume').click();
  await page.keyboard.down('r'); await expect(page.locator('#world-stone')).toBeVisible(); await page.keyboard.up('r');
  await expect(page.locator('#bag-stone')).toBeHidden(); await expect(page.locator('#scale-time')).toHaveText('0.00');
});
