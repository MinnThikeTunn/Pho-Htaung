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
  private staticG: Phaser.GameObjects.Graphics;
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
    this.staticG = scene.add.graphics().setDepth(9);
    this.g = scene.add.graphics().setDepth(10);
    this.actor = createPhoe(scene);
    this.drawStaticGeometry();
  }

  private block(r: Rect, fill: number, wood = false, target: Phaser.GameObjects.Graphics = this.g) {
    const g = target;
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

  private drawStaticGeometry() {
    const sg = this.staticG;

    // Fixed visual rail shifted to preserve head clearance and line with trolley
    sg.fillStyle(INK).fillRect(0, vy(83), 1280, 22);
    sg.fillStyle(0x667462).fillRect(0, vy(84), 1280, 6);
    for (let x = 32; x < 1280; x += 60) sg.fillStyle(0xb7b790).fillCircle(x, vy(95), 2);

    // Universal Walkable Baseline: groundY = 576px, subterranean height = 144px (down to 720px)
    this.block({ id: 'ground', x: 0, y: VISUAL_GROUND_Y, w: 1280, h: 144 }, 0x3b4b3d, false, sg);
    sg.fillStyle(0x8e9470).fillRect(0, VISUAL_GROUND_Y, 1280, 8);
    for (let x = 0; x < 1280; x += 92) sg.lineStyle(1, 0x172820, .5).lineBetween(x, VISUAL_GROUND_Y + 10, x + 12, 720);

    // Fixed stone fixtures (STEP)
    this.block(vr(STEP), 0x6e7c66, false, sg);

    // The exit remains visible even while the breakable gate blocks the lower route
    sg.fillStyle(0xb8b782, .09).fillRoundedRect(1214, vy(440), 64, 200, 25);
    for (let i = 0; i < 5; i++) sg.fillStyle(i % 2 ? 0xb0b082 : 0x8a9a79, .6).fillRect(1220 + i * 9, vy(632) - i * 8, 60 - i * 9, 8 + i * 8);
    sg.lineStyle(3, GOLD, .7).lineBetween(1230, vy(554), 1261, vy(554)).lineBetween(1252, vy(545), 1261, vy(554)).lineBetween(1252, vy(563), 1261, vy(554));
    sg.fillStyle(0x343c2d).fillRect(0, vy(360), 24, 280);
  }

  render(a: Attempt, delta = 0, debug = false, shake = true) {
    this.clock += delta;
    const g = this.g; g.clear();
    const p = a.player, aim = preview(a), m = a.machine;

    const trolleyX = m.state === 'READY' ? Math.max(C.aimMin, Math.min(C.aimMax, p.centerX)) : m.targetX;
    this.block(vr({ id: 'trolley', x: trolleyX - 42, y: 72, w: 84, h: 38 }), 0x596e60);
    g.fillStyle(GOLD).fillCircle(trolleyX - 24, vy(91), 7).fillCircle(trolleyX + 24, vy(91), 7);
    g.lineStyle(3, GOLD, .7).lineBetween(trolleyX, vy(111), trolleyX, vy(128));

    // Lift chain, linked visibly to the pressure plate
    g.lineStyle(2, GOLD, .4).lineBetween(400, vy(636), 400, vy(690)).lineBetween(400, vy(690), 704, vy(690)).lineBetween(704, vy(690), 704, vy(a.liftY + 16));
    for (const x of [648, 760]) for (let y = 115; y < a.liftY; y += 14) g.lineStyle(2, 0x8c9674, .6).strokeRoundedRect(x - 3, vy(y), 6, 10, 3);

    this.block(vr(liftRect(a.liftY)), METAL);
    g.fillStyle(a.plateWeighted ? GOLD : 0x556d58).fillRoundedRect(PLATE.x, vy(PLATE.y), PLATE.w, PLATE.h, 3);
    g.lineStyle(2, GOLD, .7).strokeRect(PLATE.x, vy(PLATE.y), PLATE.w, PLATE.h);
    if (a.shelfIntact) this.block(vr(SHELF), WOOD, true);
    if (a.gateIntact) {
      this.block(vr(GATE), WOOD, true);
      // Upper ceiling barrier / portcullis above gate preventing vaulting into exit corridor
      const vy0 = vy(0);
      const vyTop = vy(GATE.y);
      g.fillStyle(0x38473e, 1).fillRect(1152, vy0, 16, vyTop - vy0);
      g.lineStyle(1.5, INK, 0.9).strokeRect(1152, vy0, 16, vyTop - vy0);
      for (let barY = vy0 + 16; barY < vyTop; barY += 28) {
        g.fillStyle(0x596e60, 1).fillRect(1150, barY, 20, 4);
      }
      // Overhead anti-vault trap across the exit corridor (1170 - 1240)
      const trapBaseY = vy(GATE.y);
      const isTriggered = Boolean(a.doorTopTrapTriggered);
      const spikeDrop = isTriggered ? 28 : 0;
      g.fillStyle(INK, 1).fillRoundedRect(1168, trapBaseY - 24, 72, 8, 2);
      g.fillStyle(0x38473e, 1).fillRect(1170, trapBaseY - 22, 68, 4);
      for (let sx = 1176; sx <= 1234; sx += 12) {
        const tipY = trapBaseY - 12 + spikeDrop;
        g.fillStyle(0x182720, 1).fillTriangle(sx - 4, trapBaseY - 18 + (isTriggered ? spikeDrop : 0), sx + 4, trapBaseY - 18 + (isTriggered ? spikeDrop : 0), sx, tipY);
        g.fillStyle(0x758579, 1).fillTriangle(sx - 2.5, trapBaseY - 18 + (isTriggered ? spikeDrop : 0), sx + 2.5, trapBaseY - 18 + (isTriggered ? spikeDrop : 0), sx, tipY - 1);
      }
      if (isTriggered) {
        g.lineStyle(2, GOLD, 0.9).lineBetween(1166, trapBaseY + 6, 1242, trapBaseY + 6);
      }
    }
    if (a.platformsRevealed) {
      this.block(vr(PLATFORM_MID), WOOD, true);
      this.block(vr(PLATFORM_HIGH), WOOD, true);
    }

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

    // Door Gear Box (5 Visual States: EMPTY, COG_MOUNTED, LUBRICATED, ARMED, ACTIVE)
    const gb = vr(CH2_GEARBOX_RECT);
    const cx = gb.x + gb.w / 2;
    const cy = gb.y + gb.h / 2;
    const gbState = a.gearboxState ?? (a.gearBoxActive ? 'ACTIVE' : 'EMPTY');

    // Recessed dark iron gearbox housing
    this.block(gb, 0x3d4b45);
    g.fillStyle(0x18241e).fillCircle(cx, cy, 18);
    g.lineStyle(1.5, 0x101915, 0.8).strokeCircle(cx, cy, 18);

    // Corner iron rivets
    for (const rx of [gb.x + 5, gb.x + gb.w - 5]) {
      for (const ry of [gb.y + 5, gb.y + gb.h - 5]) {
        g.fillStyle(0x101713).fillCircle(rx, ry, 2);
        g.fillStyle(CREAM, 0.35).fillCircle(rx - 0.5, ry - 0.5, 0.8);
      }
    }

    if (gbState === 'EMPTY') {
      // Recessed dark iron box with empty central axle hole
      g.fillStyle(0x0a100d).fillCircle(cx, cy, 6);
      g.lineStyle(1.5, 0x223028).strokeCircle(cx, cy, 6);
      g.fillStyle(CREAM, 0.15).fillCircle(cx - 1, cy - 1, 1.5);
    } else {
      // Bronze gear with teeth
      const rot = gbState === 'ACTIVE' ? this.clock * 2 : 0;
      const numTeeth = 8;
      const toothRadius = 14;

      // 1. Gear teeth
      for (let i = 0; i < numTeeth; i++) {
        const ang = (i * Math.PI * 2) / numTeeth + rot;
        const tx = cx + Math.cos(ang) * toothRadius;
        const ty = cy + Math.sin(ang) * toothRadius;
        g.fillStyle(0xa6742a).fillCircle(tx, ty, 3.5);
        g.lineStyle(1, INK, 0.7).strokeCircle(tx, ty, 3.5);

        // LUBRICATED / ARMED / ACTIVE glossy reddish sheen on gear teeth
        if (gbState === 'LUBRICATED' || gbState === 'ARMED' || gbState === 'ACTIVE') {
          g.fillStyle(0x9b1b22, 0.88).fillCircle(tx, ty, 2.8);
          g.fillStyle(0xff7070, 0.65).fillCircle(tx - 0.8, ty - 0.8, 1.2);
        }
      }

      // 2. Main cog body
      g.fillStyle(0xb8863b).fillCircle(cx, cy, 13);
      g.lineStyle(1.5, INK, 0.9).strokeCircle(cx, cy, 13);
      g.fillStyle(CREAM, 0.2).fillCircle(cx - 2, cy - 2, 9);

      // COG_MOUNTED: weathered rust spots
      if (gbState === 'COG_MOUNTED') {
        g.fillStyle(0x7c3620, 0.85).fillCircle(cx - 4, cy - 3, 2.5);
        g.fillStyle(0x662915, 0.85).fillCircle(cx + 3, cy + 4, 3);
        g.fillStyle(0x8a4025, 0.8).fillCircle(cx + 4, cy - 2, 2);
        g.fillStyle(0x5c2514, 0.9).fillCircle(cx - 2, cy + 5, 2);
      }

      // LUBRICATED / ARMED / ACTIVE: glossy reddish betel juice sheen & drip
      if (gbState === 'LUBRICATED' || gbState === 'ARMED' || gbState === 'ACTIVE') {
        g.fillStyle(0x88171d, 0.5).fillCircle(cx, cy, 10);
        g.fillStyle(0xa81c24).fillEllipse(cx + 1, cy + 15, 2, 3.5);
        g.fillStyle(0xff8888, 0.45).fillCircle(cx - 3, cy - 3, 2);
      }

      // ARMED / ACTIVE: bamboo pole lever extending diagonally out of the gear with a wooden cotter wedge
      if (gbState === 'ARMED' || gbState === 'ACTIVE') {
        const poleAngle = rot - Math.PI / 4;
        const poleLen = 42;
        const ex = cx + Math.cos(poleAngle) * poleLen;
        const ey = cy + Math.sin(poleAngle) * poleLen;
        const bx = cx - Math.cos(poleAngle) * 6;
        const by = cy - Math.sin(poleAngle) * 6;

        // Bamboo pole lever (outer ink + bamboo green/yellow body)
        g.lineStyle(6, INK, 1).lineBetween(bx, by, ex, ey);
        g.lineStyle(3.5, 0x8a994c, 1).lineBetween(bx, by, ex, ey);
        g.lineStyle(1.2, CREAM, 0.45).lineBetween(bx - 0.5, by - 0.5, ex - 0.5, ey - 0.5);

        // Bamboo segment rings
        for (const dist of [14, 26, 36]) {
          const nx = cx + Math.cos(poleAngle) * dist;
          const ny = cy + Math.sin(poleAngle) * dist;
          g.fillStyle(INK).fillCircle(nx, ny, 2.5);
          g.fillStyle(0xc8d672).fillCircle(nx, ny, 1.4);
        }

        // Wooden cotter wedge pinning lever to gear hub
        const cotterAngle = poleAngle + Math.PI / 2;
        const wx1 = cx + Math.cos(cotterAngle) * 7.5;
        const wy1 = cy + Math.sin(cotterAngle) * 7.5;
        const wx2 = cx - Math.cos(cotterAngle) * 7.5;
        const wy2 = cy - Math.sin(cotterAngle) * 7.5;
        g.lineStyle(4, INK).lineBetween(wx1, wy1, wx2, wy2);
        g.lineStyle(2.5, WOOD).lineBetween(wx1, wy1, wx2, wy2);
        g.fillStyle(CREAM, 0.8).fillCircle(wx1, wy1, 1);
      }

      // Center axle hub
      g.fillStyle(INK).fillCircle(cx, cy, 5);
      g.fillStyle(0x3e4d44).fillCircle(cx, cy, 3.5);
      g.fillStyle(GOLD).fillCircle(cx, cy, 1.5);
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
    if (a.bombDetonated && a.bombX) {
      g.fillStyle(0x182720, 0.4).fillEllipse(a.bombX, VISUAL_GROUND_Y + 1, 38, 8);
      g.fillStyle(0x0e1712, 0.6).fillCircle(a.bombX, VISUAL_GROUND_Y + 1, 6);
    }
    g.fillStyle(0x07140d, .22).fillEllipse(p.centerX, vy(p.feetY) + 1, 43, 9);
    if (this.actor) {
      renderPhoe(this.actor, { ...p, feetY: vy(p.feetY), holding: Boolean((this.scene as any).heldItemSprite), control: p.control }, this.clock);
    } else {
      g.fillStyle(0xdbc6a1).fillCircle(p.centerX, vy(p.feetY) - 52, 13);
      g.fillStyle(0xafa77e).fillRect(p.centerX - 12, vy(p.feetY) - 41, 24, 26);
      g.fillStyle(0x4e6b4f).fillTriangle(p.centerX - 15, vy(p.feetY) - 15, p.centerX + 15, vy(p.feetY) - 15, p.centerX + 10, vy(p.feetY));
    }
    // Subtle spinning cartoon dizzy stars around Phoe Htaung's head on slapstick daze
    if (p.control === 'TAUNTING' && a.gearboxSlapped) {
      const headX = p.centerX;
      const headY = vy(p.feetY) - 58;
      const numStars = 3;
      for (let i = 0; i < numStars; i++) {
        const starAng = this.clock * 7 + (i * Math.PI * 2) / numStars;
        const sx = headX + Math.cos(starAng) * 20;
        const sy = headY + Math.sin(starAng) * 6;
        g.fillStyle(INK).fillCircle(sx, sy, 3.5);
        g.fillStyle(GOLD).fillCircle(sx, sy, 2.5);
        g.fillStyle(CREAM).fillCircle(sx, sy, 1.2);
        g.lineStyle(1, GOLD, 0.95);
        g.lineBetween(sx - 4.5, sy, sx + 4.5, sy);
        g.lineBetween(sx, sy - 4.5, sx, sy + 4.5);
      }
    }
    if (debug) {
      g.lineStyle(1, 0x75ffff).strokeRect(p.centerX - 18, vy(p.feetY) - 56, 36, 56);
      for (const r of [STEP, liftRect(a.liftY), ...a.stones.map(stoneRect)]) g.strokeRect(r.x, vy(r.y), r.w, r.h);
    }
    if (a.events.some(e => e.kind === 'death') && this.shookAttempt !== a.id) { this.shookAttempt = a.id; if(shake) this.scene.cameras.main.shake(150, .003); }
  }
}
