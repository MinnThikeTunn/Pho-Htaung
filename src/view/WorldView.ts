import Phaser from 'phaser';
import { C, GATE, PLATE, SHELF, STEP, liftRect, CH2_POLE_SPAWN, CH2_COG_SPAWN, CH2_GEARBOX_RECT, PLATFORM_MID, PLATFORM_HIGH, CH2_SLINGSHOT_SPAWN, CH2_TRAP_RANGE } from '../content/chapter1';
import { preview, stoneRect } from '../domain/step';
import type { Attempt, Rect } from '../domain/types';
import { createPhoe, renderPhoe } from './PhoeHtaungView';

const INK = 0x182720, CREAM = 0xe9dfbd, GOLD = 0xe7bb55, METAL = 0x839b8b, WOOD = 0x9d7047;

// Universal Walkable Baseline: groundY = height * 0.80 = 576px on 1280x720 canvas
// Sourced from Chapter 1 as the single authoritative visual baseline.
const VISUAL_GROUND_Y = 576;
const DY = VISUAL_GROUND_Y - C.floor; // 576 - 640 = -64px visual shift
const vy = (y: number): number => y + DY;
const vr = (r: Rect): Rect => ({ ...r, y: r.y + DY });

export class WorldView {
  private g: Phaser.GameObjects.Graphics;
  private actor: Phaser.GameObjects.Image | null = null;
  private clock = 0;
  private shookAttempt = '';


  constructor(private scene: Phaser.Scene) {
    if (scene.textures.exists('background')) {
      scene.add.image(640, 360, 'background').setDisplaySize(1280, 720).setAlpha(0.82);
    } else {
      scene.add.rectangle(640, 360, 1280, 720, 0x263b32);
    }
    this.g = scene.add.graphics().setDepth(10);
    this.actor = createPhoe(scene);
  }

  private block(r: Rect, fill: number, wood = false) {
    const g = this.g;
    g.fillStyle(INK, 1).fillRoundedRect(r.x - 2, r.y - 2, r.w + 4, r.h + 4, 3);
    g.fillStyle(fill).fillRect(r.x, r.y, r.w, r.h);
    g.fillStyle(CREAM, .16).fillRect(r.x + 2, r.y + 2, r.w - 4, Math.min(5, r.h - 2));
    g.lineStyle(2, INK, .45);
    if (wood) {
      for (let x = r.x + 16; x < r.x + r.w; x += 20) g.lineBetween(x, r.y, x, r.y + r.h);
      if (r.h > 30) {
        g.fillStyle(0x4c4432).fillRect(r.x - 2, r.y + 28, r.w + 4, 8).fillRect(r.x - 2, r.y + r.h - 36, r.w + 4, 8);
        for (const y of [r.y + 32, r.y + r.h - 32]) for (const x of [r.x + 7, r.x + r.w - 7]) g.fillStyle(GOLD).fillCircle(x, y, 2);
      }
    } else if (r.h > 30) {
      g.lineBetween(r.x + r.w * .32, r.y + 18, r.x + r.w * .6, r.y + 23);
      g.lineBetween(r.x + r.w * .6, r.y + 23, r.x + r.w * .52, r.y + 38);
    }
  }

  render(a: Attempt, delta = 0, debug = false, shake = true) {
    this.clock += delta;
    const g = this.g; g.clear();
    const p = a.player, aim = preview(a), m = a.machine;

    // Fixed visual rail shifted to preserve head clearance and line with trolley
    g.fillStyle(INK).fillRect(0, vy(83), 1280, 22);
    g.fillStyle(0x667462).fillRect(0, vy(84), 1280, 6);
    for (let x = 32; x < 1280; x += 60) g.fillStyle(0xb7b790).fillCircle(x, vy(95), 2);
    const trolleyX = m.state === 'READY' ? Math.max(64, Math.min(1168, p.centerX)) : m.targetX;
    this.block(vr({ id: 'trolley', x: trolleyX - 42, y: 72, w: 84, h: 38 }), 0x596e60);
    g.fillStyle(GOLD).fillCircle(trolleyX - 24, vy(91), 7).fillCircle(trolleyX + 24, vy(91), 7);
    g.lineStyle(3, GOLD, .7).lineBetween(trolleyX, vy(111), trolleyX, vy(128));

    // Lift chain, linked visibly to the pressure plate
    g.lineStyle(2, GOLD, .4).lineBetween(400, vy(636), 400, vy(690)).lineBetween(400, vy(690), 704, vy(690)).lineBetween(704, vy(690), 704, vy(a.liftY + 16));
    for (const x of [648, 760]) for (let y = 115; y < a.liftY; y += 14) g.lineStyle(2, 0x8c9674, .6).strokeRoundedRect(x - 3, vy(y), 6, 10, 3);

    // Universal Walkable Baseline: groundY = 576px, subterranean height = 144px (down to 720px)
    this.block({ id: 'ground', x: 0, y: VISUAL_GROUND_Y, w: 1280, h: 144 }, 0x3b4b3d);
    g.fillStyle(0x8e9470).fillRect(0, VISUAL_GROUND_Y, 1280, 8);
    for (let x = 0; x < 1280; x += 92) g.lineStyle(1, 0x172820, .5).lineBetween(x, VISUAL_GROUND_Y + 10, x + 12, 720);

    this.block(vr(STEP), 0x6e7c66);
    this.block(vr(liftRect(a.liftY)), METAL);
    g.fillStyle(a.plateWeighted ? GOLD : 0x556d58).fillRoundedRect(PLATE.x, vy(PLATE.y), PLATE.w, PLATE.h, 3);
    g.lineStyle(2, GOLD, .7).strokeRect(PLATE.x, vy(PLATE.y), PLATE.w, PLATE.h);
    if (a.shelfIntact) this.block(vr(SHELF), WOOD, true);
    if (a.gateIntact) this.block(vr(GATE), WOOD, true);
    if (a.platformsRevealed) {
      this.block(vr(PLATFORM_MID), WOOD, true);
      this.block(vr(PLATFORM_HIGH), WOOD, true);
    }

    // The exit remains visible even while the breakable gate blocks the lower route
    g.fillStyle(0xb8b782, .09).fillRoundedRect(1214, vy(440), 64, 200, 25);
    for (let i = 0; i < 5; i++) g.fillStyle(i % 2 ? 0xb0b082 : 0x8a9a79, .6).fillRect(1220 + i * 9, vy(632) - i * 8, 60 - i * 9, 8 + i * 8);
    g.lineStyle(3, GOLD, .7).lineBetween(1230, vy(554), 1261, vy(554)).lineBetween(1252, vy(545), 1261, vy(554)).lineBetween(1252, vy(563), 1261, vy(554));
    g.fillStyle(0x343c2d).fillRect(0, vy(360), 24, 280);

    for (const pickup of a.pickups) {
      if (pickup.collected) continue;
      const bob = pickup.id === 'gold_pouch' && !a.shelfIntact ? 0 : Math.sin(this.clock * 3 + pickup.x) * 2;
      const x = pickup.x, y = vy(pickup.y) + bob;
      g.fillStyle(GOLD, .1).fillCircle(x, y, pickup.size * 1.2);
      if (pickup.value === 10) {
        g.fillStyle(0xbb8a43).fillEllipse(x, y + 1, 23, 22);
        g.lineStyle(2, 0xffd878).strokeEllipse(x, y + 1, 23, 22);
        g.fillStyle(GOLD).fillTriangle(x - 7, y - 12, x + 7, y - 12, x, y - 3);
      } else {
        g.fillStyle(0x9b6b2e).fillCircle(x, y, 10);
        g.fillStyle(GOLD).fillCircle(x, y - 1, 8);
        g.lineStyle(2, 0xffedb7).lineBetween(x, y - 5, x, y + 3);
      }
    }
    for (const stone of a.stones) {
      const r = vr(stoneRect(stone)), falling = stone.state === 'FALLING';
      this.block(r, falling ? 0x909a7a : 0x8b977b);
      g.lineStyle(falling ? 3 : 1, falling ? 0xf2a967 : 0xd8d6a4, .85).strokeRoundedRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2, 2);
      if (falling) for (let i = 0; i < 3; i++) g.lineStyle(2, 0xefc58b, .5).lineBetween(r.x + 15 + i * 30, r.y - 26, r.x + 15 + i * 30, r.y - 8);
    }
    // Pickup outlines are above occluding rocks and remain until actually collected.
    for (const pickup of a.pickups) if (!pickup.collected && a.stones.some(s => Math.abs(s.centerX - pickup.x) < 60 && Math.abs(s.bottomY - pickup.y) < 100)) {
      const bob = pickup.id === 'gold_pouch' && !a.shelfIntact ? 0 : Math.sin(this.clock * 3 + pickup.x) * 2;
      g.lineStyle(2, GOLD, .95).strokeCircle(pickup.x, vy(pickup.y) + bob, pickup.size / 2 + 3);
    }

    // Door Gear Box
    const gb = vr(CH2_GEARBOX_RECT);
    this.block(gb, METAL);
    g.fillStyle(GOLD).fillCircle(gb.x + gb.w / 2, gb.y + gb.h / 2, 14);
    g.fillStyle(INK).fillCircle(gb.x + gb.w / 2, gb.y + gb.h / 2, 4);
    for (let i = 0; i < 8; i++) {
      const ang = (i * Math.PI) / 4 + (a.gearBoxActive ? this.clock * 2 : 0);
      g.fillStyle(GOLD).fillCircle(gb.x + gb.w / 2 + Math.cos(ang) * 14, gb.y + gb.h / 2 + Math.sin(ang) * 14, 3);
    }

    // 40s Beehive Hazard (Image 2)
    if (a.beehiveTriggered && a.beehiveY < C.floor) {
      const bhY = vy(a.beehiveY);
      g.fillStyle(0xd4a017).fillEllipse(a.beehiveX, bhY, 28, 34);
      g.lineStyle(2, INK, 0.9).strokeEllipse(a.beehiveX, bhY, 28, 34);
      g.fillStyle(INK).fillCircle(a.beehiveX, bhY + 6, 4);
      for (let i = 0; i < 4; i++) {
        const bx = a.beehiveX + Math.sin(this.clock * 12 + i) * 16;
        const by = bhY + Math.cos(this.clock * 12 + i) * 12;
        g.fillStyle(INK).fillCircle(bx, by, 2);
        g.fillStyle(0xffe066).fillCircle(bx + 1, by, 1);
      }
    }

    // Die Again Surprise Floor Trap (Image 3 - Red Hatched Area)
    if (!a.trapFloorOpen) {
      g.lineStyle(1, INK, 0.55);
      g.lineBetween(1158, VISUAL_GROUND_Y + 1, 1172, VISUAL_GROUND_Y + 7);
      g.lineBetween(1172, VISUAL_GROUND_Y + 7, 1188, VISUAL_GROUND_Y + 3);
      g.lineBetween(1188, VISUAL_GROUND_Y + 3, 1212, VISUAL_GROUND_Y + 8);
    } else {
      g.fillStyle(0x141f19).fillRect(1150, VISUAL_GROUND_Y, 70, 720 - VISUAL_GROUND_Y);
      for (let sx = 1154; sx <= 1214; sx += 12) {
        g.fillStyle(0x839b8b).fillTriangle(sx, 710, sx + 10, 710, sx + 5, 680);
        g.lineStyle(1, INK).strokeTriangle(sx, 710, sx + 10, 710, sx + 5, 680);
      }
    }
    g.fillStyle(0x07140d, .22).fillEllipse(p.centerX, vy(p.feetY) + 1, 43, 9);
    if (this.actor) {
      renderPhoe(this.actor, { ...p, feetY: vy(p.feetY), holding: Boolean((this.scene as any).heldItemSprite), control: p.control }, this.clock);
    } else {
      g.fillStyle(0xdbc6a1).fillCircle(p.centerX, vy(p.feetY) - 52, 13);
      g.fillStyle(0xafa77e).fillRect(p.centerX - 12, vy(p.feetY) - 41, 24, 26);
      g.fillStyle(0x4e6b4f).fillTriangle(p.centerX - 15, vy(p.feetY) - 15, p.centerX + 15, vy(p.feetY) - 15, p.centerX + 10, vy(p.feetY));
    }
    if (debug) {
      g.lineStyle(1, 0x75ffff).strokeRect(p.centerX - 18, vy(p.feetY) - 56, 36, 56);
      for (const r of [STEP, liftRect(a.liftY), ...a.stones.map(stoneRect)]) g.strokeRect(r.x, vy(r.y), r.w, r.h);
    }
    if (a.events.some(e => e.kind === 'death') && this.shookAttempt !== a.id) { this.shookAttempt = a.id; if(shake) this.scene.cameras.main.shake(150, .003); }
  }
}
