import { describe, expect, it } from 'vitest';
import { C, STEP } from '../../src/content/chapter1';
import { createAttempt } from '../../src/domain/createAttempt';
import { NO_INPUT } from '../../src/domain/types';
import type { Attempt, Input, Stone } from '../../src/domain/types';
import { playerRect, preview, step, weighted } from '../../src/domain/step';
import { newCampaign, settle, validateCampaign } from '../../src/domain/settlement';
import { CampaignStore } from '../../src/services/CampaignStore';
import { Session } from '../../src/services/Session';
import { sweep } from '../../src/domain/collision';

const run = (a: Attempt, seconds: number, input: Partial<Input> = {}) => {
  for (let i = 0; i < Math.round(seconds / C.dt); i++) step(a, { ...NO_INPUT, ...input });
};
const rock = (id: string, x: number, bottom = 640, falling = false, vy = 0): Stone =>
  ({ id, centerX: x, bottomY: bottom, vy, state: falling ? 'FALLING' : 'SETTLED', support: falling ? null : 'ground' });
const active = () => { const a = createAttempt('A', 'test'); a.status = 'ACTIVE'; return a; };
function finished(id: string, coins = 15, preset: 'A' | 'B' | 'C' = 'A') {
  const a = createAttempt(preset, id); a.status = 'COMPLETE'; a.player.control = 'EXITING'; a.coins = coins; a.elapsed = 12;
  if (coins === 15) a.pickups.forEach(p => p.collected = true);
  else a.pickups.filter(p => p.value === 1).slice(0, coins).forEach(p => p.collected = true);
  return a;
}
describe('Chapter 1 canonical rules', () => {
  it('T01: idle is dormant', () => { const a = createAttempt('A', 'idle'); run(a, 20); expect(a.elapsed).toBe(0); expect(a.stones).toHaveLength(0); });
  it('A01: starts automatically after four active seconds', () => { const a = active(); run(a, 4); expect(a.machine.state).toBe('TRACK'); expect(a.machine.elapsed).toBeCloseTo(0); });
  it('A02/T02: first E immediately tracks with a movement lock', () => {
    const a = createAttempt('A', 'e'); step(a, { ...NO_INPUT, taunt: true, right: true });
    expect(a.machine.state).toBe('TRACK'); expect(a.player.control).toBe('TAUNTING'); expect(a.player.centerX).toBe(96);
    run(a, .35); expect(a.player.control).toBe('FREE');
  });
  it('A04: target follows then freezes', () => {
    const a = active(); step(a, { ...NO_INPUT, taunt: true }); run(a, .55); expect(a.machine.state).toBe('LOCKED');
    const x = a.machine.targetX; run(a, .2, { right: true }); expect(a.machine.targetX).toBe(x);
  });
  it('A06: a grounded rock is safe and pushable', () => {
    const a = active(); a.stones.push(rock('r', 162)); run(a, .1, { right: true });
    expect(a.status).toBe('ACTIVE'); expect(a.stones[0]!.centerX).toBeCloseTo(171); expect(a.player.pushing).toBe(true);
  });
  it('A05: falling contact kills once before pickup', () => {
    const a = active(); a.player.centerX = 160; a.stones.push(rock('r', 160, 580, true, 900)); step(a, NO_INPUT);
    expect(a.status).toBe('DEAD'); expect(a.coins).toBe(0); expect(a.events.filter(e => e.kind === 'death')).toHaveLength(1);
  });
  it('A07: fast rock breaks gate and continues through wood', () => {
    const a = active(); a.stones.push(rock('r', 1136, 350, true, 6000)); step(a, NO_INPUT);
    expect(a.gateIntact).toBe(false); expect(a.stones[0]!.bottomY).toBeGreaterThan(360); expect(a.stones[0]!.state).toBe('FALLING');
  });
  it('A08: pouch survives shelf destruction and falls to floor', () => {
    const a = active(); a.stones.push(rock('r', 896, 310, true, 1200)); run(a, 1.1);
    expect(a.shelfIntact).toBe(false); expect(a.pickups.find(p => p.id === 'gold_pouch')!.y).toBe(628);
    expect(a.pickups.find(p => p.id === 'gold_pouch')!.value).toBe(10);
  });
  it('A09: shatters just the two contacting rocks', () => {
    const a = active(); a.stones = [rock('base', 400), rock('fall', 400, 530, true, 3000), rock('other', 250)];
    step(a, NO_INPUT); expect(a.stones.map(s => s.id)).toEqual(['other']);
  });
  it('A11: player alone is insufficient pressure', () => { const a = active(); a.player.centerX = 400; run(a, .5); expect(a.liftY).toBe(C.liftHome); });
  it('A12/A13: pressure is derived, not latched', () => {
    const a = active(); a.stones.push(rock('base', 400)); run(a, 1.1); expect(a.liftY).toBe(C.liftRaised);
    a.stones.push(rock('fall', 400, 530, true, 3000)); run(a, .3); expect(a.plateWeighted).toBe(false); expect(a.liftY).toBeGreaterThan(C.liftRaised);
  });
  it('A14: descending lift stops above the player', () => {
    const a = active(); a.liftY = 500; a.player.centerX = 704; a.player.feetY = 580; a.player.vy = 0;
    step(a, NO_INPUT); expect(a.liftY).toBeLessThanOrEqual(508); expect(a.status).toBe('ACTIVE');
  });
  it('A15: breaking lift-supported rock clears support correctly', () => {
    const a = createAttempt('C', 'c'); a.status = 'ACTIVE'; a.stones.push(rock('fall', 704, 320, true, 3000));
    step(a, NO_INPUT); expect(a.stones.map(s => s.id)).toEqual(['initial_1']); expect(a.plateWeighted).toBe(true);
  });
  it('A18: exit ignores coins and wood flags', () => {
    const a = active(); a.player.centerX = 1234; step(a, NO_INPUT);
    expect(a.status).toBe('COMPLETE'); expect(a.coins).toBe(0); expect(a.gateIntact).toBe(true);
  });
  it('A19: pickup overlap never duplicates credit', () => {
    const a = active(); a.player.centerX = 160; run(a, .2); expect(a.coins).toBe(1);
  });
  it('A24/A26: fresh preset snapshots never share mutable entities', () => {
    const first = createAttempt('C', 'one'); first.stones[0]!.centerX = 10; first.gateIntact = false;
    const next = createAttempt('C', 'two'); expect(next.stones[0]!.centerX).toBe(400); expect(next.gateIntact).toBe(true);
    expect(next.liftY).toBe(424); expect(weighted(next)).toBe(true);
  });
  it('A26: B initial stone is exactly center256, floor640, plate unweighted',()=>{
    const b=createAttempt('B','b');expect(b.stones).toHaveLength(1);expect(b.stones[0]!.centerX).toBe(256);expect(b.stones[0]!.bottomY).toBe(640);expect(b.plateWeighted).toBe(false);expect(b.liftY).toBe(544);
  });
  it('A28: a thin solid is detected by a swept test', () => {
    const a = { ...STEP, id: 'p', x: 700, y: 100, w: 36, h: 56, vx: 0, vy: 50000, kind: 'player' as const };
    const b = { id: 'thin', x: 640, y: 424, w: 128, h: 16, vx: 0, vy: 0, kind: 'solid' as const };
    expect(sweep(a, b, C.dt)?.ny).toBe(-1);
  });
  it('A31: preview hits an obstructing step rock from a ground-side target', () => {
    const a = active(); a.player.centerX = 450;
    a.stones = [{ ...rock('stepRock', 528, 544), support: 'fixed_step', state: 'SUPPORTED' }];
    expect(preview(a).surfaces[0]!.shatter).toBe(true);
  });
});
describe('Campaign settlement and storage', () => {
  it('A21/A23: 5→15→15 credits5→10→0, duplicate no-op', () => {
    let c = newCampaign('campaign');
    for (const [id, total, credit] of [['one', 5, 5], ['two', 15, 10], ['three', 15, 0]] as const) {
      const result = settle(c, finished(id, total), 'CAMPAIGN', 0); c = result.campaign;
      expect(result.result!.creditedCoins).toBe(credit);
    }
    expect(c.walletCoins).toBe(15); expect(settle(c, finished('one', 5), 'CAMPAIGN', 0).duplicate).toBe(true);
  });
  it('A22: spending never lowers best-earned amount', () => {
    const c = settle(newCampaign('c'), finished('one'), 'CAMPAIGN', 0).campaign; c.walletCoins = 0;
    expect(settle(c, finished('two'), 'REPLAY', 0).campaign.walletCoins).toBe(0);
  });
  it('A27/T15: practice pays zero, preserves progress and separate records', () => {
    const c = settle(newCampaign('c'), finished('one', 5), 'CAMPAIGN', 0).campaign; c.resumeAt = 'CHAPTER_3_PENDING';
    const next = settle(c, finished('b', 15, 'B'), 'PRACTICE', 0).campaign;
    expect(next.walletCoins).toBe(5); expect(next.chapter2BestBankedCoins).toBe(5); expect(next.resumeAt).toBe('CHAPTER_3_PENDING');
    expect(next.bestResultByPresetAndCoinTotal['B:15']).toBe(12);
  });
  it('T18: invalid pickup ledger is rejected', () => {
    const a = finished('bad'); a.coins = 14; expect(() => settle(newCampaign('c'), a, 'CAMPAIGN', 0)).toThrow();
  });
  it('T12: failed writes retain one in-memory receipt, can retry save', () => {
    let saved: string | null = null, fail = true;
    const store = new CampaignStore({ read: () => saved, write: value => { if (fail) throw Error('quota'); saved = value; } }, 'c');
    store.complete(finished('done'), 'CAMPAIGN', 0); expect(store.unsaved).toBe(true);
    store.complete(finished('done'), 'CAMPAIGN', 0); expect(store.campaign.walletCoins).toBe(15);
    fail = false; expect(store.save()).toBe(true); expect(validateCampaign(JSON.parse(saved!))).toBe(true);
  });
  it('T13: invalid save is not overwritten', () => {
    let raw = '{broken'; const store = new CampaignStore({ read: () => raw, write: v => { raw = v; } }, 'c');
    expect(store.loadError).not.toBeNull(); expect(store.save()).toBe(false); expect(raw).toBe('{broken');
  });
  it('T14: detects another writer revision', () => {
    let raw = JSON.stringify(newCampaign('c'));
    const store = new CampaignStore({ read: () => raw, write: v => { raw = v; } }, 'c');
    const changed = JSON.parse(raw); changed.revision = 10; raw = JSON.stringify(changed);
    expect(store.save()).toBe(false); expect(store.conflict).toBe(true);
  });
  it('A23/T19: reload retains receipts; an old callback after a later clear is a no-op',()=>{
    let raw:string|null=null;const adapter={read:()=>raw,write:(s:string)=>{raw=s;}};
    const first=new CampaignStore(adapter,'c');first.complete(finished('old',5),'CAMPAIGN',0);first.complete(finished('new',15),'REPLAY',0);
    const reload=new CampaignStore(adapter,'unused');const revision=reload.campaign.revision;
    expect(reload.complete(finished('old',5),'CAMPAIGN',0)).toBeNull();expect(reload.campaign.walletCoins).toBe(15);expect(reload.campaign.revision).toBe(revision);
  });
  it('A20/A24: death after collecting15 resets full C snapshot, never adds wallet',()=>{
    let raw:string|null=null;const store=new CampaignStore({read:()=>raw,write:(s:string)=>{raw=s;}},'c');store.complete(finished('bank',5),'CAMPAIGN',0);
    let n=0;const s=new Session('C',()=>`death-${n++}`);s.attempt.status='ACTIVE';s.attempt.coins=15;s.attempt.pickups.forEach(p=>p.collected=true);s.attempt.gateIntact=false;s.attempt.shelfIntact=false;s.attempt.liftY=500;
    s.attempt.stones.push(rock('hazard',96,580,true,900));s.tick(C.dt,NO_INPUT);expect(s.attempt.status).toBe('DEAD');
    store.death(s.attempt.id);store.death(s.attempt.id);s.tick(.9,NO_INPUT);
    expect(s.attempt.coins).toBe(0);expect(s.attempt.gateIntact).toBe(true);expect(s.attempt.shelfIntact).toBe(true);expect(s.attempt.liftY).toBe(424);expect(s.attempt.stones).toHaveLength(2);
    expect(store.campaign.walletCoins).toBe(5);expect(store.campaign.deathCount).toBe(1);
  });
});
describe('Lifecycle', () => {
  let id = 0; const session = () => new Session('A', () => `attempt_${id++}`);
  it('T04: R requires release before rearming', () => {
    const s = session(); for (let i = 0; i < 120; i++) s.tick(C.dt, NO_INPUT, true);
    expect(s.generation).toBe(1);
    s.tick(C.dt, NO_INPUT); for (let i = 0; i < 30; i++) s.tick(C.dt, NO_INPUT, true); expect(s.generation).toBe(2);
  });
  it('A20/T05: death clock continues while physics freezes, pauses correctly', () => {
    const s = session(); s.attempt.status = 'DEAD'; s.attempt.coins = 15;
    s.tick(.25, NO_INPUT); expect(s.attempt.status).toBe('DEAD');
    s.setPause(true); s.tick(10, NO_INPUT); expect(s.deathElapsed).toBe(.25);
    s.setPause(false); s.tick(.65, NO_INPUT); expect(s.attempt.status).toBe('WAITING'); expect(s.attempt.coins).toBe(0);
  });
  it('T20: drops excessive backlog', () => { const s = session(); s.tick(2, { ...NO_INPUT, right: true }); expect(s.droppedBacklog).toBeGreaterThan(1); expect(s.attempt.elapsed).toBeCloseTo(8 / 60); });
});

describe('Chapter 2 enhancements (Pho-Htaung-Safe.docx specifications)', () => {
  it('does NOT automatically collect items on simple walk-over without grab input', () => {
    const a = active();
    a.player.centerX = 536; a.player.feetY = 544;
    step(a, NO_INPUT);
    expect(a.hasPole).toBe(false);

    a.player.centerX = 860; a.player.feetY = 320;
    step(a, NO_INPUT);
    expect(a.hasCog).toBe(false);
  });

  it('collects bamboo pole and cog, activates door gear box to reveal platforms on explicit grab (E)', () => {
    const a = active();
    a.player.centerX = 536; a.player.feetY = 544;
    step(a, { ...NO_INPUT, taunt: true });
    expect(a.hasPole).toBe(true);

    a.player.centerX = 860; a.player.feetY = 320;
    step(a, { ...NO_INPUT, taunt: true });
    expect(a.hasCog).toBe(true);

    a.player.centerX = 1104; a.player.feetY = 640;
    step(a, { ...NO_INPUT, taunt: true });
    expect(a.gearBoxActive).toBe(true);
    expect(a.platformsRevealed).toBe(true);

    a.player.centerX = 205; a.player.feetY = 304;
    step(a, { ...NO_INPUT, taunt: true });
    expect(a.hasSlingshot).toBe(true);
  });

  it('triggers 40s beehive drop hazard', () => {
    const a = active();
    a.elapsed = 39.9;
    step(a, NO_INPUT, 0.2);
    expect(a.beehiveTriggered).toBe(true);
    expect(a.events.some(e => e.kind === 'beehive')).toBe(true);
  });

  it('triggers Die Again surprise floor trap when stepping blindly on 1150-1220 ground', () => {
    const a = active();
    a.player.centerX = 1180; a.player.feetY = 640; a.player.grounded = true;
    step(a, NO_INPUT);
    expect(a.trapFloorOpen).toBe(true);
    expect(a.status).toBe('DEAD');
    expect(a.events.some(e => e.kind === 'trap')).toBe(true);
  });

  it('allows jumping safely over the floor trap to exit', () => {
    const a = active();
    a.player.centerX = 1180; a.player.feetY = 580; a.player.grounded = false; a.player.vy = -200;
    step(a, NO_INPUT);
    expect(a.status).toBe('ACTIVE');
    expect(a.trapFloorOpen).toBe(false);

    a.player.centerX = 1235; a.player.feetY = 640; a.player.vy = 0; a.player.grounded = true;
    step(a, NO_INPUT);
    expect(a.status).toBe('COMPLETE');
  });

  it('switches to LAYING when down is pressed while grounded, reducing height by 55% and speed to 40%', () => {
    const a = active();
    a.player.centerX = 100; a.player.feetY = 640; a.player.grounded = true;
    expect(a.player.control).toBe('FREE');
    expect(playerRect(a.player).h).toBe(C.playerH);

    // Press down
    step(a, { left: false, right: false, jump: false, taunt: false, down: true });
    expect(a.player.control).toBe('LAYING');
    expect(playerRect(a.player).h).toBe(Math.round(C.playerH * 0.45));

    // Crawl forward (right) while holding down
    step(a, { left: false, right: true, jump: false, taunt: false, down: true });
    expect(a.player.vx).toBeCloseTo(C.speed * 0.40);

    // Releasing down restores FREE control and full height
    step(a, { left: false, right: false, jump: false, taunt: false, down: false });
    expect(a.player.control).toBe('FREE');
    expect(playerRect(a.player).h).toBe(C.playerH);
  });
});
