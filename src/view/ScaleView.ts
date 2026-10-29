import Phaser from 'phaser';
import { C } from '../content/chapter1';
import { S3, SCALE_IDS, SCALE_ITEMS } from '../content/chapter3';
import { SCALE_ART, SCALE_PROP_FRAMES } from '../content/chapter3Art';
import type { ScaleItemId } from '../content/chapter3';
import { commandPosition, panWeight, scaleGate } from '../domain/scale';
import type { ScaleAttempt } from '../domain/scale';
import { createPhoe, renderPhoe } from './PhoeHtaungView';

const INK = 0x182720, GOLD = 0xe7bb55, STONE = 0x3b4b3d, LIGHT = 0xe9dfbd, METAL = 0x839b8b, WOOD = 0x9d7047, STEP_STONE = 0x6e7c66;

// Universal Walkable Baseline: groundY = height * 0.80 = 576px on 1280x720 canvas
// Sourced from Chapter 1 as the single authoritative visual baseline.
export const VISUAL_GROUND_Y = 576;
export const DY = VISUAL_GROUND_Y - S3.floor; // 576 - 640 = -64px shift
export const vy = (y: number): number => y + DY;
export const toDomainY = (visualY: number): number => visualY - DY;

const BEAM_Y = vy(220); // 156px - safe beneath HUD at y=94px
const PROP_SIZES: Record<string, [number, number]> = {
  stone: [44, 38], sandbag: [44, 40], crate: [44, 40], treasure: [34, 52], reference: [50, 39], gate: [64, 380],
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

    // Register prop textures from atlas if available
    if (scene.textures.exists(SCALE_ART.props.key)) {
      const texture = scene.textures.get(SCALE_ART.props.key);
      for (const [id, frame] of Object.entries(SCALE_PROP_FRAMES)) {
        if (!texture.has(id)) texture.add(id, 0, frame.x, frame.y, frame.w, frame.h);
        const size = PROP_SIZES[id];
        if (!size) continue;
        const img = scene.add
          .image(0, 0, SCALE_ART.props.key, id)
          .setOrigin(0.5, 1)
          .setDisplaySize(size[0], size[1])
          .setDepth(id === 'gate' ? 9 : 12);
        this.props.set(id, img);
      }
    }

    this.actor = createPhoe(scene, 20);
  }

  /** Visual Y coordinate of the right pan */
  panY(a: ScaleAttempt): number {
    const domainPan = 535 + Phaser.Math.Clamp((panWeight(a) - S3.targetWeight) * 4, -32, 32);
    return vy(domainPan);
  }

  /** Visual coordinates of item in world or pan */
  itemPoint(a: ScaleAttempt, id: ScaleItemId): { x: number; feetY: number } {
    if (a.locations[id] === 'PAN') {
      const onPan = SCALE_IDS.filter(key => a.locations[key] === 'PAN');
      return {
        x: S3.panX - (onPan.length - 1) * 30 + onPan.indexOf(id) * 60,
        feetY: this.panY(a)
      };
    }
    return { x: SCALE_ITEMS[id].x, feetY: vy(SCALE_ITEMS[id].feetY) };
  }

  private cord(x1: number, y1: number, x2: number, y2: number) {
    const g = this.g;
    g.lineStyle(4, 0x312a1b).lineBetween(x1, y1, x2, y2);
    g.lineStyle(1.5, 0xb59a61).lineBetween(x1 - 0.5, y1, x2 - 0.5, y2);
  }

  render(a: ScaleAttempt, dt = 0, isHolding = false) {
    this.clock += dt;
    const g = this.g;
    g.clear();

    const rightY = this.panY(a);
    const rightDomainDelta = rightY - vy(535);
    const leftY = vy(535) - rightDomainDelta;

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

    // Left Pan Reference Weight (10 ပိဿာ)
    const reference = this.props.get('reference');
    if (reference) {
      reference.setPosition(500, leftY - 2);
    } else {
      g.fillStyle(STONE).fillRoundedRect(475, leftY - 43, 50, 40, 5);
      g.lineStyle(2, INK).strokeRoundedRect(475, leftY - 43, 50, 40, 5);
    }

    // 3. Bagan Gate & Passageway
    const gate = scaleGate(a);
    const door = this.props.get('gate');
    const visualGateY = vy(gate.y);
    if (door) {
      const frame = SCALE_PROP_FRAMES.gate!;
      const hiddenTop = (a.gateLift / S3.gateH) * frame.h;
      door.setPosition(gate.x + gate.w / 2, visualGateY + gate.h).setCrop(0, hiddenTop, frame.w, frame.h - hiddenTop);
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

    // 4. World Pickups (Clean vector inking, subtle idle bobbing, soft gold glow, NO text stickers)
    for (const id of SCALE_IDS) {
      const visible = ['WORLD', 'PAN'].includes(a.locations[id]);
      const sprite = this.props.get(id);
      if (sprite) sprite.setVisible(visible);
      if (!visible) continue;

      const pt = this.itemPoint(a, id);
      const bob = a.locations[id] === 'PAN' ? 0 : Math.sin(this.clock * 3 + id.length) * 2;
      const x = pt.x;
      const y = pt.feetY + bob;

      // Contact shadow & soft ambient gold glow
      g.fillStyle(0x10170e, 0.35).fillEllipse(x, y - 1, 46, 8);
      g.fillStyle(GOLD, 0.12).fillCircle(x, y - 16, 26);

      if (sprite) {
        sprite.setPosition(x, y);
      } else if (id === 'pin') {
        g.lineStyle(8, INK).lineBetween(x - 22, y - 9, x + 22, y - 22);
        g.lineStyle(5, 0x8e9688).lineBetween(x - 22, y - 10, x + 22, y - 23);
        g.lineStyle(1.5, LIGHT, 0.8).lineBetween(x - 21, y - 12, x + 21, y - 24);
        g.fillStyle(GOLD).fillCircle(x + 22, y - 22, 3.5);
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

    // 5. Phoe Htaung Character Rendering at groundY = 576px
    const playerFeetVisual = vy(a.player.feetY);
    g.fillStyle(0x0c140d, a.player.grounded ? 0.35 : 0.15).fillEllipse(a.player.centerX, playerFeetVisual + 1, 36, 8);

    if (this.actor) {
      renderPhoe(
        this.actor,
        {
          ...a.player,
          feetY: playerFeetVisual,
          holding: isHolding,
          control: a.player.control
        },
        this.clock
      );
    } else {
      g.fillStyle(GOLD).fillRect(a.player.centerX - 18, playerFeetVisual - 56, 36, 56);
    }
  }
}
