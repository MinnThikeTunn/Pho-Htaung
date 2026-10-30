import Phaser from 'phaser';
import './style.css';
import { C } from './content/chapter1';
import { DIALOGUE } from './content/dialogue.my';
import { createAttempt } from './domain/createAttempt';
import { preview } from './domain/step';
import type { ChapterResult, Input, Mode, Preset } from './domain/types';
import { SAVE_KEY, SETTINGS_KEY } from './services/CampaignStore';
import { AudioController } from './services/AudioController';
import { Session } from './services/Session';
import { WorldView } from './view/WorldView';
import { store } from './services/adventure';
import PreloadScene from './scenes/PreloadScene.js';
import BridgeChapterScene from './scenes/BridgeChapterScene.js';
import Chapter2Scene from './scenes/Chapter2Scene';
import ScaleChapterScene from './scenes/ScaleChapterScene';
import { SCALE_ART } from './content/chapter3Art';
import ArenaChapterScene from './scenes/ArenaChapterScene';
import FinalChapterScene, { CampaignEndingScene } from './scenes/FinalChapterScene';
import { soundEngine } from './utils/SoundEngine.js';

const uid = () => crypto.randomUUID();

const audio = new AudioController();
const ui = document.querySelector<HTMLDivElement>('#interface')!;
let shade = true, showHints = true, debug = false;
try { const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}'); audio.muted = Boolean(s.muted); soundEngine.muted = Boolean(s.muted); shade = s.shake !== false; showHints = s.hints !== false; } catch { /* Readable defaults when settings are unavailable. */ }
function saveSettings() { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify({ muted: audio.muted, shake: shade, hints: showHints })); } catch { /* Campaign warnings remain independent. */ } }
// Full viewport mode - header & footer omitted
const buttons = (html: string) => `<div class="actions">${html}</div>`;
const button = (id: string, text: string, primary = false) => `<button type="button" id="${id}" class="${primary ? 'primary' : 'secondary'}">${text}</button>`;
function bind(id: string, fn: () => void) { 
  ui.querySelector<HTMLButtonElement>(`#${id}`)?.addEventListener('click', () => { 
    try { if (typeof (soundEngine as any).playPing === 'function') (soundEngine as any).playPing(); else if (typeof (soundEngine as any).playPickup === 'function') (soundEngine as any).playPickup(); } catch {}
    fn(); 
  }); 
}

// Global click sound for all buttons
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (target.tagName === 'BUTTON' || target.closest('button')) {
    try { soundEngine.playPing?.(); } catch {}
  }
});

// Volume control
let bgmVolume = 0.5;
try {
  const savedVol = localStorage.getItem('phoe-bgm-volume');
  if (savedVol !== null) bgmVolume = Math.max(0, Math.min(1, parseFloat(savedVol)));
} catch {}
try {
  (soundEngine as any).setBGMVolume?.(bgmVolume);
  (soundEngine as any).bgmVolume = bgmVolume;
} catch {}
function updateVolumeUI() {
  const volBtn = document.getElementById('volume-btn');
  const volIcon = document.getElementById('volume-icon');
  if (volBtn && volIcon) {
    if (bgmVolume === 0 || soundEngine.muted) {
      volIcon.textContent = '🔇';
    } else if (bgmVolume < 0.5) {
      volIcon.textContent = '🔉';
    } else {
      volIcon.textContent = '🔊';
    }
  }
}
function createVolumeControl() {
  if (document.getElementById('volume-control')) return;
  const volDiv = document.createElement('div');
  volDiv.id = 'volume-control';
  volDiv.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:999999;';
  volDiv.innerHTML = `<button id="volume-btn" title="Background Music Volume" style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,rgba(180,83,9,0.95),rgba(120,53,15,0.95));border:3px solid rgba(251,191,36,0.9);color:white;font-size:28px;cursor:pointer;box-shadow:0 12px 40px rgba(0,0,0,0.8),0 0 20px rgba(245,158,11,0.4);display:flex;align-items:center;justify-content:center;"><span id="volume-icon">🔊</span></button>`;
  document.body.appendChild(volDiv);
  volDiv.querySelector('#volume-btn')?.addEventListener('click', () => {
    try { (soundEngine as any).playPing?.(); } catch {}
    bgmVolume = bgmVolume >= 0.8 ? 0 : bgmVolume + 0.2;
    try {
      (soundEngine as any).setBGMVolume?.(bgmVolume);
      (soundEngine as any).bgmVolume = bgmVolume;
    } catch {}
    try { localStorage.setItem('phoe-bgm-volume', bgmVolume.toString()); } catch {}
    soundEngine.muted = bgmVolume === 0;
    audio.muted = bgmVolume === 0;
    saveSettings();
    updateVolumeUI();
    try {
      if (bgmVolume > 0) {
        if (!(soundEngine as any).bgmPlaying) {
          soundEngine.startBGM?.();
        }
      } else {
        soundEngine.stopBGM?.();
      }
    } catch {}
  });
  updateVolumeUI();
}

// Start BGM on first interaction
let bgmStarted = false;
function startBGMOnInteraction() {
  if (bgmStarted) return;
  bgmStarted = true;
  try {
    soundEngine.init?.();
    try { (soundEngine as any).setBGMVolume?.(bgmVolume); (soundEngine as any).bgmVolume = bgmVolume; } catch {}
    if (!soundEngine.muted && bgmVolume > 0) {
      soundEngine.startBGM?.();
    }
  } catch {}
  document.removeEventListener('click', startBGMOnInteraction);
  document.removeEventListener('keydown', startBGMOnInteraction);
}
document.addEventListener('click', startBGMOnInteraction);
document.addEventListener('keydown', startBGMOnInteraction);

createVolumeControl();
function focusGame(scene: Phaser.Scene) { scene.game.canvas.tabIndex = 0; scene.game.canvas.focus({ preventScroll: true }); }
let liveSession: Session | null = null, currentMode: Mode = 'CAMPAIGN';

function enter(scene: Phaser.Scene, preset: Preset, mode: Mode) {
  if (!store.campaign.bridgeCompleted || (preset !== 'A' && !store.campaign.chapter2Completed)) return;
  scene.scene.start('CHAPTER_2', { preset, mode });
}
function choices(scene: Phaser.Scene) {
  bind('replay', () => enter(scene, 'A', 'REPLAY'));
  bind('practice-b', () => enter(scene, 'B', 'PRACTICE'));
  bind('practice-c', () => enter(scene, 'C', 'PRACTICE'));
  bind('menu', () => scene.scene.start('MENU'));
  bind('chapter-three', () => { if(store.campaign.chapter2Completed)scene.scene.start('CHAPTER_3'); });
  bind('arena-replay', () => { if(store.campaign.chapter3Completed)scene.scene.start('CHAPTER_4'); });
}
function replayButtons() {
  return button('replay', 'ပြန်စမ်းမယ်', true) + (store.campaign.chapter2Completed ? button('chapter-three','အခန်း ၃ ဆီ') + button('practice-b', 'လေ့ကျင့်ခန်း B') + button('practice-c', 'လေ့ကျင့်ခန်း C') : '') + button('menu', 'ပင်မစာမျက်နှာ');
}

class BootScene extends Phaser.Scene {
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
  }
  create() { this.scene.start('PreloadScene'); }
}
class SharedPreloadScene extends PreloadScene {
  create(){this.createAllGameAssets();this.scene.start('MENU');}
}
class MenuScene extends Phaser.Scene {
  constructor(){super('MENU');}
  create(){
    liveSession=null;audio.attach(this);
    try { 
      soundEngine.init?.(); 
      try { (soundEngine as any).setBGMVolume?.(bgmVolume); (soundEngine as any).bgmVolume = bgmVolume; } catch {}
      if (!soundEngine.muted && bgmVolume > 0) soundEngine.startBGM?.(); 
    } catch {}
    new WorldView(this).render(createAttempt('A','menu'));
import FinalChapterScene, { CampaignEndingScene } from './scenes/FinalChapterScene';
import { soundEngine } from './utils/SoundEngine.js';
 (Add Fantasy UI main menu, audio system, and volume control)
  }
}
class BridgeLinkScene extends Phaser.Scene {
  private elapsed=0;private replay=false;private suspended=false;
  constructor(){super('BRIDGE_EXIT_LINK');}
  init(data:{replay?:boolean}){this.elapsed=0;this.replay=Boolean(data.replay);this.suspended=false;}
  create(){
    this.add.rectangle(640,360,1280,720,0x182d23);ui.innerHTML=`<section class="result-panel"><span class="eyebrow">အခန်း ၁ ပြီးပါပြီ / PUZZLE → ACTION</span><h1>မြေအောက်စက်ခန်းဆီ။</h1><p class="intro">“ဒီအောက်လမ်းက ရွှေမြို့တော်ကို ရောက်တယ်ကွ!”<br>ဦးကြီးရဲ့အသံနောက်လိုက်ပြီး ဆင်းလာတော့ ကျောက်တုံးချစက်တစ်လုံး တွေ့ရတယ်။</p><p class="result-note">အခန်း ၁ တွင် ငွေဆုမပါ။ ရှိပြီးသား ရွှေ ${store.campaign.walletCoins} နဲ့ သေဆုံးမှု ${store.campaign.deathCount} ကို ဆက်သယ်ထားတယ်။</p><p id="bridge-save" class="warning" ${store.unsaved?'':'hidden'}>Save မသိမ်းရသေးပါ။ ယာယီဆက်ပါက reload တွင် progress ပျောက်နိုင်သည်။</p>${buttons(button('continue',store.unsaved?'ယာယီအတိုင်း ဆက်မယ်':'အခန်း ၂ ဆက်မယ်',true)+(store.unsaved?button('retry-save','ထပ်သိမ်းမယ်'):'')+button('menu','ပင်မစာမျက်နှာ'))}</section>`;
    bind('continue',()=>this.go());bind('menu',()=>this.scene.start('MENU'));bind('retry-save',()=>{if(store.save())this.scene.restart({replay:this.replay});});
    const suspend=()=>{this.suspended=true;};window.addEventListener('blur',suspend);document.addEventListener('visibilitychange',suspend);this.events.once('shutdown',()=>{window.removeEventListener('blur',suspend);document.removeEventListener('visibilitychange',suspend);});
  }
  private go(){enter(this,'A',this.replay||store.campaign.chapter2Completed?'REPLAY':'CAMPAIGN');}
  update(_t:number,ms:number){if(document.hidden||!document.hasFocus())return;if(this.suspended){this.suspended=false;return;}if(!store.unsaved&&!this.replay){this.elapsed+=ms/1000;if(this.elapsed>=C.linkTime)this.go();}}
}


class ExitLinkScene extends Phaser.Scene {
  private elapsed = 0;
  private mode: Mode = 'CAMPAIGN';
  private result: ChapterResult | null = null;
  private pending = false;
  private suspended = false;
  private resumePending = false;
  constructor() { super('CH2_EXIT_LINK'); }
  init(data: { result?: ChapterResult; mode?: Mode;resumePending?:boolean }) { this.result = data.result ?? store.campaign.lastChapter2Result; this.mode = data.mode ?? 'REPLAY'; this.elapsed = 0; this.pending = false; this.resumePending=Boolean(data.resumePending); }
  create() {
    liveSession = null;
    if (this.textures.exists('background')) this.add.image(640,360,'background').setDisplaySize(1280,720).setTint(0x809a7a);
    this.add.rectangle(640,360,1280,720,0x14261d,.65);
    const g = this.add.graphics();
    for (let i = 0; i < 7; i++) g.fillStyle(0x5a6c53).fillRect(820 + i * 60, 380 + i * 35, 120, 350);
    if(this.resumePending)this.showPending();else this.showResult();
    this.suspended = document.hidden || !document.hasFocus();
    const suspend = () => { this.suspended = true; };
    window.addEventListener('blur',suspend); document.addEventListener('visibilitychange',suspend);
    this.events.once('shutdown',()=>{window.removeEventListener('blur',suspend);document.removeEventListener('visibilitychange',suspend);});
  }
  private showResult() {
    const r = this.result;
    ui.innerHTML = `<section class="result-panel"><span class="eyebrow">${this.mode === 'PRACTICE' ? 'လေ့ကျင့်ခန်း ပြီးပါပြီ' : 'ဒုတိယအခန်း ပြီးပါပြီ'}</span><h1>ဒီတစ်ခါ လွတ်ပြီ။</h1><p class="result-quip">“ရပြီထင်မနေနဲ့ဦး… အောက်မှာတွေ့မယ်!”</p><div class="result-stats"><div><span>ယူထွက်လာတဲ့ရွှေ</span><b>${r?.collectedCoins ?? 0}<small>/15</small></b></div><div><span>အသစ်သိမ်းရတဲ့ရွှေ</span><b>+${r?.creditedCoins ?? 0}</b></div><div><span>အောင်မြင်ချိန်</span><b>${r?.activeSeconds.toFixed(2) ?? '—'}<small>s</small></b></div><div><span>ဒီအခန်း သေဆုံးမှု</span><b>${r?.sessionDeaths ?? 0}</b></div></div><p class="result-note">${store.unsaved ? 'ယာယီ session သာဖြစ်ပြီး save မသိမ်းရသေးပါ။' : 'ရလာဒ်နှင့် စုထားသောရွှေကို သိမ်းထားပါပြီ။'} ${this.mode === 'PRACTICE' ? 'လေ့ကျင့်ခန်းမှာ ငွေထပ်မပေးပါ။' : 'ပြန်ဆော့လျှင် အရင်ထက်ပိုကောက်နိုင်သည့်ငွေပဲ ထပ်ရမယ်။'}</p>${buttons(this.mode === 'CAMPAIGN' ? button('continue','ဆက်မယ်',true) : replayButtons())}</section>`;
    bind('continue', () => this.showPending()); choices(this);
  }
  private showPending() {
    this.pending = true;
    if (store.unsaved) {
      ui.innerHTML=`<section class="result-panel"><h1>ချိန်ခွင်ခန်းဆီ။</h1><p class="warning">Save မသိမ်းရသေးပါ။ Reload လုပ်ပါက ယာယီ progress ပျောက်နိုင်သည်။</p>${buttons(button('retry-save','ထပ်သိမ်းမယ်',true)+button('temporary-scale','ယာယီအတိုင်း အခန်း ၃ ဆက်မယ်')+button('menu','ပင်မစာမျက်နှာ'))}</section>`;
      bind('retry-save',()=>{if(store.save())this.scene.start('CHAPTER_3');});bind('temporary-scale',()=>this.scene.start('CHAPTER_3'));bind('menu',()=>this.scene.start('MENU'));return;
    }
    this.scene.start('CHAPTER_3');
  }
  update(_t: number, ms: number) {
    if (document.hidden || !document.hasFocus()) return;
    if (this.suspended) { this.suspended=false; return; }
    if (this.mode === 'CAMPAIGN' && !this.pending) { this.elapsed += ms / 1000; if (this.elapsed >= C.linkTime) this.showPending(); }
  }
}

class ChapterFourPendingScene extends Phaser.Scene {
  constructor(){super('CHAPTER_4_PENDING');}
  create(){
    liveSession=null;
    // Compatibility endpoint for earlier saves and the existing Chapter3 link.
    this.scene.start(store.campaign.chapter3Completed?'CHAPTER_4':'MENU');
  }
}

class ChapterFivePendingScene extends Phaser.Scene {
  constructor(){super('CHAPTER_5_PENDING');}
  create(){
    liveSession=null;if(!store.campaign.chapter4Completed){this.scene.start('MENU');return;}
    this.scene.start('CHAPTER_5');
  }
}

const game = new Phaser.Game({ type: Phaser.AUTO, parent: 'game', width: C.width, height: C.height, backgroundColor: '#22382c',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics:{default:'arcade',arcade:{gravity:{x:0,y:0},fixedStep:true,fps:60}},
  render: { antialias: true, pixelArt: false }, scene: [BootScene,SharedPreloadScene,MenuScene,BridgeChapterScene,BridgeLinkScene,Chapter2Scene,ExitLinkScene,ScaleChapterScene,ChapterFourPendingScene,ArenaChapterScene,ChapterFivePendingScene,FinalChapterScene,CampaignEndingScene] });

if (import.meta.env.DEV) (window as any).__PHOE_GAME__ = game;
declare global { interface Window { __PHOE_TEST__?: { snapshot(): unknown } } }
if (import.meta.env.DEV) {
  window.__PHOE_TEST__ = {
    snapshot: () => {
      const ch2 = game.scene.isActive('CHAPTER_2') ? (game.scene.getScene('CHAPTER_2') as any) : null;
      const ch2Snap = ch2?.snapshot?.();
      return {
        mode: ch2Snap ? ch2Snap.mode : currentMode,
        attempt: ch2Snap ? ch2Snap.attempt : (liveSession ? structuredClone(liveSession.attempt) : null),
        generation: ch2Snap ? ch2Snap.generation : liveSession?.generation,
        paused: ch2Snap ? ch2Snap.paused : liveSession?.paused,
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
}
