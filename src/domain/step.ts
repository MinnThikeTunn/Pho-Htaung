import { C, GATE, GROUND, PLATE, SHELF, STEP, liftRect, CH2_POLE_SPAWN, CH2_COG_SPAWN, PLATFORM_MID, PLATFORM_HIGH, CH2_SLINGSHOT_SPAWN, CH2_TRAP_RANGE } from '../content/chapter1';
import { overlaps, overlapX, overlapY, sweep } from './collision';
import type { Body, Hit } from './collision';
import type { Attempt, Input, Player, Rect, Stone } from './types';

export const playerRect = (p: Player): Rect => ({ id: 'player', x: p.centerX - C.playerW / 2, y: p.feetY - C.playerH, w: C.playerW, h: C.playerH });
export const stoneRect = (s: Stone): Rect => ({ id: s.id, x: s.centerX - C.rock / 2, y: s.bottomY - C.rock, w: C.rock, h: C.rock });
export function solids(a: Attempt): Rect[] {
  return [GROUND, STEP, liftRect(a.liftY), ...(a.gateIntact ? [GATE] : []), ...(a.shelfIntact ? [SHELF] : []), ...(a.platformsRevealed ? [PLATFORM_MID, PLATFORM_HIGH] : [])];
}
export function weighted(a: Attempt): boolean {
  return a.stones.some(s => s.state !== 'FALLING' && s.support === 'ground' && Math.abs(s.bottomY - C.floor) <= C.plateTolerance && overlapX(stoneRect(s), PLATE) >= C.plateOverlap - C.epsilon);
}
function supportAt(r: Rect, surfaces: Rect[]): string | null {
  return surfaces.find(b => b.id !== r.id && Math.abs(r.y + r.h - b.y) <= C.epsilon && overlapX(r, b) >= C.landingOverlap - C.epsilon)?.id ?? null;
}
function refreshSupports(a: Attempt): void {
  const surfaces = solids(a);
  for (const rock of a.stones) {
    if (rock.state === 'FALLING') continue;
    rock.support = supportAt(stoneRect(rock), surfaces);
    if (!rock.support) { rock.state = 'FALLING'; rock.vy = 0; }
    else rock.state = rock.support === 'ground' ? 'SETTLED' : 'SUPPORTED';
  }
  const p = a.player;
  p.support = p.vy >= 0 ? supportAt(playerRect(p), [...surfaces, ...a.stones.filter(s => s.state !== 'FALLING').map(stoneRect)]) : null;
  p.grounded = p.support !== null;
  if (p.grounded) p.vy = 0;
}

function updateMachine(a: Attempt, input: Input, dt: number): void {
  const m = a.machine, p = a.player;
  if (input.taunt && p.grounded && p.control === 'FREE' && m.state === 'READY') {
    m.state = 'TRACK'; m.elapsed = 0; p.control = 'TAUNTING'; p.tauntLeft = C.taunt;
    a.events.push({ kind: 'taunt' });
  }
  if (m.state === 'TRACK') m.targetX = Math.min(C.aimMax, Math.max(C.aimMin, p.centerX));
  if (m.state === 'DROP') return;
  m.elapsed += dt;
  const duration = m.state === 'READY' ? m.readyDuration : m.state === 'TRACK' ? C.track : m.state === 'LOCKED' ? C.lock : C.recover;
  if (m.elapsed + 1e-9 < duration) return;
  m.elapsed = Math.max(0, m.elapsed - duration);
  if (m.state === 'READY') {
    m.state = 'TRACK'; m.targetX = Math.min(C.aimMax, Math.max(C.aimMin, p.centerX));
  } else if (m.state === 'TRACK') { m.state = 'LOCKED'; a.events.push({ kind: 'lock', x: m.targetX }); }
  else if (m.state === 'LOCKED') {
    const id = `shot_${a.nextStone++}`;
    a.stones.push({ id, centerX: m.targetX, bottomY: C.spawnBottom, vy: 0, state: 'FALLING', support: null });
    m.state = 'DROP'; m.shotId = id; m.elapsed = 0;
    a.events.push({ kind: 'drop', x: m.targetX, y: C.spawnBottom });
  } else { m.state = 'READY'; m.readyDuration = C.ready; }
}

/** Resolve horizontal displacement for the entire touching supported-rock chain. */
function push(a: Attempt, direction: number, dt: number): void {
  const p = a.player;
  if (!p.grounded || !direction || p.control !== 'FREE') return;
  const pr = playerRect(p), reach = C.speed * dt;
  const rocks = a.stones.filter(s => s.state !== 'FALLING');
  const first = rocks.find(s => {
    const r = stoneRect(s), gap = direction > 0 ? r.x - (pr.x + pr.w) : pr.x - (r.x + r.w);
    return gap >= -C.epsilon && gap <= reach + C.epsilon && overlapY(pr, r) > C.epsilon;
  });
  if (!first) return;
  const chain = [first];
  for (let i = 0; i < chain.length; i++) {
    const r = stoneRect(chain[i]!);
    for (const s of rocks) {
      if (chain.includes(s)) continue;
      const b = stoneRect(s), gap = direction > 0 ? b.x - (r.x + r.w) : r.x - (b.x + b.w);
      if (gap >= -C.epsilon && gap <= C.push * dt + C.epsilon && overlapY(r, b) > C.epsilon) chain.push(s);
    }
  }
  let distance = C.push * dt;
  for (const s of chain) {
    const r = stoneRect(s);
    distance = Math.min(distance, direction > 0 ? C.width - (r.x + r.w) : r.x);
    for (const b of [...solids(a), ...rocks.filter(v => !chain.includes(v)).map(stoneRect)]) {
      if (overlapY(r, b) <= C.epsilon) continue;
      const gap = direction > 0 ? b.x - (r.x + r.w) : r.x - (b.x + b.w);
      if (gap >= -C.epsilon) distance = Math.min(distance, Math.max(0, gap));
    }
  }
  for (const s of chain) s.centerX += direction * Math.max(0, distance);
  p.vx = direction * (distance / dt);
  p.pushing = distance > C.epsilon;
}

function moveLift(a: Attempt, dt: number): void {
  const lift = liftRect(a.liftY), p = a.player;
  let delta = a.plateWeighted ? -Math.min(a.liftY - C.liftRaised, C.liftUp * dt)
    : Math.min(C.liftHome - a.liftY, C.liftDown * dt);
  const carried = a.stones.filter(s => s.support === 'lift' && s.state !== 'FALLING');
  const carryPlayer = p.grounded && p.support === 'lift';
  const foreign = [...a.stones.filter(s => !carried.includes(s)).map(stoneRect), ...(!carryPlayer ? [playerRect(p)] : [])];
  if (delta > 0) {
    for (const r of foreign) if (overlapX(lift, r) > C.epsilon && r.y >= lift.y + lift.h - C.epsilon)
      delta = Math.min(delta, Math.max(0, r.y - lift.y - lift.h));
  } else if (delta < 0) {
    const carriedRects = [...carried.map(stoneRect), ...(carryPlayer ? [playerRect(p)] : []), lift];
    for (const r of carriedRects) for (const b of [...solids(a).filter(v => v.id !== 'lift'), ...foreign]) {
      if (overlapX(r, b) > C.epsilon && b.y + b.h <= r.y + C.epsilon)
        delta = Math.max(delta, b.y + b.h - r.y);
    }
  }
  a.liftY += delta;
  for (const s of carried) s.bottomY += delta;
  if (carryPlayer) p.feetY += delta;
}

interface Candidate extends Hit { a: Body; b: Body; priority: number }
function simulate(a: Attempt, dt: number): void {
  const p = a.player;
  const bodies: Body[] = [
    { ...playerRect(p), vx: p.vx, vy: p.vy + (p.grounded ? 0 : C.gravity * dt / 2), kind: 'player', support: p.support },
    ...a.stones.map(s => ({ ...stoneRect(s), vx: 0, vy: s.state === 'FALLING' ? s.vy + C.gravity * dt / 2 : 0,
      kind: 'rock' as const, falling: s.state === 'FALLING', support: s.support })),
    ...solids(a).map(r => ({ ...r, vx: 0, vy: 0, kind: r.id === GATE.id || r.id === SHELF.id ? 'wood' as const : 'solid' as const })),
    { id: 'left', x: -100, y: -2000, w: 100, h: 4000, vx: 0, vy: 0, kind: 'solid' },
    { id: 'right', x: C.width, y: -2000, w: 100, h: 4000, vx: 0, vy: 0, kind: 'solid' },
  ];
  let remaining = dt, iterations = 0;
  const removed = new Set<string>();
  const aliveBodies = () => bodies.filter(b => !removed.has(b.id));
  const advance = (seconds: number) => { for (const b of aliveBodies()) { b.x += b.vx * seconds; b.y += b.vy * seconds; } };
  const shotResolved = (id: string) => {
    if (a.machine.shotId === id) { a.machine.state = 'RECOVER'; a.machine.elapsed = 0; a.machine.shotId = null; }
  };
  while (remaining > 1e-9 && a.status === 'ACTIVE') {
    if (++iterations > 128) throw new Error(`Collision iteration limit in ${a.id}`);
    const active = aliveBodies();
    const hits: Candidate[] = [];
    for (const moving of active) {
      if (moving.kind !== 'player' && !(moving.kind === 'rock' && moving.falling)) continue;
      for (const target of active) {
        if (moving === target || (moving.kind === 'player' && target.kind === 'rock' && target.falling)) continue;
        if (moving.kind === 'rock' && target.kind === 'rock' && target.falling && moving.id > target.id) continue;
        const hit = sweep(moving, target, remaining);
        if (!hit) continue;
        const atImpact: Rect = { ...moving, x: moving.x + moving.vx * hit.t, y: moving.y + moving.vy * hit.t };
        const otherAtImpact: Rect = { ...target, x: target.x + target.vx * hit.t, y: target.y + target.vy * hit.t };
        if (moving.kind === 'player' && hit.ny === -1 && overlapX(atImpact, otherAtImpact) < C.landingOverlap - C.epsilon) continue;
        if (moving.kind === 'rock' && target.kind === 'wood' && overlapX(atImpact, otherAtImpact) < C.woodOverlap - C.epsilon) continue;
        const priority = target.kind === 'player' ? 0 : target.kind === 'rock' && moving.kind === 'rock' ? 1 : target.kind === 'wood' && moving.kind === 'rock' ? 2 : 3;
        hits.push({ ...hit, a: moving, b: target, priority });
      }
    }
    hits.sort((u, v) => Math.abs(u.t - v.t) > 1e-8 ? u.t - v.t : u.priority - v.priority || u.a.id.localeCompare(v.a.id) || u.b.id.localeCompare(v.b.id));
    const hit = hits[0];
    if (!hit) { advance(remaining); remaining = 0; break; }
    advance(hit.t); remaining = Math.max(0, remaining - hit.t);
    const { a: moving, b: target } = hit;
    if (moving.kind === 'rock' && target.kind === 'player') {
      a.status = 'DEAD'; p.control = 'DEAD'; a.events.push({ kind: 'death', x: p.centerX, y: p.feetY }); break;
    }
    if (moving.kind === 'rock' && target.kind === 'wood') {
      removed.add(target.id);
      if (target.id === GATE.id) a.gateIntact = false;
      else a.shelfIntact = false;
      a.events.push({ kind: target.id === GATE.id ? 'gate' : 'shelf', x: target.x, y: target.y });
      continue;
    }
    if (moving.kind === 'rock' && target.kind === 'rock') {
      removed.add(moving.id); removed.add(target.id);
      shotResolved(moving.id); shotResolved(target.id);
      a.events.push({ kind: 'shatter', x: moving.x + C.rock / 2, y: moving.y + C.rock / 2 }); continue;
    }
    if (hit.nx) { moving.vx = target.vx; moving.x = hit.nx < 0 ? target.x - moving.w : target.x + target.w; }
    if (hit.ny) {
      moving.vy = target.vy; moving.y = hit.ny < 0 ? target.y - moving.h : target.y + target.h;
      if (hit.ny === -1) {
        moving.support = target.id;
        if (moving.kind === 'rock') {
          moving.falling = false; shotResolved(moving.id);
          a.events.push({ kind: 'land', x: moving.x + moving.w / 2, y: moving.y + moving.h });
        }
      }
    }
  }
  const body = bodies[0]!;
  p.centerX = body.x + C.playerW / 2; p.feetY = body.y + C.playerH; p.vx = body.vx; p.vy = body.vy;
  a.stones = a.stones.filter(s => !removed.has(s.id));
  for (const s of a.stones) {
    const b = bodies.find(v => v.id === s.id)!;
    s.centerX = b.x + C.rock / 2; s.bottomY = b.y + C.rock;
    s.vy = b.vy; s.support = b.support ?? null;
    s.state = b.falling ? 'FALLING' : s.support === 'ground' ? 'SETTLED' : 'SUPPORTED';
  }
  refreshSupports(a);
  if (!p.grounded) p.vy = Math.min(C.terminal, p.vy + C.gravity * dt / 2);
  for (const s of a.stones) if (s.state === 'FALLING') s.vy += C.gravity * dt / 2;
}

export function step(a: Attempt, input: Input, dt = C.dt): void {
  a.events = [];
  if (a.status === 'DEAD' || a.status === 'COMPLETE') return;
  if (a.status === 'WAITING') {
    if (!input.left && !input.right && !input.jump && !input.taunt) return;
    a.status = 'ACTIVE'; a.events.push({ kind: 'start' });
  }
  const p = a.player;
  refreshSupports(a);
  if (p.control === 'TAUNTING') { p.tauntLeft -= dt; if (p.tauntLeft <= 1e-9) p.control = 'FREE'; }
  updateMachine(a, input, dt);
  const direction = Number(input.right) - Number(input.left);
  p.pushing = false;
  p.vx = p.control === 'FREE' ? direction * C.speed : 0;
  if (direction && p.control === 'FREE') p.facing = direction > 0 ? 1 : -1;
  p.coyote = p.grounded ? C.coyote : Math.max(0, p.coyote - dt);
  p.jumpBuffer = input.jump && p.control === 'FREE' ? C.buffer : Math.max(0, p.jumpBuffer - dt);
  if (p.control === 'FREE' && p.jumpBuffer > 0 && (p.grounded || p.coyote > 0)) {
    p.vy = C.jump; p.grounded = false; p.support = null; p.coyote = 0; p.jumpBuffer = 0;
  }
  push(a, direction, dt);
  moveLift(a, dt);
  refreshSupports(a);
  simulate(a, dt);
  const wasWeighted = a.plateWeighted; a.plateWeighted = weighted(a);
  if (a.plateWeighted !== wasWeighted) a.events.push({ kind: 'plate', value: Number(a.plateWeighted) });
  a.elapsed += dt;
  if (a.status !== 'ACTIVE') return;
  for (const pickup of a.pickups) {
    if (pickup.collected) continue;
    if (pickup.id === 'gold_pouch' && !a.shelfIntact && pickup.y < 628) {
      pickup.y += pickup.vy * dt + C.gravity * dt * dt / 2;
      pickup.vy += C.gravity * dt;
      if (pickup.y >= 628) { pickup.y = 628; pickup.vy = 0; }
    }
    const area = { id: pickup.id, x: pickup.x - pickup.size / 2, y: pickup.y - pickup.size / 2, w: pickup.size, h: pickup.size };
    if (overlaps(playerRect(p), area)) {
      pickup.collected = true; a.coins += pickup.value;
      a.events.push({ kind: 'coin', x: pickup.x, y: pickup.y, value: pickup.value });
    }
  }
  if (!a.hasPole && Math.abs(p.centerX - CH2_POLE_SPAWN.x) <= 36 && Math.abs(p.feetY - STEP.y) <= 16) {
    a.hasPole = true;
    a.events.push({ kind: 'puzzle_item', x: CH2_POLE_SPAWN.x, y: CH2_POLE_SPAWN.y });
  }
  if (!a.hasCog && Math.abs(p.centerX - CH2_COG_SPAWN.x) <= 36 && Math.abs(p.feetY - SHELF.y) <= 16) {
    a.hasCog = true;
    a.events.push({ kind: 'puzzle_item', x: CH2_COG_SPAWN.x, y: CH2_COG_SPAWN.y });
  }
  if (!a.gearBoxActive && a.hasPole && a.hasCog && Math.abs(p.centerX - 1104) <= 64) {
    a.gearBoxActive = true;
    a.platformsRevealed = true;
    a.events.push({ kind: 'gear_box', x: 1104, y: 360 });
    a.events.push({ kind: 'platforms' });
  }
  if (a.platformsRevealed && !a.hasSlingshot && Math.abs(p.centerX - CH2_SLINGSHOT_SPAWN.x) <= 36 && Math.abs(p.feetY - PLATFORM_HIGH.y) <= 16) {
    a.hasSlingshot = true;
    a.events.push({ kind: 'slingshot', x: CH2_SLINGSHOT_SPAWN.x, y: CH2_SLINGSHOT_SPAWN.y });
  }
  if (a.elapsed >= 40.0 && !a.beehiveTriggered) {
    a.beehiveTriggered = true;
    a.beehiveX = p.centerX;
    a.beehiveY = 120;
    a.events.push({ kind: 'beehive', x: a.beehiveX, y: a.beehiveY });
  }
  if (a.beehiveTriggered && a.beehiveY < C.floor) {
    a.beehiveY += 240 * dt;
    if (Math.abs(p.centerX - a.beehiveX) < 28 && Math.abs(p.feetY - a.beehiveY) < 40 && p.control === 'FREE') {
      a.status = 'DEAD';
      p.control = 'DEAD';
      a.events.push({ kind: 'death', x: p.centerX, y: p.feetY });
    }
  }
  if (p.grounded && Math.abs(p.feetY - C.floor) <= C.epsilon && p.centerX >= CH2_TRAP_RANGE.minX && p.centerX <= CH2_TRAP_RANGE.maxX) {
    a.trapFloorOpen = true;
    a.status = 'DEAD';
    p.control = 'DEAD';
    a.events.push({ kind: 'trap', x: p.centerX, y: p.feetY });
    a.events.push({ kind: 'death', x: p.centerX, y: p.feetY });
  }
  if (p.grounded && Math.abs(p.feetY - C.floor) <= C.epsilon && p.centerX >= 1234) {
    a.status = 'COMPLETE'; p.control = 'EXITING'; a.events.push({ kind: 'complete' });
  }
}

export function preview(a: Attempt): { x: number; surfaces: { y: number; breakable: boolean; shatter: boolean }[] } {
  const x = a.machine.state === 'READY' ? Math.min(C.aimMax, Math.max(C.aimMin, a.player.centerX)) : a.machine.targetX;
  const footprint: Rect = { id: 'preview', x: x - C.rock / 2, y: 0, w: C.rock, h: C.height };
  const surfaces = [...solids(a), ...a.stones.filter(s => s.state !== 'FALLING').map(stoneRect)]
    .filter(r => overlapX(footprint, r) >= (r.id === GATE.id || r.id === SHELF.id ? C.woodOverlap : C.epsilon))
    .map(r => ({ y: r.y, breakable: r.id === GATE.id || r.id === SHELF.id, shatter: a.stones.some(s => s.id === r.id) }))
    .sort((u, v) => u.y - v.y);
  const stop = surfaces.findIndex(s => !s.breakable);
  return { x, surfaces: stop < 0 ? surfaces : surfaces.slice(0, stop + 1) };
}
