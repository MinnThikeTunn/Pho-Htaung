import type Phaser from 'phaser';
import { gameState } from '../utils/AdventureState.js';
import { store } from '../services/adventure';
import { soundEngine } from '../utils/SoundEngine.js';
import { MicroInteractions } from '../utils/MicroInteractions.js';
import type InventoryBar from './InventoryBar.js';

export interface DiegeticActor {
  x: number;
  y: number;
  facing: number;
  setControl?: (ctrl: 'PICKUP' | 'RUMMAGE' | 'FREE' | 'LAYING' | string) => void;
  bounce?: () => void;
  sprite?: Phaser.GameObjects.Sprite | null;
}

export interface DiegeticGrabOptions {
  inventoryBar?: InventoryBar;
  getActor?: () => DiegeticActor | null;
  player?: Phaser.GameObjects.Sprite | any;
  speak?: (text: string, duration?: number, who?: string) => void;
  onAutoWalk?: (targetX: number, onArrival: () => void) => void;
}

export interface PickupConfig {
  id: string;
  x: number;
  y: number;
  textureKey: string;
  scale?: number;
  hoverScale?: number;
  depth?: number;
  bobRange?: number;
  bobDuration?: number;
  proximityRadius?: number;
  campaignKey?: string;
  campaignOwnedTool?: string;
  voiceoverText?: string;
  voiceoverDuration?: number;
  onBagged?: () => void;
}

export interface ActivePickup {
  config: PickupConfig;
  sprite: Phaser.GameObjects.Image;
  bobTween?: Phaser.Tweens.Tween;
  isGrabbing: boolean;
}

/**
 * DiegeticGrab
 * Standardized 3-phase Machinarium grab interaction component across all chapters.
 *
 * Phase 1: Crouch & Reach (PICKUP pose / ph-crouch) + playWoosh + item flies into hands with Back.Out (180ms) + playPickup.
 * Phase 2: Stand & Open Shan Bag (RUMMAGE pose / ph-bag-rummage) + playBagRustle + quadratic Bézier arc into
 *          Phoe Htaung's on-body Shan shoulder bag (320ms, Cubic.InOut) + golden sparkle burst ✨.
 * Phase 3: Return to Idle/Free + Proud vertical bounce + bottom-docked Shan bag icon spring +
 *          12-slot inventory tray reveal + U Gyi voiceover + callback.
 */
export default class DiegeticGrab {
  private scene: Phaser.Scene;
  private options: DiegeticGrabOptions;
  private pickups = new Map<string, ActivePickup>();

  constructor(scene: Phaser.Scene, options: DiegeticGrabOptions = {}) {
    this.scene = scene;
    this.options = options;
  }

  public setInventoryBar(inventoryBar: InventoryBar) {
    this.options.inventoryBar = inventoryBar;
  }

  private getActor(): DiegeticActor {
    if (this.options.getActor) {
      const a = this.options.getActor();
      if (a) return a;
    }
    const p = this.options.player || (this.scene as any).player;
    if (p) {
      const facing = p.scaleX < 0 || p.flipX ? -1 : 1;
      return {
        x: p.x,
        y: p.y,
        facing,
        setControl: (ctrl: string) => {
          if (ctrl === 'PICKUP') {
            if (p.setTexture) p.setTexture(p.scene?.textures?.exists('phoe_crouch') ? 'phoe_crouch' : 'ph-crouch');
          } else if (ctrl === 'RUMMAGE') {
            if (p.setTexture) p.setTexture(p.scene?.textures?.exists('phoe_bag_rummage') ? 'phoe_bag_rummage' : 'ph-bag-rummage');
          } else if (ctrl === 'FREE') {
            if (p.setTexture) p.setTexture(p.scene?.textures?.exists('phoe') ? 'phoe' : 'ph-idle');
          }
        },
        bounce: () => {
          const baseScale = Math.abs(p.scaleY || 1.42);
          this.scene.tweens.add({
            targets: p,
            scaleY: baseScale * 1.08,
            scaleX: (p.scaleX < 0 ? -1 : 1) * baseScale * 0.94,
            duration: 120,
            yoyo: true,
            ease: 'Back.Out'
          });
        },
        sprite: p
      };
    }
    return { x: 640, y: 576, facing: 1 };
  }

  private speak(text: string, duration = 2.2, who = 'ဦးကြီး') {
    if (this.options.speak) {
      this.options.speak(text, duration, who);
    } else if (typeof (this.scene as any).speak === 'function') {
      (this.scene as any).speak(text, duration, who);
    }
  }

  /**
   * Instantiate an interactive pickup in the world.
   */
  public createPickup(config: PickupConfig): Phaser.GameObjects.Image {
    // Clean up any existing pickup with the same ID
    this.destroyPickup(config.id);

    const baseScale = config.scale ?? 0.72;
    const hoverScale = config.hoverScale ?? (baseScale * 1.15);
    const depth = config.depth ?? 30;
    const bobRange = config.bobRange ?? 4;
    const bobDuration = config.bobDuration ?? 1100;
    const proximityRadius = config.proximityRadius ?? 85;

    const sprite = this.scene.add
      .image(config.x, config.y, config.textureKey)
      .setScale(baseScale)
      .setDepth(depth)
      .setInteractive({ useHandCursor: true });

    // Idle floating bob tween: y(t) = (groundY - 14) + sin(3t) * 2
    const bobTween = this.scene.tweens.add({
      targets: sprite,
      y: config.y - bobRange,
      duration: bobDuration,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });

    const activePickup: ActivePickup = {
      config,
      sprite,
      bobTween,
      isGrabbing: false
    };

    sprite.on('pointerover', () => {
      if (!activePickup.isGrabbing && sprite.active) {
        sprite.setScale(hoverScale);
      }
    });

    sprite.on('pointerout', () => {
      if (!activePickup.isGrabbing && sprite.active) {
        sprite.setScale(baseScale);
      }
    });

    sprite.on('pointerdown', (_p: Phaser.Input.Pointer, _lx: number, _ly: number, event?: Event) => {
      event?.stopPropagation();
      try { (this.scene as any).audio?.unlock?.(); } catch {}

      if (activePickup.isGrabbing || !sprite.active) return;

      const actor = this.getActor();
      const distance = Math.abs(actor.x - config.x);

      if (distance <= proximityRadius) {
        this.executeGrab(activePickup);
      } else {
        // Auto-walk to item target and execute grab upon arrival
        if (this.options.onAutoWalk) {
          this.options.onAutoWalk(config.x, () => this.executeGrab(activePickup));
        } else if (typeof (this.scene as any).interactWithProximity === 'function') {
          (this.scene as any).interactWithProximity(config.x, () => this.executeGrab(activePickup));
        } else {
          this.executeGrab(activePickup);
        }
      }
    });

    this.pickups.set(config.id, activePickup);
    return sprite;
  }

  /**
   * Execute the 3-phase diegetic grab animation sequence.
   */
  public executeGrab(target: string | ActivePickup): boolean {
    const activePickup = typeof target === 'string' ? this.pickups.get(target) : target;
    if (!activePickup || activePickup.isGrabbing || !activePickup.sprite?.active) {
      return false;
    }

    activePickup.isGrabbing = true;
    const { config, sprite, bobTween } = activePickup;

    // Stop bobbing and disable further clicks
    bobTween?.stop();
    sprite.disableInteractive();
    this.scene.tweens.killTweensOf(sprite);

    const actor = this.getActor();
    const facing = actor.facing || 1;
    const actorX = actor.x;
    const actorY = actor.y;

    // Hand & Bag coordinates aligned with Phoe Htaung's body (matching Chapter 1)
    const handX = actorX + facing * 18;
    const handY = actorY + 10;
    const bagTargetX = actorX - facing * 10;
    const bagTargetY = actorY + 4;
    const peakY = Math.min(handY, bagTargetY) - 22;

    const reachingItemScale = 0.38; // Authentic Chapter 1 handheld scale

    // =========================================================================
    // Phase 1: Crouch & Reach (PICKUP pose / ph-crouch)
    // =========================================================================
    soundEngine.playWoosh();
    if (actor.setControl) {
      actor.setControl('PICKUP');
    }

    this.scene.tweens.add({
      targets: sprite,
      x: handX,
      y: handY,
      scale: reachingItemScale,
      duration: 180,
      ease: 'Back.Out',
      onComplete: () => {
        soundEngine.playPickup();

        // =====================================================================
        // Phase 2: Stand & Open Shan Bag (RUMMAGE pose / ph-bag-rummage)
        // =====================================================================
        if (actor.setControl) {
          actor.setControl('RUMMAGE');
        }
        soundEngine.playBagRustle();

        // Parabolic Bézier arc into Phoe Htaung's on-body Shan shoulder bag
        const dummy = { t: 0 };
        this.scene.tweens.add({
          targets: dummy,
          t: 1,
          duration: 320,
          ease: 'Cubic.InOut',
          onUpdate: () => {
            const t = dummy.t;
            sprite.x = (1 - t) * (1 - t) * handX + 2 * (1 - t) * t * ((handX + bagTargetX) / 2) + t * t * bagTargetX;
            sprite.y = (1 - t) * (1 - t) * handY + 2 * (1 - t) * t * peakY + t * t * bagTargetY;
            sprite.angle = t * 180;
            sprite.scale = reachingItemScale + (0.08 - reachingItemScale) * t;
          },
          onComplete: () => {
            // Sparkle burst over the Shan shoulder bag mouth
            try {
              MicroInteractions.spawnBagSparkle(this.scene, bagTargetX, bagTargetY);
            } catch {}

            sprite.destroy();
            this.pickups.delete(config.id);

            // =================================================================
            // Phase 3: Return to Free/Idle + Proud Bounce + Bag Spring & Reveal
            // =================================================================
            if (actor.setControl) {
              actor.setControl('FREE');
            }
            if (actor.bounce) {
              actor.bounce();
            }

            // Update Game State and persistent Campaign Store
            gameState.addItem(config.id);
            if (config.campaignKey) {
              if (!store.campaign.inventory.includes(config.campaignKey)) {
                store.campaign.inventory.push(config.campaignKey);
              }
            }
            if (config.campaignOwnedTool) {
              if (!store.campaign.ownedTools.includes(config.campaignOwnedTool)) {
                store.campaign.ownedTools.push(config.campaignOwnedTool);
              }
            }
            store.save();

            // Tactile spring-bounce on the permanent bottom-dock Shan bag icon (Lwe-Ait)
            const inventoryBar = this.options.inventoryBar || (this.scene as any).inventoryBar;
            if (inventoryBar?.bagContainer) {
              this.scene.tweens.add({
                targets: inventoryBar.bagContainer,
                scaleX: 1.25,
                scaleY: 1.25,
                duration: 110,
                yoyo: true,
                ease: 'Back.Out'
              });
            }

            // Reveal 12-slot inventory tray with updated contents
            inventoryBar?.refresh();
            inventoryBar?.reveal();

            // Overhead narrative voiceover delivered through U Gyi
            if (config.voiceoverText) {
              this.speak(config.voiceoverText, config.voiceoverDuration ?? 2.2);
            }

            // Custom chapter callback
            if (config.onBagged) {
              config.onBagged();
            }
          }
        });
      }
    });

    return true;
  }

  /**
   * Handle Proximity Verb (<kbd>E</kbd> keypress).
   * Finds the nearest active pickup within proximity radius and executes grab.
   */
  public handleProximityVerb(actorX: number, _actorY?: number): boolean {
    let closestPickup: ActivePickup | null = null;
    let closestDistance = Infinity;

    for (const activePickup of this.pickups.values()) {
      if (activePickup.isGrabbing || !activePickup.sprite?.active) continue;
      const radius = activePickup.config.proximityRadius ?? 85;
      const dist = Math.abs(actorX - activePickup.config.x);
      if (dist <= radius && dist < closestDistance) {
        closestDistance = dist;
        closestPickup = activePickup;
      }
    }

    if (closestPickup) {
      return this.executeGrab(closestPickup);
    }
    return false;
  }

  public getPickupSprite(id: string): Phaser.GameObjects.Image | null {
    const p = this.pickups.get(id);
    return p && p.sprite?.active ? p.sprite : null;
  }

  public destroyPickup(id: string) {
    const p = this.pickups.get(id);
    if (p) {
      p.bobTween?.stop();
      if (p.sprite?.active) p.sprite.destroy();
      this.pickups.delete(id);
    }
  }

  public clear() {
    for (const p of this.pickups.values()) {
      p.bobTween?.stop();
      if (p.sprite?.active) p.sprite.destroy();
    }
    this.pickups.clear();
  }
}
