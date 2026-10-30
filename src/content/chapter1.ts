import type { Rect } from '../domain/types';

export const C = Object.freeze({
  width: 1280, height: 720, floor: 640, dt: 1 / 60, epsilon: 1e-4,
  playerW: 36, playerH: 56, speed: 220, gravity: 1200, jump: -570, terminal: 900,
  coyote: 0.08, buffer: 0.10, push: 90, taunt: 0.35, restartHold: 0.5,
  firstReady: 4, ready: 2, track: 0.55, lock: 0.85, recover: 0.8,
  rock: 96, spawnBottom: 128, aimMin: 64, aimMax: 1168,
  landingOverlap: 8, woodOverlap: 8, plateOverlap: 48, plateTolerance: 1,
  liftHome: 544, liftRaised: 424, liftUp: 120, liftDown: 80,
  deathFreeze: 0.25, resetFade: 0.65, deathTotal: 0.9, exitFade: 0.35, linkTime: 2,
  maxCoins: 15, maxSteps: 8,
});
export const GROUND: Readonly<Rect> = { id: 'ground', x: 0, y: 640, w: 1280, h: 80 };
export const STEP: Readonly<Rect> = { id: 'fixed_step', x: 480, y: 544, w: 112, h: 96 };
export const GATE: Readonly<Rect> = { id: 'wood_gate', x: 1104, y: 360, w: 64, h: 280 };
export const SHELF: Readonly<Rect> = { id: 'gold_shelf', x: 824, y: 320, w: 144, h: 16 };
export const PLATE: Readonly<Rect> = { id: 'pressure_plate', x: 336, y: 632, w: 128, h: 8 };
export const liftRect = (y: number): Rect => ({ id: 'lift', x: 640, y, w: 128, h: 16 });
export const CH2_BOMB_COIN_ID = 'coin_04';
export const COINS = [160, 208, 256, 304, 352].map((x, i) => Object.freeze({ id: `coin_0${i + 1}`, x, y: 616, value: 1, size: 20, isBomb: `coin_0${i + 1}` === CH2_BOMB_COIN_ID }));
export const POUCH = Object.freeze({ id: 'gold_pouch', x: 896, y: 308, value: 10, size: 24 });
export const CH2_POLE_SPAWN = Object.freeze({ id: 'ch2_bamboo_pole', x: 536, y: 524 });
export const CH2_COG_SPAWN = Object.freeze({ id: 'ch2_cog', x: 860, y: 304 });
export const CH2_GEARBOX_RECT: Readonly<Rect> = Object.freeze({ id: 'gear_box', x: 1084, y: 340, w: 48, h: 48 });
export const PLATFORM_MID: Readonly<Rect> = Object.freeze({ id: 'plat_mid', x: 380, y: 404, w: 140, h: 16 });
export const PLATFORM_HIGH: Readonly<Rect> = Object.freeze({ id: 'plat_high', x: 130, y: 304, w: 150, h: 16 });
export const CH2_SLINGSHOT_SPAWN = Object.freeze({ id: 'ch2_slingshot', x: 205, y: 284 });
export const CH2_TRAP_RANGE = Object.freeze({ minX: 1150, maxX: 1220 });
export const CH2_STEAM_NOZZLE_POS = Object.freeze({ x: 100, y: 300 });
export const CH2_CRUSHER_START_POS = Object.freeze({ x: 200, y: 80 });
export const CH2_ANCIENT_BRICK_SPAWN = Object.freeze({ x: 200, y: 100, size: 32 });
export const CH2_GEAR_HOUSING_POS = Object.freeze({ x: 1104, y: 120, w: 40, h: 40 });
