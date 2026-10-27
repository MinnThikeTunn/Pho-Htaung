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

const uid = () => crypto.randomUUID();

const audio = new AudioController();
const ui = document.querySelector<HTMLDivElement>('#interface')!;
let shade = true, showHints = true, debug = false;
try { const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}'); audio.muted = Boolean(s.muted); shade = s.shake !== false; showHints = s.hints !== false; } catch { /* Readable defaults when settings are unavailable. */ }
function saveSettings() { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify({ muted: audio.muted, shake: shade, hints: showHints })); } catch { /* Campaign warnings remain independent. */ } }
document.body.insertAdjacentHTML('afterbegin', `<header class="page-header"><a class="wordmark" href="/" aria-label="ဖိုးထောင် home"><span class="mark">ဖ</span><span>ဖိုးထောင်<small>THE GOLDEN CITY</small></span></a><span class="build-label"><i></i> TWO CHAPTER ADVENTURE</span></header>`);
document.body.insertAdjacentHTML('beforeend', `<footer class="page-footer"><span>ကိုယ့်ကိုပစ်တဲ့တုံးနဲ့ ကိုယ့်လမ်းကိုဖွင့်။</span><span>DESKTOP / KEYBOARD <b>·</b> မူကြမ်းပုံနှင့်အသံများ</span></footer>`);
const buttons = (html: string) => `<div class="actions">${html}</div>`;
const button = (id: string, text: string, primary = false) => `<button type="button" id="${id}" class="${primary ? 'primary' : 'secondary'}">${text}</button>`;
function bind(id: string, fn: () => void) { ui.querySelector<HTMLButtonElement>(`#${id}`)?.addEventListener('click', fn); }
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
}
function replayButtons() {
  return button('replay', 'ပြန်စမ်းမယ်', true) + (store.campaign.chapter2Completed ? button('practice-b', 'လေ့ကျင့်ခန်း B') + button('practice-c', 'လေ့ကျင့်ခန်း C') : '') + button('menu', 'ပင်မစာမျက်နှာ');
}

class BootScene extends Phaser.Scene {
  constructor() { super('BOOT'); }
  preload() {
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
    new WorldView(this).render(createAttempt('A','menu'));
    const c=store.campaign;
    const startLabel = c.chapter2Completed ? 'ဆက်ကစားမည် / CONTINUE' : c.bridgeCompleted ? 'ဆက်ကစားမည် / CONTINUE' : 'စတင်မည် / NEW GAME';
    ui.innerHTML=`<div class="menu-scrim"></div><div class="menu-light-rays"></div><div class="menu-particles"></div><div class="menu-vignette"></div><section class="title-panel"><span class="eyebrow">ပုဂံရွှေမြို့တော် စွန့်စားခန်း</span><h1 id="game-title">မောင်ဖိုးထောင်</h1><p class="chapter-name">တံတားပဟေဠိ <span>•</span> ကျောက်တုံးချစက်</p><p class="intro">အကြွေးဆပ်ဖို့ ရွှေမြို့တော်ကို ရှာဖွေရာမှ၊ ဦးကြီးနောက်လိုက်ပြီး မမြင်မထားတဲ့ တွင်းနက်ထဲ ဆင်းသက်လာခဲ့ရသည်။<br>မိုက်မဲတဲ့ လမ်းကြောင်းတစ်လျှောက် ဘာတွေ စောင့်ကြိုနေမလဲ။</p>${buttons(button('start',startLabel,true)+(c.bridgeCompleted?button('bridge-replay','အခန်း ၁ ပြန်စမ်း'):'')+(c.chapter2Completed?button('action-replay','အခန်း ၂ ပြန်စမ်း'):''))}<div class="key-guide"><span><kbd>A</kbd><kbd>D</kbd>ရွေ့လျား</span><span><kbd>SPACE</kbd>ခုန်</span><span>အခန်း ၁ · ခလုတ်နှိပ်ဖြေရှင်း / အခန်း ၂ · <kbd>E</kbd>ဆွဲဆောင်</span></div><small class="prototype-note">တူညီသော ဇာတ်ကောင်အယူအဆ • လှုပ်ရှားမှုများကို ဆက်လက်ချောမွေ့စေရန် လုပ်ဆောင်လျက်ရှိပါသည်။<br>ပေါင်းစည်းထားသော save ကို သီးခြားစီစစ်ထားပြီး ယခင် save များကို အလိုအလျောက် ပေါင်းစည်းမည်မဟုတ်ပါ။</small>${c.chapter2Completed?buttons(button('practice-b','အခန်း ၂ လေ့ကျင့် B')+button('practice-c','အခန်း ၂ လေ့ကျင့် C')):''}${buttons(button('new-game','Campaign အသစ်စတင်မည်'))}<p class="warning" id="load-error" hidden></p></section><div class="corner-label">၀၁ / ၀၂ <span>PUZZLE → ACTION</span></div>`;
    const start=()=>{if(!c.bridgeCompleted)this.scene.start('Chapter1Scene');else if(c.resumeAt==='CHAPTER_3_PENDING'||c.resumeAt==='CH2_EXIT_LINK')this.scene.start('CH2_EXIT_LINK',{mode:'CAMPAIGN',resumePending:c.resumeAt==='CHAPTER_3_PENDING'});else enter(this,'A',c.chapter2Completed?'REPLAY':'CAMPAIGN');};
    bind('start',start);bind('bridge-replay',()=>this.scene.start('Chapter1Scene',{replay:true}));bind('action-replay',()=>enter(this,'A','REPLAY'));bind('practice-b',()=>enter(this,'B','PRACTICE'));bind('practice-c',()=>enter(this,'C','PRACTICE'));
    bind('settings-menu',()=>{try{const modal=document.querySelector('.modal') as HTMLElement|null;if(modal)modal.hidden=false;}catch{}});
    bind('new-game',()=>{if(confirm('လက်ရှိ combined campaign နှင့် သိမ်းဆည်းထားသော ရွှေများကို အသစ်စတင်မည်။ သေချာပါသလား?')){store.reset(uid());this.scene.restart();}});
    if(store.loadError){const warning=ui.querySelector<HTMLElement>('#load-error')!;warning.hidden=false;warning.textContent=store.loadError+' စတင်မည် ကိုနှိပ်လျှင် ယာယီသာ ကစားနိုင်ပါမည်။';}
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

class ActionChapterScene extends Phaser.Scene {
  private session!: Session;
  private mode: Mode = 'CAMPAIGN';
  private world!: WorldView;
  private held = new Set<string>();
  private jumpEdge = false;
  private tauntEdge = false;
  private result: ChapterResult | null = null;
  private fadeTime = 0;
  private speechLeft = 0;
  private hintLeft = 0;
  private waitingForSave = false;
  private voiceCooldown = 0;
  constructor() { super('CHAPTER_2'); }
  init(data: { preset?: Preset; mode?: Mode }) {
    if(!store.campaign.bridgeCompleted)throw new Error('Chapter 2 is locked');
    this.mode = data.mode ?? 'CAMPAIGN'; const preset = data.preset ?? 'A';
    if ((preset === 'A') !== (this.mode !== 'PRACTICE') || (preset !== 'A' && !store.campaign.chapter2Completed)) throw new Error('Invalid chapter entry');
    this.session = new Session(preset, uid); this.result = null; this.fadeTime = 0; this.waitingForSave = false;
    this.speechLeft = 0; this.hintLeft = 0; this.voiceCooldown = 0; this.clearKeys();
  }
  private clearKeys() { this.held.clear(); this.jumpEdge = false; this.tauntEdge = false; }
  private speak(text: string, duration: number, who = 'ဦးကြီး') {
    const speech = ui.querySelector<HTMLElement>('#speech'); if (!speech) return;
    speech.innerHTML = `<span>${who}</span><p></p>`; speech.querySelector('p')!.textContent = text;
    speech.classList.add('visible'); this.speechLeft = duration;
  }
  private hint(id: 'lock' | 'land' | 'shatter') {
    if (!showHints || !store.hint(id)) return;
    const el = ui.querySelector<HTMLElement>('#hint'); if (!el) return;
    el.textContent = DIALOGUE[`hint_${id}`]; el.classList.add('visible'); this.hintLeft = 2;
  }
  private setPause(value: boolean) {
    this.session.setPause(value); this.clearKeys();
    const panel = ui.querySelector<HTMLElement>('#pause-panel')!;
    if (value) {
      panel.innerHTML = `<section class="dialog"><span class="eyebrow">ခဏနားမယ်</span><h2>ရပ်ထားပါတယ်</h2>${buttons(button('resume','ဆက်ကစားမယ်',true)+button('menu','ပင်မစာမျက်နှာ'))}<div class="settings"><label><input id="mute-setting" type="checkbox" ${audio.muted?'checked':''}/> အသံပိတ်</label><label><input id="shake-setting" type="checkbox" ${shade?'checked':''}/> Screen shake</label><label><input id="hints-setting" type="checkbox" ${showHints?'checked':''}/> အကူအညီစာတန်း</label>${button('reset-hints','အကူအညီစာတန်း ပြန်ပြ')}</div></section>`;
      panel.hidden = false;
      bind('resume', () => { audio.unlock(); this.setPause(false); }); bind('menu', () => this.scene.start('MENU'));
      ui.querySelector<HTMLInputElement>('#mute-setting')!.onchange = e => { audio.muted = (e.target as HTMLInputElement).checked; saveSettings(); };
      ui.querySelector<HTMLInputElement>('#shake-setting')!.onchange = e => { shade = (e.target as HTMLInputElement).checked; saveSettings(); };
      ui.querySelector<HTMLInputElement>('#hints-setting')!.onchange = e => { showHints = (e.target as HTMLInputElement).checked; saveSettings(); };
      bind('reset-hints', () => { store.campaign.hintsSeen = []; store.campaign.revision++; store.save(); this.setPause(false); });
    } else { panel.hidden = true; panel.innerHTML = ''; focusGame(this); }
  }
  create() {
    try{const prefs=JSON.parse(localStorage.getItem(SETTINGS_KEY)??'{}');audio.muted=Boolean(prefs.muted);}catch{}
    liveSession = this.session; currentMode = this.mode; audio.attach(this); this.world = new WorldView(this);
    ui.innerHTML = `<div class="hud"><div class="stage-title"><span class="eyebrow">အခန်း ၂ / ${this.session.preset}</span><strong>ကျောက်တုံးချစက်</strong></div><div class="ledger"><div><span>စုထား</span><b id="coins">0<small>/15</small></b></div><div><span>သိမ်းပြီး</span><b id="wallet">${store.campaign.walletCoins}</b></div><div><span>သေဆုံး</span><b id="deaths">${store.campaign.deathCount}</b></div><div><span>ကစားချိန်</span><b id="time">0.00</b></div></div><button id="pause" class="icon-button" aria-label="Pause">Ⅱ</button></div><div id="speech" class="speech" aria-live="polite"></div><div id="hint" class="hint" aria-live="polite"></div><div class="game-bottom"><span id="machine" class="machine-status"><i></i> စောင့်နေသည်</span><span class="small-controls"><kbd>A</kbd><kbd>D</kbd> ရွေ့ <kbd>SPACE</kbd> ခုန် <kbd>E</kbd> ဆွ <kbd>R</kbd> ဖိထားပြီးပြန်စ</span></div><div id="pause-panel" class="modal" hidden></div><div id="save-panel" class="modal" hidden></div><div id="death-vignette" class="death-vignette"></div>`;
    bind('pause', () => this.setPause(!this.session.paused));
    ui.insertAdjacentHTML('beforeend','<div id="reset-fade" class="reset-fade"></div>');
    this.speak(DIALOGUE.entry, 2.5);
    const onDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === 'escape') { event.preventDefault(); if(!event.repeat) this.setPause(!this.session.paused); return; }
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || this.session.paused) return;
      if (!['a','d','arrowleft','arrowright',' ','e','r','f3'].includes(key)) return;
      event.preventDefault(); audio.unlock();
      if (!this.held.has(key) && !event.repeat) {
        if (key === ' ') this.jumpEdge = true; if (key === 'e') this.tauntEdge = true; if (key === 'f3') debug = !debug;
      }
      this.held.add(key);
    };
    const onUp = (event: KeyboardEvent) => { this.held.delete(event.key.toLowerCase()); };
    const onBlur = () => this.setPause(true);
    const onVisibility = () => { if (document.hidden) this.setPause(true); };
    const onStorage = (event: StorageEvent) => {
      if (event.key === SAVE_KEY) { store.conflict = true; this.setPause(true); const panel = ui.querySelector('#pause-panel .dialog'); if (panel) { panel.innerHTML = `<h2>အခြား tab မှ save ပြောင်းသွားသည်</h2><p>ဒီ tab ကနေ ထပ်မသိမ်းခင် reload လုပ်ပါ။</p>${button('reload','Reload',true)}`; bind('reload', () => location.reload()); } }
    };
    window.addEventListener('keydown', onDown); window.addEventListener('keyup', onUp); window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility); window.addEventListener('storage', onStorage);
    this.events.once('shutdown', () => {
      window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility); window.removeEventListener('storage', onStorage); this.clearKeys(); liveSession = null;
    });
    focusGame(this);
  }
  private savePanel() {
    this.waitingForSave = true; this.clearKeys();
    const el = ui.querySelector<HTMLElement>('#save-panel')!; el.hidden = false;
    el.innerHTML = `<section class="dialog"><span class="eyebrow">မသိမ်းရသေးပါ</span><h2>Browser save မရပါ</h2><p>ယခု session မှာ ရလာဒ်ရှိနေသေးတယ်။ Reload လုပ်ရင် ပျောက်နိုင်တယ်။</p>${buttons(button('retry-save','ထပ်သိမ်းမယ်',true)+button('temporary-continue','ယာယီအတိုင်း ဆက်မယ်'))}</section>`;
    bind('retry-save', () => { if (store.save()) { this.waitingForSave = false; el.hidden = true; } });
    bind('temporary-continue', () => { this.waitingForSave = false; el.hidden = true; });
  }
  update(_time: number, milliseconds: number) {
    const dt = milliseconds / 1000, s = this.session;
    if (!s) return;
    if (!s.paused && !this.waitingForSave) {
      const before = s.generation;
      const input: Input = { left: this.held.has('a') || this.held.has('arrowleft'), right: this.held.has('d') || this.held.has('arrowright'), jump: this.jumpEdge, taunt: this.tauntEdge };
      const willStep = s.accumulator + dt + 1e-9 >= C.dt;
      const events = s.tick(dt, input, this.held.has('r'));
      if (willStep) { this.jumpEdge = false; this.tauntEdge = false; }
      if (s.generation !== before) { this.clearKeys(); ui.querySelector('#death-vignette')?.classList.remove('visible'); }
      this.voiceCooldown = Math.max(0, this.voiceCooldown - dt);
      for (const event of events) {
        audio.play(event.kind);
        if (event.kind === 'lock') this.hint('lock');
        if (event.kind === 'land') this.hint('land');
        if (event.kind === 'death') { store.death(s.attempt.id); this.speak(DIALOGUE.death, .8); ui.querySelector('#death-vignette')?.classList.add('visible'); }
        if (event.kind === 'gate' || event.kind === 'shelf') this.speak(DIALOGUE[event.kind], 1.2);
        if (event.kind === 'plate' && event.value) this.speak(DIALOGUE.plate, 1.2);
        if (event.kind === 'taunt' && this.voiceCooldown <= 0) { this.speak(DIALOGUE.taunt, .8, 'ဖိုးထောင်'); this.voiceCooldown = 3; }
        if (event.kind === 'complete') { this.result = store.complete(s.attempt, this.mode, s.sessionDeaths); this.clearKeys(); if (store.unsaved) this.savePanel(); }
      }
      if (s.attempt.machine.state === 'LOCKED' && preview(s.attempt).surfaces[0]?.shatter) this.hint('shatter');
      this.speechLeft -= dt; this.hintLeft -= dt;
      if (this.speechLeft <= 0) ui.querySelector('#speech')?.classList.remove('visible');
      if (this.hintLeft <= 0) ui.querySelector('#hint')?.classList.remove('visible');
      if (s.attempt.status === 'COMPLETE' && this.result && !this.waitingForSave) {
        this.fadeTime += dt;
        if (this.fadeTime >= C.exitFade) { this.scene.start('CH2_EXIT_LINK', { result: this.result, mode: this.mode }); return; }
      }
    }
    this.world.render(s.attempt, s.paused ? 0 : dt, debug, shade);
    const a = s.attempt;
    const fade=ui.querySelector<HTMLElement>('#reset-fade');
    if(fade)fade.style.opacity=String(a.status==='DEAD'?Math.max(0,Math.min(1,(s.deathElapsed-C.deathFreeze)/C.resetFade)):a.status==='COMPLETE'?Math.min(1,this.fadeTime/C.exitFade):0);
    ui.querySelector('#coins')!.innerHTML = `${a.coins}<small>/15</small>`;
    ui.querySelector('#wallet')!.textContent = String(store.campaign.walletCoins);
    ui.querySelector('#deaths')!.textContent = String(store.campaign.deathCount);
    ui.querySelector('#time')!.textContent = a.elapsed.toFixed(2);
    const labels = { READY: 'E · ဆွလို့ရပြီ', TRACK: 'ပစ်မှတ်လိုက်နေသည်', LOCKED: 'ပစ်မှတ်ရပ်ပြီ — ရှောင်!', DROP: 'ကျောက်တုံးကျနေသည်', RECOVER: 'စက်ပြန်တင်နေသည်' };
    const indicator = ui.querySelector<HTMLElement>('#machine')!;
    indicator.innerHTML = `<i></i>${a.status === 'WAITING' ? 'ရွေ့လိုက်တာနဲ့ စမယ်' : labels[a.machine.state]}`;
    indicator.dataset.state = a.machine.state;
    let saveStatus = ui.querySelector<HTMLElement>('#save-status');
    if (store.unsaved && !saveStatus) { saveStatus = document.createElement('div'); saveStatus.id='save-status'; saveStatus.className='unsaved-status'; saveStatus.setAttribute('role','status'); ui.append(saveStatus); }
    if(saveStatus) { saveStatus.hidden=!store.unsaved; saveStatus.textContent='ယာယီ session · save မသိမ်းရသေးပါ'; }
  }
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
    if (this.pending && ui.querySelector('#pending-title')) return;
    this.pending = true;
    if (this.mode === 'CAMPAIGN'&&store.campaign.resumeAt!=='CHAPTER_3_PENDING') { store.campaign.resumeAt = 'CHAPTER_3_PENDING'; store.campaign.revision++; store.save(); }
    ui.innerHTML = `<section class="result-panel"><span class="eyebrow">TWO CHAPTER PROTOTYPE COMPLETE</span><h1 id="pending-title">နောက်အခန်းမှာ ဆုံမယ်။</h1><p class="intro">အခန်း ၃ ကို မတည်ဆောက်ရသေးပါ။<br>အခန်း ၁ နဲ့ ၂ ကို နည်းလမ်းအသစ်နဲ့ ပြန်စမ်းလို့ရတယ်။</p>${buttons(replayButtons())}<p class="prototype-note">ဂိမ်းတစ်ခုလုံးရဲ့ ဇာတ်သိမ်းမဟုတ်သေးပါ။</p></section>`; choices(this);
  }
  update(_t: number, ms: number) {
    if (document.hidden || !document.hasFocus()) return;
    if (this.suspended) { this.suspended=false; return; }
    if (this.mode === 'CAMPAIGN' && !this.pending) { this.elapsed += ms / 1000; if (this.elapsed >= C.linkTime) this.showPending(); }
  }
}

const game = new Phaser.Game({ type: Phaser.AUTO, parent: 'game', width: C.width, height: C.height, backgroundColor: '#22382c',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics:{default:'arcade',arcade:{gravity:{x:0,y:0},fixedStep:true,fps:60}},
  render: { antialias: true, pixelArt: false }, scene: [BootScene,SharedPreloadScene,MenuScene,BridgeChapterScene,BridgeLinkScene,ActionChapterScene,ExitLinkScene] });

if (import.meta.env.DEV) (window as any).__PHOE_GAME__ = game;
declare global { interface Window { __PHOE_TEST__?: { snapshot(): unknown } } }
if (import.meta.env.DEV) window.__PHOE_TEST__ = { snapshot: () => ({ mode: currentMode, attempt: liveSession ? structuredClone(liveSession.attempt) : null,
  generation: liveSession?.generation, paused: liveSession?.paused, campaign: structuredClone(store.campaign), activeScenes: game.scene.getScenes(true).map(s => s.scene.key) }) };
