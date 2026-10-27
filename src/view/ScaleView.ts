import Phaser from 'phaser';
import { C } from '../content/chapter1';
import { S3, SCALE_IDS, SCALE_ITEMS } from '../content/chapter3';
import type { ScaleItemId } from '../content/chapter3';
import { commandPosition, panWeight, scaleGate } from '../domain/scale';
import type { ScaleAttempt } from '../domain/scale';
import { createPhoe, renderPhoe } from './PhoeHtaungView';

const INK = 0x192d24, GOLD = 0xedc675, STONE = 0x667964;
/** Original procedural placeholder scenery; existing shared character atlas is reused. */
export class ScaleView {
  private g: Phaser.GameObjects.Graphics;
  private actor: ReturnType<typeof createPhoe>;
  constructor(scene: Phaser.Scene) {
    if (scene.textures.exists('background')) scene.add.image(640, 360, 'background').setDisplaySize(C.width, C.height).setTint(0x8b9d80).setAlpha(.27);
    scene.add.rectangle(640, 360, C.width, C.height, 0x243c30, .55);
    const bg = scene.add.graphics();
    for (const x of [36, 1150]) {
      bg.fillStyle(0x344e3c).fillRoundedRect(x, 185, 86, 455, 12);
      bg.fillStyle(0x61725a).fillRect(x - 9, 185, 104, 15).fillRect(x - 9, 622, 104, 18);
      for (let y = 240; y < 600; y += 65) bg.lineStyle(2, INK, .6).lineBetween(x, y, x + 86, y);
    }
    // Carved statue is visibly scenery in a recessed niche, not a moving enemy.
    bg.fillStyle(INK, .5).fillRoundedRect(520, 210, 210, 430, 80);
    bg.fillStyle(STONE).fillRoundedRect(576, 360, 92, 252, 24).fillEllipse(622, 315, 92, 110);
    bg.fillStyle(0x8d9b7a).fillTriangle(575, 275, 622, 209, 668, 275);
    bg.lineStyle(5, INK).lineBetween(596, 314, 608, 314).lineBetween(636, 314, 648, 314).lineBetween(609, 344, 635, 344);
    bg.fillStyle(0x53694f).fillRoundedRect(548, 606, 150, 34, 6);
    bg.fillStyle(0x293e2d).fillRect(0, 640, 1280, 80);
    bg.fillStyle(0x91a07b).fillRect(0, 640, 1280, 7);
    for (let x = 0; x < 1280; x += 90) bg.lineStyle(2, INK, .4).lineBetween(x, 650, x + 10, 720);
    bg.fillStyle(INK).fillRect(S3.shelf.x - 3, S3.shelf.y - 3, S3.shelf.w + 6, S3.shelf.h + 6);
    bg.fillStyle(0xa3764d).fillRect(S3.shelf.x, S3.shelf.y, S3.shelf.w, S3.shelf.h);
    bg.lineStyle(7, 0x785b3e).lineBetween(313, 550, 335, 581).lineBetween(437, 550, 415, 581);
    bg.fillStyle(0xc5ad68, .18).fillRect(1104, 330, 176, 310);
    bg.lineStyle(10, STONE).strokeRect(1030, 250, 84, 390);
    bg.lineStyle(3, GOLD, .6).lineBetween(1170, 555, 1240, 555).lineBetween(1225, 544, 1240, 555).lineBetween(1225, 566, 1240, 555);
    this.g = scene.add.graphics().setDepth(10);
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
  render(a: ScaleAttempt, showHotspots: boolean) {
    const g = this.g; g.clear(); const rightY = this.panY(a), leftY = 1070 - rightY;
    // Continuous visible linkage: pans → pivot → gate cable.
    g.lineStyle(9, INK).lineBetween(500, 290 - (rightY - 535), 750, 290 + (rightY - 535));
    g.lineStyle(5, GOLD).lineBetween(500, 290 - (rightY - 535), 750, 290 + (rightY - 535));
    g.lineStyle(3, 0xa6ae8b).lineBetween(622, 290, 622, 195).lineBetween(622, 195, 1070, 195).lineBetween(1070, 195, 1070, S3.gateTop - a.gateLift);
    for (const [x, y] of [[500, leftY], [750, rightY]] as const) {
      g.lineStyle(2, GOLD).lineBetween(x, 290 + (y - 535), x - 60, y).lineBetween(x, 290 + (y - 535), x + 60, y);
      g.fillStyle(INK).fillEllipse(x, y + 3, 142, 20);
      g.fillStyle(0xac9e65).fillEllipse(x, y, 132, 16);
    }
    g.fillStyle(STONE).fillRoundedRect(475, leftY - 43, 50, 40, 6);
    g.lineStyle(3, GOLD).strokeRoundedRect(475, leftY - 43, 50, 40, 6);
    const gate = scaleGate(a);
    g.fillStyle(0x405744).fillRect(gate.x, gate.y, gate.w, gate.h);
    g.lineStyle(3, 0xa7ad7d).strokeRect(gate.x, gate.y, gate.w, gate.h);
    for (let y = gate.y + 25; y < gate.y + gate.h; y += 45) g.lineStyle(2, INK).lineBetween(gate.x + 4, y, gate.x + gate.w - 4, y);
    g.fillStyle(a.braced ? GOLD : INK).fillCircle(S3.latchX, 575, 9);
    if (a.braced) g.lineStyle(6, GOLD).lineBetween(994, 580, 1048, 568);
    for (const id of SCALE_IDS) {
      if (!['WORLD', 'PAN'].includes(a.locations[id])) continue;
      const { x, feetY: y } = this.itemPoint(a, id), item = SCALE_ITEMS[id];
      g.lineStyle(3, INK).fillStyle(item.color);
      if (id === 'pin') g.lineStyle(7, item.color).lineBetween(x - 23, y - 9, x + 23, y - 22);
      else if (id === 'treasure') {
        g.fillCircle(x, y - 41, 11).fillTriangle(x, y - 33, x - 21, y - 4, x + 21, y - 4);
        g.lineStyle(3, INK).strokeTriangle(x, y - 33, x - 21, y - 4, x + 21, y - 4);
      } else {
        g.fillRoundedRect(x - 23, y - 37, 46, 36, id === 'sandbag' ? 12 : 4).strokeRoundedRect(x - 23, y - 37, 46, 36, id === 'sandbag' ? 12 : 4);
        if (id === 'crate') g.lineStyle(3, INK).lineBetween(x - 20, y - 34, x + 20, y - 4).lineBetween(x + 20, y - 34, x - 20, y - 4);
      }
      if (showHotspots) g.lineStyle(2, GOLD, .65).strokeCircle(x, y - 21, 31);
    }
    if (a.command) {
      const point = commandPosition(a, a.command);
      g.lineStyle(2, GOLD, .7).strokeCircle(point.x, point.feetY - 8, 12);
    }
    if (a.closingLeft > 0 && !a.wasBalanced && !a.braced) {
      g.lineStyle(4, 0xe9ae65).strokeRect(1023, 245, 98, 398);
    }
    if (this.actor) renderPhoe(this.actor, { ...a.player, holding: SCALE_IDS.some(id => a.locations[id] === 'BAG') }, a.elapsed);
    else g.fillStyle(GOLD).fillRect(a.player.centerX - 18, a.player.feetY - 56, 36, 56);
  }
}
