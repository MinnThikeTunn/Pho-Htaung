import Phaser from 'phaser';
import { A4, ARENA_ART, ARENA_LINES } from '../content/chapter4';
import { C } from '../content/chapter1';
import type { ArenaEvent } from '../domain/arena';
import { ArenaSession } from '../services/ArenaSession';
import { store } from '../services/adventure';
import { SAVE_KEY } from '../services/CampaignStore';
import { ArenaView } from '../view/ArenaView';

const ui = () => document.querySelector<HTMLDivElement>('#interface')!;
const button = (id: string, text: string, primary = false) => `<button type="button" id="${id}" class="${primary ? 'primary' : 'secondary'}">${text}</button>`;
export default class ArenaChapterScene extends Phaser.Scene {
  private session!: ArenaSession; private view!: ArenaView;
  private held = new Set<string>(); private edges = { jump: false, punch: false, dodge: false };
  private finished = false; private failureShown = false; private lastMessage = '';
  constructor() { super('CHAPTER_4'); }
  preload() {
    this.load.image(ARENA_ART.background.key, ARENA_ART.background.path);
    this.load.image(ARENA_ART.apes.key, ARENA_ART.apes.path);
  }
  snapshot() { return { attempt: structuredClone(this.session.attempt), paused: this.session.paused, generation: this.session.generation }; }
  init(data: { equipment?: { slingshot: boolean } }) {
    if (!store.campaign.chapter3Completed) throw Error('Chapter 4 is locked');
    // Owner explicitly assumes another developer supplies the previous-chapter pickup.
    // This entry adapter accepts its payload; it never invents a Chapter3 pickup or writes inventory.
    this.session = new ArenaSession(() => crypto.randomUUID(), data.equipment?.slingshot ?? true);
    this.finished = false; this.failureShown = false; this.lastMessage = ''; this.held.clear(); this.edges = { jump: false, punch: false, dodge: false };
    store.startArena();
  }
  private bind(id: string, fn: () => void) { ui().querySelector(`#${id}`)?.addEventListener('click', fn); }
  private focusGame() { this.game.canvas.tabIndex = 0; this.game.canvas.focus({ preventScroll: true }); }
  private clear() { this.held.clear(); this.edges = { jump: false, punch: false, dodge: false }; this.session.clearInput(); }
  private speak(text: string) { this.lastMessage = text; const el = ui().querySelector('#arena-message'); if (el) el.textContent = text; }
  create() {
    this.view = new ArenaView(this);
    ui().innerHTML = `<div class="hud"><div class="stage-title"><span class="eyebrow">အခန်း ၄ / ACTION</span><strong>လူဝံအစောင့်နှစ်ကောင်</strong></div><div class="arena-player-health"><span>ဖိုးထောင် <b id="arena-hp-label">100 / 100</b></span><progress id="arena-hp" max="100" value="100" aria-label="ဖိုးထောင် သွေးတန်း"></progress></div><div class="ledger"><div><span>တံခါးမပိတ်မီ</span><b id="arena-time">75<small>s</small></b></div><div><span>ကျောက်ခဲ</span><b id="arena-ammo">12</b></div></div><button id="arena-pause" class="icon-button" aria-label="Pause">Ⅱ</button></div>
      <div class="arena-enemies">${['brown', 'silver'].map((id, i) => `<div><span>${i ? 'မီးခိုးလူဝံ · ကျောက်ခဲပစ်' : 'အညိုလူဝံ · လက်သီးထိုး'} <b id="${id}-hp-label">150 / 150</b></span><progress id="${id}-hp" max="150" value="150" aria-label="${id} သွေးတန်း"></progress><small id="${id}-state"></small></div>`).join('')}</div>
      <div class="arena-speech" id="arena-message" aria-live="polite"></div><div class="arena-charge"><span id="arena-charge-label">K ဖိပြီး ဆွဲ → လွှတ်ပြီးပစ်</span><progress id="arena-charge" max="1" value="0" aria-label="လောက်လေးခွ ဆွဲအား"></progress><small id="arena-dodge"></small></div>
      <div class="arena-refill left">ကျောက်ပုံ · ခဏရပ်၍ပြန်ဖြည့်</div><div class="arena-refill right">ကျောက်ပုံ · ခဏရပ်၍ပြန်ဖြည့်</div>
      <div class="arena-controls"><kbd>A</kbd><kbd>D</kbd> ရွေ့ <kbd>SPACE</kbd> ခုန် <kbd>J</kbd> လက်သီး <kbd>K</kbd> ဖိဆွဲ / လွှတ်ပစ် <kbd>L</kbd> ရှောင် <kbd>R</kbd> ဖိပြန်စ <kbd>ESC</kbd> နား</div>
      <div id="arena-unsaved" class="unsaved-status" hidden>ယာယီ session · save မသိမ်းရသေးပါ</div><div id="arena-modal" class="modal" hidden></div>`;
    this.bind('arena-pause', () => this.pause(!this.session.paused)); this.speak(ARENA_LINES.entry);
    const onDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      const key = event.key.toLowerCase();
      if (key === 'escape' && !event.repeat && !this.finished) { event.preventDefault(); if (!this.failureShown) this.pause(!this.session.paused); return; }
      if (this.finished || this.session.paused || !['a','d','arrowleft','arrowright',' ','j','k','l','r'].includes(key)) return;
      event.preventDefault();
      if (event.repeat) return;
      if (!event.repeat) { if (key === ' ') this.edges.jump = true; if (key === 'j') this.edges.punch = true; if (key === 'l') this.edges.dodge = true; }
      this.held.add(key);
    };
    const onUp = (event: KeyboardEvent) => this.held.delete(event.key.toLowerCase());
    const blur = () => { if (!this.finished && !this.failureShown) this.pause(true); };
    const visibility = () => { if (document.hidden) blur(); };
    const storage = (event: StorageEvent) => {
      if (event.key !== SAVE_KEY) return;
      store.conflict = true; this.pause(true);
      const el = ui().querySelector<HTMLDivElement>('#arena-modal');
      if (el) { el.hidden = false; el.innerHTML = `<section class="dialog"><h2>အခြား tab မှ save ပြောင်းသွားသည်</h2>${button('arena-reload','Reload',true)}</section>`; this.bind('arena-reload',()=>location.reload()); }
    };
    window.addEventListener('keydown', onDown); window.addEventListener('keyup', onUp); window.addEventListener('blur', blur);
    document.addEventListener('visibilitychange', visibility); window.addEventListener('storage', storage);
    this.events.once('shutdown', () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); window.removeEventListener('blur', blur); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('storage', storage); this.clear(); });
    this.sync(); this.focusGame();
    if (!this.session.hasSling) {
      this.pause(true); const el = ui().querySelector<HTMLDivElement>('#arena-modal')!;
      el.innerHTML = `<section class="dialog"><h2>လောက်လေးခွ မပါသေးပါ</h2><p>အခန်း ၃ ကို ပြန်သွားယူပါ။ လက်သီးသက်သက်နဲ့ သတ်မှတ်ချိန်အတွင်း အနိုင်မရနိုင်ပါ။</p><div class="actions">${button('arena-back','အခန်း ၃ ဆီ',true)}${button('arena-fists','လက်သီးနဲ့ လေ့ကျင့်မယ်')}</div></section>`;
      this.bind('arena-back',()=>this.scene.start('CHAPTER_3')); this.bind('arena-fists',()=>this.pause(false));
    }
  }
  private pause(value: boolean) {
    if (store.conflict && !value) return;
    this.session.setPause(value); this.clear(); const el = ui().querySelector<HTMLDivElement>('#arena-modal'); if (!el) return;
    el.hidden = !value;
    if (!value) { el.innerHTML = ''; this.focusGame(); return; }
    el.innerHTML = `<section class="dialog"><h2>ခဏနားမယ်</h2><p>K ဆွဲနေချိန် ရွေ့နှုန်းနှေးသည်။ L နဲ့ရှောင်ပြီး ပစ်ခွင့်ယူပါ။ ကျောက်ခဲကုန်လျှင် ဘေးကျောက်ပုံနား ခဏရပ်ပြီး ဖြည့်ပါ။</p><div class="actions">${button('arena-resume','ဆက်ကစားမယ်',true)}${button('arena-menu','ပင်မစာမျက်နှာ')}</div></section>`;
    this.bind('arena-resume',()=>this.pause(false)); this.bind('arena-menu',()=>this.scene.start('MENU'));
  }
  private restart() {
    if (store.conflict) return;
    this.session.restart(); this.session.setPause(false); this.failureShown = false; this.clear();
    const el = ui().querySelector<HTMLDivElement>('#arena-modal'); if (el) { el.hidden = true; el.innerHTML = ''; }
    this.speak(ARENA_LINES.entry); this.focusGame(); this.sync();
  }
  private event(kind: ArenaEvent) {
    if (kind === 'empty') this.speak(ARENA_LINES.empty);
    if (kind === 'refill') this.speak('ကျောက်ခဲ ပြန်ဖြည့်ပြီးပြီ။');
    if (kind === 'won') this.speak(ARENA_LINES.won);
    if (kind === 'failed') {
      if (this.session.attempt.failure === 'HEALTH') store.death(`arena:${this.session.attempt.id}`);
      this.failureShown = true; this.clear(); const el = ui().querySelector<HTMLDivElement>('#arena-modal')!; el.hidden = false;
      el.innerHTML = `<section class="dialog"><h2>${this.session.attempt.failure === 'TIME' ? 'တံခါးပိတ်သွားပြီ' : 'ဒီတစ်ခါ ရှုံးသွားပြီ'}</h2><p>${this.session.attempt.failure === 'TIME' ? ARENA_LINES.timeout : ARENA_LINES.health}</p><div class="actions">${button('arena-retry','ပြန်စမ်းမယ်',true)}${button('arena-menu','ပင်မစာမျက်နှာ')}</div></section>`;
      this.bind('arena-retry',()=>this.restart()); this.bind('arena-menu',()=>this.scene.start('MENU'));
    }
    if (kind === 'complete') { store.completeArena(this.session.attempt); this.finished = true; this.clear(); this.result(); }
  }
  private result() {
    const r = store.campaign.lastChapter4Result;
    ui().innerHTML = `<section class="result-panel"><span class="eyebrow">အခန်း ၄ ပြီးပါပြီ</span><h1>လူဝံနှစ်ကောင်ကို ကျော်လာပြီ။</h1><p class="intro">ရှေးဟောင်းမြို့တော်ရဲ့ အတွင်းတံခါးဘက် ဆက်သွားနိုင်ပြီ။</p><div class="result-stats"><div><span>ကျန်သွေး</span><b>${r?.remainingHealth ?? 0}<small>/100</small></b></div><div><span>တိုက်ပွဲချိန်</span><b>${r?.activeSeconds.toFixed(2) ?? '—'}<small>s</small></b></div><div><span>သိမ်းပြီးရွှေ</span><b>${store.campaign.walletCoins}</b></div></div><p class="result-note">အခန်း ၅ ကို မတည်ဆောက်ရသေးပါ။ ဂိမ်းတစ်ခုလုံး၏ ဇာတ်သိမ်းမဟုတ်ပါ။</p>${store.unsaved ? '<p class="warning">Save မသိမ်းရသေးပါ။ Reload လုပ်ပါက ယာယီ progress ပျောက်နိုင်သည်။</p>' : ''}<div class="actions">${button('arena-again','အခန်း ၄ ပြန်စမ်း',true)}${store.unsaved ? button('arena-save','ထပ်သိမ်းမယ်') : ''}${button('arena-menu','ပင်မစာမျက်နှာ')}</div></section>`;
    this.bind('arena-again',()=>this.scene.restart()); this.bind('arena-menu',()=>this.scene.start('MENU')); this.bind('arena-save',()=>{ if(store.save())this.result(); });
  }
  private sync() {
    if (this.finished) return;
    const a = this.session.attempt;
    const text = (id: string, value: string) => { const el = ui().querySelector(`#${id}`); if (el && el.textContent !== value) el.textContent = value; };
    (ui().querySelector('#arena-hp') as HTMLProgressElement).value = a.hp; text('arena-hp-label',`${a.hp} / ${A4.health}`);
    for (const e of a.apes) {
      (ui().querySelector(`#${e.id}-hp`) as HTMLProgressElement).value = e.hp; text(`${e.id}-hp-label`,`${e.hp} / ${A4.apeHealth}`);
      text(`${e.id}-state`, e.phase === 'DOWN' ? 'လဲပြီ' : e.phase === 'WINDUP' ? e.type === 'MELEE' ? 'လက်မြှောက်ပြီ — ရှောင်!' : 'ကျောက်ပစ်တော့မည် — ရှောင်!' : e.phase === 'RECOVER' ? 'ပစ်ခွင့်ရပြီ' : '');
    }
    text('arena-time', a.combatWon ? 'လွတ်ပြီ' : `${Math.max(0, Math.ceil(A4.timeLimit - a.combatSeconds))} s`);
    text('arena-ammo',String(a.ammo)); (ui().querySelector('#arena-charge') as HTMLProgressElement).value = a.charge / A4.chargeTime;
    text('arena-charge-label', a.charge >= A4.chargeTime ? 'အားပြည့်ပြီ — K လွှတ်ပြီးပစ်!' : a.charge > 0 ? `${a.aimFacing === 1 ? '→' : '←'} ဆွဲနေသည်` : 'K ဖိပြီး ဆွဲ → လွှတ်ပြီးပစ်');
    text('arena-dodge', a.dodgeCooldown > 0 ? `L ပြန်အဆင်သင့် ${a.dodgeCooldown.toFixed(1)} s` : 'L · ရှောင်နိုင်ပြီ');
    ui().querySelector<HTMLElement>('#arena-unsaved')!.hidden = !store.unsaved; this.view.render(a);
  }
  update(_time: number, ms: number) {
    if (this.finished) return;
    const generation = this.session.generation, stepped = this.session.accumulator + ms / 1000 >= C.dt;
    const events = this.session.tick(ms / 1000, { left: this.held.has('a') || this.held.has('arrowleft'), right: this.held.has('d') || this.held.has('arrowright'), sling: this.held.has('k'), ...this.edges }, this.held.has('r'));
    if (stepped) this.edges = { jump: false, punch: false, dodge: false };
    if (generation !== this.session.generation) { this.failureShown = false; this.clear(); const el=ui().querySelector<HTMLDivElement>('#arena-modal');if(el){el.hidden=true;el.innerHTML='';}this.speak(ARENA_LINES.entry); }
    for (const event of events) this.event(event); this.sync();
  }
}
