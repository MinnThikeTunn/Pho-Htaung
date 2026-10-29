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
<<<<<<< HEAD
import FinalChapterScene, { CampaignEndingScene } from './scenes/FinalChapterScene';
=======
import { soundEngine } from './utils/SoundEngine.js';
>>>>>>> 76262a7 (Add Fantasy UI main menu, audio system, and volume control)

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
<<<<<<< HEAD
    const c=store.campaign;
    ui.innerHTML=`<div class="menu-scrim"></div><section class="title-panel adventure-menu"><span class="eyebrow">ပုဂံရွှေမြို့တော် စွန့်စားခန်း</span><h1 id="game-title">ဖိုးထောင်။</h1><p class="chapter-name">တံတား → ကျောက်တုံးချစက် → ချိန်ခွင်ခန်း</p><p class="intro">အကြွေးဆပ်ဖို့ ရွှေမြို့တော်ရှာရင်း ဦးကြီးနောက်လိုက်လာတယ်။<br>ဒီတစ်ခါ ရွှေရုပ်ပါ ယူထွက်နိုင်မလား။</p>${buttons(button('start',c.bridgeCompleted?'ဆက်ကစားမယ်':'စကစားမယ်',true)+(c.bridgeCompleted?button('bridge-replay','အခန်း ၁ ပြန်စမ်း'):'')+(c.chapter2Completed?button('action-replay','အခန်း ၂ ပြန်စမ်း'):'')+(c.chapter3Completed?button('scale-replay','အခန်း ၃ ပြန်စမ်း'):''))}<div class="key-guide"><span><kbd>A</kbd><kbd>D</kbd> ရွေ့</span><span><kbd>SPACE</kbd> ခုန်</span><span>အခန်း ၁ / ၃ · နှိပ်ပြီး ကောက် / သုံး</span></div><small class="prototype-note">တူညီသော character · ယာယီ scenery နှင့်အသံများ။<br>အခန်း ၄ တိုက်ခိုက်ရေးကို မတည်ဆောက်ရသေးပါ။</small>${c.chapter2Completed?buttons(button('practice-b','အခန်း ၂ လေ့ကျင့် B')+button('practice-c','အခန်း ၂ လေ့ကျင့် C')):''}${buttons(button('new-game','Campaign အသစ်စမယ်'))}<p class="warning" id="load-error" hidden></p></section><div class="corner-label">01 / 03 <span>PUZZLE → ACTION → PUZZLE</span></div>`;
    ui.querySelector('.chapter-name')!.textContent='တံတား → ကျောက်တုံးချစက် → ချိန်ခွင် → လူဝံအစောင့် → ဦးကြီး';
    ui.querySelector('.prototype-note')!.textContent='J လက်သီး / B အိတ်ဖွင့်ထုတ် / K လေးခွဆွဲပစ် / L ရှောင်။ အခန်း ၅ မှာ ဦးကြီးနဲ့ရင်ဆိုင်ပြီး ဇာတ်သိမ်းမယ်။';
    ui.querySelector('.corner-label')!.innerHTML='01 / 05 <span>PUZZLE → ACTION → FINAL BOSS</span>';
    if(c.chapter3Completed)ui.querySelector('.actions')!.insertAdjacentHTML('beforeend',button('arena-replay','အခန်း ၄ ပြန်စမ်း'));
    if(c.chapter4Completed)ui.querySelector('.actions')!.insertAdjacentHTML('beforeend',button('final-replay','အခန်း ၅ ပြန်စမ်း'));
    const start=()=>{if(!c.bridgeCompleted)this.scene.start('Chapter1Scene');else if(c.chapter5Completed)this.scene.start('CAMPAIGN_END');else if(c.chapter4Completed)this.scene.start('CHAPTER_5');else if(c.chapter3Completed)this.scene.start('CHAPTER_4');else if(c.resumeAt==='CH2_EXIT_LINK')this.scene.start('CH2_EXIT_LINK',{mode:'CAMPAIGN'});else if(c.chapter2Completed)this.scene.start('CHAPTER_3');else enter(this,'A','CAMPAIGN');};
    bind('start',start);bind('bridge-replay',()=>this.scene.start('Chapter1Scene',{replay:true}));bind('action-replay',()=>enter(this,'A','REPLAY'));bind('practice-b',()=>enter(this,'B','PRACTICE'));bind('practice-c',()=>enter(this,'C','PRACTICE'));
    bind('scale-replay',()=>this.scene.start('CHAPTER_3',{replay:true}));
    bind('arena-replay',()=>this.scene.start('CHAPTER_4'));
    bind('final-replay',()=>this.scene.start('CHAPTER_5'));
    bind('new-game',()=>{if(confirm('လက်ရှိ combined campaign နှင့် သိမ်းပြီးရွှေကို အသစ်စမယ်။ သေချာလား?')){store.reset(uid());this.scene.restart();}});
    if(store.loadError){const warning=ui.querySelector<HTMLElement>('#load-error')!;warning.hidden=false;warning.textContent=store.loadError+' Start ကိုနှိပ်လျှင် မသိမ်းဘဲ ယာယီစမ်းနိုင်သည်။';}
=======
    ui.innerHTML=`<style>
      .fantasy-menu{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;background:url('/assets/ui-fantasy.png') center/cover, radial-gradient(ellipse at 50% 40%,#2a241f 0%,#15100c 55%,#0c0a08 100%);background-blend-mode:overlay;z-index:1;}
      .fantasy-title{font-size:clamp(42px,8cqw,96px);color:#f8f3e7;text-shadow:0 20px 60px rgba(0,0,0,0.9),0 0 40px rgba(245,158,11,0.4);letter-spacing:12px;margin-bottom:40px;font-family:'Noto Sans Myanmar',serif;}
      .fantasy-buttons{display:flex;flex-direction:column;gap:16px;align-items:center;}
      .fantasy-btn{min-width:320px;padding:16px 40px;font-size:clamp(16px,2cqw,22px);background:linear-gradient(90deg,rgba(120,53,15,0.9),rgba(180,83,9,0.9));color:#fff7ed;border:2px solid rgba(251,191,36,0.8);border-radius:8px;font-weight:800;letter-spacing:6px;text-transform:uppercase;box-shadow:0 20px 60px rgba(0,0,0,0.7),0 0 30px rgba(245,158,11,0.3);transition:all .2s;cursor:pointer;text-align:center;}
      .fantasy-btn:hover{transform:scale(1.05);box-shadow:0 25px 70px rgba(245,158,11,0.4),0 0 40px rgba(251,191,36,0.5);}
      .fantasy-modal{position:fixed;inset:0;background:rgba(12,10,8,0.98);display:flex;align-items:center;justify-content:center;z-index:999999;overflow:hidden;pointer-events:auto;}
      .fantasy-modal-content{max-width:900px;width:95%;max-height:85vh;height:85vh;overflow-y:auto;overflow-x:hidden;background:linear-gradient(180deg,rgba(28,24,21,0.98),rgba(12,10,8,0.98));border:2px solid rgba(245,158,11,0.6);border-radius:12px;padding:40px 50px 60px 50px;box-shadow:0 60px 140px rgba(0,0,0,0.9);-webkit-overflow-scrolling:touch;touch-action:pan-y;scrollbar-width:none;-ms-overflow-style:none;overscroll-behavior:contain;pointer-events:auto;}
      .fantasy-modal-content::-webkit-scrollbar{display:none;width:0;height:0;}
      .fantasy-modal h2{color:#f8f3e7;font-size:32px;margin-bottom:24px;text-align:center;letter-spacing:8px;}
      .fantasy-modal h3{color:#fbbf24;margin:28px 0 12px;font-size:22px;}
      .fantasy-modal p{color:#d9ccb5;line-height:2.4;margin:10px 0;font-size:16px;}
      .fantasy-modal kbd{background:rgba(245,158,11,0.2);padding:4px 12px;border:1px solid rgba(245,158,11,0.5);border-radius:4px;margin:0 4px;}
      .fantasy-close{margin-top:40px;display:block;margin-left:auto;margin-right:auto;}
    </style>
    <div class="fantasy-menu">
      <div class="fantasy-title">ဖိုးထောင်</div>
      <div class="fantasy-buttons">
        <button class="fantasy-btn" id="play-btn">PLAY</button>
        <button class="fantasy-btn" id="restart-btn">RESTART</button>
        <button class="fantasy-btn" id="mechanic-btn">MECHANIC</button>
      </div>
    </div>
    <div class="fantasy-modal" id="mechanic-modal" style="display:none;" onclick="if(event.target.id==='mechanic-modal'){document.getElementById('mechanic-modal').style.display='none';}">
      <div class="fantasy-modal-content" id="mechanic-content" onclick="event.stopPropagation();">
        <h2>MECHANICS & CONTROLS</h2>
        <h3>Universal Movement</h3>
        <p><kbd>A</kbd> / <kbd>←</kbd> - Move Left</p>
        <p><kbd>D</kbd> / <kbd>→</kbd> - Move Right</p>
        <p><kbd>SPACE</kbd> - Jump</p>
        <h3>Chapter 1 - Bridge Puzzle</h3>
        <p>Click and interact with objects to solve puzzles. Follow the story and use your environment to progress.</p>
        <h3>Chapter 2 - Rock Crushing Machine</h3>
        <p><kbd>E</kbd> - Pull/Switch mechanism</p>
        <p><kbd>R</kbd> - Hold to reset/restart sequence</p>
        <p>Time the crushing machine correctly and dodge falling rocks. Collect coins while avoiding traps.</p>
        <h3>Chapter 3 - Scale Puzzle</h3>
        <p>Balance ancient scales by placing weights correctly. Solve each chamber using logic and observation.</p>
        <h3>Chapter 4 - Arena Combat</h3>
        <p><kbd>J</kbd> - Punch/Attack</p>
        <p><kbd>K</kbd> - Throw Boulder</p>
        <p><kbd>L</kbd> - Dodge/Roll</p>
        <p><kbd>B</kbd> - Open Bag/Inventory</p>
        <p>Defeat waves of enemies using combos, projectiles, and dodging mechanics.</p>
        <h3>General Controls</h3>
        <p><kbd>ESC</kbd> - Pause Menu/Settings</p>
        <p><kbd>F3</kbd> - Debug Mode (Developer)</p>
        <button class="fantasy-btn fantasy-close" id="close-mechanic">CLOSE</button>
      </div>
    </div>
    `;
    bind('play-btn',()=>{try{soundEngine.playPing?.();}catch{}const c=store.campaign;if(!c.bridgeCompleted)this.scene.start('Chapter1Scene');else if(c.chapter4Completed)this.scene.start('CHAPTER_5_PENDING');else if(c.chapter3Completed)this.scene.start('CHAPTER_4');else if(c.resumeAt==='CH2_EXIT_LINK')this.scene.start('CH2_EXIT_LINK',{mode:'CAMPAIGN'});else if(c.chapter2Completed)this.scene.start('CHAPTER_3');else enter(this,'A','CAMPAIGN');});
    bind('restart-btn',()=>{try{soundEngine.playPing?.();}catch{}if(confirm('Restart from Chapter 1? This will reset your campaign progress.')){store.reset(uid());this.scene.start('Chapter1Scene');}});
    bind('mechanic-btn',()=>{try{soundEngine.playPing?.();}catch{}const modal=document.getElementById('mechanic-modal'); if(modal) { modal.style.display='flex'; const content=document.getElementById('mechanic-content'); if(content) content.scrollTop=0; }});
    bind('close-mechanic',()=>{try{soundEngine.playPing?.();}catch{}const modal=document.getElementById('mechanic-modal'); if(modal) modal.style.display='none';});
>>>>>>> 76262a7 (Add Fantasy UI main menu, audio system, and volume control)
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
