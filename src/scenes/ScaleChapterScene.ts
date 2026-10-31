import Phaser from 'phaser';
import { C } from '../content/chapter1';
import { S3, SCALE_IDS, SCALE_ITEMS, SCALE_LINES } from '../content/chapter3';
import { soundEngine } from '../utils/SoundEngine.js';
import { audioDirector } from '../audio/AudioDirector.js';
import { AudioController } from '../services/AudioController';
import type { ScaleItemId } from '../content/chapter3';
import { panWeight, queueScaleCommand } from '../domain/scale';
import type { ScaleCommand, ScaleEvent } from '../domain/scale';
import { ScaleSession } from '../services/ScaleSession';
import { store } from '../services/adventure';
import { SAVE_KEY } from '../services/CampaignStore';
import { ScaleView, VISUAL_GROUND_Y, toDomainY, vy } from '../view/ScaleView';
import InventoryBar from '../ui/InventoryBar.js';
import { VirtualTouchControls } from '../ui/VirtualTouchControls';
import DiegeticGrab from '../ui/DiegeticGrab';
import { ensureBridgeTextures } from '../view/BridgeView';
import { MicroInteractions } from '../utils/MicroInteractions.js';
import { StagedHintManager, PROGRESSIVE_HINTS } from '../utils/StagedHintManager';
import { DieAgainDeathOverlay } from '../ui/DieAgainDeathOverlay';
import { gameState } from '../utils/AdventureState.js';
import { ITEM_NAMES_MY, ITEM_TEXTURE_KEYS } from '../utils/GameState.js';

const ui = () => document.querySelector<HTMLDivElement>('#interface')!;
const button = (id: string, text: string, primary = false) =>
  `<button type="button" id="${id}" class="${primary ? 'primary' : 'secondary'}">${text}</button>`;

export default class ScaleChapterScene extends Phaser.Scene {
  private session!: ScaleSession;
  private view!: ScaleView;
  private touchControls: VirtualTouchControls | null = null;
  private prevTouchJump = false;
  private held = new Set<string>();
  private jumpEdge = false;
  private selected: ScaleItemId | null = null;
  private history: string[] = [];
  private finished = false;
  private lastLine = '';
  private grabControl: string | null = null;
  private heldItemSprite: Phaser.GameObjects.Image | null = null;
  private speechTimer: Phaser.Time.TimerEvent | null = null;
  private isLaying = false;
  private crawlDustTimer = 0;
  private lastWallTime = 0;
  private lastPendulumAngle = 0;
  private inventoryBar!: InventoryBar;
  private diegeticGrab!: DiegeticGrab;
  private stagedHintManager = new StagedHintManager();

  // Cached DOM test targets for ultra-high framerate execution
  private elWallet: HTMLElement | null = null;
  private elDeaths: HTMLElement | null = null;
  private elTime: HTMLElement | null = null;
  private elState: HTMLElement | null = null;
  private elUnsaved: HTMLElement | null = null;
  private elPan: HTMLButtonElement | null = null;
  private elLeftPan: HTMLButtonElement | null = null;
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
    const carried = store.campaign.inventory || [];
    this.session = new ScaleSession(() => crypto.randomUUID(), carried);
    this.selected = null;
    this.history = [];
    this.finished = false;
    this.lastLine = '';
    this.touchControls?.destroy();
      this.touchControls = null;
      this.held.clear();
    this.jumpEdge = false;
    this.isLaying = false;
    this.grabControl = null;
    this.crawlDustTimer = 0;
    this.lastWallTime = 0;
    this.lastPendulumAngle = 0;
    this.hideHeldItem();
    store.startScale();
  }

  private restartChapter() {
    DieAgainDeathOverlay.hideActive();
    this.dismissSpeech();
    gameState.restoreChapterOnFailure('CHAPTER_3');
    this.selected = null;
    this.hideHeldItem();
    this.inventoryBar?.refresh();
    this.inventoryBar?.clearSelected();
    try {
      (audioDirector as any).handleRespawn?.();
    } catch {}
    this.scene.restart();
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
    if (!line) return;
    let cleanLine = line.trim();
    const prefixMatch = cleanLine.match(/^(ဦးကြီး|ဖိုးထောင်)\s*[:—–-]\s*/);
    if (prefixMatch) {
      if (!who || who === 'ဦးကြီး') {
        who = prefixMatch[1]!;
      }
      cleanLine = cleanLine.slice(prefixMatch[0].length).trim();
    }
    if (!cleanLine || cleanLine === this.lastLine) return;
    this.lastLine = cleanLine;
    this.history.push(cleanLine);

    const speechEl = ui().querySelector<HTMLElement>('#ugyi-speech');
    if (!speechEl) return;

    speechEl.hidden = false;
    speechEl.innerHTML = `<strong>${who}:</strong> ${cleanLine}`;
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

    const visualFeetY = vy(p.feetY);
    const visualCenterY = visualFeetY - 40;
    const handX = p.centerX + p.facing * 20;
    const handY = visualCenterY - 12;
    const texKey = this.textures.exists(`ch3_icon_${this.selected}`)
      ? `ch3_icon_${this.selected}`
      : ((ITEM_TEXTURE_KEYS as Record<string, string>)[this.selected] || `ch3_icon_${this.selected}`);

    if (this.textures.exists(texKey)) {
      this.heldItemSprite = this.add
        .image(handX, handY, texKey)
        .setScale(p.facing * 0.38, 0.38)
        .setDepth(200);
    }
  }

  private hideHeldItem() {
    if (this.heldItemSprite) {
      this.heldItemSprite.destroy();
      this.heldItemSprite = null;
    }
  }

  private spawnWorldPickups() {
    this.diegeticGrab.clear();
    const a = this.session?.attempt;
    if (!a) return;

    const defs: { id: ScaleItemId; x: number; y: number; tex: string; scale: number; voice: string }[] = [
      { id: 'stone', x: 220, y: vy(640) - 19, tex: 'ch3_vector_stone', scale: 1.0, voice: 'ကျောက်တုံး ကောက်ရပြီ!' },
      { id: 'sandbag', x: 380, y: vy(530) - 20, tex: 'ch3_vector_sandbag', scale: 1.0, voice: 'စင်ပေါ်က သဲအိတ် ရပြီ!' },
      { id: 'crate', x: 930, y: vy(640) - 20, tex: 'ch3_vector_crate', scale: 1.0, voice: 'သစ်သားသေတ္တာ ကောက်ယူလိုက်ပြီ!' },
      { id: 'treasure', x: 850, y: vy(640) - 26, tex: 'ch3_vector_treasure', scale: 1.0, voice: 'ရွှေရုပ် ရပြီ! လွယ်အိတ်ထဲ ထည့်ထားလိုက်တယ်။' },
      { id: 'pin', x: 150, y: vy(640) - 18, tex: 'ch3_vector_pin', scale: 1.0, voice: 'သံချောင်း ကောက်ရပြီ!' },
      { id: 'betel_cutter', x: 1150, y: vy(640) - 16, tex: 'ch3_vector_betel_cutter', scale: 1.0, voice: 'ကွမ်းသီးညှပ် ကောက်ရပြီ!' },
      { id: 'bamboo_pole', x: 1100, y: vy(640) - 18, tex: 'ch3_vector_bamboo_pole', scale: 1.0, voice: 'ဝါးလုံး ကောက်ရပြီ!' },
      { id: 'rusty_cog', x: 120, y: vy(640) - 16, tex: 'ch3_vector_rusty_cog', scale: 1.0, voice: 'သံချေးတက်ဂီယာ ကောက်ရပြီ!' },
      { id: 'slingshot', x: 60, y: vy(640) - 16, tex: 'ch3_vector_slingshot', scale: 1.0, voice: 'လေးခွ ကောက်ရပြီ!' },
    ];

    for (const def of defs) {
      if (a.locations[def.id] === 'WORLD') {
        this.diegeticGrab.createPickup({
          id: def.id,
          x: def.x,
          y: def.y,
          textureKey: def.tex,
          scale: def.scale,
          hoverScale: def.scale * 1.15,
          depth: 12,
          bobRange: 3,
          bobDuration: 1200,
          voiceoverText: def.voice,
          voiceoverDuration: 2.2,
          onBagged: () => {
            this.session.attempt.locations[def.id] = 'BAG';
            if (!this.selected) {
              this.selected = def.id;
              this.updateHeldItem();
              this.inventoryBar?.setSelected(def.id);
            }
            this.inventoryBar?.refresh();
            this.sync();
          }
        });
      }
    }
  }

  create() {
    this.stagedHintManager.reset();
    gameState.syncFromCampaign?.();
    gameState.checkpointChapter('CHAPTER_3');
    this.view = new ScaleView(this);
    
    // Set up pan item click handler
    this.view.setItemClickHandler((id: ScaleItemId) => {
      if (this.session.paused || this.finished) return;
      const a = this.session.attempt;
      const loc = a.locations[id];
      
      // Only allow pickup if item is on a pan (and not the fixed reference)
      if (loc === 'LEFT_PAN' || loc === 'PAN' || loc === 'RIGHT_PAN') {
        this.queue({ kind: 'item', id });
      }
    });

    // Standardized Bottom Myanmar Traditional Bag (Lwe-Ait)
    this.inventoryBar = new InventoryBar(this, {
      getItems: () => {
        const a = this.session?.attempt;
        if (!a) return [];
        const items = [];
        const seen = new Set<string>();
        for (const id of SCALE_IDS) {
          if (a.locations[id] === 'BAG') {
            seen.add(id);
            const itemDef = SCALE_ITEMS[id];
            items.push({
              key: id,
              id,
              name: itemDef.name,
              selected: this.selected === id,
              texture: `ch3_icon_${id}`
            });
          }
        }
        const carried = store.campaign?.inventory || gameState.state?.inventory || [];
        for (const id of carried) {
          if (!seen.has(id)) {
            seen.add(id);
            items.push({
              key: id,
              id,
              name: (ITEM_NAMES_MY as Record<string, string>)[id] || id,
              selected: this.selected === id,
              texture: (ITEM_TEXTURE_KEYS as Record<string, string>)[id] || (this.textures?.exists(`ch3_icon_${id}`) ? `ch3_icon_${id}` : 'item-mystery')
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

    // Standardized 3-Phase Diegetic Grab with Actor Adapter
    this.diegeticGrab = new DiegeticGrab(this, {
      inventoryBar: this.inventoryBar,
      getActor: () => {
        const p = this.session?.attempt?.player;
        if (!p) return null;
        const visualFeetY = vy(p.feetY);
        return {
          x: p.centerX,
          y: visualFeetY - 40,
          facing: p.facing,
          setControl: (ctrl: string) => {
            this.grabControl = ctrl === 'FREE' ? null : ctrl;
          },
          bounce: () => {
            const actor = this.view?.getActorSprite();
            if (actor) {
              const baseScale = Math.abs(actor.scaleY || 0.12);
              this.tweens.add({
                targets: actor,
                scaleY: baseScale * 1.08,
                scaleX: p.facing * baseScale * 0.94,
                duration: 120,
                yoyo: true,
                ease: 'Back.Out'
              });
            }
          }
        };
      },
      speak: (text, duration, who) => this.speak(text, duration ?? 2.5, who),
      onAutoWalk: (_targetX, onReach) => onReach()
    });

    // Spawn high-fidelity vector pickups in the world
    this.spawnWorldPickups();

    soundEngine.init?.();
    if (!(soundEngine as any).muted) {
      soundEngine.startBGM?.();
      audioDirector.startStems(0.14, 0.00, 0.12);
    }

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
        <button id="bag-btn" class="hud-pill-button" aria-label="လွယ်အိတ်"><span class="hud-pill-icon" aria-hidden="true">🎒</span><span>လွယ်အိတ်</span></button>
        <button id="scale-journal" class="icon-button" aria-label="ပြောပြီးသောစကားများ ပြန်ဖတ်">စာ</button>
        <button id="scale-pause" class="icon-button" aria-label="Pause">Ⅱ</button>
      </div>
      <div class="voice-toast-container"><div id="ugyi-speech" class="voice-toast" hidden></div></div>
      <div id="reset-fade" class="reset-fade"></div>
      <div id="scale-unsaved" class="unsaved-status" hidden>ယာယီ session · save မသိမ်းရသေးပါ</div>
      <div id="scale-modal" class="modal" hidden></div>

      <!-- Text-free, zero-opacity click targets strictly for headless test locators -->
      <div class="scale-test-targets">
        <button type="button" id="scale-left-pan" class="test-target" aria-label="left-pan"></button>
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
    this.elLeftPan = ui().querySelector('#scale-left-pan');
    this.elPan = ui().querySelector('#scale-pan');
    this.elLatch = ui().querySelector('#scale-latch');

    if (this.elLeftPan) {
      this.elLeftPan.style.left = `${(S3.leftPanX / C.width) * 100}%`;
      this.elLeftPan.style.top = `${(vy(535) / C.height) * 100}%`;
      this.elLeftPan.style.width = '100px';
      this.elLeftPan.style.height = '40px';
    }
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
    for (let i = 0; i < SCALE_IDS.length; i++) {
      const id = SCALE_IDS[i]!;
      const w = ui().querySelector<HTMLButtonElement>(`#world-${id}`);
      if (w) {
        this.elWorld.set(id, w);
        w.style.left = `${(SCALE_ITEMS[id].x / C.width) * 100}%`;
        w.style.top = `${((vy(SCALE_ITEMS[id].feetY) - 20) / C.height) * 100}%`;
        w.style.width = '48px';
        w.style.height = '48px';
      }
      const b = ui().querySelector<HTMLButtonElement>(`#bag-${id}`);
      if (b) {
        this.elBag.set(id, b);
        b.style.left = `${10 + i * 8}%`;
        b.style.top = '88%';
        b.style.width = '44px';
        b.style.height = '44px';
      }
    }

    this.bind('scale-pan', () => this.usePan('RIGHT'));
    this.bind('scale-left-pan', () => this.usePan('LEFT'));
    this.bind('scale-latch', () => this.useLatch());
    for (const id of SCALE_IDS) {
      this.bind(`world-${id}`, () => {
        if (id === 'reference') {
          this.usePan('LEFT');
          return;
        }
        const loc = this.session.attempt.locations[id];
        if (loc === 'LEFT_PAN') {
          this.usePan('LEFT');
          return;
        }
        if (loc === 'PAN' || loc === 'RIGHT_PAN') {
          this.usePan('RIGHT');
          return;
        }
        this.queue({ kind: 'item', id });
      });
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
      const y = pointer.worldY;
      const domainY = toDomainY(y);

      // 1. Check click on Left Pan zone (generous hitbox: x from 415 to 585, y from 140 down to ground)
      if (x >= 415 && x <= 585 && y >= 140 && y <= vy(650)) {
        this.usePan('LEFT');
        return;
      }

      // 2. Check click on Right Pan zone (generous hitbox: x from 665 to 835, y from 140 down to ground)
      if (x >= 665 && x <= 835 && y >= 140 && y <= vy(650)) {
        this.usePan('RIGHT');
        return;
      }

      // 3. Check click on Latch zone (beside the Palace gate)
      if (x >= 970 && x <= 1045 && y >= vy(490) && y <= vy(650)) {
        this.useLatch();
        return;
      }

      // 4. Check click on world items (only items currently on the ground or shelf)
      for (const id of SCALE_IDS) {
        if (a.locations[id] !== 'WORLD') continue;
        const targetPt = SCALE_ITEMS[id];
        if (Math.abs(x - targetPt.x) <= 45 && Math.abs(domainY - targetPt.feetY) <= 55) {
          if (Math.abs(a.player.centerX - targetPt.x) <= 85) {
            this.diegeticGrab.executeGrab(id);
            return;
          }
          this.queue({ kind: 'item', id });
          return;
        }
      }
    };

    this.input.on('pointerdown', onWorldClick);

    this.touchControls = new VirtualTouchControls(this, {
      mode: 'CH3',
      onAction: () => {
        const a = this.session.attempt;
        const px = a.player.centerX;
        const pfeet = a.player.feetY;
        const visualFeetY = vy(pfeet);

        if (Math.abs(px - S3.latchX) <= 90) {
          if (this.selected === 'pin') {
            this.useLatch();
            return;
          }
        }
        if (Math.abs(px - S3.leftPanX) <= 105) {
          this.usePan('LEFT');
          return;
        }
        if (Math.abs(px - S3.panX) <= 105) {
          this.usePan('RIGHT');
          return;
        }
        const grabbed = this.diegeticGrab.handleProximityVerb(px, visualFeetY - 40);
        if (grabbed) return;
      },
      onJump: () => {
        this.jumpEdge = true;
        this.dismissSpeech();
      }
    });

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

      // Instant quick-reset on death per Norman's Law
      if (key === 'r' && !event.repeat && this.session.attempt.status === 'DEAD') {
        this.restartChapter();
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
        const visualFeetY = vy(pfeet);

        // Check latch hole proximity
        if (Math.abs(px - S3.latchX) <= 90) {
          if (this.selected === 'pin') {
            this.useLatch();
            return;
          }
        }

        // Check left pan proximity (expanded reach)
        if (Math.abs(px - S3.leftPanX) <= 105) {
          this.usePan('LEFT');
          return;
        }

        // Check right pan proximity (expanded reach)
        if (Math.abs(px - S3.panX) <= 105) {
          this.usePan('RIGHT');
          return;
        }

        // Check ground item proximity grab first via DiegeticGrab
        const grabbed = this.diegeticGrab.handleProximityVerb(px, visualFeetY - 40);
        if (grabbed) return;
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
      DieAgainDeathOverlay.hideActive();
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('storage', onStorage);
      this.held.clear();
      this.jumpEdge = false;
      this.hideHeldItem();
      this.diegeticGrab?.clear();
      this.session.clearInput();
      this.input.off('pointerdown', onWorldClick);
      if (this.speechTimer) {
        this.speechTimer.remove();
        this.speechTimer = null;
      }
      audioDirector.stopWalking();
    });

    this.speak(SCALE_LINES.entry, 4.5);
    this.sync();
    this.focusGame();
  }

  private usePan(side: 'LEFT' | 'RIGHT' = 'RIGHT') {
    if (this.session.paused || this.finished) return;
    const a = this.session.attempt;

    // If no item is selected, check if there is a retrievable item on that pan
    if (!this.selected) {
      const matchLoc = side === 'LEFT' ? 'LEFT_PAN' : 'PAN';
      const onPan = SCALE_IDS.filter(id => a.locations[id] === matchLoc || (side === 'RIGHT' && a.locations[id] === 'RIGHT_PAN'));
      // Filter out immovable items like 'reference'
      const pickableOnPan = onPan.filter(id => id !== 'reference');
      if (pickableOnPan.length > 0) {
        const lastItem = pickableOnPan[pickableOnPan.length - 1] as ScaleItemId;
        this.queue({ kind: 'item', id: lastItem });
        return;
      }
      if (side === 'LEFT' && onPan.includes('reference')) {
        this.speak(this.stagedHintManager.triggerHint('reference_weight', PROGRESSIVE_HINTS.chapter3.reference_weight), 3.5);
        return;
      }
      this.speak(SCALE_LINES.pan, 2.5);
      return;
    }

    if (this.selected === 'pin') {
      this.speak(this.stagedHintManager.triggerHint('pin_on_pan', PROGRESSIVE_HINTS.chapter3.pin_on_pan), 3.0);
      return;
    }
    
    // Place the selected item onto the pan, then deselect so user must explicitly choose next
    this.queue({ kind: 'pan', pan: side, id: this.selected });
    this.selected = null;
    this.updateHeldItem();
    this.inventoryBar?.clearSelected();
    this.inventoryBar?.refresh();
    this.sync();
  }

  private useLatch() {
    if (this.session.paused || this.finished) return;
    if (this.selected !== 'pin' || this.session.attempt.gateLift < S3.gateTravel - C.epsilon) {
      this.speak(this.stagedHintManager.triggerHint('latch_closed', PROGRESSIVE_HINTS.chapter3.latch_closed), 3.0);
      return;
    }
    this.queue({ kind: 'latch' });
  }

  private queue(command: ScaleCommand) {
    if (this.session.paused || this.finished) return;
    queueScaleCommand(this.session.attempt, command);
    if (command.kind === 'item' && command.id === 'sandbag' && this.session.attempt.locations.sandbag === 'WORLD') {
      this.speak('သဲအိတ်က ဟိုးစင်ပေါ်မှာ တင်ထားတာကွ! စင်အောက်ကနေ အားရပါးရ ခုန်ကောက်စမ်း ဖိုးထောင်!', 3.0);
    }
    this.focusGame();
  }

  private pause(value: boolean, journal = false) {
    if (store.conflict && !value) return;
    this.session.setPause(value);
    if (value) this.touchControls?.hide(); else this.touchControls?.show();
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
    if (event === 'pendulum_slapstick') {
      try {
        if (typeof (soundEngine as any).playBonk === 'function') {
          (soundEngine as any).playBonk();
        } else {
          soundEngine.playClang();
        }
      } catch {}

      // Accordion squash animation on Phoe Htaung sprite (scaleY: 0.4, then bounce back to normal over 400ms)
      const actor = this.view.getActorSprite();
      if (actor) {
        actor.setData('squashY', 0.4);
        this.tweens.add({
          targets: { val: 0.4 },
          val: 1.0,
          duration: 400,
          ease: 'Bounce.Out',
          onUpdate: (tween: Phaser.Tweens.Tween) => {
            actor.setData('squashY', tween.getValue());
          },
          onComplete: () => {
            actor.setData('squashY', 1.0);
          }
        });
      }

      this.speak(SCALE_LINES.pendulumSlapstick, 3.5);
    }
    if (event === 'pendulum_death') {
      store.death(this.session.attempt.id);
      try {
        soundEngine.playDeath();
        if (typeof (soundEngine as any).playBonk === 'function') {
          (soundEngine as any).playBonk();
        }
      } catch {}

      this.cameras.main.shake(250, 0.008);

      // Comedic knockdown animation / flat collapse
      const actor = this.view.getActorSprite();
      if (actor) {
        actor.setData('squashY', 0.35);
        actor.setData('poseOverride', 'ph-flat');
      }

      this.speak('ကြေးစည်ကြီးနဲ့ ခေါင်းကွဲသွားပြီ! ခေါင်းမီးတောက်မနေဘဲ အစကနေ အမြန်ပြန်စမ်း ဖိုးထောင်!', 3.5);

      DieAgainDeathOverlay.show({
        scene: this,
        reason: 'PENDULUM',
        autoRetrySeconds: 2.2,
        onRetry: () => this.restartChapter(),
        onMenu: () => {
          DieAgainDeathOverlay.hideActive();
          this.scene.start('MENU');
        }
      });
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
    this.scene.start('CHAPTER_4_PENDING');
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
        const isWorld = ['WORLD', 'PAN', 'RIGHT_PAN', 'LEFT_PAN'].includes(a.locations[id]);
        if (worldTarget.hidden !== !isWorld) worldTarget.hidden = !isWorld;
        if (a.locations[id] === 'PAN' || a.locations[id] === 'RIGHT_PAN' || a.locations[id] === 'LEFT_PAN') {
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
      const pY = `${(this.view.rightPanY(a) / C.height) * 100}%`;
      if (this.elPan.style.top !== pY) this.elPan.style.top = pY;
    }
    if (this.elLeftPan) {
      const pY = `${(this.view.leftPanY(a) / C.height) * 100}%`;
      if (this.elLeftPan.style.top !== pY) this.elLeftPan.style.top = pY;
    }

    if (this.elUnsaved && this.elUnsaved.hidden !== !store.unsaved) {
      this.elUnsaved.hidden = !store.unsaved;
    }
  }

  update(_time: number, milliseconds: number) {
    if (this.finished) return;
    const now = performance.now();
    const wallElapsed = this.lastWallTime > 0 ? (now - this.lastWallTime) / 1000 : 0;
    this.lastWallTime = now;
    const dt = Math.max(Math.min(wallElapsed, 0.25), milliseconds / 1000, C.dt);
    const previous = this.session.generation;
    const before = { ...this.session.attempt.locations };
    const stepped = this.session.accumulator + dt + 1e-9 >= C.dt;

    const inputLeft = this.held.has('a') || this.held.has('arrowleft');
    const inputRight = this.held.has('d') || this.held.has('arrowright');
    const inputDown = this.held.has('s') || this.held.has('arrowdown');

    const events = this.session.tick(
      dt,
      {
        left: inputLeft,
        right: inputRight,
        jump: this.jumpEdge,
        down: inputDown
      },
      this.held.has('r')
    );

    if (stepped) this.jumpEdge = false;

    // Track prone crawl state and footstep dust
    const currentLaying = this.session.attempt.player.control === 'LAYING';
    if (currentLaying && !this.isLaying) {
      this.isLaying = true;
      try { soundEngine.playLongyiRustle(); } catch {}
    } else if (!currentLaying && this.isLaying) {
      this.isLaying = false;
    }

    if (currentLaying && (inputLeft || inputRight)) {
      if (_time > this.crawlDustTimer) {
        const dir = Number(inputRight) - Number(inputLeft);
        try {
          MicroInteractions.spawnFootstepDust(this, this.session.attempt.player.centerX, 576, Math.sign(dir));
        } catch {}
        this.crawlDustTimer = _time + 280;
      }
    }

    if (previous !== this.session.generation) {
      this.restartChapter();
      return;
    }
      let bagChanged = false;
      for (const id of SCALE_IDS) {
        if (before[id] !== 'BAG' && this.session.attempt.locations[id] === 'BAG') {
          // If the item has an active pickup in DiegeticGrab that hasn't started grabbing yet,
          // execute the 3-phase grab animation sequence!
          if (before[id] === 'WORLD' && this.diegeticGrab.getPickupSprite(id)) {
            this.diegeticGrab.executeGrab(id);
          }
          this.selected = id;
          gameState.addItem(id);
          this.updateHeldItem();
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

    // Footstep foley
    const p = this.session.attempt.player;
    if (p.grounded && Math.abs(p.vx) > 10 && Math.random() < 0.05) {
      soundEngine.playFootstepStone();
    }

    // Update held item position to follow Phoe's hand strictly at 524px per character.md
    if (this.heldItemSprite && p) {
      const visualFeetY = vy(p.feetY);
      const visualCenterY = visualFeetY - 40;
      const handX = p.centerX + p.facing * 20;
      const handY = visualCenterY - 12;
      this.heldItemSprite.setPosition(handX, handY);
      this.heldItemSprite.setScale(p.facing * 0.38, 0.38);
    }

    // Atmospheric wind whoosh foley when Kyee-Zee pendulum passes its lowest apex
    const curAngle = this.session.attempt.pendulum.angle;
    if (this.session.attempt.pendulum.active && this.session.attempt.elapsed >= 0.5) {
      if ((this.lastPendulumAngle < 0 && curAngle >= 0) || (this.lastPendulumAngle > 0 && curAngle <= 0)) {
        try { soundEngine.playWoosh(); } catch {}
      }
    }
    this.lastPendulumAngle = curAngle;

    for (const event of events) this.event(event);
    if (this.session.attempt.status === 'DEAD' && !DieAgainDeathOverlay.isActive()) {
      DieAgainDeathOverlay.show({
        scene: this,
        reason: 'PENDULUM',
        autoRetrySeconds: 2.2,
        onRetry: () => this.restartChapter(),
        onMenu: () => {
          DieAgainDeathOverlay.hideActive();
          this.scene.start('MENU');
        }
      });
    }
    this.view.render(this.session.attempt, dt, Boolean(this.heldItemSprite), this.grabControl);
    this.sync();
  }
}
