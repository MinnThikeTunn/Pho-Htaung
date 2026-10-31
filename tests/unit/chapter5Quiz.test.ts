import { describe, it, expect } from 'vitest';
import {
  MASTER_QUIZ_POOL,
  QUIZ_POOL_TIER_1,
  QUIZ_POOL_TIER_2,
  QUIZ_POOL_TIER_3,
  QUIZ_POOL_TIER_4,
  generateQuizRun,
  refreshTierQuestions,
  getCheckpointQuestionIndex,
  getTierFromIndex,
  assignActiveClue,
  randomizeQuestionPlacement,
} from '../../src/content/chapter5Quiz';

describe('Chapter 5 80-Question Pool & Dynamic Randomization', () => {
  it('master pool contains exactly 80 unique authentic questions (20 per tier)', () => {
    expect(MASTER_QUIZ_POOL.length).toBe(80);
    expect(QUIZ_POOL_TIER_1.length).toBe(20);
    expect(QUIZ_POOL_TIER_2.length).toBe(20);
    expect(QUIZ_POOL_TIER_3.length).toBe(20);
    expect(QUIZ_POOL_TIER_4.length).toBe(20);

    const ids = new Set<number>();
    for (const q of MASTER_QUIZ_POOL) {
      expect(ids.has(q.id)).toBe(false);
      ids.add(q.id);

      expect(q.options.length).toBe(4);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThanOrEqual(3);
      expect(q.question.length).toBeGreaterThan(5);
      expect(q.honestClue.length).toBeGreaterThan(5);
      expect(q.deceptiveClue.length).toBeGreaterThan(5);
      expect(q.honestClue).not.toBe(q.deceptiveClue);
      expect(q.explanation.length).toBeGreaterThan(5);
    }
  });

  it('generateQuizRun produces exactly 20 questions in strict tier order (5 per tier)', () => {
    const history = new Set<number>();
    const run = generateQuizRun(history);

    expect(run.length).toBe(20);

    // Q1-Q5 are Tier 1
    for (let i = 0; i < 5; i++) {
      expect(run[i]!.tier).toBe(1);
    }
    // Q6-Q10 are Tier 2
    for (let i = 5; i < 10; i++) {
      expect(run[i]!.tier).toBe(2);
    }
    // Q11-Q15 are Tier 3
    for (let i = 10; i < 15; i++) {
      expect(run[i]!.tier).toBe(3);
    }
    // Q16-Q20 are Tier 4
    for (let i = 15; i < 20; i++) {
      expect(run[i]!.tier).toBe(4);
    }

    // No duplicate question IDs within a single run
    const runIds = new Set(run.map(q => q.id));
    expect(runIds.size).toBe(20);

    // Every active question has an assigned activeClue
    for (const q of run) {
      expect(q.activeClue).toBeTruthy();
      expect([q.honestClue, q.deceptiveClue]).toContain(q.activeClue);
      expect(typeof q.isClueHonest).toBe('boolean');
    }
  });

  it('assignActiveClue produces a balanced mix of honest and deceptive clues', () => {
    const testQ = QUIZ_POOL_TIER_1[0]!;
    let honestCount = 0;
    const trials = 400;

    for (let i = 0; i < trials; i++) {
      const active = assignActiveClue(testQ);
      if (active.isClueHonest) honestCount++;
    }

    // Around 50% split (within statistical tolerance 40% - 60%)
    const ratio = honestCount / trials;
    expect(ratio).toBeGreaterThan(0.38);
    expect(ratio).toBeLessThan(0.62);
  });

  it('checkpoint retry refreshes only the failed tier with fresh questions without duplicates', () => {
    const history = new Set<number>();
    const initialRun = generateQuizRun(history);

    // Initial run uses 20 IDs in history
    expect(history.size).toBe(20);

    // Failed at Tier 2 (Q6-Q10, checkpointIdx = 5)
    const freshTier2 = refreshTierQuestions(2, history);
    expect(freshTier2.length).toBe(5);

    // Fresh tier 2 questions must all be tier 2
    for (const q of freshTier2) {
      expect(q.tier).toBe(2);
    }

    // Since pool has 20 questions and only 5 were used, all 5 fresh questions must be unseen!
    const initialTier2Ids = initialRun.slice(5, 10).map(q => q.id);
    for (const q of freshTier2) {
      expect(initialTier2Ids).not.toContain(q.id);
    }
  });

  it('checkpoint index and tier calculations match specification', () => {
    expect(getCheckpointQuestionIndex(0)).toBe(0);
    expect(getCheckpointQuestionIndex(4)).toBe(0);
    expect(getCheckpointQuestionIndex(5)).toBe(5);
    expect(getCheckpointQuestionIndex(9)).toBe(5);
    expect(getCheckpointQuestionIndex(10)).toBe(10);
    expect(getCheckpointQuestionIndex(14)).toBe(10);
    expect(getCheckpointQuestionIndex(15)).toBe(15);
    expect(getCheckpointQuestionIndex(19)).toBe(15);

    expect(getTierFromIndex(0)).toBe(1);
    expect(getTierFromIndex(5)).toBe(2);
    expect(getTierFromIndex(10)).toBe(3);
    expect(getTierFromIndex(15)).toBe(4);
  });

  it('randomizeQuestionPlacement uniformly distributes correct answers across all slots (က, ခ, ဂ, ဃ)', () => {
    const counts = [0, 0, 0, 0];
    const testQ = QUIZ_POOL_TIER_1[0]!;
    const trials = 400;

    for (let i = 0; i < trials; i++) {
      const randomized = randomizeQuestionPlacement(testQ);
      counts[randomized.correctIndex] = (counts[randomized.correctIndex] ?? 0) + 1;
      expect(randomized.options[randomized.correctIndex]!.text).toBe('ထီး');
      expect(randomized.honestClue).toContain(`(${randomized.options[randomized.correctIndex]!.label})`);
      expect(randomized.correctIndex).toBeGreaterThanOrEqual(0);
      expect(randomized.correctIndex).toBeLessThanOrEqual(3);
    }

    // Each slot should receive roughly 25% of occurrences (between 15% and 35%)
    for (let slot = 0; slot < 4; slot++) {
      const ratio = (counts[slot] ?? 0) / trials;
      expect(ratio).toBeGreaterThan(0.15);
      expect(ratio).toBeLessThan(0.35);
    }
  });

  it('generateQuizRun distributes answers across all 4 option slots across a run', () => {
    const slotCounts = [0, 0, 0, 0];
    // Sample multiple runs and verify answer slot distribution
    for (let r = 0; r < 20; r++) {
      const run = generateQuizRun(new Set());
      for (const q of run) {
        slotCounts[q.correctIndex] = (slotCounts[q.correctIndex] ?? 0) + 1;
        expect(q.honestClue).toContain(`(${q.options[q.correctIndex]!.label})`);
      }
    }

    // Over 400 questions, each slot should be well represented (no slot dominating)
    for (let slot = 0; slot < 4; slot++) {
      expect(slotCounts[slot] ?? 0).toBeGreaterThan(60);
      expect(slotCounts[slot] ?? 0).toBeLessThan(140);
    }
  });
});
