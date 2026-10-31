import type Phaser from 'phaser';
import { store } from '../services/adventure';
import { toBurmeseNumeral } from '../utils/toBurmeseNumeral';
import { soundEngine } from '../utils/SoundEngine.js';

export interface DeathOverlayOptions {
  scene: Phaser.Scene;
  chapterTitle?: string;
  reason?: string;
  customTitle?: string;
  customSubtitle?: string;
  customRoast?: string;
  checkpointNote?: string;
  retryLabel?: string;
  autoRetrySeconds?: number;
  onRetry: () => void;
  onMenu?: () => void;
  targetContainer?: HTMLElement | null;
}

export function getChapterDisplayName(sceneKey?: string): { my: string; en: string } {
  switch (sceneKey) {
    case 'Chapter1Scene':
    case 'BRIDGE_EXIT_LINK':
      return { my: 'အခန်း ၁ — ရှေးဟောင်းတံတား', en: 'CHAPTER 1: THE ANCIENT BRIDGE' };
    case 'CHAPTER_2':
    case 'CH2_EXIT_LINK':
      return { my: 'အခန်း ၂ — မြေအောက်စက်ခန်း', en: 'CHAPTER 2: CRUSHER VAULT' };
    case 'CHAPTER_3':
    case 'CHAPTER_4_PENDING':
      return { my: 'အခန်း ၃ — ရှေးဟောင်းချိန်ခွင်ကြီး', en: 'CHAPTER 3: ANCIENT SCALE' };
    case 'CHAPTER_4':
    case 'CHAPTER_5_PENDING':
      return { my: 'အခန်း ၄ — လူဝံစောင့်ကြပ်ရာ ကွင်းပြင်', en: 'CHAPTER 4: GUARDIAN ARENA' };
    case 'CHAPTER_5':
      return { my: 'အခန်း ၅ — ရာဇပလ္လင် ဉာဏ်စမ်းခန်း', en: 'CHAPTER 5: THRONE GAUNTLET' };
    default:
      return { my: 'ရှေးဟောင်းနန်းတော် စွန့်စားခန်း', en: 'ANCIENT PALACE ADVENTURE' };
  }
}

export const DEATH_ROASTS: Record<string, string> = {
  // Chapter 1: Bridge
  PIT: 'ဟားဟားဟား! ချောက်ကမ်းပါးကြီးကို မျက်စိဖွင့်ပြီး လမ်းလျှောက်ပါကွာ! ခြေထောက်ချော်ပြီး ပြုတ်ကျသွားပြန်ပြီ!',
  SKY_BLOCK: 'ဟားဟားဟား! ကြည့်စမ်း... ကောင်းကင်ကို ခေါင်းနဲ့သွားတိုက်တယ်! အပေါ်မှာ မမြင်ရတဲ့ ကျောက်တုံးရှိမှန်း မသိဘူးလားကွဲ့!',
  FALLING_BRICK: 'အပေါ်က ပြုတ်ကျလာတဲ့ ကျောက်တုံးကို ခေါင်းနဲ့ခံတယ်! ဦးထုပ်ဆောင်းမထားဘူးလား ဖိုးထောင်ရယ်!',
  BEE_STUNG: 'ပျားအုံကို သွားစတာလား! မျက်နှာတစ်ခုလုံး ပေါက်စီလို ဖောင်းသွားပြီ ဟားဟား!',
  WINCH_CATAPULT: 'လက်ကိုင်ကို ဆီမထည့်ဘဲ လှည့်တော့ ကန်တာပေါ့! နံရံဆီ လွင့်စင်သွားပြီ!',

  // Chapter 2: Crusher Vault
  CRUSH: 'ကျောက်တုံးဖိစက်အောက်မှာ ငါးပိကောင်လို ပြားသွားပြီ! ခုန်ရှောင်ဖို့ ခြေထောက်မပါဘူးလား!',
  STONE: 'ကျောက်တုံးဖိစက်အောက်မှာ ငါးပိကောင်လို ပြားသွားပြီ! ခုန်ရှောင်ဖို့ ခြေထောက်မပါဘူးလား!',
  BOMB: 'လောဘကြီးပြီး ထောင်ချောက်ဒင်္ဂါးကို သွားကောက်တယ်! ပေါက်ကွဲပြီး မျက်နှာ မည်းသွားပြီ ဟားဟား!',
  BOMB_COIN: 'လောဘကြီးပြီး ထောင်ချောက်ဒင်္ဂါးကို သွားကောက်တယ်! ပေါက်ကွဲပြီး မျက်နှာ မည်းသွားပြီ ဟားဟား!',
  TRAP: 'ဟားဟားဟား! တံခါးဝရောက်ခါမှ အငိုက်မိပြီး တွင်းထဲကျသွားပြန်ပြီ!',

  // Chapter 3: Ancient Scale
  PENDULUM: 'ကြေးစည်ကြီးနဲ့ ခေါင်းခေါက်ခံရပြီ! ဝမ်းလျားမှောက်ရှောင်ဖို့ မေ့နေတာလား ဖိုးထောင်!',
  SCALE_PIT: 'ချိန်ခွင်ကို မထိန်းနိုင်ဘဲ ချောက်ထဲ ဇောက်ထိုးကျသွားပြန်ပြီ!',
  OVERWEIGHT_CATAPULT: 'ချိန်ခွင်ဆိုတာ ကုန်သည်တွေ အလေးချိန်တာကွဲ့… ဆင်တင်ပြီး ချိန်ခိုင်းနေတာလား ငကြောင်ရ! နံရံမှာ ငါးပိလို ကပ်သွားပြီ!',

  // Chapter 4: Guardian Arena
  HEALTH: 'လူဝံကြီးတွေရဲ့ လက်သီးဒဏ်ကို မခံနိုင်ဘူးလား! ခုန်ရှောင်ပြီး လောက်လေးခွနဲ့ ပစ်ပေါ့ကွာ!',
  GREED_TRAP: 'လူဝံတွေကို နိုင်ပြီးမှ လောဘတက်ပြီး ရွှေထုပ်ကောက်လို့ ပေါက်ကွဲသွားပြီ! ရွှေမမက်နဲ့ သေမင်းက စောင့်နေတယ်!',
  TIME: 'အချိန်ကုန်သွားပြီ! မြို့တော်တံခါး ပိတ်သွားလို့ ပိတ်မိနေပြီ!',

  // Chapter 5: Final Gauntlet
  QUIZ: 'ဟားဟားဟား! ဦးကြီးရဲ့ ပုစ္ဆာတွေကို မဖြေနိုင်ဘဲ တုတ် ၃ ချက်ဒဏ်နဲ့ မေ့လဲသွားပြီ!',
  STRIKE: 'ဟားဟားဟား! ဦးကြီးရဲ့ တုတ် ၃ ချက်ဒဏ် မခံနိုင်တော့ဘူး မဟုတ်လား ဖိုးထောင်ရယ်!',
  CH5: 'ဟားဟားဟား! ဦးကြီးရဲ့ တုတ် ၃ ချက်ဒဏ် မခံနိုင်တော့ဘူး မဟုတ်လား ဖိုးထောင်ရယ်!',

  DEFAULT: 'ဟားဟားဟား! ဒီလောက်လေးနဲ့တင် အသက်ပျောက်သွားပြန်ပြီလား ဖိုးထောင်ရယ်!'
};

export class DieAgainDeathOverlay {
  private static activeInstance: DieAgainDeathOverlay | null = null;

  private overlayEl: HTMLDivElement | null = null;
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;
  private autoTimer: number | null = null;
  private animInterval: number | null = null;
  private destroyed = false;

  private readonly scene: Phaser.Scene;
  private readonly options: DeathOverlayOptions;

  constructor(options: DeathOverlayOptions) {
    this.scene = options.scene;
    this.options = options;
  }

  public static show(options: DeathOverlayOptions): DieAgainDeathOverlay {
    if (DieAgainDeathOverlay.activeInstance) {
      DieAgainDeathOverlay.activeInstance.destroy();
    }
    const instance = new DieAgainDeathOverlay(options);
    instance.mount();
    DieAgainDeathOverlay.activeInstance = instance;
    return instance;
  }

  public static hideActive(): void {
    if (DieAgainDeathOverlay.activeInstance) {
      DieAgainDeathOverlay.activeInstance.destroy();
      DieAgainDeathOverlay.activeInstance = null;
    }
  }

  public static isActive(): boolean {
    return DieAgainDeathOverlay.activeInstance !== null;
  }

  private mount(): void {
    const parentContainer =
      this.options.targetContainer ??
      document.querySelector<HTMLElement>('#interface') ??
      document.body;

    const deathCount = store.campaign.deathCount;
    const burmeseCount = toBurmeseNumeral(deathCount);

    const reasonKey = (this.options.reason ?? 'DEFAULT').toUpperCase();
    const roast =
      this.options.customRoast ??
      DEATH_ROASTS[reasonKey] ??
      DEATH_ROASTS.DEFAULT ??
      'အသက်ပျောက်သွားပါပြီ!';

    const sceneKey = this.scene?.scene?.key;
    const chapterInfo = this.options.chapterTitle
      ? { my: this.options.chapterTitle, en: sceneKey ?? '' }
      : getChapterDisplayName(sceneKey);

    const title = this.options.customTitle ?? '💀 အသက်ပျောက်သွားပါပြီ!';
    const subtitle = this.options.customSubtitle ?? 'DIED AGAIN IN ANCIENT PALACE';

    const overlay = document.createElement('div');
    overlay.className = 'die-again-overlay';
    overlay.id = 'die-again-overlay';

    overlay.innerHTML = `
      <section class="die-again-card" role="alertdialog" aria-modal="true" aria-labelledby="die-again-heading">
        <div class="die-again-chapter-badge">
          <span class="die-again-chapter-my">${chapterInfo.my}</span>
          <span class="die-again-chapter-en">${chapterInfo.en}</span>
        </div>
        <h1 id="die-again-heading" class="die-again-title">${title}</h1>
        <p class="die-again-sub">${subtitle}</p>

        <div class="die-again-badge" aria-label="သေဆုံးမှု စုစုပေါင်း ${burmeseCount} ကြိမ်">
          <span class="die-again-badge-burmese">💀 စုစုပေါင်း သေဆုံးမှု: <b>${burmeseCount}</b> ကြိမ်</span>
          <span class="die-again-badge-english">TOTAL DEATHS: ${deathCount}</span>
        </div>

        <div class="die-again-roast">
          <div class="die-again-roast-body">
            <span class="die-again-roast-label">ဦးကြီး၏ အသံ (U Gyi):</span>
            <p class="die-again-roast-text">“${roast}”</p>
          </div>
        </div>

        ${this.options.checkpointNote ? `<p class="die-again-checkpoint">${this.options.checkpointNote}</p>` : ''}

        <div class="die-again-footer">
          <div class="die-again-countdown-bar">
            <div class="die-again-countdown-fill" id="die-again-countdown-fill"></div>
          </div>
          <p class="die-again-hint">🔄 အလိုအလျောက် ပြန်စတင်နေသည်… <small>(R / Space / တို့ထိပါ)</small></p>
        </div>

        <!-- Clean click surface for instant retry (replaces clunky buttons, keeps test compatibility) -->
        <button type="button" id="die-again-retry" class="die-again-click-surface" aria-label="Retry"></button>
        <button type="button" id="die-again-menu" class="die-again-menu-surface" style="display:none;" aria-label="Menu"></button>
      </section>
    `;

    parentContainer.appendChild(overlay);
    this.overlayEl = overlay;

    // Fast retry action (<200ms)
    const triggerRetry = () => {
      if (this.destroyed) return;
      try {
        (soundEngine as any).playPing?.();
      } catch {}
      this.destroy();
      this.options.onRetry();
    };

    const triggerMenu = () => {
      if (this.destroyed) return;
      try {
        (soundEngine as any).playPing?.();
      } catch {}
      this.destroy();
      if (this.options.onMenu) {
        this.options.onMenu();
      } else {
        this.scene.scene.start('MENU');
      }
    };

    // Card or click surface triggers instant retry
    overlay.querySelector('#die-again-retry')?.addEventListener('click', (e) => {
      e.stopPropagation();
      triggerRetry();
    });

    overlay.querySelector('#die-again-menu')?.addEventListener('click', (e) => {
      e.stopPropagation();
      triggerMenu();
    });

    overlay.addEventListener('click', () => {
      triggerRetry();
    });

    // Keyboard bindings: R, Space, Enter for fast respawn, Escape for menu
    this.keydownHandler = (e: KeyboardEvent) => {
      if (this.destroyed) return;
      if (e.key === 'r' || e.key === 'R' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        triggerRetry();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        triggerMenu();
      }
    };
    window.addEventListener('keydown', this.keydownHandler, { capture: true });

    // Auto-retry progress bar animation & trigger (default 2.0s)
    const retryDelay = this.options.autoRetrySeconds ?? 2.0;
    const startTime = Date.now();
    const fillEl = overlay.querySelector<HTMLDivElement>('#die-again-countdown-fill');

    if (fillEl && retryDelay > 0) {
      this.animInterval = window.setInterval(() => {
        if (this.destroyed) return;
        const elapsed = (Date.now() - startTime) / 1000;
        const pct = Math.min(100, (elapsed / retryDelay) * 100);
        fillEl.style.width = `${pct}%`;
      }, 50);
    }

    if (retryDelay > 0) {
      this.autoTimer = window.setTimeout(() => {
        triggerRetry();
      }, retryDelay * 1000);
    }

    // Teardown hook when Phaser scene shuts down
    this.scene?.events?.once('shutdown', () => {
      this.destroy();
    });
  }

  public destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    if (this.autoTimer !== null) {
      clearTimeout(this.autoTimer);
      this.autoTimer = null;
    }

    if (this.animInterval !== null) {
      clearInterval(this.animInterval);
      this.animInterval = null;
    }

    if (this.keydownHandler) {
      window.removeEventListener('keydown', this.keydownHandler, { capture: true });
      this.keydownHandler = null;
    }

    if (this.overlayEl) {
      this.overlayEl.remove();
      this.overlayEl = null;
    }

    if (DieAgainDeathOverlay.activeInstance === this) {
      DieAgainDeathOverlay.activeInstance = null;
    }
  }
}
