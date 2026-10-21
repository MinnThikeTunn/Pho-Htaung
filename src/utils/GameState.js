// Global Game State Manager for Phoe Htaung: Die Again in the Golden City
// Conforms to Section 3.1 & 5.3 of the Technical Specification.

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
  chalk: 'ကျောက်ဖြူတုံး',
  engineer_note: 'လျှို့ဝှက်ပုံကြမ်း စာရွက်'
};

export const ITEM_TEXTURE_KEYS = {
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
  chalk: 'item-chalk',
  engineer_note: 'item-engineer-note'
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

class GameStateManager {
  constructor() {
    this.resetState();
    this.loadFromStorage();
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
            // Guarantee all items are available to start
            if (Array.isArray(this.state.inventory)) {
              ALL_STARTING_ITEMS.forEach((item) => {
                if (!this.state.inventory.includes(item)) {
                  this.state.inventory.push(item);
                }
              });
            }
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
        window.localStorage.removeItem('phoe_htaung_save');
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
      inventory: [...ALL_STARTING_ITEMS],
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
    return this.state.inventory.includes(itemKey);
  }

  addItem(itemKey) {
    if (!this.state.inventory.includes(itemKey)) {
      this.state.inventory.push(itemKey);
      this.saveToStorage();
    }
  }

  removeItem(itemKey) {
    const idx = this.state.inventory.indexOf(itemKey);
    if (idx !== -1) {
      this.state.inventory.splice(idx, 1);
      this.saveToStorage();
    }
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
