import { C } from '../content/chapter1';
import { A4 } from '../content/chapter4';
import { overlaps, sweep } from './collision';
import type { Body } from './collision';
import type { Campaign, Player } from './types';

export interface ArenaInput { left: boolean; right: boolean; jump: boolean; punch: boolean; sling: boolean; dodge: boolean }
export const ARENA_IDLE: Readonly<ArenaInput> = { left: false, right: false, jump: false, punch: false, sling: false, dodge: false };
export type ApePhase = 'IDLE' | 'WINDUP' | 'STRIKE' | 'RECOVER' | 'STUN' | 'DOWN';
export interface Ape { id: string; type: 'MELEE' | 'THROWER'; x: number; hp: number; phase: ApePhase; phaseLeft: number; cooldown: number; facing: -1 | 1; targetX: number; targetY: number; hit: boolean; hitLeft: number }
export interface ArenaShot { id: number; owner: 'PHOE' | 'APE'; x: number; y: number; vx: number; vy: number; damage: number; age: number }
export type ArenaEvent = 'punch' | 'shove' | 'shot' | 'empty' | 'hit' | 'hurt' | 'down' | 'refill' | 'dodge' | 'won' | 'failed' | 'complete';
export interface ArenaAttempt {
  id: string; status: 'WAITING' | 'ACTIVE' | 'FAILED' | 'COMPLETE'; failure: 'HEALTH' | 'TIME' | null;
  player: Player; hp: number; hasSling: boolean; ammo: number; elapsed: number; combatSeconds: number;
  apes: Ape[]; shots: ArenaShot[]; nextShot: number; shotsFired: number; charge: number; aimFacing: -1 | 1; wasSling: boolean;
  punchLeft: number; slingLeft: number; dodgeLeft: number; dodgeCooldown: number; dodgeDirection: -1 | 1;
  hurtLeft: number; staggerLeft: number; refill: number; attackGap: number; combatWon: boolean; events: ArenaEvent[];
}
export interface ArenaResult { attemptId: string; activeSeconds: number; remainingHealth: number; shotsFired: number }
export function createArena(id: string, hasSling = true): ArenaAttempt {
  return { id, status: 'WAITING', failure: null, hp: A4.health, hasSling, ammo: A4.ammo, elapsed: 0, combatSeconds: 0,
    player: { centerX: A4.spawnX, feetY: C.floor, vx: 0, vy: 0, grounded: true, support: 'arena_floor', coyote: C.coyote, jumpBuffer: 0,
      control: 'FREE', tauntLeft: 0, facing: 1, pushing: false },
    apes: [
      { id: 'brown', type: 'MELEE', x: A4.meleeSpawn, hp: A4.apeHealth, phase: 'IDLE', phaseLeft: 0, cooldown: 0, facing: -1, targetX: 0, targetY: 0, hit: false, hitLeft: 0 },
      { id: 'silver', type: 'THROWER', x: 1100, hp: A4.apeHealth, phase: 'IDLE', phaseLeft: 0, cooldown: A4.throwFirstCooldown, facing: -1, targetX: 0, targetY: 0, hit: false, hitLeft: 0 },
    ], shots: [], nextShot: 0, shotsFired: 0, charge: 0, aimFacing: 1, wasSling: false, punchLeft: 0, slingLeft: 0,
    dodgeLeft: 0, dodgeCooldown: 0, dodgeDirection: -1, hurtLeft: 0, staggerLeft: 0, refill: 0, attackGap: A4.firstAttack, combatWon: false, events: [] };
}
function playerBody(a: ArenaAttempt): Body {
  return { id: 'phoe', x: a.player.centerX - C.playerW / 2, y: a.player.feetY - C.playerH, w: C.playerW, h: C.playerH, vx: 0, vy: 0, kind: 'player' };
}
function apeBody(e: Ape): Body { return { id: e.id, x: e.x - 42, y: C.floor - 124, w: 84, h: 124, vx: 0, vy: 0, kind: 'solid' }; }
function hurt(a: ArenaAttempt, damage: number) {
  if (a.hurtLeft > 0 || a.dodgeLeft > A4.dodgeTime - A4.dodgeInvulnerable || a.combatWon) return;
  a.hp = Math.max(0, a.hp - damage); a.hurtLeft = A4.hurtGrace; a.staggerLeft = A4.hurtStagger;
  // A visible hit breaks a draw, without consuming an unfired stone or trapping movement.
  a.charge = 0; a.events.push('hurt');
}
function damage(a: ArenaAttempt, e: Ape, amount: number, punch = false) {
  if (e.hp <= 0) return;
  e.hp = Math.max(0, e.hp - amount); e.hitLeft = A4.hitFlash; a.events.push('hit');
  if (e.hp === 0) { e.phase = 'DOWN'; a.events.push('down'); }
  else if (punch && (e.phase === 'IDLE' || e.phase === 'RECOVER')) {
    e.phase = 'STUN'; e.phaseLeft = A4.punchStun;
    e.x = Math.max(A4.minX + 42, Math.min(A4.maxX - 42, e.x + a.player.facing * A4.punchPush));
    a.events.push('shove');
  }
}
function fire(a: ArenaAttempt) {
  if (!a.hasSling || a.ammo <= 0) { a.events.push('empty'); return; }
  const p = a.player, dir = a.aimFacing;
  const target = a.apes.filter(e => e.hp > 0 && (e.x - p.centerX) * dir > 0).sort((x, y) => Math.abs(x.x - p.centerX) - Math.abs(y.x - p.centerX))[0];
  const x = p.centerX + dir * 20, y = p.feetY - 42;
  const dx = target ? target.x - x : dir * 500, dy = target ? C.floor - 65 - y : 0, length = Math.hypot(dx, dy);
  const power = Math.min(1, a.charge / A4.chargeTime);
  a.shots.push({ id: a.nextShot++, owner: 'PHOE', x, y, vx: dx / length * A4.shotSpeed, vy: dy / length * A4.shotSpeed, damage: Math.max(1, Math.round(A4.shotDamage * power)), age: 0 });
  a.ammo--; a.shotsFired++; a.slingLeft = A4.slingCooldown; a.events.push('shot');
}
export function stepArena(a: ArenaAttempt, input: ArenaInput) {
  a.events = [];
  if (a.status === 'COMPLETE' || a.status === 'FAILED') return;
  if (a.status === 'WAITING' && !Object.values(input).some(Boolean)) return;
  a.status = 'ACTIVE'; a.elapsed += C.dt;
  if (!a.combatWon) a.combatSeconds += C.dt;
  for (const key of ['punchLeft', 'slingLeft', 'dodgeLeft', 'dodgeCooldown', 'hurtLeft', 'staggerLeft', 'attackGap'] as const) a[key] = Math.max(0, a[key] - C.dt);
  for (const e of a.apes) e.hitLeft = Math.max(0, e.hitLeft - C.dt);
  const p = a.player, dx = Number(input.right) - Number(input.left);
  if (dx && !a.charge) p.facing = dx > 0 ? 1 : -1;
  if (input.dodge && !a.combatWon && a.dodgeCooldown <= 0) {
    a.dodgeLeft = A4.dodgeTime; a.dodgeCooldown = A4.dodgeCooldown; a.dodgeDirection = dx ? (dx > 0 ? 1 : -1) : p.facing === 1 ? -1 : 1;
    a.charge = 0; a.events.push('dodge');
  }
  const dodging = a.dodgeLeft > 0;
  if (!dodging && !a.combatWon) {
    if (input.sling && a.slingLeft <= 0 && a.hasSling && a.staggerLeft <= 0) {
      if (!a.charge) a.aimFacing = p.facing;
      a.charge = Math.min(A4.chargeTime, a.charge + C.dt);
    }
    if (!input.sling && a.wasSling) {
      if (a.charge >= A4.minimumCharge && a.slingLeft <= 0) fire(a);
      a.charge = 0;
    }
    if (input.punch && a.punchLeft <= 0 && !a.charge) {
      a.punchLeft = A4.punchCooldown; a.events.push('punch');
      const enemy = a.apes.filter(e => e.hp > 0 && (e.x - p.centerX) * p.facing >= -10 && Math.abs(e.x - p.centerX) <= A4.punchReach && Math.abs(p.feetY - C.floor) < 80)
        .sort((x, y) => Math.abs(x.x - p.centerX) - Math.abs(y.x - p.centerX))[0];
      if (enemy) damage(a, enemy, A4.punchDamage, true);
    }
  }
  a.wasSling = input.sling;
  p.coyote = p.grounded ? C.coyote : Math.max(0, p.coyote - C.dt);
  p.jumpBuffer = input.jump ? C.buffer : Math.max(0, p.jumpBuffer - C.dt);
  if (p.coyote > 0 && p.jumpBuffer > 0 && !dodging) { p.vy = C.jump; p.coyote = 0; p.jumpBuffer = 0; }
  p.vx = dodging ? a.dodgeDirection * A4.dodgeSpeed : dx * C.speed * (a.charge > 0 ? .5 : 1);
  p.centerX = Math.max(A4.minX, Math.min(A4.maxX, p.centerX + p.vx * C.dt));
  p.vy = Math.min(C.terminal, p.vy + C.gravity * C.dt); p.feetY = Math.min(C.floor, p.feetY + p.vy * C.dt);
  p.grounded = p.feetY >= C.floor; p.support = p.grounded ? 'arena_floor' : null; if (p.grounded) p.vy = 0;
  if (p.grounded && !p.vx && !input.sling && a.ammo < A4.ammo && A4.refillX.some(x => Math.abs(x - p.centerX) <= A4.refillReach)) {
    a.refill += C.dt;
    if (a.refill + 1e-9 >= A4.refillTime) { a.ammo = A4.ammo; a.refill = 0; a.events.push('refill'); }
  } else a.refill = 0;

  if (!a.combatWon) for (const e of a.apes) {
    if (e.hp <= 0) continue;
    e.cooldown = Math.max(0, e.cooldown - C.dt); e.phaseLeft = Math.max(0, e.phaseLeft - C.dt);
    if (e.phase === 'STUN' || e.phase === 'RECOVER') { if (e.phaseLeft <= 0) e.phase = 'IDLE'; else continue; }
    if (e.phase === 'WINDUP') {
      if (e.phaseLeft > 0) continue;
      e.phase = 'STRIKE'; e.phaseLeft = A4.meleeStrike; e.hit = false;
      if (e.type === 'THROWER') {
        const x = e.x + e.facing * 32, y = C.floor - 78, tx = e.targetX - x, ty = e.targetY - y, length = Math.max(1, Math.hypot(tx, ty));
        a.shots.push({ id: a.nextShot++, owner: 'APE', x, y, vx: tx / length * A4.throwSpeed, vy: ty / length * A4.throwSpeed, damage: A4.throwDamage, age: 0 });
      }
    }
    if (e.phase === 'STRIKE') {
      if (!e.hit && e.type === 'MELEE') {
        e.hit = true;
        if (Math.abs(p.centerX - (e.x + e.facing * 54)) <= 78 && p.feetY > C.floor - 85) hurt(a, A4.meleeDamage);
      }
      if (e.phaseLeft <= 0) { e.phase = 'RECOVER'; e.phaseLeft = e.type === 'MELEE' ? A4.meleeRecover : A4.throwRecover; e.cooldown = e.type === 'MELEE' ? .65 : A4.throwCooldown; }
      continue;
    }
    e.facing = p.centerX > e.x ? 1 : -1;
    const distance = Math.abs(p.centerX - e.x);
    if (e.type === 'MELEE' && distance > 84) e.x += e.facing * A4.meleeSpeed * C.dt;
    if (e.type === 'THROWER' && distance < 180) e.x -= e.facing * 75 * C.dt;
    e.x = Math.max(74, Math.min(1206, e.x));
    if (e.cooldown <= 0 && a.attackGap <= 0 && (e.type === 'THROWER' || distance <= A4.meleeReach) && !a.apes.some(other => other.phase === 'WINDUP' || other.phase === 'STRIKE')) {
      e.phase = 'WINDUP'; e.phaseLeft = e.type === 'MELEE' ? A4.meleeWindup : A4.throwWindup;
      e.targetX = p.centerX; e.targetY = p.feetY - 25; a.attackGap = A4.attackSpacing;
    }
  }
  const surviving: ArenaShot[] = [];
  for (const shot of a.shots) {
    const moving: Body = { id: String(shot.id), x: shot.x - 6, y: shot.y - 6, w: 12, h: 12, vx: shot.vx, vy: shot.vy, kind: 'rock' };
    let consumed = false;
    if (shot.owner === 'PHOE') {
      const hits = a.apes.filter(e => e.hp > 0).map(e => ({ e, hit: overlaps(moving, apeBody(e)) ? { t: 0 } : sweep(moving, apeBody(e), C.dt) })).filter(h => h.hit !== null).sort((x, y) => x.hit!.t - y.hit!.t);
      if (hits[0]) { damage(a, hits[0].e, shot.damage); consumed = true; }
    } else if (overlaps(moving, playerBody(a)) || sweep(moving, playerBody(a), C.dt)) { hurt(a, shot.damage); consumed = true; }
    shot.x += shot.vx * C.dt; shot.y += shot.vy * C.dt; shot.age += C.dt;
    if (!consumed && shot.age < 3 && shot.x > 0 && shot.x < C.width && shot.y > 0 && shot.y < C.floor) surviving.push(shot);
  }
  a.shots = surviving;
  if (a.hp <= 0 || (!a.combatWon && a.combatSeconds + 1e-9 >= A4.timeLimit)) {
    a.status = 'FAILED'; a.failure = a.hp <= 0 ? 'HEALTH' : 'TIME'; a.charge = 0; p.vx = 0; a.events.push('failed'); return;
  }
  if (!a.combatWon && a.apes.every(e => e.hp <= 0)) { a.combatWon = true; a.shots = []; a.charge = 0; a.events.push('won'); }
  if (a.combatWon && p.grounded && p.centerX >= A4.exitX) { a.status = 'COMPLETE'; p.control = 'EXITING'; p.vx = 0; a.events.push('complete'); }
}
export function settleArena(c: Campaign, a: ArenaAttempt): Campaign {
  if (!c.chapter3Completed || !a.id || a.status !== 'COMPLETE' || !a.combatWon || !Number.isSafeInteger(a.hp) || a.hp <= 0 || a.hp > A4.health || a.apes.length !== 2 || a.apes.some(e => e.hp !== 0) ||
    !a.hasSling || !Number.isFinite(a.elapsed) || a.elapsed < 0 || !Number.isFinite(a.combatSeconds) || a.combatSeconds < 0 || a.combatSeconds >= A4.timeLimit ||
    !Number.isSafeInteger(a.shotsFired) || a.shotsFired < 0 || !Number.isFinite(a.player.centerX) || a.player.centerX < A4.exitX || !a.player.grounded ||
    !Number.isFinite(a.player.feetY) || Math.abs(a.player.feetY - C.floor) > .01) throw Error('Invalid Chapter 4 completion');
  const receipt = `arena:${a.id}`; if (c.completedAttemptIds.includes(receipt)) return c;
  const next = structuredClone(c); next.completedAttemptIds.push(receipt); next.chapter4Completed = true; next.revision++;
  next.lastChapter4Result = { attemptId: a.id, activeSeconds: a.combatSeconds, remainingHealth: a.hp, shotsFired: a.shotsFired };
  next.resumeAt = 'CHAPTER_5_PENDING'; return next;
}
