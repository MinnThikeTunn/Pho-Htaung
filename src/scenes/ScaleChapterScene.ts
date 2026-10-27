import Phaser from 'phaser';
import { C } from '../content/chapter1';
import { S3, SCALE_IDS, SCALE_ITEMS, SCALE_LINES } from '../content/chapter3';
import type { ScaleItemId } from '../content/chapter3';
import { panWeight, queueScaleCommand } from '../domain/scale';
import type { ScaleCommand, ScaleEvent } from '../domain/scale';
import { ScaleSession } from '../services/ScaleSession';
import { store } from '../services/adventure';
import { SAVE_KEY } from '../services/CampaignStore';
import { ScaleView } from '../view/ScaleView';

const ui = () => document.querySelector<HTMLDivElement>('#interface')!;
const button = (id: string, text: string, primary = false) => `<button type="button" id="${id}" class="${primary ? 'primary' : 'secondary'}">${text}</button>`;
export default class ScaleChapterScene extends Phaser.Scene {
  private session!: ScaleSession;
  private view!: ScaleView;
  private held = new Set<string>();
  private jumpEdge = false;
  private selected: ScaleItemId | null = null;
  private hotspots = true;
  private history: string[] = [];
  private finished = false;
  private lastLine = '';
  constructor() { super('CHAPTER_3'); }
  snapshot() { return { attempt: structuredClone(this.session.attempt), paused: this.session.paused, generation: this.session.generation }; }
  init(_data: { replay?: boolean }) {
    if (!store.campaign.chapter2Completed) throw Error('Chapter 3 is locked');
    this.session = new ScaleSession(() => crypto.randomUUID());
    this.selected = null; this.history = []; this.finished = false; this.hotspots = true; this.lastLine = ''; this.held.clear(); this.jumpEdge = false;
    store.startScale();
  }
  private bind(id: string, action: () => void) { ui().querySelector<HTMLButtonElement>(`#${id}`)?.addEventListener('click', action); }
  private focusGame() { this.game.canvas.tabIndex = 0; this.game.canvas.focus({ preventScroll: true }); }
  private speak(line: string) {
    if (line === this.lastLine) return;
    this.lastLine = line; this.history.push(line);
    // Keep the last whole Burmese line visible; journal allows rereading earlier lines.
    const el = ui().querySelector('#scale-message'); if (el) el.textContent = line;
  }
  create() {
    this.view = new ScaleView(this);
    ui().innerHTML = `<div class="hud"><div class="stage-title"><span class="eyebrow">အခန်း ၃ / PUZZLE</span><strong>ချိန်ခွင်နှင့် ရွှေရုပ်</strong></div><div class="ledger"><div><span>သိမ်းပြီးရွှေ</span><b id="scale-wallet"></b></div><div><span>သေဆုံး</span><b id="scale-deaths"></b></div><div><span>ကစားချိန်</span><b id="scale-time">0.00</b></div></div><button id="scale-journal" class="icon-button" aria-label="ပြောပြီးသောစကားများ ပြန်ဖတ်">စာ</button><button id="scale-pause" class="icon-button" aria-label="Pause">Ⅱ</button></div>
      <div class="scale-controls"><kbd>A</kbd><kbd>D</kbd> ရွေ့ · <kbd>SPACE</kbd> ခုန် · နှိပ်ပြီး ကောက် / သုံး · <kbd>H</kbd> ပစ္စည်းအမည် · <kbd>R</kbd> ဖိထားပြီးပြန်စ · <kbd>ESC</kbd> နား</div>
      <div class="scale-speech"><p id="scale-message" aria-live="polite"></p></div>
      <div class="scale-goal"><span class="eyebrow">ပန်းတိုင်</span><p>ချိန်ခွင်ကိုသုံးပြီး တစ်ဖက်ထွက်ပေါက်ရောက်ပါ။</p><small>ရွှေရုပ်ပါ ယူထွက်နိုင်ရင် အပိုအောင်မြင်မှု။</small><strong id="scale-state" role="status"></strong></div>
      <div class="scale-reference">၁၀ ပိဿာ</div><div id="scale-weight" class="scale-weight" aria-live="polite"></div>
      <button id="scale-pan" class="scale-hotspot scale-pan" aria-label="ရွေးထားသောပစ္စည်းကို ချိန်ခွင်ဗန်းပေါ်တင်">ဗန်းပေါ်တင်</button>
      <button id="scale-latch" class="scale-hotspot scale-latch" aria-label="တံခါးထိန်းတံပေါက်တွင် သံချောင်းတပ်">ထိန်းတံပေါက်</button>
      ${SCALE_IDS.map(id => `<button type="button" id="world-${id}" class="scale-hotspot scale-item" aria-label="${SCALE_ITEMS[id].name} ကောက် / ပြန်ယူ">${SCALE_ITEMS[id].name}${SCALE_ITEMS[id].weight ? ` · ${SCALE_ITEMS[id].weight}` : ''}</button>`).join('')}
      <div class="scale-inventory" aria-label="လွယ်အိတ်"><span class="scale-bag-label">လွယ်အိတ်</span><span id="scale-bag-empty">ပစ္စည်းကို နှိပ်ပြီး ကောက်ပါ။</span>${SCALE_IDS.map(id => `<button type="button" id="bag-${id}" class="scale-slot" aria-pressed="false" hidden>${SCALE_ITEMS[id].name}${SCALE_ITEMS[id].weight ? ` · ${SCALE_ITEMS[id].weight}` : ''}</button>`).join('')}<span id="scale-selected"></span></div>
      <div id="scale-unsaved" class="unsaved-status" hidden>ယာယီ session · save မသိမ်းရသေးပါ</div><div id="scale-modal" class="modal" hidden></div>`;
    this.bind('scale-pause', () => this.pause(true)); this.bind('scale-journal', () => this.pause(true, true));
    this.bind('scale-pan', () => this.usePan());
    this.bind('scale-latch', () => this.useLatch());
    for (const id of SCALE_IDS) {
      this.bind(`world-${id}`, () => this.queue({ kind: 'item', id }));
      this.bind(`bag-${id}`, () => { if (!this.session.paused && !this.finished) { this.session.attempt.command = null; this.selected = this.selected === id ? null : id; this.sync(); this.focusGame(); } });
    }
    const onWorldClick = (pointer: Phaser.Input.Pointer) => {
      if (this.session.paused || this.finished) return;
      const a = this.session.attempt, x = pointer.worldX, y = pointer.worldY;
      for (const id of SCALE_IDS) {
        if (!['WORLD', 'PAN'].includes(a.locations[id])) continue;
        const point = this.view.itemPoint(a, id);
        if (Math.abs(x - point.x) <= 30 && y >= point.feetY - 55 && y <= point.feetY + 8) { this.queue({ kind: 'item', id }); return; }
      }
      if (Math.abs(x - S3.panX) <= 70 && Math.abs(y - this.view.panY(a)) <= 22) this.usePan();
      if (Math.abs(x - S3.latchX) <= 23 && Math.abs(y - 575) <= 25) this.useLatch();
    };
    this.input.on('pointerdown', onWorldClick);
    const onDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (key === 'escape' && !event.repeat && !this.finished) { event.preventDefault(); this.pause(!this.session.paused); return; }
      if (this.session.paused || this.finished || !['a', 'd', 'arrowleft', 'arrowright', ' ', 'r', 'h'].includes(key)) return;
      event.preventDefault();
      if (key === ' ' && !event.repeat) this.jumpEdge = true;
      if (key === 'h' && !event.repeat) this.hotspots = !this.hotspots;
      this.held.add(key);
    };
    const onUp = (event: KeyboardEvent) => this.held.delete(event.key.toLowerCase());
    const onBlur = () => { if (!this.finished) this.pause(true); };
    const onVisibility = () => { if (document.hidden) onBlur(); };
    const onStorage = (event: StorageEvent) => {
      if (event.key !== SAVE_KEY) return;
      store.conflict = true;
      if (!this.finished) this.pause(true);
      const modal = ui().querySelector<HTMLDivElement>('#scale-modal');
      if (modal) {
        modal.hidden = false; modal.innerHTML = `<section class="dialog"><h2>အခြား tab မှ save ပြောင်းသွားသည်</h2><p>ဒီ tab မှ ဆက်မသိမ်းမီ reload လုပ်ပါ။</p>${button('scale-reload', 'Reload', true)}</section>`;
        this.bind('scale-reload', () => location.reload());
      }
    };
    window.addEventListener('keydown', onDown); window.addEventListener('keyup', onUp); window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility); window.addEventListener('storage', onStorage);
    this.events.once('shutdown', () => {
      window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility); window.removeEventListener('storage', onStorage);
      this.held.clear(); this.jumpEdge = false; this.session.clearInput();
      this.input.off('pointerdown', onWorldClick);
    });
    this.speak(SCALE_LINES.entry); this.sync(); this.focusGame();
  }
  private usePan() {
    if (this.session.paused || this.finished) return;
    if (!this.selected) { this.speak(SCALE_LINES.pan); return; }
    if (this.selected === 'pin') { this.speak(SCALE_LINES.wrongPin); return; }
    this.queue({ kind: 'pan', id: this.selected });
  }
  private useLatch() {
    if (this.session.paused || this.finished) return;
    if (this.selected !== 'pin' || this.session.attempt.gateLift < S3.gateTravel - C.epsilon) { this.speak(SCALE_LINES.latchClosed); return; }
    this.queue({ kind: 'latch' });
  }
  private queue(command: ScaleCommand) {
    if (this.session.paused || this.finished) return;
    queueScaleCommand(this.session.attempt, command);
    if (command.kind === 'item' && command.id === 'sandbag' && this.session.attempt.locations.sandbag === 'WORLD')
      this.speak('သဲအိတ်က စင်ပေါ်မှာရှိသည်။ အနားသွားပြီး SPACE နဲ့ ခုန်ကောက်နိုင်သည်။');
    this.focusGame();
  }
  private pause(value: boolean, journal = false) {
    if (store.conflict && !value) return;
    this.session.setPause(value); this.held.clear(); this.jumpEdge = false;
    const el = ui().querySelector<HTMLDivElement>('#scale-modal'); if (!el) return;
    el.hidden = !value;
    if (!value) { el.innerHTML = ''; this.focusGame(); return; }
    el.innerHTML = `<section class="dialog scale-dialog"><h2>${journal ? SCALE_LINES.journal : 'ခဏနားမယ်'}</h2>${journal ? '<ol id="scale-history"></ol>' : '<p>ကစားချိန်နဲ့ စက်လှုပ်ရှားမှု ရပ်ထားသည်။</p>'}<div class="actions">${button('scale-resume', 'ဆက်ကစားမယ်', true)}${button('scale-menu', 'ပင်မစာမျက်နှာ')}</div></section>`;
    if (journal) {
      const list = el.querySelector('#scale-history')!;
      for (const text of this.history) { const line = document.createElement('li'); line.textContent = text; list.append(line); }
    }
    this.bind('scale-resume', () => this.pause(false)); this.bind('scale-menu', () => this.scene.start('MENU'));
  }
  private event(event: ScaleEvent) {
    if (event === 'balanced') this.speak(SCALE_LINES.balanced);
    if (event === 'closing') this.speak(SCALE_LINES.closing);
    if (event === 'braced') this.speak(SCALE_LINES.braced);
    if (event === 'blocked') this.speak(SCALE_LINES.blocked);
    if (event === 'complete') {
      store.completeScale(this.session.attempt); this.finished = true; this.held.clear(); this.jumpEdge = false;
      this.showResult();
    }
  }
  private showResult() {
    const result = store.campaign.lastChapter3Result;
    ui().innerHTML = `<section class="result-panel"><span class="eyebrow">အခန်း ၃ ပြီးပါပြီ / PUZZLE → FIGHTING</span><h1>တံခါးလွန်တော့ အသံလွန်ပြီ။</h1><p class="result-quip">စက်သံကြောင့် အတွင်းဘက်က လူတွေ သတိထားမိသွားပြီ။</p><div class="result-stats"><div><span>ရွှေရုပ်</span><b>${result?.treasureRecovered ? 'ပါလာပြီ' : 'ထားခဲ့သည်'}</b></div><div><span>အောင်မြင်ချိန်</span><b>${result?.activeSeconds.toFixed(2) ?? '—'}<small>s</small></b></div><div><span>သိမ်းပြီးရွှေ</span><b>${store.campaign.walletCoins}</b></div></div><p class="result-note">ရွှေရုပ်ယူထွက်နိုင်မှုကို သီးခြားမှတ်ထားသည်။ ဒီ prototype မှာ ငွေတန်ဖိုး မသတ်မှတ်ရသေးပါ။</p><p class="warning" id="scale-save-warning" ${store.unsaved ? '' : 'hidden'}>Save မသိမ်းရသေးပါ။ Reload လုပ်ပါက ယာယီရလာဒ် ပျောက်နိုင်သည်။</p><div class="actions">${button('scale-next', store.unsaved ? 'ယာယီအတိုင်း ဆက်မယ်' : 'အခန်း ၄ ဆီ ဆက်မယ်', true)}${store.unsaved ? button('scale-retry-save', 'ထပ်သိမ်းမယ်') : ''}${button('scale-again', 'အခန်း ၃ ပြန်စမ်း')}${button('scale-menu', 'ပင်မစာမျက်နှာ')}</div></section>`;
    this.bind('scale-next', () => this.scene.start('CHAPTER_4_PENDING'));
    this.bind('scale-again', () => this.scene.restart({ replay: true }));
    this.bind('scale-menu', () => this.scene.start('MENU'));
    this.bind('scale-retry-save', () => { if (store.save()) this.showResult(); });
  }
  private sync() {
    if (this.finished) return;
    const a = this.session.attempt;
    if (this.selected && a.locations[this.selected] !== 'BAG') this.selected = null;
    const text = (id: string, value: string) => { const el = ui().querySelector(`#${id}`); if (el && el.textContent !== value) el.textContent = value; };
    text('scale-wallet', String(store.campaign.walletCoins)); text('scale-deaths', String(store.campaign.deathCount)); text('scale-time', a.elapsed.toFixed(2));
    text('scale-weight', `${panWeight(a)} / ${S3.targetWeight} ပိဿာ`);
    ui().querySelector<HTMLElement>('#scale-weight')!.style.top = `${(this.view.panY(a) - 105) / C.height * 100}%`;
    ui().querySelector<HTMLElement>('.scale-reference')!.style.top = `${(1070 - this.view.panY(a) - 70) / C.height * 100}%`;
    const state = a.braced ? 'ထိန်းတံ ခံထားပြီ' : a.wasBalanced
      ? a.gateLift >= S3.gateTravel - C.epsilon ? 'ချိန်ခွင်ညီပြီ · တံခါးအပြည့်ပွင့်ပြီ' : 'ချိန်ခွင်ညီပြီ · တံခါးတက်နေသည်'
      : a.closingLeft > 0 ? 'သတိ · တံခါးပြန်ကျတော့မည်' : 'ချိန်ခွင်ကို ညှိပါ';
    text('scale-state', state); text('scale-selected', this.selected ? `ရွေးထား: ${SCALE_ITEMS[this.selected].name}` : 'ပစ္စည်းရွေး → ဗန်း / ထိန်းတံပေါက်ကို နှိပ်ပါ');
    let bagCount = 0;
    for (const id of SCALE_IDS) {
      const world = ui().querySelector<HTMLButtonElement>(`#world-${id}`)!;
      world.hidden = !['WORLD', 'PAN'].includes(a.locations[id]);
      world.classList.toggle('quiet', !this.hotspots);
      const point = this.view.itemPoint(a, id);
      const offset = a.locations[id] === 'WORLD' && (id === 'pin' || id === 'treasure') ? 105 : 67;
      world.style.left = `${point.x / C.width * 100}%`; world.style.top = `${(point.feetY - offset) / C.height * 100}%`;
      const caption = a.locations[id] === 'PAN' ? `${SCALE_ITEMS[id].weight} · ပြန်ယူ` : `${SCALE_ITEMS[id].name}${SCALE_ITEMS[id].weight ? ` · ${SCALE_ITEMS[id].weight}` : ''}`;
      if (world.textContent !== caption) world.textContent = caption;
      world.title = SCALE_ITEMS[id].name;
      world.setAttribute('aria-label', `${SCALE_ITEMS[id].name} ${a.locations[id] === 'PAN' ? 'ဗန်းမှ ပြန်ယူ' : 'ကောက်'}`);
      const slot = ui().querySelector<HTMLButtonElement>(`#bag-${id}`)!;
      slot.hidden = a.locations[id] !== 'BAG'; slot.setAttribute('aria-pressed', String(this.selected === id));
      if (!slot.hidden) bagCount++;
    }
    ui().querySelector<HTMLElement>('#scale-bag-empty')!.hidden = bagCount > 0;
    ui().querySelector<HTMLElement>('#scale-unsaved')!.hidden = !store.unsaved;
    this.view.render(a, this.hotspots);
  }
  update(_time: number, milliseconds: number) {
    if (this.finished) return;
    const previous = this.session.generation, before = { ...this.session.attempt.locations };
    const stepped = this.session.accumulator + milliseconds / 1000 + 1e-9 >= C.dt;
    const events = this.session.tick(milliseconds / 1000, {
      left: this.held.has('a') || this.held.has('arrowleft'), right: this.held.has('d') || this.held.has('arrowright'), jump: this.jumpEdge,
    }, this.held.has('r'));
    if (stepped) this.jumpEdge = false;
    if (previous !== this.session.generation) {
      this.selected = null; this.held.clear(); this.jumpEdge = false; this.history = []; this.lastLine = ''; this.speak('လက်ရှိအခန်းကို ပြန်စထားသည်။ သိမ်းပြီးရွှေနဲ့ campaign progress မပြောင်းပါ။');
    } else {
      for (const id of SCALE_IDS) if (before[id] !== 'BAG' && this.session.attempt.locations[id] === 'BAG') {
        this.selected = id; this.speak(`${SCALE_ITEMS[id].name} ကို လွယ်အိတ်ထဲ ထည့်ထားပြီ။`);
      }
    }
    for (const event of events) this.event(event);
    this.sync();
  }
}
