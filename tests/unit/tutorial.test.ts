import { describe, it, expect } from 'vitest';
import { DIALOGUE } from '../../src/content/dialogue.my';
import { CampaignStore } from '../../src/services/CampaignStore';
import { newCampaign, validateCampaign } from '../../src/domain/settlement';
import { TutorialStep } from '../../src/domain/tutorial';
import { ITEM_NAMES_MY, ITEM_TEXTURE_KEYS } from '../../src/utils/GameState';

class MemorySave {
  private data: string | null = null;
  read() { return this.data; }
  write(v: string) { this.data = v; }
}

describe('Tutorial Walkthrough & Prologue Specification', () => {
  describe('1. Tutorial Dialogue Strings & Burmese Authenticity', () => {
    it('defines all required U Gyi tutorial dialogue lines', () => {
      expect(DIALOGUE.tutorial_entry).toBeDefined();
      expect(DIALOGUE.tutorial_crouch).toBeDefined();
      expect(DIALOGUE.tutorial_item_prompt).toBeDefined();
      expect(DIALOGUE.tutorial_item_picked).toBeDefined();
      expect(DIALOGUE.tutorial_betel_prompt).toBeDefined();
      expect(DIALOGUE.tutorial_betel_spit).toBeDefined();
      expect(DIALOGUE.tutorial_jump_prompt).toBeDefined();
      expect(DIALOGUE.tutorial_trap_death).toBeDefined();
    });

    it('contains U Gyi comedic mocking laugh and Good Luck roast in trap death', () => {
      expect(DIALOGUE.tutorial_trap_death).toContain('ဟားဟားဟားဟား!');
      expect(DIALOGUE.tutorial_trap_death).toContain('Good Luck');
      expect(DIALOGUE.tutorial_trap_death).toContain('သာမန် လွယ်ကူတဲ့ ခရီးမဟုတ်ဘူး');
    });

    it('contains pickup instruction for betel nut into the bag', () => {
      expect(DIALOGUE.tutorial_item_prompt).toContain('ကွမ်းသီးခြမ်း');
      expect(DIALOGUE.tutorial_item_prompt).toContain('လွယ်အိတ်');
    });

    it('contains mouth verb spitting instruction', () => {
      expect(DIALOGUE.tutorial_betel_prompt).toContain('ကွမ်းသွေး');
      expect(DIALOGUE.tutorial_betel_spit).toContain('ထွေးထုတ်');
    });
  });

  describe('2. Item Registry for Betel Nut Pickup', () => {
    it('registers betel_nut in Burmese item names dictionary', () => {
      expect(ITEM_NAMES_MY.betel_nut).toBe('ကွမ်းသီးခြမ်း');
    });

    it('registers betel_nut in item texture keys', () => {
      expect(ITEM_TEXTURE_KEYS.betel_nut).toBe('ch1_vector_betel_nut');
    });
  });

  describe('3. Campaign Store Tutorial Completion State', () => {
    it('initializes new campaign with tutorialCompleted: false', () => {
      const camp = newCampaign('test-camp');
      expect(camp.tutorialCompleted).toBe(false);
      expect(validateCampaign(camp)).toBe(true);
    });

    it('marks tutorial as completed and persists via completeTutorial()', () => {
      const adapter = new MemorySave();
      const store = new CampaignStore(adapter, 'test-camp');
      expect(store.campaign.tutorialCompleted).toBe(false);

      store.completeTutorial();
      expect(store.campaign.tutorialCompleted).toBe(true);

      // Verify persistence across new store instance
      const reloaded = new CampaignStore(adapter, 'test-camp');
      expect(reloaded.campaign.tutorialCompleted).toBe(true);
    });
  });

  describe('4. Tutorial Step State Progression Integrity', () => {
    it('contains all sequential stages from ENTRY to FINISHED', () => {
      const expectedSteps = [
        'ENTRY',
        'WALK',
        'CROUCH',
        'PICKUP',
        'SPIT',
        'JUMP',
        'TRAP',
        'ROAST',
        'FINISHED'
      ];
      for (const step of expectedSteps) {
        expect(TutorialStep[step as keyof typeof TutorialStep]).toBe(step);
      }
    });
  });
});
