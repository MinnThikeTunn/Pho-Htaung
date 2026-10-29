import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('phaser', () => ({
  default: {}
}));

vi.mock('../../src/utils/MicroInteractions.js', () => ({
  MicroInteractions: {
    spawnBagSparkle: vi.fn()
  }
}));

vi.mock('../../src/utils/SoundEngine.js', () => ({
  soundEngine: {
    playWoosh: vi.fn(),
    playPickup: vi.fn(),
    playBagRustle: vi.fn()
  }
}));

import DiegeticGrab, { type PickupConfig } from '../../src/ui/DiegeticGrab';
import { gameState } from '../../src/utils/AdventureState.js';
import { store } from '../../src/services/adventure';

function createMockScene() {
  const tweensList: any[] = [];
  const scene: any = {
    add: {
      image: vi.fn((x: number, y: number, key: string) => {
        const img: any = {
          x,
          y,
          key,
          scale: 1,
          depth: 0,
          active: true,
          events: {} as Record<string, Function>,
          setScale(s: number) { this.scale = s; return this; },
          setDepth(d: number) { this.depth = d; return this; },
          setInteractive() { return this; },
          disableInteractive() { return this; },
          on(evt: string, cb: Function) { this.events[evt] = cb; return this; },
          destroy() { this.active = false; }
        };
        return img;
      }),
      text: vi.fn(() => ({
        setOrigin() { return this; },
        setDepth() { return this; },
        destroy: vi.fn()
      }))
    },
    tweens: {
      add: vi.fn((config: any) => {
        const tweenObj = {
          config,
          stop: vi.fn(),
          stepToComplete: () => {
            if (config.onUpdate) config.onUpdate();
            if (config.onComplete) config.onComplete();
          }
        };
        tweensList.push(tweenObj);
        return tweenObj;
      }),
      killTweensOf: vi.fn()
    },
    stepAllTweens: () => {
      // Step all pending tweens in order
      while (tweensList.length > 0) {
        const t = tweensList.shift();
        t.stepToComplete();
      }
    }
  };
  return scene;
}

describe('DiegeticGrab Component', () => {
  beforeEach(() => {
    gameState.resetAttempt();
    store.campaign.inventory = [];
    store.campaign.ownedTools = [];
  });

  it('instantiates and creates an interactive pickup with bobbing tween', () => {
    const scene = createMockScene();
    const actor = { x: 500, y: 536, facing: 1, control: 'FREE', setControl: vi.fn() };
    const grab = new DiegeticGrab(scene, { getActor: () => actor });

    const pickup = grab.createPickup({
      id: 'bamboo_pole',
      x: 536,
      y: 470,
      textureKey: 'item-bamboo-pole',
      scale: 0.72
    });

    expect(pickup).toBeDefined();
    expect(scene.add.image).toHaveBeenCalledWith(536, 470, 'item-bamboo-pole');
    expect(scene.tweens.add).toHaveBeenCalled(); // bobbing tween added
  });

  it('triggers auto-walk when clicked outside proximity radius', () => {
    const scene = createMockScene();
    const actor = { x: 100, y: 536, facing: 1, control: 'FREE', setControl: vi.fn() };
    const onAutoWalk = vi.fn();
    const grab = new DiegeticGrab(scene, { getActor: () => actor, onAutoWalk });

    const pickup = grab.createPickup({
      id: 'far_item',
      x: 600,
      y: 536,
      textureKey: 'item-cog',
      proximityRadius: 85
    });

    // Simulate pointerdown
    (pickup as any).events['pointerdown']();

    expect(onAutoWalk).toHaveBeenCalledWith(600, expect.any(Function));
  });

  it('executes 3-phase grab sequence when within proximity radius', () => {
    const scene = createMockScene();
    let currentControl = 'FREE';
    const actor = {
      x: 530,
      y: 536,
      facing: 1,
      control: currentControl,
      setControl: vi.fn((c: string) => { currentControl = c; }),
      bounce: vi.fn()
    };
    const inventoryBar = {
      bagContainer: {},
      refresh: vi.fn(),
      reveal: vi.fn()
    };
    const speak = vi.fn();
    const onBagged = vi.fn();

    const grab = new DiegeticGrab(scene, {
      getActor: () => actor,
      inventoryBar: inventoryBar as any,
      speak
    });

    const config: PickupConfig = {
      id: 'bamboo_pole',
      x: 536,
      y: 470,
      textureKey: 'item-bamboo-pole',
      campaignKey: 'bamboo_pole',
      voiceoverText: 'Got bamboo!',
      onBagged
    };

    const pickup = grab.createPickup(config);

    // Trigger grab
    grab.executeGrab('bamboo_pole');

    // Phase 1: Phoe Htaung crouches into PICKUP pose
    expect(actor.setControl).toHaveBeenCalledWith('PICKUP');
    expect(scene.tweens.add).toHaveBeenCalledWith(
      expect.objectContaining({
        targets: pickup,
        x: 548,
        y: 546,
        scale: 0.38,
        duration: 180,
        ease: 'Back.Out'
      })
    );

    // Step Phase 1 tween to complete -> triggers Phase 2 (RUMMAGE)
    scene.stepAllTweens();

    // After all 3 phases are stepped to completion:
    // Phase 2: RUMMAGE set, then Phase 3: FREE set
    expect(actor.setControl).toHaveBeenCalledWith('RUMMAGE');
    expect(actor.setControl).toHaveBeenCalledWith('FREE');
    expect(actor.bounce).toHaveBeenCalled();

    // Inventory & Campaign state updated
    expect(gameState.hasItem('bamboo_pole')).toBe(true);
    expect(store.campaign.inventory).toContain('bamboo_pole');
    expect(inventoryBar.refresh).toHaveBeenCalled();
    expect(inventoryBar.reveal).toHaveBeenCalled();
    expect(speak).toHaveBeenCalledWith('Got bamboo!', 2.2, 'ဦးကြီး');
    expect(onBagged).toHaveBeenCalled();
    expect(pickup.active).toBe(false); // Destroyed after bag entry
  });

  it('handleProximityVerb finds nearest pickup within 85px radius and grabs it', () => {
    const scene = createMockScene();
    const actor = { x: 530, y: 536, facing: 1, control: 'FREE', setControl: vi.fn() };
    const grab = new DiegeticGrab(scene, { getActor: () => actor });

    grab.createPickup({ id: 'item_near', x: 540, y: 470, textureKey: 'key_near' });
    grab.createPickup({ id: 'item_far', x: 800, y: 470, textureKey: 'key_far' });

    // Press E at x = 530
    const handled = grab.handleProximityVerb(530);
    expect(handled).toBe(true);
    expect(actor.setControl).toHaveBeenCalledWith('PICKUP');
  });

  it('handleProximityVerb returns false when no pickup is in range', () => {
    const scene = createMockScene();
    const actor = { x: 200, y: 536, facing: 1, control: 'FREE', setControl: vi.fn() };
    const grab = new DiegeticGrab(scene, { getActor: () => actor });

    grab.createPickup({ id: 'item_far', x: 800, y: 470, textureKey: 'key_far' });

    const handled = grab.handleProximityVerb(200);
    expect(handled).toBe(false);
  });
});
