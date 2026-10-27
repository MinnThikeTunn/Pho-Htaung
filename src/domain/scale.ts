import { C } from '../content/chapter1';
import { S3, SCALE_IDS, SCALE_ITEMS } from '../content/chapter3';
import type { ScaleItemId } from '../content/chapter3';
import { overlapX, overlaps, sweep } from './collision';
import type { Body } from './collision';
import type { Campaign, Player, Rect } from './types';

export type ScaleCommand = { kind: 'item'; id: ScaleItemId } | { kind: 'pan'; id?: ScaleItemId } | { kind: 'latch' };
export type ScaleEvent = 'pickup' | 'placed' | 'retrieved' | 'balanced' | 'closing' | 'braced' | 'blocked' | 'complete';
export interface ScaleAttempt {
  id: string; status: 'WAITING' | 'ACTIVE' | 'COMPLETE'; player: Player; elapsed: number;
  locations: Record<ScaleItemId, 'WORLD' | 'BAG' | 'PAN' | 'LATCH'>;
  gateLift: number; closingLeft: number; wasBalanced: boolean; braced: boolean; gateBlocked: boolean;
  command: ScaleCommand | null; events: ScaleEvent[];
}
export interface ScaleInput { left: boolean; right: boolean; jump: boolean }
export interface ScaleResult { attemptId: string; activeSeconds: number; treasureRecovered: boolean; method: 'WEIGHTS' | 'BRACE' | 'TIMING'; }
export function createScaleAttempt(id: string): ScaleAttempt {
  return { id, status: 'WAITING', elapsed: 0, locations: { stone: 'WORLD', treasure: 'WORLD', crate: 'WORLD', sandbag: 'WORLD', pin: 'WORLD' },
    player: { centerX: S3.spawnX, feetY: S3.floor, vx: 0, vy: 0, grounded: true, support: 'scale_floor', coyote: C.coyote,
      jumpBuffer: 0, control: 'FREE', tauntLeft: 0, facing: 1, pushing: false },
    gateLift: 0, closingLeft: 0, wasBalanced: false, braced: false, gateBlocked: false, command: null, events: [] };
}
export function panWeight(a: ScaleAttempt): number {
  return SCALE_IDS.reduce((sum, id) => sum + (a.locations[id] === 'PAN' ? SCALE_ITEMS[id].weight : 0), 0);
}
export function commandPosition(a: ScaleAttempt, command: ScaleCommand) {
  if (command.kind === 'latch') return { x: S3.latchX, feetY: S3.latchFeetY };
  if (command.kind === 'pan' || a.locations[command.id] === 'PAN') return { x: S3.panX, feetY: S3.panFeetY };
  const item = SCALE_ITEMS[command.id]; return { x: item.x, feetY: item.feetY };
}
export function canReach(a: ScaleAttempt, command: ScaleCommand): boolean {
  const point = commandPosition(a, command);
  return Math.abs(a.player.centerX - point.x) <= S3.reachX && Math.abs(a.player.feetY - point.feetY) <= S3.reachY;
}
export function interactScale(a: ScaleAttempt, command: ScaleCommand): boolean {
  if (a.status === 'COMPLETE' || !canReach(a, command)) return false;
  if (command.kind === 'item') {
    const location = a.locations[command.id];
    if (location !== 'WORLD' && location !== 'PAN') return false;
    a.locations[command.id] = 'BAG'; a.events.push(location === 'PAN' ? 'retrieved' : 'pickup'); return true;
  }
  if (command.kind === 'pan') {
    if (!command.id || a.locations[command.id] !== 'BAG' || SCALE_ITEMS[command.id].weight === 0) return false;
    a.locations[command.id] = 'PAN'; a.events.push('placed'); return true;
  }
  if (a.braced || a.locations.pin !== 'BAG' || a.gateLift < S3.gateTravel - C.epsilon) return false;
  a.braced = true; a.locations.pin = 'LATCH'; a.events.push('braced'); return true;
}
export function queueScaleCommand(a: ScaleAttempt, command: ScaleCommand) {
  if (a.status === 'COMPLETE') return;
  a.command = command;
  if (a.status === 'WAITING') a.status = 'ACTIVE';
}
export function scaleGate(a: ScaleAttempt): Rect {
  return { id: 'scale_gate', x: S3.gateX, y: S3.gateTop - a.gateLift, w: S3.gateW, h: S3.gateH };
}
function body(a: ScaleAttempt): Body {
  return { id: 'phoe', x: a.player.centerX - C.playerW / 2, y: a.player.feetY - C.playerH,
    w: C.playerW, h: C.playerH, vx: a.player.vx, vy: a.player.vy, kind: 'player' };
}
function movePlayer(a: ScaleAttempt, input: ScaleInput, autoDirection: number) {
  const p = a.player;
  p.coyote = p.grounded ? C.coyote : Math.max(0, p.coyote - C.dt);
  p.jumpBuffer = input.jump ? C.buffer : Math.max(0, p.jumpBuffer - C.dt);
  p.vx = (Number(input.right) - Number(input.left) || autoDirection) * C.speed;
  if (p.vx) p.facing = p.vx > 0 ? 1 : -1;
  if (p.jumpBuffer > 0 && p.coyote > 0) { p.vy = C.jump; p.grounded = false; p.coyote = 0; p.jumpBuffer = 0; }
  p.vy = Math.min(C.terminal, p.vy + C.gravity * C.dt);
  const solids: Rect[] = [{ id: 'scale_floor', x: 0, y: S3.floor, w: C.width, h: 80 }, S3.shelf, scaleGate(a)];
  let remaining = C.dt;
  for (let iteration = 0; iteration < 4 && remaining > 1e-8; iteration++) {
    const moving = body(a);
    const candidates = solids.map(r => ({ r, hit: sweep(moving, { ...r, vx: 0, vy: 0, kind: 'solid' }, remaining) }))
      .filter((v): v is { r: Rect; hit: NonNullable<typeof v.hit> } => v.hit !== null)
      .sort((x, y) => x.hit.t - y.hit.t || x.r.id.localeCompare(y.r.id));
    const first = candidates[0];
    if (!first) { p.centerX += p.vx * remaining; p.feetY += p.vy * remaining; remaining = 0; break; }
    p.centerX += p.vx * first.hit.t; p.feetY += p.vy * first.hit.t; remaining -= first.hit.t;
    if (first.hit.nx) p.vx = 0;
    if (first.hit.ny) p.vy = 0;
  }
  p.centerX = Math.max(C.playerW / 2, Math.min(C.width - C.playerW / 2, p.centerX));
  const b = body(a);
  const support = solids.find(r => Math.abs(p.feetY - r.y) < .01 && overlapX(b, r) >= C.landingOverlap);
  p.grounded = Boolean(support); p.support = support?.id ?? null;
}
export function stepScale(a: ScaleAttempt, input: ScaleInput) {
  a.events = [];
  if (a.status === 'COMPLETE') return;
  if (a.status === 'WAITING' && !input.left && !input.right && !input.jump && !a.command) return;
  a.status = 'ACTIVE'; a.elapsed += C.dt;
  // A deliberate direction cancels click-to-walk. Jump preserves the queued shelf pickup.
  if (input.left || input.right) a.command = null;
  let auto = 0;
  if (a.command) {
    const command = a.command, target = commandPosition(a, command);
    if (canReach(a, command)) { interactScale(a, command); a.command = null; }
    else if (command.kind === 'item' && command.id === 'sandbag' && a.locations.sandbag === 'WORLD' && a.player.feetY > S3.shelf.y + C.epsilon) {
      // Approach beside the solid shelf, not beneath it. Once the player's feet
      // clear the top, the same queued click continues toward the bag in midair.
      const edge = a.player.centerX > S3.shelf.x + S3.shelf.w / 2
        ? S3.shelf.x + S3.shelf.w + C.playerW / 2 + 4 : S3.shelf.x - C.playerW / 2 - 4;
      if (Math.abs(edge - a.player.centerX) > C.speed * C.dt) auto = Math.sign(edge - a.player.centerX);
    } else if (Math.abs(target.x - a.player.centerX) > S3.reachX - 4) auto = Math.sign(target.x - a.player.centerX);
  }
  const balanced = panWeight(a) === S3.targetWeight;
  if (balanced && !a.wasBalanced) { a.events.push('balanced'); a.closingLeft = S3.closingWarning; }
  if (!balanced && a.wasBalanced && !a.braced) { a.closingLeft = S3.closingWarning; a.events.push('closing'); }
  a.wasBalanced = balanced;
  if (balanced || a.braced) { a.gateLift = Math.min(S3.gateTravel, a.gateLift + S3.gateSpeed * C.dt); a.gateBlocked = false; }
  else if (a.closingLeft > 0) a.closingLeft = Math.max(0, a.closingLeft - C.dt);
  else if (a.gateLift > 0) {
    const nextLift = Math.max(0, a.gateLift - S3.gateSpeed * C.dt);
    const proposed = { ...scaleGate(a), y: S3.gateTop - nextLift };
    if (overlaps(body(a), proposed)) { if (!a.gateBlocked) a.events.push('blocked'); a.gateBlocked = true; }
    else { a.gateLift = nextLift; a.gateBlocked = false; }
  }
  movePlayer(a, input, auto);
  if (a.player.grounded && Math.abs(a.player.feetY - S3.floor) < .01 && a.player.centerX >= S3.exitX) {
    a.status = 'COMPLETE'; a.player.control = 'EXITING'; a.player.vx = 0; a.command = null; a.events.push('complete');
  }
}
export function settleScale(current: Campaign, a: ScaleAttempt): Campaign {
  if (!current.chapter2Completed || !a.id || a.status !== 'COMPLETE' || a.player.control !== 'EXITING' ||
    !a.player.grounded || !Number.isFinite(a.player.centerX) || !Number.isFinite(a.player.feetY) ||
    a.player.centerX < S3.exitX || Math.abs(a.player.feetY - S3.floor) > .01 ||
    !Number.isFinite(a.elapsed) || a.elapsed < 0) throw Error('Invalid Chapter 3 exit');
  const receipt = `scale:${a.id}`;
  if (current.completedAttemptIds.includes(receipt)) return current;
  const next = structuredClone(current);
  next.completedAttemptIds.push(receipt); next.chapter3Completed = true;
  next.chapter3TreasureRecovered = Boolean(current.chapter3TreasureRecovered) || a.locations.treasure === 'BAG';
  next.lastChapter3Result = { attemptId: a.id, activeSeconds: a.elapsed, treasureRecovered: a.locations.treasure === 'BAG',
    method: a.braced ? 'BRACE' : panWeight(a) === S3.targetWeight ? 'WEIGHTS' : 'TIMING' };
  next.resumeAt = 'CHAPTER_4_PENDING'; next.revision++;
  // Reward amount is not owner-defined. Record the relic, never silently mint wallet coins.
  return next;
}
