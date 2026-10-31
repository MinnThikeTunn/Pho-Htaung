import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { ARENA_LINES } from '../../src/content/chapter4';
import { SCALE_LINES } from '../../src/content/chapter3';
import { DIALOGUE } from '../../src/content/dialogue.my';
import { UGYI_OPENING_MONOLOGUE, TWIST_STRINGS } from '../../src/content/chapter5';
import {
  CHAPTER1_HINTS,
  CHAPTER2_HINTS,
  CHAPTER3_HINTS,
  CHAPTER5_THINKING_PHRASES,
  PROGRESSIVE_HINTS,
} from '../../src/content/progressiveHints';

/**
 * Raw keyboard shortcut detection.
 * Per the Core Design System & Dialogue Guidelines:
 * - Mechanics must be discovered naturally through spatial affordances and U Gyi's coaching.
 * - Zero raw keyboard letters (Q, W, E, R, A, S, D, C, J, K, L) may appear in dialogue lines.
 * - Zero <kbd> tags or literal SPACE / SPACEBAR tokens.
 */
const FORBIDDEN_RAW_KEYS = ['Q', 'W', 'E', 'R', 'A', 'S', 'D', 'C', 'J', 'K', 'L'] as const;
const RAW_KEY_REGEX = new RegExp(`\\b[${FORBIDDEN_RAW_KEYS.join('')}]\\b`, 'i');
const BURMESE_KEY_COMBO_REGEX = new RegExp(`\\b[${FORBIDDEN_RAW_KEYS.join('')}]\\b\\s*(?:ကို|နဲ့|ဖြင့်|နှိပ်)`, 'i');
const KBD_TAG_REGEX = /<kbd\b[^>]*>.*?<\/kbd>/i;
const SPACE_PROMPT_REGEX = /\b(SPACE|SPACEBAR)\b/i;

function assertNoRawKeyboardShortcuts(line: string, source: string) {
  expect(line, `[${source}] contains isolated raw keyboard letter: "${line}"`).not.toMatch(RAW_KEY_REGEX);
  expect(line, `[${source}] contains raw keyboard particle combo: "${line}"`).not.toMatch(BURMESE_KEY_COMBO_REGEX);
  expect(line, `[${source}] contains <kbd> tag: "${line}"`).not.toMatch(KBD_TAG_REGEX);
  expect(line, `[${source}] contains raw SPACE token: "${line}"`).not.toMatch(SPACE_PROMPT_REGEX);
}

describe('Dialogue Quality & Regression Suite', () => {
  describe('1. Zero Raw Keyboard Shortcuts in Dialogue', () => {
    it('ARENA_LINES contains zero raw keyboard shortcut letters (Q,W,E,R,A,S,D,C,J,K,L) or <kbd> tags', () => {
      const entries = Object.entries(ARENA_LINES);
      expect(entries.length).toBeGreaterThan(0);
      for (const [key, line] of entries) {
        assertNoRawKeyboardShortcuts(line, `ARENA_LINES.${key}`);
      }
    });

    it('SCALE_LINES contains zero raw keyboard shortcut letters (Q,W,E,R,A,S,D,C,J,K,L) or <kbd> tags', () => {
      const entries = Object.entries(SCALE_LINES);
      expect(entries.length).toBeGreaterThan(0);
      for (const [key, line] of entries) {
        assertNoRawKeyboardShortcuts(line, `SCALE_LINES.${key}`);
      }
    });

    it('DIALOGUE contains zero raw keyboard shortcut letters (Q,W,E,R,A,S,D,C,J,K,L) or <kbd> tags', () => {
      const entries = Object.entries(DIALOGUE);
      expect(entries.length).toBeGreaterThan(0);
      for (const [key, line] of entries) {
        assertNoRawKeyboardShortcuts(line, `DIALOGUE.${key}`);
      }
    });

    it('UGYI_OPENING_MONOLOGUE contains zero raw keyboard shortcut letters or <kbd> tags', () => {
      expect(UGYI_OPENING_MONOLOGUE.length).toBeGreaterThan(0);
      UGYI_OPENING_MONOLOGUE.forEach((line, index) => {
        assertNoRawKeyboardShortcuts(line, `UGYI_OPENING_MONOLOGUE[${index}]`);
      });
    });

    it('All dialogue collections enforce natural diegetic guidance without hardware key displays', () => {
      const allLines = [
        ...Object.values(ARENA_LINES),
        ...Object.values(SCALE_LINES),
        ...Object.values(DIALOGUE),
        ...UGYI_OPENING_MONOLOGUE,
      ];

      for (const line of allLines) {
        FORBIDDEN_RAW_KEYS.forEach(key => {
          const isolatedKeyPattern = new RegExp(`(^|[\\s(])(${key})([\\s),.!?:—–-]|$)`, 'i');
          expect(line).not.toMatch(isolatedKeyPattern);
        });
      }
    });
  });

  describe('2. Zero Occurrences of Legacy Speaker "ဦးဘ"', () => {
    const scenesDir = path.resolve(__dirname, '../../src/scenes');

    it('ArenaChapterScene.ts contains zero occurrences of "ဦးဘ"', () => {
      const arenaPath = path.join(scenesDir, 'ArenaChapterScene.ts');
      const content = fs.readFileSync(arenaPath, 'utf-8');
      expect(content).not.toContain('ဦးဘ');
    });

    it('Every scene file under src/scenes contains zero occurrences of "ဦးဘ"', () => {
      const sceneFiles = fs.readdirSync(scenesDir).filter(f => f.endsWith('.ts') || f.endsWith('.js'));
      expect(sceneFiles.length).toBeGreaterThan(0);

      const violations: string[] = [];
      for (const file of sceneFiles) {
        const filePath = path.join(scenesDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        if (content.includes('ဦးဘ')) {
          violations.push(file);
        }
      }

      expect(violations, `Found "ဦးဘ" in scene files: ${violations.join(', ')}`).toEqual([]);
    });

    it('Every content file under src/content contains zero occurrences of "ဦးဘ"', () => {
      const contentDir = path.resolve(__dirname, '../../src/content');
      const contentFiles = fs.readdirSync(contentDir).filter(f => f.endsWith('.ts') || f.endsWith('.js'));
      expect(contentFiles.length).toBeGreaterThan(0);

      const violations: string[] = [];
      for (const file of contentFiles) {
        const filePath = path.join(contentDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        if (content.includes('ဦးဘ')) {
          violations.push(file);
        }
      }

      expect(violations, `Found "ဦးဘ" in content files: ${violations.join(', ')}`).toEqual([]);
    });
  });

  describe('3. Clean Speaker Formatting in SCALE_LINES (Chapter 3)', () => {
    it('SCALE_LINES values contain zero occurrences of "ဦးကြီး — " or "ဖိုးထောင် — "', () => {
      for (const [key, value] of Object.entries(SCALE_LINES)) {
        expect(value, `SCALE_LINES.${key} must not contain 'ဦးကြီး — '`).not.toContain('ဦးကြီး — ');
        expect(value, `SCALE_LINES.${key} must not contain 'ဖိုးထောင် — '`).not.toContain('ဖိုးထောင် — ');
      }
    });

    it('SCALE_LINES values contain zero leading speaker prefixes (e.g. "ဦးကြီး :", "ဖိုးထောင် —")', () => {
      const speakerPrefixRegex = /^(?:ဦးကြီး|ဖိုးထောင်)\s*[-—–:]\s*/;
      for (const [key, value] of Object.entries(SCALE_LINES)) {
        expect(value, `SCALE_LINES.${key} has leading speaker prefix`).not.toMatch(speakerPrefixRegex);
      }
    });

    it('SCALE_LINES values are non-empty and formatted directly as spoken dialogue or UI strings', () => {
      for (const [key, value] of Object.entries(SCALE_LINES)) {
        expect(value.trim().length).toBeGreaterThan(3);
        // Does not start with arbitrary punctuation or brackets
        expect(value).not.toMatch(/^[-—–:\]})]/);
      }
    });
  });

  describe('4. Burmese Orthography in TWIST_STRINGS (Chapter 5)', () => {
    it('TWIST_STRINGS.typewriterReveal contains "ရဦးမှာ"', () => {
      expect(TWIST_STRINGS.typewriterReveal).toContain('ရဦးမှာ');
    });

    it('TWIST_STRINGS.typewriterReveal does NOT contain the misspelling "ရဉီးမှာ"', () => {
      expect(TWIST_STRINGS.typewriterReveal).not.toContain('ရဉီးမှာ');
      // Also ensure no other variation with ဉ (Nya lay U+1009) + vowel/tone
      expect(TWIST_STRINGS.typewriterReveal).not.toMatch(/ရ\u1009[\u102E\u1038]မှာ/);
    });

    it('TWIST_STRINGS includes the canonical punchlines and laugh cue', () => {
      expect(TWIST_STRINGS.laughCue).toContain('ဟား');
      expect(TWIST_STRINGS.endCardTitle).toBe('Act I - Completed');
      expect(TWIST_STRINGS.endCardSub).toContain('ပထမပိုင်း');
      expect(TWIST_STRINGS.ugyiVictoryPrize).toContain('ရွှေသော့');
    });
  });

  describe('5. Authentic Upper-Burmese Comedic Voiceover Integrity', () => {
    it('UGYI_OPENING_MONOLOGUE conveys U Gyi satirical comedic tone and colloquialisms', () => {
      const fullMonologue = UGYI_OPENING_MONOLOGUE.join(' ');
      // Check comedic familial address and satirical trickster hallmarks
      expect(fullMonologue).toContain('ငါ့တူ မောင်ဖိုးထောင်');
      expect(fullMonologue).toContain('ဉာဏ်စမ်းမေးခွန်း');
      expect(fullMonologue).toContain('တုတ်ရိုက်ချက်');
      expect(fullMonologue).toContain('ငကြောင်ရေ့');
      expect(fullMonologue).toContain('ဟားဟားဟား');
    });

    it('ARENA_LINES exhibits authentic Upper-Burmese comedic coaching and taunts', () => {
      const combinedLines = Object.values(ARENA_LINES).join(' ');
      expect(combinedLines).toContain('လောဘအိုး');
      expect(combinedLines).toContain('ငကြောင်');
      expect(combinedLines).toContain('ငထုံ');
      expect(combinedLines).toContain('အောက်လမ်း');
      expect(combinedLines).toContain('မျက်ခွက်');
    });

    it('SCALE_LINES reflects comedic debt stakes and slapstick warnings', () => {
      const combinedLines = Object.values(SCALE_LINES).join(' ');
      expect(combinedLines).toContain('အကြွေးရှင်တွေ');
      expect(combinedLines).toContain('ဓားတမိုးမိုး');
      expect(combinedLines).toContain('ဗုဒ္ဓေါ');
      expect(combinedLines).toContain('မျက်ခွက် မိတ်ဆက်');
    });

    it('DIALOGUE contains iconic folk idioms and Upper-Burmese comedic beats', () => {
      const combinedLines = Object.values(DIALOGUE).join(' ');
      expect(combinedLines).toContain('ကွမ်းတံတွေး');
      expect(combinedLines).toContain('ငါးစာကို သွားဟပ်');
      expect(combinedLines).toContain('သံပုံးခေါင်း');
      expect(combinedLines).toContain('အောက်လမ်းပညာ');
    });

    it('All dialogue lines are non-empty, trimmed, and use valid Myanmar Unicode', () => {
      const dialogueSets = [
        ...Object.values(ARENA_LINES),
        ...Object.values(SCALE_LINES),
        ...Object.values(DIALOGUE),
        ...UGYI_OPENING_MONOLOGUE,
      ];

      for (const line of dialogueSets) {
        expect(line.trim()).toBe(line);
        expect(line.length).toBeGreaterThan(0);
        // Verify text contains valid Myanmar Unicode codepoints (U+1000 - U+109F)
        expect(line).toMatch(/[\u1000-\u109F]/);
        // Verify no replacement characters or corrupted encoding
        expect(line).not.toContain('\uFFFD');
        expect(line).not.toContain('???');
      }
    });
  });

  describe('6. 3-Stage Progressive Hints System (progressiveHints.ts)', () => {
    const allStagedHints = [
      ...Object.values(CHAPTER1_HINTS),
      ...Object.values(CHAPTER2_HINTS),
      ...Object.values(CHAPTER3_HINTS),
    ];

    it('covers all specified hotspots across Chapters 1, 2, 3 and 5', () => {
      expect(CHAPTER1_HINTS.pole).toBeDefined();
      expect(CHAPTER1_HINTS.cog).toBeDefined();
      expect(CHAPTER1_HINTS.winch).toBeDefined();

      expect(CHAPTER2_HINTS.gearbox_empty).toBeDefined();
      expect(CHAPTER2_HINTS.gearbox_rusted).toBeDefined();

      expect(CHAPTER3_HINTS.pin_on_pan).toBeDefined();
      expect(CHAPTER3_HINTS.reference_weight).toBeDefined();
      expect(CHAPTER3_HINTS.latch_closed).toBeDefined();

      expect(CHAPTER5_THINKING_PHRASES.length).toBeGreaterThanOrEqual(6);
      expect(PROGRESSIVE_HINTS.chapter1).toBe(CHAPTER1_HINTS);
      expect(PROGRESSIVE_HINTS.chapter2).toBe(CHAPTER2_HINTS);
      expect(PROGRESSIVE_HINTS.chapter3).toBe(CHAPTER3_HINTS);
      expect(PROGRESSIVE_HINTS.chapter5.thinking_phrases).toBe(CHAPTER5_THINKING_PHRASES);
    });

    it('stage1 contains physical observations and ZERO spoiler keywords', () => {
      const spoilerKeywords = ['ကွမ်းသီးညှပ်', 'မောင်းတံ', 'ကွမ်းတံတွေး', 'ထိန်းတံပေါက်'];
      for (const hint of allStagedHints) {
        expect(hint.stage1.trim().length).toBeGreaterThan(10);
        for (const kw of spoilerKeywords) {
          expect(hint.stage1).not.toContain(kw);
        }
      }
    });

    it('stage2 provides cynical uncle nudges toward bag or environment', () => {
      for (const hint of allStagedHints) {
        expect(hint.stage2.trim().length).toBeGreaterThan(10);
      }
    });

    it('stage3 delivers impatient explicit solutions starting with U Gyi signature line', () => {
      for (const hint of allStagedHints) {
        expect(hint.stage3).toContain('မင်းကို ကြည့်နေတာ စိတ်မရှည်တော့ဘူးကွာ!');
      }
    });

    it('all progressive hints and thinking phrases have zero raw keys and zero speaker prefixes', () => {
      const allLines = [
        ...allStagedHints.flatMap(h => [h.stage1, h.stage2, h.stage3]),
        ...CHAPTER5_THINKING_PHRASES,
      ];

      for (const line of allLines) {
        assertNoRawKeyboardShortcuts(line, 'progressiveHints');
        expect(line).not.toContain('ဦးကြီး — ');
        expect(line).not.toContain('ဖိုးထောင် — ');
        expect(line).not.toMatch(/^(?:ဦးကြီး|ဖိုးထောင်)\s*[-—–:]\s*/);
        expect(line).not.toContain('\uFFFD');
        expect(line).not.toContain('???');
      }
    });
  });
});
