import Phaser from 'phaser';
import { A4, ARENA_ART, ARENA_LINES } from '../content/chapter4';
import { C } from '../content/chapter1';
import { arenaHasSlingshot } from '../domain/arena';
import type { ArenaEvent, ArenaWeapon } from '../domain/arena';
import { ArenaSession } from '../services/ArenaSession';
import { store } from '../services/adventure';
import { SAVE_KEY } from '../services/CampaignStore';
import { ArenaView } from '../view/ArenaView';
import InventoryBar from '../ui/InventoryBar.js';
import { ensureBridgeTextures } from '../view/BridgeView';

const ui = () => document.querySelector<HTMLDivElement>('#interface')!;
const button = (id: string, text: string, primary = false) => `<button type="button" id="${id}" class="${primary ? 'primary' : 'secondary'}">${text}</button>`;
export default class ArenaChapterScene extends Phaser.Scene {
  private session!: ArenaSession; private view!: ArenaView;
  public inventoryBar!: InventoryBar;
  private held = new Set<string>(); private edges = { jump: false, punch: false, dodge: false };
  private finished = false; private failureShown = false; private messageUntil = 0;
  private bagOpen = false;
  constructor() { super('CHAPTER_4'); }
  preload() {
    this.load.image(ARENA_ART.background.key, ARENA_ART.background.path);
    this.load.image(ARENA_ART.apes.key, ARENA_ART.apes.path);
  }
  snapshot() { return { attempt: structuredClone(this.session.attempt), paused: this.session.paused, generation: this.session.generation }; }
  init(data: { equipment?: { slingshot: boolean } } = {}) {
    if (!store.campaign.chapter3Completed) throw Error('Chapter 4 is locked');
    // Previous-chapter pickup is another developer's responsibility. Absence is not a grant.
    this.session = new ArenaSession(() => crypto.randomUUID(), arenaHasSlingshot(store.campaign, data.equipment));
    this.bagOpen = false;
    this.finished = false; this.failureShown = false; this.messageUntil = 0; this.held.clear(); this.edges = { jump: false, punch: false, dodge: false };
    store.startArena();
  }
  private bind(id: string, fn: () => void) { ui().querySelector(`#${id}`)?.addEventListener('click', fn); }
  private focusGame() { this.game.canvas.tabIndex = 0; this.game.canvas.focus({ preventScroll: true }); }
  private clear() { this.held.clear(); this.edges = { jump: false, punch: false, dodge: false }; this.session.clearInput(); }
  private speak(text: string, seconds = 3.5) {
    this.messageUntil = this.session.attempt.elapsed + seconds;
    const el = ui().querySelector<HTMLElement>('#arena-message'); if (el) { el.textContent = text; el.hidden = false; }
  }
  create() {
    this.view = new ArenaView(this);
    ensureBridgeTextures(this);

    // Standardized Bottom-Left Hover Myanmar Traditional Bag (Lwe-Ait)
    this.inventoryBar = new InventoryBar(this, {
      getItems: () => {
        const a = this.session?.attempt;
        if (!a) return [];
        const items = [
          {
            key: 'FISTS',
            id: 'FISTS',
            name: 'လက်သီး (Bare Fists)',
            selected: a.weapon === 'FISTS',
            texture: 'ch1_vector_bamboo_icon'
          }
        ];
        if (a.hasSling) {
          items.push({
            key: 'SLING',
            id: 'SLING',
            name: 'လောက်လေးခွ (Slingshot)',
            selected: a.weapon === 'SLING',
            texture: 'ch1_vector_cog'
          });
        }
        return items;
      },
      onItemClick: (item: any) => {
        if (item.id === 'FISTS' || item.id === 'SLING') {
          const weapon = item.id as ArenaWeapon;
          if (this.session.equipWeapon(weapon)) {
            this.speak(weapon === 'SLING' ? 'လောက်လေးခွ ထုတ်ပြီးပြီ — K ဖိဆွဲ၊ လွှတ်ပစ်။' : 'လက်ချည်းပဲ — J နဲ့ချ၊ L နဲ့ရှောင်။');
            this.sync();
            this.focusGame();
          }
        }
      }
    });

    ui().innerHTML = `<div class="hud"><div class="stage-title"><span class="eyebrow">အခန်း ၄ / ACTION</span><strong>လူဝံအစောင့်နှစ်ကောင်</strong></div><div class="arena-player-health"><span>ဖိုးထောင် <b id="arena-hp-label">100 / 100</b></span><progress id="arena-hp" max="100" value="100" aria-label="ဖိုးထောင် သွေးတန်း"></progress></div><div class="ledger"><div><span>တံခါးမပိတ်မီ</span><b id="arena-time">75<small>s</small></b></div><div><span>ကျောက်ခဲ</span><b id="arena-ammo">12</b></div></div><button id="arena-pause" class="icon-button" aria-label="Pause">Ⅱ</button></div>
      <div class="arena-enemies">${['brown', 'silver'].map((id, i) => `<div><span>${i ? 'မီးခိုးလူဝံ · ကျောက်ခဲပစ်' : 'အညိုလူဝံ · လက်သီးထိုး'} <b id="${id}-hp-label">150 / 150</b></span><progress id="${id}-hp" max="150" value="150" aria-label="${id} သွေးတန်း"></progress><small id="${id}-state"></small></div>`).join('')}</div>
      <div class="arena-speech" id="arena-message" aria-live="polite"></div><div class="arena-charge"><span id="arena-charge-label">K ဖိပြီး ဆွဲ → လွှတ်ပြီးပစ်</span><progress id="arena-charge" max="1" value="0" aria-label="လောက်လေးခွ ဆွဲအား"></progress><small id="arena-dodge"></small><small id="arena-punch"></small></div>
      <div class="arena-refill left">ကျောက်ပုံ · ခဏရပ်၍ပြန်ဖြည့်</div><div class="arena-refill right">ကျောက်ပုံ · ခဏရပ်၍ပြန်ဖြည့်</div>
      <div class="arena-controls"><kbd>A</kbd><kbd>D</kbd> ရွေ့ <kbd>SPACE</kbd> ခုန် <kbd>J</kbd> လက်သီး <kbd>B</kbd> အိတ် <kbd>K</kbd> လေးခွထုတ်ပြီးမှ ဆွဲပစ် <kbd>L</kbd> ရှောင် <kbd>R</kbd> ဖိပြန်စ <kbd>ESC</kbd> နား</div>
      <div id="arena-unsaved" class="unsaved-status" hidden>ယာယီ session · save မသိမ်းရသေးပါ</div><div id="arena-modal" class="modal" hidden></div>`;
    const pauseButton = ui().querySelector('#arena-pause')!;
    pauseButton.insertAdjacentHTML('beforebegin', '<button type="button" id="arena-bag" class="icon-button" aria-label="အိတ်ဖွင့် (B)">အိတ်</button>');
    this.bind('arena-bag', () => this.openBag());
    this.bind('arena-pause', () => this.pause(!this.session.paused)); this.speak(ARENA_LINES.entry);
    const onDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      const key = event.key.toLowerCase();
      if (key === 'b' && !event.repeat && !this.finished && !this.failureShown) {
        event.preventDefault();
        if (this.bagOpen) {
          this.inventoryBar?.hide();
          this.pause(false);
        } else {
          this.openBag();
        }
        return;
      }
      if (key === 'escape' && !event.repeat && !this.finished) {
        event.preventDefault();
        if (this.inventoryBar?.isRevealed || this.bagOpen) {
          this.inventoryBar?.hide();
          this.pause(false);
          return;
        }
        if (!this.failureShown) this.pause(!this.session.paused);
        return;
      }
      if (['a','d','arrowleft','arrowright',' '].includes(key) && this.inventoryBar?.isRevealed) {
        this.inventoryBar.hide();
      }
      if (this.finished || this.session.paused || !['a','d','arrowleft','arrowright',' ','j','k','l','r'].includes(key)) return;
      event.preventDefault();
      if (event.repeat) return;
      if (key === 'k' && this.session.attempt.weapon !== 'SLING') {
        this.speak(this.session.hasSling ? 'လောက်လေးခွက အိတ်ထဲမှာပါ — B နှိပ်ပြီး ထုတ်သုံးပါ။' : 'လောက်လေးခွ မပါလာဘူး — J နဲ့ လက်သီးချနိုင်သည်။');
        return;
      }
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
  }
  private openBag() {
    if (this.finished || this.failureShown || store.conflict) return;
    this.inventoryBar?.reveal();
    this.pause(true); this.bagOpen = true;
    const a = this.session.attempt, el = ui().querySelector<HTMLDivElement>('#arena-modal')!;
    el.innerHTML = `<section class="dialog arena-bag-panel" role="dialog" aria-modal="true" aria-labelledby="arena-bag-title"><h2 id="arena-bag-title">လွယ်အိတ်</h2><p>အိတ်ဖွင့်ထားချိန် တိုက်ပွဲရပ်ထားသည်။ သုံးမယ့်အရာကို ရွေးပါ။</p><div class="actions"><button type="button" id="arena-bag-fists" class="secondary" aria-pressed="${a.weapon === 'FISTS'}">လက်ချည်းသုံးမယ်</button>${a.hasSling ? `<button type="button" id="arena-bag-sling" class="primary" aria-pressed="${a.weapon === 'SLING'}">လောက်လေးခွ ထုတ်သုံးမယ်</button>` : ''}</div>${a.hasSling ? '' : '<p id="arena-bag-empty">အိတ်ထဲမှာ လောက်လေးခွ မပါလာဘူး။ လက်ချည်းနဲ့ ဆက်ချနိုင်သည်။</p>'}<div class="actions">${button('arena-bag-close','အိတ်ပိတ်မယ်')}</div></section>`;
    const equip = (weapon: ArenaWeapon) => {
      if (!this.session.equipWeapon(weapon)) return;
      this.pause(false); this.speak(weapon === 'SLING' ? 'လောက်လေးခွ ထုတ်ပြီးပြီ — K ဖိဆွဲ၊ လွှတ်ပစ်။' : 'လက်ချည်းပဲ — J နဲ့ချ၊ L နဲ့ရှောင်။'); this.sync();
    };
    this.bind('arena-bag-fists',()=>equip('FISTS')); this.bind('arena-bag-sling',()=>equip('SLING'));
    this.bind('arena-bag-close',()=>this.pause(false)); this.sync();
    el.querySelector<HTMLButtonElement>('#arena-bag-fists')?.focus({preventScroll:true});
  }
  private pause(value: boolean) {
    if (store.conflict && !value) return;
    this.bagOpen = false; this.session.setPause(value); this.clear(); const el = ui().querySelector<HTMLDivElement>('#arena-modal'); if (!el) return;
    el.hidden = !value;
    if (!value) { el.innerHTML = ''; this.focusGame(); this.sync(); return; }
    el.innerHTML = `<section class="dialog"><h2>ခဏနားမယ်</h2><p>အစမှာ လက်ချည်းပဲ။ လောက်လေးခွပါလာလျှင် B အိတ်ဖွင့်ပြီး ထုတ်သုံးပါ။ ဒဏ်ထိလျှင် K ဆွဲအားပျက်သည်။ နားနေတဲ့လူဝံကို J နဲ့ ခွာထုတ်ပြီး ပစ်ခွင့်ယူပါ။ လက်မြှောက်ပြီးသားကို J နဲ့မတားနိုင်ပါ။ သတိပေးချက်ပေါ်လျှင် ခုန် / L နဲ့ရှောင်ပါ။</p><div class="actions">${button('arena-resume','ဆက်ကစားမယ်',true)}${button('arena-menu','ပင်မစာမျက်နှာ')}</div></section>`;
    this.bind('arena-resume',()=>this.pause(false)); this.bind('arena-menu',()=>this.scene.start('MENU'));
    this.sync();
  }
  private restart() {
    if (store.conflict) return;
    this.session.restart(); this.session.setPause(false); this.failureShown = false; this.bagOpen = false; this.clear();
    const el = ui().querySelector<HTMLDivElement>('#arena-modal'); if (el) { el.hidden = true; el.innerHTML = ''; }
    this.speak(ARENA_LINES.entry); this.focusGame(); this.sync();
  }
  private event(kind: ArenaEvent) {
    if (kind === 'empty') this.speak(ARENA_LINES.empty);
    if (kind === 'hurt') this.speak(this.session.attempt.weapon === 'SLING' ? 'ဒဏ်ထိလို့ ဆွဲအားပျက်ပြီ — ရှောင်ပြီး ပြန်ဆွဲပစ်ပါ။' : 'ဒဏ်ထိသွားပြီ — ခုန် သို့မဟုတ် L နဲ့ရှောင်ပါ။', 2);
    if (kind === 'shove') this.speak(this.session.attempt.weapon === 'SLING' ? 'ခွာထုတ်လိုက်ပြီ — K ဆွဲပစ်ဖို့ အချိန်ရပြီ။' : this.session.hasSling ? 'ခွာထုတ်လိုက်ပြီ — B အိတ်ဖွင့်ပြီး လောက်လေးခွ ထုတ်နိုင်သည်။' : 'ခွာထုတ်လိုက်ပြီ — ပြန်တိုက်ခိုက်ချိန်ကို ကြည့်ပြီး ရှောင်ပါ။', 1.6);
    if (kind === 'refill') this.speak('ကျောက်ခဲ ပြန်ဖြည့်ပြီးပြီ။');
    if (kind === 'won') this.speak(ARENA_LINES.won, Infinity);
    if (kind === 'failed') {
      if (this.session.attempt.failure === 'HEALTH') store.death(`arena:${this.session.attempt.id}`);
      this.failureShown = true; this.clear(); const el = ui().querySelector<HTMLDivElement>('#arena-modal')!; el.hidden = false;
      const advice = !this.session.hasSling ? 'လက်ချည်းပဲ ပါလာတယ်။ J နဲ့ချ၊ သတိပေးချက်ပေါ်လျှင် ခုန် / L နဲ့ရှောင်ပါ။' : this.session.attempt.weapon === 'FISTS' ? 'လောက်လေးခွက အိတ်ထဲမှာ ရှိတယ်။ နောက်တစ်ကြိမ် B အိတ်ဖွင့်ပြီး ထုတ်သုံးနိုင်သည်။' : this.session.attempt.failure === 'TIME' ? ARENA_LINES.timeout : ARENA_LINES.health;
      el.innerHTML = `<section class="dialog"><h2>${this.session.attempt.failure === 'TIME' ? 'တံခါးပိတ်သွားပြီ' : 'ဒီတစ်ခါ ရှုံးသွားပြီ'}</h2><p>${advice}</p><div class="actions">${button('arena-retry','ပြန်စမ်းမယ်',true)}${button('arena-menu','ပင်မစာမျက်နှာ')}</div></section>`;
      this.bind('arena-retry',()=>this.restart()); this.bind('arena-menu',()=>this.scene.start('MENU'));
    }
    if (kind === 'complete') { store.completeArena(this.session.attempt); this.finished = true; this.clear(); this.result(); }
  }
  private result() {
    const r = store.campaign.lastChapter4Result;
    ui().innerHTML = `<section class="result-panel"><span class="eyebrow">အခန်း ၄ ပြီးပါပြီ</span><h1>လူဝံနှစ်ကောင်ကို ကျော်လာပြီ။</h1><p class="intro">ရှေးဟောင်းမြို့တော်ရဲ့ အတွင်းတံခါးဘက် ဆက်သွားနိုင်ပြီ။</p><div class="result-stats"><div><span>ကျန်သွေး</span><b>${r?.remainingHealth ?? 0}<small>/100</small></b></div><div><span>တိုက်ပွဲချိန်</span><b>${r?.activeSeconds.toFixed(2) ?? '—'}<small>s</small></b></div><div><span>သိမ်းပြီးရွှေ</span><b>${store.campaign.walletCoins}</b></div></div><p class="result-note">အခန်း ၅ ကို မတည်ဆောက်ရသေးပါ။ ဂိမ်းတစ်ခုလုံး၏ ဇာတ်သိမ်းမဟုတ်ပါ။</p>${store.unsaved ? '<p class="warning">Save မသိမ်းရသေးပါ။ Reload လုပ်ပါက ယာယီ progress ပျောက်နိုင်သည်။</p>' : ''}<div class="actions">${button('arena-again','အခန်း ၄ ပြန်စမ်း',true)}${store.unsaved ? button('arena-save','ထပ်သိမ်းမယ်') : ''}${button('arena-menu','ပင်မစာမျက်နှာ')}</div></section>`;
    ui().querySelector('.result-note')!.textContent='အတွင်းမြို့တော်မှာ ဦးကြီး စောင့်နေတယ်။ အခန်း ၅ မှာ ဆက်ရင်ဆိုင်နိုင်ပြီ။';
    ui().querySelector('.actions')!.insertAdjacentHTML('afterbegin',button('arena-next','အခန်း ၅ ဆက်မယ်',true));
    this.bind('arena-next',()=>this.scene.start('CHAPTER_5',{equipment:{slingshot:this.session.hasSling}}));
    this.bind('arena-again',()=>this.scene.restart({equipment:{slingshot:this.session.hasSling}})); this.bind('arena-menu',()=>this.scene.start('MENU')); this.bind('arena-save',()=>{ if(store.save())this.result(); });
  }
  private sync() {
    if (this.finished) return;
    const a = this.session.attempt;
    const text = (id: string, value: string) => { const el = ui().querySelector(`#${id}`); if (el && el.textContent !== value) el.textContent = value; };
    (ui().querySelector('#arena-hp') as HTMLProgressElement).value = a.hp; text('arena-hp-label',`${a.hp} / ${A4.health}`);
    for (const e of a.apes) {
      (ui().querySelector(`#${e.id}-hp`) as HTMLProgressElement).value = e.hp; text(`${e.id}-hp-label`,`${e.hp} / ${A4.apeHealth}`);
      text(`${e.id}-state`, e.phase === 'DOWN' ? 'လဲပြီ' : e.phase === 'WINDUP' ? e.type === 'MELEE' ? 'လက်မြှောက်ပြီ — ရှောင်!' : 'ကျောက်ပစ်တော့မည် — ရှောင်!' : e.phase === 'RECOVER' || e.phase === 'STUN' ? 'ပစ်ခွင့်ရပြီ' : '');
    }
    text('arena-time', a.combatWon ? 'လွတ်ပြီ' : `${Math.max(0, Math.ceil(A4.timeLimit - a.combatSeconds))} s`);
    text('arena-ammo',a.hasSling ? String(a.ammo) : '—');
    const charge = ui().querySelector('#arena-charge') as HTMLProgressElement; charge.value = a.charge / A4.chargeTime; charge.hidden = a.weapon !== 'SLING';
    text('arena-charge-label', a.weapon !== 'SLING' ? a.hasSling ? 'လက်ချည်း · B အိတ်ဖွင့်ပြီး လောက်လေးခွထုတ်' : 'လက်ချည်း · လောက်လေးခွ မပါလာပါ' : a.staggerLeft > 0 ? 'ဒဏ်ထိ၍ ဆွဲအားပျက်ပြီ' : a.charge >= A4.chargeTime ? 'အားပြည့်ပြီ — K လွှတ်ပြီးပစ်!' : a.charge > 0 ? `${a.aimFacing === 1 ? '→' : '←'} ဆွဲနေသည်` : 'K ဖိပြီး ဆွဲ → လွှတ်ပြီးပစ်');
    text('arena-dodge', a.dodgeCooldown > 0 ? `L ပြန်အဆင်သင့် ${a.dodgeCooldown.toFixed(1)} s` : 'L · ရှောင်နိုင်ပြီ');
    text('arena-punch', a.punchLeft > 0 ? `J ပြန်အဆင်သင့် ${a.punchLeft.toFixed(1)} s` : 'J · ခွာထုတ်နိုင်ပြီ');
    ui().querySelector<HTMLElement>('#arena-message')!.hidden = a.elapsed >= this.messageUntil;
    for (const el of ui().querySelectorAll<HTMLElement>('.arena-refill')) el.hidden = !a.hasSling;
    ui().querySelector<HTMLElement>('#arena-unsaved')!.hidden = !store.unsaved;
    this.view.render(a, this.bagOpen);
    this.inventoryBar?.refresh();
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
