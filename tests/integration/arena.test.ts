import { expect, it } from 'vitest';
import { A4 } from '../../src/content/chapter4';
import { C } from '../../src/content/chapter1';
import { ARENA_IDLE, arenaHasSlingshot, createArena, equipArenaWeapon, settleArena, stepArena, triggerArchCollapse, triggerArenaGoldTrap } from '../../src/domain/arena';
import type { ArenaAttempt, ArenaInput } from '../../src/domain/arena';
import { newCampaign, validateCampaign } from '../../src/domain/settlement';
import { ArenaSession } from '../../src/services/ArenaSession';
import { CampaignStore } from '../../src/services/CampaignStore';

function tick(a: ArenaAttempt, input: ArenaInput = ARENA_IDLE, count = 1) {
  for (let i = 0; i < count; i++) {
    stepArena(a, input);
    expect(a.hp).toBeGreaterThanOrEqual(0); expect(a.hp).toBeLessThanOrEqual(A4.health);
    expect(a.ammo).toBeGreaterThanOrEqual(0); expect(a.apes.every(e => e.hp >= 0 && e.hp <= A4.apeHealth)).toBe(true);
  }
}
function armed(id: string) {
  const a = createArena(id, true); expect(equipArenaWeapon(a, 'SLING')).toBe(true); return a;
}
function clearRoute(id: string) {
  const a = armed(id); let attacks = 0;
  for (let i = 0; i < 4500 && !a.combatWon && a.status !== 'FAILED'; i++) {
    const danger = a.apes.some(e => e.phase === 'WINDUP' && e.type === 'MELEE') ||
      a.shots.some(s => s.owner === 'APE' && (a.player.centerX - s.x) * s.vx > 0 && Math.abs(s.x - a.player.centerX) < 190);
    tick(a, { ...ARENA_IDLE, sling: i % 66 < 34, jump: danger && a.player.grounded });
    if (a.apes.some(e => e.phase === 'WINDUP')) attacks++;
  }
  expect(a.combatWon, `true-spawn route failed hp=${a.hp}, enemyHP=${a.apes.map(e => e.hp)}, time=${a.combatSeconds}`).toBe(true);
  expect(attacks).toBeGreaterThan(0);
  const wonAt = a.combatSeconds;
  for (let i = 0; i < 400 && a.status !== 'COMPLETE'; i++) tick(a, { ...ARENA_IDLE, right: true });
  expect(a.status).toBe('COMPLETE'); expect(a.combatSeconds).toBe(wonAt); return a;
}
function campaign() { const c = newCampaign('c'); c.bridgeCompleted = true; c.chapter2Completed = true; c.chapter3Completed = true; c.walletCoins = 5; c.deathCount = 3; return c; }

it.each([false, true])('starts with fists even when sling ownership is %s; K cannot auto-equip or fire', hasSling => {
  const a = createArena('hands-first', hasSling); expect(a.weapon).toBe('FISTS');
  tick(a, {...ARENA_IDLE,sling:true},40); tick(a);
  expect(a.charge).toBe(0); expect(a.shotsFired).toBe(0); expect(a.weapon).toBe('FISTS'); expect(a.status).toBe('WAITING');
});
it('resolves actual saved ownership or an explicit pickup payload without granting inventory', () => {
  const c = campaign(), before = structuredClone(c);
  expect(arenaHasSlingshot(c)).toBe(false); expect(arenaHasSlingshot(c,{slingshot:true})).toBe(true); expect(c).toEqual(before);
  c.ownedTools=['slingshot']; expect(arenaHasSlingshot(c)).toBe(true); expect(arenaHasSlingshot(c,{slingshot:false})).toBe(false);
  c.ownedTools=[]; c.inventory=['slingshot']; expect(arenaHasSlingshot(c)).toBe(true);
});
it('a player without a sling can punch normally, cannot equip it, and cannot obtain ammo at a pile', () => {
  const a = createArena('empty-bag'); expect(equipArenaWeapon(a,'SLING')).toBe(false);
  a.player.centerX=A4.meleeSpawn-50; tick(a,{...ARENA_IDLE,punch:true}); expect(a.apes[0]!.hp).toBe(149);
  a.player.centerX=A4.refillX[0]!; tick(a,ARENA_IDLE,49); expect(a.ammo).toBe(0); expect(a.weapon).toBe('FISTS');
});
it('bag selection cancels a held draw without a phantom shot or any combat-state reset', () => {
  const s = new ArenaSession(()=>'switch',true); s.equipWeapon('SLING'); s.tick(.1,{...ARENA_IDLE,sling:true});
  expect(s.attempt.charge).toBeGreaterThan(0); s.setPause(true);
  const before = structuredClone(s.attempt); expect(s.equipWeapon('FISTS')).toBe(true);
  s.tick(10,{...ARENA_IDLE,right:true}); expect(s.attempt.player).toEqual(before.player); expect(s.attempt.apes).toEqual(before.apes);
  expect(s.attempt.elapsed).toBe(before.elapsed); expect(s.attempt.ammo).toBe(before.ammo);
  s.setPause(false); s.tick(C.dt,ARENA_IDLE); expect(s.attempt.shotsFired).toBe(0);
  expect(s.equipWeapon('SLING')).toBe(true); s.tick(.1,ARENA_IDLE); expect(s.attempt.charge).toBe(0); expect(s.attempt.shotsFired).toBe(0);
});

it('clears both apes from real spawn using charged shots and the actual exit, with attacks active', () => {
  const a = clearRoute('real'); expect(a.shotsFired).toBeGreaterThanOrEqual(8); expect(a.hp).toBeGreaterThan(0); expect(a.apes.every(e => e.hp === 0)).toBe(true);
  expect(a.winRoute).toBe('CANONICAL');
});
it.each([[9,30], [33,30], [34,32], [37,31], [120,32]])('stationary charge %i/release %i frames fails without defence', (hold, release) => {
  const a = armed('stationary');
  for (let i = 0; i < 4500 && a.status !== 'FAILED' && !a.combatWon; i++) tick(a, { ...ARENA_IDLE, sling: i % (hold + release) < hold });
  expect(a.status, `hp=${a.hp}; enemies=${a.apes.map(e=>e.hp)}`).toBe('FAILED'); expect(a.combatWon).toBe(false);
});
it('does not start time or AI until player input; shared movement/jump remain intact', () => {
  const a = createArena('wait'); tick(a, ARENA_IDLE, 120); expect(a.elapsed).toBe(0); expect(a.apes[0]!.x).toBe(A4.meleeSpawn);
  tick(a, { ...ARENA_IDLE, right: true, jump: true }); expect(a.player.centerX).toBeCloseTo(A4.spawnX + C.speed * C.dt); expect(a.player.feetY).toBeLessThan(C.floor);
});
it('fires only on release, consumes one stone, and charge strength affects damage', () => {
  const a = armed('charge'); tick(a, { ...ARENA_IDLE, sling: true }, 34);
  expect(a.shotsFired).toBe(0); expect(a.charge).toBe(A4.chargeTime); tick(a);
  expect(a.shotsFired).toBe(1); expect(a.ammo).toBe(A4.ammo - 1); expect(a.shots.find(s => s.owner === 'PHOE')!.damage).toBe(A4.shotDamage);
  const b = armed('short'); tick(b, { ...ARENA_IDLE, sling: true }, 9); tick(b); expect(b.shots[0]!.damage).toBeLessThan(A4.shotDamage);
});
it('a missing slingshot cannot shoot and cannot settle; no earlier-chapter inventory is invented', () => {
  const a = createArena('missing', false); tick(a, { ...ARENA_IDLE, sling: true }, 40); tick(a);
  expect(a.shotsFired).toBe(0); expect(a.ammo).toBe(0); expect(() => settleArena(campaign(), a)).toThrow();
});
it('fists are mathematically insufficient within the visible deadline even with perfect uptime', () => {
  expect((Math.ceil(A4.timeLimit / A4.punchCooldown) + 1) * A4.punchDamage).toBeLessThan(2 * A4.apeHealth);
});
it('punch fixture damages only one enemy once per edge and cooldown; windup cannot be stun-locked', () => {
  const a = createArena('punch'); a.player.centerX = A4.meleeSpawn - 50;
  tick(a, { ...ARENA_IDLE, punch: true }); expect(a.apes[0]!.hp).toBe(149); expect(a.apes[1]!.hp).toBe(150);
  tick(a, { ...ARENA_IDLE, punch: true }, 5); expect(a.apes[0]!.hp).toBe(149);
  a.apes[0]!.x = a.player.centerX + 50; a.apes[0]!.phase = 'WINDUP'; a.apes[0]!.phaseLeft = .6; a.punchLeft = 0;
  tick(a, { ...ARENA_IDLE, punch: true }); expect(a.apes[0]!.hp).toBe(148); expect(a.apes[0]!.phase).toBe('WINDUP');
});
it('a well-timed shove creates enough room and stun for a full sling draw and hit', () => {
  const a = armed('shove'); a.player.centerX = A4.meleeSpawn - 50;
  const enemy = a.apes[0]!, before = enemy.x;
  tick(a, { ...ARENA_IDLE, punch: true }); expect(a.events).toContain('shove');
  expect(enemy.x).toBe(before + A4.punchPush); expect(enemy.phase).toBe('STUN');
  tick(a, { ...ARENA_IDLE, sling: true }, 34); tick(a); tick(a, ARENA_IDLE, 8);
  expect(a.shotsFired).toBe(1); expect(enemy.hp).toBe(A4.apeHealth - A4.punchDamage - A4.shotDamage);
  expect(a.hp).toBe(A4.health); expect(enemy.hitLeft).toBeGreaterThan(0);
});
it('an actual hit cancels draw without spending a stone; movement/dodge remain available', () => {
  const a = armed('interruption'); a.player.centerX = A4.meleeSpawn - 70;
  a.charge = .5; a.wasSling = true; a.apes[0]!.phase = 'STRIKE'; a.apes[0]!.phaseLeft = .12;
  tick(a, { ...ARENA_IDLE, sling: true }); expect(a.charge).toBe(0); expect(a.staggerLeft).toBe(A4.hurtStagger);
  expect(a.hp).toBe(A4.health - A4.meleeDamage); expect(a.ammo).toBe(A4.ammo);
  tick(a, { ...ARENA_IDLE, left: true, dodge: true }); expect(a.dodgeLeft).toBeGreaterThan(0);
  tick(a); expect(a.shotsFired).toBe(0); expect(a.ammo).toBe(A4.ammo);
});
it('both apes never begin an overlapping windup/strike, and locked throw aim stays fixed', () => {
  const a = createArena('telegraphs'); let target: [number, number] | null = null;
  for (let i = 0; i < 550 && a.status !== 'FAILED'; i++) {
    tick(a, { ...ARENA_IDLE, right: i < 100, left: i >= 100 && i < 200 });
    expect(a.apes.filter(e => e.phase === 'WINDUP' || e.phase === 'STRIKE').length).toBeLessThanOrEqual(1);
    const thrower = a.apes[1]!;
    if (thrower.phase === 'WINDUP') { if (target) expect([thrower.targetX, thrower.targetY]).toEqual(target); else target = [thrower.targetX, thrower.targetY]; }
    else target = null;
  }
});
it('isolated dodge avoids a live melee strike, consumes its cooldown, then ends', () => {
  const a = createArena('dodge'); a.player.centerX = A4.meleeSpawn - 70; a.apes[0]!.phase = 'STRIKE'; a.apes[0]!.phaseLeft = .12; a.apes[0]!.facing = -1;
  tick(a, { ...ARENA_IDLE, dodge: true }); expect(a.hp).toBe(A4.health); expect(a.dodgeCooldown).toBeGreaterThan(0);
  tick(a, ARENA_IDLE, 20); expect(a.dodgeLeft).toBe(0); const cooldown = a.dodgeCooldown; tick(a, { ...ARENA_IDLE, dodge: true }); expect(a.dodgeCooldown).toBeLessThan(cooldown);
});
it('ammo can be replenished at either pile without currency or a consumable source', () => {
  for (const x of A4.refillX) { const a = createArena(`pile-${x}`, true); a.player.centerX = x; a.ammo = 0; a.status = 'ACTIVE'; tick(a, ARENA_IDLE, 49); expect(a.ammo).toBe(A4.ammo); }
});
it('isolated timer expiry fails visibly, freezes world and cannot award progress', () => {
  const a = createArena('time'); a.status = 'ACTIVE'; a.combatSeconds = A4.timeLimit - C.dt;
  tick(a); expect(a.failure).toBe('TIME'); expect(a.status).toBe('FAILED'); const frozen = structuredClone(a); tick(a, { ...ARENA_IDLE, right: true }, 20);
  expect(a.player).toEqual(frozen.player); expect(a.combatSeconds).toBe(frozen.combatSeconds); expect(() => settleArena(campaign(), a)).toThrow();
});
it('pause cancels held charge and buffered jump, freezes all clocks, and does not fire on resume', () => {
  const s = new ArenaSession(() => 'pause', true); s.equipWeapon('SLING'); s.tick(.1, { ...ARENA_IDLE, sling: true }); s.setPause(true);
  const before = structuredClone(s.attempt); s.tick(10, { ...ARENA_IDLE, right: true }, true); expect(s.attempt).toEqual(before);
  s.setPause(false); s.tick(C.dt, ARENA_IDLE); expect(s.attempt.shotsFired).toBe(0); expect(s.accumulator).toBeCloseTo(0);
});
it('retry restores player/enemy HP, ammo, AI, projectiles and unique attempt, without a reset loop', () => {
  let id = 0; const s = new ArenaSession(() => String(++id), true); s.equipWeapon('SLING'); s.tick(.1, { ...ARENA_IDLE, sling: true });
  for (let i = 0; i < 90; i++) s.tick(C.dt, ARENA_IDLE, true);
  expect(s.generation).toBe(1); expect(s.attempt.hp).toBe(A4.health); expect(s.attempt.apes.map(e => e.hp)).toEqual([150,150]); expect(s.attempt.shots).toEqual([]); expect(s.attempt.ammo).toBe(12); expect(s.attempt.elapsed).toBe(0); expect(s.attempt.weapon).toBe('FISTS'); expect(s.attempt.hasSling).toBe(true);
});
it('same held-input trace agrees at 30/60/144Hz and long stalls are capped', () => {
  const states = [30,60,144].map(hz => { const s = new ArenaSession(() => 'same', true); s.equipWeapon('SLING'); for(let i=0;i<hz*2;i++)s.tick(1/hz,{...ARENA_IDLE,sling:true});return s.attempt; });
  expect(states[1]).toEqual(states[0]); expect(states[2]).toEqual(states[0]);
  const s = new ArenaSession(()=>'stall');s.tick(20,{...ARENA_IDLE,right:true});expect(s.attempt.elapsed).toBeCloseTo(C.dt*C.maxSteps);expect(s.droppedBacklog).toBeGreaterThan(19);
});
it('settlement deduplicates, preserves money/tools, reloads and retains completion after save failure', () => {
  const a = clearRoute('save'), c = campaign(); c.ownedTools = ['slingshot'];
  const once = settleArena(c,a);expect(settleArena(once,a)).toBe(once);expect(once.walletCoins).toBe(5);expect(once.deathCount).toBe(3);expect(once.ownedTools).toEqual(['slingshot']);expect(once.resumeAt).toBe('CHAPTER_5_PENDING');expect(validateCampaign(once)).toBe(true);
  let raw = JSON.stringify(c), fail = true;
  const store = new CampaignStore({ read:()=>raw,write:v=>{if(fail)throw Error('quota');raw=v;} },'unused');store.completeArena(a);expect(store.unsaved).toBe(true);expect(store.campaign.chapter4Completed).toBe(true);fail=false;expect(store.save()).toBe(true);
  const reload = new CampaignStore({ read:()=>raw,write:()=>{} },'unused');expect(reload.loadError).toBeNull();expect(reload.campaign.chapter4Completed).toBe(true);
});
it('rejects malformed completion numbers before corrupting the campaign save', () => {
  const valid = clearRoute('malformed');
  for (const invalid of [
    { ...valid, hp: NaN }, { ...valid, combatSeconds: Infinity },
    { ...valid, combatSeconds: A4.timeLimit }, { ...valid, shotsFired: -1 },
    { ...valid, player: { ...valid.player, feetY: NaN } },
  ]) expect(() => settleArena(campaign(), invalid)).toThrow('Invalid Chapter 4 completion');
});
it('valid old schema2 progress enters Chapter4 without changing durable inventory', () => {
  const c=campaign();delete c.chapter4Completed;delete c.lastChapter4Result;c.resumeAt='CHAPTER_4_PENDING';c.ownedTools=['kept'];let raw=JSON.stringify(c);
  const store=new CampaignStore({read:()=>raw,write:v=>{raw=v;}},'x');expect(store.loadError).toBeNull();expect(store.startArena()).toBe(true);expect(store.campaign.ownedTools).toEqual(['kept']);expect(store.campaign.resumeAt).toBe('CHAPTER_4');
  expect(validateCampaign({...c,chapter4Completed:'yes'})).toBe(false);expect(validateCampaign({...c,resumeAt:'CHAPTER_5_PENDING'})).toBe(false);
});
it('brown ape takes friendly-fire from silver ape thrown rocks and after 3 hits they brawl and drop each other HP', () => {
  const a = createArena('ape-brawl-rocks', true);
  a.status = 'ACTIVE';
  a.player.centerX = 220;
  const brown = a.apes[0]!;
  const silver = a.apes[1]!;
  brown.x = 500;
  silver.x = 700;

  // Hit 1 & 2 from silver ape thrown rocks
  for (let hitNum = 1; hitNum <= 2; hitNum++) {
    a.shots.push({ id: a.nextShot++, owner: 'APE', x: brown.x + 20, y: C.floor - 65, vx: -A4.throwSpeed, vy: 0, damage: A4.throwDamage, age: 0 });
    tick(a, { ...ARENA_IDLE, right: true });
    expect(brown.friendlyHits).toBe(hitNum);
    expect(brown.hp).toBe(A4.apeHealth - hitNum * A4.friendlyFireHitDamage);
    expect(a.events).toContain('friendly_fire');
    expect(brown.phase).not.toBe('BRAWL');
  }

  // 3rd hit triggers mutual BRAWL
  a.shots.push({ id: a.nextShot++, owner: 'APE', x: brown.x + 20, y: C.floor - 65, vx: -A4.throwSpeed, vy: 0, damage: A4.throwDamage, age: 0 });
  tick(a, { ...ARENA_IDLE, right: true });
  expect(a.events).toContain('brawl');
  expect(brown.phase).toBe('BRAWL');
  expect(silver.phase).toBe('BRAWL');
  expect(brown.friendlyHits).toBe(0);

  const brownHpAtBrawlStart = brown.hp;
  const silverHpAtBrawlStart = silver.hp;

  // Let the brawl play out to completion
  tick(a, ARENA_IDLE, 130);
  expect(brown.hp).toBeLessThan(brownHpAtBrawlStart);
  expect(silver.hp).toBeLessThan(silverHpAtBrawlStart);
  expect(brown.phase).not.toBe('BRAWL');
  expect(silver.phase).not.toBe('BRAWL');
});
it('silver ape also takes accidental melee hits from brown ape and triggers mutual brawl on the 3rd hit', () => {
  const a = createArena('ape-brawl-melee', true);
  a.status = 'ACTIVE';
  const brown = a.apes[0]!;
  const silver = a.apes[1]!;
  brown.x = 760;
  silver.x = 810;
  a.player.centerX = 860;

  for (let hitNum = 1; hitNum <= 3; hitNum++) {
    brown.phase = 'STRIKE';
    brown.phaseLeft = A4.meleeStrike;
    brown.facing = 1;
    brown.hit = false;
    tick(a, ARENA_IDLE);
    if (hitNum < 3) {
      expect(silver.friendlyHits).toBe(hitNum);
      expect(silver.hp).toBe(A4.apeHealth - hitNum * A4.friendlyFireHitDamage);
      expect(a.events).toContain('friendly_fire');
    } else {
      expect(a.events).toContain('brawl');
      expect(brown.phase).toBe('BRAWL');
      expect(silver.phase).toBe('BRAWL');
    }
  }
});
it('player can jump onto the fallen stone pillar, crawl under the low stone arch, and outplay/stun the brown ape', () => {
  const a = createArena('obstacle-outplay', true);
  a.status = 'ACTIVE';

  // 1. Jumping onto the Fallen Stone Pillar (A4.pillarX = 380) lands on top of the pillar
  a.player.centerX = A4.pillarX;
  a.player.feetY = C.floor - A4.pillarH - 4;
  a.player.vy = 120;
  a.player.grounded = false;
  tick(a, ARENA_IDLE, 2);
  expect(a.player.support).toBe('arena_pillar');
  expect(a.player.feetY).toBe(C.floor - A4.pillarH);

  // 2. Upright walking into the Low Stone Arch (A4.archX = 580) is blocked by the overhead lintel, but crawling passes under it
  const archLeftEdge = A4.archX - (A4.archW / 2 + 4);
  a.player.centerX = archLeftEdge - 2;
  a.player.feetY = C.floor;
  a.player.grounded = true;
  a.player.support = 'arena_floor';
  tick(a, { ...ARENA_IDLE, right: true }, 5);
  expect(a.player.centerX).toBe(archLeftEdge);

  // Holding crawl (S / ArrowDown) lowers Phoe Htaung into LAYING posture and lets him crawl under the arch
  tick(a, { ...ARENA_IDLE, right: true, crawl: true }, 12);
  expect(a.player.control).toBe('LAYING');
  expect(a.player.centerX).toBeGreaterThan(archLeftEdge + 10);

  // 3. While Phoe Htaung crawls under the arch, the chasing Brown Ape bonks into the stone lintel and is stunned
  const brown = a.apes[0]!;
  brown.x = A4.archX + 52;
  brown.phase = 'IDLE';
  const hpBeforeBonk = brown.hp;
  tick(a, { ...ARENA_IDLE, crawl: true }, 3);
  expect(brown.phase).toBe('STUN');
  expect(brown.hp).toBe(hpBeforeBonk - A4.obstacleBonkDamage);
});
it('brown ape periodically places low stone pillars and logs that corner upright walking until jumped or crawled', () => {
  const a = createArena('dynamic-obstacles', true);
  // Start combat and step until Brown Ape drops its first obstacle
  let dropped = false;
  for (let i = 0; i < 240; i++) {
    tick(a, { ...ARENA_IDLE, right: i === 0 });
    if (a.events.includes('obstacle_drop')) {
      dropped = true;
      break;
    }
  }
  expect(dropped).toBe(true);
  expect(a.obstacles.length).toBe(1);

  // Test PILLAR blocks ground walking until Phoe Htaung jumps over/onto it
  a.obstacles = [{ id: 10, kind: 'PILLAR', x: 300, age: 1, ttl: 14 }];
  const pillarLeftEdge = 300 - (A4.droppedPillarW / 2 + 6);
  a.player.centerX = pillarLeftEdge - 2;
  a.player.feetY = C.floor;
  a.player.grounded = true;
  tick(a, { ...ARENA_IDLE, right: true }, 5);
  expect(a.player.centerX).toBe(pillarLeftEdge);

  // Jumping allows Phoe Htaung to clear the dropped PILLAR and avoid being cornered
  tick(a, { ...ARENA_IDLE, right: true, jump: true }, 1);
  tick(a, { ...ARENA_IDLE, right: true }, 14);
  expect(a.player.centerX).toBeGreaterThan(300);

  // Test LOG blocks upright walking until Phoe Htaung crouches/crawls under it
  a.obstacles = [{ id: 11, kind: 'LOG', x: 460, age: 1, ttl: 14 }];
  const logLeftEdge = 460 - (A4.droppedLogW / 2 + 4);
  a.player.centerX = logLeftEdge - 2;
  a.player.feetY = C.floor;
  a.player.vy = 0;
  a.player.grounded = true;
  tick(a, { ...ARENA_IDLE, right: true }, 5);
  expect(a.player.centerX).toBe(logLeftEdge);

  // Crouching/crawling passes cleanly underneath the dropped LOG
  tick(a, { ...ARENA_IDLE, right: true, crawl: true }, 15);
  expect(a.player.control).toBe('LAYING');
  expect(a.player.centerX).toBeGreaterThan(logLeftEdge + 12);
});
it('defeating both apes spawns the gold pouch greed trap which explodes and kills the player if picked up', () => {
  const a = createArena('greed-gold-trap', true);
  a.status = 'ACTIVE';
  a.apes[0]!.hp = 0;
  a.apes[1]!.hp = 0;
  tick(a, ARENA_IDLE, 1);

  expect(a.combatWon).toBe(true);
  expect(a.goldTrapSpawned).toBe(true);
  expect(a.goldTrapExploded).toBe(false);

  // Picking up the gold pouch triggers the explosion trap and kills the player
  expect(triggerArenaGoldTrap(a)).toBe(true);
  expect(a.goldTrapExploded).toBe(true);
  expect(a.hp).toBe(0);
  expect(a.status).toBe('FAILED');
  expect(a.failure).toBe('GREED_TRAP');
  expect(a.events).toContain('gold_trap_exploded');
});

it('unbreakable stone arch: deflects silver rocks and stuns charging brown ape without cracking or collapsing', () => {
  const a = createArena('unbreakable-arch', false);
  expect(a.archCollapsed).toBe(false);

  a.status = 'ACTIVE';
  // Hit 1: Brown Ape bonks into arch while player is crouched under it
  a.player.centerX = A4.archX;
  a.player.feetY = C.floor;
  a.player.grounded = true;
  a.apes[0]!.x = A4.archX + 50;
  a.apes[0]!.facing = -1;
  tick(a, { ...ARENA_IDLE, crawl: true }, 1);
  expect(a.events).toContain('arch_deflect');
  expect(a.events).toContain('obstacle_outplay');
  expect(a.archCollapsed).toBe(false);
  expect(a.combatWon).toBe(false);
  expect(a.apes[0]!.phase).toBe('STUN');

  // Hit 2: Silver Ape thrown rock hits the arch lintel while player crawls under
  a.shots.push({ id: a.nextShot++, owner: 'APE', x: A4.archX + 10, y: C.floor - 70, vx: -A4.throwSpeed, vy: 0, damage: A4.throwDamage, age: 0 });
  tick(a, { ...ARENA_IDLE, crawl: true }, 1);
  expect(a.events).toContain('arch_deflect');
  expect(a.archCollapsed).toBe(false);
  expect(a.combatWon).toBe(false);

  // Hit 3: Additional Silver Ape rocks continue to be safely deflected without breaking the arch
  a.shots.push({ id: a.nextShot++, owner: 'APE', x: A4.archX + 10, y: C.floor - 70, vx: -A4.throwSpeed, vy: 0, damage: A4.throwDamage, age: 0 });
  tick(a, { ...ARENA_IDLE, crawl: true }, 1);
  expect(a.events).toContain('arch_deflect');
  expect(a.archCollapsed).toBe(false);
  expect(a.combatWon).toBe(false);
  expect(a.apes.every(e => e.hp > 0)).toBe(true);
});

it('speedrun bypass route: player can bypass distracted apes to exit without firing a shot, settling successfully without sling', () => {
  const a = createArena('speedrun-bypass', false);
  a.status = 'ACTIVE';
  a.player.centerX = A4.exitX;
  a.player.feetY = C.floor;
  a.player.grounded = true;

  // Apes are active: bypass is not allowed
  a.apes[0]!.phase = 'IDLE';
  a.apes[1]!.phase = 'IDLE';
  tick(a, ARENA_IDLE, 1);
  expect(a.combatWon).toBe(false);
  expect(a.status).toBe('ACTIVE');

  // Apes are distracted (Brown in STUN, Silver in RECOVER)
  a.apes[0]!.phase = 'STUN';
  a.apes[0]!.phaseLeft = 1.0;
  a.apes[1]!.phase = 'RECOVER';
  a.apes[1]!.phaseLeft = 1.0;
  tick(a, ARENA_IDLE, 1);
  expect(a.combatWon).toBe(true);
  expect(a.winRoute).toBe('SPEEDRUN_BYPASS');
  expect(a.status).toBe('COMPLETE');
  expect(a.events).toContain('won');
  expect(a.events).toContain('complete');
  expect(a.apes.some(e => e.hp > 0)).toBe(true);

  // Settle campaign without slingshot and with living apes
  const c = campaign();
  const settled = settleArena(c, a);
  expect(settled.chapter4Completed).toBe(true);
  expect(settled.resumeAt).toBe('CHAPTER_5_PENDING');
  expect(settled.lastChapter4Result?.shotsFired).toBe(0);
  expect(validateCampaign(settled)).toBe(true);
});

it('settleArena strictly enforces slingshot requirement only for CANONICAL route', () => {
  const c = campaign();

  // CANONICAL without sling throws
  const canonicalNoSling = createArena('c-no-sling', false);
  canonicalNoSling.status = 'COMPLETE';
  canonicalNoSling.combatWon = true;
  canonicalNoSling.winRoute = 'CANONICAL';
  canonicalNoSling.apes.forEach(e => { e.hp = 0; e.phase = 'DOWN'; });
  canonicalNoSling.player.centerX = A4.exitX;
  canonicalNoSling.player.feetY = C.floor;
  canonicalNoSling.player.grounded = true;
  expect(() => settleArena(c, canonicalNoSling)).toThrow('Invalid Chapter 4 completion');

  // CANONICAL with living apes throws
  const canonicalApesAlive = createArena('c-alive', true);
  canonicalApesAlive.status = 'COMPLETE';
  canonicalApesAlive.combatWon = true;
  canonicalApesAlive.winRoute = 'CANONICAL';
  canonicalApesAlive.player.centerX = A4.exitX;
  canonicalApesAlive.player.feetY = C.floor;
  canonicalApesAlive.player.grounded = true;
  expect(() => settleArena(c, canonicalApesAlive)).toThrow('Invalid Chapter 4 completion');

  // CANONICAL with sling and dead apes succeeds
  const canonicalValid = createArena('c-valid', true);
  canonicalValid.status = 'COMPLETE';
  canonicalValid.combatWon = true;
  canonicalValid.winRoute = 'CANONICAL';
  canonicalValid.apes.forEach(e => { e.hp = 0; e.phase = 'DOWN'; });
  canonicalValid.player.centerX = A4.exitX;
  canonicalValid.player.feetY = C.floor;
  canonicalValid.player.grounded = true;
  expect(settleArena(c, canonicalValid).chapter4Completed).toBe(true);
});

it('settleArena persists winRoute on lastChapter4Result for all routes', () => {
  const c = campaign();

  // 1. CANONICAL
  const canonical = createArena('c-route', true);
  canonical.status = 'COMPLETE';
  canonical.combatWon = true;
  canonical.winRoute = 'CANONICAL';
  canonical.apes.forEach(e => { e.hp = 0; e.phase = 'DOWN'; });
  canonical.player.centerX = A4.exitX;
  canonical.player.feetY = C.floor;
  canonical.player.grounded = true;
  const settled1 = settleArena(c, canonical);
  expect(settled1.lastChapter4Result?.winRoute).toBe('CANONICAL');

  // 2. SPEEDRUN_BYPASS
  const bypass = createArena('b-route', false);
  bypass.status = 'COMPLETE';
  bypass.combatWon = true;
  bypass.winRoute = 'SPEEDRUN_BYPASS';
  bypass.player.centerX = A4.exitX;
  bypass.player.feetY = C.floor;
  bypass.player.grounded = true;
  const settled2 = settleArena(c, bypass);
  expect(settled2.lastChapter4Result?.winRoute).toBe('SPEEDRUN_BYPASS');
});

it('ape roar: emits ape_roar event on combat start and ape windup, and sets roarTimeLeft', () => {
  const a = createArena('ape-roar-test', false);
  expect(a.status).toBe('WAITING');

  // Input triggers active transition and opening roar
  tick(a, { ...ARENA_IDLE, right: true }, 1);
  expect(a.status).toBe('ACTIVE');
  expect(a.events).toContain('ape_roar');
  expect(a.apes.every(e => (e.roarTimeLeft ?? 0) > 0)).toBe(true);

  // Silver Ape windup triggers roar
  const silver = a.apes.find(e => e.id === 'silver')!;
  silver.cooldown = 0;
  a.attackGap = 0;
  tick(a, ARENA_IDLE, 1);
  expect(a.events).toContain('ape_roar');
  expect(silver.phase).toBe('WINDUP');
  expect((silver.roarTimeLeft ?? 0)).toBeGreaterThan(0);
});

it('phoe htaung has 3 health bars and dies after exactly 3 hits (like chapter 5)', () => {
  const a = createArena('three-hit-health', true);
  a.status = 'ACTIVE';
  expect(a.hp).toBe(3);
  expect(A4.health).toBe(3);

  // Hit 1: 3 -> 2
  a.shots.push({ id: a.nextShot++, owner: 'APE', x: a.player.centerX, y: a.player.feetY - 40, vx: -A4.throwSpeed, vy: 0, damage: A4.throwDamage, age: 0 });
  tick(a, ARENA_IDLE, 1);
  expect(a.hp).toBe(2);
  expect(a.status).toBe('ACTIVE');

  // Clear hurt grace time
  a.hurtLeft = 0;

  // Hit 2: 2 -> 1
  a.shots.push({ id: a.nextShot++, owner: 'APE', x: a.player.centerX, y: a.player.feetY - 40, vx: -A4.throwSpeed, vy: 0, damage: A4.throwDamage, age: 0 });
  tick(a, ARENA_IDLE, 1);
  expect(a.hp).toBe(1);
  expect(a.status).toBe('ACTIVE');

  // Clear hurt grace time
  a.hurtLeft = 0;

  // Hit 3: 1 -> 0 -> FAILED (Death)
  a.shots.push({ id: a.nextShot++, owner: 'APE', x: a.player.centerX, y: a.player.feetY - 40, vx: -A4.throwSpeed, vy: 0, damage: A4.throwDamage, age: 0 });
  tick(a, ARENA_IDLE, 1);
  expect(a.hp).toBe(0);
  expect(a.status).toBe('FAILED');
  expect(a.failure).toBe('HEALTH');
});




