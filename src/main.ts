import Phaser from 'phaser';
import './style.css';
import './fantasy-theme.css';
import { C } from './content/chapter1';
import { store } from './services/adventure';
import { AudioController } from './services/AudioController';
import { soundEngine } from './utils/SoundEngine.js';
import PreloadScene from './scenes/PreloadScene.js';
import BridgeChapterScene from './scenes/BridgeChapterScene.js';
import Chapter2Scene from './scenes/Chapter2Scene';
import ScaleChapterScene from './scenes/ScaleChapterScene';
import { SCALE_ART } from './content/chapter3Art';
import ArenaChapterScene from './scenes/ArenaChapterScene';
import FinalChapterScene, { CampaignEndingScene } from './scenes/FinalChapterScene';
import type { Mode } from './domain/types';

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
    const el = document.getElementById('boot-splash');
    if (el) {
      el.style.display = 'none';
      el.remove();
    }
    this.scene.start('PreloadScene');
  }
}

export class SharedPreloadScene extends PreloadScene {
  create() {
    this.createAllGameAssets();
    this.scene.start('MENU');
  }
}

export class MenuScene extends Phaser.Scene {
  constructor() { super('MENU'); }
  create() {
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
        <p class="fm-subtitle">ပုဂံရွှေမြို့တော် စွန့်စားခန်း</p>
        <div class="fm-rule"><span></span><b>❖</b><span></span></div>
        <nav class="fm-actions">
          <button type="button" id="start" class="fm-btn fm-primary">
            <span class="fm-btn-label">PLAY</span>
            <small>ဆက်လက်ကစားမည်</small>
          </button>
          <button type="button" id="menu-test-ch5" class="fm-btn fm-test" style="border: 2px solid #f59e0b; background: rgba(245, 158, 11, 0.22); box-shadow: 0 0 16px rgba(245, 158, 11, 0.35);">
            <span class="fm-btn-label" style="color: #fde047; font-weight: 900;">⚡ TEST CHAPTER 5</span>
            <small style="color: #fef08a;">အခန်း ၅ စမ်းရန် (Quiz & Ambush)</small>
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
    const testCh5Btn = menuDiv.querySelector<HTMLButtonElement>('#menu-test-ch5');
    const restartBtn = menuDiv.querySelector<HTMLButtonElement>('#menu-restart');
    const mechanicBtn = menuDiv.querySelector<HTMLButtonElement>('#menu-mechanic');

    const closeMenu = () => {
      menuDiv.remove();
    };

    testCh5Btn?.addEventListener('click', () => {
      try { (soundEngine as any).playPing?.(); } catch {}
      closeMenu();
      jumpToChapter5();
    });

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
      restartBtn.classList.add('fm-confirmed');
      const label = restartBtn.querySelector('.fm-btn-label');
      const note = restartBtn.querySelector('small');
      if (label) label.textContent = 'RESTARTED';
      if (note) note.textContent = 'အခန်း ၁ မှ ပြန်စနေသည်…';
      window.setTimeout(() => {
        closeMenu();
        this.scene.start('Chapter1Scene');
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
  modal.className = 'fm-modal-backdrop';
  modal.innerHTML = `
    <div class="fm-modal-panel">
      <header class="fm-modal-header">
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
  constructor() { super('BRIDGE_EXIT_LINK'); }
  init(data: { replay?: boolean } = {}) {
    this.elapsed = 0;
    this.replay = Boolean(data?.replay);
    this.suspended = false;
  }
  create() {
    this.add.rectangle(640, 360, 1280, 720, 0x182d23);
    const ui = document.querySelector<HTMLDivElement>('#interface')!;
    ui.innerHTML = `
      <section class="result-panel">
        <span class="eyebrow">အခန်း ၁ ပြီးပါပြီ / PUZZLE → ACTION</span>
        <h1>မြေအောက်စက်ခန်းဆီ။</h1>
        <p class="intro">“ဒီအောက်လမ်းက ရွှေမြို့တော်ကို ရောက်တယ်ကွ!”<br>ဦးကြီးရဲ့အသံနောက်လိုက်ပြီး ဆင်းလာတော့ ကျောက်တုံးချစက်တစ်လုံး တွေ့ရတယ်။</p>
        <p class="result-note">အခန်း ၁ တွင် ငွေဆုမပါ။ ရှိပြီးသား ရွှေ ${store.campaign.walletCoins} နဲ့ သေဆုံးမှု ${store.campaign.deathCount} ကို ဆက်သယ်ထားတယ်။</p>
        <p id="bridge-save" class="warning" ${store.unsaved ? '' : 'hidden'}>Save မသိမ်းရသေးပါ။ ယာယီဆက်ပါက reload တွင် progress ပျောက်နိုင်သည်။</p>
        <div class="actions">
          <button type="button" id="continue" class="primary">${store.unsaved ? 'ယာယီအတိုင်း ဆက်မယ်' : 'အခန်း ၂ ဆက်မယ်'}</button>
          ${store.unsaved ? '<button type="button" id="retry-save" class="secondary">ထပ်သိမ်းမယ်</button>' : ''}
          <button type="button" id="menu" class="secondary">ပင်မစာမျက်နှာ</button>
        </div>
      </section>`;

    const bind = (id: string, fn: () => void) => {
      ui.querySelector<HTMLButtonElement>(`#${id}`)?.addEventListener('click', () => {
        try { soundEngine.playPing?.(); } catch {}
        fn();
      });
    };

    bind('continue', () => this.go());
    bind('menu', () => this.scene.start('MENU'));
    bind('retry-save', () => {
      if (store.save()) this.scene.restart({ replay: this.replay });
    });

    const suspend = () => { this.suspended = true; };
    window.addEventListener('blur', suspend);
    document.addEventListener('visibilitychange', suspend);
    this.events.once('shutdown', () => {
      window.removeEventListener('blur', suspend);
      document.removeEventListener('visibilitychange', suspend);
    });
  }
  private go() {
    const mode = this.replay || store.campaign.chapter2Completed ? 'REPLAY' : 'CAMPAIGN';
    this.scene.start('CHAPTER_2', { preset: 'A', mode });
  }
  update(_t: number, ms: number) {
    if (document.hidden || !document.hasFocus()) return;
    if (this.suspended) { this.suspended = false; return; }
    if (!store.unsaved && !this.replay) {
      this.elapsed += ms / 1000;
      if (this.elapsed >= C.linkTime) this.go();
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
    ui.innerHTML = `
      <section class="result-panel">
        <span class="eyebrow">${this.mode === 'PRACTICE' ? 'လေ့ကျင့်ခန်း ပြီးပါပြီ' : 'ဒုတိယအခန်း ပြီးပါပြီ'}</span>
        <h1>ဒီတစ်ခါ လွတ်ပြီ။</h1>
        <p class="result-quip">“ရပြီထင်မနေနဲ့ဦး… အောက်မှာတွေ့မယ်!”</p>
        <div class="result-stats">
          <div><span>ယူထွက်လာတဲ့ရွှေ</span><b>${r?.collectedCoins ?? 0}<small>/15</small></b></div>
          <div><span>အသစ်သိမ်းရတဲ့ရွှေ</span><b>+${r?.creditedCoins ?? 0}</b></div>
          <div><span>အောင်မြင်ချိန်</span><b>${r?.activeSeconds?.toFixed(2) ?? '—'}<small>s</small></b></div>
          <div><span>ဒီအခန်း သေဆုံးမှု</span><b>${r?.sessionDeaths ?? 0}</b></div>
        </div>
        <p class="result-note">${store.unsaved ? 'ယာယီ session သာဖြစ်ပြီး save မသိမ်းရသေးပါ။' : 'ရလာဒ်နှင့် စုထားသောရွှေကို သိမ်းထားပါပြီ။'} ${this.mode === 'PRACTICE' ? 'လေ့ကျင့်ခန်းမှာ ငွေထပ်မပေးပါ။' : 'ပြန်ဆော့လျှင် အရင်ထက်ပိုကောက်နိုင်သည့်ငွေပဲ ထပ်ရမယ်။'}</p>
        <div class="actions">
          ${this.mode === 'CAMPAIGN' ? '<button type="button" id="continue" class="primary">ဆက်မယ်</button>' : '<button type="button" id="replay" class="primary">ပြန်စမ်းမယ်</button>'}
          ${store.campaign.chapter2Completed ? '<button type="button" id="chapter-three" class="secondary">အခန်း ၃ ဆီ</button><button type="button" id="practice-b" class="secondary">လေ့ကျင့်ခန်း B</button><button type="button" id="practice-c" class="secondary">လေ့ကျင့်ခန်း C</button>' : ''}
          <button type="button" id="menu" class="secondary">ပင်မစာမျက်နှာ</button>
        </div>
      </section>`;

    const bind = (id: string, fn: () => void) => {
      ui.querySelector<HTMLButtonElement>(`#${id}`)?.addEventListener('click', () => {
        try { soundEngine.playPing?.(); } catch {}
        fn();
      });
    };

    bind('continue', () => this.showPending());
    bind('replay', () => this.scene.start('CHAPTER_2', { preset: 'A', mode: 'REPLAY' }));
    bind('practice-b', () => this.scene.start('CHAPTER_2', { preset: 'B', mode: 'PRACTICE' }));
    bind('practice-c', () => this.scene.start('CHAPTER_2', { preset: 'C', mode: 'PRACTICE' }));
    bind('menu', () => this.scene.start('MENU'));
    bind('chapter-three', () => {
      if (store.campaign.chapter2Completed) this.scene.start('CHAPTER_3');
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
    if (this.mode === 'CAMPAIGN' && !this.pending) {
      this.elapsed += ms / 1000;
      if (this.elapsed >= C.linkTime) this.showPending();
    }
  }
}

export class ChapterFourPendingScene extends Phaser.Scene {
  constructor() { super('CHAPTER_4_PENDING'); }
  create() {
    this.scene.start(store.campaign.chapter3Completed ? 'CHAPTER_4' : 'MENU');
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
    game.scene.start('CHAPTER_5', { equipment: { slingshot: true }, skipIntro: false });
  }
}

function setupAudioWidget() {
  const btn = document.getElementById('volume-toggle-btn');
  const icon = document.getElementById('volume-icon');
  if (!btn || !icon) return;

  const updateIcon = () => {
    const isMuted = Boolean((soundEngine as any).muted);
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
(window as any).jumpToChapter5 = jumpToChapter5;

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
      bridge: game.scene.isActive('Chapter1Scene') ? (game.scene.getScene('Chapter1Scene') as any)?.snapshot?.() : null,
      chapter2: ch2Snap ?? null,
      scale: game.scene.isActive('CHAPTER_3') ? (game.scene.getScene('CHAPTER_3') as ScaleChapterScene).snapshot() : null,
      arena: game.scene.isActive('CHAPTER_4') ? (game.scene.getScene('CHAPTER_4') as ArenaChapterScene).snapshot() : null,
      final: game.scene.isActive('CHAPTER_5') ? (game.scene.getScene('CHAPTER_5') as FinalChapterScene).snapshot() : null
    };
  }
};
