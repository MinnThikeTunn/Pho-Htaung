import { expect, test } from '@playwright/test';
import { newCampaign } from '../../src/domain/settlement';
test.beforeEach(async ({ page }) => {
  const c = newCampaign('arena-browser-fixture'); c.bridgeCompleted = true; c.chapter2Completed = true; c.chapter3Completed = true;
  c.resumeAt = 'CHAPTER_4_PENDING'; c.walletCoins = 5; c.ownedTools = ['slingshot'];
  // Isolated legal prior-chapter boundary; not a proof of clearing Chapters1–3.
  await page.addInitScript(value => { if (!localStorage.getItem('phoe-htaung.adventure.v2')) localStorage.setItem('phoe-htaung.adventure.v2', JSON.stringify(value)); }, c);
  await page.goto('/'); await page.locator('#start').click(); await expect(page.locator('#arena-hp')).toBeVisible();
});
test('Chapter4 exposes all three health bars and waits for actual input', async ({ page }) => {
  await expect(page.locator('#arena-hp-label')).toHaveText('100 / 100');
  await expect(page.locator('#brown-hp-label')).toHaveText('150 / 150'); await expect(page.locator('#silver-hp-label')).toHaveText('150 / 150');
  await expect(page.locator('#arena-time')).toHaveText('75 s');
});
test('pause cancels a charged shot and does not resume held input', async ({ page }) => {
  await page.keyboard.down('k'); await expect.poll(async()=>Number(await page.locator('#arena-charge').getAttribute('value'))).toBeGreaterThan(.2);
  await page.keyboard.press('Escape'); await page.keyboard.up('k'); const time = await page.locator('#arena-time').textContent();
  await page.keyboard.press('d'); await expect(page.locator('#arena-time')).toHaveText(time!); await page.locator('#arena-resume').click();
  await expect(page.locator('#arena-ammo')).toHaveText('12');
});
