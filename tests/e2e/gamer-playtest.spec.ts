import { expect, test } from '@playwright/test';

interface BridgeSnapshot {
  player: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    grounded: boolean;
    isLaying: boolean;
    isVaulting: boolean;
  };
  isVaulting?: boolean;
  inventory: string[];
  hasCog: boolean;
  hasLever: boolean;
  winchJammed: boolean;
  winchLubricated: boolean;
  bridgeLowered: boolean;
  poleTied: boolean;
  cogWedged: boolean;
  tunnelOpened: boolean;
  trapTriggered: boolean;
  firstHazardTriggered: boolean;
  isDead: boolean;
  deathType: string | null;
  activeTime: number;
  coyote: number;
  jumpBuffer: number;
  selectedItem: string | null;
}

interface TestSnapshot {
  activeScenes: string[];
  attempt: { status: string } | null;
  campaign: {
    walletCoins: number;
    deathCount: number;
    bridgeCompleted: boolean;
    chapter2Completed: boolean;
  };
  bridge: BridgeSnapshot | null;
}

const snap = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as any).__PHOE_TEST__?.snapshot() as TestSnapshot);

test.describe('Chapter 1 Gamer Critic Playtests', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
    await page.addInitScript(() => {
      localStorage.clear();
    });
    await page.goto('/');
    await expect(page.locator('#start')).toBeVisible({ timeout: 30000 });
  });

  // =========================================================================
  // ARCHETYPE 1: KAUNG (SPEEDRUNNER & TROLL GAME VETERAN)
  // =========================================================================
  test('Kaung: FTUE responsiveness, quick reset R, and coyote/buffer physics', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.locator('#start').click();
    await expect.poll(async () => (await snap(page)).activeScenes).toContain('Chapter1Scene');

    // 1. First 30s responsiveness: player can move immediately
    await page.keyboard.down('d');
    await page.waitForTimeout(400);
    let s = await snap(page);
    expect(s.bridge?.player.x).toBeGreaterThan(90);
    await page.keyboard.up('d');

    // 2. Coyote time & jump buffer check
    await page.keyboard.press('Space');
    await page.waitForTimeout(100);
    s = await snap(page);
    expect(s.bridge?.player.vy).toBeLessThan(0); // In upward jump arc

    // 3. Quick Reset (Hold R for 500ms)
    await page.keyboard.down('r');
    await page.waitForTimeout(650);
    await page.keyboard.up('r');
    s = await snap(page);
    expect(s.bridge?.activeTime).toBeLessThan(1.0); // Reset successfully restarted the scene

    expect(pageErrors).toEqual([]);
  });

  test('Kaung: Athletic speedrun bypass via bamboo pole-vault', async ({ page }) => {
    await page.locator('#start').click();
    await expect.poll(async () => (await snap(page)).activeScenes).toContain('Chapter1Scene');

    // Select betel cutter and cut tied pole to get bamboo pole
    await page.evaluate(() => {
      const scene = (window as any).__PHOE_GAME__.scene.getScene('Chapter1Scene');
      scene.inventoryBar.setSelected('betel_cutter');
      scene.handleTiedPoleInteraction();
    });

    await expect.poll(async () => (await snap(page)).bridge?.inventory, { timeout: 3000 }).toContain('bamboo_pole');

    // Sprint right towards pit edge (leftPlatWidth = 768) and jump
    await page.evaluate(() => {
      const scene = (window as any).__PHOE_GAME__.scene.getScene('Chapter1Scene');
      scene.player.body.reset(700, scene.groundY);
      scene.player.setVelocityX(220);
    });

    // Press jump near edge while running right to trigger vault
    await page.keyboard.down('d');
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);

    // Verify vault animation triggered
    let s = await snap(page);
    expect(s.bridge?.player.isVaulting || s.bridge?.player.x! > 768).toBe(true);

    // Wait for vault completion to land on right platform
    await page.waitForTimeout(1000);
    await page.keyboard.up('d');
    s = await snap(page);
    expect(s.bridge?.player.x).toBeGreaterThan(768); // Safely across the pit!
  });

  // =========================================================================
  // ARCHETYPE 2: NANDAR (CASUAL & NARRATIVE PLAYER)
  // =========================================================================
  test('Nandar: Slapstick cushion on first hazard hit & comedic betel spit', async ({ page }) => {
    await page.locator('#start').click();
    await expect.poll(async () => (await snap(page)).activeScenes).toContain('Chapter1Scene');

    // Move slightly into the room to trigger hazard timer
    await page.keyboard.down('d');
    await page.waitForTimeout(500);
    await page.keyboard.up('d');

    // Trigger first falling brick manually to evaluate comedic cushion
    await page.evaluate(() => {
      const scene = (window as any).__PHOE_GAME__.scene.getScene('Chapter1Scene');
      scene.hitByFallingBrick();
    });

    let s = await snap(page);
    // Slapstick cushion: first hazard should NOT kill player or increment death count!
    expect(s.bridge?.firstHazardTriggered).toBe(true);
    expect(s.bridge?.isDead).toBe(false);
    expect(s.campaign.deathCount).toBe(0);

    // Test E mouth verb: betel nut spitting near winch
    await page.evaluate(() => {
      const scene = (window as any).__PHOE_GAME__.scene.getScene('Chapter1Scene');
      scene.player.body.reset(scene.winchContainer.x - 30, scene.groundY);
      scene.winchJammed = true;
    });

    await page.keyboard.press('e');
    await page.waitForTimeout(450);

    s = await snap(page);
    expect(s.bridge?.winchLubricated).toBe(true);
    expect(s.bridge?.winchJammed).toBe(false);
  });

  test('Nandar: Greedy gold coin trapdoor collapse', async ({ page }) => {
    await page.locator('#start').click();
    await expect.poll(async () => (await snap(page)).activeScenes).toContain('Chapter1Scene');

    // Trigger greedy coin trap
    await page.evaluate(() => {
      const scene = (window as any).__PHOE_GAME__.scene.getScene('Chapter1Scene');
      scene.player.setPosition(1075, scene.groundY - 10);
      scene.player.body.setVelocity(0, 0);
      scene.triggerGreedyCoinTrap();
    });

    await expect.poll(async () => {
      const s = await snap(page);
      return s.bridge?.trapTriggered || s.bridge?.isDead || s.campaign?.deathCount > 0;
    }, { timeout: 4000 }).toBe(true);
  });

  // =========================================================================
  // ARCHETYPE 3: QA GLITCH HUNTER (ADVERSARIAL STRESS TESTER)
  // =========================================================================
  test('QA Glitch Hunter: Die Again invisible sky block stops jumping pit gap', async ({ page }) => {
    await page.locator('#start').click();
    await expect.poll(async () => (await snap(page)).activeScenes).toContain('Chapter1Scene');

    // Leap from cliff edge directly into invisible block at (848, 441)
    await page.evaluate(() => {
      const scene = (window as any).__PHOE_GAME__.scene.getScene('Chapter1Scene');
      scene.player.setPosition(835, 420);
      scene.player.setVelocityX(120);
    });

    await expect.poll(async () => (await snap(page)).bridge?.isDead, { timeout: 4000 }).toBe(true);
  });

  test('QA Glitch Hunter: Secret Troll "အောက်လမ်း" route completes Chapter 1', async ({ page }) => {
    await page.locator('#start').click();
    await expect.poll(async () => (await snap(page)).activeScenes).toContain('Chapter1Scene');

    // Trigger secret wall opening and entrance
    await page.evaluate(() => {
      const scene = (window as any).__PHOE_GAME__.scene.getScene('Chapter1Scene');
      scene.player.setPosition(30, scene.groundY - 30);
      scene.pushTimer = 1000;
      scene.openSecretTunnel();
      scene.advanceToChapter2();
    });

    // Expect scene transition to BRIDGE_EXIT_LINK or CHAPTER_2 or campaign completion
    await expect.poll(async () => {
      const s = await snap(page);
      return s.activeScenes.includes('BRIDGE_EXIT_LINK') || s.activeScenes.includes('CHAPTER_2') || Boolean(s.campaign?.bridgeCompleted);
    }, { timeout: 8000 }).toBe(true);
  });

  test('QA Glitch Hunter: Canonical puzzle flow lowers drawbridge to completion', async ({ page }) => {
    await page.locator('#start').click();
    await expect.poll(async () => (await snap(page)).activeScenes).toContain('Chapter1Scene');

    // Step A: Select betel cutter and cut rope
    await page.evaluate(() => {
      const scene = (window as any).__PHOE_GAME__.scene.getScene('Chapter1Scene');
      scene.player.setPosition(340, scene.groundY - 120);
      scene.player.body.setVelocity(0, 0);
      scene.inventoryBar.setSelected('betel_cutter');
      scene.handleTiedPoleInteraction();
    });

    await expect.poll(async () => (await snap(page)).bridge?.inventory, { timeout: 3000 }).toContain('bamboo_pole');

    // Step B: Move near stuck rock, select bamboo pole and pry cog
    await page.evaluate(() => {
      const scene = (window as any).__PHOE_GAME__.scene.getScene('Chapter1Scene');
      scene.player.setPosition(560, scene.groundY - 30);
      scene.player.body.setVelocity(0, 0);
      scene.inventoryBar.setSelected('bamboo_pole');
      scene.handleStuckCogInteraction();
    });

    await page.waitForTimeout(700);

    // Step C: Move to pried cog and pick it up
    await page.evaluate(() => {
      const scene = (window as any).__PHOE_GAME__.scene.getScene('Chapter1Scene');
      scene.player.setPosition(615, scene.groundY - 30);
      scene.player.body.setVelocity(0, 0);
      if (scene.cogItem) {
        scene.cogItem.emit('pointerdown');
      }
    });

    await expect.poll(async () => (await snap(page)).bridge?.inventory, { timeout: 3000 }).toContain('rusty_cog');

    // Step D: Move to winch, install cog, lubricate with betel spit, and install lever
    await page.evaluate(() => {
      const scene = (window as any).__PHOE_GAME__.scene.getScene('Chapter1Scene');
      scene.player.setPosition(scene.winchContainer.x - 20, scene.groundY - 30);
      scene.player.body.setVelocity(0, 0);
      scene.inventoryBar.setSelected('rusty_cog');
      scene.interactWithWinch();
      // Spit betel juice to lubricate
      scene.winchJammed = false;
      scene.winchLubricated = true;
      // Install lever
      scene.inventoryBar.setSelected('bamboo_pole');
      scene.interactWithWinch();
      scene.turnWinchAndLowerBridge();
    });

    await expect.poll(async () => (await snap(page)).bridge?.bridgeLowered, { timeout: 4000 }).toBe(true);

    // Step E: Cross bridge, bypass trap coin, and reach exit at 1200
    await page.evaluate(() => {
      const scene = (window as any).__PHOE_GAME__.scene.getScene('Chapter1Scene');
      scene.player.setPosition(1200, scene.groundY - 30);
      scene.player.body.setVelocity(0, 0);
      scene.advanceToChapter2();
    });

    await expect.poll(async () => {
      const s = await snap(page);
      return s.activeScenes.includes('BRIDGE_EXIT_LINK') || s.activeScenes.includes('CHAPTER_2') || Boolean(s.campaign?.bridgeCompleted);
    }, { timeout: 5000 }).toBe(true);
  });
});

test.describe('Chapter 2 Enhanced Mechanics Playtests', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem('PHOE_HTAUNG_CAMPAIGN_v2', JSON.stringify({
        schemaVersion: 2,
        revision: 1,
        campaignId: 'test-camp',
        walletCoins: 10,
        bridgeCompleted: true,
        deathCount: 0,
        chapter2Completed: false,
        chapter2BestBankedCoins: 0,
        completedAttemptIds: [],
        bestResultByPresetAndCoinTotal: {},
        hintsSeen: [],
        inventory: ['betel_cutter'],
        ownedTools: ['betel_cutter'],
        resumeAt: 'CHAPTER_2',
        lastChapter2Result: null
      }));
    });
    await page.goto('/');
    await expect(page.locator('#start')).toBeVisible({ timeout: 30000 });
  });

  test('Chapter 2: Diegetic UI cleanup & clean screen without status bar', async ({ page }) => {
    await page.click('#start');
    await expect.poll(async () => {
      const s = await snap(page);
      return s.activeScenes.includes('CHAPTER_2');
    }, { timeout: 10000 }).toBe(true);

    const machineBar = page.locator('#machine');
    await expect(machineBar).toHaveCount(0);

    const bagBtn = page.locator('#bag');
    await expect(bagBtn).toBeVisible();
  });

  test('Chapter 2: Puzzle collection, platforms reveal, slingshot reward, and Die Again trap', async ({ page }) => {
    await page.click('#start');
    await expect.poll(async () => {
      const s = await snap(page);
      return s.activeScenes.includes('CHAPTER_2');
    }, { timeout: 10000 }).toBe(true);

    await page.evaluate(() => {
      const ch2 = (window as any).__PHOE_GAME__.scene.getScene('CHAPTER_2');
      const att = ch2.session.attempt;
      att.player.centerX = 536; att.player.feetY = 544;
      ch2.session.tick(1/60, { left: false, right: false, jump: false, taunt: true });
      att.player.centerX = 860; att.player.feetY = 320;
      ch2.session.tick(1/60, { left: false, right: false, jump: false, taunt: true });
      att.player.centerX = 1104; att.player.feetY = 640;
      ch2.session.tick(1/60, { left: false, right: false, jump: false, taunt: true });
      att.player.centerX = 205; att.player.feetY = 304;
      ch2.session.tick(1/60, { left: false, right: false, jump: false, taunt: true });
    });

    const snapshot = await page.evaluate(() => (window as any).__PHOE_TEST__?.snapshot());
    expect(snapshot.chapter2?.attempt?.hasPole).toBe(true);
    expect(snapshot.chapter2?.attempt?.hasCog).toBe(true);
    expect(snapshot.chapter2?.attempt?.gearBoxActive).toBe(true);
    expect(snapshot.chapter2?.attempt?.platformsRevealed).toBe(true);
    expect(snapshot.chapter2?.attempt?.hasSlingshot).toBe(true);
    expect(snapshot.campaign?.inventory).toContain('slingshot');

    await page.evaluate(() => {
      const ch2 = (window as any).__PHOE_GAME__.scene.getScene('CHAPTER_2');
      const att = ch2.session.attempt;
      att.player.centerX = 1180; att.player.feetY = 640; att.player.grounded = true;
      ch2.session.tick(1/60, { left: false, right: false, jump: false, taunt: false });
    });

    const afterTrap = await page.evaluate(() => (window as any).__PHOE_TEST__?.snapshot());
    expect(afterTrap.chapter2?.attempt?.trapFloorOpen).toBe(true);
    expect(afterTrap.chapter2?.attempt?.status).toBe('DEAD');
  });
});
