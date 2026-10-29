import Phaser from 'phaser';
import { C } from '../content/chapter1';
import { S3, SCALE_IDS, SCALE_ITEMS, SCALE_LINES } from '../content/chapter3';
import type { ScaleItemId } from '../content/chapter3';
import { panWeight, queueScaleCommand } from '../domain/scale';
import type { ScaleCommand, ScaleEvent } from '../domain/scale';
import { ScaleSession } from '../services/ScaleSession';
import { store } from '../services/adventure';
import { SAVE_KEY } from '../services/CampaignStore';
import { ScaleView, VISUAL_GROUND_Y, toDomainY, vy } from '../view/ScaleView';
import InventoryBar from '../ui/InventoryBar.js';
import { ensureBridgeTextures } from '../view/BridgeView';
import { soundEngine } from '../utils/SoundEngine.js';

const ui = () => document.querySelector<HTMLDivElement>('#interface')!;
const button = (id: string, text: string, primary = false) =>
  `<button type="button" id="${id}" class="${primary ? 'primary' : 'secondary'}">${text}</button>`;

export default class ScaleChapterScene extends Phaser.Scene {
  private session!: ScaleSession;
  private view!: ScaleView;
  public inventoryBar!: InventoryBar;
  private held = new Set<string>();
  private jumpEdge = false;
  private selected: ScaleItemId | null = null;
  private history: string[] = [];
  private finished = false;
  private lastLine = '';
  private heldItemSprite: Phaser.GameObjects.Image | null = null;
  private speechTimer: Phaser.Time.TimerEvent | null = null;

  // Cached DOM test targets for ultra-high framerate execution
  private elWallet: HTMLElement | null = null;
  private elDeaths: HTMLElement | null = null;
  private elTime: HTMLElement | null = null;
  private elState: HTMLElement | null = null;
  private elUnsaved: HTMLElement | null = null;
  private elPan: HTMLButtonElement | null = null;
  private elLatch: HTMLButtonElement | null = null;
  private elWorld = new Map<ScaleItemId, HTMLButtonElement>();
  private elBag = new Map<ScaleItemId, HTMLButtonElement>();

  constructor() {
    super('CHAPTER_3');
  }

  snapshot() {
    return {
      attempt: structuredClone(this.session.attempt),
      paused: this.session.paused,
      generation: this.session.generation
    };
  }

  init(_data: { replay?: boolean } = {}) {
    if (!store.campaign.chapter2Completed) throw Error('Chapter 3 is locked');
    this.session = new ScaleSession(() => crypto.randomUUID());
    this.selected = null;
    this.history = [];
    this.finished = false;
    this.lastLine = '';
    this.held.clear();
    this.jumpEdge = false;
    this.hideHeldItem();
    store.startScale();
  }

  private bind(id: string, action: () => void) {
    ui().querySelector<HTMLButtonElement>(`#${id}`)?.addEventListener('click', action);
  }

  private focusGame() {
    this.game.canvas.tabIndex = 0;
    this.game.canvas.focus({ preventScroll: true });
  }

  /**
   * U Gyi is the Sole Hint & Clue System.
   * Delivered diegetically via overhead speech balloon fixed at top: 14%.
   */
  private speak(line: string, duration = 3.5, who = 'ဦးကြီး') {
    if (!line || line === this.lastLine) return;
    this.lastLine = line;
    this.history.push(line);

    const speechEl = ui().querySelector<HTMLElement>('#ugyi-speech');
    if (!speechEl) return;

    speechEl.hidden = false;
    speechEl.innerHTML = `<strong>${who}:</strong> ${line}`;
    speechEl.classList.remove('speech-pop');
    void speechEl.offsetWidth; // Trigger reflow for micro-animation
    speechEl.classList.add('speech-pop');

    if (this.speechTimer) this.speechTimer.remove();
    this.speechTimer = this.time.delayedCall(duration * 1000, () => {
      if (speechEl) {
        speechEl.classList.remove('speech-pop');
        speechEl.hidden = true;
      }
      this.lastLine = '';
    });
  }

  private dismissSpeech() {
    if (this.speechTimer) {
      this.speechTimer.remove();
      this.speechTimer = null;
    }
    const speechEl = ui().querySelector<HTMLElement>('#ugyi-speech');
    if (speechEl) speechEl.hidden = true;
    this.lastLine = '';
  }

  private updateHeldItem() {
    this.hideHeldItem();
    if (!this.selected) return;

    const p = this.session?.attempt?.player;
    if (!p) return;

    const handX = p.centerX + p.facing * 16;
    const handY = vy(p.feetY) - 40 - 24;
    const texKey = `ch3_icon_${this.selected}`;

    if (this.textures.exists(texKey)) {
      this.heldItemSprite = this.add
        .image(handX, handY, texKey)
        .setScale(0.85)
        .setDepth(200);
    }
  }

  private hideHeldItem() {
    if (this.heldItemSprite) {
      this.heldItemSprite.destroy();
      this.heldItemSprite = null;
    }
  }

  create() {
    this.view = new ScaleView(this);
    ensureBridgeTextures(this);

    // Standardized Bottom Myanmar Traditional Bag (Lwe-Ait)
    this.inventoryBar = new InventoryBar(this, {
      getItems: () => {
        const a = this.session?.attempt;
        if (!a) return [];
        const items = [];
        for (const id of SCALE_IDS) {
          if (a.locations[id] === 'BAG') {
            const itemDef = SCALE_ITEMS[id];
            items.push({
              key: id,
              id,
              name: `${itemDef.name}${itemDef.weight ? ` (${itemDef.weight} ပိဿာ)` : ''}`,
              selected: this.selected === id,
              texture: `ch3_icon_${id}`
            });
          }
        }
        return items;
      },
      onItemClick: (item: any) => {
        if (!this.session.paused && !this.finished) {
          this.session.attempt.command = null;
          this.selected = this.selected === item.id ? null : item.id;
          this.updateHeldItem();
          this.sync();
          this.focusGame();
        }
      }
    });

    // Standardized Perplexity HUD: zero on-screen shortcut strips, zero world text tags
    ui().innerHTML = `
      <div class="hud">
        <div class="stage-title">
          <span class="eyebrow">အခန်း ၃ / PUZZLE</span>
          <strong>ချိန်ခွင်နှင့် ရွှေရုပ်</strong>
        </div>
        <div class="ledger">
          <div><span>သိမ်းပြီးရွှေ</span><b id="scale-wallet"></b></div>
          <div><span>သေဆုံး</span><b id="scale-deaths"></b></div>
          <div><span>ကစားချိန်</span><b id="scale-time">0.00</b></div>
        </div>
        <button id="bag-btn" class="hud-pill-button" aria-label="လွယ်အိတ်">🎒 လွယ်အိတ်</button>
        <button id="scale-journal" class="icon-button" aria-label="ပြောပြီးသောစကားများ ပြန်ဖတ်">စာ</button>
        <button id="scale-pause" class="icon-button" aria-label="Pause">Ⅱ</button>
      </div>
      <div class="voice-toast-container"><div id="ugyi-speech" class="voice-toast" hidden></div></div>
      <div id="reset-fade" class="reset-fade"></div>
      <div id="scale-unsaved" class="unsaved-status" hidden>ယာယီ session · save မသိမ်းရသေးပါ</div>
      <div id="scale-modal" class="modal" hidden></div>

      <!-- Text-free, zero-opacity click targets strictly for headless test locators -->
      <div class="scale-test-targets">
        <button type="button" id="scale-pan" class="test-target" aria-label="pan"></button>
        <button type="button" id="scale-latch" class="test-target" aria-label="latch"></button>
        ${SCALE_IDS.map(id => `<button type="button" id="world-${id}" class="test-target" aria-label="${id}"></button>`).join('')}
        ${SCALE_IDS.map(id => `<button type="button" id="bag-${id}" class="test-target" aria-label="${id}" hidden></button>`).join('')}
        <span id="scale-state" class="test-target"></span>
      </div>
    `;

    this.bind('scale-pause', () => this.pause(true));
    this.bind('scale-journal', () => this.pause(true, true));
    this.bind('bag-btn', () => this.inventoryBar?.toggleReveal());

    // Headless test proxy bindings
    this.elWallet = ui().querySelector('#scale-wallet');
    this.elDeaths = ui().querySelector('#scale-deaths');
    this.elTime = ui().querySelector('#scale-time');
    this.elState = ui().querySelector('#scale-state');
    this.elUnsaved = ui().querySelector('#scale-unsaved');
    this.elPan = ui().querySelector('#scale-pan');
    this.elLatch = ui().querySelector('#scale-latch');

    if (this.elPan) {
      this.elPan.style.left = `${(S3.panX / C.width) * 100}%`;
      this.elPan.style.top = `${(vy(535) / C.height) * 100}%`;
      this.elPan.style.width = '100px';
      this.elPan.style.height = '40px';
    }
    if (this.elLatch) {
      this.elLatch.style.left = `${(S3.latchX / C.width) * 100}%`;
      this.elLatch.style.top = `${(vy(575) / C.height) * 100}%`;
      this.elLatch.style.width = '40px';
      this.elLatch.style.height = '40px';
    }

    this.elWorld.clear();
    this.elBag.clear();
    for (const id of SCALE_IDS) {
      const w = ui().querySelector<HTMLButtonElement>(`#world-${id}`);
      if (w) {
        this.elWorld.set(id, w);
        w.style.left = `${(SCALE_ITEMS[id].x / C.width) * 100}%`;
        w.style.top = `${((vy(SCALE_ITEMS[id].feetY) - 20) / C.height) * 100}%`;
        w.style.width = '48px';
        w.style.height = '48px';
      }
      const b = ui().querySelector<HTMLButtonElement>(`#bag-${id}`);
      if (b) this.elBag.set(id, b);
    }

    this.bind('scale-pan', () => this.usePan());
    this.bind('scale-latch', () => this.useLatch());
    for (const id of SCALE_IDS) {
      this.bind(`world-${id}`, () => this.queue({ kind: 'item', id }));
      this.bind(`bag-${id}`, () => {
        if (!this.session.paused && !this.finished) {
          this.session.attempt.command = null;
          this.selected = this.selected === id ? null : id;
          this.updateHeldItem();
          if (this.selected) this.inventoryBar?.setSelected(this.selected);
          else this.inventoryBar?.clearSelected();
          this.sync();
          this.focusGame();
        }
      });
    }

    // Canvas click interaction with domain Y coordinate mapping
    const onWorldClick = (pointer: Phaser.Input.Pointer) => {
      if (this.session.paused || this.finished) return;
      this.dismissSpeech();

      const a = this.session.attempt;
      const x = pointer.worldX;
      const domainY = toDomainY(pointer.worldY);

      // Check click on items
      for (const id of SCALE_IDS) {
        if (!['WORLD', 'PAN'].includes(a.locations[id])) continue;
        const targetPt = a.locations[id] === 'PAN'
          ? { x: S3.panX, feetY: 535 }
          : SCALE_ITEMS[id];
        if (Math.abs(x - targetPt.x) <= 38 && Math.abs(domainY - targetPt.feetY) <= 52) {
          this.queue({ kind: 'item', id });
          return;
        }
      }

      // Check click on pan
      if (Math.abs(x - S3.panX) <= 85 && Math.abs(domainY - 535) <= 50) {
        this.usePan();
        return;
      }

      // Check click on latch
      if (Math.abs(x - S3.latchX) <= 32 && Math.abs(domainY - 575) <= 50) {
        this.useLatch();
        return;
      }
    };

    this.input.on('pointerdown', onWorldClick);

    const onDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;

      if (key === 'escape' && !event.repeat && !this.finished) {
        event.preventDefault();
        if (this.inventoryBar?.isRevealed) {
          this.inventoryBar.hide();
          return;
        }
        this.pause(!this.session.paused);
        return;
      }

      if ((key === 'b' || key === 'tab') && !event.repeat && !this.finished) {
        event.preventDefault();
        this.inventoryBar?.toggleReveal();
        return;
      }

      // Norman's Law: Instant action canceling on locomotion
      if (['a', 'd', 'arrowleft', 'arrowright', ' '].includes(key) && this.inventoryBar?.isRevealed) {
        this.inventoryBar.hide();
      }

      if (this.session.paused || this.finished) return;

      if (key === ' ' && !event.repeat) {
        this.jumpEdge = true;
        this.dismissSpeech();
      }

      // Universal mouth verb E for proximity pickup and pan deposit
      if (key === 'e' && !event.repeat) {
        const a = this.session.attempt;
        const px = a.player.centerX;
        const pfeet = a.player.feetY;

        // Check latch hole proximity
        if (Math.abs(px - S3.latchX) <= 85) {
          if (this.selected === 'pin') {
            this.useLatch();
            return;
          }
        }

        // Check pan proximity
        if (Math.abs(px - S3.panX) <= 85) {
          this.usePan();
          return;
        }

        // Check items proximity
        for (const id of SCALE_IDS) {
          if (['WORLD', 'PAN'].includes(a.locations[id])) {
            const targetPt = a.locations[id] === 'PAN' ? { x: S3.panX, feetY: 535 } : SCALE_ITEMS[id];
            if (Math.abs(px - targetPt.x) <= 85 && Math.abs(pfeet - targetPt.feetY) <= 75) {
              this.queue({ kind: 'item', id });
              return;
            }
          }
        }
      }

      this.held.add(key);
    };

    const onUp = (event: KeyboardEvent) => this.held.delete(event.key.toLowerCase());
    const onBlur = () => {};
    const onVisibility = () => { if (document.hidden && !this.finished) this.pause(true); };

    const onStorage = (event: StorageEvent) => {
      if (event.key !== SAVE_KEY) return;
      store.conflict = true;
      if (!this.finished) this.pause(true);
      const modal = ui().querySelector<HTMLDivElement>('#scale-modal');
      if (modal) {
        modal.hidden = false;
        modal.innerHTML = `
          <section class="dialog">
            <h2>အခြား tab မှ save ပြောင်းသွားသည်</h2>
            <p>ဒီ tab မှ ဆက်မသိမ်းမီ reload လုပ်ပါ။</p>
            ${button('scale-reload', 'Reload', true)}
          </section>`;
        this.bind('scale-reload', () => location.reload());
      }
    };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('storage', onStorage);

    this.events.once('shutdown', () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('storage', onStorage);
      this.held.clear();
      this.jumpEdge = false;
      this.hideHeldItem();
      this.session.clearInput();
      this.input.off('pointerdown', onWorldClick);
      if (this.speechTimer) {
        this.speechTimer.remove();
        this.speechTimer = null;
      }
    });

    this.speak(SCALE_LINES.entry, 4.5);
    this.sync();
    this.focusGame();
  }

  private usePan() {
    if (this.session.paused || this.finished) return;
    const a = this.session.attempt;

    // If no item is selected, check if there is an item on the pan to pick up
    if (!this.selected) {
      const onPan = SCALE_IDS.filter(id => a.locations[id] === 'PAN');
      if (onPan.length > 0) {
        const lastItem = onPan[onPan.length - 1] as ScaleItemId | undefined;
        if (lastItem) this.queue({ kind: 'item', id: lastItem });
        return;
      }
      this.speak(SCALE_LINES.pan, 2.5);
      return;
    }

    if (this.selected === 'pin') {
      this.speak(SCALE_LINES.wrongPin, 3.0);
      return;
    }

    this.queue({ kind: 'pan', id: this.selected });
  }

  private useLatch() {
    if (this.session.paused || this.finished) return;
    if (this.selected !== 'pin' || this.session.attempt.gateLift < S3.gateTravel - C.epsilon) {
      this.speak(SCALE_LINES.latchClosed, 3.0);
      return;
    }
    this.queue({ kind: 'latch' });
  }

  private queue(command: ScaleCommand) {
    if (this.session.paused || this.finished) return;
    queueScaleCommand(this.session.attempt, command);
    if (command.kind === 'item' && command.id === 'sandbag' && this.session.attempt.locations.sandbag === 'WORLD') {
      this.speak('သဲအိတ်က စင်ပေါ်မှာရှိတယ်။ အနားသွားပြီး SPACE နဲ့ ခုန်ကောက်လိုက် ဖိုးထောင်!', 3.0);
    }
    this.focusGame();
  }

  private pause(value: boolean, journal = false) {
    if (store.conflict && !value) return;
    this.session.setPause(value);
    this.held.clear();
    this.jumpEdge = false;

    const el = ui().querySelector<HTMLDivElement>('#scale-modal');
    if (!el) return;
    el.hidden = !value;
    if (!value) {
      el.innerHTML = '';
      this.focusGame();
      return;
    }

    el.innerHTML = `
      <section class="dialog scale-dialog">
        <h2>${journal ? SCALE_LINES.journal : 'ခဏနားမယ်'}</h2>
        ${journal ? '<ol id="scale-history"></ol>' : '<p>ကစားချိန်နဲ့ စက်လှုပ်ရှားမှု ရပ်ထားသည်။</p>'}
        <div class="actions">
          ${button('scale-resume', 'ဆက်ကစားမယ်', true)}
          ${button('scale-menu', 'ပင်မစာမျက်နှာ')}
        </div>
      </section>`;

    if (journal) {
      const list = el.querySelector('#scale-history')!;
      for (const text of this.history) {
        const line = document.createElement('li');
        line.textContent = text;
        list.append(line);
      }
    }

    this.bind('scale-resume', () => this.pause(false));
    this.bind('scale-menu', () => this.scene.start('MENU'));
  }

  private event(event: ScaleEvent) {
    if (event === 'balanced') {
      soundEngine.playGearClick();
      this.speak(SCALE_LINES.balanced, 3.5);
    }
    if (event === 'closing') {
      soundEngine.playGearClick();
      this.speak(SCALE_LINES.closing, 3.0);
    }
    if (event === 'braced') {
      soundEngine.playGearClick();
      this.selected = null;
      this.hideHeldItem();
      this.speak(SCALE_LINES.braced, 3.5);
    }
    if (event === 'blocked') {
      this.speak(SCALE_LINES.blocked, 2.5);
    }
    if (event === 'pickup' || event === 'retrieved') {
      soundEngine.playPickup();
    }
    if (event === 'complete') {
      store.completeScale(this.session.attempt);
      this.finished = true;
      this.held.clear();
      this.jumpEdge = false;
      this.hideHeldItem();
      this.showResult();
    }
  }

  private showResult() {
    const result = store.campaign.lastChapter3Result;
    ui().innerHTML = `
      <section class="result-panel">
        <span class="eyebrow">အခန်း ၃ ပြီးပါပြီ / PUZZLE → FIGHTING</span>
        <h1>တံခါးလွန်တော့ အသံလွန်ပြီ။</h1>
        <p class="result-quip">စက်သံကြောင့် အတွင်းဘက်က လူတွေ သတိထားမိသွားပြီ။</p>
        <div class="result-stats">
          <div><span>ရွှေရုပ်</span><b>${result?.treasureRecovered ? 'ပါလာပြီ' : 'ထားခဲ့သည်'}</b></div>
          <div><span>အောင်မြင်ချိန်</span><b>${result?.activeSeconds.toFixed(2) ?? '—'}<small>s</small></b></div>
          <div><span>သိမ်းပြီးရွှေ</span><b>${store.campaign.walletCoins}</b></div>
        </div>
        <p class="result-note">ရွှေရုပ်ယူထွက်နိုင်မှုကို သီးခြားမှတ်ထားသည်။ ဒီ prototype မှာ ငွေတန်ဖိုး မသတ်မှတ်ရသေးပါ။</p>
        <p class="warning" id="scale-save-warning" ${store.unsaved ? '' : 'hidden'}>Save မသိမ်းရသေးပါ။ Reload လုပ်ပါက ယာယီရလာဒ် ပျောက်နိုင်သည်။</p>
        <div class="actions">
          ${button('scale-next', store.unsaved ? 'ယာယီအတိုင်း ဆက်မယ်' : 'အခန်း ၄ ဆီ ဆက်မယ်', true)}
          ${store.unsaved ? button('scale-retry-save', 'ထပ်သိမ်းမယ်') : ''}
          ${button('scale-again', 'အခန်း ၃ ပြန်စမ်း')}
          ${button('scale-menu', 'ပင်မစာမျက်နှာ')}
        </div>
      </section>`;

    this.bind('scale-next', () => this.scene.start('CHAPTER_4_PENDING'));
    this.bind('scale-again', () => this.scene.restart({ replay: true }));
    this.bind('scale-menu', () => this.scene.start('MENU'));
    this.bind('scale-retry-save', () => {
      if (store.save()) this.showResult();
    });
  }

  private sync() {
    if (this.finished) return;
    const a = this.session.attempt;

    if (this.selected && a.locations[this.selected] !== 'BAG') {
      this.selected = null;
      this.hideHeldItem();
    }

    if (this.elWallet && this.elWallet.textContent !== String(store.campaign.walletCoins)) {
      this.elWallet.textContent = String(store.campaign.walletCoins);
    }
    if (this.elDeaths && this.elDeaths.textContent !== String(store.campaign.deathCount)) {
      this.elDeaths.textContent = String(store.campaign.deathCount);
    }
    const timeStr = a.elapsed.toFixed(2);
    if (this.elTime && this.elTime.textContent !== timeStr) {
      this.elTime.textContent = timeStr;
    }

    // Maintain scale-state test hook strictly for headless Playwright assertions
    const stateText = a.braced
      ? 'ထိန်းတံ ခံထားပြီ'
      : a.wasBalanced
        ? a.gateLift >= S3.gateTravel - C.epsilon ? 'ချိန်ခွင်ညီပြီ · တံခါးအပြည့်ပွင့်ပြီ' : 'ချိန်ခွင်ညီပြီ · တံခါးတက်နေသည်'
        : a.closingLeft > 0 ? 'သတိ · တံခါးပြန်ကျတော့မည်' : 'ချိန်ခွင်ကို ညှိပါ';
    if (this.elState && this.elState.textContent !== stateText) {
      this.elState.textContent = stateText;
    }

    // Fast sync test target proxies
    for (const id of SCALE_IDS) {
      const worldTarget = this.elWorld.get(id);
      if (worldTarget) {
        const isWorld = ['WORLD', 'PAN'].includes(a.locations[id]);
        if (worldTarget.hidden !== !isWorld) worldTarget.hidden = !isWorld;
        if (a.locations[id] === 'PAN') {
          const pt = this.view.itemPoint(a, id);
          worldTarget.style.left = `${(pt.x / C.width) * 100}%`;
          worldTarget.style.top = `${((pt.feetY - 20) / C.height) * 100}%`;
        }
      }

      const bagTarget = this.elBag.get(id);
      if (bagTarget) {
        const isBag = a.locations[id] === 'BAG';
        if (bagTarget.hidden !== !isBag) bagTarget.hidden = !isBag;
        const pressed = String(this.selected === id);
        if (bagTarget.getAttribute('aria-pressed') !== pressed) bagTarget.setAttribute('aria-pressed', pressed);
      }
    }

    if (this.elPan) {
      const pY = `${(this.view.panY(a) / C.height) * 100}%`;
      if (this.elPan.style.top !== pY) this.elPan.style.top = pY;
    }

    if (this.elUnsaved && this.elUnsaved.hidden !== !store.unsaved) {
      this.elUnsaved.hidden = !store.unsaved;
    }
  }

  update(_time: number, milliseconds: number) {
    if (this.finished) return;
    const dt = Math.max(milliseconds / 1000, C.dt);
    const previous = this.session.generation;
    const before = { ...this.session.attempt.locations };
    const stepped = this.session.accumulator + dt + 1e-9 >= C.dt;

    const events = this.session.tick(
      dt,
      {
        left: this.held.has('a') || this.held.has('arrowleft'),
        right: this.held.has('d') || this.held.has('arrowright'),
        jump: this.jumpEdge
      },
      this.held.has('r')
    );

    if (stepped) this.jumpEdge = false;

    if (previous !== this.session.generation) {
      this.selected = null;
      this.hideHeldItem();
      this.held.clear();
      this.jumpEdge = false;
      this.history = [];
      this.lastLine = '';
      this.speak('လက်ရှိအခန်းကို ပြန်စထားသည်။ သိမ်းပြီးရွှေနဲ့ campaign progress မပြောင်းပါ။', 2.5);
      this.inventoryBar?.refresh();
      this.inventoryBar?.clearSelected();
    } else {
      let bagChanged = false;
      for (const id of SCALE_IDS) {
        if (before[id] !== 'BAG' && this.session.attempt.locations[id] === 'BAG') {
          this.selected = id;
          this.updateHeldItem();
          this.speak(`${SCALE_ITEMS[id].name} ကို လွယ်အိတ်ထဲ ထည့်ထားပြီ။`);
          bagChanged = true;
        } else if (before[id] === 'BAG' && this.session.attempt.locations[id] !== 'BAG') {
          bagChanged = true;
        }
      }
      if (bagChanged) {
        this.inventoryBar?.refresh();
        if (this.selected) this.inventoryBar?.setSelected(this.selected);
        else this.inventoryBar?.clearSelected();
      }
    }

    // Footstep foley
    const p = this.session.attempt.player;
    if (p.grounded && Math.abs(p.vx) > 10 && Math.random() < 0.05) {
      soundEngine.playFootstepStone();
    }

    // Update held item position to follow Phoe's hand
    if (this.heldItemSprite && p) {
      const handX = p.centerX + p.facing * 16;
      const handY = vy(p.feetY) - 40 - 24;
      this.heldItemSprite.setPosition(handX, handY);
      this.heldItemSprite.setFlipX(p.facing < 0);
    }

    for (const event of events) this.event(event);
    this.view.render(this.session.attempt, dt, Boolean(this.heldItemSprite));
    this.sync();
  }
}
