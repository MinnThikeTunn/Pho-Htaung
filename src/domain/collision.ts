import { C } from '../content/chapter1';
import type { Rect } from './types';
export const overlapX = (a: Rect, b: Rect) => Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
export const overlapY = (a: Rect, b: Rect) => Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
export const overlaps = (a: Rect, b: Rect) => overlapX(a, b) > C.epsilon && overlapY(a, b) > C.epsilon;
export interface Body extends Rect { vx: number; vy: number; kind: 'player' | 'rock' | 'solid' | 'wood'; falling?: boolean; support?: string | null }
export interface Hit { t: number; nx: number; ny: number }

/** Relative linear sweep. A touching body moving away is not a new impact. */
export function sweep(a: Body, b: Body, duration: number): Hit | null {
  const vx = a.vx - b.vx, vy = a.vy - b.vy;
  const axis = (lo: number, hi: number, bLo: number, bHi: number, v: number): [number, number] => {
    if (Math.abs(v) < C.epsilon) return hi <= bLo + C.epsilon || lo >= bHi - C.epsilon ? [Infinity, -Infinity] : [-Infinity, Infinity];
    const t1 = (bLo - hi) / v, t2 = (bHi - lo) / v;
    return [Math.min(t1, t2), Math.max(t1, t2)];
  };
  const [xe, xx] = axis(a.x, a.x + a.w, b.x, b.x + b.w, vx);
  const [ye, yx] = axis(a.y, a.y + a.h, b.y, b.y + b.h, vy);
  const enter = Math.max(xe, ye), exit = Math.min(xx, yx);
  if (!Number.isFinite(enter) || enter < -1e-8 || enter > duration + 1e-8 || enter > exit + 1e-8) return null;
  return xe > ye ? { t: Math.max(0, enter), nx: vx > 0 ? -1 : 1, ny: 0 }
    : { t: Math.max(0, enter), nx: 0, ny: vy > 0 ? -1 : 1 };
}
