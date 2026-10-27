import Phaser from 'phaser';
import { C } from '../content/chapter1';
import { S3, SCALE_IDS, SCALE_ITEMS } from '../content/chapter3';
import { SCALE_ART, SCALE_PROP_FRAMES } from '../content/chapter3Art';
import type { ScaleItemId } from '../content/chapter3';
import { commandPosition, panWeight, scaleGate } from '../domain/scale';
import type { ScaleAttempt } from '../domain/scale';
import { createPhoe, renderPhoe } from './PhoeHtaungView';

const INK = 0x201f16, GOLD = 0xc9a85f, STONE = 0x716b50, LIGHT = 0xe0c58c;
const BEAM_Y = 220;
const PROP_SIZES: Record<string, [number, number]> = {
  stone: [48, 38], sandbag: [46, 41], crate: [46, 40], treasure: [31, 54], reference: [50, 39], gate: [64, 380],
};

/** Painted local environment and independently movable props; all geometry stays in the domain. */
export class ScaleView {
  private g: Phaser.GameObjects.Graphics;
  private actor: ReturnType<typeof createPhoe>;
  private props = new Map<string, Phaser.GameObjects.Image>();
  constructor(scene: Phaser.Scene) {
    const painted = scene.textures.exists(SCALE_ART.background.key);
    if (painted) scene.add.image(640, 360, SCALE_ART.background.key).setDisplaySize(C.width, C.height);
    else if (scene.textures.exists('background')) scene.add.image(640, 360, 'background').setDisplaySize(C.width, C.height);
    else scene.add.rectangle(640, 360, C.width, C.height, 0x343e32);
    const bg = scene.add.graphics();
    if (!painted) {
      // Readable fallback for a missing optional environment; never a required collider.
      bg.fillStyle(INK, .45).fillRoundedRect(544, 208, 156, 430, 60);
      bg.fillStyle(STONE).fillRoundedRect(582, 365, 80, 265, 18).fillEllipse(622, 320, 82, 100);
      bg.lineStyle(3, INK).lineBetween(595, 320, 607, 320).lineBetween(637, 320, 649, 320);
    }
    bg.fillStyle(0x302d20, .65).fillRect(0, S3.floor, C.width, 4);
    bg.fillStyle(LIGHT, .35).fillRect(0, S3.floor, C.width, 2);
    for (let x = 0; x < C.width; x += 80) {
      bg.lineStyle(1, INK, .4).lineBetween(x, 647, x + 11, 718);
      bg.lineStyle(1, LIGHT, .14).lineBetween(x + 13, 653, x + 25, 653);
    }
    // Shelf top remains the exact solid y530, with layered woodgrain and bevels.
    bg.fillStyle(INK).fillRect(S3.shelf.x - 2, S3.shelf.y - 2, S3.shelf.w + 4, S3.shelf.h + 4);
    bg.fillStyle(0x70513a).fillRect(S3.shelf.x, S3.shelf.y, S3.shelf.w, S3.shelf.h);
    bg.fillStyle(0xb69762).fillRect(S3.shelf.x, S3.shelf.y, S3.shelf.w, 3);
    for (let i = 0; i < 5; i++) bg.lineStyle(1, 0x35281e, .8).lineBetween(304 + i * 29, 535 + i % 3, 328 + i * 27, 539 + i % 3);
    bg.lineStyle(7, 0x463926).lineBetween(313, 550, 335, 581).lineBetween(437, 550, 415, 581);
    bg.lineStyle(2, 0xa28a58).lineBetween(313, 550, 335, 581).lineBetween(437, 550, 415, 581);
    for (const x of [1029, 1107]) {
      bg.fillStyle(0x524f3b).fillRect(x, 250, 7, 390);
      bg.lineStyle(1, LIGHT, .3).lineBetween(x, 252, x, 638);
      for (let y = 270; y < 640; y += 42) bg.lineStyle(2, INK, .6).lineBetween(x, y, x + 7, y + 2);
    }
    bg.fillStyle(0x151c17, .4).fillRect(1040, 251, 64, 389);
    this.g = scene.add.graphics().setDepth(10);
    if (scene.textures.exists(SCALE_ART.props.key)) {
      const texture = scene.textures.get(SCALE_ART.props.key);
      for (const [id, frame] of Object.entries(SCALE_PROP_FRAMES)) {
        if (!texture.has(id)) texture.add(id, 0, frame.x, frame.y, frame.w, frame.h);
        const size = PROP_SIZES[id]; if (!size) continue;
        this.props.set(id, scene.add.image(0, 0, SCALE_ART.props.key, id).setOrigin(.5, 1).setDisplaySize(size[0], size[1]).setDepth(id === 'gate' ? 9 : 12));
      }
    }
    this.actor = createPhoe(scene, 20);
  }
  panY(a: ScaleAttempt) { return 535 + Phaser.Math.Clamp((panWeight(a) - S3.targetWeight) * 4, -32, 32); }
  itemPoint(a: ScaleAttempt, id: ScaleItemId) {
    if (a.locations[id] === 'PAN') {
      const onPan = SCALE_IDS.filter(key => a.locations[key] === 'PAN');
      return { x: S3.panX - (onPan.length - 1) * 30 + onPan.indexOf(id) * 60, feetY: this.panY(a) };
    }
    return { x: SCALE_ITEMS[id].x, feetY: SCALE_ITEMS[id].feetY };
  }
  private cord(x1: number, y1: number, x2: number, y2: number) {
    const g = this.g;
    g.lineStyle(4, 0x312a1b).lineBetween(x1, y1, x2, y2);
    g.lineStyle(1.5, 0xb59a61).lineBetween(x1 - .5, y1, x2 - .5, y2);
    const count = Math.floor(Phaser.Math.Distance.Between(x1, y1, x2, y2) / 13);
    for (let i = 1; i < count; i++) {
      const x = x1 + (x2 - x1) * i / count, y = y1 + (y2 - y1) * i / count;
      g.lineStyle(1, 0x504027, .8).lineBetween(x - 2, y - 1, x + 2, y + 1);
    }
  }
  render(a: ScaleAttempt, showHotspots: boolean) {
    const g = this.g; g.clear(); const rightY = this.panY(a), leftY = 1070 - rightY;
    // Tarnished metal and ropes are independent of the static relief/background.
    g.lineStyle(10, INK).lineBetween(500, BEAM_Y - (rightY - 535), 750, BEAM_Y + (rightY - 535));
    g.lineStyle(6, 0x90733e).lineBetween(500, BEAM_Y - (rightY - 535), 750, BEAM_Y + (rightY - 535));
    g.lineStyle(1.5, LIGHT, .8).lineBetween(500, BEAM_Y - 3 - (rightY - 535), 750, BEAM_Y - 3 + (rightY - 535));
    this.cord(622, BEAM_Y, 622, 195); this.cord(622, 195, 1070, 195); this.cord(1070, 195, 1070, S3.gateTop - a.gateLift);
    g.fillStyle(INK).fillCircle(622, BEAM_Y, 12); g.fillStyle(0x93733b).fillCircle(622, BEAM_Y, 9);
    g.lineStyle(1.5, LIGHT, .7).strokeCircle(622, BEAM_Y, 6); g.fillStyle(INK).fillCircle(622, BEAM_Y, 2);
    g.fillStyle(0x493d26).fillCircle(1070, 195, 11); g.lineStyle(2, GOLD).strokeCircle(1070, 195, 8);
    for (const [x, y] of [[500, leftY], [750, rightY]] as const) {
      this.cord(x, BEAM_Y + (y - 535), x - 60, y); this.cord(x, BEAM_Y + (y - 535), x + 60, y);
      g.fillStyle(0x171b13, .55).fillEllipse(x, y + 10, 144, 16);
      g.fillStyle(0x58472c).fillEllipse(x, y + 4, 134, 20);
      g.fillStyle(0x987845).fillEllipse(x, y, 134, 13);
      g.lineStyle(2, 0xddc185, .8).strokeEllipse(x, y - 1, 134, 13);
      g.lineStyle(1, INK, .4).strokeEllipse(x, y + 2, 116, 8);
      for (let dx = -44; dx < 50; dx += 19) g.lineStyle(1, LIGHT, .3).lineBetween(x + dx, y + 1, x + dx + 9, y + 2);
    }
    const reference = this.props.get('reference');
    if (reference) reference.setPosition(500, leftY - 2);
    else g.fillStyle(STONE).fillRoundedRect(475, leftY - 43, 50, 40, 5);
    const gate = scaleGate(a), door = this.props.get('gate');
    if (door) {
      const frame = SCALE_PROP_FRAMES.gate!;
      const hiddenTop = a.gateLift / S3.gateH * frame.h;
      door.setPosition(gate.x + gate.w / 2, gate.y + gate.h).setCrop(0, hiddenTop, frame.w, frame.h - hiddenTop);
    }
    else { g.fillStyle(0x5e624c).fillRect(gate.x, gate.y, gate.w, gate.h); g.lineStyle(2, GOLD).strokeRect(gate.x, gate.y, gate.w, gate.h); }
    g.fillStyle(INK).fillCircle(S3.latchX, 575, 9); g.lineStyle(2, GOLD, .7).strokeCircle(S3.latchX, 575, 9);
    if (a.braced) { g.lineStyle(7, INK).lineBetween(994, 580, 1048, 568); g.lineStyle(4, 0xafad91).lineBetween(994, 578, 1048, 566); }
    for (const id of SCALE_IDS) {
      const visible = ['WORLD', 'PAN'].includes(a.locations[id]), sprite = this.props.get(id);
      if (sprite) sprite.setVisible(visible);
      if (!visible) continue;
      const { x, feetY: y } = this.itemPoint(a, id), item = SCALE_ITEMS[id];
      g.fillStyle(0x10170e, .4).fillEllipse(x, y - 1, 49, 9);
      if (sprite) sprite.setPosition(x, y);
      else if (id === 'pin') {
        g.lineStyle(8, INK).lineBetween(x - 23, y - 9, x + 23, y - 22);
        g.lineStyle(5, 0x8e9688).lineBetween(x - 23, y - 10, x + 23, y - 23);
        g.lineStyle(1, LIGHT, .7).lineBetween(x - 22, y - 12, x + 21, y - 24);
      } else { g.fillStyle(item.color).fillRoundedRect(x - 23, y - 37, 46, 36, 5); g.lineStyle(2, INK).strokeRoundedRect(x - 23, y - 37, 46, 36, 5); }
      if (showHotspots) g.lineStyle(1, GOLD, .45).strokeCircle(x, y - 21, 31);
    }
    if (a.command) { const point = commandPosition(a, a.command); g.lineStyle(2, LIGHT, .7).strokeCircle(point.x, point.feetY - 8, 12); }
    if (a.closingLeft > 0 && !a.wasBalanced && !a.braced) g.lineStyle(4, 0xe9ae65).strokeRect(1023, 245, 98, 398);
    g.fillStyle(0x0c140d, a.player.grounded ? .4 : .15).fillEllipse(a.player.centerX, a.player.feetY + 1, 32, 7);
    if (this.actor) renderPhoe(this.actor, { ...a.player, holding: SCALE_IDS.some(id => a.locations[id] === 'BAG') }, a.elapsed);
    else g.fillStyle(GOLD).fillRect(a.player.centerX - 18, a.player.feetY - 56, 36, 56);
  }
}
