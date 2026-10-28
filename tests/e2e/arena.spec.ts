import { expect, test as base } from '@playwright/test';
import { newCampaign } from '../../src/domain/settlement';
const test = base.extend<{ slingOwned: boolean }>({slingOwned:[true,{option:true}]});
test.beforeEach(async ({ page, slingOwned }) => {
  const c = newCampaign('arena-browser-fixture'); c.bridgeCompleted = true; c.chapter2Completed = true; c.chapter3Completed = true;
  c.resumeAt = 'CHAPTER_4_PENDING'; c.walletCoins = 5; c.ownedTools = slingOwned ? ['slingshot'] : [];
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
  await page.locator('#arena-bag').click(); await page.locator('#arena-bag-sling').click();
  await page.keyboard.down('k'); await expect.poll(async()=>Number(await page.locator('#arena-charge').getAttribute('value'))).toBeGreaterThan(.2);
  await page.keyboard.press('Escape'); await page.keyboard.up('k'); const time = await page.locator('#arena-time').textContent();
  await page.keyboard.press('d'); await expect(page.locator('#arena-time')).toHaveText(time!); await page.locator('#arena-resume').click();
  await expect(page.locator('#arena-ammo')).toHaveText('12');
});
test('owned sling starts in the bag, K cannot auto-equip, and actual bag selection enables firing', async ({page}) => {
  await expect(page.locator('#arena-charge-label')).toContainText('လက်ချည်း'); await expect(page.locator('#arena-charge')).toBeHidden();
  await page.keyboard.press('k'); await expect(page.locator('#arena-ammo')).toHaveText('12'); await expect(page.locator('#arena-time')).toHaveText('75 s');
  await page.keyboard.press('b'); await expect(page.locator('#arena-bag-fists')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#arena-bag-sling')).toHaveAttribute('aria-pressed','false'); await page.locator('#arena-bag-sling').click();
  await expect(page.locator('#arena-charge')).toBeVisible();
  await page.keyboard.down('k'); await expect.poll(async()=>Number(await page.locator('#arena-charge').getAttribute('value'))).toBeGreaterThan(.5);
  await page.keyboard.up('k'); await expect(page.locator('#arena-ammo')).toHaveText('11');
  await page.keyboard.press('b'); await page.locator('#arena-bag-fists').click(); await expect(page.locator('#arena-charge')).toBeHidden();
});
test('bag freezes the attempt and cancels held draw without a shot on close', async ({page}) => {
  await page.locator('#arena-bag').click(); await page.locator('#arena-bag-sling').click(); await page.keyboard.down('k');
  await expect.poll(async()=>Number(await page.locator('#arena-charge').getAttribute('value'))).toBeGreaterThan(.2);
  await page.keyboard.press('b'); await page.keyboard.up('k'); const time=await page.locator('#arena-time').textContent();
  await page.waitForTimeout(1000); await expect(page.locator('#arena-time')).toHaveText(time!); await expect(page.locator('#arena-ammo')).toHaveText('12');
  await page.locator('#arena-bag-close').click(); await expect(page.locator('#arena-ammo')).toHaveText('12');
  await page.keyboard.down('r'); await expect(page.locator('#arena-charge')).toBeHidden(); await page.keyboard.up('r');
  await page.locator('#arena-bag').click(); await expect(page.locator('#arena-bag-sling')).toBeVisible();
});
test.describe('without a carried sling',()=>{
  test.use({slingOwned:false});
  test('enters directly with fists and an empty bag, without a forced pickup modal',async({page})=>{
    await expect(page.locator('#arena-modal')).toBeHidden(); await expect(page.locator('#arena-ammo')).toHaveText('—');
    await page.keyboard.press('j'); await expect(page.locator('#arena-time')).not.toHaveText('75 s');
    await page.keyboard.press('b'); await expect(page.locator('#arena-bag-empty')).toBeVisible(); await expect(page.locator('#arena-bag-sling')).toHaveCount(0);
    await page.locator('#arena-bag-fists').click(); await expect(page.locator('#arena-modal')).toBeHidden(); await expect(page.locator('#arena-charge')).toBeHidden();
  });
});
