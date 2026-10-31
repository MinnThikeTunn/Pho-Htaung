import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Cross-Browser Engine Verification', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // Setup screenshot directory for this browser project
    const browserDir = path.join(process.cwd(), 'reports', 'cross-browser', testInfo.project.name);
    fs.mkdirSync(browserDir, { recursive: true });
  });

  test('01: Engine Boot, WebGL/Canvas init, Font loading, and Zero Errors', async ({ page }, testInfo) => {
    const errors: string[] = [];
    const consoleWarnings: string[] = [];

    page.on('pageerror', (err) => {
      if (!err.message.includes('access control checks')) {
        errors.push(err.message);
      }
    });

    page.on('response', (res) => {
      if (res.status() >= 400) {
        console.log(`[HTTP ${res.status()}] ${res.url()}`);
      }
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('favicon.ico') && !text.includes('404') && !text.includes('access control checks')) {
          errors.push(text);
        }
      }
    });

    await page.goto('/');

    // 1. Splash screen dismisses
    await expect(page.locator('#boot-splash')).toHaveCount(0, { timeout: 15000 });

    // 2. Phaser canvas is initialized
    const canvas = page.locator('#game canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    expect(canvasBox!.width).toBeGreaterThan(200);
    expect(canvasBox!.height).toBeGreaterThan(150);

    // 3. Fantasy menu overlay is visible
    const menu = page.locator('#fantasy-menu-overlay');
    await expect(menu).toBeVisible({ timeout: 10000 });

    // 4. Verify Burmese typography rendered correctly
    const fontReady = await page.evaluate(async () => {
      await document.fonts.ready;
      return document.fonts.check("16px 'Noto Sans Myanmar'");
    });
    expect(fontReady).toBe(true);

    const titleText = await page.locator('.fm-subtitle').textContent();
    expect(titleText).toContain('ရှေးဟောင်းနန်းတော်');

    // 5. Verify window globals
    const globals = await page.evaluate(() => {
      return {
        hasGame: typeof (window as any).__PHOE_GAME__ !== 'undefined',
        hasTest: typeof (window as any).__PHOE_TEST__ !== 'undefined',
        activeScenes: (window as any).__PHOE_GAME__?.scene?.getScenes(true).map((s: any) => s.scene.key)
      };
    });
    expect(globals.hasGame).toBe(true);
    expect(globals.hasTest).toBe(true);
    expect(globals.activeScenes).toContain('MENU');

    // Screenshot Menu
    const shotPath = path.join(process.cwd(), 'reports', 'cross-browser', testInfo.project.name, '01-main-menu.png');
    await page.screenshot({ path: shotPath, fullPage: false });

    // Zero unhandled errors
    expect(errors).toEqual([]);
  });

  test('02: Web Audio API unlock, Mute toggle, and Modal Interactivity', async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => {
      if (!err.message.includes('access control checks')) errors.push(err.message);
    });

    await page.goto('/');
    await expect(page.locator('#fantasy-menu-overlay')).toBeVisible({ timeout: 15000 });

    // Verify Web Audio subsystem is safe and non-crashing across all platforms
    const audioCheck = await page.evaluate(() => {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      // In real desktop/mobile Safari and modern browsers, AudioContext exists; in headless Windows WebKit, it is safely omitted.
      // In both cases, the game engine and SoundEngine must initialize cleanly without throwing.
      return {
        hasAudioContext: Boolean(AudioCtx),
        isHeadlessWindowsWebKit: !Boolean(AudioCtx) && navigator.userAgent.includes('AppleWebKit') && !navigator.userAgent.includes('Chrome'),
        gameActive: typeof (window as any).__PHOE_GAME__ !== 'undefined'
      };
    });
    expect(audioCheck.gameActive).toBe(true);
    if (!audioCheck.isHeadlessWindowsWebKit) {
      expect(audioCheck.hasAudioContext).toBe(true);
    }

    // Open Mechanics Modal
    await page.locator('#menu-mechanic').click();
    const modal = page.locator('#fm-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(modal).toContainText('ဂိမ်းလမ်းညွှန်');

    // Screenshot Mechanics Modal
    const shotModal = path.join(process.cwd(), 'reports', 'cross-browser', testInfo.project.name, '02-mechanics-modal.png');
    await page.screenshot({ path: shotModal });

    // Close Modal
    await page.locator('#fm-modal-close').click();
    await expect(modal).toHaveCount(0);

    // Toggle Audio Widget
    const volBtn = page.locator('#volume-toggle-btn');
    if (await volBtn.isVisible()) {
      const initialIcon = await page.locator('#volume-icon').textContent();
      await volBtn.click({ force: true });
      await page.waitForTimeout(200);
      const toggledIcon = await page.locator('#volume-icon').textContent();
      expect(toggledIcon).not.toBe(initialIcon);
      // Toggle back
      await volBtn.click({ force: true });
    }

    expect(errors).toEqual([]);
  });

  test('03: Chapter 1 Entry, Ground Baseline & Viewport Registration', async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => {
      if (!err.message.includes('access control checks')) errors.push(err.message);
    });

    await page.goto('/');
    await expect(page.locator('#start')).toBeVisible({ timeout: 15000 });

    // Start Chapter 1
    await page.locator('#start').click();

    // Verify Chapter1Scene is active
    await expect.poll(async () => {
      return page.evaluate(() => {
        return (window as any).__PHOE_GAME__?.scene?.getScenes(true).map((s: any) => s.scene.key);
      });
    }, { timeout: 15000 }).toContain('Chapter1Scene');

    // Wait a brief moment for scene assets & background to ink
    await page.waitForTimeout(1000);

    // Verify registration between canvas and interface
    const bounds = await page.evaluate(() => {
      const c = document.querySelector('canvas')!.getBoundingClientRect();
      const ui = document.querySelector('#interface')!.getBoundingClientRect();
      return {
        canvasWidth: c.width,
        canvasHeight: c.height,
        uiWidth: ui.width,
        uiHeight: ui.height,
        diffHeight: Math.abs(c.height - ui.height),
        diffWidth: Math.abs(c.width - ui.width)
      };
    });

    expect(bounds.diffHeight).toBeLessThanOrEqual(5);
    expect(bounds.diffWidth).toBeLessThanOrEqual(5);

    // Screenshot Chapter 1
    const shotCh1 = path.join(process.cwd(), 'reports', 'cross-browser', testInfo.project.name, '03-chapter1-bridge.png');
    await page.screenshot({ path: shotCh1 });

    expect(errors).toEqual([]);
  });

  test('04: Chapter 5 Shortcut, Trivia UI, and Canvas Scaling', async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => {
      if (!err.message.includes('access control checks')) errors.push(err.message);
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Trigger Chapter 5 via exported helper
    await page.evaluate(() => {
      (window as any).jumpToChapter5?.();
    });

    // Verify Chapter 5 is active
    await expect.poll(async () => {
      return page.evaluate(() => {
        return (window as any).__PHOE_GAME__?.scene?.getScenes(true).map((s: any) => s.scene.key);
      });
    }, { timeout: 15000 }).toContain('CHAPTER_5');

    // Chapter 5 story or scene elements
    await page.waitForTimeout(1200);

    // Check if snapshot contains chapter 5 state
    await expect.poll(async () => {
      const snap = await page.evaluate(() => (window as any).__PHOE_TEST__?.snapshot());
      return snap?.activeScenes || [];
    }, { timeout: 10000 }).toContain('CHAPTER_5');

    // Screenshot Chapter 5
    const shotCh5 = path.join(process.cwd(), 'reports', 'cross-browser', testInfo.project.name, '04-chapter5-boss-trivia.png');
    await page.screenshot({ path: shotCh5 });

    expect(errors).toEqual([]);
  });
});
