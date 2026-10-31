import Phaser from 'phaser';
import { C } from '../content/chapter1';
import { F5 } from '../content/chapter5';
import { CART_FRAME, FINAL_ART, UGYI_FRAMES, UGYI_SOURCE_SCALE } from '../content/chapter5Art';
import { finalGuarded, finalSlamArea } from '../domain/finalBoss';
import type { FinalAttempt } from '../domain/finalBoss';
import { createPhoe, renderPhoe } from './PhoeHtaungView';

export const VISUAL_GROUND_Y = 576;
export const DY = VISUAL_GROUND_Y - C.floor;
export const vy = (y: number): number => y + DY;

export class FinalView {
  private background: Phaser.GameObjects.Image | null = null;
  private bgDecor: Phaser.GameObjects.Graphics;
  private g: Phaser.GameObjects.Graphics;
  private fx: Phaser.GameObjects.Graphics;
  private hero: ReturnType<typeof createPhoe>;
  private boss: Phaser.GameObjects.Image | null = null;
  private cart: Phaser.GameObjects.Image | null = null;
  private playerDamage: Phaser.GameObjects.Text;
  private bossDamage: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    const bg = scene.textures.exists(FINAL_ART.background.key)
      ? FINAL_ART.background.key
      : scene.textures.exists(FINAL_ART.escape.key)
      ? FINAL_ART.escape.key
      : 'arena_chamber_v1';
    if (scene.textures.exists(bg)) this.background = scene.add.image(640, 360, bg).setDisplaySize(C.width, C.height);
    else scene.add.rectangle(640, 360, C.width, C.height, 0x33362a);

    this.bgDecor = scene.add.graphics().setDepth(5);
    this.drawSubterraneanBase();

    this.g = scene.add.graphics().setDepth(12);
    this.fx = scene.add.graphics().setDepth(30);
    this.hero = createPhoe(scene, 22);

    this.playerDamage = scene.add
      .text(0, 0, '', {
        fontFamily: 'system-ui',
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#ff9a90',
        stroke: '#241411',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(40)
      .setVisible(false);

    this.bossDamage = scene.add
      .text(0, 0, '', {
        fontFamily: 'system-ui',
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#ffe4a0',
        stroke: '#241411',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(40)
      .setVisible(false);

    if (scene.textures.exists(FINAL_ART.ugyi.key)) {
      const tex = scene.textures.get(FINAL_ART.ugyi.key);
      for (const [name, f] of Object.entries(UGYI_FRAMES)) if (!tex.has(name)) tex.add(name, 0, f.x, f.y, f.w, f.h);
      if (tex.has('guard')) {
        this.boss = scene.add.image(F5.bossSpawn, VISUAL_GROUND_Y, FINAL_ART.ugyi.key, 'guard').setOrigin(0.5, 1).setDepth(20);
      }
    }
    if (scene.textures.exists(FINAL_ART.cart.key)) {
      const tex = scene.textures.get(FINAL_ART.cart.key);
      if (!tex.has('body')) tex.add('body', 0, CART_FRAME.x, CART_FRAME.y, CART_FRAME.w, CART_FRAME.h);
      this.cart = scene.add.image(F5.cartSpawn, VISUAL_GROUND_Y, FINAL_ART.cart.key, 'body').setOrigin(0.5, 1).setDisplaySize(F5.cartW, F5.cartH).setDepth(19);
    }
  }

  private drawSubterraneanBase() {
    const bg = this.bgDecor;
    bg.clear();
    // Subterranean bedrock masonry from VISUAL_GROUND_Y (576) to canvas bottom (720)
    bg.fillStyle(0x3b4b3d, 1);
    bg.fillRect(0, VISUAL_GROUND_Y, C.width, C.height - VISUAL_GROUND_Y);
    // Flagstone top border cap
    bg.fillStyle(0x6e7c66, 1);
    bg.fillRect(0, VISUAL_GROUND_Y, C.width, 14);
    bg.fillStyle(0xe9dfbd, 0.28);
    bg.fillRect(0, VISUAL_GROUND_Y, C.width, 3);
    // Subterranean bedrock seam grid lines
    bg.lineStyle(1.5, 0x182720, 0.45);
    for (let x = 64; x < C.width; x += 96) {
      bg.lineBetween(x, VISUAL_GROUND_Y + 14, x, C.height);
    }
    bg.lineBetween(0, VISUAL_GROUND_Y + 48, C.width, VISUAL_GROUND_Y + 48);
    bg.lineBetween(0, VISUAL_GROUND_Y + 92, C.width, VISUAL_GROUND_Y + 92);
  }

  public getActorSprite(): Phaser.GameObjects.Sprite | null {
    return this.hero;
  }

  render(a: FinalAttempt, options: { bag?: boolean; reveal?: boolean; outside?: boolean; grabControl?: string | null } = {}) {
    const g = this.g,
      fx = this.fx,
      p = a.player,
      b = a.boss;
    g.clear();
    fx.clear();
    const outside = Boolean(options.outside);
    this.bgDecor.setVisible(!outside);
    const hurtAge = a.lastHurt ? a.elapsed - a.lastHurt.at : Infinity,
      hitAge = a.lastBossHit ? a.elapsed - a.lastBossHit.at : Infinity;

    this.playerDamage.setVisible(!outside && hurtAge < F5.feedbackTime);
    this.bossDamage.setVisible(!outside && hitAge < F5.feedbackTime);
    if (a.lastHurt && hurtAge < F5.feedbackTime) {
      this.playerDamage.setText(`−${a.lastHurt.damage}`).setPosition(p.centerX, vy(p.feetY) - C.playerH - 20 - hurtAge * 35).setAlpha(1 - hurtAge / F5.feedbackTime);
    }
    if (a.lastBossHit && hitAge < F5.feedbackTime) {
      this.bossDamage.setText(`−${a.lastBossHit.damage}`).setPosition(b.x, VISUAL_GROUND_Y - F5.bossH - 24 - hitAge * 35).setAlpha(1 - hitAge / F5.feedbackTime);
    }
    if (this.background && this.background.scene.textures.exists(outside ? FINAL_ART.escape.key : FINAL_ART.background.key)) {
      this.background.setTexture(outside ? FINAL_ART.escape.key : FINAL_ART.background.key).setDisplaySize(C.width, C.height);
    }
    this.boss?.setVisible(!outside);
    this.cart?.setVisible(!outside);

    // Outdoor celebration terrace
    if (outside) {
      if (this.hero) renderPhoe(this.hero, { ...p, centerX: 1060, feetY: 594, vx: 0, grounded: true, control: 'FREE', holding: false, facing: 1 }, a.elapsed);
      return;
    }

    // Universal walkable flagstone baseline at VISUAL_GROUND_Y = 576px
    g.lineStyle(2, 0xcfb37b, 0.6).lineBetween(0, VISUAL_GROUND_Y, C.width, VISUAL_GROUND_Y);

    // Ancient Palace Stone refill clusters per core design system
    for (const x of F5.refillX) {
      g.fillStyle(0x302b20, 0.5).fillEllipse(x, VISUAL_GROUND_Y + 2, 82, 13);
      for (let i = 0; i < 5; i++) {
        const sx = x - 27 + i * 13,
          sy = VISUAL_GROUND_Y - 5 - (i % 2) * 6;
        g.fillStyle(0x8d8c76).fillEllipse(sx, sy, 19, 13);
        g.lineStyle(1, 0xc6c09c, 0.6).strokeEllipse(sx, sy, 19, 13);
      }
    }

    // Heavy gold cart with ground shadow
    g.fillStyle(0x181b10, 0.45).fillEllipse(a.cart.x, VISUAL_GROUND_Y + 3, F5.cartW + 10, 12);
    if (this.cart) {
      this.cart.setPosition(a.cart.x, VISUAL_GROUND_Y);
    } else {
      g.fillStyle(0x735134).fillRect(a.cart.x - F5.cartW / 2, VISUAL_GROUND_Y - F5.cartH, F5.cartW, F5.cartH - 12);
      g.fillStyle(0x25271e).fillCircle(a.cart.x - 35, VISUAL_GROUND_Y - 8, 10).fillCircle(a.cart.x + 35, VISUAL_GROUND_Y - 8, 10);
    }
    if (options.reveal) {
      g.fillStyle(0x716d5d).fillEllipse(a.cart.x + 10, VISUAL_GROUND_Y - F5.cartH + 7, 27, 12);
      g.lineStyle(2, 0xd6ad58).strokeEllipse(a.cart.x + 10, VISUAL_GROUND_Y - F5.cartH + 7, 27, 12);
    }

    // U Gyi boss rendering
    const pose =
      b.phase === 'DOWN'
        ? 'defeated'
        : b.hitLeft > 0
        ? 'hit'
        : b.phase === 'SLAM_WINDUP'
        ? 'slam_windup'
        : b.phase === 'SLAM'
        ? 'slam_strike'
        : b.phase === 'RUSH' || b.phase === 'RUSH_WINDUP'
        ? 'rush'
        : b.phase === 'CART_WINDUP'
        ? 'push'
        : b.phase === 'RECOVER' || b.phase === 'STUN'
        ? 'recover'
        : 'guard';

    if (this.boss) {
      const frame = UGYI_FRAMES[pose] ?? UGYI_FRAMES.guard!;
      const offset = (0.5 - frame.anchor) * frame.w * UGYI_SOURCE_SCALE * (b.facing < 0 ? 1 : -1);
      this.boss.setTexture(FINAL_ART.ugyi.key, pose).setPosition(b.x + offset, VISUAL_GROUND_Y).setScale(UGYI_SOURCE_SCALE).setFlipX(b.facing > 0);
      if (b.hitLeft > 0) this.boss.setTintFill(0xffe4a3);
      else if (b.blockLeft > 0) this.boss.setTint(0xe5d2a0);
      else this.boss.clearTint();
    } else {
      g.fillStyle(0xb28a4a).fillRoundedRect(b.x - 26, VISUAL_GROUND_Y - 100, 52, 100, 8);
      g.fillStyle(0xcbae7a).fillCircle(b.x, VISUAL_GROUND_Y - 108, 17);
    }

    // Phoe Htaung rendering & ground shadow
    const visualFeetY = vy(p.feetY);
    const direction = a.charge > 0 ? a.aimFacing : p.facing;
    const heroControl = (options.grabControl || (options.bag ? 'RUMMAGE' : a.status === 'FAILED' ? 'DEAD' : a.dodgeLeft > 0 ? 'LAYING' : p.control)) as any;
    if (this.hero) {
      renderPhoe(
        this.hero,
        {
          ...p,
          feetY: visualFeetY,
          facing: direction,
          holding: a.weapon === 'SLING' && !options.grabControl,
          control: heroControl,
          pushing: (p.pushing || a.punchLeft > F5.punchCooldown - 0.12) && !options.grabControl,
        },
        a.elapsed
      );
      if (a.staggerLeft > 0) this.hero.setTintFill(0xffb9a3);
      else this.hero.clearTint();
    }
    g.fillStyle(0x152014, 0.4).fillEllipse(p.centerX, visualFeetY + 1, 38, 9);
    g.lineStyle(2, 0xeacb8d, 0.7).strokeEllipse(p.centerX, visualFeetY + 1, 40, 10);

    // Slingshot pull/aim cord
    if (a.weapon === 'SLING' && !options.bag && !options.grabControl && a.dodgeLeft <= 0) {
      const dir = a.charge > 0 ? a.aimFacing : p.facing,
        x = p.centerX + dir * 25,
        y = visualFeetY - 47,
        pull = (a.charge / F5.chargeTime) * 22;
      fx.lineStyle(5, 0x513a23).lineBetween(x, y + 13, x, y - 2).lineBetween(x, y - 2, x - 9, y - 15).lineBetween(x, y - 2, x + 9, y - 15);
      fx.lineStyle(2, 0xe5c080).lineBetween(x - 9, y - 15, x - dir * pull, y - 7).lineBetween(x + 9, y - 15, x - dir * pull, y - 7);
    }

    // Bare fist kinetic strike arcs
    if (a.punchLeft > F5.punchCooldown - F5.punchVisualTime) {
      const dir = p.facing,
        x = p.centerX + dir * 22,
        y = visualFeetY - 35;
      fx.lineStyle(4, 0xffe5ad, a.punchLeft / F5.punchCooldown).lineBetween(x, y + 9, x + dir * 27, y - 4).lineBetween(x + dir * 27, y - 4, x + dir * 44, y + 2);
    }

    // Red hurt vignette
    if (hurtAge < 0.3) {
      fx.lineStyle(12, 0xcd352c, 0.35 * (1 - hurtAge / 0.3)).strokeRect(6, 6, C.width - 12, C.height - 12);
    }

    // Projectile stones
    for (const s of a.shots) {
      const sy = vy(s.y);
      fx.lineStyle(3, 0xefc77f, 0.7).lineBetween(s.x, sy, s.x - s.vx * 0.025, sy - s.vy * 0.025);
      fx.fillStyle(0x716f5f).fillCircle(s.x, sy, 5);
      fx.lineStyle(2, 0xffe4a0).strokeCircle(s.x, sy, 6);
    }

    // Boss forward guard line
    if (finalGuarded(a) && b.hp > 0) {
      const x = b.x + b.facing * 30;
      fx.lineStyle(4, b.blockLeft > 0 ? 0xffffff : 0xe4c178, 0.85).lineBetween(x, VISUAL_GROUND_Y - F5.bossH, x, VISUAL_GROUND_Y - 12);
    }

    // Boss overhead slam telegraph & strike impact
    if (b.phase === 'SLAM_WINDUP' || b.phase === 'SLAM') {
      const r = finalSlamArea(a);
      const ry = vy(r.y);
      g.fillStyle(0xe7a34c, b.phase === 'SLAM' ? 0.45 : 0.16).fillRect(r.x, ry, r.w, r.h);
      g.lineStyle(3, 0xffc773).strokeRect(r.x, ry, r.w, r.h);
    }

    // Boss rush telegraph
    if (b.phase === 'RUSH_WINDUP') {
      const left = Math.min(b.startX, b.targetX),
        width = Math.abs(b.targetX - b.startX);
      g.fillStyle(0xe6b16b, 0.15).fillRect(left, VISUAL_GROUND_Y - F5.bossH, width, F5.bossH);
      g.lineStyle(3, 0xffd08a).lineBetween(b.x, VISUAL_GROUND_Y - 20, b.targetX, VISUAL_GROUND_Y - 20);
    }

    // Cart rolling / windup kinetic vector
    if (b.phase === 'CART_WINDUP' || a.cart.mode === 'ROLLING') {
      const dir = b.phase === 'CART_WINDUP' ? b.facing : Math.sign(a.cart.vx),
        x = a.cart.x + dir * 90;
      g.lineStyle(4, 0xffb76e, 0.9).lineBetween(a.cart.x, VISUAL_GROUND_Y - 20, x, VISUAL_GROUND_Y - 20).lineBetween(x - dir * 14, VISUAL_GROUND_Y - 30, x, VISUAL_GROUND_Y - 20).lineBetween(x - dir * 14, VISUAL_GROUND_Y - 10, x, VISUAL_GROUND_Y - 20);
    }

    // Boss hit impact spark bursts
    if (b.hitLeft > 0) {
      const r = 26 + (1 - b.hitLeft / F5.hitFlash) * 22;
      fx.lineStyle(3, 0xffdf98, b.hitLeft / F5.hitFlash);
      for (let i = 0; i < 6; i++) {
        const t = (i * Math.PI) / 3;
        fx.lineBetween(b.x + Math.cos(t) * r, VISUAL_GROUND_Y - 50 + Math.sin(t) * r, b.x + Math.cos(t) * (r + 12), VISUAL_GROUND_Y - 50 + Math.sin(t) * (r + 12));
      }
    }

    // Exit Gate
    const gateTopY = vy(360);
    const gateH = VISUAL_GROUND_Y - gateTopY;
    if (a.status !== 'SAFE_EXIT' && a.status !== 'COMPLETE') {
      g.fillStyle(0x28241a, 0.85).fillRect(F5.exitGateX, gateTopY, C.width - F5.exitGateX, gateH);
      g.lineStyle(5, 0xb29963).lineBetween(F5.exitGateX + 4, vy(435), 1276, vy(435)).lineBetween(F5.exitGateX + 4, vy(558), 1276, vy(558));
    } else {
      g.fillStyle(0xf4d382, 0.15).fillRect(F5.exitGateX, gateTopY, 68, gateH);
      fx.lineStyle(4, 0xffe0a0).lineBetween(1218, vy(555), 1265, vy(555)).lineBetween(1250, vy(542), 1265, vy(555)).lineBetween(1250, vy(568), 1265, vy(555));
    }
  }
}
