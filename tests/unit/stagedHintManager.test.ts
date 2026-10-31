import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StagedHintManager } from '../../src/utils/StagedHintManager';
import { PROGRESSIVE_HINTS } from '../../src/content/progressiveHints';

describe('StagedHintManager', () => {
  let manager: StagedHintManager;

  beforeEach(() => {
    vi.useRealTimers();
    manager = new StagedHintManager();
  });

  it('returns stage1 on first interaction', () => {
    const hint = manager.triggerHint('pole', PROGRESSIVE_HINTS.chapter1.pole);
    expect(hint).toBe(PROGRESSIVE_HINTS.chapter1.pole.stage1);
    expect(manager.getStage('pole')).toBe(1);
  });

  it('advances to stage2 on 2nd interaction', () => {
    manager.triggerHint('pole', PROGRESSIVE_HINTS.chapter1.pole);
    const secondHint = manager.triggerHint('pole', PROGRESSIVE_HINTS.chapter1.pole);
    expect(secondHint).toBe(PROGRESSIVE_HINTS.chapter1.pole.stage2);
    expect(manager.getStage('pole')).toBe(2);
  });

  it('advances to stage3 on 3rd interaction', () => {
    manager.triggerHint('pole', PROGRESSIVE_HINTS.chapter1.pole);
    manager.triggerHint('pole', PROGRESSIVE_HINTS.chapter1.pole);
    const thirdHint = manager.triggerHint('pole', PROGRESSIVE_HINTS.chapter1.pole);
    expect(thirdHint).toBe(PROGRESSIVE_HINTS.chapter1.pole.stage3);
    expect(manager.getStage('pole')).toBe(3);
  });

  it('advances stage based on elapsed time (>= 10s -> stage 2, >= 20s -> stage 3)', () => {
    vi.useFakeTimers();
    const now = 1000000;
    vi.setSystemTime(now);

    manager.triggerHint('cog', PROGRESSIVE_HINTS.chapter1.cog);
    expect(manager.getStage('cog')).toBe(1);

    // Fast forward 11 seconds
    vi.setSystemTime(now + 11000);
    expect(manager.getStage('cog')).toBe(2);
    const hintAt11s = manager.triggerHint('cog', PROGRESSIVE_HINTS.chapter1.cog);
    expect(hintAt11s).toBe(PROGRESSIVE_HINTS.chapter1.cog.stage2);

    // Fast forward to 21 seconds since first interaction
    vi.setSystemTime(now + 21000);
    expect(manager.getStage('cog')).toBe(3);
    const hintAt21s = manager.triggerHint('cog', PROGRESSIVE_HINTS.chapter1.cog);
    expect(hintAt21s).toBe(PROGRESSIVE_HINTS.chapter1.cog.stage3);
  });

  it('resets specific hotspot or all hotspots', () => {
    manager.triggerHint('pole', PROGRESSIVE_HINTS.chapter1.pole);
    manager.triggerHint('cog', PROGRESSIVE_HINTS.chapter1.cog);
    manager.triggerHint('pole', PROGRESSIVE_HINTS.chapter1.pole);

    expect(manager.getStage('pole')).toBe(2);
    expect(manager.getStage('cog')).toBe(1);

    manager.reset('pole');
    expect(manager.getStage('pole')).toBe(1);
    expect(manager.getStage('cog')).toBe(1);

    manager.triggerHint('cog', PROGRESSIVE_HINTS.chapter1.cog);
    expect(manager.getStage('cog')).toBe(2);

    manager.reset();
    expect(manager.getStage('cog')).toBe(1);
  });
});
