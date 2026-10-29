// Disposable Chapter4 browser fixture: earlier chapter completion only.
// Real rendered UI/input thereafter; no actor/health/time/inventory mutations in a run.
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const directory = new URL(process.env.PHOE_PLAYTEST_OUTPUT || '../reports/chapter4-experience/', import.meta.url);
await mkdir(directory, { recursive: true });
const runs = []; const errors = [];
const selected = process.argv[2];
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function start(name, equip = true) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage(); page.on('pageerror', e => errors.push({ run: name, message: e.message }));
  await page.addInitScript(() => localStorage.setItem('phoe-htaung.adventure.v2', JSON.stringify({
    schemaVersion: 2, revision: 0, campaignId: 'experience-isolated-boundary', walletCoins: 5,
    deathCount: 3, bridgeCompleted: true, chapter2Completed: true, chapter2BestBankedCoins: 0,
    completedAttemptIds: [], bestResultByPresetAndCoinTotal: {}, hintsSeen: [], inventory: [], ownedTools: ['slingshot'],
    resumeAt: 'CHAPTER_4_PENDING', lastChapter2Result: null, chapter3Completed: true,
    chapter3TreasureRecovered: false, lastChapter3Result: null, chapter4Completed: false, lastChapter4Result: null,
  })));
  await page.goto('http://127.0.0.1:3000/'); await page.locator('#start').click();
  await page.locator('#arena-hp').waitFor();
  if (equip) { await page.locator('#arena-bag').click(); await page.locator('#arena-bag-sling').click(); }
  return { name, page, context };
}
async function state(page) {
  return page.evaluate(() => {
    const text = id => document.getElementById(id)?.textContent ?? null;
    const progress = id => document.getElementById(id)?.value ?? null;
    return { hp: progress('arena-hp'), brown: progress('brown-hp'), silver: progress('silver-hp'),
      time: text('arena-time'), ammo: text('arena-ammo'), message: text('arena-message'),
      charge: progress('arena-charge'), dodge: text('arena-dodge'), modal: document.getElementById('arena-modal')?.hidden ? null : text('arena-modal'),
      result: document.querySelector('.result-panel')?.textContent ?? null,
      brownState: text('brown-state'), silverState: text('silver-state'),
      messageHidden: document.getElementById('arena-message')?.hidden ?? null };
  });
}
async function press(page, key, ms) { await page.keyboard.down(key); await pause(ms); await page.keyboard.up(key); }
async function save(run) {
  runs.push(run); await writeFile(new URL('results.json', directory), JSON.stringify({ fixture: 'Isolated Chapter4 entry; prior progression seeded in disposable browser contexts only.', runs, errors }, null, 2));
  console.log(JSON.stringify({ name:run.name, fight:run.fight, end:run.end, reset:run.reset }));
}
try {
  // Test whether the strongest obvious strategy needs movement, J, L, or even jumping.
  if (!selected || selected === 'stationary-sling') {
    const { page, context } = await start('stationary-sling');
    await page.screenshot({ path: fileURLToPath(new URL('entry-red-health.png', directory)) });
    const initial = await state(page); const samples = []; let shots = 0;
    for (; shots < 16; shots++) {
      await press(page, 'k', 610); await pause(520); const s = await state(page); samples.push(s);
      if (s.result || s.modal || (s.brown === 0 && s.silver === 0)) { shots++; break; }
    }
    const fight = await state(page);
    if (fight.brown === 0 && fight.silver === 0) await press(page, 'd', 5200);
    const end = await state(page);
    await page.screenshot({ path: fileURLToPath(new URL('stationary-result.png', directory)) });
    await save({ name: 'stationary-sling', controls: 'Only K hold610ms/release520ms during combat; D after both enemies down', initial, shots, samples, fight, end });
    await context.close();
  }
  // Bare-fist intent: approach once, then repeated distinct J presses. No sling.
  if (!selected || selected === 'fists-only') {
    const { page, context } = await start('fists-only', false); await press(page, 'd', 1800);
    const samples = []; let punches = 0;
    for (; punches < 200; punches++) {
      await page.keyboard.press('j'); await pause(360);
      const s = await state(page); if (punches % 15 === 0) samples.push(s);
      if (s.modal || s.result) { punches++; break; }
    }
    const end = await state(page);
    await page.screenshot({ path: fileURLToPath(new URL('fists-result.png', directory)) });
    await save({ name: 'fists-only', controls: 'D1800ms then J presses360ms apart; no K/L/jump', punches, samples, end });
    await context.close();
  }
  // Actively defend and fire: compare whether the extra controls improve the outcome.
  if (!selected || selected === 'jump-and-dodge') {
    const { page, context } = await start('jump-and-dodge'); const samples = [];
    for (let i = 0; i < 16; i++) {
      await press(page, 'k', 610); await page.keyboard.press('Space');
      if (i % 3 === 2) await page.keyboard.press('l');
      await pause(520); const s = await state(page); samples.push(s);
      if (s.result || s.modal || (s.brown === 0 && s.silver === 0)) break;
    }
    const fight = await state(page);
    if (fight.brown === 0 && fight.silver === 0) await press(page, 'd', 6000);
    const end = await state(page);
    await page.screenshot({ path: fileURLToPath(new URL('active-result.png', directory)) });
    await save({ name: 'jump-and-dodge', controls: 'K610ms then Space; L every third cycle; wait520ms; D after combat', samples, fight, end });
    await context.close();
  }
  if (selected === 'reactive') {
    const { page, context } = await start('reactive'); const samples = [];
    let slingHeld = false, lastSample = -1; const wallStart = Date.now();
    // Read-only snapshots expose visible warning/projectile geometry to this automated
    // controller. No state mutation, teleport, granted inventory or forced completion.
    while (Date.now() - wallStart < 90000) {
      const a = await page.evaluate(() => window.__PHOE_TEST__?.snapshot()?.arena?.attempt);
      if (!a || a.status === 'FAILED' || a.combatWon) break;
      const danger = a.apes.some(e => e.phase === 'WINDUP' && e.type === 'MELEE') ||
        a.shots.some(s => s.owner === 'APE' && (a.player.centerX-s.x)*s.vx > 0 && Math.abs(s.x-a.player.centerX) < 190);
      const draw = a.elapsed % 1.1 < .566;
      if (draw !== slingHeld) { if (draw) await page.keyboard.down('k'); else await page.keyboard.up('k'); slingHeld=draw; }
      if (danger && a.player.grounded) await page.keyboard.press('Space');
      if (Math.floor(a.elapsed) !== lastSample) { lastSample=Math.floor(a.elapsed); samples.push(await state(page)); }
      await pause(25);
    }
    await page.keyboard.up('k'); const fight=await state(page);
    if(fight.brown === 0 && fight.silver === 0) await press(page,'d',5200);
    const end=await state(page);
    await page.screenshot({path:fileURLToPath(new URL('reactive-result.png',directory))});
    await save({name:'reactive',controls:'Real keyboard; read-only warning/projectile geometry drives jump, periodic K draw/release',samples,fight,end});
    await context.close();
  }
  if (!selected || selected === 'shove-opening') {
    const { page, context } = await start('shove-opening');
    await page.keyboard.press('Space'); // Edge-buffered input starts the attempt, without firing.
    await page.waitForFunction(() => document.getElementById('brown-state')?.textContent?.includes('လက်မြှောက်'));
    await page.keyboard.press('Space');
    await page.waitForFunction(() => document.getElementById('brown-state')?.textContent === 'ပစ်ခွင့်ရပြီ');
    await press(page, 'd', 140); await page.keyboard.press('j');
    await page.waitForFunction(() => document.getElementById('arena-message')?.textContent?.includes('ခွာထုတ်လိုက်ပြီ'));
    const opening = await state(page);
    await page.keyboard.down('k'); await page.waitForFunction(() => document.getElementById('arena-charge')?.value >= 1);
    await page.keyboard.up('k');
    await page.waitForFunction(() => document.getElementById('brown-hp')?.value <= 119);
    await page.keyboard.press('Escape'); const end = await state(page);
    await page.screenshot({ path: fileURLToPath(new URL('shove-opening.png', directory)) });
    await save({name:'shove-opening',controls:'Read melee warning → Space → wait recovery → D140ms step into punch reach → J → full K',opening,end});
    await context.close();
  }
  // Check charge cancellation, reset and a narrow desktop presentation through real UI.
  if (!selected || selected === 'pause-retry') {
    const { page, context } = await start('pause-retry');
    await page.keyboard.down('k');
    await page.waitForFunction(() => document.getElementById('arena-charge')?.value > .5);
    const charging = await state(page); await page.keyboard.press('Escape'); await page.keyboard.up('k');
    const paused = await state(page); await pause(1000); const pausedLater = await state(page);
    await page.locator('#arena-resume').click(); await pause(400); const resumed = await state(page);
    await page.keyboard.down('k'); await page.waitForFunction(() => document.getElementById('arena-charge')?.value >= 1);
    await page.keyboard.up('k'); await page.waitForFunction(() => document.getElementById('arena-ammo')?.textContent === '11');
    const beforeReset = await state(page);
    await press(page, 'r', 1500); const reset = await state(page);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.screenshot({ path: fileURLToPath(new URL('desktop-1280.png', directory)) });
    await save({ name: 'pause-retry', charging, paused, pausedLater, resumed, beforeReset, reset }); await context.close();
  }
} finally { await browser.close(); }
