import Phaser from 'phaser';
import type { Player } from '../domain/types';

export interface PhoeActorState {
  centerX: number;
  feetY: number;
  vx: number;
  vy?: number;
  grounded: boolean;
  facing: -1 | 1;
  control?: 'FREE' | 'TAUNTING' | 'LOCKED' | 'DEAD' | 'EXITING' | 'PICKUP' | 'RUMMAGE' | 'LAYING';
  pushing?: boolean;
  holding?: boolean;
  poseOverride?: string;
}

export type PhoeHtaungState = PhoeActorState;

/**
 * Phoe Htaung Dynamic Character View
 * Combines high-resolution concept art, multi-frame running animation,
 * 5-frame jump animation, idle inhale/exhale breathing, and tool interaction poses.
 */
export function createPhoe(scene: Phaser.Scene, depth = 20): Phaser.GameObjects.Sprite | null {
  if (!scene.textures.exists('phoe')) return null;
  const tex = scene.textures.get('phoe');
  if (!tex.has('neutral')) {
    tex.add('neutral', 0, 75, 10, 380, 850);
    tex.add('taunt', 0, 550, 35, 520, 825);
    tex.add('push', 0, 1060, 135, 690, 725);
  }

  // Register running animation if spritesheet is available
  if (scene.textures.exists('phoe_run') && !scene.anims.exists('phoe_running')) {
    scene.anims.create({
      key: 'phoe_running',
      frames: scene.anims.generateFrameNumbers('phoe_run', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });
  }

  return scene.add.sprite(96, 640, 'phoe', 'neutral').setDepth(depth);
}

export function renderPhoe(
  actor: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image,
  p: PhoeActorState,
  clock: number
) {
  const isDead = p.control === 'DEAD';
  const isTaunting = p.control === 'TAUNTING';
  const isPushing = Boolean(p.pushing);
  const isAirborne = !p.grounded;
  const isMoving = p.grounded && Math.abs(p.vx) > 5;
  const isHolding = Boolean(p.holding);
  const vy = p.vy ?? 0;

  // Track landing impact
  const wasGrounded = (actor.getData('wasGrounded') as boolean | undefined) ?? true;
  let landTimer = (actor.getData('landTimer') as number | undefined) ?? 0;
  const lastClock = (actor.getData('lastClock') as number | undefined) ?? clock;
  const dt = Math.max(0, Math.min(0.1, clock - lastClock));

  if (!wasGrounded && p.grounded) {
    landTimer = 0.16; // 160ms impact squat recovery
  } else if (landTimer > 0) {
    landTimer = Math.max(0, landTimer - dt);
  }

  actor.setData('wasGrounded', p.grounded);
  actor.setData('landTimer', landTimer);
  actor.setData('lastClock', clock);

  let multX = 1;
  let multY = 1;
  let offsetY = 0;
  let angle = 0;
  let alpha = 1;
  let baseH = 850;
  let originX = 0.5;

  const scene = actor.scene;
  const hasTexture = (key: string) => scene?.textures?.exists(key);

  const stopAnim = () => {
    if ('stop' in actor && typeof actor.stop === 'function') actor.stop();
  };

  if (p.control === 'LAYING' || p.poseOverride === 'ph-lay') {
    stopAnim();
    if (hasTexture('phoe_crouch')) {
      actor.setTexture('phoe_crouch');
    } else if (hasTexture('ph-crouch')) {
      actor.setTexture('ph-crouch');
    } else {
      actor.setTexture('phoe', 'neutral');
    }

    if (p.vx !== 0) {
      angle = Math.sin(clock * 16) * 2.5 * p.facing;
      multY = 0.50 + Math.sin(clock * 16) * 0.04;
      multX = 1.32 - Math.abs(Math.sin(clock * 16)) * 0.03;
    } else {
      const layBreath = Math.sin(clock * 3.5);
      multY = 0.50 + layBreath * 0.03;
      multX = 1.28 - layBreath * 0.02;
      angle = 0;
    }
    offsetY = 12;
    baseH = 850;
  } else if (p.poseOverride) {
    stopAnim();
    if (hasTexture(p.poseOverride)) {
      actor.setTexture(p.poseOverride);
    } else {
      actor.setTexture('phoe', 'neutral');
    }
    if (p.poseOverride === 'ph-flat') {
      multY = 0.35;
      multX = 1.35;
      alpha = 0.9;
    } else if (p.poseOverride === 'ph-shock') {
      angle = -180 * p.facing;
      multY = 0.9;
      multX = 0.9;
    }
    baseH = 850;
  } else if (isDead) {
    stopAnim();
    actor.setTexture('phoe', 'neutral');
    angle = -75 * p.facing;
    multY = 0.65;
    multX = 1.15;
    alpha = 0.6;
    baseH = 850;
  } else if (p.control === 'PICKUP' || p.control === 'RUMMAGE') {
    stopAnim();
    const actionKey = p.control === 'PICKUP' ? 'phoe_crouch' : 'phoe_bag_rummage';
    if (hasTexture(actionKey)) {
      actor.setTexture(actionKey);
    } else {
      actor.setTexture('phoe', 'neutral');
    }
    baseH = 850;
  } else if (isTaunting) {
    stopAnim();
    actor.setTexture('phoe', 'taunt');
    const tauntBounce = Math.sin(clock * 14);
    multY = 1 + tauntBounce * 0.04;
    multX = 1 - tauntBounce * 0.02;
    offsetY = -Math.max(0, tauntBounce) * 3;
    angle = tauntBounce * 2 * p.facing;
    baseH = 825;
    originX = 0.39;
  } else if (isPushing) {
    stopAnim();
    actor.setTexture('phoe', 'push');
    const pushStrain = Math.sin(clock * 18);
    multY = 0.96 + pushStrain * 0.03;
    multX = 1.04 - pushStrain * 0.02;
    angle = (7 + pushStrain * 2) * p.facing;
    baseH = 725;
    originX = 0.38;
  } else if (isAirborne) {
    stopAnim();

    // 5-Stage Jump Cycle (Prep, Up, Apex, Fall, Land)
    if (vy < -100) {
      // Ascent Stretch: frame phoe_jump_up
      if (hasTexture('phoe_jump_up')) {
        actor.setTexture('phoe_jump_up');
      } else if (hasTexture('phoe_jump')) {
        actor.setTexture('phoe_jump', 1);
      } else {
        actor.setTexture('phoe', 'neutral');
      }
      const stretch = Math.min(0.12, Math.abs(vy) / 5000);
      multY = 1 + stretch;
      multX = 1 - stretch * 0.5;
      angle = -5 * p.facing;
    } else if (Math.abs(vy) <= 100) {
      // Apex Float: frame phoe_jump_apex
      if (hasTexture('phoe_jump_apex')) {
        actor.setTexture('phoe_jump_apex');
      } else if (hasTexture('phoe_jump')) {
        actor.setTexture('phoe_jump', 2);
      } else {
        actor.setTexture('phoe', 'neutral');
      }
      const float = Math.sin(clock * 12) * 0.02;
      multY = 1 + float;
      multX = 1 - float;
      angle = -2 * p.facing;
    } else {
      // Fall Dive: frame phoe_jump_fall
      if (hasTexture('phoe_jump_fall')) {
        actor.setTexture('phoe_jump_fall');
      } else if (hasTexture('phoe_jump')) {
        actor.setTexture('phoe_jump', 3);
      } else {
        actor.setTexture('phoe', 'neutral');
      }
      const fallStretch = Math.min(0.10, (vy - 100) / 5000);
      multY = 1 + fallStretch;
      multX = 1 - fallStretch * 0.4;
      angle = (-7 + Math.min(4, vy / 200)) * p.facing;
    }
    baseH = 850;
  } else if (landTimer > 0) {
    // Landing Impact Squat: frame phoe_jump_land
    stopAnim();
    if (hasTexture('phoe_jump_land')) {
      actor.setTexture('phoe_jump_land');
    } else if (hasTexture('phoe_jump')) {
      actor.setTexture('phoe_jump', 4);
    } else {
      actor.setTexture('phoe', 'neutral');
    }
    const squashFactor = Math.sin((landTimer / 0.16) * Math.PI) * 0.12;
    multY -= squashFactor;
    multX += squashFactor * 0.8;
    baseH = 850;
  } else if (isMoving) {
    // Grounded Running
    const sprite = actor as Phaser.GameObjects.Sprite;
    const hasRunAnim = scene?.anims?.exists('phoe_running');
    if (hasRunAnim && 'play' in sprite && typeof sprite.play === 'function') {
      if (!sprite.anims.isPlaying || sprite.anims.currentAnim?.key !== 'phoe_running') {
        sprite.play('phoe_running');
      }
    } else {
      stopAnim();
      actor.setTexture('phoe', 'neutral');
    }

    const strideFreq = 16;
    const stridePhase = clock * strideFreq;
    offsetY = -Math.abs(Math.sin(stridePhase)) * 3.5;
    const stepSquash = Math.sin(stridePhase * 2) * 0.035;
    multY += stepSquash;
    multX -= stepSquash * 0.5;
    angle = 5.5 * p.facing;
    baseH = 850;
  } else {
    // Grounded Idle
    stopAnim();

    if (isHolding && hasTexture('phoe_hold')) {
      // Holding active item in hand
      actor.setTexture('phoe_hold');
      const breath = Math.sin(clock * 2.4);
      multY = 1 + breath * 0.02;
      multX = 1 - breath * 0.01;
      angle = Math.sin(clock * 1.2) * 0.5 * p.facing;
    } else {
      // Inhale / Exhale Breathing Cycle (2.4s full cycle)
      const breath = Math.sin(clock * 2.5);
      const isExhale = breath <= 0;
      const breathTexture = isExhale ? 'phoe_idle_exhale' : 'phoe_idle_inhale';

      if (hasTexture(breathTexture)) {
        actor.setTexture(breathTexture);
      } else {
        actor.setTexture('phoe', 'neutral');
      }

      // Continuous subtle chest rise and volume conservation
      multY = 1 + breath * 0.022;
      multX = 1 - breath * 0.012;
      angle = Math.sin(clock * 1.25) * 0.6 * p.facing;
    }
    baseH = 850;
  }

  const baseScale = 80 / baseH;
  actor.setOrigin(originX, 0.99);
  actor.setScale(baseScale * multX, baseScale * multY);
  actor.setFlipX(p.facing < 0);
  actor.setPosition(p.centerX, p.feetY + offsetY);
  actor.setAngle(angle);
  actor.setAlpha(alpha);
}
