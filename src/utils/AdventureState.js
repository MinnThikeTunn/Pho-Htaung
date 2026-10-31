import { store } from '../services/adventure';
export { BURMESE_DIGITS,toBurmeseNumeral,ITEM_NAMES_MY,ITEM_TEXTURE_KEYS } from './GameState.js';
import { toBurmeseNumeral } from './GameState.js';

export const CHAPTER_ITEMS = {
  TUTORIAL: ['betel_nut'],
  CHAPTER_1: ['rusty_cog', 'bamboo_pole', 'ancient_brick', 'beeswax'],
  CHAPTER_2: ['bamboo_pole', 'rusty_cog', 'cog', 'slingshot', 'ancient_brick', 'steam_nozzle_redirector', 'half_bottle'],
  CHAPTER_3: ['stone', 'sandbag', 'crate', 'treasure', 'chalk', 'stone_3', 'gold_7', 'red_gem', 'pin'],
  CHAPTER_4: ['ammo', 'engineer_note', 'dried_chili', 'gold_pouch', 'arena_gold'],
  CHAPTER_5: ['ch5_relic']
};

/**
 * AdventureState
 * Manages active attempt state while remaining strictly synchronized with CampaignStore.
 */
class AdventureState {
  constructor() {
    this.chapterSnapshots = {};
    this.itemsAcquiredInAttempt = new Set();
    this.currentChapter = null;
    this.resetAttempt();
  }

  checkpointChapter(chapterKey) {
    if (!chapterKey) return;
    this.currentChapter = chapterKey;
    const current = Array.isArray(store?.campaign?.inventory) && store.campaign.inventory.length > 0
      ? [...store.campaign.inventory]
      : (Array.isArray(this.state?.inventory) ? [...this.state.inventory] : []);
    this.chapterSnapshots[chapterKey] = [...current];
    this.itemsAcquiredInAttempt.clear();
  }

  getChapterSnapshot(chapterKey) {
    return this.chapterSnapshots[chapterKey] || null;
  }

  recordItemAcquired(id) {
    if (id) {
      this.itemsAcquiredInAttempt.add(id);
    }
  }

  restoreChapterOnFailure(chapterKey) {
    const ch = chapterKey || this.currentChapter;
    if (!ch) return;

    const snapshot = this.chapterSnapshots[ch];
    const nativeItems = CHAPTER_ITEMS[ch] || [];

    if (Array.isArray(snapshot)) {
      this.state.inventory = [...snapshot];
      if (store?.campaign) {
        store.campaign.inventory = [...snapshot];
        if (!snapshot.includes('slingshot') && store.campaign.ownedTools.includes('slingshot') && (ch === 'CHAPTER_2' || ch === 'CHAPTER_1' || ch === 'TUTORIAL')) {
          store.campaign.ownedTools = store.campaign.ownedTools.filter(t => t !== 'slingshot');
        }
        store.campaign.revision++;
        store.save();
      }
    } else {
      const toRemove = new Set([...nativeItems, ...this.itemsAcquiredInAttempt]);
      this.state.inventory = this.state.inventory.filter(item => !toRemove.has(item));
      if (store?.campaign) {
        store.campaign.inventory = store.campaign.inventory.filter(item => !toRemove.has(item));
        if (toRemove.has('slingshot') && (ch === 'CHAPTER_2' || ch === 'CHAPTER_1' || ch === 'TUTORIAL')) {
          store.campaign.ownedTools = store.campaign.ownedTools.filter(t => t !== 'slingshot');
        }
        store.campaign.revision++;
        store.save();
      }
    }

    this.itemsAcquiredInAttempt.clear();
  }

  resetAttempt() {
    this.attemptId = crypto.randomUUID();
    const campaignInv = Array.isArray(store?.campaign?.inventory) ? store.campaign.inventory : [];
    const inv = [...campaignInv];

    this.state = {
      currentScene: this.state?.currentScene || 'Chapter1Scene',
      inventory: inv,
      flags: { ch1_tunnel_open: false },
      isPlayerDead: false,
      isDialoguePlaying: false,
      alwaysShowHints: false,
      fastDialogue: false
    };

    if (store?.campaign) {
      store.campaign.inventory = [...this.state.inventory];
    }
  }

  setCurrentScene(sceneKey) {
    if (this.state) {
      this.state.currentScene = sceneKey || 'Chapter1Scene';
      this.syncFromCampaign();
    } else {
      this.resetAttempt();
    }
  }

  syncFromCampaign() {
    if (Array.isArray(store?.campaign?.inventory)) {
      for (const item of store.campaign.inventory) {
        if (!this.state.inventory.includes(item)) {
          this.state.inventory.push(item);
        }
      }
    }
  }

  saveToStorage() {
    if (store?.campaign && this.state?.inventory) {
      store.campaign.inventory = [...this.state.inventory];
    }
    return store.save();
  }

  hasSavedGame() {
    return Boolean(store?.campaign?.bridgeCompleted);
  }

  reset(skipConfirm = false) {
    if (skipConfirm || typeof window === 'undefined' || confirm('Campaign အသစ်စမယ်။ လက်ရှိ progress နဲ့ သိမ်းပြီးရွှေ ပျောက်မယ်။ သေချာလား?')) {
      store.reset(crypto.randomUUID());
      this.chapterSnapshots = {};
      this.itemsAcquiredInAttempt.clear();
      this.currentChapter = null;
      if (this.state) {
        this.state.inventory = [];
      }
      if (store?.campaign) {
        store.campaign.inventory = [];
        store.campaign.ownedTools = [];
      }
      store.save();
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem('phoe_htaung_save');
          window.localStorage.removeItem('phoe-htaung-game-state');
          window.localStorage.removeItem('phoe-htaung.adventure.v2');
        }
      } catch (e) {}
      return true;
    }
    return false;
  }

  addDeath() {
    store.death(this.attemptId);
    return store.campaign.deathCount;
  }

  getDeathCount() {
    return store.campaign.deathCount;
  }

  getDeathCountBurmese() {
    return toBurmeseNumeral(this.getDeathCount());
  }

  hasItem(id) {
    return Boolean(this.state?.inventory?.includes(id) || store?.campaign?.inventory?.includes(id));
  }

  addItem(id) {
    if (!id) return;
    const key = id === 'cog' ? 'rusty_cog' : id;
    this.recordItemAcquired(key);
    if (key === 'rusty_cog') {
      this.state.inventory = this.state.inventory.filter(i => i !== 'cog');
    }
    if (!this.state.inventory.includes(key)) {
      this.state.inventory.push(key);
    }
    if (store?.campaign) {
      let changed = false;
      if (key === 'rusty_cog' && store.campaign.inventory.includes('cog')) {
        store.campaign.inventory = store.campaign.inventory.filter(i => i !== 'cog');
        changed = true;
      }
      if (!store.campaign.inventory.includes(key)) {
        store.campaign.inventory.push(key);
        changed = true;
      }
      if (key === 'slingshot' && !store.campaign.ownedTools.includes('slingshot')) {
        store.campaign.ownedTools.push('slingshot');
        changed = true;
      }
      if (changed) {
        store.campaign.revision++;
        store.save();
      }
    }
  }

  removeItem(id) {
    if (!id) return;
    this.state.inventory = this.state.inventory.filter(item => item !== id);
    if (store?.campaign && store.campaign.inventory.includes(id)) {
      store.campaign.inventory = store.campaign.inventory.filter(item => item !== id);
      store.campaign.revision++;
      store.save();
    }
  }

  setFlag(id, value = true) {
    this.state.flags[id] = value;
  }

  getFlag(id) {
    return Boolean(this.state.flags[id]);
  }
}

export const gameState = new AdventureState();
