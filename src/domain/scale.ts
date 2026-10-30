import { C } from '../content/chapter1';
import { S3, SCALE_IDS, SCALE_ITEMS, WEIGHT_PROFILES } from '../content/chapter3';
import type { ScaleItemId } from '../content/chapter3';
import { overlapX, overlaps, sweep } from './collision';
import type { Body } from './collision';
import type { Campaign, Player, Rect } from './types';

export type PanSide = 'LEFT' | 'RIGHT';
export type ScaleItemLocation = 'WORLD' | 'BAG' | 'PAN' | 'LEFT_PAN' | 'RIGHT_PAN' | 'LATCH';

export type ScaleCommand = 
  | { kind: 'item'; id: ScaleItemId } 
  | { kind: 'pan'; pan?: PanSide; id?: ScaleItemId } 
  | { kind: 'latch' };

export type ScaleEvent = 'pickup' | 'placed' | 'retrieved' | 'balanced' | 'closing' | 'braced' | 'blocked' | 'complete' | 'pendulum_slapstick' | 'pendulum_death';

export interface ScaleAttempt {
  id: string; status: 'WAITING' | 'ACTIVE' | 'COMPLETE' | 'DEAD'; player: Player; elapsed: number;
  locations: Record<ScaleItemId, ScaleItemLocation>;
  weights: Record<ScaleItemId, number>;
  gateLift: number; closingLeft: number; wasBalanced: boolean; braced: boolean; gateBlocked: boolean;
  command: ScaleCommand | null; events: ScaleEvent[];
  pendulum: {
    angle: number;
    x: number;
    y: number;
    active: boolean;
    slapstickTriggered: boolean;
    slapstickTimer: number;
  };
}
export interface ScaleInput { left: boolean; right: boolean; jump: boolean; down?: boolean; }
export interface ScaleResult { attemptId: string; activeSeconds: number; treasureRecovered: boolean; method: 'WEIGHTS' | 'BRACE' | 'TIMING'; }

function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function createScaleAttempt(id: string): ScaleAttempt {
  const arm = (S3.pendulum.bottomY - S3.pendulum.halfHeight) - S3.pendulum.pivotY;
  const profileIdx = Math.abs(hashSeed(id)) % WEIGHT_PROFILES.length;
  const weights = { ...(WEIGHT_PROFILES[profileIdx] ?? WEIGHT_PROFILES[0]) } as Record<ScaleItemId, number>;
  return { id, status: 'WAITING', elapsed: 0,
    locations: {
      stone: 'WORLD',
      treasure: 'WORLD',
      crate: 'WORLD',
      sandbag: 'WORLD',
      pin: 'WORLD',
      reference: 'LEFT_PAN',
      betel_cutter: 'WORLD',
      bamboo_pole: 'WORLD',
      rusty_cog: 'WORLD',
      slingshot: 'WORLD',
    },
    weights,
    player: { centerX: S3.spawnX, feetY: S3.floor, vx: 0, vy: 0, grounded: true, support: 'scale_floor', coyote: C.coyote,
      jumpBuffer: 0, control: 'FREE', tauntLeft: 0, facing: 1, pushing: false },
    gateLift: 0, closingLeft: 0, wasBalanced: false, braced: false, gateBlocked: false, command: null, events: [],
    pendulum: {
      angle: 0,
      x: S3.pendulum.pivotX,
      y: S3.pendulum.pivotY + arm,
      active: true,
      slapstickTriggered: false,
      slapstickTimer: 0,
    } };
}

export function leftWeight(a: ScaleAttempt): number {
  return (SCALE_IDS as ScaleItemId[]).reduce((sum, id) => {
    const loc = a.locations[id];
    return sum + (loc === 'LEFT_PAN' ? (a.weights[id] ?? SCALE_ITEMS[id]?.weight ?? 0) : 0);
  }, 0);
}

export function rightWeight(a: ScaleAttempt): number {
  return (SCALE_IDS as ScaleItemId[]).reduce((sum, id) => {
    const loc = a.locations[id];
    return sum + ((loc === 'RIGHT_PAN' || loc === 'PAN') ? (a.weights[id] ?? SCALE_ITEMS[id]?.weight ?? 0) : 0);
  }, 0);
}

export function panWeight(a: ScaleAttempt): number {
  return rightWeight(a);
}

export function commandPosition(a: ScaleAttempt, command: ScaleCommand) {
  if (command.kind === 'latch') return { x: S3.latchX, feetY: S3.latchFeetY };
  if (command.kind === 'pan') {
    const side = command.pan ?? (command.id && a.locations[command.id] === 'LEFT_PAN' ? 'LEFT' : 'RIGHT');
    return side === 'LEFT' ? { x: S3.leftPanX, feetY: S3.leftPanFeetY } : { x: S3.panX, feetY: S3.panFeetY };
  }
  const item = SCALE_ITEMS[command.id];
  if (item) {
    if (a.locations[command.id] === 'LEFT_PAN') return { x: S3.leftPanX, feetY: S3.leftPanFeetY };
    if (a.locations[command.id] === 'RIGHT_PAN' || a.locations[command.id] === 'PAN') return { x: S3.panX, feetY: S3.panFeetY };
    return { x: item.x, feetY: item.feetY };
  }
  return { x: S3.spawnX, feetY: S3.floor };
}

export function canReach(a: ScaleAttempt, command: ScaleCommand): boolean {
  const point = commandPosition(a, command);
  return Math.abs(a.player.centerX - point.x) <= S3.reachX && Math.abs(a.player.feetY - point.feetY) <= S3.reachY;
}
export function interactScale(a: ScaleAttempt, command: ScaleCommand): boolean {
  if (a.status === 'COMPLETE' || a.status === 'DEAD' || !canReach(a, command)) return false;
  if (command.kind === 'item') {
    if (command.id === 'reference') return false; // Permanent immovable counterweight on left pan
    const location = a.locations[command.id];
    if (location !== 'WORLD' && location !== 'PAN' && location !== 'RIGHT_PAN' && location !== 'LEFT_PAN') return false;
    a.locations[command.id] = 'BAG';
    a.events.push((location === 'PAN' || location === 'RIGHT_PAN' || location === 'LEFT_PAN') ? 'retrieved' : 'pickup');
    return true;
  }
  if (command.kind === 'pan') {
    if (!command.id || a.locations[command.id] !== 'BAG' || command.id === 'pin') return false;
    const itemWeight = a.weights[command.id] ?? SCALE_ITEMS[command.id]?.weight ?? 0;
    if (itemWeight <= 0) return false;
    const dest = (command.pan === 'LEFT') ? 'LEFT_PAN' : 'PAN';
    a.locations[command.id] = dest;
    a.events.push('placed');
    return true;
  }
  if (a.braced || a.locations.pin !== 'BAG' || a.gateLift < S3.gateTravel - C.epsilon) return false;
  a.braced = true; a.locations.pin = 'LATCH'; a.events.push('braced'); return true;
}
export function queueScaleCommand(a: ScaleAttempt, command: ScaleCommand) {
  if (a.status === 'COMPLETE' || a.status === 'DEAD') return;
  a.command = command;
  if (a.status === 'WAITING') a.status = 'ACTIVE';
}
export function scaleGate(a: ScaleAttempt): Rect {
  return { id: 'scale_gate', x: S3.gateX, y: S3.gateTop - a.gateLift, w: S3.gateW, h: S3.gateH };
}
function body(a: ScaleAttempt): Body {
  const isLaying = a.player.control === 'LAYING';
  const h = isLaying ? Math.round(C.playerH * 0.45) : C.playerH; // 25.2px (55% reduction)
  const w = isLaying ? Math.round(C.playerW * 1.3) : C.playerW;
  return { id: 'phoe', x: a.player.centerX - w / 2, y: a.player.feetY - h, w, h, vx: a.player.vx, vy: a.player.vy, kind: 'player' };
}
function movePlayer(a: ScaleAttempt, input: ScaleInput, autoDirection: number) {
  const p = a.player;
  if (a.player.control === 'FREE' && input.down && a.player.grounded) {
    a.player.control = 'LAYING';
  } else if (a.player.control === 'LAYING') {
    if (!input.down || !a.player.grounded || input.jump) {
      a.player.control = 'FREE';
    }
  }
  p.coyote = p.grounded ? C.coyote : Math.max(0, p.coyote - C.dt);
  p.jumpBuffer = input.jump && a.player.control === 'FREE' ? C.buffer : Math.max(0, p.jumpBuffer - C.dt);
  if (a.player.control === 'LAYING') {
    p.vx = (Number(input.right) - Number(input.left) || autoDirection) * (C.speed * 0.40);
  } else {
    p.vx = (Number(input.right) - Number(input.left) || autoDirection) * C.speed;
  }
  if (p.vx) p.facing = p.vx > 0 ? 1 : -1;
  if (a.player.control === 'FREE' && p.jumpBuffer > 0 && p.coyote > 0) { p.vy = C.jump; p.grounded = false; p.coyote = 0; p.jumpBuffer = 0; }
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
  const currentW = a.player.control === 'LAYING' ? Math.round(C.playerW * 1.3) : C.playerW;
  p.centerX = Math.max(currentW / 2, Math.min(C.width - currentW / 2, p.centerX));
  const b = body(a);
  const support = solids.find(r => Math.abs(p.feetY - r.y) < .01 && overlapX(b, r) >= C.landingOverlap);
  p.grounded = Boolean(support); p.support = support?.id ?? null;
}
export function stepScale(a: ScaleAttempt, input: ScaleInput) {
  a.events = [];
  if (a.status === 'COMPLETE' || a.status === 'DEAD') return;
  if (a.status === 'WAITING' && !input.left && !input.right && !input.jump && !input.down && !a.command) return;
  a.status = 'ACTIVE'; a.elapsed += C.dt;
  // A deliberate direction cancels click-to-walk. Jump preserves the queued shelf pickup.
  if (input.left || input.right || input.down) a.command = null;
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
  const lW = leftWeight(a);
  const rW = rightWeight(a);
  const balanced = (lW > 0 && lW === rW) || (lW === 0 && rW === S3.targetWeight);
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

  // Pendulum motion update using harmonic oscillation
  const t = a.elapsed;
  const maxAngle = S3.pendulum.maxAngle; // radians (~15 degrees, reaching x between 465 and 695)
  const arm = (S3.pendulum.bottomY - S3.pendulum.halfHeight) - S3.pendulum.pivotY;
  a.pendulum.angle = Math.sin((t * Math.PI * 2) / S3.pendulum.period) * maxAngle;
  a.pendulum.x = S3.pendulum.pivotX + Math.sin(a.pendulum.angle) * S3.pendulum.length;
  a.pendulum.y = S3.pendulum.pivotY + Math.cos(a.pendulum.angle) * arm;

  if (a.braced || balanced) {
    a.pendulum.active = false;
  }
  if (a.pendulum.slapstickTimer > 0) {
    a.pendulum.slapstickTimer = Math.max(0, a.pendulum.slapstickTimer - C.dt);
  }

  // Auto-duck under swinging pendulum if moving via queued click command
  if (a.command && a.pendulum.active && Math.abs(a.pendulum.x - a.player.centerX) < 65 && a.player.grounded) {
    a.player.control = 'LAYING';
  }

  // Pendulum collision check: only when active and after initial FTUE grace period (elapsed >= 1.5s)
  if (a.pendulum.active && a.elapsed >= 1.5) {
    const gongRect: Rect = {
      id: 'kyee_zee',
      x: a.pendulum.x - S3.pendulum.halfWidth,
      y: a.pendulum.y - S3.pendulum.halfHeight,
      w: S3.pendulum.halfWidth * 2,
      h: S3.pendulum.halfHeight * 2,
    };
    if (overlaps(body(a), gongRect) && a.player.control !== 'LAYING') {
      if (a.pendulum.slapstickTimer <= 0) {
        if (!a.pendulum.slapstickTriggered) {
          a.pendulum.slapstickTriggered = true;
          a.pendulum.slapstickTimer = 2.0;
          a.events.push('pendulum_slapstick');
        } else {
          a.status = 'DEAD';
          a.player.control = 'DEAD';
          a.player.vx = 0;
          a.command = null;
          a.events.push('pendulum_death');
          return;
        }
      }
    }
  }

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
  if (!current.chapter4Completed) next.resumeAt = 'CHAPTER_4_PENDING'; next.revision++;
  // Reward amount is not owner-defined. Record the relic, never silently mint wallet coins.
  return next;
}
