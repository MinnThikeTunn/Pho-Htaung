import Phaser from 'phaser';
import { C } from '../content/chapter1';
import { DIALOGUE } from '../content/dialogue.my';
import { preview } from '../domain/step';
import type { ChapterResult, Input, Mode, Preset } from '../domain/types';
import { SAVE_KEY, SETTINGS_KEY } from '../services/CampaignStore';
import { AudioController } from '../services/AudioController';
import { Session } from '../services/Session';
import { WorldView } from '../view/WorldView';
import { store } from '../services/adventure';
import InventoryBar from '../ui/InventoryBar.js';
import { ensureBridgeTextures } from '../view/BridgeView';
import { soundEngine } from '../utils/SoundEngine.js';
import { gameState } from '../utils/AdventureState.js';
import { ITEM_TEXTURE_KEYS } from '../utils/GameState.js';

const uid = () => crypto.randomUUID();
const ui = () => document.querySelector<HTMLDivElement>('#interface')!;
const buttons = (html: string) => `<div class="actions">${html}</div>`;
const button = (id: string, text: string, primary = false) => `<button type="button" id="${id}" class="${primary ? 'primary' : 'secondary'}">${text}</button>`;
const bind = (id: string, fn: () => void) => { ui().querySelector<HTMLButtonElement>(`#${id}`)?.addEventListener('click', fn); };
const focusGame = (scene: Phaser.Scene) => { scene.game.canvas.tabIndex = 0; scene.game.canvas.focus({ preventScroll: true }); };

export default class Chapter2Scene extends Phaser.Scene {
  private session!: Session;
  private mode: Mode = 'CAMPAIGN';
  private world!: WorldView;
  private audio!: AudioController;
  public inventoryBar!: InventoryBar;
  private held = new Set<string>();
  private jumpEdge = false;
  private tauntEdge = false;
  private result: ChapterResult | null = null;
  private fadeTime = 0;
  private speechLeft = 0;
  private waitingForSave = false;
  private voiceCooldown = 0;
  private shade = true;
  private showHints = true;
  private debug = false;
  private bambooItem: Phaser.GameObjects.Image | null = null;
  private cogItem: Phaser.GameObjects.Image | null = null;
  private gearBoxItem: Phaser.GameObjects.Container | null = null;
  private slingshotItem: Phaser.GameObjects.Image | null = null;
  private heldItemSprite: Phaser.GameObjects.Image | null = null;
  private targetX: number | null = null;
  private pendingAction: (() => void) | null = null;

  constructor() {
    super('CHAPTER_2');
  }

  snapshot() {
    return {
      mode: this.mode,
      attempt: this.session ? structuredClone(this.session.attempt) : null,
      generation: this.session?.generation,
      paused: this.session?.paused,
      inventoryOpen: this.inventoryBar?.isRevealed ?? false,
      selectedItem: this.inventoryBar?.getSelected() ?? null
    };
  }

  init(data: { preset?: Preset; mode?: Mode }) {
    if (!store.campaign.bridgeCompleted) throw new Error('Chapter 2 is locked');
    this.mode = data.mode ?? 'CAMPAIGN';
    const preset = data.preset ?? 'A';
    if ((preset === 'A') !== (this.mode !== 'PRACTICE') || (preset !== 'A' && !store.campaign.chapter2Completed)) {
      throw new Error('Invalid chapter entry');
    }
    this.session = new Session(preset, uid);
    this.result = null;
    this.fadeTime = 0;
    this.waitingForSave = false;
    this.speechLeft = 0;
    this.voiceCooldown = 0;
    this.clearKeys();
  }

  private clearKeys() {
    this.held.clear();
    this.jumpEdge = false;
    this.tauntEdge = false;
  }

  private speak(text: string, duration: number, who = 'ဦးကြီး') {
    const speech = ui().querySelector<HTMLElement>('#speech');
    if (!speech) return;
    speech.innerHTML = `<span>${who}</span><p></p>`;
    speech.querySelector('p')!.textContent = text;
    speech.classList.add('visible');
    this.speechLeft = duration;
  }

  private hint(id: 'lock' | 'land' | 'shatter') {
    if (!this.showHints || !store.hint(id)) return;
    // Core Design System Standard: U Gyi is the sole clue and hint vehicle.
    // Hints are delivered diegetically via overhead speech rather than artificial floating boxes.
    this.speak(DIALOGUE[`hint_${id}`], 2.5, 'ဦးကြီး');
  }

  private saveSettings() {
    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({ muted: this.audio.muted, shake: this.shade, hints: this.showHints })
      );
    } catch {
      /* Safe fallback */
    }
  }

  private setPause(value: boolean) {
    this.session.setPause(value);
    this.clearKeys();
    const panel = ui().querySelector<HTMLElement>('#pause-panel')!;
    if (value) {
      panel.innerHTML = `<section class="dialog"><span class="eyebrow">ခဏနားမယ်</span><h2>ရပ်ထားပါတယ်</h2>${buttons(
        button('resume', 'ဆက်ကစားမယ်', true) + button('menu', 'ပင်မစာမျက်နှာ')
      )}<div class="settings"><label><input id="mute-setting" type="checkbox" ${
        this.audio.muted ? 'checked' : ''
      }/> အသံပိတ်</label><label><input id="shake-setting" type="checkbox" ${
        this.shade ? 'checked' : ''
      }/> Screen shake</label><label><input id="hints-setting" type="checkbox" ${
        this.showHints ? 'checked' : ''
      }/> အကူအညီစာတန်း</label>${button('reset-hints', 'အကူအညီစာတန်း ပြန်ပြ')}</div></section>`;
      panel.hidden = false;
      bind('resume', () => {
        this.audio.unlock();
        this.setPause(false);
      });
      bind('menu', () => this.scene.start('MENU'));
      ui().querySelector<HTMLInputElement>('#mute-setting')!.onchange = e => {
        this.audio.muted = (e.target as HTMLInputElement).checked;
        this.saveSettings();
      };
      ui().querySelector<HTMLInputElement>('#shake-setting')!.onchange = e => {
        this.shade = (e.target as HTMLInputElement).checked;
        this.saveSettings();
      };
      ui().querySelector<HTMLInputElement>('#hints-setting')!.onchange = e => {
        this.showHints = (e.target as HTMLInputElement).checked;
        this.saveSettings();
      };
      bind('reset-hints', () => {
        store.campaign.hintsSeen = [];
        store.campaign.revision++;
        store.save();
        this.setPause(false);
      });
    } else {
      panel.hidden = true;
      panel.innerHTML = '';
      focusGame(this);
    }
  }

  create() {
    this.audio = new AudioController();
    try {
      const prefs = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}');
      this.audio.muted = Boolean(prefs.muted);
      this.shade = prefs.shake !== false;
      this.showHints = prefs.hints !== false;
    } catch {}

    this.audio.attach(this);
    this.world = new WorldView(this);

    // Register crisp procedural textures (including myanmar_traditional_bag)
    ensureBridgeTextures(this);

    // Permanent Bottom-Docked Myanmar Traditional Bag (Lwe-Ait)
    this.inventoryBar = new InventoryBar(this);

    // HUD: Standardized with 🎒 Bag Toggle, zero on-screen keyboard shortcut strips
    ui().innerHTML = `<div class="hud"><div class="stage-title"><span class="eyebrow">အခန်း ၂ / ${
      this.session.preset
    }</span><strong>ကျောက်တုံးချစက်</strong></div><div class="ledger"><div><span>စုထား</span><b id="coins">0<small>/15</small></b></div><div><span>သိမ်းပြီး</span><b id="wallet">${
      store.campaign.walletCoins
    }</b></div><div><span>သေဆုံး</span><b id="deaths">${
      store.campaign.deathCount
    }</b></div><div><span>ကစားချိန်</span><b id="time">0.00</b></div></div><button id="bag" class="icon-button bag-icon-btn" aria-label="လွယ်အိတ်">🎒</button><button id="pause" class="icon-button" aria-label="Pause">Ⅱ</button></div><div id="speech" class="speech" aria-live="polite"></div><div id="pause-panel" class="modal" hidden></div><div id="save-panel" class="modal" hidden></div><div id="death-vignette" class="death-vignette"></div>`;

    bind('bag', () => {
      this.audio.unlock();
      this.inventoryBar?.toggleReveal();
    });
    bind('pause', () => this.setPause(!this.session.paused));
    ui().insertAdjacentHTML('beforeend', '<div id="reset-fade" class="reset-fade"></div>');

    this.speak(DIALOGUE.entry, 2.5);

    if (this.mode === 'CAMPAIGN' && this.session?.attempt) {
      this.session.attempt.player.centerX = 35;
      this.session.attempt.player.facing = 1;
      this.tweens.add({
        targets: this.session.attempt.player,
        centerX: 96,
        duration: 400,
        ease: 'Linear'
      });
    }

    const onDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === 'escape') {
        event.preventDefault();
        if (this.inventoryBar?.isRevealed) {
          this.inventoryBar.hide();
          return;
        }
        if (!event.repeat) this.setPause(!this.session.paused);
        return;
      }
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || this.session.paused) {
        return;
      }

      // Keyboard shortcut for Bag: B or Tab
      if ((key === 'b' || key === 'tab') && !event.repeat) {
        event.preventDefault();
        this.audio.unlock();
        this.inventoryBar?.toggleReveal();
        return;
      }

      if (!['a', 'd', 'arrowleft', 'arrowright', ' ', 'e', 'r', 'f3'].includes(key)) return;
      event.preventDefault();
      this.audio.unlock();

      // Norman's Law: Instant action canceling on locomotion
      if (['a', 'd', 'arrowleft', 'arrowright', ' '].includes(key) && this.inventoryBar?.isRevealed) {
        this.inventoryBar.hide();
      }

      if (!this.held.has(key) && !event.repeat) {
        if (key === ' ') this.jumpEdge = true;
        if (key === 'e') this.tauntEdge = true;
        if (key === 'f3') this.debug = !this.debug;
      }
      this.held.add(key);
    };

    const onUp = (event: KeyboardEvent) => {
      this.held.delete(event.key.toLowerCase());
    };

    const onBlur = () => this.setPause(true);
    const onVisibility = () => {
      if (document.hidden) this.setPause(true);
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === SAVE_KEY) {
        store.conflict = true;
        this.setPause(true);
        const panel = ui().querySelector('#pause-panel .dialog');
        if (panel) {
          panel.innerHTML = `<h2>အခြား tab မှ save ပြောင်းသွားသည်</h2><p>ဒီ tab ကနေ ထပ်မသိမ်းခင် reload လုပ်ပါ။</p>${button(
            'reload',
            'Reload',
            true
          )}`;
          bind('reload', () => location.reload());
        }
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
      this.clearKeys();
    });

    focusGame(this);
  }

  private savePanel() {
    this.waitingForSave = true;
    this.clearKeys();
    const el = ui().querySelector<HTMLElement>('#save-panel')!;
    el.hidden = false;
    el.innerHTML = `<section class="dialog"><span class="eyebrow">မသိမ်းရသေးပါ</span><h2>Browser save မရပါ</h2><p>ယခု session မှာ ရလာဒ်ရှိနေသေးတယ်။ Reload လုပ်ရင် ပျောက်နိုင်တယ်။</p>${buttons(
      button('retry-save', 'ထပ်သိမ်းမယ်', true) + button('temporary-continue', 'ယာယီအတိုင်း ဆက်မယ်')
    )}</section>`;
    bind('retry-save', () => {
      if (store.save()) {
        this.waitingForSave = false;
        el.hidden = true;
      }
    });
    bind('temporary-continue', () => {
      this.waitingForSave = false;
      el.hidden = true;
    });
  }

  update(_time: number, milliseconds: number) {
    const dt = milliseconds / 1000,
      s = this.session;
    if (!s) return;

    if (!s.paused && !this.waitingForSave) {
      const before = s.generation;
      const input: Input = {
        left: this.held.has('a') || this.held.has('arrowleft'),
        right: this.held.has('d') || this.held.has('arrowright'),
        jump: this.jumpEdge,
        taunt: this.tauntEdge
      };
      const willStep = s.accumulator + dt + 1e-9 >= C.dt;
      const events = s.tick(dt, input, this.held.has('r'));
      if (willStep) {
        this.jumpEdge = false;
        this.tauntEdge = false;
      }
      if (s.generation !== before) {
        this.clearKeys();
        ui().querySelector('#death-vignette')?.classList.remove('visible');
      }
      this.voiceCooldown = Math.max(0, this.voiceCooldown - dt);
      for (const event of events) {
        this.audio.play(event.kind);
        if (event.kind === 'lock') this.hint('lock');
        if (event.kind === 'land') this.hint('land');
        if (event.kind === 'death') {
          store.death(s.attempt.id);
          this.speak(DIALOGUE.death, 0.8);
          ui().querySelector('#death-vignette')?.classList.add('visible');
        }
        if (event.kind === 'gate' || event.kind === 'shelf') this.speak(DIALOGUE[event.kind], 1.2);
        if (event.kind === 'plate' && event.value) this.speak(DIALOGUE.plate, 1.2);
        if (event.kind === 'taunt' && this.voiceCooldown <= 0) {
          this.speak(DIALOGUE.taunt, 0.8, 'ဖိုးထောင်');
          this.voiceCooldown = 3;
        }
        if (event.kind === 'puzzle_item') {
          if (s.attempt.hasPole && !store.campaign.inventory.includes('bamboo_pole')) {
            store.campaign.inventory.push('bamboo_pole');
          }
          if (s.attempt.hasCog && !store.campaign.inventory.includes('cog')) {
            store.campaign.inventory.push('cog');
          }
          this.inventoryBar?.refresh();
          this.speak('ပစ္စည်းကောက်လိုက်ပြီ! လွယ်အိတ်ထဲ ထည့်ထားလိုက်တယ်။', 1.8);
        }
        if (event.kind === 'gear_box') {
          this.speak('ဟား... ဂီယာ box တပ်လိုက်တော့ စင်တွေ ထွက်လာပြီဟေ့!', 2.2);
        }
        if (event.kind === 'slingshot') {
          if (!store.campaign.inventory.includes('slingshot')) store.campaign.inventory.push('slingshot');
          if (!store.campaign.ownedTools.includes('slingshot')) store.campaign.ownedTools.push('slingshot');
          store.save();
          this.inventoryBar?.refresh();
          this.speak('ရွှေရောင် လေးခွနဲ့ လောက်စာလုံး ရပြီ! အခန်း ၄ မှာ အသုံးဝင်မယ်။', 2.5);
        }
        if (event.kind === 'beehive') {
          this.speak('အမယ်လေး ပျားအုံကျလာပြီဟေ့! ရှောင်ပြေးတော့ ဖိုးထောင်ရေ!', 2.0);
        }
        if (event.kind === 'trap') {
          this.speak('ဟားဟားဟား! တံခါးဝရောက်ခါမှ အငိုက်မိပြီး တွင်းထဲကျသွားပြန်ပြီ!', 2.0);
        }
        if (event.kind === 'complete') {
          this.result = store.complete(s.attempt, this.mode, s.sessionDeaths);
          this.clearKeys();
          if (store.unsaved) this.savePanel();
        }
      }
      if (s.attempt.machine.state === 'LOCKED' && preview(s.attempt).surfaces[0]?.shatter) {
        this.hint('shatter');
      }
      this.speechLeft -= dt;
      if (this.speechLeft <= 0) ui().querySelector('#speech')?.classList.remove('visible');
      if (s.attempt.status === 'COMPLETE' && this.result && !this.waitingForSave) {
        this.fadeTime += dt;
        if (this.fadeTime >= C.exitFade) {
          if (this.mode === 'CAMPAIGN') {
            this.scene.start('CHAPTER_3');
          } else {
            this.scene.start('CH2_EXIT_LINK', { result: this.result, mode: this.mode });
          }
          return;
        }
      }
    }

    this.world.render(s.attempt, s.paused ? 0 : dt, this.debug, this.shade);
    const a = s.attempt;
    const fade = ui().querySelector<HTMLElement>('#reset-fade');
    if (fade) {
      fade.style.opacity = String(
        a.status === 'DEAD'
          ? Math.max(0, Math.min(1, (s.deathElapsed - C.deathFreeze) / C.resetFade))
          : a.status === 'COMPLETE'
          ? Math.min(1, this.fadeTime / C.exitFade)
          : 0
      );
    }
    const coinsEl = ui().querySelector('#coins');
    if (coinsEl) coinsEl.innerHTML = `${a.coins}<small>/15</small>`;
    const walletEl = ui().querySelector('#wallet');
    if (walletEl) walletEl.textContent = String(store.campaign.walletCoins);
    const deathsEl = ui().querySelector('#deaths');
    if (deathsEl) deathsEl.textContent = String(store.campaign.deathCount);
    const timeEl = ui().querySelector('#time');
    if (timeEl) timeEl.textContent = a.elapsed.toFixed(2);

    let saveStatus = ui().querySelector<HTMLElement>('#save-status');
    if (store.unsaved && !saveStatus) {
      saveStatus = document.createElement('div');
      saveStatus.id = 'save-status';
      saveStatus.className = 'unsaved-status';
      saveStatus.setAttribute('role', 'status');
      ui().append(saveStatus);
    }
    if (saveStatus) {
      saveStatus.hidden = !store.unsaved;
      saveStatus.textContent = 'ယာယီ session · save မသိမ်းရသေးပါ';
    }
  }
}
