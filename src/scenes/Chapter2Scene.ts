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
import DiegeticGrab from '../ui/DiegeticGrab';
import { ensureBridgeTextures } from '../view/BridgeView';
import { soundEngine } from '../utils/SoundEngine.js';
import { gameState } from '../utils/AdventureState.js';
import { ITEM_TEXTURE_KEYS } from '../utils/GameState.js';
import { MicroInteractions } from '../utils/MicroInteractions.js';

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
  public diegeticGrab!: DiegeticGrab;
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
  private gearBoxItem: Phaser.GameObjects.GameObject | null = null;
  private slingshotItem: Phaser.GameObjects.Image | null = null;
  private heldItemSprite: Phaser.GameObjects.Image | null = null;
  private targetX: number | null = null;
  private pendingAction: (() => void) | null = null;
  private isCollectingBamboo = false;
  private isCollectingCog = false;
  private isCollectingSlingshot = false;
  private isLaying = false;
  private crawlDustTimer = 0;

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
    this.isCollectingBamboo = false;
    this.isCollectingCog = false;
    this.isCollectingSlingshot = false;
    this.isLaying = false;
    this.crawlDustTimer = 0;
    this.clearKeys();
  }

  private clearKeys() {
    this.held.clear();
    this.jumpEdge = false;
    this.tauntEdge = false;
    this.targetX = null;
    this.pendingAction = null;
    this.isLaying = false;
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

    // Synchronize campaign inventory into gameState so items carry over cleanly into the bag
    for (const item of store.campaign.inventory) {
      gameState.addItem(item);
    }
    if (!gameState.hasItem('betel_cutter')) {
      gameState.addItem('betel_cutter');
    }

    // Permanent Bottom-Docked Myanmar Traditional Bag (Lwe-Ait)
    this.inventoryBar = new InventoryBar(this);
    this.inventoryBar.refresh();

    // Standardized Diegetic Grab Component
    this.diegeticGrab = new DiegeticGrab(this, {
      inventoryBar: this.inventoryBar,
      getActor: () => {
        const p = this.session?.attempt?.player;
        if (!p) return null;
        const visualFeetY = p.feetY - 64;
        return {
          x: p.centerX,
          y: visualFeetY - 40,
          facing: p.facing,
          setControl: (ctrl: string) => {
            p.control = ctrl as any;
          },
          bounce: () => {
            const actor = (this.world as any)?.actor;
            if (actor) {
              this.tweens.add({
                targets: actor,
                scaleY: 1.08,
                scaleX: p.facing * 0.94,
                duration: 120,
                yoyo: true,
                ease: 'Back.Out'
              });
            }
          }
        };
      },
      speak: (text, duration, who) => this.speak(text, duration ?? 2.2, who),
      onAutoWalk: (targetX, onReach) => this.interactWithProximity(targetX, onReach)
    });

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

    this.createInteractivePickups();

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

      if (!['a', 'd', 's', 'arrowleft', 'arrowright', 'arrowdown', ' ', 'e', 'r', 'f3'].includes(key)) return;
      event.preventDefault();
      this.audio.unlock();

      // Norman's Law: Instant action canceling on locomotion
      if (['a', 'd', 's', 'arrowleft', 'arrowright', 'arrowdown', ' '].includes(key)) {
        this.targetX = null;
        this.pendingAction = null;
        if (this.inventoryBar?.isRevealed) {
          this.inventoryBar.hide();
        }
      }

      if (!this.held.has(key) && !event.repeat) {
        if (key === ' ') this.jumpEdge = true;
        if (key === 's' || key === 'arrowdown') {
          try { soundEngine.playLongyiRustle(); } catch {}
        }
        if (key === 'e') {
          this.tauntEdge = true;
          const px = this.session?.attempt?.player?.centerX ?? 0;
          const py = (this.session?.attempt?.player?.feetY ?? 576) - 40;
          const grabbed = this.diegeticGrab.handleProximityVerb(px, py);
          if (!grabbed && Math.abs(px - 1108) <= 85) {
            this.interactWithGearBox();
          }
        }
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
      this.diegeticGrab?.clear();
      this.bambooItem = null;
      this.cogItem = null;
      this.slingshotItem = null;
      if (this.gearBoxItem) { this.gearBoxItem.destroy(); this.gearBoxItem = null; }
      this.hideHeldItem();
    });

    focusGame(this);
  }

  private createInteractivePickups() {
    if (!this.session?.attempt) return;
    const a = this.session.attempt;

    // 1. Bamboo Pole on STEP (536, 470)
    if (!a.hasPole && !this.bambooItem) {
      this.bambooItem = this.diegeticGrab.createPickup({
        id: 'bamboo_pole',
        x: 536,
        y: 470,
        textureKey: 'item-bamboo-pole',
        scale: 0.72,
        hoverScale: 0.82,
        bobRange: 4,
        bobDuration: 1200,
        voiceoverText: 'ခိုင်မာတဲ့ ဝါးလုံးတုတ်တစ်ချောင်း ရပြီ! လွယ်အိတ်ထဲ ထည့်ထားလိုက်တယ်။',
        voiceoverDuration: 2.0,
        campaignKey: 'bamboo_pole',
        onBagged: () => {
          if (this.session?.attempt) {
            this.session.attempt.hasPole = true;
          }
          this.bambooItem = null;
        }
      });
    }

    // 2. Rusty Cog on SHELF (860, 250)
    if (!a.hasCog && !this.cogItem) {
      this.cogItem = this.diegeticGrab.createPickup({
        id: 'rusty_cog',
        x: 860,
        y: 250,
        textureKey: 'ch1_vector_cog',
        scale: 0.65,
        hoverScale: 0.75,
        bobRange: 4,
        bobDuration: 1100,
        voiceoverText: 'သံချေးတက် ဂီယာခွေ ကောက်ရလိုက်ပြီ! စက်ယန္တရားတစ်ခုခုမှာ တပ်ဆင်ရမလား?',
        voiceoverDuration: 2.2,
        campaignKey: 'cog',
        onBagged: () => {
          if (this.session?.attempt) {
            this.session.attempt.hasCog = true;
          }
          gameState.addItem('cog');
          this.cogItem = null;
        }
      });
    }

    // 3. Door Gear Box Interactive Zone (1108, 324, 64x64)
    if (!this.gearBoxItem) {
      const zone = this.add.zone(1108, 324, 64, 64).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', (_p: Phaser.Input.Pointer, _lx: number, _ly: number, event?: Event) => {
        event?.stopPropagation();
        this.audio.unlock();
        this.interactWithProximity(1060, () => this.interactWithGearBox());
      });
      this.gearBoxItem = zone;
    }

    // 4. Slingshot on high platform if platforms revealed
    if (a.platformsRevealed && !a.hasSlingshot && !this.slingshotItem) {
      this.spawnSlingshotPickup();
    }
  }

  private resetInteractivePickups() {
    this.diegeticGrab?.clear();
    this.bambooItem = null;
    this.cogItem = null;
    this.slingshotItem = null;
    this.hideHeldItem();
    this.targetX = null;
    this.pendingAction = null;
    this.isCollectingBamboo = false;
    this.isCollectingCog = false;
    this.isCollectingSlingshot = false;
    this.isLaying = false;
    this.createInteractivePickups();
  }

  private interactWithProximity(targetX: number, onReach: () => void) {
    if (!this.session?.attempt || this.session.attempt.status !== 'ACTIVE') return;
    const px = this.session.attempt.player.centerX;
    if (Math.abs(px - targetX) <= 85) {
      onReach();
    } else {
      this.targetX = targetX;
      this.pendingAction = onReach;
    }
  }

  private collectBamboo() {
    this.diegeticGrab.executeGrab('bamboo_pole');
  }

  private collectCog() {
    this.diegeticGrab.executeGrab('rusty_cog');
  }

  private spawnSlingshotPickup() {
    if (this.slingshotItem || this.session?.attempt?.hasSlingshot) return;
    this.slingshotItem = this.diegeticGrab.createPickup({
      id: 'slingshot',
      x: 205,
      y: 244,
      textureKey: 'ch2_vector_slingshot',
      scale: 0.75,
      hoverScale: 0.85,
      bobRange: 4,
      bobDuration: 1000,
      voiceoverText: 'ရွှေရောင် လေးခွနဲ့ လောက်စာလုံး ရပြီ! အခန်း ၄ မှာ အသုံးဝင်မယ်။',
      voiceoverDuration: 2.5,
      campaignKey: 'slingshot',
      campaignOwnedTool: 'slingshot',
      onBagged: () => {
        if (this.session?.attempt) {
          this.session.attempt.hasSlingshot = true;
        }
        this.slingshotItem = null;
      }
    });
  }

  private collectSlingshot() {
    this.diegeticGrab.executeGrab('slingshot');
  }

  private interactWithGearBox() {
    if (!this.session?.attempt) return;
    const a = this.session.attempt;
    if (a.gearBoxActive) {
      this.speak('ဂီယာ box တပ်ဆင်ထားပြီးသားပါ။ စင်တွေ အပေါ်မှာ ရှိနေပြီ!', 1.8);
      return;
    }
    const hasPole = a.hasPole || gameState.hasItem('bamboo_pole') || store.campaign.inventory.includes('bamboo_pole');
    const hasCog = a.hasCog || gameState.hasItem('rusty_cog') || gameState.hasItem('cog') || store.campaign.inventory.includes('cog');

    if (hasPole && hasCog) {
      a.hasPole = true;
      a.hasCog = true;
      a.gearBoxActive = true;
      a.platformsRevealed = true;
      soundEngine.playGearClick();
      soundEngine.playClang();
      this.hideHeldItem();
      this.inventoryBar?.clearSelected();
      this.inventoryBar?.refresh();
      this.spawnSlingshotPickup();
      this.speak('ဟား... ဂီယာ box တပ်ဆင်လိုက်တော့ အပေါ်စင်တွေ ထွက်လာပြီဟေ့! အပေါ်တက်ကြည့်ဦး!', 2.5);
    } else {
      soundEngine.playPing();
      this.speak('တံခါးဖွင့်ဖို့ ဂီယာ box မှာ ဝါးလုံးနဲ့ ဂီယာခွေ တပ်ဆင်ရမယ်။ အရင်ရှာဦး!', 2.2);
    }
  }

  public showHeldItem(id: string) {
    this.hideHeldItem();
    const key =
      id === 'bamboo_pole'
        ? 'ch1_vector_bamboo'
        : id === 'rusty_cog' || id === 'cog'
        ? 'ch1_vector_cog'
        : id === 'slingshot'
        ? 'ch2_vector_slingshot'
        : (ITEM_TEXTURE_KEYS as Record<string, string>)[id];
    if (key && this.session?.attempt?.player) {
      const p = this.session.attempt.player;
      const visualFeetY = p.feetY - 64;
      const visualCenterY = visualFeetY - 40;
      const handX = p.centerX + p.facing * 20;
      const handY = visualCenterY - 12;
      this.heldItemSprite = this.add
        .image(handX, handY, key)
        .setScale(p.facing * 0.38, 0.38)
        .setDepth(200);
    }
  }

  public hideHeldItem() {
    if (this.heldItemSprite) {
      this.heldItemSprite.destroy();
      this.heldItemSprite = null;
    }
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
        taunt: this.tauntEdge,
        down: this.held.has('s') || this.held.has('arrowdown')
      };

      // Handle click-to-walk proximity pathfinding
      if (this.targetX !== null && s.attempt.status === 'ACTIVE') {
        const px = s.attempt.player.centerX;
        const diff = this.targetX - px;
        if (Math.abs(diff) <= 24) {
          this.targetX = null;
          const fn = this.pendingAction;
          this.pendingAction = null;
          if (fn) fn();
        } else {
          if (!this.held.has('a') && !this.held.has('d') && !this.held.has('arrowleft') && !this.held.has('arrowright')) {
            input.left = diff < 0;
            input.right = diff > 0;
          } else {
            this.targetX = null;
            this.pendingAction = null;
          }
        }
      }

      // Track laying transition and dust
      const currentLaying = s.attempt.player.control === 'LAYING';
      if (currentLaying && !this.isLaying) {
        this.isLaying = true;
        try { soundEngine.playLongyiRustle(); } catch {}
      } else if (!currentLaying && this.isLaying) {
        this.isLaying = false;
      }

      if (currentLaying && (input.left || input.right)) {
        if (_time > this.crawlDustTimer) {
          const dir = Number(input.right) - Number(input.left);
          try {
            MicroInteractions.spawnFootstepDust(this, s.attempt.player.centerX, 576, Math.sign(dir));
          } catch {}
          this.crawlDustTimer = _time + 280;
        }
      }

      const willStep = s.accumulator + dt + 1e-9 >= C.dt;
      const events = s.tick(dt, input, this.held.has('r'));
      if (willStep) {
        this.jumpEdge = false;
        this.tauntEdge = false;
      }
      if (s.generation !== before) {
        this.clearKeys();
        ui().querySelector('#death-vignette')?.classList.remove('visible');
        this.resetInteractivePickups();
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
        if (event.kind === 'puzzle_item' || event.kind === 'slingshot') {
          const px = s.attempt.player.centerX;
          const py = s.attempt.player.feetY - 40;
          this.diegeticGrab.handleProximityVerb(px, py);
        }
        if (event.kind === 'gear_box') {
          this.interactWithGearBox();
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

    // Drop cog if shelf shatters
    if (!s.attempt.shelfIntact && this.cogItem && this.cogItem.active && this.cogItem.y < 536) {
      this.tweens.killTweensOf(this.cogItem);
      this.tweens.add({
        targets: this.cogItem,
        y: 546,
        duration: 350,
        ease: 'Bounce.Out'
      });
    }

    // Update held item position with player
    if (this.heldItemSprite && s.attempt?.player) {
      const p = s.attempt.player;
      const visualFeetY = p.feetY - 64;
      const visualCenterY = visualFeetY - 40;
      const handX = p.centerX + p.facing * 20;
      const handY = visualCenterY - 12;
      this.heldItemSprite.setPosition(handX, handY);
      this.heldItemSprite.setScale(p.facing * 0.38, 0.38);
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
