import { describe, expect, it } from 'vitest';
import { C } from '../../src/content/chapter1';
import { S3 } from '../../src/content/chapter3';
import type { ScaleItemId } from '../../src/content/chapter3';
import { createScaleAttempt, panWeight, queueScaleCommand, scaleGate, settleScale, stepScale } from '../../src/domain/scale';
import type { ScaleAttempt, ScaleInput } from '../../src/domain/scale';
import { overlaps } from '../../src/domain/collision';
import { newCampaign, validateCampaign } from '../../src/domain/settlement';
import { CampaignStore } from '../../src/services/CampaignStore';
import { ScaleSession } from '../../src/services/ScaleSession';

const idle: ScaleInput = { left: false, right: false, jump: false };
function frame(a: ScaleAttempt, input = idle) {
  stepScale(a, input);
  expect(Number.isFinite(a.player.centerX) && Number.isFinite(a.player.feetY)).toBe(true);
  expect(overlaps({ id: 'player', x: a.player.centerX - 18, y: a.player.feetY - 56, w: 36, h: 56 }, scaleGate(a))).toBe(false);
}
function until(a: ScaleAttempt, predicate: () => boolean, input = idle, max = 1000) {
  for (let i = 0; i < max && !predicate(); i++) frame(a, input);
  expect(predicate(), `route stalled: x=${a.player.centerX}, y=${a.player.feetY}, load=${panWeight(a)}, command=${JSON.stringify(a.command)}`).toBe(true);
}
function pick(a: ScaleAttempt, id: ScaleItemId) {
  queueScaleCommand(a, { kind: 'item', id });
  if (id === 'sandbag' && a.locations.sandbag === 'WORLD') {
    until(a, () => Math.abs(a.player.centerX - (S3.shelf.x - C.playerW / 2 - 4)) <= C.speed * C.dt);
    frame(a, { ...idle, jump: true });
  }
  until(a, () => a.locations[id] === 'BAG');
}
function place(a: ScaleAttempt, id: ScaleItemId) {
  queueScaleCommand(a, { kind: 'pan', id }); until(a, () => a.locations[id] === 'PAN');
}
function open(a: ScaleAttempt) { until(a, () => a.gateLift === S3.gateTravel); }
function exit(a: ScaleAttempt) { until(a, () => a.status === 'COMPLETE', { ...idle, right: true }); }
function basic(a: ScaleAttempt) { pick(a, 'stone'); pick(a, 'treasure'); place(a, 'stone'); place(a, 'treasure'); open(a); }
function campaign() { const c = newCampaign('campaign'); c.bridgeCompleted = true; c.chapter2Completed = true; c.walletCoins = 5; c.deathCount = 3; return c; }

describe('Chapter 3 true-spawn routes, production inputs only', () => {
  it('replaying Chapter3 preserves completed Chapter4 and its Chapter5 handoff', () => {
    const a = createScaleAttempt('post-arena-replay'); basic(a); exit(a);
    const c = campaign(); c.chapter3Completed = true; c.chapter4Completed = true; c.resumeAt = 'CHAPTER_5_PENDING';
    const result = settleScale(c, a);
    expect(result.chapter4Completed).toBe(true); expect(result.resumeAt).toBe('CHAPTER_5_PENDING');
    expect(result.walletCoins).toBe(c.walletCoins); expect(validateCampaign(result)).toBe(true);
  });
  it('allows escape while leaving the treasure on the pan', () => {
    const a = createScaleAttempt('leave'); basic(a); exit(a);
    expect(a.locations.treasure).toBe('PAN');
    const c = settleScale(campaign(), a);
    expect(c.chapter3Completed).toBe(true); expect(c.chapter3TreasureRecovered).toBe(false);
    expect(c.walletCoins).toBe(5); expect(c.deathCount).toBe(3); expect(c.resumeAt).toBe('CHAPTER_4_PENDING'); expect(validateCampaign(c)).toBe(true);
  });
  it('recovers treasure by bracing the open gate with the pin', () => {
    const a = createScaleAttempt('brace'); pick(a, 'pin'); basic(a);
    queueScaleCommand(a, { kind: 'latch' }); until(a, () => a.braced);
    pick(a, 'treasure'); for (let i = 0; i < 200; i++) frame(a);
    expect(a.gateLift).toBe(S3.gateTravel); expect(a.locations.pin).toBe('LATCH'); exit(a);
    const c = settleScale(campaign(), a); expect(c.chapter3TreasureRecovered).toBe(true); expect(c.lastChapter3Result?.method).toBe('BRACE');
  });
  it('recovers treasure using substitute weights, with a real jump to the shelf', () => {
    const a = createScaleAttempt('substitute'); pick(a, 'stone'); pick(a, 'sandbag'); pick(a, 'crate'); pick(a, 'treasure');
    place(a, 'stone'); place(a, 'treasure'); open(a); pick(a, 'treasure');
    expect(a.events).toContain('closing'); place(a, 'crate'); place(a, 'sandbag'); open(a); exit(a);
    expect(a.braced).toBe(false); expect(panWeight(a)).toBe(10);
    expect(settleScale(campaign(), a).lastChapter3Result).toMatchObject({ treasureRecovered: true, method: 'WEIGHTS' });
  });
  it('allows the substitute-only route without ever using treasure as a key', () => {
    const a = createScaleAttempt('no-gold'); pick(a, 'stone'); pick(a, 'sandbag'); pick(a, 'crate');
    place(a, 'stone'); place(a, 'sandbag'); place(a, 'crate'); open(a); exit(a);
    expect(a.locations.treasure).toBe('WORLD'); expect(a.status).toBe('COMPLETE');
  });
  it('preserves a valid quick escape and safely holds a closing gate above the player', () => {
    const a = createScaleAttempt('quick'); basic(a); pick(a, 'treasure');
    until(a, () => a.player.centerX >= S3.gateX + 30, { ...idle, right: true });
    for (let i = 0; i < 240; i++) frame(a);
    expect(a.player.feetY).toBe(S3.floor); expect(a.gateLift + C.epsilon).toBeGreaterThanOrEqual(C.playerH);
    exit(a); expect(a.locations.treasure).toBe('BAG'); expect(settleScale(campaign(), a).lastChapter3Result?.method).toBe('TIMING');
  });
});

describe('Chapter 3 interaction and timing rules', () => {
  it('waits at spawn until real input and uses the shared body/movement constants', () => {
    const a = createScaleAttempt('idle'); for (let i = 0; i < 120; i++) frame(a);
    expect(a.elapsed).toBe(0); frame(a, { ...idle, right: true });
    expect(a.player.centerX).toBeCloseTo(S3.spawnX + C.speed * C.dt); expect(a.elapsed).toBe(C.dt);
  });
  it('one distant click walks to the object and collects it without a second click', () => {
    const a = createScaleAttempt('click'); pick(a, 'treasure');
    expect(a.player.centerX).toBeGreaterThan(700); expect(a.command).toBeNull();
    pick(a, 'treasure'); expect(a.locations.treasure).toBe('BAG');
  });
  it('requires a jump for the shelf bag, and keeps it recoverable after a missed approach', () => {
    const a = createScaleAttempt('shelf'); queueScaleCommand(a, { kind: 'item', id: 'sandbag' });
    for (let i = 0; i < 300; i++) frame(a);
    expect(a.locations.sandbag).toBe('WORLD'); expect(a.player.feetY).toBe(640);
    frame(a, { ...idle, jump: true }); until(a, () => a.locations.sandbag === 'BAG');
  });
  it('does not turn underweight, overweight or a wrong item into a death', () => {
    const a = createScaleAttempt('wrong'); pick(a, 'pin'); placeWrong();
    function placeWrong() { queueScaleCommand(a, { kind: 'pan', id: 'pin' }); until(a, () => a.command === null); }
    expect(a.locations.pin).toBe('BAG'); pick(a, 'stone'); place(a, 'stone');
    for (let i = 0; i < 100; i++) frame(a); expect(a.gateLift).toBe(0);
    pick(a, 'treasure'); place(a, 'treasure'); open(a); pick(a, 'crate'); place(a, 'crate');
    expect(panWeight(a)).toBe(14); for (let i = 0; i < 200; i++) frame(a);
    expect(a.gateLift).toBe(0); expect(a.status).toBe('ACTIVE'); pick(a, 'crate'); open(a);
  });
  it('warns before closing and allows immediate restoration', () => {
    const a = createScaleAttempt('warning'); basic(a); pick(a, 'treasure'); const lift = a.gateLift;
    for (let i = 0; i < 60; i++) frame(a); expect(a.gateLift).toBe(lift);
    place(a, 'treasure'); expect(a.events).toContain('balanced'); expect(a.gateLift).toBe(lift);
  });
  it('rejects a pin on a closed gate without consuming it', () => {
    const a = createScaleAttempt('pin'); pick(a, 'pin'); queueScaleCommand(a, { kind: 'latch' }); until(a, () => a.command === null);
    expect(a.braced).toBe(false); expect(a.locations.pin).toBe('BAG');
  });
  it('blocks walking and jumping through the closed gate', () => {
    const a = createScaleAttempt('blocked'); for (let i = 0; i < 350; i++) frame(a, { ...idle, right: true, jump: i % 55 === 0 });
    expect(a.player.centerX).toBeLessThanOrEqual(S3.gateX - C.playerW / 2 + C.epsilon); expect(a.status).toBe('ACTIVE');
  });
  it('manual movement cancels the queued walk', () => {
    const a = createScaleAttempt('cancel'); queueScaleCommand(a, { kind: 'item', id: 'treasure' });
    frame(a, { ...idle, left: true }); expect(a.command).toBeNull(); expect(a.player.centerX).toBeLessThan(S3.spawnX);
  });
  it('new attempts never share mutable item locations', () => {
    const a = createScaleAttempt('a'), b = createScaleAttempt('b'); pick(a, 'stone'); expect(b.locations.stone).toBe('WORLD');
  });
});

describe('Chapter 3 lifecycle and durable progress', () => {
  it('pause freezes gate, attempt and restart clocks; resume clears held commands/backlog', () => {
    let id = 0; const s = new ScaleSession(() => String(++id)); basic(s.attempt);
    queueScaleCommand(s.attempt, { kind: 'item', id: 'treasure' }); s.setPause(true);
    const before = structuredClone(s.attempt); s.tick(20, { ...idle, right: true, jump: true }, true);
    expect(s.attempt).toEqual(before); expect(s.restartTime).toBe(0); s.setPause(false); expect(s.accumulator).toBe(0); expect(s.attempt.command).toBeNull();
  });
  it('held R restores the whole attempt once and requires release before another reset', () => {
    let id = 0; const s = new ScaleSession(() => String(++id)); basic(s.attempt);
    for (let i = 0; i < 120; i++) s.tick(C.dt, idle, true);
    expect(s.generation).toBe(1); expect(s.attempt.locations.treasure).toBe('WORLD'); expect(s.attempt.gateLift).toBe(0); expect(s.attempt.elapsed).toBe(0);
    s.tick(C.dt, idle); for (let i = 0; i < 30; i++) s.tick(C.dt, idle, true); expect(s.generation).toBe(2);
  });
  it('equivalent input traces agree at 30, 60 and 144 render Hz', () => {
    const results = [30, 60, 144].map(hz => { const s = new ScaleSession(() => 'same'); for (let i = 0; i < hz * 2; i++) s.tick(1 / hz, { ...idle, right: true }); return s.attempt; });
    for (const a of results.slice(1)) expect(a).toEqual(results[0]);
  });
  it('caps a long render stall instead of simulating unseen seconds', () => {
    const s = new ScaleSession(() => 'stall'); s.tick(20, { ...idle, right: true }); expect(s.attempt.elapsed).toBeCloseTo(C.dt * C.maxSteps); expect(s.droppedBacklog).toBeGreaterThan(19);
  });
  it('loads older schema-2 saves without resetting money, deaths or legacy inventory', () => {
    const old = campaign(); delete old.chapter3Completed; delete old.chapter3TreasureRecovered; delete old.lastChapter3Result;
    old.resumeAt = 'CHAPTER_3_PENDING'; old.inventory = ['legacy']; let raw = JSON.stringify(old);
    const adapter = { read: () => raw, write: (value: string) => { raw = value; } };
    const store = new CampaignStore(adapter, 'unused'); expect(store.loadError).toBeNull(); expect(store.startScale()).toBe(true);
    const loaded = new CampaignStore(adapter, 'other'); expect(loaded.campaign).toMatchObject({ walletCoins: 5, deathCount: 3, inventory: ['legacy'], resumeAt: 'CHAPTER_3' });
  });
  it('settles once, reloads Chapter 4 pending and never farms gold or loses a recovered relic on replay', () => {
    const a = createScaleAttempt('one'); pick(a, 'pin'); basic(a); queueScaleCommand(a, { kind: 'latch' }); until(a, () => a.braced); pick(a, 'treasure'); exit(a);
    const once = settleScale(campaign(), a); expect(settleScale(once, a)).toBe(once);
    const b = createScaleAttempt('two'); basic(b); exit(b); const twice = settleScale(once, b);
    expect(twice.chapter3TreasureRecovered).toBe(true); expect(twice.lastChapter3Result?.treasureRecovered).toBe(false); expect(twice.walletCoins).toBe(5);
    const loaded = new CampaignStore({ read: () => JSON.stringify(twice), write: () => {} }, 'unused'); expect(loaded.loadError).toBeNull(); expect(loaded.campaign.resumeAt).toBe('CHAPTER_4_PENDING');
  });
  it('retains an unsaved completion and receipt after a disk failure', () => {
    let raw = JSON.stringify(campaign()); let fail = true;
    const store = new CampaignStore({ read: () => raw, write: value => { if (fail) throw Error('disk full'); raw = value; } }, 'unused');
    const a = createScaleAttempt('disk'); basic(a); exit(a); store.completeScale(a);
    expect(store.unsaved).toBe(true); expect(store.campaign.chapter3Completed).toBe(true); expect(store.campaign.walletCoins).toBe(5);
    store.completeScale(a); expect(store.campaign.completedAttemptIds.filter(id => id === 'scale:disk')).toHaveLength(1);
    fail = false; expect(store.save()).toBe(true); expect(store.unsaved).toBe(false);
  });
  it('rejects locked/unfinished exits and malformed new save fields', () => {
    const a = createScaleAttempt('unfinished'); expect(() => settleScale(campaign(), a)).toThrow();
    const c = newCampaign('locked'); expect(new CampaignStore({ read: () => JSON.stringify(c), write: () => {} }, 'x').startScale()).toBe(false);
    expect(validateCampaign({ ...campaign(), chapter3Completed: 'yes' })).toBe(false);
    expect(validateCampaign({ ...campaign(), lastChapter3Result: { attemptId: 'x', activeSeconds: -1, treasureRecovered: true, method: 'BRACE' } })).toBe(false);
    expect(validateCampaign({ ...campaign(), resumeAt: 'CHAPTER_4_PENDING', chapter3Completed: false })).toBe(false);
  });
});
