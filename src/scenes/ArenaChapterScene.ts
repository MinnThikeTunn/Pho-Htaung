import Phaser from 'phaser';
import { A4, ARENA_ART, ARENA_LINES } from '../content/chapter4';
import { C } from '../content/chapter1';
import { arenaHasSlingshot, triggerArenaGoldTrap } from '../domain/arena';
import type { ArenaEvent, ArenaWeapon } from '../domain/arena';
import { ArenaSession } from '../services/ArenaSession';
import { AudioController } from '../services/AudioController';
import { store } from '../services/adventure';
import { SAVE_KEY } from '../services/CampaignStore';
import { ArenaView, VISUAL_GROUND_Y, vy } from '../view/ArenaView';
import InventoryBar from '../ui/InventoryBar.js';
import DiegeticGrab from '../ui/DiegeticGrab';
import { ensureBridgeTextures } from '../view/BridgeView';
import { soundEngine } from '../utils/SoundEngine.js';
import { audioDirector } from '../audio/AudioDirector.js';
import { MicroInteractions } from '../utils/MicroInteractions.js';
import { VirtualTouchControls } from '../ui/VirtualTouchControls';
import { DieAgainDeathOverlay } from '../ui/DieAgainDeathOverlay';
import { toBurmeseNumeral } from '../utils/toBurmeseNumeral';
import { ITEM_NAMES_MY, ITEM_TEXTURE_KEYS } from '../utils/GameState.js';
import { gameState } from '../utils/AdventureState.js';

const ui = () => document.querySelector<HTMLDivElement>('#interface')!;
const button = (id: string, text: string, primary = false) => `<button type="button" id="${id}" class="${primary ? 'primary' : 'secondary'}">${text}</button>`;

export type ShortcutAction = 'sling' | 'attack' | 'dodge' | 'jump' | 'crawl' | 'moveLeft' | 'moveRight';
export type ArenaShortcuts = Record<ShortcutAction, string>;

const SHORTCUTS_STORAGE_KEY = 'phoe-htaung.shortcuts.v1';

export const DEFAULT_ARENA_SHORTCUTS: Readonly<ArenaShortcuts> = Object.freeze({
  sling: 'q',
  attack: 's',
  dodge: 'w',
  jump: ' ',
  crawl: 'c',
  moveLeft: 'a',
  moveRight: 'd',
});

const SHORTCUT_META: ReadonlyArray<{
  action: ShortcutAction;
  title: string;
  desc: string;
  mouseNote?: string;
}> = [
  {
    action: 'sling',
    title: 'လေးခွ ထုတ် / ဆွဲပစ် (Slingshot)',
    desc: 'ဖိထားပြီး ဆွဲချိန် · လွှတ်လျှင် ပစ်မည်',
  },
  {
    action: 'attack',
    title: 'လက်သီးဖြင့် တိုက်ခိုက် (Fist Attack)',
    desc: 'လေးခွမပါချိန် အနီးကပ် လက်သီးထိုး / တွန်းထုတ်ရန်',
    mouseNote: '🖱 Left Click သို့မဟုတ်',
  },
  {
    action: 'dodge',
    title: 'ရှောင်တိမ်းရန် (Dodge / Evade)',
    desc: 'လူဝံ တိုက်ခိုက်ချိန် အမြန်ရှောင်တိမ်းရန်',
  },
  {
    action: 'jump',
    title: 'ခုန်ကျော်ရန် (Jump Pillar)',
    desc: 'ကျောက်တိုင်နှင့် အတားအဆီးပေါ် ခုန်တက်ရန် (သို့မဟုတ် ↑)',
  },
  {
    action: 'crawl',
    title: 'ငုံ့လျှိုသွားရန် (Crawl / Crouch)',
    desc: 'ကျောက်တန်းနှင့် သစ်လုံးအောက် ငုံ့လျှိုရန် (သို့မဟုတ် ↓)',
  },
  {
    action: 'moveLeft',
    title: 'ဘယ်ဘက် ရွေ့ရန် (Move Left)',
    desc: 'ဘယ်ဘက်သို့ ပြေးရန် (သို့မဟုတ် ←)',
  },
  {
    action: 'moveRight',
    title: 'ညာဘက် ရွေ့ရန် (Move Right)',
    desc: 'ညာဘက်သို့ ပြေးရန် (သို့မဟုတ် →)',
  },
];

function formatKeyLabel(key: string): string {
  if (key === ' ') return 'SPACE';
  if (key === 'arrowup') return '↑ UP';
  if (key === 'arrowdown') return '↓ DOWN';
  if (key === 'arrowleft') return '← LEFT';
  if (key === 'arrowright') return '→ RIGHT';
  return key.toUpperCase();
}

function loadArenaShortcuts(): ArenaShortcuts {
  try {
    const raw = localStorage.getItem(SHORTCUTS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_ARENA_SHORTCUTS };
    const parsed = JSON.parse(raw) as Partial<ArenaShortcuts>;
    const merged: ArenaShortcuts = { ...DEFAULT_ARENA_SHORTCUTS };
    for (const k of Object.keys(DEFAULT_ARENA_SHORTCUTS) as ShortcutAction[]) {
      if (typeof parsed[k] === 'string' && parsed[k]!.length > 0) {
        merged[k] = parsed[k]!.toLowerCase();
      }
    }
    return merged;
  } catch {
    return { ...DEFAULT_ARENA_SHORTCUTS };
  }
}

function saveArenaShortcuts(shortcuts: ArenaShortcuts) {
  try {
    localStorage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(shortcuts));
  } catch {}
}

export default class ArenaChapterScene extends Phaser.Scene {
  private session!: ArenaSession; private view!: ArenaView;
  public inventoryBar!: InventoryBar;
  public diegeticGrab!: DiegeticGrab;
  private held = new Set<string>(); private edges = { jump: false, punch: false, dodge: false };
  private finished = false; private failureShown = false; private messageUntil = 0;
  private transitionElapsed = 0; private transitionHandled = false;
  private bagOpen = false;
  private shortcutsModalOpen = false;
  private isInitialShortcutModal = false;
  private rebindingAction: ShortcutAction | null = null;
  private shortcuts: ArenaShortcuts = loadArenaShortcuts();
  private grabControl: string | null = null;
  private heldItemSprite: Phaser.GameObjects.Image | null = null;
  private targetX: number | null = null;
  private pendingAction: (() => void) | null = null;
  private crawlDustTimer = 0;
  private footstepTimer = 0;
  private grabbedStone = false;
  private activePickups = new Set<string>();
  private lastClueKey = ''; private lastClueAt = -99; private idleSeconds = 0;
  private prevApeShotCount = 0;
  private touchControls: VirtualTouchControls | null = null;
  private prevTouchJump = false;
  private prevTouchPunch = false;
  private prevTouchDodge = false;
  constructor() { super('CHAPTER_4'); }
  preload() {
    this.load.image(ARENA_ART.background.key, ARENA_ART.background.path);
    this.load.image(ARENA_ART.apes.key, ARENA_ART.apes.path);
    this.load.spritesheet(ARENA_ART.brownApeSheet.key, ARENA_ART.brownApeSheet.path, {
      frameWidth: ARENA_ART.brownApeSheet.frameWidth,
      frameHeight: ARENA_ART.brownApeSheet.frameHeight,
    });
    this.load.spritesheet(ARENA_ART.brownApeWalk.key, ARENA_ART.brownApeWalk.path, {
      frameWidth: ARENA_ART.brownApeWalk.frameWidth,
      frameHeight: ARENA_ART.brownApeWalk.frameHeight,
    });
  }
  snapshot() { return { attempt: structuredClone(this.session.attempt), paused: this.session.paused, generation: this.session.generation }; }
  init(data: { equipment?: { slingshot: boolean } } = {}) {
    if (!store.campaign.chapter3Completed) throw Error('Chapter 4 is locked');
    // Previous-chapter pickup is another developer's responsibility. Absence is not a grant.
    this.session = new ArenaSession(() => crypto.randomUUID(), arenaHasSlingshot(store.campaign, data.equipment));
    this.bagOpen = false;
    this.shortcutsModalOpen = false;
    this.isInitialShortcutModal = false;
    this.rebindingAction = null;
    this.shortcuts = loadArenaShortcuts();
    this.grabControl = null;
    this.targetX = null;
    this.pendingAction = null;
    this.crawlDustTimer = 0;
    this.grabbedStone = false;
    this.activePickups.clear();
    this.hideHeldItem();
    this.finished = false; this.failureShown = false; this.messageUntil = 0; this.held.clear(); this.edges = { jump: false, punch: false, dodge: false };
    this.lastClueKey = ''; this.lastClueAt = -99; this.idleSeconds = 0; this.prevApeShotCount = 0;
    store.startArena();
  }
  private bind(id: string, fn: () => void) { ui().querySelector(`#${id}`)?.addEventListener('click', () => { try { (soundEngine as any).playPing?.(); } catch {} fn(); }); }
  private audio = new AudioController();
  private focusGame() { this.game.canvas.tabIndex = 0; this.game.canvas.focus({ preventScroll: true }); }
  private clear() {
    this.held.clear();
    this.edges = { jump: false, punch: false, dodge: false };
    this.prevTouchJump = false;
    this.prevTouchPunch = false;
    this.prevTouchDodge = false;
    this.targetX = null;
    this.pendingAction = null;
    this.session.clearInput();
  }
  private hideHeldItem() {
    if (this.heldItemSprite) {
      this.heldItemSprite.destroy();
      this.heldItemSprite = null;
    }
  }
  private updateHeldItem() {
    const a = this.session?.attempt;
    if (!a || this.finished || a.weapon !== 'SLING' || !a.hasSling || this.grabControl || this.bagOpen || a.dodgeLeft > 0) {
      this.hideHeldItem();
      return;
    }
    const p = a.player;
    const direction = a.charge > 0 ? a.aimFacing : p.facing;
    const visualFeetY = vy(p.feetY);
    const visualCenterY = visualFeetY - 40;
    const handX = p.centerX + direction * 20;
    const handY = visualCenterY - 12; // 524px when grounded on 576px baseline per character.md
    const texKey = this.textures.exists('ch2_vector_slingshot') ? 'ch2_vector_slingshot' : 'ch1_vector_cog';
    if (!this.heldItemSprite && this.textures.exists(texKey)) {
      this.heldItemSprite = this.add.image(handX, handY, texKey).setDepth(25);
    }
    if (this.heldItemSprite) {
      this.heldItemSprite.setPosition(handX, handY).setScale(direction * 0.38, 0.38);
    }
  }
  private interactWithProximity(targetX: number, onReach: () => void) {
    if (this.finished || this.session.paused || this.failureShown) return;
    const px = this.session.attempt.player.centerX;
    if (Math.abs(px - targetX) <= 95) {
      onReach();
    } else {
      this.targetX = targetX;
      this.pendingAction = onReach;
    }
  }
  private performCharacterGrab(onComplete?: () => void) {
    if (this.finished || this.session.paused || this.failureShown || this.grabControl) return;
    this.grabControl = 'PICKUP';
    try { soundEngine.playPickup(); } catch {}
    this.sync();
    this.time?.delayedCall?.(180, () => {
      if (this.finished || this.failureShown) {
        this.grabControl = null;
        return;
      }
      this.grabControl = 'RUMMAGE';
      try { soundEngine.playLongyiRustle(); } catch {}
      this.sync();
      this.time?.delayedCall?.(220, () => {
        this.grabControl = null;
        const actor = this.view?.getActorSprite();
        if (actor) {
          const baseScale = Math.abs(actor.scaleY || 0.094);
          this.tweens.add({
            targets: actor,
            scaleY: baseScale * 1.08,
            scaleX: baseScale * 0.94,
            duration: 120,
            yoyo: true,
            ease: 'Back.Out',
          });
        }
        onComplete?.();
        this.sync();
      });
    });
  }
  private detonateGoldTrap() {
    if (this.finished || this.failureShown) return;
    if (!triggerArenaGoldTrap(this.session.attempt)) return;
    try {
      if (typeof (soundEngine as any).playExplosion === 'function') {
        (soundEngine as any).playExplosion();
      } else if (typeof (soundEngine as any).playImpact === 'function') {
        (soundEngine as any).playImpact();
      }
    } catch {}
    this.view?.triggerGoldExplosion(A4.goldTrapX, VISUAL_GROUND_Y - 22);
    this.speak(ARENA_LINES.greedTaunt, 6.0, 'direct', 'ဦးကြီး');
    this.sync();
    // Show failure modal after brief explosion visual beat
    this.time?.delayedCall?.(360, () => {
      this.event('failed');
      this.sync();
    });
  }
  private speak(text: string, seconds = 3.5, key = 'direct', speaker = 'ဦးကြီး') {
    let cleanText = text.trim();
    const prefixMatch = cleanText.match(/^(ဦးကြီး|ဖိုးထောင်)\s*[:—–-]\s*/);
    if (prefixMatch) {
      if (!speaker || speaker === 'ဦးကြီး') {
        speaker = prefixMatch[1]!;
      }
      cleanText = cleanText.slice(prefixMatch[0].length).trim();
    }
    const now = this.session?.attempt?.elapsed ?? 0;
    this.messageUntil = now + seconds;
    this.lastClueKey = key;
    this.lastClueAt = now;
    const el = ui().querySelector<HTMLElement>('#arena-message');
    if (el) {
      const sp = el.querySelector<HTMLElement>('span');
      if (sp) sp.textContent = speaker;
      const p = el.querySelector<HTMLElement>('#arena-message-text');
      if (p) p.textContent = cleanText;
      else el.textContent = cleanText;
      el.hidden = false;
      try { (soundEngine as any).playVoiceBlip?.(); } catch {}
    }
  }
  private cue(key: string, text: string, seconds = 2.6, cooldown = 3.5) {
    const now = this.session.attempt.elapsed;
    if (key === this.lastClueKey && now - this.lastClueAt < cooldown) return;
    if (now < this.messageUntil && this.lastClueKey === 'direct') return;
    this.speak(text, seconds, key);
  }
  create() {
    this.audio.attach(this);
    try {
      soundEngine.init?.();
      if (!(soundEngine as any).muted) {
        soundEngine.startBGM?.();
        audioDirector.setMuted(false);
        audioDirector.startStems(0.20, 0.16, 0.14);
      }
    } catch {}
    ensureBridgeTextures(this);
    gameState.checkpointChapter('CHAPTER_4');
    this.view = new ArenaView(this);

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
            texture: this.textures.exists('ch2_vector_slingshot') ? 'ch2_vector_slingshot' : 'ch1_vector_cog'
          });
        }
        const carried = store.campaign?.inventory || [];
        for (const it of carried) {
          if (it !== 'slingshot') {
            items.push({
              key: it,
              id: it,
              name: (ITEM_NAMES_MY as Record<string, string>)[it] || it,
              selected: false,
              texture: (ITEM_TEXTURE_KEYS as Record<string, string>)[it] || 'ch1_vector_cog'
            });
          }
        }
        return items;
      },
      onItemClick: (item: any) => {
        if (item.id === 'FISTS' || item.id === 'SLING') {
          const weapon = item.id as ArenaWeapon;
          if (this.session.equipWeapon(weapon)) {
            if (this.bagOpen) this.pause(false);
            this.speak(weapon === 'SLING' ? 'လောက်လေးခွ ထုတ်ပြီးပြီ — ဆွဲချိန်ပြီး လွှတ်ပစ်ပေတော့!' : 'လက်ချည်းပဲ — အနားကပ် တွန်းထုတ်ပြီး ရှောင်ကစားပေတော့!');
            this.sync();
            this.focusGame();
          }
        }
      }
    });

    // Standardized 3-Phase Diegetic Grab with Actor Adapter per character.md
    this.diegeticGrab = new DiegeticGrab(this, {
      inventoryBar: this.inventoryBar,
      getActor: () => {
        const p = this.session?.attempt?.player;
        if (!p) return null;
        const visualFeetY = vy(p.feetY);
        return {
          x: p.centerX,
          y: visualFeetY - 40, // 536px visual center on ground
          facing: p.facing,
          setControl: (ctrl: string) => {
            this.grabControl = ctrl === 'FREE' ? null : ctrl;
          },
          bounce: () => {
            const actor = this.view?.getActorSprite();
            if (actor) {
              const baseScale = Math.abs(actor.scaleY || 0.094);
              this.tweens.add({
                targets: actor,
                scaleY: baseScale * 1.08,
                scaleX: baseScale * 0.94,
                duration: 120,
                yoyo: true,
                ease: 'Back.Out'
              });
            }
          }
        };
      },
      speak: (text, duration) => this.speak(text, duration ?? 2.4),
      onAutoWalk: (targetX, onReach) => this.interactWithProximity(targetX, onReach)
    });

    this.touchControls = new VirtualTouchControls(this, {
      mode: 'CH4',
      onJump: () => {
        if (this.finished || this.session.paused || this.failureShown) return;
        this.edges.jump = true;
        this.idleSeconds = 0;
        try { (soundEngine as any).playJump?.(); } catch {}
      },
      onPunch: () => {
        if (this.finished || this.session.paused || this.failureShown) return;
        if (this.session.attempt.weapon !== 'FISTS' && this.session.attempt.charge === 0) {
          this.session.equipWeapon('FISTS');
        }
        this.edges.punch = true;
        this.idleSeconds = 0;
      },
      onDodge: () => {
        if (this.finished || this.session.paused || this.failureShown) return;
        this.edges.dodge = true;
        this.idleSeconds = 0;
        try { (soundEngine as any).playWoosh?.(); } catch {}
      },
      onSlingDown: () => {
        if (this.finished || this.session.paused || this.failureShown) return;
        if (!this.session.hasSling) {
          this.speak(ARENA_LINES.idleFists);
          return;
        }
        if (this.session.attempt.weapon !== 'SLING') {
          this.session.equipWeapon('SLING');
          this.sync();
        }
        this.idleSeconds = 0;
      },
    });

    const onWorldClick = (pointer: Phaser.Input.Pointer) => {
      if (this.finished || this.session.paused || this.failureShown) return;
      const hitObjs = this.input.manager.hitTest(pointer, this.children.list, this.cameras.main);
      if (hitObjs.some((obj: any) => (obj.depth >= 200 || obj.parentContainer?.depth >= 200))) {
        return;
      }
      if (this.shortcutsModalOpen) {
        if (this.isInitialShortcutModal && !this.rebindingAction) {
          this.closeShortcutModal();
        } else {
          return;
        }
      }
      const x = pointer.worldX;
      const y = pointer.worldY;
      // Check click on the Gold Pouch Greed Trap after defeating both apes
      if (
        this.session.attempt.combatWon &&
        !this.session.attempt.goldTrapExploded &&
        Math.abs(x - A4.goldTrapX) <= 68 &&
        Math.abs(y - (VISUAL_GROUND_Y - 18)) <= 68
      ) {
        if (Math.abs(this.session.attempt.player.centerX - A4.goldTrapX) <= 95) {
          this.performCharacterGrab(() => this.detonateGoldTrap());
        } else {
          this.interactWithProximity(A4.goldTrapX, () =>
            this.performCharacterGrab(() => this.detonateGoldTrap())
          );
        }
        return;
      }
      // Traditional game Mouse Left Click bare-fist attack when not clicking a stone pile
      if (pointer.button === 0 || pointer.wasTouch) {
        const p = this.session.attempt.player;
        if (Math.abs(x - p.centerX) > 12) {
          p.facing = x < p.centerX ? -1 : 1;
        }
        if (this.session.attempt.weapon !== 'FISTS' && this.session.attempt.charge === 0) {
          this.session.equipWeapon('FISTS');
        }
        this.edges.punch = true;
        this.idleSeconds = 0;
      }
    };
    this.input.on('pointerdown', onWorldClick);

    ui().innerHTML = `<div class="hud"><div class="stage-title"><span class="eyebrow">အခန်း ၄ / ACTION</span><strong>လူဝံအစောင့်နှစ်ကောင်</strong></div><div class="arena-weapon-hud"><span id="arena-charge-label">လက်ချည်း</span><progress id="arena-charge" max="1" value="0" aria-label="လောက်လေးခွ ဆွဲအား" hidden></progress></div><div class="ledger"><div><span>တံခါးမပိတ်မီ</span><b id="arena-time">75 s</b></div><div><span>အသက်ကျန်</span><b id="arena-hp-text">3 / 3</b></div><div><span>ကျောက်ခဲ</span><b id="arena-ammo">12</b></div></div><button id="arena-pause" class="icon-button" aria-label="Pause">Ⅱ</button></div>
      <div class="speech arena-speech visible" id="arena-message" aria-live="polite"><span>ဦးကြီး</span><p id="arena-message-text"></p></div>
      <div id="arena-unsaved" class="unsaved-status" hidden>ယာယီ session · save မသိမ်းရသေးပါ</div><div id="arena-modal" class="modal" hidden></div><div id="arena-shortcuts-modal" class="modal shortcut-modal-backdrop" style="pointer-events:none" hidden></div>`;
    const pauseButton = ui().querySelector('#arena-pause')!;
    pauseButton.insertAdjacentHTML(
      'beforebegin',
      '<button type="button" id="arena-bag" class="icon-button bag-icon-btn" aria-label="လွယ်အိတ်">🎒</button>'
    );
    this.bind('arena-bag', () => {
      if (this.shortcutsModalOpen) this.closeShortcutModal(false);
      this.openBag();
    });
    this.bind('arena-pause', () => {
      if (this.shortcutsModalOpen) this.closeShortcutModal(false);
      this.pause(!this.session.paused);
    });
    this.speak(ARENA_LINES.entry, 4.5);

    const onDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      const key = event.key.toLowerCase();

      // Handle live key rebinding inside the Shortcut Customization modal
      if (this.shortcutsModalOpen && this.rebindingAction) {
        event.preventDefault();
        if (key === 'escape') {
          this.rebindingAction = null;
          this.renderShortcutModal();
          return;
        }
        if (['shift', 'control', 'alt', 'meta', 'tab', 'enter'].includes(key)) return;
        const targetAction = this.rebindingAction;
        const prevKey = this.shortcuts[targetAction];
        // Swap if another action already uses this key
        for (const act of Object.keys(this.shortcuts) as ShortcutAction[]) {
          if (act !== targetAction && this.shortcuts[act] === key) {
            this.shortcuts[act] = prevKey;
          }
        }
        this.shortcuts[targetAction] = key;
        saveArenaShortcuts(this.shortcuts);
        this.rebindingAction = null;
        this.renderShortcutModal();
        return;
      }

      if (this.shortcutsModalOpen) {
        if (key === 'enter' || (key === 'escape' && !this.isInitialShortcutModal)) {
          event.preventDefault();
          this.closeShortcutModal();
          return;
        }
        if (this.isInitialShortcutModal) {
          this.closeShortcutModal(false);
        } else {
          return;
        }
      }

      if ((key === 'b' || key === 'tab') && !event.repeat && !this.finished && !this.failureShown) {
        event.preventDefault();
        if (this.bagOpen) {
          this.inventoryBar?.hide();
          this.pause(false);
        } else {
          this.openBag();
        }
        return;
      }
      if ((key === '1' || key === '2') && !event.repeat && !this.finished && !this.failureShown) {
        event.preventDefault();
        const targetWeapon: ArenaWeapon = key === '2' ? 'SLING' : 'FISTS';
        if (this.session.equipWeapon(targetWeapon)) {
          if (this.bagOpen) this.pause(false);
          this.speak(targetWeapon === 'SLING' ? 'လောက်လေးခွ ထုတ်ပြီးပြီ — ဆွဲချိန်ပြီး လွှတ်ပစ်ပေတော့!' : 'လက်ချည်းပဲ — အနားကပ် တွန်းထုတ်ပြီး ရှောင်ကစားပေတော့!');
          this.sync();
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

      const s = this.shortcuts;
      const isMoveOrActionKey = [
        s.moveLeft,
        s.moveRight,
        s.sling,
        s.attack,
        s.dodge,
        s.jump,
        s.crawl,
        'a',
        'd',
        'w',
        's',
        'c',
        'q',
        'e',
        'j',
        'k',
        'l',
        'r',
        ' ',
        'arrowleft',
        'arrowright',
        'arrowup',
        'arrowdown',
      ].includes(key);

      if (
        [
          s.moveLeft,
          s.moveRight,
          s.jump,
          s.crawl,
          'a',
          'd',
          'arrowleft',
          'arrowright',
          'arrowup',
          'arrowdown',
          ' ',
        ].includes(key)
      ) {
        // Norman's Law: Instant action canceling on locomotion
        this.targetX = null;
        this.pendingAction = null;
        if (this.inventoryBar?.isRevealed) {
          this.inventoryBar.hide();
        }
      }
      if (this.finished || this.session.paused || !isMoveOrActionKey) return;
      event.preventDefault();
      if (event.repeat) return;
      this.idleSeconds = 0;

      // Universal verb E: perform character grab animation (and trigger Gold Pouch Greed Trap if nearby)
      if (key === 'e') {
        const p = this.session.attempt.player;
        if (
          this.session.attempt.combatWon &&
          !this.session.attempt.goldTrapExploded &&
          Math.abs(p.centerX - A4.goldTrapX) <= 115
        ) {
          this.performCharacterGrab(() => this.detonateGoldTrap());
          return;
        }
        this.performCharacterGrab(() => {
          const nearPile = A4.refillX.some(rx => Math.abs(p.centerX - rx) <= 95);
          if (nearPile && this.session.attempt.hasSling) {
            this.session.attempt.ammo = A4.ammo;
            this.session.attempt.refill = 0;
            this.speak('ကျောက်ခဲ ပြန်ဖြည့်ပြီးပြီဟေ့!');
          }
        });
        return;
      }

      if (key === s.crawl || key === 'arrowdown') {
        try { soundEngine.playLongyiRustle(); } catch {}
      }

      // Slingshot key ('Q' by default): auto-equips SLING if owned and holds to charge/shoot
      if (key === s.sling) {
        if (!this.session.hasSling) {
          this.speak(ARENA_LINES.idleFists);
          return;
        }
        if (this.session.attempt.weapon !== 'SLING') {
          this.session.equipWeapon('SLING');
          this.sync();
        }
        this.held.add(key);
        return;
      }

      // Legacy 'K' key: requires SLING already equipped via bag
      if (key === 'k' && this.session.attempt.weapon !== 'SLING') {
        this.speak(this.session.hasSling ? ARENA_LINES.idleWithSling : ARENA_LINES.idleFists);
        return;
      }

      if (!event.repeat) {
        try {
          soundEngine.init?.();
          if (soundEngine.ctx && soundEngine.ctx.state === 'suspended') soundEngine.ctx.resume();
        } catch {}
        if (key === s.jump || key === 'arrowup') {
          this.edges.jump = true;
          try { (soundEngine as any).playJump?.(); } catch {}
        }
        if (key === s.attack || key === 'j') {
          if (this.session.attempt.weapon !== 'FISTS' && this.session.attempt.charge === 0 && key === s.attack) {
            this.session.equipWeapon('FISTS');
          }
          this.edges.punch = true;
        }
        if (key === s.dodge || key === 'l') {
          this.edges.dodge = true;
          try { (soundEngine as any).playWoosh?.(); } catch {}
        }
      }
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
    this.events.once('shutdown', () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', blur);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('storage', storage);
      this.input.off('pointerdown', onWorldClick);
      this.touchControls?.destroy();
      this.touchControls = null;
      this.hideHeldItem();
      this.diegeticGrab?.clear();
      this.activePickups.clear();
      this.clear();
      audioDirector.stopWalking();
    });
    this.sync(); this.focusGame();
  }
  private openShortcutModal(isInitialStart = false) {
    if (this.finished || this.failureShown || store.conflict) return;
    this.shortcutsModalOpen = true;
    this.isInitialShortcutModal = isInitialStart;
    this.rebindingAction = null;
    this.touchControls?.hide();
    if (!isInitialStart) {
      this.bagOpen = false;
      this.inventoryBar?.hide();
      this.session.setPause(true);
      this.clear();
      const pauseModal = ui().querySelector<HTMLDivElement>('#arena-modal');
      if (pauseModal) {
        pauseModal.hidden = true;
        pauseModal.innerHTML = '';
      }
    }
    this.renderShortcutModal();
  }
  private renderShortcutModal() {
    const el = ui().querySelector<HTMLDivElement>('#arena-shortcuts-modal');
    if (!el) return;
    el.hidden = false;
    const rowsHtml = SHORTCUT_META.map(item => {
      const isListening = this.rebindingAction === item.action;
      const keyLabel = isListening ? 'နှိပ်ပါ...' : formatKeyLabel(this.shortcuts[item.action]);
      return `<div class="shortcut-row ${isListening ? 'listening' : ''}">
        <div class="shortcut-info">
          <strong>${item.title}</strong>
          <small>${item.desc}</small>
        </div>
        <div class="shortcut-controls">
          ${item.mouseNote ? `<span class="shortcut-mouse-label">${item.mouseNote}</span>` : ''}
          <button type="button" class="shortcut-key-btn" data-shortcut-action="${item.action}" aria-label="${item.title} ခလုတ် ပြင်ဆင်ရန်">${keyLabel}</button>
        </div>
      </div>`;
    }).join('');

    el.innerHTML = `<section class="dialog shortcut-dialog" style="pointer-events:auto" role="dialog" aria-modal="true" aria-labelledby="arena-shortcuts-title">
      <span class="eyebrow">CONTROL & SHORTCUT CUSTOMIZATION</span>
      <h2 id="arena-shortcuts-title">⌨ ခလုတ်များ လမ်းညွှန် နှင့် ပြင်ဆင်ရန်</h2>
      <p class="shortcut-subtitle">လေးခွအား equip လုပ်ပြီး ပစ်ရန် <b>"Q"</b> ၊ လေးခွမပါချိန် လက်သီးဖြင့် တိုက်ခိုက်ရန် <b>"Mouse Left Click"</b> သို့မဟုတ် <b>"S"</b> ၊ ရှောင်တိမ်းရန် <b>"W"</b> သို့ ပြောင်းလဲထားပါသည်။ ပြင်လိုသော ခလုတ်ကို နှိပ်ပြီး စိတ်ကြိုက် ပြောင်းလဲနိုင်ပါသည်။</p>
      <div class="shortcut-grid">${rowsHtml}</div>
      <div class="actions">
        <button type="button" id="arena-shortcuts-go" class="primary">Go · စကစားမယ်</button>
        <button type="button" id="arena-shortcuts-reset" class="secondary">မူလအတိုင်း ပြန်ထားမယ် (Reset)</button>
      </div>
    </section>`;

    el.querySelectorAll<HTMLButtonElement>('[data-shortcut-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-shortcut-action') as ShortcutAction;
        this.rebindingAction = this.rebindingAction === action ? null : action;
        this.renderShortcutModal();
      });
    });

    this.bind('arena-shortcuts-reset', () => {
      this.shortcuts = { ...DEFAULT_ARENA_SHORTCUTS };
      saveArenaShortcuts(this.shortcuts);
      this.rebindingAction = null;
      this.renderShortcutModal();
    });
    this.bind('arena-shortcuts-go', () => this.closeShortcutModal(true));
  }
  private closeShortcutModal(unpauseAndFocus = true) {
    this.shortcutsModalOpen = false;
    this.isInitialShortcutModal = false;
    this.rebindingAction = null;
    const el = ui().querySelector<HTMLDivElement>('#arena-shortcuts-modal');
    if (el) {
      el.hidden = true;
      el.innerHTML = '';
    }
    if (unpauseAndFocus) {
      if (this.session.paused) this.session.setPause(false);
      this.touchControls?.show();
      this.focusGame();
      this.sync();
    }
  }
  private openBag() {
    if (this.finished || this.failureShown || store.conflict) return;
    if (this.shortcutsModalOpen) this.closeShortcutModal(false);
    this.touchControls?.hide();
    this.inventoryBar?.reveal();
    try { (soundEngine as any).playBagRustle?.(); } catch {}
    this.pause(true); this.bagOpen = true;
    const a = this.session.attempt, el = ui().querySelector<HTMLDivElement>('#arena-modal')!;
    el.innerHTML = `<section class="dialog arena-bag-panel" role="dialog" aria-modal="true" aria-labelledby="arena-bag-title"><h2 id="arena-bag-title">🎒 လွယ်အိတ်</h2><p>အိတ်ဖွင့်ထားချိန် တိုက်ပွဲရပ်ထားသည်။ သုံးမယ့်အရာကို ရွေးပါ။</p><div class="actions"><button type="button" id="arena-bag-fists" class="secondary" aria-pressed="${a.weapon === 'FISTS'}">လက်ချည်းသုံးမယ်</button>${a.hasSling ? `<button type="button" id="arena-bag-sling" class="primary" aria-pressed="${a.weapon === 'SLING'}">လောက်လေးခွ ထုတ်သုံးမယ်</button>` : ''}</div>${a.hasSling ? '' : '<p id="arena-bag-empty">အိတ်ထဲမှာ လောက်လေးခွ မပါလာဘူး။ လက်ချည်းနဲ့ ဆက်ချနိုင်သည်။</p>'}<div class="actions">${button('arena-bag-close','အိတ်ပိတ်မယ်')}</div></section>`;
    const equip = (weapon: ArenaWeapon) => {
      if (!this.session.equipWeapon(weapon)) return;
      this.inventoryBar?.hide();
      try { (soundEngine as any).playBagRustle?.(); } catch {}
      this.pause(false); this.speak(weapon === 'SLING' ? 'လောက်လေးခွ ထုတ်ပြီးပြီ — ဆွဲချိန်ပြီး လွှတ်ပစ်ပေတော့!' : 'လက်ချည်းပဲ — အနားကပ် တွန်းထုတ်ပြီး ရှောင်ကစားပေတော့!'); this.sync();
    };
    this.bind('arena-bag-fists',()=>equip('FISTS')); this.bind('arena-bag-sling',()=>equip('SLING'));
    this.bind('arena-bag-close',()=>{ this.inventoryBar?.hide(); try { (soundEngine as any).playBagRustle?.(); } catch {} this.pause(false); }); this.sync();
    el.querySelector<HTMLButtonElement>('#arena-bag-fists')?.focus({preventScroll:true});
  }
  private pause(value: boolean) {
    if (store.conflict && !value) return;
    if (this.shortcutsModalOpen) this.closeShortcutModal(false);
    if (!value) this.inventoryBar?.hide();
    if (value) this.touchControls?.hide(); else this.touchControls?.show();
    this.bagOpen = false; this.session.setPause(value); this.clear(); const el = ui().querySelector<HTMLDivElement>('#arena-modal'); if (!el) return;
    el.hidden = !value;
    el.innerHTML = `<section class="dialog"><h2>ခဏနားမယ်</h2><p>အစမှာ လက်ချည်းပဲ။ လောက်လေးခွပါလာလျှင် လွယ်အိတ်ဖွင့်ပြီး ထုတ်သုံးနိုင်သည်။ ဦးကြီး၏ အသံနှင့် အရိပ်အယောင်များကို သတိထားပါ။</p><div class="actions">${button('arena-resume','ဆက်ကစားမယ်',true)}${button('arena-menu','ပင်မစာမျက်နှာ')}</div></section>`;
    this.bind('arena-resume',()=>this.pause(false));
    this.bind('arena-menu',()=>this.scene.start('MENU'));
    this.sync();
  }
  private restart() {
    if (store.conflict) return;
    gameState.restoreChapterOnFailure('CHAPTER_4');
    this.inventoryBar?.refresh();
    this.inventoryBar?.clearSelected();
    this.session.restart(); this.session.setPause(false); this.failureShown = false; this.bagOpen = false;
    if (this.shortcutsModalOpen) this.closeShortcutModal(false);
    this.touchControls?.show();
    this.grabControl = null; this.grabbedStone = false; this.hideHeldItem(); this.clear();
    this.lastClueKey = ''; this.lastClueAt = -99; this.idleSeconds = 0; this.prevApeShotCount = 0;
    const el = ui().querySelector<HTMLDivElement>('#arena-modal'); if (el) { el.hidden = true; el.innerHTML = ''; }
    this.speak(ARENA_LINES.entry, 4.5); this.focusGame(); this.sync();
  }
  private event(kind: ArenaEvent) {
    if (kind === 'empty') this.speak(ARENA_LINES.empty);
    if (kind === 'punch') {
      try {
        if (typeof (soundEngine as any).playStickWhack === 'function') {
          (soundEngine as any).playStickWhack();
        } else if (typeof (soundEngine as any).playWoosh === 'function') {
          (soundEngine as any).playWoosh();
        }
      } catch {}
    }
    if (kind === 'hit') {
      try {
        if (typeof (soundEngine as any).playBonk === 'function') {
          (soundEngine as any).playBonk();
        }
      } catch {}
    }
    if (kind === 'down') {
      try {
        if (typeof (soundEngine as any).playBonk === 'function') {
          (soundEngine as any).playBonk();
        }
      } catch {}
    }
    if (kind === 'dodge') {
      try { (soundEngine as any).playWoosh?.(); } catch {}
    }
    if (kind === 'hurt') {
      try {
        (soundEngine as any).playMumbledGrunt?.('phoe_htaung');
        (soundEngine as any).playBonk?.();
      } catch {}
      this.speak(this.session.attempt.weapon === 'SLING' ? 'ဒဏ်ထိလို့ ဆွဲအားပျက်ပြီ — ရှောင်ပြီးမှ ပြန်ချိန်ပစ်ပါ!' : 'ဒဏ်ထိသွားပြီ — အချိန်မှန် ခုန်ရှောင်ပါ!', 2.2);
    }
    if (kind === 'shove') {
      try { (soundEngine as any).playWoosh?.(); } catch {}
      this.speak(this.session.attempt.weapon === 'SLING' ? 'ခွာထုတ်လိုက်ပြီ — အခု အမြန် ဆွဲပစ်ဖို့ အချိန်ရပြီ!' : this.session.hasSling ? 'ခွာထုတ်လိုက်ပြီ — လွယ်အိတ်ဖွင့်ပြီး လောက်လေးခွ ထုတ်နိုင်ပြီ!' : 'ခွာထုတ်လိုက်ပြီ — ပြန်တိုက်ခိုက်ချိန်ကို ကြည့်ပြီး ရှောင်ပါ!', 2.0);
    }
    if (kind === 'shot') {
      try { (soundEngine as any).playWoosh?.(); } catch {}
    }
    if (kind === 'friendly_fire') {
      try { (soundEngine as any).playBonk?.(); } catch {}
      this.cameras?.main?.shake(110, 0.0038);
      this.speak(ARENA_LINES.friendlyFire, 2.8);
    }
    if (kind === 'brawl') {
      try {
        if (typeof (soundEngine as any).playStickWhack === 'function') {
          (soundEngine as any).playStickWhack();
        } else if (typeof (soundEngine as any).playImpact === 'function') {
          (soundEngine as any).playImpact();
        }
      } catch {}
      this.cameras?.main?.shake(180, 0.007);
      this.speak(ARENA_LINES.brawl, 3.6);
    }
    if (kind === 'obstacle_outplay') {
      try { (soundEngine as any).playBonk?.(); } catch {}
      this.speak(ARENA_LINES.obstacleOutplay, 3.0);
    }
    if (kind === 'obstacle_drop') {
      this.cue('obstacle-drop', ARENA_LINES.obstacleDrop, 2.5, 4.5);
    }
    if (kind === 'ape_roar') {
      this.cameras?.main?.shake(140, 0.0035);
    }
    if (kind === 'arch_deflect' || kind === 'arch_hit') {
      try {
        if (typeof (soundEngine as any).playClang === 'function') {
          (soundEngine as any).playClang();
        } else if (typeof (soundEngine as any).playBonk === 'function') {
          (soundEngine as any).playBonk();
        }
      } catch {}
      this.cameras?.main?.shake(80, 0.003);
      this.speak('ကျောက်တန်းကြီးက ခိုင်မာတယ်ဟေ့! လူဝံတွေ ခဲပစ်ရင် အောက်ငုံ့ပြီး ပုန်းနေလိုက်စမ်း!', 2.8);
    }
    if (kind === 'refill') {
      try { soundEngine.playPickup(); } catch {}
      this.speak('ကျောက်ခဲ ပြန်ဖြည့်ပြီးပြီဟေ့!');
      this.performCharacterGrab();
    }
    if (kind === 'won') {
      try { (soundEngine as any).playVictoryFanfare?.(); } catch {}
      const route = this.session.attempt.winRoute;
      const wonLine =
        route === 'SPEEDRUN_BYPASS'
          ? ARENA_LINES.speedrunWon
          : ARENA_LINES.won;
      this.speak(wonLine, Infinity);
    }
    if (kind === 'failed') {
      try { soundEngine.playDeath?.(); } catch {}
      if (this.failureShown) return;
      gameState.restoreChapterOnFailure('CHAPTER_4');
      this.inventoryBar?.refresh();
      this.inventoryBar?.clearSelected();
      if (this.session.attempt.failure === 'HEALTH' || this.session.attempt.failure === 'GREED_TRAP') {
        store.death(`arena:${this.session.attempt.id}`);
      }
      this.failureShown = true; this.touchControls?.hide(); this.clear(); const el = ui().querySelector<HTMLDivElement>('#arena-modal'); if (el) el.hidden = true;
      const isGreed = this.session.attempt.failure === 'GREED_TRAP';
      const reason = isGreed ? 'GREED_TRAP' : this.session.attempt.failure === 'TIME' ? 'TIME' : 'HEALTH';
      const title = isGreed
        ? '💥 ရွှေထုပ် ပေါက်ကွဲသွားပြီ!'
        : this.session.attempt.failure === 'TIME'
        ? 'တံခါးပိတ်သွားပြီ'
        : 'ဒီတစ်ခါ ရှုံးသွားပြီ';
      const advice = isGreed
        ? `ဦးကြီး — ${ARENA_LINES.greedTaunt} (လူဝံနှစ်ကောင်ကို အနိုင်ယူပြီးမှ ရွှေထုပ်ထောင်ချောက်ကို ကောက်မိလို့ ပေါက်ကွဲပြီး အသက်ဆုံးရှုံးသွားသည်။)`
        : !this.session.hasSling
        ? 'လက်ချည်းပဲ ပါလာတယ်။ အနားကပ် တွန်းထုတ်ပြီး အချိန်မှန် ခုန်ရှောင်ပါ။'
        : this.session.attempt.weapon === 'FISTS'
        ? 'လောက်လေးခွက လွယ်အိတ်ထဲမှာ ရှိတယ်။ နောက်တစ်ကြိမ် အိတ်ဖွင့်ပြီး ထုတ်သုံးနိုင်သည်။'
        : this.session.attempt.failure === 'TIME'
        ? ARENA_LINES.timeout
        : ARENA_LINES.health;
      DieAgainDeathOverlay.show({
        scene: this,
        reason,
        customTitle: title,
        customRoast: advice,
        retryLabel: '🔄 ပြန်စမ်းမယ် / RETRY',
        autoRetrySeconds: 2.5,
        onRetry: () => this.restart(),
        onMenu: () => this.scene.start('MENU')
      });
    }
    if (kind === 'complete') { store.completeArena(this.session.attempt); this.finished = true; this.hideHeldItem(); this.clear(); this.result(); }
  }
  private result() {
    this.touchControls?.hide();
    this.transitionElapsed = 0;
    this.transitionHandled = false;
    const r = store.campaign.lastChapter4Result;
    const route = this.session?.attempt?.winRoute ?? r?.winRoute ?? 'CANONICAL';
    const routeLabel =
      route === 'SPEEDRUN_BYPASS'
        ? 'အပြေးလမ်း (Speedrun Bypass)'
        : 'တိုက်ခိုက်ရေးလမ်း (လောက်လေးခွ)';
    const deathBurmese = toBurmeseNumeral(store.campaign.deathCount);
    ui().innerHTML = `
      <section class="result-panel">
        <span class="eyebrow">အခန်း ၄ ပြီးပါပြီ → အခန်း ၅ ဆီသို့ / CHAPTER 4 CLEARED</span>
        <h1>ရာဇပလ္လင် ဉာဏ်စမ်းခန်းဆီသို့</h1>
        <p class="intro">ရှေးဟောင်းမြို့တော်ရဲ့ အတွင်းတံခါးဘက် ဆက်သွားနိုင်ပြီ။</p>
        <div class="result-stats">
          <div><span>ယခုအခန်း</span><b>အခန်း ၄</b></div>
          <div><span>နောက်အခန်း</span><b>အခန်း ၅</b></div>
          <div><span>စုစုပေါင်း သေဆုံးမှု</span><b>${deathBurmese} ကြိမ်</b></div>
          <div><span>ကျန်သွေး</span><b>${r?.remainingHealth ?? 0}<small>/3</small></b></div>
          <div><span>တိုက်ပွဲချိန်</span><b>${r?.activeSeconds.toFixed(2) ?? '—'}<small>s</small></b></div>
          <div><span>သိမ်းပြီးရွှေ</span><b>${store.campaign.walletCoins}</b></div>
          <div><span>အောင်မြင်သည့်လမ်း</span><b>${routeLabel}</b></div>
        </div>
        <p class="result-note">လူဝံကြီးများကို အောင်နိုင်ပြီးနောက် နန်းတော်၏ အလယ်ဗဟို ရာဇပလ္လင်ခန်းမကြီးဆီသို့ ရောက်ရှိလာခဲ့သည်။ ဦးကြီးက စောင့်နေသည်။</p>
        ${store.unsaved ? '<p class="warning">Save မသိမ်းရသေးပါ။ Reload လုပ်ပါက ယာယီ progress ပျောက်နိုင်သည်။</p>' : ''}

        <div class="transition-countdown-container" id="arena-countdown">
          <div class="transition-countdown-bar">
            <div class="transition-countdown-fill" id="arena-countdown-fill"></div>
          </div>
          <span class="transition-countdown-label" id="arena-countdown-label">⏱️ အခန်း ၅ သို့ ဆက်လက်ထွက်ခွာနေသည်… (Space / Click ဖြင့် ကျော်နိုင်သည်)</span>
        </div>

        <div class="transition-actions">
          <button type="button" id="btn-next-ch5" class="fm-btn fm-primary transition-advance-btn">
            <span class="fm-btn-label">အခန်း ၅ စတင်မည်</span>
            <small>PROCEED TO CHAPTER 5 →</small>
          </button>
        </div>

        <!-- Clean surface trigger for instant advance & test compatibility -->
        <button type="button" id="arena-next" class="transition-click-surface" aria-label="Next Chapter"></button>
      </section>`;

    const goNext = () => {
      if (this.transitionHandled) return;
      this.transitionHandled = true;
      this.scene.start('CHAPTER_5', { equipment: { slingshot: this.session.hasSling } });
    };

    this.bind('arena-next', goNext);
    this.bind('btn-next-ch5', goNext);

    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener('keydown', onKeydown);
    this.events.once('shutdown', () => {
      window.removeEventListener('keydown', onKeydown);
    });
  }
  private updateContextClues(dt: number) {
    const a = this.session.attempt;
    if (this.session.paused || this.bagOpen || this.failureShown || a.combatWon) return;
    const activeInput = this.held.size > 0;
    if (activeInput) this.idleSeconds = 0;
    else this.idleSeconds += dt;

    if (a.status === 'ACTIVE') {
      const meleeWindup = a.apes.find(e => e.hp > 0 && e.type === 'MELEE' && e.phase === 'WINDUP');
      const throwWindup = a.apes.find(e => e.hp > 0 && e.type === 'THROWER' && e.phase === 'WINDUP');
      const openApe = a.apes.find(e => e.hp > 0 && (e.phase === 'RECOVER' || e.phase === 'STUN'));
      const nearPile = a.hasSling && a.ammo < A4.ammo && A4.refillX.some(rx => Math.abs(a.player.centerX - rx) <= 95);
      const nearArch = Math.abs(a.player.centerX - A4.archX) <= 72 && a.player.control !== 'LAYING';

      if (meleeWindup) {
        this.cue('melee-windup', ARENA_LINES.meleeWindup, 2.0, 2.8);
        return;
      }
      if (throwWindup) {
        this.cue('throw-windup', ARENA_LINES.throwWindup, 2.0, 2.8);
        return;
      }
      if (nearPile) {
        this.cue('near-pile', ARENA_LINES.nearPile, 2.4, 4.0);
        return;
      }
      if (nearArch) {
        this.cue('near-arch', ARENA_LINES.nearArch, 2.4, 5.0);
        return;
      }
      if (a.hasSling && a.weapon === 'SLING' && a.ammo > 0 && a.ammo <= 3) {
        this.cue('low-ammo', ARENA_LINES.lowAmmo, 2.6, 5.5);
        return;
      }
      if (openApe && a.weapon === 'SLING' && a.ammo > 0) {
        this.cue('ape-open', ARENA_LINES.apeOpen, 2.2, 3.8);
        return;
      }
    }

    if (this.idleSeconds >= 4.2) {
      this.idleSeconds = 0;
      this.cue(
        a.weapon !== 'SLING' && a.hasSling ? 'idle-sling' : 'idle-fists',
        a.weapon !== 'SLING' && a.hasSling ? ARENA_LINES.idleWithSling : ARENA_LINES.idleFists,
        3.2,
        4.5
      );
    }
  }
  private sync() {
    if (this.finished) return;
    const a = this.session.attempt;
    const text = (id: string, value: string) => { const el = ui().querySelector(`#${id}`); if (el && el.textContent !== value) el.textContent = value; };
    text('arena-time', a.combatWon ? 'လွတ်ပြီ' : `${Math.max(0, Math.ceil(A4.timeLimit - a.combatSeconds))} s`);
    text('arena-hp-text', `${Math.max(0, a.hp)} / 3`);
    text('arena-ammo',a.hasSling ? String(a.ammo) : '—');
    const charge = ui().querySelector('#arena-charge') as HTMLProgressElement; charge.value = a.charge / A4.chargeTime; charge.hidden = a.weapon !== 'SLING';
    text('arena-charge-label', a.weapon !== 'SLING' ? 'လက်ချည်း' : 'လောက်လေးခွ');
    ui().querySelector<HTMLElement>('#arena-message')!.hidden = a.elapsed >= this.messageUntil;
    ui().querySelector<HTMLElement>('#arena-unsaved')!.hidden = !store.unsaved;
    this.view.render(a, this.bagOpen, this.grabControl);
    this.updateHeldItem();
    this.inventoryBar?.refresh();
  }
  update(_time: number, ms: number) {
    if (this.finished) {
      if (!this.transitionHandled) {
        this.transitionElapsed += ms / 1000;
        const fill = document.getElementById('arena-countdown-fill');
        const label = document.getElementById('arena-countdown-label');
        if (fill) fill.style.width = `${Math.min(100, (this.transitionElapsed / 3.0) * 100)}%`;
        if (label) {
          label.textContent = `⏱️ အခန်း ၅ သို့ ဆက်လက်ထွက်ခွာနေသည်… ${Math.max(0, 3.0 - this.transitionElapsed).toFixed(1)}s (Space / Click ဖြင့် ကျော်နိုင်သည်)`;
        }
        if (this.transitionElapsed >= 3.0) {
          this.transitionHandled = true;
          this.scene.start('CHAPTER_5', { equipment: { slingshot: this.session.hasSling } });
        }
      }
      return;
    }
    const dt = ms / 1000;

    // Handle click-to-grab auto-walk per character.md
    let autoLeft = false;
    let autoRight = false;
    if (this.targetX !== null && !this.session.paused && !this.bagOpen && !this.failureShown) {
      const dist = this.targetX - this.session.attempt.player.centerX;
      if (Math.abs(dist) <= 80) {
        this.targetX = null;
        if (this.pendingAction) {
          const fn = this.pendingAction;
          this.pendingAction = null;
          fn();
        }
      } else if (dist < 0) {
        autoLeft = true;
      } else {
        autoRight = true;
      }
    }

    const touchLeft = Boolean(this.touchControls?.isLeft());
    const touchRight = Boolean(this.touchControls?.isRight());
    const touchCrawl = Boolean(this.touchControls?.isCrawl());
    const touchSling = Boolean(this.touchControls?.isSling());

    // Norman's Law: instant action canceling on touch locomotion
    if (touchLeft || touchRight || touchCrawl || this.touchControls?.isJump()) {
      this.targetX = null;
      this.pendingAction = null;
      if (this.inventoryBar?.isRevealed) {
        this.inventoryBar.hide();
      }
    }

    // Slingshot auto-equip on hold
    if (touchSling && this.session.attempt.weapon !== 'SLING' && this.session.attempt.hasSling) {
      this.session.equipWeapon('SLING');
      this.sync();
    }

    // Edge triggers for touch buttons
    if (this.touchControls?.isJump() && !this.prevTouchJump) {
      this.edges.jump = true;
      try { (soundEngine as any).playJump?.(); } catch {}
    }
    this.prevTouchJump = Boolean(this.touchControls?.isJump());

    if (this.touchControls?.isPunch() && !this.prevTouchPunch) {
      if (this.session.attempt.weapon !== 'FISTS' && this.session.attempt.charge === 0) {
        this.session.equipWeapon('FISTS');
      }
      this.edges.punch = true;
    }
    this.prevTouchPunch = Boolean(this.touchControls?.isPunch());

    if (this.touchControls?.isDodge() && !this.prevTouchDodge) {
      this.edges.dodge = true;
      try { (soundEngine as any).playWoosh?.(); } catch {}
    }
    this.prevTouchDodge = Boolean(this.touchControls?.isDodge());

    const generation = this.session.generation, stepped = this.session.accumulator + dt >= C.dt;
    const s = this.shortcuts;
    const isLeft = this.held.has(s.moveLeft) || this.held.has('arrowleft') || autoLeft || touchLeft;
    const isRight = this.held.has(s.moveRight) || this.held.has('arrowright') || autoRight || touchRight;
    const isSling = this.held.has(s.sling) || this.held.has('k') || touchSling;
    const isCrawl = this.held.has(s.crawl) || this.held.has('arrowdown') || touchCrawl;

    const events = this.session.tick(
      dt,
      {
        left: isLeft,
        right: isRight,
        sling: isSling,
        crawl: isCrawl,
        ...this.edges,
      },
      this.held.has('r')
    );

    // Spawn periodic crawl dust puffs per character.md Section 4.2
    const p = this.session.attempt.player;
    if (p.control === 'LAYING' && Math.abs(p.vx) > 5) {
      this.crawlDustTimer += dt;
      if (this.crawlDustTimer >= 0.22) {
        this.crawlDustTimer = 0;
        try {
          MicroInteractions.spawnFootstepDust(this, p.centerX, vy(p.feetY), p.facing);
        } catch {}
      }
    } else {
      this.crawlDustTimer = 0;
    }

    // Synchronized footsteps when walking
    if (p.grounded && p.control === 'FREE' && Math.abs(p.vx) > 15) {
      this.footstepTimer += dt;
      if (this.footstepTimer >= 0.28) {
        this.footstepTimer = 0;
        try {
          soundEngine.playFootstepStone();
          MicroInteractions.spawnFootstepDust(this, p.centerX, vy(p.feetY), p.facing);
        } catch {}
      }
    } else {
      this.footstepTimer = 0.24;
    }

    if (stepped) this.edges = { jump: false, punch: false, dodge: false };
    if (generation !== this.session.generation) {
      this.failureShown = false;
      this.grabControl = null;
      this.grabbedStone = false;
      this.hideHeldItem();
      this.clear();
      this.lastClueKey = '';
      this.lastClueAt = -99;
      this.idleSeconds = 0;
      const el = ui().querySelector<HTMLDivElement>('#arena-modal');
      if (el) {
        el.hidden = true;
        el.innerHTML = '';
      }
      this.speak(ARENA_LINES.entry, 4.5);
    }
    for (const event of events) this.event(event);

    // Audio trigger when Silver Ape launches a rock
    const currentApeShots = this.session.attempt.shots.filter(s => s.owner === 'APE').length;
    if (currentApeShots > this.prevApeShotCount) {
      try { (soundEngine as any).playWoosh?.(); } catch {}
    }
    this.prevApeShotCount = currentApeShots;

    this.updateContextClues(dt);
    this.sync();
  }
}


