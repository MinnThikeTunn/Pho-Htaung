import { C } from '../content/chapter1';
import { A4, SLING_TOOL_ID } from '../content/chapter4';
import { overlaps, sweep } from './collision';
import type { Body } from './collision';
import type { Campaign, Player } from './types';

export interface ArenaInput { left: boolean; right: boolean; jump: boolean; punch: boolean; sling: boolean; dodge: boolean; crawl?: boolean }
export const ARENA_IDLE: Readonly<ArenaInput> = { left: false, right: false, jump: false, punch: false, sling: false, dodge: false };
export type ArenaWeapon = 'FISTS' | 'SLING';
export function arenaHasSlingshot(c: Pick<Campaign, 'ownedTools' | 'inventory'>, equipment?: { slingshot: boolean }): boolean {
  return equipment?.slingshot ?? (c.ownedTools.includes(SLING_TOOL_ID) || c.inventory.includes(SLING_TOOL_ID));
}
export type ApePhase = 'IDLE' | 'WINDUP' | 'STRIKE' | 'RECOVER' | 'STUN' | 'BRAWL' | 'DOWN';
export interface Ape {
  id: string;
  type: 'MELEE' | 'THROWER';
  x: number;
  hp: number;
  phase: ApePhase;
  phaseLeft: number;
  cooldown: number;
  facing: -1 | 1;
  targetX: number;
  targetY: number;
  hit: boolean;
  hitLeft: number;
  friendlyHits: number;
  brawlStrikes: number;
}
export type ArenaObstacleKind = 'PILLAR' | 'LOG';
export interface ArenaObstacle {
  id: number;
  kind: ArenaObstacleKind;
  x: number;
  age: number;
  ttl: number;
}
export interface ArenaShot { id: number; owner: 'PHOE' | 'APE'; x: number; y: number; vx: number; vy: number; damage: number; age: number }
export type ArenaEvent =
  | 'punch'
  | 'shove'
  | 'shot'
  | 'empty'
  | 'hit'
  | 'hurt'
  | 'down'
  | 'refill'
  | 'dodge'
  | 'friendly_fire'
  | 'brawl'
  | 'obstacle_outplay'
  | 'obstacle_drop'
  | 'gold_trap_exploded'
  | 'won'
  | 'failed'
  | 'complete';
export interface ArenaAttempt {
  id: string; status: 'WAITING' | 'ACTIVE' | 'FAILED' | 'COMPLETE'; failure: 'HEALTH' | 'TIME' | 'GREED_TRAP' | null;
  player: Player; hp: number; hasSling: boolean; weapon: ArenaWeapon; ammo: number; elapsed: number; combatSeconds: number;
  apes: Ape[]; shots: ArenaShot[]; nextShot: number; shotsFired: number; charge: number; aimFacing: -1 | 1; wasSling: boolean;
  punchLeft: number; slingLeft: number; dodgeLeft: number; dodgeCooldown: number; dodgeDirection: -1 | 1;
  hurtLeft: number; staggerLeft: number; refill: number; attackGap: number; combatWon: boolean; events: ArenaEvent[];
  obstacles: ArenaObstacle[]; nextObstacleId: number; obstacleTimer: number;
  goldTrapSpawned?: boolean; goldTrapExploded?: boolean;
}
export interface ArenaResult { attemptId: string; activeSeconds: number; remainingHealth: number; shotsFired: number }
export function createArena(id: string, hasSling = false): ArenaAttempt {
  return {
    id, status: 'WAITING', failure: null, hp: A4.health, hasSling, weapon: 'FISTS', ammo: hasSling ? A4.ammo : 0, elapsed: 0, combatSeconds: 0,
    player: {
      centerX: A4.spawnX, feetY: C.floor, vx: 0, vy: 0, grounded: true, support: 'arena_floor', coyote: C.coyote, jumpBuffer: 0,
      control: 'FREE', tauntLeft: 0, facing: 1, pushing: false
    },
    apes: [
      { id: 'brown', type: 'MELEE', x: A4.meleeSpawn, hp: A4.apeHealth, phase: 'IDLE', phaseLeft: 0, cooldown: 0, facing: -1, targetX: 0, targetY: 0, hit: false, hitLeft: 0, friendlyHits: 0, brawlStrikes: 0 },
      { id: 'silver', type: 'THROWER', x: 1100, hp: A4.apeHealth, phase: 'IDLE', phaseLeft: 0, cooldown: A4.throwFirstCooldown, facing: -1, targetX: 0, targetY: 0, hit: false, hitLeft: 0, friendlyHits: 0, brawlStrikes: 0 },
    ],
    shots: [], nextShot: 0, shotsFired: 0, charge: 0, aimFacing: 1, wasSling: false, punchLeft: 0, slingLeft: 0,
    dodgeLeft: 0, dodgeCooldown: 0, dodgeDirection: -1, hurtLeft: 0, staggerLeft: 0, refill: 0, attackGap: A4.firstAttack, combatWon: false, events: [],
    obstacles: [], nextObstacleId: 0, obstacleTimer: A4.obstacleFirstDelay,
    goldTrapSpawned: false, goldTrapExploded: false,
  };
}
export function triggerArenaGoldTrap(a: ArenaAttempt): boolean {
  if (!a.combatWon || a.status !== 'ACTIVE' || a.goldTrapExploded) return false;
  a.goldTrapExploded = true;
  a.hp = 0;
  a.hurtLeft = A4.hurtGrace;
  a.staggerLeft = A4.hurtStagger;
  a.charge = 0;
  a.player.vx = 0;
  a.status = 'FAILED';
  a.failure = 'GREED_TRAP';
  a.events.push('gold_trap_exploded', 'failed');
  return true;
}
export function equipArenaWeapon(a: ArenaAttempt, weapon: ArenaWeapon): boolean {
  if (a.status === 'FAILED' || a.status === 'COMPLETE' || (weapon === 'SLING' && !a.hasSling)) return false;
  a.weapon = weapon; a.charge = 0; a.wasSling = false;
  return true;
}
function playerBody(a: ArenaAttempt): Body {
  const lowProfile = a.player.control === 'LAYING' || a.dodgeLeft > 0;
  const h = lowProfile ? 38 : C.playerH;
  return { id: 'phoe', x: a.player.centerX - C.playerW / 2, y: a.player.feetY - h, w: C.playerW, h, vx: 0, vy: 0, kind: 'player' };
}
function apeBody(e: Ape): Body { return { id: e.id, x: e.x - 42, y: C.floor - 124, w: 84, h: 124, vx: 0, vy: 0, kind: 'solid' }; }
function hurt(a: ArenaAttempt, damage: number) {
  if (a.hurtLeft > 0 || a.dodgeLeft > A4.dodgeTime - A4.dodgeInvulnerable || a.combatWon) return;
  a.hp = Math.max(0, a.hp - damage); a.hurtLeft = A4.hurtGrace; a.staggerLeft = A4.hurtStagger;
  // A visible hit breaks a draw, without consuming an unfired stone or trapping movement.
  a.charge = 0; a.events.push('hurt');
}

function startApeBrawl(a: ArenaAttempt) {
  const living = a.apes.filter(e => e.hp > 0);
  if (living.length < 2) return;
  for (const ape of living) {
    const other = living.find(o => o.id !== ape.id)!;
    ape.phase = 'BRAWL';
    ape.phaseLeft = A4.brawlDuration;
    ape.friendlyHits = 0;
    ape.brawlStrikes = 0;
    ape.hit = false;
    ape.facing = other.x >= ape.x ? 1 : -1;
  }
  // Remove any in-flight ape rocks so the brawl plays out cleanly
  a.shots = a.shots.filter(s => s.owner !== 'APE');
  a.events.push('brawl');
}

export function applyFriendlyFire(a: ArenaAttempt, victim: Ape, amount = A4.friendlyFireHitDamage) {
  if (victim.hp <= 0 || victim.phase === 'BRAWL' || a.combatWon) return;
  victim.hp = Math.max(0, victim.hp - amount);
  victim.hitLeft = A4.hitFlash;
  a.events.push('hit');
  if (victim.hp === 0) {
    victim.phase = 'DOWN';
    victim.friendlyHits = 0;
    a.events.push('down');
    return;
  }
  victim.friendlyHits = (victim.friendlyHits || 0) + 1;
  if (victim.friendlyHits >= A4.friendlyFireHitsToBrawl && a.apes.every(e => e.hp > 0)) {
    startApeBrawl(a);
  } else {
    a.events.push('friendly_fire');
  }
}

function applyObstacleOutplay(a: ArenaAttempt, ape: Ape, pushDir: -1 | 1) {
  if (ape.hp <= 0 || ape.phase === 'BRAWL' || a.combatWon) return;
  ape.hp = Math.max(0, ape.hp - A4.obstacleBonkDamage);
  ape.hitLeft = A4.hitFlash;
  a.events.push('hit');
  if (ape.hp === 0) {
    ape.phase = 'DOWN';
    ape.phaseLeft = 0;
    a.events.push('down');
    return;
  }
  ape.phase = 'STUN';
  ape.phaseLeft = A4.obstacleBonkStun;
  ape.x = Math.max(74, Math.min(1206, ape.x + pushDir * A4.obstacleBonkPush));
  a.events.push('obstacle_outplay');
}

function spawnBrownApeObstacle(a: ArenaAttempt, brown: Ape) {
  const idx = a.nextObstacleId++;
  const seed = ((idx + 1) * 1664525 + 1013904223) >>> 0;
  const ratio = (seed & 0xffff) / 0xffff;
  a.obstacleTimer =
    A4.obstacleIntervalMin + ratio * (A4.obstacleIntervalMax - A4.obstacleIntervalMin);
  const kind: ArenaObstacleKind = (seed & 1) === 0 ? 'PILLAR' : 'LOG';

  // Place obstacle in the lane between Brown Ape and player, clamped away from spawn and exit
  const jitter = (((seed >>> 16) & 0xff) / 255 - 0.5) * 44;
  let dropX = Math.round(Math.max(230, Math.min(1020, brown.x + brown.facing * 84 + jitter)));
  if (Math.abs(dropX - A4.pillarX) < 64) dropX = dropX < A4.pillarX ? A4.pillarX - 68 : A4.pillarX + 68;
  if (Math.abs(dropX - A4.archX) < 76) dropX = dropX < A4.archX ? A4.archX - 80 : A4.archX + 80;
  dropX = Math.max(230, Math.min(1020, dropX));

  if (a.obstacles.length >= A4.maxDroppedObstacles) {
    a.obstacles.shift();
  }
  a.obstacles.push({
    id: idx,
    kind,
    x: dropX,
    age: 0,
    ttl: A4.obstacleTtl,
  });
  a.events.push('obstacle_drop');
}

function damage(a: ArenaAttempt, e: Ape, amount: number, punch = false) {
  if (e.hp <= 0) return;
  e.hp = Math.max(0, e.hp - amount); e.hitLeft = A4.hitFlash; a.events.push('hit');
  if (e.hp === 0) { e.phase = 'DOWN'; a.events.push('down'); }
  else if (punch && (e.phase === 'IDLE' || e.phase === 'RECOVER')) {
    e.phase = 'STUN'; e.phaseLeft = A4.punchStun;
    e.x = Math.max(A4.minX + 42, Math.min(A4.maxX - 42, e.x + a.player.facing * A4.punchPush));
    a.events.push('shove');
    // Check if the shoved ape slams into the other ape
    const other = a.apes.find(o => o.id !== e.id && o.hp > 0);
    if (other && Math.abs(other.x - e.x) <= 78 && other.phase !== 'BRAWL') {
      applyFriendlyFire(a, other, A4.friendlyFireHitDamage);
    }
  }
}
function fire(a: ArenaAttempt) {
  if (!a.hasSling || a.weapon !== 'SLING' || a.ammo <= 0) { a.events.push('empty'); return; }
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
  if (a.status === 'WAITING' && !(input.left || input.right || input.jump || input.punch || input.dodge || input.crawl || (input.sling && a.hasSling && a.weapon === 'SLING'))) return;
  a.status = 'ACTIVE'; a.elapsed += C.dt;
  if (!a.combatWon) a.combatSeconds += C.dt;
  for (const key of ['punchLeft', 'slingLeft', 'dodgeLeft', 'dodgeCooldown', 'hurtLeft', 'staggerLeft', 'attackGap'] as const) a[key] = Math.max(0, a[key] - C.dt);
  for (const e of a.apes) e.hitLeft = Math.max(0, e.hitLeft - C.dt);

  // Step active Brown Ape dropped obstacles and expire old ones
  if (a.obstacles.length > 0) {
    a.obstacles = a.obstacles.filter(obs => {
      obs.age += C.dt;
      return obs.age < obs.ttl;
    });
  }

  const p = a.player, dx = Number(input.right) - Number(input.left);
  if (dx && !a.charge) p.facing = dx > 0 ? 1 : -1;
  if (input.dodge && !a.combatWon && a.dodgeCooldown <= 0) {
    a.dodgeLeft = A4.dodgeTime; a.dodgeCooldown = A4.dodgeCooldown; a.dodgeDirection = dx ? (dx > 0 ? 1 : -1) : p.facing === 1 ? -1 : 1;
    a.charge = 0; a.events.push('dodge');
  }
  const dodging = a.dodgeLeft > 0;
  const pillarTopY = C.floor - A4.pillarH;
  const droppedPillarTopY = C.floor - A4.droppedPillarH;
  const archHalfW = A4.archW / 2 + 4;
  const droppedLogHalfW = A4.droppedLogW / 2 + 4;
  const droppedPillarHalfW = A4.droppedPillarW / 2 + 6;

  const underArchCeiling =
    !a.combatWon &&
    ((Math.abs(p.centerX - A4.archX) < archHalfW && p.feetY > C.floor - A4.archClearance) ||
      a.obstacles.some(
        obs =>
          obs.kind === 'LOG' &&
          Math.abs(p.centerX - obs.x) < droppedLogHalfW &&
          p.feetY > C.floor - A4.droppedLogClearance
      ));
  const crawling = Boolean(input.crawl || underArchCeiling) && p.grounded && !dodging && !a.combatWon;
  p.control = crawling ? 'LAYING' : 'FREE';

  if (!dodging && !a.combatWon) {
    if (input.sling && a.slingLeft <= 0 && a.hasSling && a.weapon === 'SLING' && a.staggerLeft <= 0) {
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
  a.wasSling = input.sling && a.weapon === 'SLING';
  p.coyote = p.grounded ? C.coyote : Math.max(0, p.coyote - C.dt);
  p.jumpBuffer = input.jump ? C.buffer : Math.max(0, p.jumpBuffer - C.dt);
  if (p.coyote > 0 && p.jumpBuffer > 0 && !dodging && !underArchCeiling) {
    p.vy = C.jump; p.coyote = 0; p.jumpBuffer = 0; p.grounded = false; p.support = null;
  }

  const prevX = p.centerX;
  const prevFeetY = p.feetY;
  const moveSpeed = crawling ? A4.crawlSpeed : C.speed * (a.charge > 0 ? .5 : 1);
  p.vx = dodging ? a.dodgeDirection * A4.dodgeSpeed : dx * moveSpeed;
  let nextX = Math.max(A4.minX, Math.min(A4.maxX, p.centerX + p.vx * C.dt));

  if (!a.combatWon) {
    // 1. Low Stone Arch (x = 580): upright players hit the overhead lintel unless crawling/dodging under or jumping high over it
    if (!crawling && !dodging && p.feetY > C.floor - A4.archTopH + 6) {
      if (prevX <= A4.archX - archHalfW && nextX > A4.archX - archHalfW) {
        nextX = A4.archX - archHalfW;
      } else if (prevX >= A4.archX + archHalfW && nextX < A4.archX + archHalfW) {
        nextX = A4.archX + archHalfW;
      }
    }

    // 2. Dropped Obstacles: PILLAR requires jumping (or dodge-vaulting); LOG requires crouching/crawling (or high jump)
    for (const obs of a.obstacles) {
      if (obs.kind === 'PILLAR') {
        if (!dodging && p.feetY > droppedPillarTopY + 6) {
          if (prevX <= obs.x - droppedPillarHalfW && nextX > obs.x - droppedPillarHalfW) {
            nextX = obs.x - droppedPillarHalfW;
          } else if (prevX >= obs.x + droppedPillarHalfW && nextX < obs.x + droppedPillarHalfW) {
            nextX = obs.x + droppedPillarHalfW;
          }
        }
      } else if (obs.kind === 'LOG') {
        if (!crawling && !dodging && p.feetY > C.floor - A4.droppedLogTopH + 6) {
          if (prevX <= obs.x - droppedLogHalfW && nextX > obs.x - droppedLogHalfW) {
            nextX = obs.x - droppedLogHalfW;
          } else if (prevX >= obs.x + droppedLogHalfW && nextX < obs.x + droppedLogHalfW) {
            nextX = obs.x + droppedLogHalfW;
          }
        }
      }
    }
  }
  p.centerX = nextX;

  p.vy = Math.min(C.terminal, p.vy + C.gravity * C.dt);
  const nextFeetY = p.feetY + p.vy * C.dt;
  const onFixedPillar = !a.combatWon && Math.abs(p.centerX - A4.pillarX) <= A4.pillarW / 2 + 8;
  const onDroppedPillar =
    !a.combatWon &&
    a.obstacles.some(
      obs => obs.kind === 'PILLAR' && Math.abs(p.centerX - obs.x) <= A4.droppedPillarW / 2 + 6
    );

  if (onFixedPillar && p.vy >= 0 && prevFeetY <= pillarTopY + 6 && nextFeetY >= pillarTopY) {
    p.feetY = pillarTopY;
    p.grounded = true;
    p.support = 'arena_pillar';
    p.vy = 0;
  } else if (onDroppedPillar && p.vy >= 0 && prevFeetY <= droppedPillarTopY + 6 && nextFeetY >= droppedPillarTopY) {
    p.feetY = droppedPillarTopY;
    p.grounded = true;
    p.support = 'arena_pillar';
    p.vy = 0;
  } else {
    p.feetY = Math.min(C.floor, nextFeetY);
    p.grounded = p.feetY >= C.floor;
    p.support = p.grounded ? 'arena_floor' : null;
    if (p.grounded) p.vy = 0;
  }

  if (a.hasSling && p.grounded && !p.vx && !(input.sling && a.weapon === 'SLING') && a.ammo < A4.ammo && A4.refillX.some(x => Math.abs(x - p.centerX) <= A4.refillReach)) {
    a.refill += C.dt;
    if (a.refill + 1e-9 >= A4.refillTime) { a.ammo = A4.ammo; a.refill = 0; a.events.push('refill'); }
  } else a.refill = 0;

  const playerMovedFromSpawn = Math.abs(p.centerX - A4.spawnX) > 1 || p.support === 'arena_pillar' || crawling;

  // Brown Ape periodic obstacle placement at deterministic pseudo-random intervals
  const brownApeActor = a.apes.find(e => e.id === 'brown' && e.hp > 0);
  if (!a.combatWon && brownApeActor && brownApeActor.phase !== 'BRAWL' && brownApeActor.phase !== 'STUN') {
    a.obstacleTimer = Math.max(0, a.obstacleTimer - C.dt);
    if (a.obstacleTimer <= 0 && (brownApeActor.phase === 'IDLE' || brownApeActor.phase === 'RECOVER')) {
      spawnBrownApeObstacle(a, brownApeActor);
    }
  }

  if (!a.combatWon) for (const e of a.apes) {
    if (e.hp <= 0) continue;
    e.cooldown = Math.max(0, e.cooldown - C.dt); e.phaseLeft = Math.max(0, e.phaseLeft - C.dt);
    if (e.phase === 'BRAWL') {
      const other = a.apes.find(o => o.id !== e.id && o.hp > 0);
      if (!other) {
        e.phase = 'RECOVER'; e.phaseLeft = A4.meleeRecover; e.cooldown = .65;
        continue;
      }
      e.facing = other.x >= e.x ? 1 : -1;
      const gap = Math.abs(other.x - e.x);
      if (gap > 82) {
        e.x = Math.max(74, Math.min(1206, e.x + e.facing * A4.meleeSpeed * 1.35 * C.dt));
      } else {
        const nextStrikeAt = A4.brawlDuration - (e.brawlStrikes + 1) * A4.brawlStrikeInterval;
        if (e.brawlStrikes < 3 && e.phaseLeft <= nextStrikeAt + 1e-9) {
          e.brawlStrikes++;
          other.hp = Math.max(0, other.hp - A4.brawlDamage);
          other.hitLeft = A4.hitFlash;
          a.events.push('hit');
          if (other.hp === 0) {
            other.phase = 'DOWN'; other.phaseLeft = 0;
            a.events.push('down');
            e.phase = 'RECOVER'; e.phaseLeft = A4.meleeRecover; e.cooldown = .65;
            continue;
          }
        }
      }
      if (e.phaseLeft <= 0) {
        e.phase = 'RECOVER';
        e.phaseLeft = A4.meleeRecover;
        e.cooldown = e.type === 'MELEE' ? .65 : A4.throwCooldown;
        e.x = Math.max(74, Math.min(1206, e.x - e.facing * 24));
      }
      continue;
    }
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
        const strikeCenterX = e.x + e.facing * 54;
        // Outplay check: if Phoe Htaung jumped onto/over a Pillar or crawled under the Stone Arch / Log and the Brown Ape strikes the obstacle
        const hitPillarOutplay =
          playerMovedFromSpawn &&
          Math.abs(strikeCenterX - A4.pillarX) <= 58 &&
          (p.feetY <= pillarTopY + 4 || (p.centerX - A4.pillarX) * (e.x - A4.pillarX) <= 0);
        const hitArchOutplay =
          playerMovedFromSpawn &&
          Math.abs(strikeCenterX - A4.archX) <= 64 &&
          (crawling || dodging || (p.centerX - A4.archX) * (e.x - A4.archX) <= 0);
        const hitDroppedIdx = playerMovedFromSpawn
          ? a.obstacles.findIndex(
              obs =>
                obs.age > 0.65 &&
                Math.abs(strikeCenterX - obs.x) <= 54 &&
                (p.feetY < C.floor - 30 || crawling || dodging || (p.centerX - obs.x) * (e.x - obs.x) <= 0)
            )
          : -1;

        if (hitPillarOutplay || hitArchOutplay || hitDroppedIdx >= 0) {
          if (hitDroppedIdx >= 0) a.obstacles.splice(hitDroppedIdx, 1);
          applyObstacleOutplay(a, e, e.facing > 0 ? -1 : 1);
          continue;
        }

        if (Math.abs(p.centerX - strikeCenterX) <= 78 && p.feetY > C.floor - 85 && !(crawling && Math.abs(p.centerX - A4.archX) <= archHalfW)) {
          hurt(a, A4.meleeDamage);
        }
        // Check accidental melee hit on the Silver Ape when lured close
        const other = a.apes.find(o => o.id !== e.id && o.hp > 0);
        if (other && other.phase !== 'BRAWL' && Math.abs(other.x - strikeCenterX) <= 92) {
          applyFriendlyFire(a, other, A4.friendlyFireHitDamage);
        }
      }
      if (e.phaseLeft <= 0) { e.phase = 'RECOVER'; e.phaseLeft = e.type === 'MELEE' ? A4.meleeRecover : A4.throwRecover; e.cooldown = e.type === 'MELEE' ? .65 : A4.throwCooldown; }
      continue;
    }
    e.facing = p.centerX > e.x ? 1 : -1;
    const distance = Math.abs(p.centerX - e.x);
    if (e.type === 'MELEE') {
      const playerUsingArch =
        playerMovedFromSpawn &&
        (((crawling || dodging) && Math.abs(p.centerX - A4.archX) <= 90) ||
          ((p.centerX - A4.archX) * (e.x - A4.archX) <= 0 &&
            Math.abs(p.centerX - A4.archX) <= 190 &&
            (crawling || dodging || p.feetY < C.floor)));
      if (playerUsingArch && Math.abs(e.x - A4.archX) <= 60) {
        applyObstacleOutplay(a, e, e.facing > 0 ? -1 : 1);
        continue;
      }

      // Check if Brown Ape bonks into its own dropped LOG while Phoe Htaung crawls/ducks under it
      const bonkLogIdx = playerMovedFromSpawn
        ? a.obstacles.findIndex(
            obs =>
              obs.kind === 'LOG' &&
              obs.age > 0.85 &&
              Math.abs(e.x - obs.x) <= 52 &&
              (((crawling || dodging) && Math.abs(p.centerX - obs.x) <= 82) ||
                ((p.centerX - obs.x) * (e.x - obs.x) <= 0 && Math.abs(p.centerX - obs.x) <= 175 && (crawling || dodging || p.feetY < C.floor)))
          )
        : -1;
      if (bonkLogIdx >= 0) {
        a.obstacles.splice(bonkLogIdx, 1);
        applyObstacleOutplay(a, e, e.facing > 0 ? -1 : 1);
        continue;
      }

      if (distance > 84) {
        const atPillar =
          playerMovedFromSpawn &&
          ((Math.abs(e.x - A4.pillarX) <= 52 &&
            (p.support === 'arena_pillar' ||
              ((p.centerX - A4.pillarX) * (e.x - A4.pillarX) <= 0 && Math.abs(p.centerX - A4.pillarX) <= 185))) ||
            a.obstacles.some(
              obs =>
                obs.kind === 'PILLAR' &&
                obs.age > 0.85 &&
                Math.abs(e.x - obs.x) <= 48 &&
                (p.support === 'arena_pillar' || ((p.centerX - obs.x) * (e.x - obs.x) <= 0 && Math.abs(p.centerX - obs.x) <= 175))
            ));
        const speedMult = atPillar ? 0.35 : 1;
        e.x += e.facing * A4.meleeSpeed * speedMult * C.dt;
      }
    }
    if (e.type === 'THROWER' && distance < 180) e.x -= e.facing * 75 * C.dt;
    e.x = Math.max(74, Math.min(1206, e.x));
    if (e.cooldown <= 0 && a.attackGap <= 0 && (e.type === 'THROWER' || distance <= A4.meleeReach) && !a.apes.some(other => other.phase === 'WINDUP' || other.phase === 'STRIKE' || other.phase === 'BRAWL')) {
      e.phase = 'WINDUP'; e.phaseLeft = e.type === 'MELEE' ? A4.meleeWindup : A4.throwWindup;
      e.targetX = p.centerX; e.targetY = p.feetY - 25; a.attackGap = A4.attackSpacing;
    }
  }
  const surviving: ArenaShot[] = [];
  const brownApe = a.apes.find(e => e.id === 'brown' && e.hp > 0);
  for (const shot of a.shots) {
    const moving: Body = { id: String(shot.id), x: shot.x - 6, y: shot.y - 6, w: 12, h: 12, vx: shot.vx, vy: shot.vy, kind: 'rock' };
    let consumed = false;
    if (shot.owner === 'PHOE') {
      const hits = a.apes.filter(e => e.hp > 0).map(e => ({ e, hit: overlaps(moving, apeBody(e)) ? { t: 0 } : sweep(moving, apeBody(e), C.dt) })).filter(h => h.hit !== null).sort((x, y) => x.hit!.t - y.hit!.t);
      if (hits[0]) { damage(a, hits[0].e, shot.damage); consumed = true; }
    } else {
      // Check if Silver Ape's thrown rock hits the stone arch lintel while Phoe Htaung is crouched underneath
      const blockedByArch =
        (crawling || dodging) &&
        Math.abs(p.centerX - A4.archX) <= archHalfW + 8 &&
        Math.abs(shot.x - A4.archX) <= archHalfW + 8 &&
        shot.y >= C.floor - A4.archTopH &&
        shot.y <= C.floor - A4.archClearance + 10;

      // Check if Silver Ape's thrown rock accidentally hits the Brown Ape
      const playerEvadingOrSpaced =
        !p.grounded ||
        a.dodgeLeft > 0 ||
        crawling ||
        brownApe?.phase === 'STUN' ||
        Math.abs(p.centerX - A4.spawnX) > 1;
      if (blockedByArch) {
        consumed = true;
      } else if (
        brownApe &&
        brownApe.phase !== 'BRAWL' &&
        playerEvadingOrSpaced &&
        (overlaps(moving, apeBody(brownApe)) || sweep(moving, apeBody(brownApe), C.dt))
      ) {
        applyFriendlyFire(a, brownApe, A4.friendlyFireHitDamage);
        consumed = true;
      } else if (overlaps(moving, playerBody(a)) || sweep(moving, playerBody(a), C.dt)) {
        hurt(a, shot.damage);
        consumed = true;
      }
    }
    shot.x += shot.vx * C.dt; shot.y += shot.vy * C.dt; shot.age += C.dt;
    if (!consumed && shot.age < 3 && shot.x > 0 && shot.x < C.width && shot.y > 0 && shot.y < C.floor) surviving.push(shot);
  }
  a.shots = surviving;
  if (a.hp <= 0 || (!a.combatWon && a.combatSeconds + 1e-9 >= A4.timeLimit)) {
    a.status = 'FAILED'; a.failure = a.hp <= 0 ? 'HEALTH' : 'TIME'; a.charge = 0; p.vx = 0; a.events.push('failed'); return;
  }
  if (!a.combatWon && a.apes.every(e => e.hp <= 0)) { a.combatWon = true; a.goldTrapSpawned = true; a.shots = []; a.obstacles = []; a.charge = 0; a.events.push('won'); }
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
  if(!c.chapter5Completed)next.resumeAt = 'CHAPTER_5_PENDING'; return next;
}
