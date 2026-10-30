import Phaser from 'phaser';
import { C } from '../content/chapter1';
import { S3, SCALE_IDS, SCALE_ITEMS } from '../content/chapter3';
import { SCALE_ART, SCALE_PROP_FRAMES } from '../content/chapter3Art';
import type { ScaleItemId } from '../content/chapter3';
import { commandPosition, leftWeight, panWeight, rightWeight, scaleGate } from '../domain/scale';
import type { ScaleAttempt } from '../domain/scale';
import { createPhoe, renderPhoe } from './PhoeHtaungView';

const INK = 0x182720, GOLD = 0xe7bb55, STONE = 0x3b4b3d, LIGHT = 0xe9dfbd, METAL = 0x839b8b, WOOD = 0x9d7047, STEP_STONE = 0x6e7c66, CREAM = 0xe9dfbd;

/**
 * Authentic Burmese Kyee-Zee (ကြေးစည်) Traditional Curved Triangular Profile
 * Normalized relative to center (0, 0) inside [-42, 42] x [-25, 25].
 */
const KYEE_ZEE_POINTS: readonly { x: number; y: number }[] = Object.freeze([
  { x: 0, y: -25 },    // Top apex
  { x: 9, y: -19 },    // Right upper neck
  { x: 19, y: -9 },    // Right sloping shoulder
  { x: 29, y: 3 },     // Right flare
  { x: 38, y: 13 },    // Right wing curve
  { x: 42, y: 17 },    // Right outer tip
  { x: 40, y: 22 },    // Right bottom corner
  { x: 28, y: 25 },    // Right bottom arc
  { x: 14, y: 25 },    // Lower right arc
  { x: 0, y: 23 },     // Center bottom arc
  { x: -14, y: 25 },   // Lower left arc
  { x: -28, y: 25 },   // Left bottom arc
  { x: -40, y: 22 },   // Left bottom corner
  { x: -42, y: 17 },   // Left outer tip
  { x: -38, y: 13 },   // Left wing curve
  { x: -29, y: 3 },    // Left flare
  { x: -19, y: -9 },   // Left sloping shoulder
  { x: -9, y: -19 },   // Left upper neck
]);

// Universal Walkable Baseline: groundY = height * 0.80 = 576px on 1280x720 canvas
// Sourced from Chapter 1 as the single authoritative visual baseline.
export const VISUAL_GROUND_Y = 576;
export const DY = VISUAL_GROUND_Y - S3.floor; // 576 - 640 = -64px shift
export const vy = (y: number): number => y + DY;
export const toDomainY = (visualY: number): number => visualY - DY;

const BEAM_Y = vy(220); // 156px - safe beneath HUD at y=94px
const NEUTRAL_PAN_Y = vy(525);
const PROP_SIZES: Record<string, [number, number]> = {
  stone: [44, 38], sandbag: [44, 40], crate: [44, 40], treasure: [36, 52], reference: [50, 39], gate: [64, 380],
  pin: [40, 36], betel_cutter: [44, 36], bamboo_pole: [44, 48], rusty_cog: [44, 40], slingshot: [44, 40],
};

/**
 * ScaleView — Chapter 3 Visual Layer
 * Fully aligned with Core Design System & Chapter 1/2 standards:
 * - Painted background preserved 100% untouched
 * - Universal walkable ground baseline at 576px (DY = -64px visual shift)
 * - Zero on-screen floating text labels or measurement tags
 * - Tactile vector items with idle bob and gold aura glow
 * - Hand-inked Bagan gate with smooth lift and lighted exit corridor
 */
export class ScaleView {
  private g: Phaser.GameObjects.Graphics;
  private bgDecor: Phaser.GameObjects.Graphics;
  private actor: ReturnType<typeof createPhoe>;
  private props = new Map<string, Phaser.GameObjects.Image>();
  private clock = 0;
  private onItemClicked?: (id: ScaleItemId) => void;

  constructor(private scene: Phaser.Scene) {
    // 1. Painted background preserved 100% untouched per explicit directive
    const painted = scene.textures.exists(SCALE_ART.background.key);
    if (painted) {
      scene.add.image(640, 360, SCALE_ART.background.key).setDisplaySize(C.width, C.height);
    } else if (scene.textures.exists('background')) {
      scene.add.image(640, 360, 'background').setDisplaySize(C.width, C.height);
    } else {
      scene.add.rectangle(640, 360, C.width, C.height, 0x343e32);
    }

    this.bgDecor = scene.add.graphics().setDepth(5);
    const bg = this.bgDecor;

    // Universal Walkable Baseline: groundY = 576px, subterranean bedrock down to 720px
    bg.fillStyle(STONE).fillRect(0, VISUAL_GROUND_Y, C.width, 720 - VISUAL_GROUND_Y);
    bg.fillStyle(0x8e9470).fillRect(0, VISUAL_GROUND_Y, C.width, 6);
    bg.fillStyle(LIGHT, 0.2).fillRect(0, VISUAL_GROUND_Y, C.width, 2);
    for (let x = 0; x < C.width; x += 92) {
      bg.lineStyle(1, INK, 0.5).lineBetween(x, VISUAL_GROUND_Y + 8, x + 12, 720);
    }

    // Scaffold Shelf (solid at visual y = 466px, height 18px)
    const shelfY = vy(S3.shelf.y);
    bg.fillStyle(INK).fillRoundedRect(S3.shelf.x - 2, shelfY - 2, S3.shelf.w + 4, S3.shelf.h + 4, 3);
    bg.fillStyle(WOOD).fillRect(S3.shelf.x, shelfY, S3.shelf.w, S3.shelf.h);
    bg.fillStyle(LIGHT, 0.25).fillRect(S3.shelf.x + 2, shelfY + 2, S3.shelf.w - 4, 3);
    for (let i = 0; i < 5; i++) {
      bg.lineStyle(1, 0x35281e, 0.8).lineBetween(304 + i * 29, shelfY + 5 + (i % 3), 328 + i * 27, shelfY + 9 + (i % 3));
    }
    // Shelf timber support struts
    bg.lineStyle(6, 0x463926).lineBetween(313, shelfY + 16, 335, VISUAL_GROUND_Y).lineBetween(437, shelfY + 16, 415, VISUAL_GROUND_Y);
    bg.lineStyle(2, 0xa28a58).lineBetween(313, shelfY + 16, 335, VISUAL_GROUND_Y).lineBetween(437, shelfY + 16, 415, VISUAL_GROUND_Y);

    // Gate wall vertical pilasters & corridor recess
    const gateRecessY = vy(250);
    for (const x of [1029, 1107]) {
      bg.fillStyle(0x524f3b).fillRect(x, gateRecessY, 7, VISUAL_GROUND_Y - gateRecessY + 10);
      bg.lineStyle(1, LIGHT, 0.3).lineBetween(x, gateRecessY, x, VISUAL_GROUND_Y);
    }
    // Dark subterranean archway behind gate
    bg.fillStyle(0x141f19, 0.85).fillRect(1038, gateRecessY + 2, 68, VISUAL_GROUND_Y - gateRecessY - 2);

    this.g = scene.add.graphics().setDepth(10);

    // Register high-quality procedural vector props strictly (zero atlas fallback)
    const vectorKeys: Record<string, string> = {
      gate: 'ch3_vector_gate',
      reference: 'ch3_vector_reference',
      stone: 'ch3_vector_stone',
      treasure: 'ch3_vector_treasure',
      crate: 'ch3_vector_crate',
      sandbag: 'ch3_vector_sandbag',
      pin: 'ch3_vector_pin',
      betel_cutter: 'ch3_vector_betel_cutter',
      bamboo_pole: 'ch3_vector_bamboo_pole',
      rusty_cog: 'ch3_vector_rusty_cog',
      slingshot: 'ch3_vector_slingshot',
    };

    for (const [id, texKey] of Object.entries(vectorKeys)) {
      if (scene.textures.exists(texKey)) {
        const size = PROP_SIZES[id] ?? [44, 44];
        const img = scene.add
          .image(0, 0, texKey)
          .setOrigin(0.5, 1)
          .setDisplaySize(size[0], size[1])
          .setDepth(id === 'gate' ? 9 : 12);
        
        // Make items clickable (except gate and reference which is fixed)
        if (id !== 'gate' && id !== 'reference') {
          img.setInteractive({ useHandCursor: true });
          img.on('pointerdown', (_pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event?: Event) => {
            event?.stopPropagation();
            if (this.onItemClicked) {
              this.onItemClicked(id as ScaleItemId);
            }
          });
        }
        
        this.props.set(id, img);
      }
    }

    this.actor = createPhoe(scene, 20);
  }

  public setItemClickHandler(handler: (id: ScaleItemId) => void) {
    this.onItemClicked = handler;
  }

  public getActorSprite(): Phaser.GameObjects.Sprite | null {
    return this.actor;
  }

  panDelta(a: ScaleAttempt): number {
    const lW = leftWeight(a);
    const rW = rightWeight(a);
    const diff = rW - lW;
    // Responsive progressive hyperbolic tangent curve with max deflection 48px
    // At diff = 0: panDelta = 0 (perfect horizontal level)
    // At diff < 0 (left heavier): panDelta < 0 -> left pan goes down, right pan goes up
    // At diff > 0 (right heavier): panDelta > 0 -> right pan goes down, left pan goes up
    return Math.round(48 * Math.tanh(diff / 6));
  }

  rightPanY(a: ScaleAttempt): number {
    return NEUTRAL_PAN_Y + this.panDelta(a);
  }

  leftPanY(a: ScaleAttempt): number {
    return NEUTRAL_PAN_Y - this.panDelta(a);
  }

  /** Visual Y coordinate of the right pan */
  panY(a: ScaleAttempt): number {
    return this.rightPanY(a);
  }

  /** Visual coordinates of item in world or pan */
  itemPoint(a: ScaleAttempt, id: ScaleItemId): { x: number; feetY: number } {
    const loc = a.locations[id];
    if (loc === 'LEFT_PAN') {
      const onLeft = SCALE_IDS.filter(key => a.locations[key] === 'LEFT_PAN');
      const idx = onLeft.indexOf(id);
      const span = Math.min(28, 70 / Math.max(1, onLeft.length));
      return {
        x: S3.leftPanX - ((onLeft.length - 1) * span) / 2 + idx * span,
        feetY: this.leftPanY(a)
      };
    }
    if (loc === 'RIGHT_PAN' || loc === 'PAN') {
      const onRight = SCALE_IDS.filter(key => a.locations[key] === 'RIGHT_PAN' || a.locations[key] === 'PAN');
      const idx = onRight.indexOf(id);
      const span = Math.min(28, 70 / Math.max(1, onRight.length));
      return {
        x: S3.panX - ((onRight.length - 1) * span) / 2 + idx * span,
        feetY: this.rightPanY(a)
      };
    }
    return { x: SCALE_ITEMS[id].x, feetY: vy(SCALE_ITEMS[id].feetY) };
  }

  private cord(x1: number, y1: number, x2: number, y2: number) {
    const g = this.g;
    g.lineStyle(4, 0x312a1b).lineBetween(x1, y1, x2, y2);
    g.lineStyle(1.5, 0xb59a61).lineBetween(x1 - 0.5, y1, x2 - 0.5, y2);
  }

  render(a: ScaleAttempt, dt = 0, isHolding = false, grabControl?: string | null) {
    this.clock += dt;
    const g = this.g;
    g.clear();

    const rightY = this.rightPanY(a);
    const leftY = this.leftPanY(a);
    const rightDomainDelta = rightY - NEUTRAL_PAN_Y;

    // 1. Balance Beam & Suspension System
    g.lineStyle(10, INK).lineBetween(500, BEAM_Y - rightDomainDelta, 750, BEAM_Y + rightDomainDelta);
    g.lineStyle(6, 0x90733e).lineBetween(500, BEAM_Y - rightDomainDelta, 750, BEAM_Y + rightDomainDelta);
    g.lineStyle(1.5, LIGHT, 0.8).lineBetween(500, BEAM_Y - 3 - rightDomainDelta, 750, BEAM_Y - 3 + rightDomainDelta);

    // Pulley rope running to gate
    const gateTopVisual = vy(S3.gateTop - a.gateLift);
    const pulleyY = vy(195);
    this.cord(622, BEAM_Y, 622, pulleyY);
    this.cord(622, pulleyY, 1070, pulleyY);
    this.cord(1070, pulleyY, 1070, gateTopVisual);

    // Center pivot brass rivet
    g.fillStyle(INK).fillCircle(622, BEAM_Y, 12);
    g.fillStyle(0x93733b).fillCircle(622, BEAM_Y, 9);
    g.lineStyle(1.5, LIGHT, 0.7).strokeCircle(622, BEAM_Y, 6);
    g.fillStyle(INK).fillCircle(622, BEAM_Y, 2);

    // Pulley wheel above gate
    g.fillStyle(0x493d26).fillCircle(1070, pulleyY, 11);
    g.lineStyle(2, GOLD).strokeCircle(1070, pulleyY, 8);

    // 2. Both Scale Pans (Bronze trays)
    for (const [x, y] of [[500, leftY], [750, rightY]] as const) {
      const beamEndDelta = (x === 500 ? -1 : 1) * rightDomainDelta;
      this.cord(x, BEAM_Y + beamEndDelta, x - 55, y);
      this.cord(x, BEAM_Y + beamEndDelta, x + 55, y);
      g.fillStyle(0x171b13, 0.45).fillEllipse(x, y + 8, 140, 14);
      g.fillStyle(0x58472c).fillEllipse(x, y + 3, 130, 18);
      g.fillStyle(0x987845).fillEllipse(x, y, 130, 12);
      g.lineStyle(2, 0xddc185, 0.8).strokeEllipse(x, y - 1, 130, 12);
      g.lineStyle(1, INK, 0.4).strokeEllipse(x, y + 2, 114, 8);
    }

    // Left Pan Reference Weight (Permanent immovable counterweight)
    const reference = this.props.get('reference');
    const isReferenceOnLeft = a.locations.reference === 'LEFT_PAN';
    if (reference) {
      reference.setVisible(isReferenceOnLeft);
      if (isReferenceOnLeft) {
        const refPt = this.itemPoint(a, 'reference');
        reference.setPosition(refPt.x, refPt.feetY - 2);
        g.fillStyle(0x10170e, 0.35).fillEllipse(refPt.x, refPt.feetY - 1, 46, 8);
      }
    } else if (isReferenceOnLeft) {
      const refPt = this.itemPoint(a, 'reference');
      g.fillStyle(STONE).fillRoundedRect(refPt.x - 25, refPt.feetY - 43, 50, 40, 5);
      g.lineStyle(2, INK).strokeRoundedRect(refPt.x - 25, refPt.feetY - 43, 50, 40, 5);
    }

    // 3. Bagan Gate & Passageway
    const gate = scaleGate(a);
    const door = this.props.get('gate');
    const visualGateY = vy(gate.y);
    if (door) {
      const isVector = door.texture.key === 'ch3_vector_gate';
      const frameW = isVector ? 64 : (SCALE_PROP_FRAMES.gate?.w ?? 64);
      const frameH = isVector ? 380 : (SCALE_PROP_FRAMES.gate?.h ?? 380);
      const hiddenTop = (Math.max(0, Math.min(S3.gateH, a.gateLift)) / S3.gateH) * frameH;
      door.setPosition(gate.x + gate.w / 2, visualGateY + gate.h).setCrop(0, hiddenTop, frameW, frameH - hiddenTop);
    } else {
      g.fillStyle(0x5e624c).fillRect(gate.x, visualGateY, gate.w, gate.h);
      g.lineStyle(2, GOLD).strokeRect(gate.x, visualGateY, gate.w, gate.h);
      for (let y = visualGateY + 12; y < visualGateY + gate.h; y += 28) {
        g.fillStyle(0x3e4232).fillRect(gate.x + 2, y, gate.w - 4, 6);
        g.fillStyle(GOLD).fillCircle(gate.x + 8, y + 3, 2).fillCircle(gate.x + gate.w - 8, y + 3, 2);
      }
    }

    // Passageway Corridor Reveal when Gate is Raised
    if (a.gateLift > 20) {
      const liftH = Math.min(a.gateLift, 180);
      g.fillStyle(0x182d23, 0.9).fillRect(1040, VISUAL_GROUND_Y - liftH, 64, liftH);
      // Directional corridor arrow into Chapter 4
      g.lineStyle(3, GOLD, 0.75).lineBetween(1060, VISUAL_GROUND_Y - 40, 1084, VISUAL_GROUND_Y - 40);
      g.lineStyle(3, GOLD, 0.75).lineBetween(1076, VISUAL_GROUND_Y - 48, 1084, VISUAL_GROUND_Y - 40);
      g.lineStyle(3, GOLD, 0.75).lineBetween(1076, VISUAL_GROUND_Y - 32, 1084, VISUAL_GROUND_Y - 40);
    }

    // Latch Hole beside Gate
    const latchY = vy(575);
    g.fillStyle(INK).fillCircle(S3.latchX, latchY, 9);
    g.lineStyle(2, GOLD, 0.8).strokeCircle(S3.latchX, latchY, 9);
    g.fillStyle(0x0c120e).fillCircle(S3.latchX, latchY, 4);

    // Braced Iron Pin Wedged in Latch
    if (a.braced) {
      g.lineStyle(8, INK).lineBetween(984, latchY + 8, 1038, latchY - 6);
      g.lineStyle(5, METAL).lineBetween(984, latchY + 7, 1038, latchY - 7);
      g.lineStyle(1.5, LIGHT, 0.9).lineBetween(984, latchY + 6, 1038, latchY - 8);
      g.fillStyle(GOLD).fillCircle(984, latchY + 8, 4);
    }

    // 4. Scale Pan Items (Rendered strictly when placed on the bronze scale pan)
    // World items on the ground and shelf are managed diegetically by DiegeticGrab pickup sprites
    for (const id of SCALE_IDS) {
      if (id === 'reference') continue;
      const onPan = a.locations[id] === 'PAN' || a.locations[id] === 'RIGHT_PAN' || a.locations[id] === 'LEFT_PAN';
      const sprite = this.props.get(id);
      if (sprite) sprite.setVisible(onPan);
      if (!onPan) continue;

      const pt = this.itemPoint(a, id);
      const x = pt.x;
      const y = pt.feetY;

      // Pan contact shadow
      g.fillStyle(0x10170e, 0.35).fillEllipse(x, y - 1, 46, 8);

      if (sprite) {
        sprite.setPosition(x, y);
      } else {
        const item = SCALE_ITEMS[id];
        g.fillStyle(item.color).fillRoundedRect(x - 22, y - 36, 44, 34, 4);
        g.lineStyle(2, INK).strokeRoundedRect(x - 22, y - 36, 44, 34, 4);
      }
    }

    // Closing Warning Highlight on Gate Frame
    if (a.closingLeft > 0 && !a.wasBalanced && !a.braced) {
      g.lineStyle(4, 0xe9ae65, 0.85).strokeRect(1023, vy(245), 98, 398);
    }

    // 5. Sweeping Bronze Kyee-Zee Pendulum & Dynamic Floor Shadow
    this.drawPendulum(a);

    // 6. Phoe Htaung Character Rendering at groundY = 576px
    const playerFeetVisual = vy(a.player.feetY);
    g.fillStyle(0x0c140d, a.player.grounded ? 0.35 : 0.15).fillEllipse(a.player.centerX, playerFeetVisual + 1, 36, 8);

    if (this.actor) {
      renderPhoe(
        this.actor,
        {
          ...a.player,
          feetY: playerFeetVisual,
          holding: isHolding,
          control: (grabControl || a.player.control) as any
        },
        this.clock
      );
    } else {
      g.fillStyle(GOLD).fillRect(a.player.centerX - 18, playerFeetVisual - 56, 36, 56);
    }

    // 7. Spinning Comic Dizzy Stars on Slapstick Daze
    if (a.pendulum.slapstickTimer > 0) {
      const headX = a.player.centerX;
      const headY = vy(a.player.feetY) - 58;
      const numStars = 4;
      for (let i = 0; i < numStars; i++) {
        const starAng = this.clock * 7.5 + (i * Math.PI * 2) / numStars;
        const sx = headX + Math.cos(starAng) * 22;
        const sy = headY + Math.sin(starAng) * 7.5;
        g.fillStyle(INK, 0.9).fillCircle(sx, sy, 4);
        g.fillStyle(GOLD, 1.0).fillCircle(sx, sy, 2.8);
        g.fillStyle(LIGHT, 1.0).fillCircle(sx, sy, 1.2);
        g.lineStyle(1.5, GOLD, 0.95);
        g.lineBetween(sx - 5.5, sy, sx + 5.5, sy);
        g.lineBetween(sx, sy - 5.5, sx, sy + 5.5);
      }
    }
  }

  /**
   * Procedural Vector Burmese Kyee-Zee (ကြေးစည်) Sweeping Bronze Pendulum
   * Implements 3-layer inking formula: Outer INK outline -> base bronze fill -> top CREAM specular bevel -> bottom shadow.
   * Dynamic floor shadow on flagstone floor (groundY = 576px).
   * Hoisted rafters display with forged iron locking bracket when inactive.
   */
  private drawPendulum(a: ScaleAttempt) {
    const g = this.g;
    const pivotX = S3.pendulum.pivotX;
    const pivotY = vy(S3.pendulum.pivotY);
    const isActive = a.pendulum.active;
    const angle = isActive ? a.pendulum.angle : 0;
    const gx = isActive ? a.pendulum.x : pivotX;
    const gy = isActive ? vy(a.pendulum.y) : pivotY + 46;

    // 1. Dynamic Soft Floor Shadow on Flagstone Floor (groundY = 576px)
    if (isActive) {
      const swingHeight = Math.max(0, VISUAL_GROUND_Y - gy - 25);
      const heightFactor = Phaser.Math.Clamp(swingHeight / 130, 0, 1);
      const shadowAlpha = Phaser.Math.Linear(0.38, 0.12, heightFactor);
      const shadowW = Phaser.Math.Linear(84, 122, heightFactor);
      const shadowH = Phaser.Math.Linear(16, 8, heightFactor);

      g.fillStyle(0x0c140d, shadowAlpha * 0.45).fillEllipse(gx, VISUAL_GROUND_Y + 2, shadowW + 16, shadowH + 6);
      g.fillStyle(0x080d09, shadowAlpha).fillEllipse(gx, VISUAL_GROUND_Y + 1, shadowW, shadowH);
    } else {
      g.fillStyle(0x0c140d, 0.05).fillEllipse(pivotX, VISUAL_GROUND_Y + 1, 60, 6);
    }

    // 2. Ceiling Rafter Mounting Flange & Pivot Clevis
    g.fillStyle(INK, 1).fillRoundedRect(pivotX - 22, pivotY - 14, 44, 18, 3);
    g.fillStyle(METAL, 1).fillRoundedRect(pivotX - 20, pivotY - 12, 40, 14, 2);
    g.fillStyle(CREAM, 0.25).fillRect(pivotX - 18, pivotY - 11, 36, 2);
    g.fillStyle(0x232d26, 0.8).fillRect(pivotX - 18, pivotY, 36, 2);
    g.fillStyle(INK, 1).fillCircle(pivotX, pivotY, 6);
    g.fillStyle(GOLD, 1).fillCircle(pivotX, pivotY, 4);
    g.fillStyle(INK, 1).fillCircle(pivotX, pivotY, 1.5);

    // 3. Coordinate Transformation Matrix
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const tx = (lx: number, ly: number) => ({
      x: gx + lx * cosA - ly * sinA,
      y: gy + lx * sinA + ly * cosA
    });

    const topEyelet = tx(0, -18);

    // 4. Suspension Ropes / Braided Chains
    g.lineStyle(5, INK, 1).lineBetween(pivotX, pivotY, topEyelet.x, topEyelet.y);
    g.lineStyle(3, 0x907542, 1).lineBetween(pivotX, pivotY, topEyelet.x, topEyelet.y);
    g.lineStyle(1, CREAM, 0.75).lineBetween(pivotX - 0.5, pivotY, topEyelet.x - 0.5, topEyelet.y);

    const cordLen = Math.hypot(topEyelet.x - pivotX, topEyelet.y - pivotY);
    if (cordLen > 30) {
      for (let d = 20; d < cordLen - 15; d += 28) {
        const frac = d / cordLen;
        const nx = pivotX + (topEyelet.x - pivotX) * frac;
        const ny = pivotY + (topEyelet.y - pivotY) * frac;
        g.fillStyle(INK, 0.85).fillCircle(nx, ny, 3.5);
        g.fillStyle(GOLD, 0.95).fillCircle(nx, ny, 2.2);
      }
    }

    // 5. Authentic Burmese Kyee-Zee (ကြေးစည်) Bronze Gong Geometry
    const pts = KYEE_ZEE_POINTS.map(p => tx(p.x, p.y));
    const insetPts = KYEE_ZEE_POINTS.map(p => tx(p.x * 0.88, (p.y - 2) * 0.88 + 2));

    // Outer dark INK outline
    g.lineStyle(4, INK, 1).strokePoints(pts, true);

    // Base deep antique bronze fill
    g.fillStyle(0x755322, 1).fillPoints(pts, true);

    // Warmer burnished bronze inner bevel
    g.fillStyle(0x9d7535, 1).fillPoints(insetPts, true);

    // Top CREAM specular bevel along upper perimeter
    g.lineStyle(2, CREAM, 0.5);
    g.beginPath();
    const firstUpper = pts[13];
    if (firstUpper) {
      g.moveTo(firstUpper.x, firstUpper.y);
      for (const idx of [14, 15, 16, 17, 0, 1, 2, 3, 4, 5]) {
        const pt = pts[idx];
        if (pt) g.lineTo(pt.x, pt.y);
      }
    }
    g.strokePath();

    // Bottom shadow bevel along lower perimeter
    g.lineStyle(2, 0x36250e, 0.7);
    g.beginPath();
    const firstLower = pts[5];
    if (firstLower) {
      g.moveTo(firstLower.x, firstLower.y);
      for (const idx of [6, 7, 8, 9, 10, 11, 12, 13]) {
        const pt = pts[idx];
        if (pt) g.lineTo(pt.x, pt.y);
      }
    }
    g.strokePath();

    // Centered embossed solar/floral motif (နေဝန်းရောင်ခြည် / Lotus Rosette)
    const c = tx(0, 3);
    g.lineStyle(1.5, GOLD, 0.85).strokeCircle(c.x, c.y, 13);
    g.lineStyle(1, GOLD, 0.7).strokeCircle(c.x, c.y, 7);
    for (let i = 0; i < 8; i++) {
      const rAng = angle + (i * Math.PI) / 4;
      g.lineBetween(
        c.x + Math.cos(rAng) * 7,
        c.y + Math.sin(rAng) * 7,
        c.x + Math.cos(rAng) * 13,
        c.y + Math.sin(rAng) * 13
      );
    }
    g.fillStyle(GOLD, 1).fillCircle(c.x, c.y, 3.5);
    g.fillStyle(CREAM, 0.95).fillCircle(c.x - 1, c.y - 1, 1.2);

    // Decorative corner GOLD rivets
    for (const [lx, ly] of [[-27, 16], [27, 16], [0, -6]] as const) {
      const rPos = tx(lx, ly);
      g.fillStyle(INK, 1).fillCircle(rPos.x, rPos.y, 3);
      g.fillStyle(GOLD, 1).fillCircle(rPos.x, rPos.y, 2);
      g.fillStyle(CREAM, 0.9).fillCircle(rPos.x - 0.5, rPos.y - 0.5, 0.8);
    }

    // Top suspension hole with reinforced collar & shackle ring
    const h = tx(0, -17);
    g.lineStyle(2, GOLD, 0.95).strokeCircle(h.x, h.y, 4.5);
    g.fillStyle(0x16221a, 0.95).fillCircle(h.x, h.y, 3.2);
    g.lineStyle(2.5, METAL, 0.95).strokeCircle(h.x, h.y - 2, 4.5);

    // 6. Hoisted Rafters Iron Locking Bracket when inactive
    if (!isActive) {
      g.fillStyle(INK, 1).fillRoundedRect(pivotX - 48, gy - 10, 96, 20, 4);
      g.fillStyle(0x354038, 1).fillRoundedRect(pivotX - 46, gy - 8, 92, 16, 3);
      g.fillStyle(CREAM, 0.25).fillRect(pivotX - 44, gy - 7, 88, 2);
      g.fillStyle(0x18201a, 0.8).fillRect(pivotX - 44, gy + 5, 88, 3);

      for (const bx of [pivotX - 38, pivotX - 22, pivotX + 22, pivotX + 38]) {
        g.fillStyle(INK, 1).fillCircle(bx, gy, 3.5);
        g.fillStyle(GOLD, 1).fillCircle(bx, gy, 2.2);
      }

      const lockX = pivotX;
      const lockY = gy + 12;
      g.lineStyle(2.5, METAL, 1).strokeCircle(lockX, lockY, 5);
      g.fillStyle(INK, 1).fillRoundedRect(lockX - 7, lockY + 1, 14, 16, 2);
      g.fillStyle(GOLD, 1).fillRoundedRect(lockX - 6, lockY + 2, 12, 14, 2);
      g.fillStyle(CREAM, 0.4).fillRect(lockX - 5, lockY + 3, 10, 2);
      g.fillStyle(INK, 1).fillCircle(lockX, lockY + 8, 1.8);
      g.lineStyle(1, INK, 1).lineBetween(lockX, lockY + 8, lockX, lockY + 12);

      g.lineStyle(3, 0x8f723c, 0.95);
      for (let r = 8; r <= 16; r += 4) {
        g.strokeEllipse(pivotX - 32, gy + 14, r * 1.4, r * 0.9);
      }
    }
  }
}
