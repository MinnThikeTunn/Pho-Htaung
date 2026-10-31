import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CHAPTER1_HINTS,
  CHAPTER2_HINTS,
  CHAPTER3_HINTS,
  CHAPTER5_THINKING_PHRASES,
  PROGRESSIVE_HINTS,
  type Chapter1Hotspot,
  type Chapter2Hotspot,
  type Chapter3Hotspot,
  type StagedHint,
} from '../../src/content/progressiveHints';
import { StagedHintManager } from '../../src/utils/StagedHintManager';
import { MASTER_QUIZ_POOL } from '../../src/content/chapter5Quiz';

describe('Progressive Hint System & Regression Suite', () => {
  const allHotspots: Array<{ id: string; chapter: string; hint: StagedHint }> = [
    ...Object.entries(CHAPTER1_HINTS).map(([id, hint]) => ({ id, chapter: 'Chapter 1', hint })),
    ...Object.entries(CHAPTER2_HINTS).map(([id, hint]) => ({ id, chapter: 'Chapter 2', hint })),
    ...Object.entries(CHAPTER3_HINTS).map(([id, hint]) => ({ id, chapter: 'Chapter 3', hint })),
  ];

  describe('1. Stage 1 Zero-Spoiler Guarantee', () => {
    const DIRECT_SOLUTION_KEYWORDS = [
      'ကွမ်းသီးညှပ်',
      'မောင်းတံ',
      'ကွမ်းတံတွေး',
      'ထိန်းတံပေါက်',
      'အမြန် ကောက်တပ်',
    ] as const;

    it('verifies across ALL hotspots in Chapters 1, 2, and 3 that stage1 dialogue does NOT contain direct solution keywords', () => {
      expect(allHotspots.length).toBe(8); // 3 (ch1) + 2 (ch2) + 3 (ch3)

      for (const { id, chapter, hint } of allHotspots) {
        for (const keyword of DIRECT_SOLUTION_KEYWORDS) {
          expect(
            hint.stage1,
            `[${chapter} hotspot "${id}"] stage1 must not leak direct solution keyword "${keyword}"`
          ).not.toContain(keyword);
        }
      }
    });

    it('stage1 dialogue purely describes the physical obstacle without spoiling items or mechanics', () => {
      for (const { id, chapter, hint } of allHotspots) {
        // Stage 1 must be non-empty and descriptive
        expect(hint.stage1.trim().length).toBeGreaterThan(20);
        // Stage 1 must not contain impatient outburst
        expect(hint.stage1).not.toContain('စိတ်မရှည်တော့ဘူး');
        // Stage 1 must not contain directive phrases to use specific bag items
        expect(hint.stage1).not.toContain('အိတ်ထဲက');
      }
    });
  });

  describe('2. Stage 2 Nudge Verification', () => {
    it('verifies stage2 dialogue contains teasing nudges toward inventory or environment', () => {
      // Chapter 1 nudges
      expect(CHAPTER1_HINTS.pole.stage2).toContain('လွယ်အိတ်');
      expect(CHAPTER1_HINTS.cog.stage2).toContain('ပတ်ဝန်းကျင်');
      expect(CHAPTER1_HINTS.cog.stage2).toContain('ကျားကန်');
      expect(CHAPTER1_HINTS.winch.stage2).toMatch(/(?:ပါးစပ်ထဲကဖြစ်ဖြစ်|အိတ်ထဲကဖြစ်ဖြစ်|ချောဆီ)/);

      // Chapter 2 nudges
      expect(CHAPTER2_HINTS.gearbox_empty.stage2).toContain('အိတ်ထဲမှာ');
      expect(CHAPTER2_HINTS.gearbox_rusted.stage2).toContain('စွတ်စိုပေးစရာ');

      // Chapter 3 nudges
      expect(CHAPTER3_HINTS.pin_on_pan.stage2).toContain('တစ်နေရာရာမှာ စိုက်လျှိုဖို့');
      expect(CHAPTER3_HINTS.reference_weight.stage2).toContain('ကိုယ့်ဘက်က ပစ္စည်းတွေ');
      expect(CHAPTER3_HINTS.latch_closed.stage2).toContain('တံစို့လေး ဘာလေး လျှိုဖို့');
    });

    it('stage2 hints adopt a teasing, comedic tone without prematurely blurting the final solution', () => {
      for (const { id, chapter, hint } of allHotspots) {
        expect(hint.stage2.trim().length).toBeGreaterThan(20);
        // Stage 2 must not have reached the stage 3 impatient outburst
        expect(hint.stage2, `[${chapter} "${id}"] stage2 should not have Stage 3 outburst`).not.toContain('စိတ်မရှည်တော့ဘူး');
      }
    });
  });

  describe('3. Stage 3 Obvious Clue Verification', () => {
    it('verifies stage3 dialogue contains U Gyi\'s impatient outburst ("စိတ်မရှည်တော့ဘူး") across ALL hotspots', () => {
      for (const { id, chapter, hint } of allHotspots) {
        expect(
          hint.stage3,
          `[${chapter} hotspot "${id}"] stage3 must contain U Gyi's impatient outburst "စိတ်မရှည်တော့ဘူး"`
        ).toContain('စိတ်မရှည်တော့ဘူး');
      }
    });

    it('verifies stage3 dialogue contains explicit tool and action directions', () => {
      // Chapter 1 explicit directions
      expect(CHAPTER1_HINTS.pole.stage3).toContain('ကွမ်းသီးညှပ်');
      expect(CHAPTER1_HINTS.pole.stage3).toContain('ဖြတ်ပစ်လိုက်');

      expect(CHAPTER1_HINTS.cog.stage3).toContain('ဝါးလုံး');
      expect(CHAPTER1_HINTS.cog.stage3).toContain('ကလော်ချလိုက်');

      expect(CHAPTER1_HINTS.winch.stage3).toContain('ကွမ်းတံတွေး');
      expect(CHAPTER1_HINTS.winch.stage3).toContain('ထွေးချောဆီထိုး');

      // Chapter 2 explicit directions
      expect(CHAPTER2_HINTS.gearbox_empty.stage3).toContain('သံချေးတက်ဂီယာခွေ');
      expect(CHAPTER2_HINTS.gearbox_empty.stage3).toContain('အမြန် ကောက်တပ်');

      expect(CHAPTER2_HINTS.gearbox_rusted.stage3).toContain('ကွမ်းတံတွေး');
      expect(CHAPTER2_HINTS.gearbox_rusted.stage3).toContain('မောင်းတံ');

      // Chapter 3 explicit directions
      expect(CHAPTER3_HINTS.pin_on_pan.stage3).toContain('သံချောင်း');
      expect(CHAPTER3_HINTS.pin_on_pan.stage3).toContain('ထိန်းတံပေါက်');

      expect(CHAPTER3_HINTS.reference_weight.stage3).toContain('၁၀ ပိဿာ');
      expect(CHAPTER3_HINTS.reference_weight.stage3).toContain('စံအလေးတုံး');

      expect(CHAPTER3_HINTS.latch_closed.stage3).toContain('ထိန်းတံပေါက်');
      expect(CHAPTER3_HINTS.latch_closed.stage3).toContain('သံချောင်း');
    });
  });

  describe('4. StagedHintManager Timing Escalation (Idle Delay)', () => {
    let manager: StagedHintManager;

    beforeEach(() => {
      vi.useFakeTimers();
      manager = new StagedHintManager();
    });

    it('returns Stage 1 initially and on first interaction', () => {
      expect(manager.getStage('pole')).toBe(1);

      const firstHint = manager.triggerHint('pole', CHAPTER1_HINTS.pole);
      expect(firstHint).toBe(CHAPTER1_HINTS.pole.stage1);
      expect(manager.getStage('pole')).toBe(1);
    });

    it('escalates to Stage 2 with an idle delay of >= 10s without multiple clicks', () => {
      const now = 1_000_000;
      vi.setSystemTime(now);

      // Player interacts once at t = 0
      manager.triggerHint('winch', CHAPTER1_HINTS.winch);
      expect(manager.getStage('winch')).toBe(1);

      // Player sits idle for 9.9 seconds (zero clicks)
      vi.setSystemTime(now + 9_900);
      expect(manager.getStage('winch')).toBe(1);

      // Player sits idle for 10.0 seconds (zero clicks) -> escalates to Stage 2!
      vi.setSystemTime(now + 10_000);
      expect(manager.getStage('winch')).toBe(2);

      // Player sits idle for 15.0 seconds (zero clicks) -> remains Stage 2
      vi.setSystemTime(now + 15_000);
      expect(manager.getStage('winch')).toBe(2);

      // When player finally clicks at t = 15s, they receive Stage 2 directly
      const nextHint = manager.triggerHint('winch', CHAPTER1_HINTS.winch);
      expect(nextHint).toBe(CHAPTER1_HINTS.winch.stage2);
    });

    it('escalates to Stage 3 with an idle delay of >= 20s without multiple clicks', () => {
      const now = 2_000_000;
      vi.setSystemTime(now);

      // Player interacts once at t = 0
      manager.triggerHint('gearbox_rusted', CHAPTER2_HINTS.gearbox_rusted);
      expect(manager.getStage('gearbox_rusted')).toBe(1);

      // Player sits idle for 19.9 seconds (zero clicks) -> Stage 2
      vi.setSystemTime(now + 19_900);
      expect(manager.getStage('gearbox_rusted')).toBe(2);

      // Player reaches 20.0 seconds idle time -> escalates to Stage 3!
      vi.setSystemTime(now + 20_000);
      expect(manager.getStage('gearbox_rusted')).toBe(3);

      // Player sits idle for 30.0 seconds
      vi.setSystemTime(now + 30_000);
      expect(manager.getStage('gearbox_rusted')).toBe(3);

      // Single click after 30s idle delivers Stage 3 immediately
      const nextHint = manager.triggerHint('gearbox_rusted', CHAPTER2_HINTS.gearbox_rusted);
      expect(nextHint).toBe(CHAPTER2_HINTS.gearbox_rusted.stage3);
    });

    it('escalates immediately upon rapid multiple clicks even if idle elapsed < 10s', () => {
      const now = 3_000_000;
      vi.setSystemTime(now);

      const h1 = manager.triggerHint('pin_on_pan', CHAPTER3_HINTS.pin_on_pan);
      expect(h1).toBe(CHAPTER3_HINTS.pin_on_pan.stage1);

      vi.setSystemTime(now + 500); // 0.5s later
      const h2 = manager.triggerHint('pin_on_pan', CHAPTER3_HINTS.pin_on_pan);
      expect(h2).toBe(CHAPTER3_HINTS.pin_on_pan.stage2);

      vi.setSystemTime(now + 1_000); // 1.0s later
      const h3 = manager.triggerHint('pin_on_pan', CHAPTER3_HINTS.pin_on_pan);
      expect(h3).toBe(CHAPTER3_HINTS.pin_on_pan.stage3);
    });
  });

  describe('5. Chapter 5 Thinking Delay & Answer Leak Protection', () => {
    it('CHAPTER5_THINKING_PHRASES contains authentic Upper-Burma thinking prompts and satirical comedic jabs', () => {
      expect(CHAPTER5_THINKING_PHRASES.length).toBeGreaterThanOrEqual(8);

      const combinedText = CHAPTER5_THINKING_PHRASES.join(' ');
      expect(combinedText).toContain('ခေါင်းကုတ်');
      expect(combinedText).toContain('အဖြေ ၄ ခုထဲက တစ်ခု');
      expect(combinedText).toContain('ငါ ဦးကြီး');
      expect(combinedText).toContain('ကြက်ဥပြုတ်တောင် ကျက်တော့မယ်');
      expect(combinedText).toContain('ဗေဒင်များ မေးနေတာလား');
      expect(combinedText).toContain('ကျွဲပျောက်တဲ့ မျက်နှာ');
    });

    it('CHAPTER5_THINKING_PHRASES does NOT leak any quiz answers from MASTER_QUIZ_POOL', () => {
      // Gather all correct answers from the 80 quiz questions
      const correctAnswers = MASTER_QUIZ_POOL.map(q => q.options[q.correctIndex]!.text.trim());

      for (const phrase of CHAPTER5_THINKING_PHRASES) {
        // Must not contain explicit answer revelation phrases
        expect(phrase).not.toMatch(/အဖြေက\s*[\u1000-\u1021]/);
        expect(phrase).not.toMatch(/ရွေးစရာ\s*[၁၂၃၄]/);
        expect(phrase).not.toMatch(/အဖြေမှန်က/);

        // Verify none of the longer unique correct answer strings appear verbatim in thinking phrases
        for (const ans of correctAnswers) {
          if (ans.length >= 10) {
            expect(phrase).not.toContain(ans);
          }
        }
      }
    });

    it('All thinking phrases are non-empty, trimmed, and strictly use valid Myanmar Unicode', () => {
      for (const phrase of CHAPTER5_THINKING_PHRASES) {
        expect(phrase.trim()).toBe(phrase);
        expect(phrase.length).toBeGreaterThan(15);
        expect(phrase).toMatch(/[\u1000-\u109F]/);
        expect(phrase).not.toContain('\uFFFD');
        expect(phrase).not.toContain('???');
      }
    });
  });

  describe('6. Structural Integrity & Hotspot Registry', () => {
    it('PROGRESSIVE_HINTS binds chapters 1, 2, 3 and chapter 5 thinking phrases correctly', () => {
      expect(PROGRESSIVE_HINTS.chapter1).toBe(CHAPTER1_HINTS);
      expect(PROGRESSIVE_HINTS.chapter2).toBe(CHAPTER2_HINTS);
      expect(PROGRESSIVE_HINTS.chapter3).toBe(CHAPTER3_HINTS);
      expect(PROGRESSIVE_HINTS.chapter5.thinking_phrases).toBe(CHAPTER5_THINKING_PHRASES);
    });

    it('each hotspot defines 3 distinct non-identical escalation stages', () => {
      for (const { id, chapter, hint } of allHotspots) {
        expect(hint.stage1, `[${chapter} "${id}"] stage1 must differ from stage2`).not.toBe(hint.stage2);
        expect(hint.stage2, `[${chapter} "${id}"] stage2 must differ from stage3`).not.toBe(hint.stage3);
        expect(hint.stage1, `[${chapter} "${id}"] stage1 must differ from stage3`).not.toBe(hint.stage3);
      }
    });
  });
});
