import Phaser from 'phaser';
import { A4, APE_FRAMES, ARENA_ART } from '../content/chapter4';
import { C } from '../content/chapter1';
import type { ArenaAttempt, Ape } from '../domain/arena';
import { createPhoe, renderPhoe } from './PhoeHtaungView';

const INK = 0x182720,
  STONE = 0x3b4b3d,
  LIGHT = 0xe9dfbd;

// Universal Walkable Baseline: groundY = height * 0.80 = 576px on 1280x720 canvas
// Sourced from Chapter 1 & Chapter 3 as the single authoritative visual baseline.
export const VISUAL_GROUND_Y = 576;
export const DY = VISUAL_GROUND_Y - C.floor; // 576 - 640 = -64px shift
export const vy = (y: number): number => y + DY;
export const toDomainY = (visualY: number): number => visualY - DY;

interface BrawlParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  maxLife: number;
  color: number;
  isDebris: boolean;
}

/**
 * ArenaView — Chapter 4 Visual Layer
 * Features full dynamic animation for the Brown Ape (4-frame knuckle-walk locomotion,
 * heavy breathing, muscular windup coil/tremor, explosive strike lunge, shove-slide skid,
 * mutual ape-vs-ape brawl animations, and diegetic rage marks) alongside Phoe Htaung's animations.
 * Uses the unified VISUAL_GROUND_Y = 576px walkable baseline across all chapters.
 */
export class ArenaView {
  private bgDecor: Phaser.GameObjects.Graphics;
  private g: Phaser.GameObjects.Graphics;
  private fx: Phaser.GameObjects.Graphics;
  private actor: ReturnType<typeof createPhoe>;
  private apes = new Map<string, Phaser.GameObjects.Sprite>();
  private brawlParticles: BrawlParticle[] = [];
  private lastBrawlTime = 0;
  private wasClashing = false;
  private lastClashMidX = 640;
  private lastShakeTime = -1;
  private lastEmitTime = -1;

  constructor(private scene: Phaser.Scene) {
    const key = scene.textures.exists(ARENA_ART.background.key) ? ARENA_ART.background.key : 'scale_chamber_v1';
    if (scene.textures.exists(key)) scene.add.image(640, 360, key).setDisplaySize(C.width, C.height);
    else scene.add.rectangle(640, 360, C.width, C.height, 0x29392e);

    // Universal Walkable Baseline: groundY = 576px, subterranean bedrock down to 720px (matches Chapter 1 & 3)
    this.bgDecor = scene.add.graphics().setDepth(5);
    const bg = this.bgDecor;
    bg.fillStyle(STONE).fillRect(0, VISUAL_GROUND_Y, C.width, 720 - VISUAL_GROUND_Y);
    bg.fillStyle(0x8e9470).fillRect(0, VISUAL_GROUND_Y, C.width, 6);
    bg.fillStyle(LIGHT, 0.2).fillRect(0, VISUAL_GROUND_Y, C.width, 2);
    for (let x = 0; x < C.width; x += 92) {
      bg.lineStyle(1, INK, 0.5).lineBetween(x, VISUAL_GROUND_Y + 8, x + 12, 720);
    }

    this.g = scene.add.graphics().setDepth(12);
    this.fx = scene.add.graphics().setDepth(30);
    this.actor = createPhoe(scene, 20);

    // Register frames from the master arena_apes_v1 sheet
    if (scene.textures.exists(ARENA_ART.apes.key)) {
      const texture = scene.textures.get(ARENA_ART.apes.key);
      for (const [id, rect] of Object.entries(APE_FRAMES)) {
        if (!texture.has(id)) texture.add(id, 0, rect.x, rect.y, rect.w, rect.h);
      }
    }

    // Register Brown Ape walk cycle animation from sliced spritesheet if available
    if (scene.textures.exists(ARENA_ART.brownApeWalk.key) && !scene.anims.exists('brown_ape_walking')) {
      scene.anims.create({
        key: 'brown_ape_walking',
        frames: scene.anims.generateFrameNumbers(ARENA_ART.brownApeWalk.key, { start: 0, end: 3 }),
        frameRate: 9,
        repeat: -1,
      });
    } else if (scene.textures.exists(ARENA_ART.brownApeSheet.key) && !scene.anims.exists('brown_ape_walking')) {
      scene.anims.create({
        key: 'brown_ape_walking',
        frames: scene.anims.generateFrameNumbers(ARENA_ART.brownApeSheet.key, { start: 1, end: 4 }),
        frameRate: 9,
        repeat: -1,
      });
    }

    // Create Brown Ape sprite (prefers dedicated aligned spritesheet, falls back to arena_apes_v1)
    if (scene.textures.exists(ARENA_ART.brownApeSheet.key)) {
      const brownSprite = scene.add
        .sprite(0, VISUAL_GROUND_Y, ARENA_ART.brownApeSheet.key, 0)
        .setOrigin(0.5, 368 / 380)
        .setDepth(18);
      this.apes.set('brown', brownSprite);
    } else if (scene.textures.exists(ARENA_ART.apes.key) && scene.textures.get(ARENA_ART.apes.key).has('brown_idle')) {
      const brownSprite = scene.add
        .sprite(0, VISUAL_GROUND_Y, ARENA_ART.apes.key, 'brown_idle')
        .setOrigin(0.5, 1)
        .setDepth(18);
      this.apes.set('brown', brownSprite);
    }

    // Create Silver Ape sprite
    if (scene.textures.exists(ARENA_ART.apes.key) && scene.textures.get(ARENA_ART.apes.key).has('silver_idle')) {
      const silverSprite = scene.add
        .sprite(0, VISUAL_GROUND_Y, ARENA_ART.apes.key, 'silver_idle')
        .setOrigin(0.5, 1)
        .setDepth(18);
      this.apes.set('silver', silverSprite);
    }
  }

  private spawnBrawlBurst(cx: number, cy: number, count: number, intensity = 1) {
    const dustColors = [0xe5d3a7, 0xd8c394, 0xcbb382, 0xb59e72, 0x8d8c76];
    const debrisColors = [0x6e6a59, 0x8d8c76, 0xc6c09c, 0x4f4739];
    for (let i = 0; i < count; i++) {
      const isDebris = i % 3 === 0;
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.45;
      const speed = (isDebris ? 140 + Math.random() * 180 : 45 + Math.random() * 110) * intensity;
      const maxLife = isDebris ? 0.38 + Math.random() * 0.28 : 0.42 + Math.random() * 0.35;
      this.brawlParticles.push({
        x: cx + (Math.random() - 0.5) * 44,
        y: cy + (Math.random() - 0.5) * 36,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (isDebris ? 95 * intensity : 35),
        r: isDebris ? 3 + Math.random() * 3.5 : 14 + Math.random() * 16 * intensity,
        life: maxLife,
        maxLife,
        color: isDebris
          ? debrisColors[i % debrisColors.length]!
          : dustColors[i % dustColors.length]!,
        isDebris,
      });
    }
  }

  private updateAndDrawBrawlParticles(dt: number) {
    if (this.brawlParticles.length === 0) return;
    const active: BrawlParticle[] = [];
    for (const pt of this.brawlParticles) {
      pt.life -= dt;
      if (pt.life <= 0) continue;

      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;

      if (pt.isDebris) {
        // Gravity & floor bounce for flying stone chips
        pt.vy += 580 * dt;
        if (pt.y > VISUAL_GROUND_Y - 2) {
          pt.y = VISUAL_GROUND_Y - 2;
          pt.vy = -Math.abs(pt.vy) * 0.42;
          pt.vx *= 0.72;
        }
      } else {
        // Billowing dust puff deceleration and expansion
        pt.vx *= Math.pow(0.18, dt);
        pt.vy *= Math.pow(0.25, dt);
        pt.vy -= 18 * dt;
        pt.r += 22 * dt;
      }

      const ratio = Phaser.Math.Clamp(pt.life / pt.maxLife, 0, 1);
      if (pt.isDebris) {
        this.fx.fillStyle(pt.color, ratio * 0.95);
        this.fx.fillCircle(pt.x, pt.y, pt.r);
        this.fx.lineStyle(1, 0x182720, ratio * 0.8);
        this.fx.strokeCircle(pt.x, pt.y, pt.r);
      } else {
        this.fx.fillStyle(pt.color, ratio * 0.42);
        this.fx.fillCircle(pt.x, pt.y, pt.r);
        this.fx.lineStyle(1.5, 0xf2e3be, ratio * 0.28);
        this.fx.strokeCircle(pt.x, pt.y, pt.r * 0.88);
      }
      active.push(pt);
    }
    this.brawlParticles = active;
  }

  /**
   * Draws diegetic comic anger cross-vein marks (💢) above an ape's head
   * for each friendly-fire hit accumulated (1..3), or during a mutual brawl.
   */
  private drawRageMarks(x: number, topY: number, count: number, clock: number) {
    if (count <= 0) return;
    const pulse = 1 + Math.sin(clock * 18) * 0.16;
    const spacing = 22;
    const startX = x - ((count - 1) * spacing) / 2;

    for (let i = 0; i < count; i++) {
      const mx = startX + i * spacing;
      const my = topY - Math.abs(Math.sin(clock * 12 + i)) * 4;
      const r = 6.5 * pulse;

      // Dark outline backing
      this.fx.lineStyle(4, 0x182720, 0.9);
      this.fx.strokeCircle(mx, my, r * 0.9);

      // Crimson-orange 4-corner comic anger vein (💢)
      this.fx.lineStyle(2.5, i === 2 ? 0xff4d4d : 0xf59e0b, 1);
      // Top-left curve
      this.fx.lineBetween(mx - r, my - 2, mx - 2, my - 2);
      this.fx.lineBetween(mx - 2, my - 2, mx - 2, my - r);
      // Top-right curve
      this.fx.lineBetween(mx + r, my - 2, mx + 2, my - 2);
      this.fx.lineBetween(mx + 2, my - 2, mx + 2, my - r);
      // Bottom-left curve
      this.fx.lineBetween(mx - r, my + 2, mx - 2, my + 2);
      this.fx.lineBetween(mx - 2, my + 2, mx - 2, my + r);
      // Bottom-right curve
      this.fx.lineBetween(mx + r, my + 2, mx + 2, my + 2);
      this.fx.lineBetween(mx + 2, my + 2, mx + 2, my + r);
    }
  }

  /**
   * Draws a clean, segmented Bagan-style overhead health bar above an actor's head.
   */
  private drawOverheadHealthBar(
    x: number,
    topY: number,
    hp: number,
    maxHp: number,
    width: number,
    height: number,
    segments: number,
    isPlayer: boolean,
    flashing = false
  ) {
    const ratio = Phaser.Math.Clamp(hp / maxHp, 0, 1);
    const left = Math.round(x - width / 2);
    const y = Math.round(topY);

    // Outer dark wood plate & brass rim
    this.fx.fillStyle(0x1d1208, 0.94);
    this.fx.fillRoundedRect(left - 2, y - 2, width + 4, height + 4, 3);
    this.fx.lineStyle(1.5, flashing ? 0xffe4a3 : 0xb07c34, 0.9);
    this.fx.strokeRoundedRect(left - 2, y - 2, width + 4, height + 4, 3);

    // Recessed inner depleted track
    this.fx.fillStyle(0x120b05, 0.95);
    this.fx.fillRect(left, y, width, height);

    // Dynamic fill color (brass for the player, ember red for the apes)
    let fillColor: number;
    if (flashing) {
      fillColor = 0xfff3c4;
    } else if (isPlayer) {
      fillColor = ratio > 0.55 ? 0xd9a441 : ratio > 0.28 ? 0xc98f3a : 0x8f2c1d;
    } else {
      fillColor = ratio > 0.5 ? 0xa33a22 : ratio > 0.25 ? 0x8f2c1d : 0x6d1b12;
    }

    const fillW = Math.max(0, Math.round(width * ratio));
    if (fillW > 0) {
      this.fx.fillStyle(fillColor, 0.96);
      this.fx.fillRect(left, y, fillW, height);
      // Top specular highlight strip
      this.fx.fillStyle(0xffffff, 0.28);
      this.fx.fillRect(left, y, fillW, Math.max(1, Math.floor(height * 0.35)));
    }

    // Segment tick dividers
    if (segments > 1) {
      this.fx.lineStyle(1, 0x111a14, 0.78);
      for (let i = 1; i < segments; i++) {
        const sx = Math.round(left + (width * i) / segments);
        this.fx.lineBetween(sx, y, sx, y + height);
      }
    }
  }

  private renderBrownApe(
    a: ArenaAttempt,
    e: Ape,
    actor: Phaser.GameObjects.Sprite,
    clock: number,
    isMoving: boolean
  ) {
    const hasAlignedSheet = this.scene.textures.exists(ARENA_ART.brownApeSheet.key);
    const hasWalkAnim = this.scene.anims.exists('brown_ape_walking');
    const isAlive = e.hp > 0;

    let multX = 1;
    let multY = 1;
    let offsetY = 0;
    let angle = 0;

    const stopAnim = () => {
      if (actor.anims?.isPlaying) actor.stop();
    };

    const setSheetPose = (sheetIndex: number, fallbackPose: 'idle' | 'windup' | 'strike' | 'recover') => {
      stopAnim();
      if (hasAlignedSheet) {
        actor.setTexture(ARENA_ART.brownApeSheet.key, sheetIndex);
        actor.setOrigin(0.5, 368 / 380);
      } else {
        actor.setTexture(ARENA_ART.apes.key, `brown_${fallbackPose}`);
        actor.setOrigin(0.5, 1);
      }
    };

    if (!isAlive || e.phase === 'DOWN') {
      // Knocked down flat on the arena floor
      setSheetPose(7, 'recover');
      multY = 0.4;
      multX = 1.26;
      offsetY = 4;
      angle = -8 * e.facing;
    } else if (e.phase === 'BRAWL') {
      const other = a.apes.find(o => o.id !== e.id && o.hp > 0);
      const gap = other ? Math.abs(other.x - e.x) : 0;
      if (gap > 86) {
        // Furious knuckle-walk charge toward the Silver Ape
        if (hasWalkAnim) {
          actor.setOrigin(0.5, 368 / 380);
          if (!actor.anims.isPlaying || actor.anims.currentAnim?.key !== 'brown_ape_walking') {
            actor.play('brown_ape_walking');
          }
        } else {
          setSheetPose(1 + (Math.floor(clock * 14) % 4), 'idle');
        }
        const chargePhase = clock * 20;
        offsetY = -Math.abs(Math.sin(chargePhase)) * 7;
        multY = 1 + Math.sin(chargePhase * 2) * 0.06;
        multX = 1 - Math.sin(chargePhase * 2) * 0.04;
        angle = 7.5 * e.facing;
      } else {
        // Rapid alternating windup & strike punches against the Silver Ape
        const cycle = Math.sin(clock * 22);
        if (cycle > 0) {
          setSheetPose(6, 'strike');
          multX = 1.15;
          multY = 0.90;
          angle = 9 * e.facing;
          offsetY = 2;
        } else {
          setSheetPose(5, 'windup');
          multX = 0.94;
          multY = 1.09;
          angle = -6 * e.facing;
          offsetY = -4;
        }
      }
    } else if (e.phase === 'WINDUP') {
      // Heavy muscular windup coil + rage tremor before melee smash
      setSheetPose(5, 'windup');
      const progress = Phaser.Math.Clamp(1 - e.phaseLeft / A4.meleeWindup, 0, 1);
      const tremor = Math.sin(clock * 44) * progress;
      multY = 1 + progress * 0.11 + tremor * 0.025;
      multX = 1 - progress * 0.05 - tremor * 0.02;
      offsetY = -progress * 5;
      angle = -progress * 7 * e.facing + tremor * 1.8;
    } else if (e.phase === 'STRIKE') {
      // Explosive ground-slam lunge
      setSheetPose(6, 'strike');
      const progress = Phaser.Math.Clamp(1 - e.phaseLeft / A4.meleeStrike, 0, 1);
      const slamCurve = Math.sin(progress * Math.PI);
      multX = 1.12 + slamCurve * 0.08;
      multY = 0.90 - slamCurve * 0.06;
      offsetY = 3;
      angle = 9 * e.facing;
    } else if (e.phase === 'STUN') {
      // Shoved back slide ("create slide" knockback reaction when Phoe Htaung punches/shoves)
      setSheetPose(7, 'recover');
      const stunProgress = Phaser.Math.Clamp(e.phaseLeft / A4.punchStun, 0, 1);
      const slideWobble = Math.sin(clock * 28) * stunProgress;
      multY = 0.86 + (1 - stunProgress) * 0.14;
      multX = 1.14 - (1 - stunProgress) * 0.14;
      offsetY = 4 * stunProgress;
      angle = (-11 * stunProgress + slideWobble * 3) * e.facing;

      // Draw skidding dust puffs under knuckles/feet while sliding back
      if (stunProgress > 0.25) {
        const dustX = e.x + e.facing * 28;
        this.g.fillStyle(0xcbb382, 0.38 * stunProgress);
        this.g.fillCircle(dustX, VISUAL_GROUND_Y - 4, 8 + (1 - stunProgress) * 10);
        this.g.fillCircle(dustX - e.facing * 18, VISUAL_GROUND_Y - 2, 6 + (1 - stunProgress) * 7);
      }
    } else if (e.phase === 'RECOVER') {
      // Exhausted heavy panting window
      setSheetPose(7, 'recover');
      const pant = Math.sin(clock * 10);
      multY = 0.94 + pant * 0.04;
      multX = 1.05 - pant * 0.03;
      offsetY = 2 - Math.max(0, pant) * 2;
      angle = 4 * e.facing;
    } else if (isMoving) {
      // Active Knuckle-Walk Chase Animation
      if (hasWalkAnim) {
        actor.setOrigin(0.5, 368 / 380);
        if (!actor.anims.isPlaying || actor.anims.currentAnim?.key !== 'brown_ape_walking') {
          actor.play('brown_ape_walking');
        }
      } else {
        setSheetPose(1 + (Math.floor(clock * 9) % 4), 'idle');
      }

      const strideFreq = 13;
      const stridePhase = clock * strideFreq;
      offsetY = -Math.abs(Math.sin(stridePhase)) * 5.5;
      const stepSquash = Math.sin(stridePhase * 2) * 0.048;
      multY = 1 + stepSquash;
      multX = 1 - stepSquash * 0.55;
      angle = (4.5 + Math.sin(stridePhase) * 2.5) * e.facing;

      // Periodic knuckle-step dust puff at ground contact
      if (Math.abs(Math.sin(stridePhase)) < 0.22) {
        const stepFootX = e.x - e.facing * 20;
        this.g.fillStyle(0xbba577, 0.28);
        this.g.fillEllipse(stepFootX, VISUAL_GROUND_Y - 2, 22, 8);
      }
    } else {
      // Menacing Idle Breathing Cycle
      setSheetPose(0, 'idle');
      const breath = Math.sin(clock * 3.2);
      multY = 1 + breath * 0.028;
      multX = 1 - breath * 0.016;
      angle = Math.sin(clock * 1.6) * 1.2 * e.facing;
    }

    // Position alignment: aligned spritesheet already embeds the torso anchor at center X (0.5)
    let xPos = e.x;
    if (!hasAlignedSheet) {
      const poseKey =
        e.phase === 'WINDUP'
          ? 'windup'
          : e.phase === 'STRIKE'
          ? 'strike'
          : ['RECOVER', 'STUN', 'DOWN'].includes(e.phase)
          ? 'recover'
          : 'idle';
      const frame = APE_FRAMES[`brown_${poseKey}`]!;
      xPos += (0.5 - frame.anchor) * frame.w * 0.4 * (e.facing < 0 ? 1 : -1);
    }

    const baseScale = 0.4;
    actor.setPosition(xPos, VISUAL_GROUND_Y + offsetY);
    actor.setScale(baseScale * multX, baseScale * multY);
    actor.setFlipX(e.facing > 0);
    actor.setAngle(angle);
    actor.setAlpha(a.combatWon ? 0.45 : isAlive ? 1 : 0.55);
    if (e.hitLeft > 0) actor.setTintFill(0xffe4a3);
    else actor.clearTint();
  }

  private enemy(a: ArenaAttempt, e: Ape) {
    const g = this.g;
    const actor = this.apes.get(e.id);
    const clock = a.elapsed;

    // Compute horizontal motion from previous frame position for locomotion detection
    const prevX = (actor?.getData('lastX') as number | undefined) ?? e.x;
    const isMoving = e.hp > 0 && (e.phase === 'IDLE' || e.phase === 'BRAWL') && Math.abs(e.x - prevX) > 0.08;

    if (actor) {
      actor.setData('lastX', e.x);
    }

    if (actor && e.id === 'brown') {
      this.renderBrownApe(a, e, actor, clock, isMoving);
    } else if (actor) {
      // Silver Ape (Ranged stone thrower + brawl reaction)
      let pose: 'idle' | 'windup' | 'strike' | 'recover' =
        e.phase === 'WINDUP'
          ? 'windup'
          : e.phase === 'STRIKE'
          ? 'strike'
          : ['RECOVER', 'STUN', 'DOWN'].includes(e.phase)
          ? 'recover'
          : 'idle';

      let angle = 0;
      let offsetY = 0;
      if (e.phase === 'BRAWL') {
        const cycle = Math.sin(clock * 22 + Math.PI);
        pose = cycle > 0 ? 'strike' : 'windup';
        angle = (cycle > 0 ? 8 : -5) * e.facing;
        offsetY = -Math.abs(Math.sin(clock * 18)) * 5;
      }

      const frame = APE_FRAMES[`${e.id}_${pose}`]!;
      const offset = (0.5 - frame.anchor) * frame.w * 0.4 * (e.facing < 0 ? 1 : -1);
      const breath = e.hp > 0 && pose === 'idle' ? Math.sin(clock * 2.8) * 0.022 : 0;
      const windupStretch =
        e.phase === 'WINDUP' ? (1 - e.phaseLeft / A4.throwWindup) * 0.06 : 0;
      const scaleY = e.hp > 0 ? 0.4 * (1 + breath + windupStretch) : 0.16;
      const scaleX = 0.4 * (1 - breath * 0.5 - windupStretch * 0.3);

      actor.setTexture(ARENA_ART.apes.key, `${e.id}_${pose}`).setPosition(e.x + offset, VISUAL_GROUND_Y + offsetY);
      actor.setAngle(angle);
      actor.setScale(scaleX, scaleY).setFlipX(e.facing > 0).setAlpha(a.combatWon ? 0.45 : e.hp > 0 ? 1 : 0.55);
      if (e.hitLeft > 0) actor.setTintFill(0xffe4a3);
      else actor.clearTint();
    } else {
      g.fillStyle(e.id === 'brown' ? 0x68503b : 0x899185, e.hp > 0 ? 1 : 0.4).fillEllipse(
        e.x,
        VISUAL_GROUND_Y - 65,
        100,
        e.hp > 0 ? 130 : 45
      );
    }

    // Ground shadow scales dynamically with ape stance
    const shadowW = e.phase === 'WINDUP' ? 102 : e.phase === 'STRIKE' ? 124 : 110;
    g.fillStyle(0x111b10, 0.45).fillEllipse(e.x, VISUAL_GROUND_Y + 1, shadowW, 15);

    // Draw overhead health bar & diegetic comic rage marks (💢) above ape head
    if (e.hp > 0) {
      this.drawOverheadHealthBar(
        e.x,
        VISUAL_GROUND_Y - 156,
        e.hp,
        A4.apeHealth,
        68,
        7,
        5,
        false,
        e.hitLeft > 0
      );
      const rageCount = e.phase === 'BRAWL' ? 3 : e.friendlyHits || 0;
      if (rageCount > 0) {
        this.drawRageMarks(e.x, VISUAL_GROUND_Y - 174, rageCount, clock);
      }
    }

    if (e.hitLeft > 0) {
      const radius = 22 + (1 - e.hitLeft / A4.hitFlash) * 26;
      this.fx.lineStyle(3, 0xffe1a0, e.hitLeft / A4.hitFlash);
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        this.fx.lineBetween(
          e.x + Math.cos(angle) * radius,
          VISUAL_GROUND_Y - 65 + Math.sin(angle) * radius,
          e.x + Math.cos(angle) * (radius + 12),
          VISUAL_GROUND_Y - 65 + Math.sin(angle) * (radius + 12)
        );
      }
    }
  }

  private drawArenaObstacles(a: ArenaAttempt) {
    const g = this.g;

    // 1. Fallen Stone Pillar (Jump Hurdle at A4.pillarX = 380)
    const px = A4.pillarX - A4.pillarW / 2;
    const py = VISUAL_GROUND_Y - A4.pillarH;
    const pw = A4.pillarW;
    const ph = A4.pillarH;

    // Ground contact shadow
    g.fillStyle(0x10190e, 0.52).fillEllipse(A4.pillarX, VISUAL_GROUND_Y + 2, pw + 18, 12);
    // Outer ink frame & carved sandstone block
    g.fillStyle(INK).fillRoundedRect(px - 2, py - 2, pw + 4, ph + 4, 4);
    g.fillStyle(0x6e6c56).fillRoundedRect(px, py, pw, ph, 3);
    // Stepped top landing ledge highlight
    g.fillStyle(0x9d987b).fillRect(px - 3, py, pw + 6, 8);
    g.fillStyle(LIGHT, 0.35).fillRect(px - 1, py + 1, pw + 2, 2);
    // Bagan diamond relief band & weathering cracks
    g.lineStyle(1.5, 0x3b3d2f, 0.85)
      .lineBetween(px + 6, py + 18, px + pw - 6, py + 18)
      .lineBetween(px + 6, py + 28, px + pw - 6, py + 28)
      .lineBetween(px + 18, py + 8, px + 23, py + ph - 4);
    g.fillStyle(0xcfa861, 0.45).fillCircle(A4.pillarX, py + 23, 3.5);

    // 2. Collapsed Temple Stone Lintel Arch (Crawl Tunnel at A4.archX = 580)
    const ax = A4.archX - A4.archW / 2;
    const aw = A4.archW;
    const archTopY = VISUAL_GROUND_Y - A4.archTopH;
    const lintelBottomY = VISUAL_GROUND_Y - A4.archClearance;
    const lintelH = lintelBottomY - archTopY;
    const colW = 16;

    // Ground shadows under left/right arch columns and dark crawl tunnel recess
    g.fillStyle(0x0d1510, 0.55).fillRect(ax + colW - 2, lintelBottomY, aw - colW * 2 + 4, A4.archClearance);
    g.fillStyle(0x10190e, 0.55).fillEllipse(A4.archX, VISUAL_GROUND_Y + 2, aw + 20, 14);

    // Left & right broken stone columns supporting the low lintel
    for (const colX of [ax, ax + aw - colW]) {
      g.fillStyle(INK).fillRect(colX - 2, lintelBottomY - 2, colW + 4, A4.archClearance + 4);
      g.fillStyle(0x555644).fillRect(colX, lintelBottomY, colW, A4.archClearance);
      g.fillStyle(0x7c7b63).fillRect(colX + 2, lintelBottomY, 4, A4.archClearance);
    }

    // Overhead heavy stone lintel beam (drawn on fx layer so crawling Phoe passes cleanly underneath)
    const fx = this.fx;
    fx.fillStyle(INK).fillRoundedRect(ax - 5, archTopY - 2, aw + 10, lintelH + 4, 4);
    fx.fillStyle(0x696752).fillRoundedRect(ax - 3, archTopY, aw + 6, lintelH, 3);
    // Top cap & bottom crawl-clearance edge highlight
    fx.fillStyle(0x9a9579).fillRect(ax - 5, archTopY, aw + 10, 8);
    fx.fillStyle(LIGHT, 0.3).fillRect(ax - 3, archTopY + 1, aw + 6, 2);
    fx.fillStyle(0x3f4032).fillRect(ax - 2, lintelBottomY - 6, aw + 4, 6);
    // Ornamental Bagan arch trim & cracks
    fx.lineStyle(1.5, 0xcfa861, 0.55).strokeRect(ax + 6, archTopY + 14, aw - 12, lintelH - 24);
    fx.lineStyle(1.5, INK, 0.7)
      .lineBetween(A4.archX - 14, archTopY + 8, A4.archX - 8, lintelBottomY - 4)
      .lineBetween(A4.archX + 18, archTopY + 12, A4.archX + 12, lintelBottomY - 2);

    // 3. Dynamically Placed Brown Ape Obstacles ('PILLAR' jump blocks & 'LOG' crouch/crawl barricades)
    for (const obs of a.obstacles) {
      const remaining = obs.ttl - obs.age;
      const alpha = remaining < 1.8 ? Phaser.Math.Clamp(remaining / 1.8, 0.25, 1) : 1;
      const dropSlide = obs.age < 0.2 ? (1 - obs.age / 0.2) * -28 : 0;

      if (obs.kind === 'PILLAR') {
        const dw = A4.droppedPillarW;
        const dh = A4.droppedPillarH;
        const dx = obs.x - dw / 2;
        const dy = VISUAL_GROUND_Y - dh + dropSlide;

        g.fillStyle(0x10190e, 0.48 * alpha).fillEllipse(obs.x, VISUAL_GROUND_Y + 2, dw + 14, 10);
        g.fillStyle(INK, alpha).fillRoundedRect(dx - 2, dy - 2, dw + 4, dh + 4, 3);
        g.fillStyle(0x78735b, alpha).fillRoundedRect(dx, dy, dw, dh, 2);
        g.fillStyle(0xa8a182, alpha).fillRect(dx - 2, dy, dw + 4, 7);
        g.lineStyle(1.5, 0x3b3d2f, 0.8 * alpha)
          .lineBetween(dx + 5, dy + 16, dx + dw - 5, dy + 16)
          .lineBetween(dx + 14, dy + 7, dx + 19, dy + dh - 3);
      } else {
        // Elevated Timber Log Barricade (requires crouching/crawling underneath or high jump over)
        const lw = A4.droppedLogW;
        const lx = obs.x - lw / 2;
        const logTopY = VISUAL_GROUND_Y - A4.droppedLogTopH + dropSlide;
        const logBotY = VISUAL_GROUND_Y - A4.droppedLogClearance + dropSlide;
        const logH = logBotY - logTopY;

        // Ground shadow & support stakes on g layer
        g.fillStyle(0x10190e, 0.48 * alpha).fillEllipse(obs.x, VISUAL_GROUND_Y + 2, lw + 16, 11);
        g.lineStyle(5, 0x3b2818, alpha)
          .lineBetween(lx + 8, VISUAL_GROUND_Y, lx + 16, logTopY + 8)
          .lineBetween(lx + lw - 8, VISUAL_GROUND_Y, lx + lw - 16, logTopY + 8);
        g.lineStyle(2.5, 0x7c5836, alpha)
          .lineBetween(lx + 8, VISUAL_GROUND_Y, lx + 16, logTopY + 8)
          .lineBetween(lx + lw - 8, VISUAL_GROUND_Y, lx + lw - 16, logTopY + 8);

        // Horizontal timber log on fx layer so crawling Phoe passes cleanly underneath
        fx.fillStyle(INK, alpha).fillRoundedRect(lx - 3, logTopY - 2, lw + 6, logH + 4, 8);
        fx.fillStyle(0x6b4a2b, alpha).fillRoundedRect(lx, logTopY, lw, logH, 6);
        fx.fillStyle(0x8c653e, alpha).fillRect(lx + 4, logTopY + 3, lw - 8, 6);
        // Wood grain & bark rings
        fx.lineStyle(1.5, 0x3d2815, 0.85 * alpha)
          .lineBetween(lx + 6, logTopY + 16, lx + lw - 6, logTopY + 16)
          .lineBetween(lx + 10, logTopY + 28, lx + lw - 10, logTopY + 28);
        fx.fillStyle(0xc59b6d, 0.9 * alpha).fillEllipse(lx + 5, logTopY + logH / 2, 7, logH - 8);
      }
    }

    // Trigger dust puff & ground thud when the Brown Ape places a new obstacle
    if (a.events.includes('obstacle_drop') && a.obstacles.length > 0) {
      const newest = a.obstacles[a.obstacles.length - 1]!;
      this.spawnBrawlBurst(newest.x, VISUAL_GROUND_Y - 16, 12, 0.85);
      this.scene.cameras?.main?.shake(120, 0.0045);
    }

    // Trigger stone dust & screen shake when the Brown Ape bonks into an obstacle
    if (a.events.includes('obstacle_outplay')) {
      const brown = a.apes.find(e => e.id === 'brown');
      const hitX = brown ? brown.x + brown.facing * 36 : A4.archX;
      this.spawnBrawlBurst(hitX, VISUAL_GROUND_Y - 58, 18, 1.15);
      this.scene.cameras?.main?.shake(190, 0.0085);
    }
  }

  public getActorSprite(): Phaser.GameObjects.Sprite | null {
    return this.actor;
  }

  render(a: ArenaAttempt, bagOpen = false, grabControl?: string | null) {
    const g = this.g;
    g.clear();
    this.fx.clear();

    // Reset particle state if attempt restarted
    if (a.elapsed < this.lastBrawlTime) {
      this.brawlParticles = [];
      this.wasClashing = false;
      this.lastShakeTime = -1;
      this.lastEmitTime = -1;
    }
    const dt = Phaser.Math.Clamp(a.elapsed - this.lastBrawlTime, 0, 0.05);
    this.lastBrawlTime = a.elapsed;

    g.lineStyle(2, 0xcfb37b, 0.6).lineBetween(0, VISUAL_GROUND_Y, C.width, VISUAL_GROUND_Y);
    for (const x of A4.refillX) {
      g.fillStyle(0x302b20, 0.5).fillEllipse(x, VISUAL_GROUND_Y + 2, 82, 13);
      for (let i = 0; i < 5; i++) {
        const sx = x - 27 + i * 13,
          y = VISUAL_GROUND_Y - 5 - (i % 2) * 6;
        g.fillStyle(0x8d8c76).fillEllipse(sx, y, 19, 13);
        g.lineStyle(1, 0xc6c09c, 0.6).strokeEllipse(sx, y, 19, 13);
      }
    }

    // Draw Fallen Stone Pillar & Low Stone Crawl-Arch obstacles
    this.drawArenaObstacles(a);

    for (const e of a.apes) this.enemy(a, e);

    // Mutual brawl dust clouds, flying stone debris, and rhythmic camera screen shake
    const brawlingApes = a.apes.filter(e => e.hp > 0 && e.phase === 'BRAWL');
    const isClashing =
      brawlingApes.length === 2 && Math.abs(brawlingApes[0]!.x - brawlingApes[1]!.x) <= 105;

    if (brawlingApes.length === 2 && !isClashing) {
      // Charging toward each other: kick up heavy footstep dust clouds & light ground rumble
      if (a.elapsed - this.lastEmitTime >= 0.08) {
        this.lastEmitTime = a.elapsed;
        for (const ape of brawlingApes) {
          this.spawnBrawlBurst(ape.x - ape.facing * 20, VISUAL_GROUND_Y - 8, 3, 0.65);
        }
        this.scene.cameras?.main?.shake(55, 0.0022);
      }
    }

    if (isClashing) {
      const midX = (brawlingApes[0]!.x + brawlingApes[1]!.x) / 2;
      const midY = VISUAL_GROUND_Y - 64;
      this.lastClashMidX = midX;

      // Initial heavy collision impact when the two apes first slam into each other
      if (!this.wasClashing) {
        this.spawnBrawlBurst(midX, midY, 22, 1.25);
        this.scene.cameras?.main?.shake(220, 0.0095);
        this.lastShakeTime = a.elapsed;
        this.lastEmitTime = a.elapsed;
      } else {
        // Continuous dust & flying rock chips during the brawl
        if (a.elapsed - this.lastEmitTime >= 0.065) {
          this.lastEmitTime = a.elapsed;
          this.spawnBrawlBurst(midX, midY + 12, 6, 0.95);
        }
        // Rhythmic heavy punch camera shakes synced to the brawl blow cycle
        if (a.elapsed - this.lastShakeTime >= 0.14) {
          this.lastShakeTime = a.elapsed;
          this.scene.cameras?.main?.shake(95, 0.0058);
        }
      }

      // Billowing core cartoon brawl cloud & kinetic clash sparks
      const puffPulse = Math.sin(a.elapsed * 26);
      const crossPulse = Math.cos(a.elapsed * 31);
      this.fx.fillStyle(0xd8c394, 0.38);
      this.fx.fillCircle(midX - 20 + puffPulse * 9, midY + 14, 28);
      this.fx.fillCircle(midX + 20 - puffPulse * 9, midY - 8, 26);
      this.fx.fillStyle(0xe8d7b0, 0.32);
      this.fx.fillCircle(midX + crossPulse * 11, midY + 2, 31);

      // Expanding shockwave rings & radial impact burst lines
      this.fx.lineStyle(3, 0xffcf7a, 0.88);
      this.fx.strokeCircle(midX, midY, 34 + puffPulse * 9);
      this.fx.lineStyle(2, 0xffe8b3, 0.65);
      for (let i = 0; i < 8; i++) {
        const ang = (i * Math.PI) / 4 + a.elapsed * 6;
        const innerR = 24 + (i % 2) * 8;
        const outerR = innerR + 14 + Math.abs(puffPulse) * 10;
        this.fx.lineBetween(
          midX + Math.cos(ang) * innerR,
          midY + Math.sin(ang) * innerR,
          midX + Math.cos(ang) * outerR,
          midY + Math.sin(ang) * outerR
        );
      }
    } else if (this.wasClashing) {
      // Final heavy mutual-damage knockdown slam when the brawl concludes!
      this.spawnBrawlBurst(this.lastClashMidX, VISUAL_GROUND_Y - 54, 28, 1.45);
      this.scene.cameras?.main?.shake(280, 0.0125);
    }
    this.wasClashing = isClashing;

    // Step and draw all active dust & debris particles
    this.updateAndDrawBrawlParticles(dt);

    const p = a.player,
      direction = a.charge > 0 ? a.aimFacing : p.facing,
      visualFeetY = vy(p.feetY);
    g.fillStyle(0x10190e, 0.5).fillEllipse(p.centerX, visualFeetY + 1, 34, 8);
    g.lineStyle(2, 0xe5c58a, 0.6).strokeEllipse(p.centerX, visualFeetY + 1, 40, 10);
    if (this.actor) {
      renderPhoe(
        this.actor,
        {
          ...p,
          feetY: visualFeetY,
          facing: direction,
          holding: a.weapon === 'SLING' && !grabControl,
          control: (grabControl || (bagOpen ? 'RUMMAGE' : a.dodgeLeft > 0 ? 'LAYING' : p.control)) as any,
          pushing: a.punchLeft > A4.punchCooldown - 0.12 && !grabControl,
        },
        a.elapsed
      );
      if (a.staggerLeft > 0) this.actor.setTintFill(0xffb9a3);
      else this.actor.clearTint();
    }
    const isLowProfile = grabControl === 'PICKUP' || a.dodgeLeft > 0 || p.control === 'LAYING';
    this.drawOverheadHealthBar(
      p.centerX,
      visualFeetY - (isLowProfile ? 62 : 98),
      a.hp,
      A4.health,
      56,
      7,
      4,
      true,
      a.staggerLeft > 0 || a.hurtLeft > A4.hurtGrace - 0.18
    );
    if (a.weapon === 'SLING' && a.hasSling && a.dodgeLeft <= 0 && !bagOpen && !grabControl) {
      const x = p.centerX + direction * 25,
        y = visualFeetY - 47,
        pull = (a.charge / A4.chargeTime) * 22;
      g.lineStyle(6, 0x292114)
        .lineBetween(x, y + 15, x, y - 3)
        .lineBetween(x, y - 3, x - 9, y - 16)
        .lineBetween(x, y - 3, x + 9, y - 16);
      g.lineStyle(3, 0xaa7643)
        .lineBetween(x, y + 15, x, y - 3)
        .lineBetween(x, y - 3, x - 9, y - 16)
        .lineBetween(x, y - 3, x + 9, y - 16);
      g.lineStyle(1.8, 0xe0c089)
        .lineBetween(x - 9, y - 16, x - direction * pull, y - 8)
        .lineBetween(x + 9, y - 16, x - direction * pull, y - 8);
      if (a.charge > 0) {
        g.fillStyle(0xc3c2a3).fillCircle(x - direction * pull, y - 8, 4);
      }
    }
    for (const shot of a.shots) {
      const sy = vy(shot.y);
      g.lineStyle(2, shot.owner === 'PHOE' ? 0xe7ca83 : 0xd9975d, 0.5).lineBetween(
        shot.x,
        sy,
        shot.x - shot.vx * 0.025,
        sy - shot.vy * 0.025
      );
      g.fillStyle(0x24271c).fillCircle(shot.x, sy, shot.owner === 'PHOE' ? 5 : 6);
      g.fillStyle(shot.owner === 'PHOE' ? 0xc7c1a2 : 0x938e77).fillCircle(
        shot.x - 1,
        sy - 1,
        shot.owner === 'PHOE' ? 3 : 4
      );
      this.fx.lineStyle(2, shot.owner === 'PHOE' ? 0xffe0a0 : 0xf3ac80, 0.95).strokeCircle(shot.x, sy, 6);
    }
    if (a.combatWon) {
      this.drawGoldPouchTrap(a);
      const exitTop = vy(430);
      const arrowY = vy(565);
      g.fillStyle(0xd8b362, 0.15).fillRect(1206, exitTop, 74, VISUAL_GROUND_Y - exitTop);
      g.lineStyle(4, 0xf0ce7a)
        .lineBetween(1220, arrowY, 1260, arrowY)
        .lineBetween(1248, arrowY - 13, 1260, arrowY)
        .lineBetween(1248, arrowY + 13, 1260, arrowY);
    }
  }

  public triggerGoldExplosion(cx = A4.goldTrapX, cy = VISUAL_GROUND_Y - 22) {
    const fireColors = [0xfffbeb, 0xfde047, 0xf59e0b, 0xea580c, 0xdc2626];
    const shrapnelColors = [0xffd700, 0xfbbf24, 0xb91c1c, 0x292524];
    for (let i = 0; i < 38; i++) {
      const isDebris = i % 2 === 0;
      const angle = (Math.PI * 2 * i) / 38 + (Math.random() - 0.5) * 0.35;
      const speed = isDebris ? 180 + Math.random() * 260 : 75 + Math.random() * 165;
      const maxLife = isDebris ? 0.48 + Math.random() * 0.35 : 0.45 + Math.random() * 0.35;
      this.brawlParticles.push({
        x: cx + (Math.random() - 0.5) * 28,
        y: cy + (Math.random() - 0.5) * 24,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (isDebris ? 145 : 55),
        r: isDebris ? 3.5 + Math.random() * 4 : 18 + Math.random() * 22,
        life: maxLife,
        maxLife,
        color: isDebris
          ? shrapnelColors[i % shrapnelColors.length]!
          : fireColors[i % fireColors.length]!,
        isDebris,
      });
    }
    this.scene.cameras?.main?.shake(420, 0.018);
  }

  private drawGoldPouchTrap(a: ArenaAttempt) {
    const gx = A4.goldTrapX;
    const gy = VISUAL_GROUND_Y;
    const pulse = Math.sin(a.elapsed * 5.5);

    if (a.goldTrapExploded) {
      // Scorched blast crater on the stone floor
      this.g.fillStyle(0x141210, 0.78).fillEllipse(gx, gy + 1, 78, 16);
      this.g.fillStyle(0x29231e, 0.65).fillEllipse(gx, gy + 1, 52, 10);
      this.fx.lineStyle(2.5, 0xf97316, 0.75).strokeCircle(gx, gy - 18, 28 + Math.abs(pulse) * 14);
      this.fx.lineStyle(1.5, 0xfef08a, 0.55).strokeCircle(gx, gy - 18, 16 + Math.abs(pulse) * 8);
      return;
    }

    // Tempting golden aura on ground
    this.g.fillStyle(0xf59e0b, 0.16 + (pulse + 1) * 0.05).fillEllipse(gx, gy - 6, 68, 26);
    this.g.fillStyle(0x10190e, 0.55).fillEllipse(gx, gy + 2, 48, 11);

    // Scattered spilled gold coins around the base
    for (const [dx, dy] of [
      [-20, 0],
      [19, 1],
      [-12, 3],
      [13, 3],
    ] as const) {
      this.g.fillStyle(0x182720).fillEllipse(gx + dx, gy + dy, 11, 6);
      this.g.fillStyle(0xfbbf24).fillEllipse(gx + dx, gy + dy - 0.5, 9, 4.5);
    }

    // Bulging Gold Pouch (ရွှေထုပ်) body
    const bobY = Math.sin(a.elapsed * 4.2) * 2;
    const py = gy - 16 + bobY;
    this.g.fillStyle(0x182720).fillEllipse(gx, py, 38, 30);
    this.g.fillStyle(0xd97706).fillEllipse(gx, py, 34, 26);
    this.g.fillStyle(0xf59e0b).fillEllipse(gx - 2, py - 1, 28, 21);
    this.g.fillStyle(0xfef08a, 0.65).fillEllipse(gx - 6, py - 5, 11, 8);

    // Tied top ruffle & crimson silk cord
    this.g.fillStyle(0x182720).fillTriangle(gx - 12, py - 22, gx + 12, py - 22, gx, py - 10);
    this.g.fillStyle(0xfbbf24).fillTriangle(gx - 9, py - 20, gx + 9, py - 20, gx, py - 11);
    this.g.lineStyle(3.5, 0xb91c1c).lineBetween(gx - 8, py - 12, gx + 8, py - 12);

    // Twinkling 4-point star sparkles above the gold pouch
    const starY = py - 28 + Math.cos(a.elapsed * 6) * 3;
    const starX = gx + Math.sin(a.elapsed * 3.5) * 12;
    const sr = 5 + Math.abs(pulse) * 2.5;
    this.fx.lineStyle(2, 0xfef08a, 0.95)
      .lineBetween(starX - sr, starY, starX + sr, starY)
      .lineBetween(starX, starY - sr, starX, starY + sr);
  }
}

