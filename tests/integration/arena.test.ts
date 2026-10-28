import { expect, it } from 'vitest';
import { A4 } from '../../src/content/chapter4';
import { C } from '../../src/content/chapter1';
import { ARENA_IDLE, createArena, settleArena, stepArena } from '../../src/domain/arena';
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
function clearRoute(id: string) {
  const a = createArena(id); let attacks = 0;
  for (let i = 0; i < 4500 && !a.combatWon && a.status !== 'FAILED'; i++) {
    tick(a, { ...ARENA_IDLE, sling: i % 66 < 34 });
    if (a.apes.some(e => e.phase === 'WINDUP')) attacks++;
  }
  expect(a.combatWon, `true-spawn route failed hp=${a.hp}, enemyHP=${a.apes.map(e => e.hp)}, time=${a.combatSeconds}`).toBe(true);
  expect(attacks).toBeGreaterThan(0);
  const wonAt = a.combatSeconds;
  for (let i = 0; i < 400 && a.status !== 'COMPLETE'; i++) tick(a, { ...ARENA_IDLE, right: true });
  expect(a.status).toBe('COMPLETE'); expect(a.combatSeconds).toBe(wonAt); return a;
}
function campaign() { const c = newCampaign('c'); c.bridgeCompleted = true; c.chapter2Completed = true; c.chapter3Completed = true; c.walletCoins = 5; c.deathCount = 3; return c; }

it('clears both apes from real spawn using charged shots and the actual exit, with attacks active', () => {
  const a = clearRoute('real'); expect(a.shotsFired).toBeGreaterThanOrEqual(10); expect(a.hp).toBeGreaterThan(0); expect(a.apes.every(e => e.hp === 0)).toBe(true);
});
it('does not start time or AI until player input; shared movement/jump remain intact', () => {
  const a = createArena('wait'); tick(a, ARENA_IDLE, 120); expect(a.elapsed).toBe(0); expect(a.apes[0]!.x).toBe(820);
  tick(a, { ...ARENA_IDLE, right: true, jump: true }); expect(a.player.centerX).toBeCloseTo(A4.spawnX + C.speed * C.dt); expect(a.player.feetY).toBeLessThan(C.floor);
});
it('fires only on release, consumes one stone, and charge strength affects damage', () => {
  const a = createArena('charge'); tick(a, { ...ARENA_IDLE, sling: true }, 34);
  expect(a.shotsFired).toBe(0); expect(a.charge).toBe(A4.chargeTime); tick(a);
  expect(a.shotsFired).toBe(1); expect(a.ammo).toBe(A4.ammo - 1); expect(a.shots.find(s => s.owner === 'PHOE')!.damage).toBe(A4.shotDamage);
  const b = createArena('short'); tick(b, { ...ARENA_IDLE, sling: true }, 9); tick(b); expect(b.shots[0]!.damage).toBeLessThan(A4.shotDamage);
});
it('a missing slingshot cannot shoot and cannot settle; no earlier-chapter inventory is invented', () => {
  const a = createArena('missing', false); tick(a, { ...ARENA_IDLE, sling: true }, 40); tick(a);
  expect(a.shotsFired).toBe(0); expect(a.ammo).toBe(A4.ammo); expect(() => settleArena(campaign(), a)).toThrow();
});
it('fists are mathematically insufficient within the visible deadline even with perfect uptime', () => {
  expect((Math.ceil(A4.timeLimit / A4.punchCooldown) + 1) * A4.punchDamage).toBeLessThan(2 * A4.apeHealth);
});
it('punch fixture damages only one enemy once per edge and cooldown; windup cannot be stun-locked', () => {
  const a = createArena('punch'); a.player.centerX = 770;
  tick(a, { ...ARENA_IDLE, punch: true }); expect(a.apes[0]!.hp).toBe(149); expect(a.apes[1]!.hp).toBe(150);
  tick(a, { ...ARENA_IDLE, punch: true }, 5); expect(a.apes[0]!.hp).toBe(149);
  a.apes[0]!.phase = 'WINDUP'; a.apes[0]!.phaseLeft = .6; a.punchLeft = 0;
  tick(a, { ...ARENA_IDLE, punch: true }); expect(a.apes[0]!.phase).toBe('WINDUP');
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
  const a = createArena('dodge'); a.player.centerX = 750; a.apes[0]!.phase = 'STRIKE'; a.apes[0]!.phaseLeft = .12; a.apes[0]!.facing = -1;
  tick(a, { ...ARENA_IDLE, dodge: true }); expect(a.hp).toBe(A4.health); expect(a.dodgeCooldown).toBeGreaterThan(0);
  tick(a, ARENA_IDLE, 20); expect(a.dodgeLeft).toBe(0); const cooldown = a.dodgeCooldown; tick(a, { ...ARENA_IDLE, dodge: true }); expect(a.dodgeCooldown).toBeLessThan(cooldown);
});
it('ammo can be replenished at either pile without currency or a consumable source', () => {
  for (const x of A4.refillX) { const a = createArena(`pile-${x}`); a.player.centerX = x; a.ammo = 0; a.status = 'ACTIVE'; tick(a, ARENA_IDLE, 49); expect(a.ammo).toBe(A4.ammo); }
});
it('isolated timer expiry fails visibly, freezes world and cannot award progress', () => {
  const a = createArena('time'); a.status = 'ACTIVE'; a.combatSeconds = A4.timeLimit - C.dt;
  tick(a); expect(a.failure).toBe('TIME'); expect(a.status).toBe('FAILED'); const frozen = structuredClone(a); tick(a, { ...ARENA_IDLE, right: true }, 20);
  expect(a.player).toEqual(frozen.player); expect(a.combatSeconds).toBe(frozen.combatSeconds); expect(() => settleArena(campaign(), a)).toThrow();
});
it('pause cancels held charge and buffered jump, freezes all clocks, and does not fire on resume', () => {
  const s = new ArenaSession(() => 'pause'); s.tick(.1, { ...ARENA_IDLE, sling: true }); s.setPause(true);
  const before = structuredClone(s.attempt); s.tick(10, { ...ARENA_IDLE, right: true }, true); expect(s.attempt).toEqual(before);
  s.setPause(false); s.tick(C.dt, ARENA_IDLE); expect(s.attempt.shotsFired).toBe(0); expect(s.accumulator).toBeCloseTo(0);
});
it('retry restores player/enemy HP, ammo, AI, projectiles and unique attempt, without a reset loop', () => {
  let id = 0; const s = new ArenaSession(() => String(++id)); s.tick(.1, { ...ARENA_IDLE, sling: true });
  for (let i = 0; i < 90; i++) s.tick(C.dt, ARENA_IDLE, true);
  expect(s.generation).toBe(1); expect(s.attempt.hp).toBe(100); expect(s.attempt.apes.map(e => e.hp)).toEqual([150,150]); expect(s.attempt.shots).toEqual([]); expect(s.attempt.ammo).toBe(12); expect(s.attempt.elapsed).toBe(0);
});
it('same held-input trace agrees at 30/60/144Hz and long stalls are capped', () => {
  const states = [30,60,144].map(hz => { const s = new ArenaSession(() => 'same'); for(let i=0;i<hz*2;i++)s.tick(1/hz,{...ARENA_IDLE,sling:true});return s.attempt; });
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
