import Phaser from 'phaser';
import './style.css';
import './fantasy-theme.css';
import { C } from './content/chapter1';
import { store } from './services/adventure';
import { AudioController } from './services/AudioController';
import { soundEngine } from './utils/SoundEngine.js';
import { audioDirector } from './audio/AudioDirector.js';
import PreloadScene from './scenes/PreloadScene.js';
import BridgeChapterScene from './scenes/BridgeChapterScene.js';
import TutorialChapterScene from './scenes/TutorialChapterScene';
import Chapter2Scene from './scenes/Chapter2Scene';
import ScaleChapterScene from './scenes/ScaleChapterScene';
import { SCALE_ART } from './content/chapter3Art';
import ArenaChapterScene from './scenes/ArenaChapterScene';
import FinalChapterScene, { CampaignEndingScene } from './scenes/FinalChapterScene';
import type { Mode } from './domain/types';
import { toBurmeseNumeral } from './utils/toBurmeseNumeral';
import { gameState } from './utils/AdventureState';

export const audioController = new AudioController();

export class BootScene extends Phaser.Scene {
  constructor() { super('BOOT'); }
  preload() {
    this.load.image(SCALE_ART.background.key, SCALE_ART.background.path);
    this.load.image(SCALE_ART.props.key, SCALE_ART.props.path);
    this.load.image('background', '/assets/chapter1/background_v1.png');
    this.load.image('phoe', '/assets/concepts/phoe_htaung_concept_v1.png');
    this.load.spritesheet('phoe_run', '/assets/character/phoe_run_spritesheet.png', { frameWidth: 380, frameHeight: 850 });
    this.load.spritesheet('phoe_jump', '/assets/character/phoe_jump_spritesheet.png', { frameWidth: 380, frameHeight: 850 });
    this.load.spritesheet('phoe_actions', '/assets/character/phoe_actions_spritesheet.png', { frameWidth: 380, frameHeight: 850 });
    this.load.image('phoe_idle_inhale', '/assets/character/phoe_idle_inhale.png');
    this.load.image('phoe_idle_exhale', '/assets/character/phoe_idle_exhale.png');
    this.load.image('phoe_crouch', '/assets/character/phoe_crouch.png');
    this.load.image('phoe_bag_rummage', '/assets/character/phoe_bag_rummage.png');
    this.load.image('phoe_hold', '/assets/character/phoe_hold.png');
    this.load.image('traditional_bag_icon', '/assets/ui/traditional_bag_icon.png');
    this.load.spritesheet('brown_ape_sheet', '/assets/chapter4/brown_ape_spritesheet.png', { frameWidth: 720, frameHeight: 380 });
    this.load.spritesheet('brown_ape_walk', '/assets/chapter4/brown_ape_walk_spritesheet.png', { frameWidth: 720, frameHeight: 380 });
  }
  create() {
    this.scene.start('PreloadScene');
  }
}

export class SharedPreloadScene extends PreloadScene {
  create() {
    this.createAllGameAssets();
    const el = document.getElementById('boot-splash');
    if (el) {
      el.classList.add('hide');
      setTimeout(() => el.remove(), 350);
    }
    this.scene.start('MENU');
  }
}

export class MenuScene extends Phaser.Scene {
  constructor() { super('MENU'); }
  create() {
    const splash = document.getElementById('boot-splash');
    if (splash) {
      splash.classList.add('hide');
      setTimeout(() => splash.remove(), 350);
    }
    audioController.attach(this);
    try {
      soundEngine.init?.();
      const savedVol = localStorage.getItem('phoe-bgm-volume');
      const vol = savedVol !== null ? parseFloat(savedVol) : 0.5;
      if ((soundEngine as any).setBGMVolume) (soundEngine as any).setBGMVolume(vol);
      if (!soundEngine.muted && vol > 0) soundEngine.startBGM?.();
    } catch {}

    const ui = document.querySelector<HTMLDivElement>('#interface');
    if (!ui) return;
    ui.innerHTML = '';

    const menuDiv = document.createElement('div');
    menuDiv.id = 'fantasy-menu-overlay';
    menuDiv.innerHTML = `
      <div class="fm-bg"></div>
      <div class="fm-vignette"></div>
      <div class="fm-content">
        <div class="fm-crest">❖</div>
        <h1 class="fm-title">PHO HTAUNG</h1>
        <p class="fm-subtitle">ရှေးဟောင်းနန်းတော် စွန့်စားခန်း</p>
        <div class="fm-rule"><span></span><b>❖</b><span></span></div>
        <nav class="fm-actions">
          <button type="button" id="start" class="fm-btn fm-primary">
            <span class="fm-btn-label">PLAY</span>
            <small>ဆက်လက်ကစားမည်</small>
          </button>
          <button type="button" id="menu-restart" class="fm-btn">
            <span class="fm-btn-label">RESTART</span>
            <small>အခန်း ၁ မှ ပြန်စမည်</small>
          </button>
          <button type="button" id="menu-mechanic" class="fm-btn">
            <span class="fm-btn-label">MECHANIC</span>
            <small>လမ်းညွှန် နှင့် ထိန်းချုပ်နည်း</small>
          </button>
        </nav>
      </div>`;
    ui.appendChild(menuDiv);

    const playBtn = menuDiv.querySelector<HTMLButtonElement>('#start');
    const restartBtn = menuDiv.querySelector<HTMLButtonElement>('#menu-restart');
    const mechanicBtn = menuDiv.querySelector<HTMLButtonElement>('#menu-mechanic');

    const closeMenu = () => {
      menuDiv.remove();
    };

    playBtn?.addEventListener('click', () => {
      try { (soundEngine as any).playPing?.(); } catch {}
      closeMenu();
      const c = store.campaign as any;
      if (!c.bridgeCompleted) {
        this.scene.start('Chapter1Scene');
      } else if (c.chapter5Completed) {
        this.scene.start('CAMPAIGN_END');
      } else if (c.resumeAt === 'CHAPTER_5_PENDING' || c.chapter4Completed) {
        this.scene.start('CHAPTER_5');
      } else if (c.resumeAt === 'CHAPTER_4_PENDING' || c.chapter3Completed) {
        this.scene.start('CHAPTER_4');
      } else if (c.resumeAt === 'CHAPTER_3_PENDING' || c.chapter2Completed) {
        this.scene.start('CHAPTER_3');
      } else if (c.resumeAt === 'CH2_EXIT_LINK') {
        this.scene.start('CH2_EXIT_LINK', { mode: 'CAMPAIGN' });
      } else {
        this.scene.start('CHAPTER_2', { preset: 'A', mode: 'CAMPAIGN' });
      }
    });

    restartBtn?.addEventListener('click', () => {
      try { (soundEngine as any).playPing?.(); } catch {}
      try { store.reset(crypto.randomUUID()); } catch {}
      try { (gameState as any).reset?.(true); } catch {}
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem('phoe_htaung_save');
          window.localStorage.removeItem('phoe-htaung-game-state');
          window.localStorage.removeItem('phoe-htaung.adventure.v2');
        }
      } catch {}
      restartBtn.classList.add('fm-confirmed');
      const label = restartBtn.querySelector('.fm-btn-label');
      const note = restartBtn.querySelector('small');
      if (label) label.textContent = 'RESTARTED';
      if (note) note.textContent = 'လေ့ကျင့်ခန်းမှ ပြန်စနေသည်…';
      window.setTimeout(() => {
        closeMenu();
        this.scene.start('TUTORIAL');
      }, 420);
    });

    mechanicBtn?.addEventListener('click', () => {
      try { (soundEngine as any).playPing?.(); } catch {}
      openMechanicsModal();
    });
  }
}

function openMechanicsModal() {
  const ui = document.querySelector<HTMLDivElement>('#interface');
  if (!ui) return;
  const existing = document.getElementById('fm-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'fm-modal';
  modal.className = 'fm-modal fm-modal-backdrop';
  modal.innerHTML = `
    <div class="fm-modal-panel">
      <header class="fm-modal-head">
        <h2>ဂိမ်းလမ်းညွှန် နှင့် ထိန်းချုပ်နည်း <span>/ Controls & Rules</span></h2>
        <button type="button" class="fm-modal-close" id="fm-modal-close">✕</button>
      </header>
      <div class="fm-modal-body">
        <section class="fm-section">
          <h3>အခြေခံ လှုပ်ရှားမှု <span>/ Movement</span></h3>
          <ul>
            <li><b>A / D</b> သို့မဟုတ် <b>← / →</b> — ဘယ်/ညာ ရွေ့လျားခြင်း</li>
            <li><b>W / Space</b> — ခုန်ခြင်း (Jump)</li>
            <li><b>S / ↓</b> — အောက်သို့ဆင်း / ကုန်းကွခြင်း</li>
            <li><b>Mouse Click</b> — နေရာရွှေ့ရန် ကလစ်နှိပ်ခြင်း</li>
          </ul>
        </section>
        <section class="fm-section">
          <h3>တိုက်ခိုက်ရေး နှင့် ပစ္စည်း <span>/ Action & Inventory</span></h3>
          <ul>
            <li><b>J</b> — လက်သီးထိုး / စူးစမ်းခြင်း</li>
            <li><b>K</b> (ဖိထားပြီး လွှတ်) — လောက်လေးပစ်ခြင်း</li>
            <li><b>B</b> — လွယ်အိတ်ဖွင့် / ပစ္စည်းရွေးချယ်ခြင်း</li>
            <li><b>L</b> — ရှောင်တိမ်းခြင်း (Dodge)</li>
          </ul>
        </section>
        <section class="fm-section">
          <h3>အခန်း ၅ ဉာဏ်စမ်းမေးခွန်း <span>/ Chapter 5 Gauntlet</span></h3>
          <ul>
            <li><b>1, 2, 3, 4</b> သို့မဟုတ် <b>ကလစ်</b> — အဖြေ က, ခ, ဂ, ဃ ရွေးချယ်ခြင်း</li>
            <li>ဦးကြီး၏ အကြံပြုချက်များကို သတိထားသုံးသပ်ပါ</li>
            <li>အမှား ၃ ကြိမ်ထိလျှင် အခန်းပြန်စရမည်</li>
          </ul>
        </section>
      </div>
    </div>`;
  ui.appendChild(modal);

  const close = () => {
    try { (soundEngine as any).playPing?.(); } catch {}
    modal.remove();
  };
  modal.querySelector('#fm-modal-close')?.addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
}

export class BridgeLinkScene extends Phaser.Scene {
  private elapsed = 0;
  private replay = false;
  private suspended = false;
  private navigated = false;
  constructor() { super('BRIDGE_EXIT_LINK'); }
  init(data: { replay?: boolean } = {}) {
    this.elapsed = 0;
    this.replay = Boolean(data?.replay);
    this.suspended = false;
    this.navigated = false;
  }
  create() {
    this.add.rectangle(640, 360, 1280, 720, 0x182d23);
    const ui = document.querySelector<HTMLDivElement>('#interface')!;
    const deathBurmese = toBurmeseNumeral(store.campaign.deathCount);
    ui.innerHTML = `
      <section class="result-panel">
        <span class="eyebrow">အခန်း ၁ ပြီးပါပြီ → အခန်း ၂ ဆီသို့ / CHAPTER 1 CLEARED</span>
        <h1>မြေအောက်စက်ခန်းဆီသို့</h1>
        <p class="intro">“ဒီအောက်လမ်းက ရွှေမြို့တော်ကို ရောက်တယ်ကွ!”<br>ဦးကြီးရဲ့အသံနောက်လိုက်ပြီး ဆင်းလာတော့ ကျောက်တုံးချစက်တစ်လုံး တွေ့ရတယ်။</p>
        <div class="result-stats">
          <div><span>ယခုအခန်း</span><b>အခန်း ၁</b></div>
          <div><span>နောက်အခန်း</span><b>အခန်း ၂</b></div>
          <div><span>စုစုပေါင်း သေဆုံးမှု</span><b>${deathBurmese} ကြိမ်</b></div>
          <div><span>စုဆောင်းရွှေ</span><b>${store.campaign.walletCoins}</b></div>
        </div>
        <p class="result-note">ရှိပြီးသား ရွှေ ${store.campaign.walletCoins} ဒင်္ဂါး နှင့် သေဆုံးမှု ${store.campaign.deathCount} ကြိမ်ကို မြေအောက်စက်ခန်းသို့ ဆက်လက်သယ်ဆောင်သွားသည်။</p>
        <p id="bridge-save" class="warning" ${store.unsaved ? '' : 'hidden'}>Save မသိမ်းရသေးပါ။ ယာယီဆက်ပါက reload တွင် progress ပျောက်နိုင်သည်။</p>
        
        <div class="transition-countdown-container" id="bridge-countdown">
          <div class="transition-countdown-bar">
            <div class="transition-countdown-fill" id="bridge-countdown-fill"></div>
          </div>
          <span class="transition-countdown-label" id="bridge-countdown-label">⏱️ အခန်း ၂ သို့ ဆက်လက်ထွက်ခွာနေသည်… (Space / Click ဖြင့် ကျော်နိုင်သည်)</span>
        </div>

        <!-- Clean, invisible surface for instant advance & Playwright test pass (zero visible buttons) -->
        <button type="button" id="continue" class="transition-click-surface" aria-label="Next Chapter"></button>
      </section>`;

    const bind = (id: string, fn: () => void) => {
      ui.querySelector<HTMLButtonElement>(`#${id}`)?.addEventListener('click', () => {
        try { soundEngine.playPing?.(); } catch {}
        fn();
      });
    };

    bind('continue', () => this.go());

    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        this.go();
      }
    };
    window.addEventListener('keydown', onKeydown);

    const suspend = () => { this.suspended = true; };
    window.addEventListener('blur', suspend);
    document.addEventListener('visibilitychange', suspend);
    this.events.once('shutdown', () => {
      window.removeEventListener('keydown', onKeydown);
      window.removeEventListener('blur', suspend);
      document.removeEventListener('visibilitychange', suspend);
    });
  }
  private go() {
    if (this.navigated) return;
    this.navigated = true;
    const mode = this.replay || store.campaign.chapter2Completed ? 'REPLAY' : 'CAMPAIGN';
    this.scene.start('CHAPTER_2', { preset: 'A', mode });
  }
  update(_t: number, ms: number) {
    if (document.hidden || !document.hasFocus()) return;
    if (this.suspended) { this.suspended = false; return; }
    if (!store.unsaved && !this.replay && !this.navigated) {
      this.elapsed += ms / 1000;
      const fill = document.getElementById('bridge-countdown-fill');
      const label = document.getElementById('bridge-countdown-label');
      if (fill) fill.style.width = `${Math.min(100, (this.elapsed / 3.0) * 100)}%`;
      if (label) {
        label.textContent = `⏱️ အခန်း ၂ သို့ ဆက်လက်ထွက်ခွာနေသည်… ${Math.max(0, 3.0 - this.elapsed).toFixed(1)}s (Space / Click ဖြင့် ကျော်နိုင်သည်)`;
      }
      if (this.elapsed >= 3.0) this.go();
    }
  }
}

export class ExitLinkScene extends Phaser.Scene {
  private elapsed = 0;
  private mode: Mode = 'CAMPAIGN';
  private result: any = null;
  private pending = false;
  private suspended = false;
  private resumePending = false;
  constructor() { super('CH2_EXIT_LINK'); }
  init(data: { result?: any; mode?: Mode; resumePending?: boolean }) {
    this.result = data.result ?? store.campaign.lastChapter2Result;
    this.mode = data.mode ?? 'REPLAY';
    this.elapsed = 0;
    this.pending = false;
    this.resumePending = Boolean(data.resumePending);
  }
  create() {
    if (this.textures.exists('background')) this.add.image(640, 360, 'background').setDisplaySize(1280, 720).setTint(0x809a7a);
    this.add.rectangle(640, 360, 1280, 720, 0x14261d, 0.65);
    const g = this.add.graphics();
    for (let i = 0; i < 7; i++) g.fillStyle(0x5a6c53).fillRect(820 + i * 60, 380 + i * 35, 120, 350);

    if (this.resumePending) this.showPending();
    else this.showResult();

    this.suspended = document.hidden || !document.hasFocus();
    const suspend = () => { this.suspended = true; };
    window.addEventListener('blur', suspend);
    document.addEventListener('visibilitychange', suspend);
    this.events.once('shutdown', () => {
      window.removeEventListener('blur', suspend);
      document.removeEventListener('visibilitychange', suspend);
    });
  }
  private showResult() {
    const r = this.result;
    const ui = document.querySelector<HTMLDivElement>('#interface')!;
    const deathBurmese = toBurmeseNumeral(store.campaign.deathCount);
    ui.innerHTML = `
      <section class="result-panel">
        <span class="eyebrow">${this.mode === 'PRACTICE' ? 'လေ့ကျင့်ခန်း ပြီးပါပြီ' : 'အခန်း ၂ ပြီးပါပြီ → အခန်း ၃ ဆီသို့ / CHAPTER 2 CLEARED'}</span>
        <h1>ရှေးဟောင်းချိန်ခွင်ကြီးဆီသို့</h1>
        <p class="result-quip">“ရပြီထင်မနေနဲ့ဦး… အောက်မှာတွေ့မယ်!”</p>
        <div class="result-stats">
          <div><span>ယခုအခန်း</span><b>အခန်း ၂</b></div>
          <div><span>နောက်အခန်း</span><b>အခန်း ၃</b></div>
          <div><span>စုစုပေါင်း သေဆုံးမှု</span><b>${deathBurmese} ကြိမ်</b></div>
          <div><span>စုဆောင်းရွှေ</span><b>${store.campaign.walletCoins}</b></div>
          <div><span>အောင်မြင်ချိန်</span><b>${r?.activeSeconds?.toFixed(2) ?? '—'}<small>s</small></b></div>
        </div>
        <p class="result-note">ကျောက်တုံးဖိစက်ခန်းမှ လွတ်မြောက်လာပြီး ချိန်ခွင်ကြီး ငြိမ်သက်အောင် ထိန်းရမည့် မြေအောက်ခန်းဆီ ဆင်းလာခဲ့သည်။</p>

        <div class="transition-countdown-container" id="ch2-countdown">
          <div class="transition-countdown-bar">
            <div class="transition-countdown-fill" id="ch2-countdown-fill"></div>
          </div>
          <span class="transition-countdown-label" id="ch2-countdown-label">⏱️ အခန်း ၃ သို့ ဆက်လက်ထွက်ခွာနေသည်… (Space / Click ဖြင့် ကျော်နိုင်သည်)</span>
        </div>

        <!-- Clean surface trigger for instant skip & Playwright compatibility (zero visible buttons) -->
        <button type="button" id="continue" class="transition-click-surface" aria-label="Next Chapter"></button>
      </section>`;

    const bind = (id: string, fn: () => void) => {
      ui.querySelector<HTMLButtonElement>(`#${id}`)?.addEventListener('click', () => {
        try { soundEngine.playPing?.(); } catch {}
        fn();
      });
    };

    bind('continue', () => this.showPending());

    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        this.showPending();
      }
    };
    window.addEventListener('keydown', onKeydown);
    this.events.once('shutdown', () => {
      window.removeEventListener('keydown', onKeydown);
    });
  }
  private showPending() {
    this.pending = true;
    const ui = document.querySelector<HTMLDivElement>('#interface')!;
    if (store.unsaved) {
      ui.innerHTML = `
        <section class="result-panel">
          <h1>ချိန်ခွင်ခန်းဆီ။</h1>
          <p class="warning">Save မသိမ်းရသေးပါ။ Reload လုပ်ပါက ယာယီ progress ပျောက်နိုင်သည်။</p>
          <div class="actions">
            <button type="button" id="retry-save" class="primary">ထပ်သိမ်းမယ်</button>
            <button type="button" id="temporary-scale" class="secondary">ယာယီအတိုင်း အခန်း ၃ ဆက်မယ်</button>
            <button type="button" id="menu" class="secondary">ပင်မစာမျက်နှာ</button>
          </div>
        </section>`;
      const bind = (id: string, fn: () => void) => {
        ui.querySelector<HTMLButtonElement>(`#${id}`)?.addEventListener('click', () => {
          try { soundEngine.playPing?.(); } catch {}
          fn();
        });
      };
      bind('retry-save', () => { if (store.save()) this.scene.start('CHAPTER_3'); });
      bind('temporary-scale', () => this.scene.start('CHAPTER_3'));
      bind('menu', () => this.scene.start('MENU'));
      return;
    }
    this.scene.start('CHAPTER_3');
  }
  update(_t: number, ms: number) {
    if (document.hidden || !document.hasFocus()) return;
    if (this.suspended) { this.suspended = false; return; }
    if (!this.pending) {
      this.elapsed += ms / 1000;
      const fill = document.getElementById('ch2-countdown-fill');
      const label = document.getElementById('ch2-countdown-label');
      if (fill) fill.style.width = `${Math.min(100, (this.elapsed / 3.0) * 100)}%`;
      if (label) {
        label.textContent = `⏱️ အခန်း ၃ သို့ ဆက်လက်ထွက်ခွာနေသည်… ${Math.max(0, 3.0 - this.elapsed).toFixed(1)}s (Space / Click ဖြင့် ကျော်နိုင်သည်)`;
      }
      if (this.elapsed >= 3.0) this.showPending();
    }
  }
}

export class ChapterFourPendingScene extends Phaser.Scene {
  private elapsed = 0;
  private suspended = false;
  private navigated = false;
  constructor() { super('CHAPTER_4_PENDING'); }
  init() {
    this.elapsed = 0;
    this.suspended = false;
    this.navigated = false;
  }
  create() {
    if (!store.campaign.chapter3Completed) {
      this.scene.start('MENU');
      return;
    }

    if (this.textures.exists('background')) {
      this.add.image(640, 360, 'background').setDisplaySize(1280, 720).setTint(0x6e8060);
    }
    this.add.rectangle(640, 360, 1280, 720, 0x14261d, 0.7);

    const result = store.campaign.lastChapter3Result;
    const deathBurmese = toBurmeseNumeral(store.campaign.deathCount);
    const ui = document.querySelector<HTMLDivElement>('#interface')!;
    ui.innerHTML = `
      <section class="result-panel">
        <span class="eyebrow">အခန်း ၃ ပြီးပါပြီ → အခန်း ၄ ဆီသို့ / CHAPTER 3 CLEARED</span>
        <h1>သတ်ကွင်းခန်းမကြီးဆီသို့</h1>
        <p class="result-quip">“တံခါးလွန်တော့ အသံလွန်ပြီ… စက်သံကြောင့် အတွင်းဘက်က မျောက်တွေ နိုးကုန်ပြီဟေ့ ဖိုးထောင်!”</p>
        <div class="result-stats">
          <div><span>ယခုအခန်း</span><b>အခန်း ၃</b></div>
          <div><span>နောက်အခန်း</span><b>အခန်း ၄</b></div>
          <div><span>စုစုပေါင်း သေဆုံးမှု</span><b>${deathBurmese} ကြိမ်</b></div>
          <div><span>စုဆောင်းရွှေ</span><b>${store.campaign.walletCoins}</b></div>
          <div><span>ရွှေရုပ်</span><b>${result?.treasureRecovered ? 'ပါလာပြီ' : 'ထားခဲ့သည်'}</b></div>
          <div><span>အောင်မြင်ချိန်</span><b>${result?.activeSeconds != null ? result.activeSeconds.toFixed(2) : '—'}<small>s</small></b></div>
        </div>
        <p class="result-note">ရှေးဟောင်းချိန်ခွင်ကြီးကို ညှိပြီး လျှို့ဝှက်တံခါးပေါက်မှ လွတ်မြောက်လာခဲ့သော်လည်း ရှေ့တွင် ဘီလူးမျောက်ငိုဏ်း စောင့်ကြပ်သော သတ်ကွင်းခန်းမကြီးသို့ ရောက်ရှိလာသည်။</p>
        <p id="scale-save-warning" class="warning" ${store.unsaved ? '' : 'hidden'}>Save မသိမ်းရသေးပါ။ ယာယီဆက်ပါက reload တွင် progress ပျောက်နိုင်သည်။</p>

        <div class="transition-countdown-container" id="scale-countdown">
          <div class="transition-countdown-bar">
            <div class="transition-countdown-fill" id="scale-countdown-fill"></div>
          </div>
          <span class="transition-countdown-label" id="scale-countdown-label">⏱️ အခန်း ၄ သို့ ဆက်လက်ထွက်ခွာနေသည်… (Space / Click ဖြင့် ကျော်နိုင်သည်)</span>
        </div>

        <!-- Clean surface trigger for instant skip & Playwright compatibility (zero visible buttons) -->
        <button type="button" id="continue" class="transition-click-surface" aria-label="Next Chapter"></button>
        <button type="button" id="scale-next" class="transition-click-surface" aria-label="Next Chapter"></button>
      </section>`;

    const bind = (id: string, fn: () => void) => {
      ui.querySelector<HTMLButtonElement>(`#${id}`)?.addEventListener('click', () => {
        try { soundEngine.playPing?.(); } catch {}
        fn();
      });
    };

    bind('continue', () => this.go());
    bind('scale-next', () => this.go());

    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        this.go();
      }
    };
    window.addEventListener('keydown', onKeydown);

    this.suspended = document.hidden || !document.hasFocus();
    const suspend = () => { this.suspended = true; };
    window.addEventListener('blur', suspend);
    document.addEventListener('visibilitychange', suspend);
    this.events.once('shutdown', () => {
      window.removeEventListener('keydown', onKeydown);
      window.removeEventListener('blur', suspend);
      document.removeEventListener('visibilitychange', suspend);
    });
  }
  private go() {
    if (this.navigated) return;
    this.navigated = true;
    try { soundEngine.playPing?.(); } catch {}
    this.scene.start('CHAPTER_4');
  }
  update(_t: number, ms: number) {
    if (document.hidden || !document.hasFocus()) return;
    if (this.suspended) { this.suspended = false; return; }
    if (!store.unsaved && !this.navigated) {
      this.elapsed += ms / 1000;
      const fill = document.getElementById('scale-countdown-fill');
      const label = document.getElementById('scale-countdown-label');
      if (fill) fill.style.width = `${Math.min(100, (this.elapsed / 3.0) * 100)}%`;
      if (label) {
        label.textContent = `⏱️ အခန်း ၄ သို့ ဆက်လက်ထွက်ခွာနေသည်… ${Math.max(0, 3.0 - this.elapsed).toFixed(1)}s (Space / Click ဖြင့် ကျော်နိုင်သည်)`;
      }
      if (this.elapsed >= 3.0) this.go();
    }
  }
}

export class ChapterFivePendingScene extends Phaser.Scene {
  constructor() { super('CHAPTER_5_PENDING'); }
  create() {
    if (!store.campaign.chapter4Completed) {
      this.scene.start('MENU');
      return;
    }
    this.scene.start('CHAPTER_5');
  }
}


export function jumpToChapter1() {
  try { (soundEngine as any).playPing?.(); } catch {}
  store.campaign.resumeAt = 'CHAPTER_1';
  try { store.save(); } catch {}

  document.getElementById('fantasy-menu-overlay')?.remove();
  document.getElementById('fm-modal')?.remove();

  if (game && game.scene) {
    const activeScenes = game.scene.getScenes(true);
    for (const s of activeScenes) {
      if (s.scene.key !== 'Chapter1Scene') {
        try { s.scene.stop(); } catch {}
      }
    }
    soundEngine.stopBGM();
    audioDirector.stopStems();
    game.scene.start('Chapter1Scene');
  }
}

export function jumpToChapter2() {
  try { (soundEngine as any).playPing?.(); } catch {}
  store.campaign.bridgeCompleted = true;
  store.campaign.resumeAt = 'CHAPTER_2';
  try { store.save(); } catch {}

  document.getElementById('fantasy-menu-overlay')?.remove();
  document.getElementById('fm-modal')?.remove();

  if (game && game.scene) {
    const activeScenes = game.scene.getScenes(true);
    for (const s of activeScenes) {
      if (s.scene.key !== 'CHAPTER_2') {
        try { s.scene.stop(); } catch {}
      }
    }
    soundEngine.stopBGM();
    audioDirector.stopStems();
    game.scene.start('CHAPTER_2', { preset: 'A', mode: 'CAMPAIGN' });
  }
}

export function jumpToChapter3() {
  try { (soundEngine as any).playPing?.(); } catch {}
  store.campaign.bridgeCompleted = true;
  store.campaign.chapter2Completed = true;
  store.campaign.resumeAt = 'CHAPTER_3';
  try { store.save(); } catch {}

  document.getElementById('fantasy-menu-overlay')?.remove();
  document.getElementById('fm-modal')?.remove();

  if (game && game.scene) {
    const activeScenes = game.scene.getScenes(true);
    for (const s of activeScenes) {
      if (s.scene.key !== 'CHAPTER_3') {
        try { s.scene.stop(); } catch {}
      }
    }
    soundEngine.stopBGM();
    audioDirector.stopStems();
    game.scene.start('CHAPTER_3');
  }
}

export function jumpToChapter4() {
  try { (soundEngine as any).playPing?.(); } catch {}
  store.campaign.bridgeCompleted = true;
  store.campaign.chapter2Completed = true;
  store.campaign.chapter3Completed = true;
  store.campaign.resumeAt = 'CHAPTER_4';
  if (!store.campaign.ownedTools.includes('slingshot')) store.campaign.ownedTools.push('slingshot');
  if (!store.campaign.inventory.includes('slingshot')) store.campaign.inventory.push('slingshot');
  try { store.save(); } catch {}

  document.getElementById('fantasy-menu-overlay')?.remove();
  document.getElementById('fm-modal')?.remove();

  if (game && game.scene) {
    const activeScenes = game.scene.getScenes(true);
    for (const s of activeScenes) {
      if (s.scene.key !== 'CHAPTER_4') {
        try { s.scene.stop(); } catch {}
      }
    }
    soundEngine.stopBGM();
    audioDirector.stopStems();
    game.scene.start('CHAPTER_4');
  }
}

function openChapterSelectModal() {
  const ui = document.querySelector<HTMLDivElement>('#interface');
  if (!ui) return;
  const existing = document.getElementById('fm-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'fm-modal';
  modal.className = 'fm-modal fm-modal-backdrop';
  modal.innerHTML = `
    <div class="fm-modal-panel chapter-select-panel">
      <header class="fm-modal-head">
        <div>
          <span class="fm-modal-eyebrow">CAMPAIGN DIRECT ACCESS</span>
          <h2 class="fm-modal-title" style="font-weight: 900; color: #fff9ed;">အခန်း ရွေးချယ်ကစားမည် <span style="font-size: 0.6em; opacity: 0.8; font-weight: 700;">/ Chapter Select</span></h2>
        </div>
        <button type="button" class="fm-modal-close" id="fm-modal-close">✕</button>
      </header>
      <div class="fm-modal-body">
        <div class="chapter-card-grid">
          <button type="button" class="chapter-select-card" id="select-ch1">
            <div class="ch-card-badge">အခန်း ၁</div>
            <div class="ch-card-content">
              <h3 class="ch-card-title">တံတားဦး စွန့်စားခန်း</h3>
              <p class="ch-card-desc">The Ancient Bridge • စက်သီး၊ ဝင်ရိုးနှင့် တံတားပျက် လျှို့ဝှက်ချက်</p>
            </div>
            <span class="ch-card-arrow">စတင်မည် →</span>
          </button>

          <button type="button" class="chapter-select-card" id="select-ch2">
            <div class="ch-card-badge">အခန်း ၂</div>
            <div class="ch-card-content">
              <h3 class="ch-card-title">မြေအောက်စက်ခန်း</h3>
              <p class="ch-card-desc">The Gear Mechanism • ကျောက်တုံးဖိစက်၊ ရေနွေးငွေ့နှင့် ဂီယာအုံ</p>
            </div>
            <span class="ch-card-arrow">စတင်မည် →</span>
          </button>

          <button type="button" class="chapter-select-card" id="select-ch3">
            <div class="ch-card-badge">အခန်း ၃</div>
            <div class="ch-card-content">
              <h3 class="ch-card-title">ရှေးဟောင်းချိန်ခွင်ကြီး</h3>
              <p class="ch-card-desc">The Ancient Scales • ရွှေတုံးနှင့် ချိန်ခွင်ငြိမ်သက်ခြင်း ပုစ္ဆာ</p>
            </div>
            <span class="ch-card-arrow">စတင်မည် →</span>
          </button>

          <button type="button" class="chapter-select-card" id="select-ch4">
            <div class="ch-card-badge">အခန်း ၄</div>
            <div class="ch-card-content">
              <h3 class="ch-card-title">သတ်ကွင်းခန်းမကြီး</h3>
              <p class="ch-card-desc">The Monkey Arena • လောက်လေးခွနှင့် ဘီလူးမျောက်ငိုဏ်း</p>
            </div>
            <span class="ch-card-arrow">စတင်မည် →</span>
          </button>

          <button type="button" class="chapter-select-card" id="select-ch5">
            <div class="ch-card-badge">အခန်း ၅</div>
            <div class="ch-card-content">
              <h3 class="ch-card-title">ရာဇပလ္လင် ဉာဏ်စမ်းခန်း</h3>
              <p class="ch-card-desc">The Palace Gauntlet • ဦးကြီး၏ နောက်ဆုံးမေးခွန်းများ</p>
            </div>
            <span class="ch-card-arrow">စတင်မည် →</span>
          </button>
        </div>
      </div>
    </div>`;
  ui.appendChild(modal);

  const close = () => {
    try { (soundEngine as any).playPing?.(); } catch {}
    modal.remove();
  };
  modal.querySelector('#fm-modal-close')?.addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

  modal.querySelector('#select-ch1')?.addEventListener('click', () => jumpToChapter1());
  modal.querySelector('#select-ch2')?.addEventListener('click', () => jumpToChapter2());
  modal.querySelector('#select-ch3')?.addEventListener('click', () => jumpToChapter3());
  modal.querySelector('#select-ch4')?.addEventListener('click', () => jumpToChapter4());
  modal.querySelector('#select-ch5')?.addEventListener('click', () => jumpToChapter5());
}
export function jumpToChapter5() {
  try { (soundEngine as any).playPing?.(); } catch {}
  store.campaign.bridgeCompleted = true;
  store.campaign.chapter2Completed = true;
  store.campaign.chapter3Completed = true;
  store.campaign.chapter4Completed = true;
  store.campaign.resumeAt = 'CHAPTER_5';
  if (!store.campaign.ownedTools.includes('slingshot')) store.campaign.ownedTools.push('slingshot');
  if (!store.campaign.inventory.includes('slingshot')) store.campaign.inventory.push('slingshot');
  try { store.save(); } catch {}

  const menuDiv = document.getElementById('fantasy-menu-overlay');
  if (menuDiv) menuDiv.remove();
  const modal = document.getElementById('fm-modal');
  if (modal) modal.remove();

  if (game && game.scene) {
    const activeScenes = game.scene.getScenes(true);
    for (const s of activeScenes) {
      if (s.scene.key !== 'CHAPTER_5') {
        try { s.scene.stop(); } catch {}
      }
    }
    soundEngine.stopBGM();
    audioDirector.stopStems();
    game.scene.start('CHAPTER_5', { equipment: { slingshot: true }, skipIntro: false });
  }
}

function setupAudioWidget() {
  const btn = document.getElementById('volume-toggle-btn');
  const icon = document.getElementById('volume-icon');

  const unlockAudioOnTouch = () => {
    try {
      soundEngine.init?.();
      window.dispatchEvent(new CustomEvent('phoe:audio-unlocked'));
    } catch {}
    window.removeEventListener('touchstart', unlockAudioOnTouch);
    window.removeEventListener('pointerdown', unlockAudioOnTouch);
  };
  window.addEventListener('touchstart', unlockAudioOnTouch, { passive: true });
  window.addEventListener('pointerdown', unlockAudioOnTouch, { passive: true });

  if (!btn || !icon) return;

  const updateIcon = () => {
    const isMuted = Boolean((soundEngine as any).muted) || Boolean(audioDirector.getMuted());
    icon.textContent = isMuted ? '🔇' : '🔊';
    btn.setAttribute('aria-label', isMuted ? 'အသံ ဖွင့်မည် (Unmute)' : 'အသံ ပိတ်မည် (Mute)');
  };

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    try {
      soundEngine.init?.();
      if ((soundEngine as any).toggleMute) {
        (soundEngine as any).toggleMute();
      } else {
        (soundEngine as any).muted = !(soundEngine as any).muted;
        audioDirector.toggleMute();
      }
      updateIcon();
    } catch {}
  });

  window.addEventListener('phoe:audio-unlocked', () => {
    updateIcon();
  });

  updateIcon();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupAudioWidget);
} else {
  setupAudioWidget();
}

export const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: C.width,
  height: C.height,
  backgroundColor: '#22382c',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    autoRound: true
  },
  input: {
    activePointers: 3,
    touch: {
      capture: true
    }
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, fixedStep: true, fps: 60 }
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: true
  },
  scene: [
    BootScene,
    SharedPreloadScene,
    MenuScene,
    TutorialChapterScene,
    BridgeChapterScene,
    BridgeLinkScene,
    Chapter2Scene,
    ExitLinkScene,
    ScaleChapterScene,
    ChapterFourPendingScene,
    ArenaChapterScene,
    ChapterFivePendingScene,
    FinalChapterScene,
    CampaignEndingScene
  ]
});

(window as any).__PHOE_GAME__ = game;
(window as any).jumpToChapter1 = jumpToChapter1;
(window as any).jumpToChapter2 = jumpToChapter2;
(window as any).jumpToChapter3 = jumpToChapter3;
(window as any).jumpToChapter4 = jumpToChapter4;
(window as any).jumpToChapter5 = jumpToChapter5;
(window as any).soundEngine = soundEngine;

declare global { interface Window { __PHOE_TEST__?: { snapshot(): unknown } } }
window.__PHOE_TEST__ = {
  snapshot: () => {
    const ch2 = game.scene.isActive('CHAPTER_2') ? (game.scene.getScene('CHAPTER_2') as any) : null;
    const ch2Snap = ch2?.snapshot?.();
    return {
      mode: ch2Snap ? ch2Snap.mode : 'CAMPAIGN',
      attempt: ch2Snap ? ch2Snap.attempt : null,
      generation: ch2Snap ? ch2Snap.generation : undefined,
      paused: ch2Snap ? ch2Snap.paused : false,
      campaign: structuredClone(store.campaign),
      activeScenes: game.scene.getScenes(true).map(s => s.scene.key),
      tutorial: game.scene.isActive('TUTORIAL') ? (game.scene.getScene('TUTORIAL') as any) : null,
      bridge: game.scene.isActive('Chapter1Scene') ? (game.scene.getScene('Chapter1Scene') as any)?.snapshot?.() : null,
      chapter2: ch2Snap ?? null,
      scale: game.scene.isActive('CHAPTER_3') ? (game.scene.getScene('CHAPTER_3') as ScaleChapterScene).snapshot() : null,
      arena: game.scene.isActive('CHAPTER_4') ? (game.scene.getScene('CHAPTER_4') as ArenaChapterScene).snapshot() : null,
      final: game.scene.isActive('CHAPTER_5') ? (game.scene.getScene('CHAPTER_5') as FinalChapterScene).snapshot() : null
    };
  }
};
