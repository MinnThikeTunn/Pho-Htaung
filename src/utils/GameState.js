// Global Game State Manager for Phoe Htaung: Die Again in the Golden City
// Conforms to Section 3.1 & 5.3 of the Technical Specification.
import { store } from '../services/adventure';

export const BURMESE_DIGITS = ['၀', '၁', '၂', '၃', '၄', '၅', '၆', '၇', '၈', '၉'];

export function toBurmeseNumeral(num) {
  if (num === null || num === undefined) return '၀';
  return num
    .toString()
    .split('')
    .map((ch) => {
      const digit = parseInt(ch, 10);
      return !isNaN(digit) ? BURMESE_DIGITS[digit] : ch;
    })
    .join('');
}

export const ITEM_NAMES_MY = {
  betel_nut: 'ကွမ်းသီးခြမ်း',
  betel_cutter: 'ကွမ်းသီးညှပ်',
  torn_bottle: 'ရေဗူးစုတ်',
  half_bottle: 'ထက်ခြမ်းခွဲထားသော ရေဗူးစုတ်',
  rusty_spike: '၅၀ ပိဿာ သံမှိုကြီး',
  dried_chili: 'ငရုတ်သီးခြောက်တောင့်',
  dry_twigs: 'သစ်ကိုင်းခြောက်များ',
  stone_3: '၃ ပိဿာ ကျောက်ခဲ',
  gold_7: '၇ ပိဿာ ရွှေတုံး',
  red_gem: 'ကျောက်မျက်နီ',
  bamboo_pole: 'ဝါးလုံးတုတ်',
  rusty_cog: 'သံချေးတက် ဂီယာခွေ',
  cog: 'သံချေးတက် ဂီယာခွေ',
  slingshot: 'လေးခွနှင့် လောက်စာလုံး',
  beeswax: 'တောပျားဖယောင်း',
  ancient_brick: 'ရှေးဟောင်း အုတ်ခဲ',
  steam_nozzle_redirector: 'ရေနွေးငွေ့ ပိုဒ်တွန်းစက်',
  chalk: 'ကျောက်ဖြူတုံး',
  engineer_note: 'လျှို့ဝှက်ပုံကြမ်း စာရွက်'
};

export const ITEM_TEXTURE_KEYS = {
  betel_nut: 'ch1_vector_betel_nut',
  betel_cutter: 'item-betel-cutter',
  torn_bottle: 'item-torn-bottle',
  half_bottle: 'item-half-bottle',
  rusty_spike: 'item-rusty-spike',
  dried_chili: 'item-chili',
  dry_twigs: 'item-twigs',
  stone_3: 'item-stone-3',
  gold_7: 'item-gold-7',
  red_gem: 'item-red-gem',
  bamboo_pole: 'item-bamboo-pole',
  rusty_cog: 'item-cog',
  cog: 'ch1_vector_cog',
  slingshot: 'ch2_vector_slingshot',
  beeswax: 'ch1_vector_beeswax',
  ancient_brick: 'ch1_vector_brick',
  steam_nozzle_redirector: 'ch2_vector_steam_redirector',
  chalk: 'item-chalk',
  engineer_note: 'item-engineer-note',
  pin: 'ch3_icon_pin',
  stone: 'ch3_icon_stone',
  crate: 'ch3_icon_crate',
  sandbag: 'ch3_icon_sandbag',
  treasure: 'ch3_icon_treasure'
};

export const ALL_STARTING_ITEMS = [
  'betel_cutter',
  'torn_bottle',
  'rusty_cog',
  'bamboo_pole',
  'rusty_spike',
  'dried_chili',
  'dry_twigs',
  'stone_3',
  'gold_7',
  'red_gem',
  'chalk',
  'engineer_note'
];

export const CHAPTER_ITEMS = {
  TUTORIAL: ['betel_nut'],
  CHAPTER_1: ['rusty_cog', 'bamboo_pole', 'ancient_brick', 'beeswax'],
  CHAPTER_2: ['bamboo_pole', 'rusty_cog', 'cog', 'slingshot', 'ancient_brick', 'steam_nozzle_redirector', 'half_bottle'],
  CHAPTER_3: ['stone', 'sandbag', 'crate', 'treasure', 'chalk', 'stone_3', 'gold_7', 'red_gem', 'pin'],
  CHAPTER_4: ['ammo', 'engineer_note', 'dried_chili', 'gold_pouch', 'arena_gold'],
  CHAPTER_5: ['ch5_relic']
};

class GameStateManager {
  constructor() {
    this.chapterSnapshots = {};
    this.itemsAcquiredInAttempt = new Set();
    this.currentChapter = null;
    this.resetState();
    this.loadFromStorage();
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

  saveToStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('phoe_htaung_save', JSON.stringify(this.state));
      }
    } catch (e) {
      // Ignore private browsing storage quota errors
    }
  }

  loadFromStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem('phoe_htaung_save');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            this.state = {
              ...this.state,
              ...parsed,
              flags: { ...this.state.flags, ...(parsed.flags || {}) }
            };

            return true;
          }
        }
      }
    } catch (e) {
      // Fallback to default
    }
    return false;
  }

  hasSavedGame() {
    return !!(this.state.currentScene && this.state.currentScene !== 'INTRO' && this.state.currentScene !== 'IntroScene');
  }

  clearStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(this.storageKey);
        window.localStorage.removeItem('phoe_htaung_save');
        window.localStorage.removeItem('phoe-htaung-game-state');
      }
    } catch (e) {}
  }

  setCurrentScene(sceneKey) {
    this.state.currentScene = sceneKey;
    this.saveToStorage();
  }

  resetState() {
    this.state = {
      currentScene: 'INTRO',
      deathCount: 0,
      inventory: [],
      flags: {
        ch1_tunnel_open: false,
        ch2_bottle_cut: false,
        ch2_lever_covered: false,
        ch2_door_open: false,
        ch3_wall_scratched: false,
        ch3_weight_kicked: false,
        ch3_door_open: false,
        ch4_safe_unlocked: false,
        ch5_crushed: false
      },
      isDialoguePlaying: false,
      isPlayerDead: false
    };
  }

  reset() {
    this.resetState();
    this.clearStorage();
    try {
      if (store?.campaign) {
        store.campaign.inventory = [];
        store.campaign.ownedTools = [];
        store.save();
      }
    } catch (e) {}
  }

  addDeath() {
    this.state.deathCount++;
    this.saveToStorage();
    return this.state.deathCount;
  }

  getDeathCount() {
    return this.state.deathCount;
  }

  getDeathCountBurmese() {
    return toBurmeseNumeral(this.state.deathCount);
  }

  hasItem(itemKey) {
    return this.state.inventory.includes(itemKey) || Boolean(store?.campaign?.inventory?.includes(itemKey));
  }

  addItem(itemKey) {
    if (!itemKey) return;
    const key = itemKey === 'cog' ? 'rusty_cog' : itemKey;
    this.recordItemAcquired(key);
    if (key === 'rusty_cog') {
      this.state.inventory = this.state.inventory.filter(i => i !== 'cog');
    }
    if (!this.state.inventory.includes(key)) {
      this.state.inventory.push(key);
      this.saveToStorage();
    }
    try {
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
    } catch {}
  }

  removeItem(itemKey) {
    if (!itemKey) return;
    const idx = this.state.inventory.indexOf(itemKey);
    if (idx !== -1) {
      this.state.inventory.splice(idx, 1);
      this.saveToStorage();
    }
    try {
      if (store?.campaign && store.campaign.inventory.includes(itemKey)) {
        store.campaign.inventory = store.campaign.inventory.filter((i) => i !== itemKey);
        store.campaign.revision++;
        store.save();
      }
    } catch {}
  }

  setFlag(flagName, value = true) {
    if (this.state.flags.hasOwnProperty(flagName)) {
      this.state.flags[flagName] = value;
      this.saveToStorage();
    }
  }

  getFlag(flagName) {
    return !!this.state.flags[flagName];
  }
}

export const gameState = new GameStateManager();
