import Phaser from 'phaser';
import { C, GATE, GROUND, PLATE, SHELF, STEP, liftRect } from '../content/chapter1';
import { preview, stoneRect } from '../domain/step';
import type { Attempt, Rect } from '../domain/types';
import { createPhoe,renderPhoe } from './PhoeHtaungView';

const INK = 0x182720, CREAM = 0xe9dfbd, GOLD = 0xe7bb55, METAL = 0x839b8b, WOOD = 0x9d7047;
export class WorldView {
  private g: Phaser.GameObjects.Graphics;
  private actor: Phaser.GameObjects.Image | null = null;
  private clock = 0;
  private shookAttempt = '';
  private weights = new Map<string, Phaser.GameObjects.Text>();
  constructor(private scene: Phaser.Scene) {
    if (scene.textures.exists('background')) scene.add.image(640, 360, 'background').setDisplaySize(1280, 720).setAlpha(.82);
    else scene.add.rectangle(640, 360, 1280, 720, 0x263b32);
    this.g = scene.add.graphics().setDepth(10);
    this.actor=createPhoe(scene);
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
    // A fixed visual rail. No ceiling collision is attached to it.
    g.fillStyle(INK).fillRect(18, 83, 1244, 22);
    g.fillStyle(0x667462).fillRect(18, 84, 1244, 6);
    for (let x = 32; x < 1260; x += 60) g.fillStyle(0xb7b790).fillCircle(x, 95, 2);
    const trolleyX = m.state === 'READY' ? Math.max(64, Math.min(1168, p.centerX)) : m.targetX;
    this.block({ id: 'trolley', x: trolleyX - 42, y: 72, w: 84, h: 38 }, 0x596e60);
    g.fillStyle(GOLD).fillCircle(trolleyX - 24, 91, 7).fillCircle(trolleyX + 24, 91, 7);
    g.lineStyle(3, GOLD, .7).lineBetween(trolleyX, 111, trolleyX, 128);
    // Lift chain, linked visibly to the pressure plate.
    g.lineStyle(2, GOLD, .4).lineBetween(400, 636, 400, 690).lineBetween(400, 690, 704, 690).lineBetween(704, 690, 704, a.liftY + 16);
    for (const x of [648, 760]) for (let y = 115; y < a.liftY; y += 14) g.lineStyle(2, 0x8c9674, .6).strokeRoundedRect(x - 3, y, 6, 10, 3);
    this.block(GROUND, 0x3b4b3d);
    g.fillStyle(0x8e9470).fillRect(0, 640, 1280, 8);
    for (let x = 0; x < 1280; x += 92) g.lineStyle(1, 0x172820, .5).lineBetween(x, 650, x + 12, 720);
    this.block(STEP, 0x6e7c66);
    this.block(liftRect(a.liftY), METAL);
    g.fillStyle(a.plateWeighted ? GOLD : 0x556d58).fillRoundedRect(PLATE.x, PLATE.y, PLATE.w, PLATE.h, 3);
    g.lineStyle(2, GOLD, .7).strokeRect(PLATE.x, PLATE.y, PLATE.w, PLATE.h);
    if (a.shelfIntact) this.block(SHELF, WOOD, true);
    if (a.gateIntact) this.block(GATE, WOOD, true);
    // The exit remains visible even while the breakable gate blocks the lower route.
    g.fillStyle(0xb8b782, .09).fillRoundedRect(1214, 440, 64, 200, 25);
    for (let i = 0; i < 5; i++) g.fillStyle(i % 2 ? 0xb0b082 : 0x8a9a79, .6).fillRect(1220 + i * 9, 632 - i * 8, 60 - i * 9, 8 + i * 8);
    g.lineStyle(3, GOLD, .7).lineBetween(1230, 554, 1261, 554).lineBetween(1252, 545, 1261, 554).lineBetween(1252, 563, 1261, 554);
    g.fillStyle(0x343c2d).fillRect(0, 360, 24, 280);
    for (const pickup of a.pickups) {
      if (pickup.collected) continue;
      const bob = pickup.id === 'gold_pouch' && !a.shelfIntact ? 0 : Math.sin(this.clock * 3 + pickup.x) * 2;
      const x = pickup.x, y = pickup.y + bob;
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
      const r = stoneRect(stone), falling = stone.state === 'FALLING';
      this.block(r, falling ? 0x909a7a : 0x8b977b);
      g.lineStyle(falling ? 3 : 1, falling ? 0xf2a967 : 0xd8d6a4, .85).strokeRoundedRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2, 2);
      if (falling) for (let i = 0; i < 3; i++) g.lineStyle(2, 0xefc58b, .5).lineBetween(r.x + 15 + i * 30, r.y - 26, r.x + 15 + i * 30, r.y - 8);
      g.fillStyle(INK, .65).fillRoundedRect(r.x + 28, r.y + 57, 40, 20, 4);
      let label = this.weights.get(stone.id);
      if (!label) { label = this.scene.add.text(0,0,'50kg',{fontFamily:'sans-serif',fontSize:'12px',color:'#e9dfbd'}).setOrigin(.5).setDepth(12); this.weights.set(stone.id,label); }
      label.setPosition(stone.centerX,r.y+67);
    }
    for (const [id,label] of this.weights) if (!a.stones.some(s=>s.id===id)) { label.destroy(); this.weights.delete(id); }
    // Pickup outlines are above occluding rocks and remain until actually collected.
    for (const pickup of a.pickups) if (!pickup.collected && a.stones.some(s => Math.abs(s.centerX - pickup.x) < 60 && Math.abs(s.bottomY - pickup.y) < 100)) {
      g.lineStyle(2, GOLD, .95).strokeCircle(pickup.x, pickup.y, pickup.size / 2 + 3);
    }
    if (m.state === 'TRACK' || m.state === 'LOCKED') {
      const locked = m.state === 'LOCKED', color = locked ? 0xf6a064 : GOLD;
      g.lineStyle(locked ? 3 : 2, color, locked ? .95 : .7);
      const first = aim.surfaces[0]?.y ?? 640;
      for (const x of [aim.x - 48, aim.x + 48]) for (let y = 130; y < first; y += 18) g.lineBetween(x, y, x, Math.min(first, y + (locked ? 18 : 8)));
      for (const [i, surface] of aim.surfaces.entries()) {
        if (i === 0) {
          g.fillStyle(color, .13).fillRect(aim.x - 48, surface.y - 5, 96, 10);
          g.lineStyle(locked ? 4 : 2, color, .95).lineBetween(aim.x - 48, surface.y - 2, aim.x + 48, surface.y - 2);
        } else {
          const before = aim.surfaces[i - 1]!.y;
          for (let y = before + 8; y < surface.y; y += 16) g.fillStyle(color, .6).fillCircle(aim.x, y, 2);
          g.lineStyle(1, color, .55).lineBetween(aim.x - 48, surface.y - 2, aim.x + 48, surface.y - 2);
        }
        if (surface.shatter) g.lineStyle(3, color).lineBetween(aim.x - 7, surface.y - 30, aim.x + 3, surface.y - 23).lineBetween(aim.x + 3, surface.y - 23, aim.x - 3, surface.y - 15);
      }
      g.fillStyle(color).fillTriangle(aim.x - 7, 133, aim.x + 7, 133, aim.x, 143);
    }
    g.fillStyle(0x07140d, .22).fillEllipse(p.centerX, p.feetY + 1, 43, 9);
    if (this.actor) {
      renderPhoe(this.actor,p,this.clock);
    } else {
      g.fillStyle(0xdbc6a1).fillCircle(p.centerX, p.feetY - 52, 13);
      g.fillStyle(0xafa77e).fillRect(p.centerX - 12, p.feetY - 41, 24, 26);
      g.fillStyle(0x4e6b4f).fillTriangle(p.centerX - 15, p.feetY - 15, p.centerX + 15, p.feetY - 15, p.centerX + 10, p.feetY);
    }
    if (debug) {
      g.lineStyle(1, 0x75ffff).strokeRect(p.centerX - 18, p.feetY - 56, 36, 56);
      for (const r of [STEP, liftRect(a.liftY), ...a.stones.map(stoneRect)]) g.strokeRect(r.x, r.y, r.w, r.h);
    }
    if (a.events.some(e => e.kind === 'death') && this.shookAttempt !== a.id) { this.shookAttempt = a.id; if(shake) this.scene.cameras.main.shake(150, .003); }
  }
}
