import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('phaser', () => ({
  default: {}
}));

vi.mock('../../src/view/BridgeView.js', () => ({
  CREAM: 0xe9dfbd,
  drawMyanmarTraditionalBag: vi.fn()
}));

vi.mock('../../src/utils/SoundEngine.js', () => ({
  soundEngine: {
    playBagRustle: vi.fn(),
    playPickup: vi.fn(),
    playScissors: vi.fn()
  }
}));

import { gameState } from '../../src/utils/AdventureState.js';
import { store } from '../../src/services/adventure';
import { CampaignStore } from '../../src/services/CampaignStore';
import { createScaleAttempt, settleScale } from '../../src/domain/scale';
import { ScaleSession } from '../../src/services/ScaleSession';
import { newCampaign, validateCampaign } from '../../src/domain/settlement';
import { settleBridge } from '../../src/domain/bridge';
import InventoryBar from '../../src/ui/InventoryBar.js';

describe('Cross-Chapter Bag & Inventory Persistence', () => {
  class MockSaveAdapter {
    private data: string | null = null;
    read() { return this.data; }
    write(val: string) { this.data = val; }
  }

  beforeEach(() => {
    store.reset(crypto.randomUUID());
  });

  it('1. Item added to bag is automatically mirrored in campaign store and persisted', () => {
    gameState.addItem('betel_nut');
    expect(gameState.hasItem('betel_nut')).toBe(true);
    expect(store.campaign.inventory).toContain('betel_nut');

    gameState.addItem('bamboo_pole');
    expect(gameState.hasItem('bamboo_pole')).toBe(true);
    expect(store.campaign.inventory).toContain('bamboo_pole');
  });

  it('2. Item removed from bag is mirrored and removed from campaign store', () => {
    gameState.addItem('ancient_brick');
    expect(store.campaign.inventory).toContain('ancient_brick');

    gameState.removeItem('ancient_brick');
    expect(gameState.hasItem('ancient_brick')).toBe(false);
    expect(store.campaign.inventory).not.toContain('ancient_brick');
  });

  it('3. Scene changes via setCurrentScene do not wipe acquired items from the bag', () => {
    gameState.addItem('betel_nut');
    gameState.addItem('bamboo_pole');

    // Simulate scene transitions across chapters
    gameState.setCurrentScene('Chapter1Scene');
    expect(gameState.hasItem('betel_nut')).toBe(true);
    expect(gameState.hasItem('bamboo_pole')).toBe(true);

    gameState.setCurrentScene('CHAPTER_2');
    expect(gameState.hasItem('betel_nut')).toBe(true);
    expect(gameState.hasItem('bamboo_pole')).toBe(true);

    gameState.setCurrentScene('CHAPTER_3');
    expect(gameState.hasItem('betel_nut')).toBe(true);
    expect(gameState.hasItem('bamboo_pole')).toBe(true);
  });

  it('4. Completing Chapter 1 preserves carried items in campaign inventory into Chapter 2', () => {
    const c = newCampaign('bridge-test');
    c.inventory = ['betel_cutter', 'slingshot', 'bamboo_pole', 'ancient_brick'];
    const exit = { alive: true, grounded: true, x: 1200, feetY: 576, groundY: 576, width: 1280, tunnelOpened: false };
    const settled = settleBridge(c, 'bridge-1', exit);

    expect(settled.bridgeCompleted).toBe(true);
    expect(settled.resumeAt).toBe('CHAPTER_2');
    expect(settled.inventory).toContain('betel_cutter');
    expect(settled.inventory).toContain('slingshot');
    expect(settled.inventory).toContain('bamboo_pole');
    expect(settled.inventory).toContain('ancient_brick');
  });

  it('5. Chapter 3 initializes with already-owned tools inside the bag', () => {
    const initialInv = ['betel_cutter', 'slingshot', 'bamboo_pole', 'rusty_cog'];
    const attempt = createScaleAttempt('test-scale-carry', initialInv);

    expect(attempt.locations.betel_cutter).toBe('BAG');
    expect(attempt.locations.slingshot).toBe('BAG');
    expect(attempt.locations.bamboo_pole).toBe('BAG');
    expect(attempt.locations.rusty_cog).toBe('BAG');

    // Puzzle pieces not in inventory remain in the world
    expect(attempt.locations.stone).toBe('WORLD');
    expect(attempt.locations.treasure).toBe('WORLD');
    expect(attempt.locations.crate).toBe('WORLD');
    expect(attempt.locations.sandbag).toBe('WORLD');
  });

  it('6. Recovering treasure in Chapter 3 adds the relic to inventory upon settlement', () => {
    const c = newCampaign('scale-test');
    c.bridgeCompleted = true;
    c.chapter2Completed = true;
    c.inventory = ['betel_cutter', 'slingshot'];

    const attempt = createScaleAttempt('scale-treasure-win');
    attempt.status = 'COMPLETE';
    attempt.player.control = 'EXITING';
    attempt.player.grounded = true;
    attempt.player.centerX = 1250;
    attempt.player.feetY = 640;
    attempt.locations.treasure = 'BAG';

    const settled = settleScale(c, attempt);
    expect(settled.chapter3Completed).toBe(true);
    expect(settled.chapter3TreasureRecovered).toBe(true);
    expect(settled.inventory).toContain('treasure');
    expect(validateCampaign(settled)).toBe(true);
  });

  it('7. Exiting to main menu and continuing restores all carried items from storage', () => {
    const mockAdapter = new MockSaveAdapter();
    const testStore = new CampaignStore(mockAdapter, 'resume-test');
    testStore.campaign.inventory = ['betel_cutter', 'slingshot', 'betel_nut', 'bamboo_pole'];
    testStore.campaign.resumeAt = 'CHAPTER_2';
    testStore.save(true);

    // Simulate returning to main menu and resuming: load from storage
    const loadedStore = new CampaignStore(mockAdapter, 'resume-test');
    expect(loadedStore.campaign.resumeAt).toBe('CHAPTER_2');
    expect(loadedStore.campaign.inventory).toEqual(['betel_cutter', 'slingshot', 'betel_nut', 'bamboo_pole']);
    expect(validateCampaign(loadedStore.campaign)).toBe(true);
  });

  it('8. Taking an item from bag (selection) and storing it back works via clearSelected and empty slots', () => {
    const createMockObj = (props: Record<string, any> = {}) => {
      const obj: any = { ...props };
      const proxy: any = new Proxy(obj, {
        get(target, prop) {
          if (prop in target) return target[prop];
          return () => proxy;
        }
      });
      return proxy;
    };

    const mockScene: any = {
      scale: { width: 1280, height: 720 },
      add: {
        container: () => createMockObj(),
        graphics: () => createMockObj(),
        zone: () => createMockObj(),
        image: () => createMockObj(),
        text: () => createMockObj()
      },
      tweens: { killTweensOf: () => {}, add: () => {} },
      textures: { exists: () => false },
      input: createMockObj(),
      events: createMockObj()
    };

    const bar = new InventoryBar(mockScene);
    gameState.state.inventory = ['betel_cutter', 'slingshot', 'bamboo_pole'];
    bar.refresh();

    // Select item (taking it from the bag into hand)
    bar.handleClickSlot(2);
    expect(bar.getSelected()).toBe('bamboo_pole');

    // Click again to store back into bag
    bar.handleClickSlot(2);
    expect(bar.getSelected()).toBeNull();

    // Select again
    bar.handleClickSlot(2);
    expect(bar.getSelected()).toBe('bamboo_pole');

    // Click an empty slot to store back into bag
    bar.handleClickSlot(5);
    expect(bar.getSelected()).toBeNull();
  });

  it('9. Tutorial failure restores inventory: grabbed betel_nut is deleted and bag restored', () => {
    store.campaign.inventory = [];
    gameState.state.inventory = [];
    gameState.checkpointChapter('TUTORIAL');

    // Player grabs betel_nut during tutorial
    gameState.addItem('betel_nut');
    expect(gameState.hasItem('betel_nut')).toBe(true);
    expect(store.campaign.inventory).toContain('betel_nut');

    // Player fails / dies in Tutorial
    gameState.restoreChapterOnFailure('TUTORIAL');

    // betel_nut is deleted and bag restored to initial tutorial snapshot
    expect(gameState.hasItem('betel_nut')).toBe(false);
    expect(store.campaign.inventory).not.toContain('betel_nut');
  });

  it('10. Chapter 1 failure restores inventory: grabbed cog and bamboo are deleted, starter tool remains', () => {
    store.campaign.inventory = ['betel_cutter'];
    gameState.state.inventory = ['betel_cutter'];
    gameState.checkpointChapter('CHAPTER_1');

    // Player grabs rusty_cog and bamboo_pole in Chapter 1
    gameState.addItem('rusty_cog');
    gameState.addItem('bamboo_pole');
    expect(store.campaign.inventory).toContain('rusty_cog');
    expect(store.campaign.inventory).toContain('bamboo_pole');

    // Player dies from falling brick or sky block
    gameState.restoreChapterOnFailure('CHAPTER_1');

    // Grabbed items are deleted and restored to pre-grab state
    expect(gameState.hasItem('rusty_cog')).toBe(false);
    expect(gameState.hasItem('bamboo_pole')).toBe(false);
    expect(store.campaign.inventory).not.toContain('rusty_cog');
    expect(store.campaign.inventory).not.toContain('bamboo_pole');
    expect(store.campaign.inventory).toEqual(['betel_cutter']);
  });

  it('11. Chapter 2 failure restores inventory: grabbed slingshot & brick are deleted, carried items preserved', () => {
    store.campaign.inventory = ['betel_cutter', 'bamboo_pole'];
    gameState.state.inventory = ['betel_cutter', 'bamboo_pole'];
    gameState.checkpointChapter('CHAPTER_2');

    // Player grabs slingshot, ancient_brick, and crafts steam_nozzle_redirector in Chapter 2
    gameState.addItem('slingshot');
    gameState.addItem('ancient_brick');
    gameState.addItem('steam_nozzle_redirector');
    expect(store.campaign.inventory).toContain('slingshot');
    expect(store.campaign.inventory).toContain('ancient_brick');
    expect(store.campaign.inventory).toContain('steam_nozzle_redirector');

    // Player dies on floor trap in Chapter 2
    gameState.restoreChapterOnFailure('CHAPTER_2');

    // Items grabbed in Chapter 2 are deleted, carried items from Chapter 1 remain intact
    expect(store.campaign.inventory).not.toContain('slingshot');
    expect(store.campaign.inventory).not.toContain('ancient_brick');
    expect(store.campaign.inventory).not.toContain('steam_nozzle_redirector');
    expect(store.campaign.inventory).toEqual(['betel_cutter', 'bamboo_pole']);
    expect(gameState.hasItem('bamboo_pole')).toBe(true);
  });

  it('12. Chapter 3 failure restores inventory: scale weights and treasure placed in bag are deleted', () => {
    store.campaign.inventory = ['betel_cutter', 'slingshot'];
    gameState.state.inventory = ['betel_cutter', 'slingshot'];
    gameState.checkpointChapter('CHAPTER_3');

    // Player grabs stone and treasure into bag in Chapter 3
    gameState.addItem('stone');
    gameState.addItem('treasure');
    expect(store.campaign.inventory).toContain('stone');
    expect(store.campaign.inventory).toContain('treasure');

    // Player crushed by pendulum in Chapter 3
    gameState.restoreChapterOnFailure('CHAPTER_3');

    // In-chapter weights are deleted, carried tools remain
    expect(store.campaign.inventory).not.toContain('stone');
    expect(store.campaign.inventory).not.toContain('treasure');
    expect(store.campaign.inventory).toEqual(['betel_cutter', 'slingshot']);
  });

  it('13. Chapter 4 failure restores inventory: grabbed ammo or notes in arena are deleted', () => {
    store.campaign.inventory = ['betel_cutter', 'slingshot'];
    gameState.state.inventory = ['betel_cutter', 'slingshot'];
    gameState.checkpointChapter('CHAPTER_4');

    // Player grabs engineer_note and ammo in Chapter 4
    gameState.addItem('engineer_note');
    gameState.addItem('ammo');
    expect(store.campaign.inventory).toContain('engineer_note');

    // Apes defeat player or greed trap triggers in Chapter 4
    gameState.restoreChapterOnFailure('CHAPTER_4');

    // Chapter 4 items deleted, carried tools preserved
    expect(store.campaign.inventory).not.toContain('engineer_note');
    expect(store.campaign.inventory).not.toContain('ammo');
    expect(store.campaign.inventory).toEqual(['betel_cutter', 'slingshot']);
  });

  it('14. Chapter 5 failure restores inventory: quiz defeat restores bag to chapter start snapshot', () => {
    store.campaign.inventory = ['betel_cutter', 'slingshot', 'treasure'];
    gameState.state.inventory = ['betel_cutter', 'slingshot', 'treasure'];
    gameState.checkpointChapter('CHAPTER_5');

    // Item collected in chapter 5
    gameState.addItem('ch5_relic');
    expect(store.campaign.inventory).toContain('ch5_relic');

    // Player fails 3 quiz questions
    gameState.restoreChapterOnFailure('CHAPTER_5');

    expect(store.campaign.inventory).not.toContain('ch5_relic');
    expect(store.campaign.inventory).toEqual(['betel_cutter', 'slingshot', 'treasure']);
  });

  it('15. Chapter 3 ScaleSession initializes with carried campaign inventory without discarding prior chapter items', () => {
    store.campaign.inventory = ['betel_cutter', 'slingshot', 'bamboo_pole', 'ancient_brick'];
    const session = new ScaleSession(() => 'session-carry-test', store.campaign.inventory);

    // Carried tools are immediately in BAG
    expect(session.attempt.locations.betel_cutter).toBe('BAG');
    expect(session.attempt.locations.slingshot).toBe('BAG');
    expect(session.attempt.locations.bamboo_pole).toBe('BAG');

    // Chapter 3 native weights remain in WORLD
    expect(session.attempt.locations.stone).toBe('WORLD');
    expect(session.attempt.locations.treasure).toBe('WORLD');

    // Campaign inventory retains all carried items
    expect(store.campaign.inventory).toContain('ancient_brick');
  });

  it('16. In Chapter 2, adding cog normalizes to rusty_cog and avoids duplicate cog entries in the bag', () => {
    store.campaign.inventory = ['betel_cutter'];
    gameState.state.inventory = ['betel_cutter'];

    // Adding cog normalizes to rusty_cog
    gameState.addItem('cog');
    expect(gameState.hasItem('rusty_cog')).toBe(true);
    expect(store.campaign.inventory).toContain('rusty_cog');
    expect(store.campaign.inventory).not.toContain('cog');

    // Adding rusty_cog again does not duplicate
    gameState.addItem('rusty_cog');
    expect(store.campaign.inventory.filter((i: string) => i === 'rusty_cog')).toHaveLength(1);
    expect(gameState.state.inventory.filter((i: string) => i === 'rusty_cog')).toHaveLength(1);
  });

  it('17. Deduplicates items and prevents multiple copies of bamboo_pole in bag', () => {
    store.campaign.inventory = ['bamboo_pole'];
    gameState.state.inventory = ['bamboo_pole'];

    gameState.addItem('bamboo_pole');
    expect(store.campaign.inventory.filter((i: string) => i === 'bamboo_pole')).toHaveLength(1);
    expect(gameState.state.inventory.filter((i: string) => i === 'bamboo_pole')).toHaveLength(1);
  });

  it('18. Restarting game removes all items from bag, campaign inventory, and state', () => {
    store.campaign.inventory = ['betel_cutter', 'slingshot', 'bamboo_pole', 'ancient_brick', 'rusty_cog'];
    gameState.state.inventory = ['betel_cutter', 'slingshot', 'bamboo_pole', 'ancient_brick', 'rusty_cog'];
    expect(gameState.state.inventory.length).toBeGreaterThan(0);

    // Call reset
    gameState.reset(true);

    expect(gameState.state.inventory).toEqual([]);
    expect(store.campaign.inventory).toEqual([]);
    expect(store.campaign.ownedTools).toEqual([]);
  });
});
