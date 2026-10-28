import Phaser from 'phaser';
import { A4, APE_FRAMES, ARENA_ART } from '../content/chapter4';
import { C } from '../content/chapter1';
import type { ArenaAttempt, Ape } from '../domain/arena';
import { createPhoe, renderPhoe } from './PhoeHtaungView';

export class ArenaView {
  private g: Phaser.GameObjects.Graphics;
  private fx: Phaser.GameObjects.Graphics;
  private actor: ReturnType<typeof createPhoe>;
  private apes = new Map<string, Phaser.GameObjects.Image>();
  constructor(scene: Phaser.Scene) {
    const key = scene.textures.exists(ARENA_ART.background.key) ? ARENA_ART.background.key : 'scale_chamber_v1';
    if (scene.textures.exists(key)) scene.add.image(640, 360, key).setDisplaySize(C.width, C.height);
    else scene.add.rectangle(640, 360, C.width, C.height, 0x29392e);
    this.g = scene.add.graphics().setDepth(12); this.fx = scene.add.graphics().setDepth(30); this.actor = createPhoe(scene, 20);
    if (scene.textures.exists(ARENA_ART.apes.key)) {
      const texture = scene.textures.get(ARENA_ART.apes.key);
      for (const [id, rect] of Object.entries(APE_FRAMES)) if (!texture.has(id)) texture.add(id, 0, rect.x, rect.y, rect.w, rect.h);
      for (const id of ['brown', 'silver']) if (texture.has(`${id}_idle`)) this.apes.set(id, scene.add.image(0, C.floor, ARENA_ART.apes.key, `${id}_idle`).setOrigin(.5, 1).setDepth(18));
    }
  }
  private enemy(a: ArenaAttempt, e: Ape) {
    const g = this.g, actor = this.apes.get(e.id);
    const pose = e.phase === 'WINDUP' ? 'windup' : e.phase === 'STRIKE' ? 'strike' : ['RECOVER', 'STUN', 'DOWN'].includes(e.phase) ? 'recover' : 'idle';
    if (actor) {
      const frame = APE_FRAMES[`${e.id}_${pose}`]!;
      // Keep torso/feet anchored when the long punching arm changes frame bounds.
      const offset = (.5 - frame.anchor) * frame.w * .4 * (e.facing < 0 ? 1 : -1);
      actor.setTexture(ARENA_ART.apes.key, `${e.id}_${pose}`).setPosition(e.x + offset, C.floor);
      actor.setScale(.4, e.hp > 0 ? .4 : .16).setFlipX(e.facing > 0).setAlpha(e.hp > 0 ? 1 : .55);
      if (e.hitLeft > 0) actor.setTintFill(0xffe4a3); else actor.clearTint();
    } else {
      g.fillStyle(e.id === 'brown' ? 0x68503b : 0x899185, e.hp > 0 ? 1 : .4).fillEllipse(e.x, C.floor - 65, 100, e.hp > 0 ? 130 : 45);
    }
    g.fillStyle(0x111b10, .45).fillEllipse(e.x, C.floor + 1, 110, 15);
    if (e.phase === 'WINDUP') {
      const progress = 1 - e.phaseLeft / (e.type === 'MELEE' ? A4.meleeWindup : A4.throwWindup);
      if (e.type === 'MELEE') {
        const x = e.x + e.facing * 54;
        g.fillStyle(0xe0a44c, .12 + progress * .18).fillRect(x - 78, C.floor - 85, 156, 85);
        g.lineStyle(3, 0xffcb77, .9).strokeRect(x - 78, C.floor - 85, 156, 85);
      } else {
        g.lineStyle(2, 0xebbf76, .8).lineBetween(e.x + e.facing * 32, C.floor - 78, e.targetX, e.targetY);
        g.lineStyle(2, 0xffcf7a, .9).strokeCircle(e.targetX, e.targetY, 17);
      }
      g.fillStyle(0xf0c777).fillTriangle(e.x - 6, C.floor - 163, e.x + 6, C.floor - 163, e.x, C.floor - 150);
    }
    if (e.phase === 'STRIKE' && e.type === 'MELEE') g.lineStyle(7, 0xe2b971, .7).strokeEllipse(e.x + e.facing * 54, C.floor - 25, 150, 38);
    if (a.combatWon) actor?.setAlpha(.45);
    if (e.hitLeft > 0) {
      const radius = 22 + (1 - e.hitLeft / A4.hitFlash) * 26;
      this.fx.lineStyle(3, 0xffe1a0, e.hitLeft / A4.hitFlash);
      for (let i = 0; i < 6; i++) {
        const angle = i * Math.PI / 3;
        this.fx.lineBetween(e.x + Math.cos(angle) * radius, C.floor - 65 + Math.sin(angle) * radius,
          e.x + Math.cos(angle) * (radius + 12), C.floor - 65 + Math.sin(angle) * (radius + 12));
      }
    }
  }
  render(a: ArenaAttempt) {
    const g = this.g; g.clear(); this.fx.clear();
    g.lineStyle(2, 0xcfb37b, .6).lineBetween(0, C.floor, C.width, C.floor);
    for (const x of A4.refillX) {
      g.fillStyle(0x302b20, .5).fillEllipse(x, C.floor + 2, 82, 13);
      for (let i = 0; i < 5; i++) {
        const sx = x - 27 + i * 13, y = C.floor - 5 - (i % 2) * 6;
        g.fillStyle(0x8d8c76).fillEllipse(sx, y, 19, 13); g.lineStyle(1, 0xc6c09c, .6).strokeEllipse(sx, y, 19, 13);
      }
    }
    for (const e of a.apes) this.enemy(a, e);
    const p = a.player, direction = a.charge > 0 ? a.aimFacing : p.facing;
    g.fillStyle(0x10190e, .5).fillEllipse(p.centerX, p.feetY + 1, 34, 8);
    g.lineStyle(2, 0xe5c58a, .6).strokeEllipse(p.centerX, p.feetY + 1, 40, 10);
    if (this.actor) {
      renderPhoe(this.actor, { ...p, facing: direction, holding: a.hasSling, control: a.dodgeLeft > 0 ? 'LAYING' : p.control, pushing: a.punchLeft > A4.punchCooldown - .12 }, a.elapsed);
      if (a.staggerLeft > 0) this.actor.setTintFill(0xffb9a3); else this.actor.clearTint();
    }
    if (a.hasSling && a.dodgeLeft <= 0) {
      const x = p.centerX + direction * 25, y = p.feetY - 47, pull = a.charge / A4.chargeTime * 22;
      g.lineStyle(6, 0x292114).lineBetween(x, y + 15, x, y - 3).lineBetween(x, y - 3, x - 9, y - 16).lineBetween(x, y - 3, x + 9, y - 16);
      g.lineStyle(3, 0xaa7643).lineBetween(x, y + 15, x, y - 3).lineBetween(x, y - 3, x - 9, y - 16).lineBetween(x, y - 3, x + 9, y - 16);
      g.lineStyle(1.8, 0xe0c089).lineBetween(x - 9, y - 16, x - direction * pull, y - 8).lineBetween(x + 9, y - 16, x - direction * pull, y - 8);
      if (a.charge > 0) { g.fillStyle(0xc3c2a3).fillCircle(x - direction * pull, y - 8, 4); g.lineStyle(2, 0xf2ce83, .7).lineBetween(x + direction * 16, y - 8, x + direction * 70, y - 8); }
    }
    for (const shot of a.shots) {
      g.lineStyle(2, shot.owner === 'PHOE' ? 0xe7ca83 : 0xd9975d, .5).lineBetween(shot.x, shot.y, shot.x - shot.vx * .025, shot.y - shot.vy * .025);
      g.fillStyle(0x24271c).fillCircle(shot.x, shot.y, shot.owner === 'PHOE' ? 5 : 6);
      g.fillStyle(shot.owner === 'PHOE' ? 0xc7c1a2 : 0x938e77).fillCircle(shot.x - 1, shot.y - 1, shot.owner === 'PHOE' ? 3 : 4);
      this.fx.lineStyle(2, shot.owner === 'PHOE' ? 0xffe0a0 : 0xf3ac80, .95).strokeCircle(shot.x, shot.y, 6);
    }
    if (a.combatWon) {
      g.fillStyle(0xd8b362, .15).fillRect(1206, 430, 74, 210);
      g.lineStyle(4, 0xf0ce7a).lineBetween(1220, 565, 1260, 565).lineBetween(1248, 552, 1260, 565).lineBetween(1248, 578, 1260, 565);
    }
  }
}
