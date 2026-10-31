import Phaser from 'phaser';
import { C } from '../content/chapter1';
import { F5, UGYI_OPENING_MONOLOGUE, TWIST_STRINGS } from '../content/chapter5';
import {
  CHAPTER_5_QUIZ,
  generateQuizRun,
  refreshTierQuestions,
  getCheckpointQuestionIndex,
  getTierFromIndex,
} from '../content/chapter5Quiz';
import type { ActiveQuizQuestion, QuizQuestion } from '../content/chapter5Quiz';
import { FINAL_ART, UGYI_FRAMES, UGYI_SOURCE_SCALE } from '../content/chapter5Art';
import { CHAPTER5_THINKING_PHRASES } from '../content/progressiveHints';
import { store } from '../services/adventure';
import { soundEngine } from '../utils/SoundEngine.js';
import { audioDirector } from '../audio/AudioDirector.js';
import { MicroInteractions } from '../utils/MicroInteractions.js';
import { createPhoe, renderPhoe } from '../view/PhoeHtaungView';
import { VISUAL_GROUND_Y } from '../view/FinalView';

const ui = () => document.querySelector<HTMLDivElement>('#interface')!;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: number;
  alpha: number;
  size: number;
  rotation?: number;
  vRot?: number;
}

export default class FinalChapterScene extends Phaser.Scene {
  // Session tracking to prevent duplicate questions across replays and checkpoints
  private static usedQuestionIds = new Set<number>();
  private activeQuestions: ActiveQuizQuestion[] = [];

  // Game State
  private static readonly UGYI_MAX_HP = 200;
  private health = F5.maxHealth;
  private ugyiHp = FinalChapterScene.UGYI_MAX_HP;
  private currentQIndex = 0;
  private phase: 'OPENING' | 'QUIZ' | 'STRIKE' | 'VICTORY_KEY' | 'BAIT_WALK' | 'CHEST_OPEN' | 'AMBUSH' | 'BLACKOUT' = 'OPENING';
  private monologueIndex = 0;
  private isProcessingAnswer = false;
  private isHurt = false;
  private isDead = false;
  private walkTargetX: number | null = null;
  private keysHeld = new Set<string>();
  private clueTimer: Phaser.Time.TimerEvent | null = null;

  // Actors & Positions
  private playerX: number = F5.spawnX;
  private playerFacing: -1 | 1 = 1;
  private playerControl = 'IDLE';
  private heroLean = 0;
  private isAttacking = false;
  private ugyiX: number = F5.bossSpawnX;
  private ugyiPose: keyof typeof UGYI_FRAMES = 'guard';
  private ugyiHurtTimer = 0;
  private hasGoldenKey = false;
  private treasureRevealed = false;
  private playerStunned = false;
  private stunTimer = 0;
  private ugyiWeaponVisible = false;
  private ugyiWeaponPull = 0;
  private escortSmileTimer = 0;
  private escortLineShown = false;

  // Visuals
  private hero!: ReturnType<typeof createPhoe>;
  private ugyiSprite!: Phaser.GameObjects.Image;
  private ugyiHpLabel!: Phaser.GameObjects.Text;
  private treasureContainer!: Phaser.GameObjects.Container;
  private treasureLid!: Phaser.GameObjects.Container;
  private treasureGlow!: Phaser.GameObjects.Graphics;
  private goldenKeySprite!: Phaser.GameObjects.Graphics;
  private fxG!: Phaser.GameObjects.Graphics;
  private bgDecorG!: Phaser.GameObjects.Graphics;
  private particles: Particle[] = [];
  private confetti: Particle[] = [];

  // Timing
  private elapsed = 0;
  private stepTimer = 0;
  private hurtFlashTimer = 0;

  constructor() {
    super('CHAPTER_5');
  }

  snapshot() {
    return {
      phase: this.phase,
      currentQuestion: this.currentQIndex,
      health: this.health,
      playerX: this.playerX,
      ugyiX: this.ugyiX,
      completed: store.campaign.chapter5Completed,
    };
  }

  preload() {
    for (const item of Object.values(FINAL_ART)) {
      if (!this.textures.exists(item.key)) {
        this.load.image(item.key, item.path);
      }
    }
  }

  init(data: {
    equipment?: { slingshot: boolean };
    skipIntro?: boolean;
    startQuestion?: number;
    preserveRun?: boolean;
    customQuestions?: ActiveQuizQuestion[];
  } = {}) {
    store.campaign.bridgeCompleted = true;
    store.campaign.chapter2Completed = true;
    store.campaign.chapter3Completed = true;
    store.campaign.chapter4Completed = true;
    store.campaign.resumeAt = 'CHAPTER_5';
    try { store.save(); } catch {}

    this.health = F5.maxHealth;
    this.ugyiHp = Math.max(0, FinalChapterScene.UGYI_MAX_HP - (data.startQuestion ?? 0) * 10);
    this.currentQIndex = data.startQuestion ?? 0;
    this.phase = data.skipIntro ? 'QUIZ' : 'OPENING';
    this.monologueIndex = 0;
    this.isProcessingAnswer = false;
    this.isHurt = false;
    this.isDead = false;
    this.walkTargetX = null;
    this.keysHeld.clear();
    this.hasGoldenKey = false;
    this.treasureRevealed = false;
    this.playerStunned = false;
    this.stunTimer = 0;
    this.ugyiWeaponVisible = false;
    this.ugyiWeaponPull = 0;
    this.escortSmileTimer = 0;
    this.escortLineShown = false;
    this.playerX = F5.spawnX;
    this.playerFacing = 1;
    this.playerControl = 'IDLE';
    this.heroLean = 0;
    this.isAttacking = false;
    this.ugyiX = F5.bossSpawnX;
    this.ugyiPose = 'guard';
    this.ugyiHurtTimer = 0;
    this.particles = [];
    this.confetti = [];
    this.elapsed = 0;
    this.stepTimer = 0;
    this.hurtFlashTimer = 0;

    // Manage 20-question run and fresh sampling without duplicates
    if (data.customQuestions && data.customQuestions.length === 20) {
      this.activeQuestions = data.customQuestions;
    } else if (!data.preserveRun || this.activeQuestions.length !== 20) {
      this.activeQuestions = generateQuizRun(FinalChapterScene.usedQuestionIds);
    }
  }

  create() {
    soundEngine.init();
    if (!soundEngine.muted) {
      soundEngine.startBGM?.();
      audioDirector.startStems(0.18, 0.12, 0.14);
    }

    // 1. Lavish Royal Ancient Palace Treasury Background
    const bgKey = this.textures.exists(FINAL_ART.background.key)
      ? FINAL_ART.background.key
      : 'arena_chamber_v1';
    if (this.textures.exists(bgKey)) {
      this.add.image(640, 360, bgKey).setDisplaySize(C.width, C.height);
    } else {
      const bg = this.add.graphics();
      bg.fillGradientStyle(0x78350f, 0x78350f, 0x1c120c, 0x1c120c, 1);
      bg.fillRect(0, 0, C.width, C.height);
    }

    // Subterranean flagstone ground at VISUAL_GROUND_Y (576px)
    this.bgDecorG = this.add.graphics().setDepth(5);
    this.drawSubterraneanBase();

    // 2. Actors & Layers
    this.fxG = this.add.graphics().setDepth(35);
    this.hero = createPhoe(this, 22);

    // Register U Gyi Spritesheet Frames
    if (this.textures.exists(FINAL_ART.ugyi.key)) {
      const tex = this.textures.get(FINAL_ART.ugyi.key);
      for (const [name, f] of Object.entries(UGYI_FRAMES)) {
        if (!tex.has(name)) tex.add(name, 0, f.x, f.y, f.w, f.h);
      }
      this.ugyiSprite = this.add.image(this.ugyiX, VISUAL_GROUND_Y, FINAL_ART.ugyi.key, 'guard')
        .setOrigin(0.5, 1)
        .setScale(UGYI_SOURCE_SCALE)
        .setDepth(20);
    }

    // Boss health readout floating above U Gyi
    this.ugyiHpLabel = this.add.text(this.ugyiX, VISUAL_GROUND_Y - 121, this.ugyiHpText(), {
      fontFamily: '"Noto Sans Myanmar", "Padauk", system-ui, sans-serif',
      fontSize: '13px',
      color: '#f6d68a',
      stroke: '#1d1208',
      strokeThickness: 3,
      align: 'center',
    }).setOrigin(0.5, 1).setDepth(36);

    // 3. Shiny Treasure Chest (Appears on Q20 Victory)
    this.createTreasureChest();

    // 4. Golden Key graphic (floats near Pho Htung when awarded)
    this.goldenKeySprite = this.add.graphics().setDepth(28);

    // 5. Mount HTML DOM for Quest to a Million Myanmar HUD & Blackout Screen
    this.setupDOM();

    // 6. Input Handling (Movement during Bait walk, keyboard shortcuts)
    this.setupInput();

    // 7. Start Phase Flow
    if (this.phase === 'OPENING') {
      this.showOpeningMonologueLine();
    } else {
      this.startQuizPhase();
    }
  }

  private drawSubterraneanBase() {
    const bg = this.bgDecorG;
    bg.clear();
    bg.fillStyle(0x3b4b3d, 1);
    bg.fillRect(0, VISUAL_GROUND_Y, C.width, C.height - VISUAL_GROUND_Y);
    bg.fillStyle(0x6e7c66, 1);
    bg.fillRect(0, VISUAL_GROUND_Y, C.width, 14);
    bg.fillStyle(0xe9dfbd, 0.28);
    bg.fillRect(0, VISUAL_GROUND_Y, C.width, 3);
    bg.lineStyle(1.5, 0x182720, 0.45);
    for (let x = 64; x < C.width; x += 96) {
      bg.lineBetween(x, VISUAL_GROUND_Y + 14, x, C.height);
    }
  }

  private createTreasureChest() {
    // Ground anchor at VISUAL_GROUND_Y (576px)
    this.treasureContainer = this.add.container(F5.treasureX, VISUAL_GROUND_Y).setDepth(16);
    this.treasureContainer.setVisible(false);

    // 1. Warm floor glow + soft vault light behind the chest
    const auraG = this.add.graphics();
    auraG.fillStyle(0xf59e0b, 0.26);
    auraG.fillEllipse(0, 2, 250, 26);
    auraG.fillStyle(0xfef08a, 0.18);
    auraG.fillEllipse(0, 0, 150, 16);
    auraG.fillGradientStyle(0xfde047, 0xfacc15, 0xca8a04, 0x854d0e, 0.1, 0.07, 0, 0);
    auraG.fillTriangle(-72, -300, 86, -300, 0, 0);

    this.tweens.add({
      targets: auraG,
      alpha: 0.62,
      scaleX: 1.05,
      duration: 1900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 2. Golden light that spills out once the lid is opened
    const innerGlowG = this.add.graphics();
    this.treasureGlow = innerGlowG;
    innerGlowG.setAlpha(0);
    innerGlowG.fillGradientStyle(0xfff9c4, 0xfde047, 0xf59e0b, 0xca8a04, 0.95, 0.9, 0.55, 0.2);
    innerGlowG.fillTriangle(-78, -86, 78, -86, 0, -236);
    innerGlowG.fillStyle(0xfffbeb, 0.9);
    innerGlowG.fillEllipse(0, -86, 156, 20);

    // 3. Chest body (teakwood + brass)
    const bodyG = this.add.graphics();
    const halfW = 95;
    const bodyTop = -88;
    const bodyH = 88;

    // Soft contact shadow
    bodyG.fillStyle(0x120a04, 0.62);
    bodyG.fillEllipse(0, 2, 220, 24);

    // Body silhouette
    bodyG.fillStyle(0x2a1608, 1);
    bodyG.fillRoundedRect(-halfW, bodyTop, halfW * 2, bodyH, { tl: 8, tr: 8, bl: 10, br: 10 });
    bodyG.lineStyle(2.5, 0x120803, 1);
    bodyG.strokeRoundedRect(-halfW, bodyTop, halfW * 2, bodyH, { tl: 8, tr: 8, bl: 10, br: 10 });

    // Teak planks
    bodyG.fillStyle(0x3d2110, 1);
    bodyG.fillRect(-halfW + 2, bodyTop + 16, halfW * 2 - 4, 18);
    bodyG.fillRect(-halfW + 2, bodyTop + 50, halfW * 2 - 4, 18);
    bodyG.lineStyle(1.5, 0x1a0d05, 0.9);
    for (const y of [bodyTop + 16, bodyTop + 34, bodyTop + 50, bodyTop + 68]) {
      bodyG.lineBetween(-halfW + 2, y, halfW - 2, y);
    }
    bodyG.lineStyle(1, 0x5b3318, 0.5);
    for (const y of [bodyTop + 18, bodyTop + 36, bodyTop + 52, bodyTop + 70]) {
      bodyG.lineBetween(-halfW + 2, y, halfW - 2, y);
    }
    // Wood grain
    bodyG.lineStyle(1, 0x160b04, 0.35);
    bodyG.lineBetween(-halfW + 14, bodyTop + 22, halfW - 30, bodyTop + 22);
    bodyG.lineBetween(-halfW + 24, bodyTop + 58, halfW - 18, bodyTop + 58);

    // Brass straps
    const drawStrap = (sx: number, top: number, h: number) => {
      bodyG.fillStyle(0x92400e, 1);
      bodyG.fillRect(sx - 8, top, 16, h);
      bodyG.fillStyle(0xf59e0b, 1);
      bodyG.fillRect(sx - 6, top, 12, h);
      bodyG.fillStyle(0xfef08a, 0.85);
      bodyG.fillRect(sx - 4, top, 3, h);
      bodyG.lineStyle(1, 0x1a0e05, 0.85);
      bodyG.strokeRect(sx - 8, top, 16, h);
      for (let ry = top + 12; ry < top + h; ry += 18) {
        bodyG.fillStyle(0x1a0e05, 1);
        bodyG.fillCircle(sx, ry, 2.6);
        bodyG.fillStyle(0xfef08a, 1);
        bodyG.fillCircle(sx - 0.4, ry - 0.4, 1.7);
      }
    };
    drawStrap(-58, bodyTop + 2, bodyH - 4);
    drawStrap(58, bodyTop + 2, bodyH - 4);

    // Corner brass brackets
    bodyG.fillStyle(0xf59e0b, 1);
    bodyG.fillTriangle(-halfW, 0, -halfW + 24, 0, -halfW, -24);
    bodyG.fillTriangle(halfW, 0, halfW - 24, 0, halfW, -24);
    bodyG.fillStyle(0xfef08a, 0.7);
    bodyG.fillTriangle(-halfW, 0, -halfW + 10, 0, -halfW, -10);
    bodyG.fillTriangle(halfW, 0, halfW - 10, 0, halfW, -10);

    // Ornate lock plate
    const lockY = bodyTop + 34;
    bodyG.fillStyle(0x78350f, 1);
    bodyG.fillRoundedRect(-22, lockY - 16, 44, 40, 5);
    bodyG.fillStyle(0xf59e0b, 1);
    bodyG.fillRoundedRect(-19, lockY - 13, 38, 34, 4);
    bodyG.fillStyle(0xfef08a, 0.9);
    bodyG.fillRoundedRect(-15, lockY - 10, 30, 6, 2);
    bodyG.lineStyle(1.5, 0x1f1105, 1);
    bodyG.strokeRoundedRect(-19, lockY - 13, 38, 34, 4);
    bodyG.fillStyle(0x0c0703, 1);
    bodyG.fillCircle(0, lockY + 3, 4.5);
    bodyG.fillTriangle(-3, lockY + 3, 3, lockY + 3, 0, lockY + 14);

    // 4. Domed lid on its own pivot so it can swing open
    this.treasureLid = this.add.container(0, bodyTop + 4);
    const lidG = this.add.graphics();
    lidG.fillStyle(0x1c0f06, 0.55);
    lidG.fillRoundedRect(-101, -54, 202, 66, { tl: 48, tr: 48, bl: 8, br: 8 });
    lidG.fillStyle(0x34200e, 1);
    lidG.fillRoundedRect(-98, -58, 196, 64, { tl: 46, tr: 46, bl: 7, br: 7 });
    lidG.lineStyle(2.5, 0x120803, 1);
    lidG.strokeRoundedRect(-98, -58, 196, 64, { tl: 46, tr: 46, bl: 7, br: 7 });

    // Lid panel highlight
    lidG.fillStyle(0x4b2d14, 1);
    lidG.fillRoundedRect(-88, -50, 176, 22, { tl: 40, tr: 40, bl: 0, br: 0 });
    lidG.fillStyle(0x6b4422, 0.55);
    lidG.fillRoundedRect(-74, -46, 140, 8, 4);

    // Brass rim across the lid mouth
    lidG.fillStyle(0x92400e, 1);
    lidG.fillRect(-98, -6, 196, 10);
    lidG.fillStyle(0xf59e0b, 1);
    lidG.fillRect(-96, -4, 192, 6);
    lidG.fillStyle(0xfef08a, 0.8);
    lidG.fillRect(-92, -3, 184, 2);

    // Lid straps
    const drawLidStrap = (sx: number) => {
      lidG.fillStyle(0xb45309, 1);
      lidG.fillRect(sx - 8, -58, 16, 60);
      lidG.fillStyle(0xf59e0b, 1);
      lidG.fillRect(sx - 6, -58, 12, 60);
      lidG.fillStyle(0xfef08a, 0.8);
      lidG.fillRect(sx - 4, -58, 3, 60);
      lidG.lineStyle(1, 0x1a0e05, 0.8);
      lidG.strokeRect(sx - 8, -58, 16, 60);
      for (let ry = -48; ry < 0; ry += 16) {
        lidG.fillStyle(0x1a0e05, 1);
        lidG.fillCircle(sx, ry, 2.4);
        lidG.fillStyle(0xfef08a, 1);
        lidG.fillCircle(sx - 0.4, ry - 0.4, 1.5);
      }
    };
    drawLidStrap(-58);
    drawLidStrap(58);

    // Lid center emblem
    lidG.fillStyle(0xfacc15, 1);
    lidG.fillCircle(0, -30, 13);
    lidG.fillStyle(0xb45309, 1);
    lidG.fillCircle(0, -30, 9);
    lidG.fillStyle(0xfde047, 1);
    lidG.fillCircle(0, -30, 6);

    this.treasureLid.add(lidG);

    // 5. Animated sparkles to sell the "shiny" look
    const glintsG = this.add.graphics();
    const drawGlint = (gx: number, gy: number, size: number, color: number, alpha: number) => {
      glintsG.fillStyle(color, alpha);
      glintsG.fillTriangle(gx - size, gy, gx + size, gy, gx, gy - size * 0.16);
      glintsG.fillTriangle(gx - size, gy, gx + size, gy, gx, gy + size * 0.16);
      glintsG.fillTriangle(gx, gy - size, gx, gy + size, gx - size * 0.16, gy);
      glintsG.fillTriangle(gx, gy - size, gx, gy + size, gx + size * 0.16, gy);
      glintsG.fillStyle(0xffffff, alpha);
      glintsG.fillCircle(gx, gy, size * 0.24);
    };
    drawGlint(-34, -116, 11, 0xfffbeb, 0.95);
    drawGlint(46, -104, 8, 0xfef08a, 0.9);
    drawGlint(84, -44, 7, 0xfff1a8, 0.85);
    drawGlint(-82, -52, 6, 0xfff8d0, 0.8);
    drawGlint(0, -30, 8, 0xffffff, 0.9);

    this.tweens.add({
      targets: glintsG,
      alpha: 0.4,
      scale: 1.08,
      duration: 820,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.treasureContainer.add([auraG, innerGlowG, bodyG, this.treasureLid, glintsG]);
  }

  private setupDOM() {
    const q0 = this.activeQuestions[0] || CHAPTER_5_QUIZ[0]!;
    const q0Clue = q0.activeClue || q0.ugyiTrick;
    const totalCount = this.activeQuestions.length || CHAPTER_5_QUIZ.length;
    ui().innerHTML = `
      <div class="hud">
        <div class="stage-title">
          <span class="eyebrow">အခန်း ၅ / FINAL BOSS</span>
          <strong>ဦးကြီးရဲ့ မေးခွန်း ၂၀ ဉာဏ်စမ်းစိန်ခေါ်မှု</strong>
        </div>
        <div class="ledger">
          <div><span>သိမ်းပြီးရွှေ</span><b id="final-wallet">${store.campaign.walletCoins}</b></div>
          <div><span>သေဆုံး</span><b id="final-deaths">${store.campaign.deathCount}</b></div>
          <div><span>ဖိုးထောင် သွေး</span><b id="final-hp-text">${this.health} / 3</b></div>
          <div><span>ဦးကြီး သွေး</span><b id="final-boss-hp">${this.ugyiHp} / ${FinalChapterScene.UGYI_MAX_HP}</b></div>
        </div>
        <button id="final-pause" class="icon-button" aria-label="Pause">Ⅱ</button>
      </div>

      <!-- Presenter Speech Toast for U Gyi (Randomized 50/50 Honest vs Deceptive Clues) -->
      <div class="ugyi-presenter-speech" id="ugyi-speech-box">
        <span class="speaker-badge">ဦးကြီး</span>
        <p class="speaker-body" id="ugyi-speech-text">${q0Clue}</p>
      </div>

      <!-- Turn-Based Battle Command Bar: never covers the fighters above the floor line -->
      <div class="quiz-panel-wrapper" id="quiz-wrapper" ${this.phase === 'QUIZ' ? '' : 'hidden'}>
        <div class="quiz-card" id="quiz-card">
          <div class="quiz-turnbar">
            <span class="quiz-turn-badge">အလှည့် <b id="quiz-turn-num">1</b> / ${totalCount}</span>
            <span class="quiz-tier-badge" id="quiz-tier-label">${q0.tierName} · ${q0.category}</span>
            <span class="quiz-turn-matchup"><b>ဖိုးထောင်</b><i>⚔</i><b>ဦးကြီး</b></span>
            <span class="quiz-turn-state" id="quiz-turn-state">မင်းအလှည့် · အဖြေရွေးပါ</span>
          </div>
          <div class="quiz-body">
            <p class="quiz-question-text" id="quiz-question-text">${q0.question}</p>
            <div class="quiz-options-grid" id="quiz-options-grid">
              <button type="button" class="quiz-opt-btn" data-opt="0">
                <span class="opt-badge">က</span><span class="opt-label" id="opt-0-text">${q0.options[0]!.text}</span>
              </button>
              <button type="button" class="quiz-opt-btn" data-opt="1">
                <span class="opt-badge">ခ</span><span class="opt-label" id="opt-1-text">${q0.options[1]!.text}</span>
              </button>
              <button type="button" class="quiz-opt-btn" data-opt="2">
                <span class="opt-badge">ဂ</span><span class="opt-label" id="opt-2-text">${q0.options[2]!.text}</span>
              </button>
              <button type="button" class="quiz-opt-btn" data-opt="3">
                <span class="opt-badge">ဃ</span><span class="opt-label" id="opt-3-text">${q0.options[3]!.text}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Opening Monologue Centered Dialog Modal -->
      <div class="final-story ch5-story-modal" id="opening-dialogue-box" role="dialog" aria-labelledby="opening-speaker" ${this.phase === 'OPENING' ? '' : 'hidden'}>
        <div class="ch5-story-header">
          <span class="eyebrow">ဦးကြီး၏ စိန်ခေါ်သံ</span>
          <span id="opening-counter" class="ch5-story-step">စကားပြော ၁ / ${UGYI_OPENING_MONOLOGUE.length}</span>
        </div>
        <h2 id="opening-speaker">ဦးကြီး</h2>
        <p id="opening-text">${UGYI_OPENING_MONOLOGUE[0]}</p>
        <div class="actions" style="margin-top:16px;display:flex;gap:12px;justify-content:flex-end;">
          <button type="button" id="btn-next-dialogue" class="primary" style="font-weight:900;">ဆက်မယ် ▶</button>
          <button type="button" id="btn-skip-dialogue" class="secondary">မေးခွန်းများ စတင်ဖြေဆိုမည် ⚡</button>
        </div>
      </div>

      <!-- Modal Container (Pause & Checkpoint Retry) -->
      <div class="modal" id="ch5-modal" hidden></div>

      <!-- Act V: Instant Blackout Cutscene & Twist Typewriter -->
      <div class="ch5-blackout" id="ch5-blackout" hidden>
        <p class="ch5-typewriter-text" id="ch5-typewriter"></p>
        <h2 class="ch5-laugh-cue" id="ch5-laugh">${TWIST_STRINGS.laughCue}</h2>
        <div class="ch5-end-card" id="ch5-end-card">
          <h1 class="ch5-end-title">${TWIST_STRINGS.endCardTitle}</h1>
          <p class="ch5-end-sub">${TWIST_STRINGS.endCardSub}</p>
          <div class="actions">
            <button type="button" id="btn-replay-ch5" class="primary">အခန်း ၅ ပြန်ကစားမယ်</button>
            <button type="button" id="btn-menu-ch5" class="secondary">ပင်မစာမျက်နှာ</button>
          </div>
        </div>
      </div>
    `;

    // Bind Quiz Option clicks
    const optButtons = ui().querySelectorAll<HTMLButtonElement>('.quiz-opt-btn');
    optButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.isProcessingAnswer || this.phase !== 'QUIZ') return;
        const optIndex = parseInt(btn.getAttribute('data-opt') || '0', 10);
        this.handleAnswerSelected(optIndex, btn);
      });
    });

    // Opening Monologue buttons
    ui().querySelector('#btn-next-dialogue')?.addEventListener('click', () => {
      this.monologueIndex++;
      this.showOpeningMonologueLine();
    });
    ui().querySelector('#btn-skip-dialogue')?.addEventListener('click', () => {
      this.startQuizPhase();
    });

    // Pause Button
    ui().querySelector('#final-pause')?.addEventListener('click', () => {
      this.togglePause();
    });

    // End Card Buttons
    ui().querySelector('#btn-replay-ch5')?.addEventListener('click', () => {
      this.scene.restart({ skipIntro: false, startQuestion: 0 });
    });
    ui().querySelector('#btn-menu-ch5')?.addEventListener('click', () => {
      this.scene.start('MENU');
    });
  }

  private setupInput() {
    const onDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();
      if (key === 'escape') {
        this.togglePause();
        return;
      }
      this.keysHeld.add(key);

      // Number keys 1-4 for quick quiz option selection
      if (this.phase === 'QUIZ' && !this.isProcessingAnswer && ['1', '2', '3', '4'].includes(key)) {
        const idx = parseInt(key, 10) - 1;
        const btn = ui().querySelector<HTMLButtonElement>(`[data-opt="${idx}"]`);
        if (btn) this.handleAnswerSelected(idx, btn);
      }
    };

    const onUp = (e: KeyboardEvent) => {
      this.keysHeld.delete(e.key.toLowerCase());
    };

    const onPointerDown = (pointer: Phaser.Input.Pointer) => {
      if (this.phase === 'BAIT_WALK' && !this.isDead) {
        this.walkTargetX = pointer.worldX;
        MicroInteractions.spawnClickMarker(this, pointer.worldX, VISUAL_GROUND_Y - 14);
      }
    };

    const onBlur = () => {
      this.keysHeld.clear();
      this.walkTargetX = null;
    };

    const onVisibility = () => {
      if (document.hidden) onBlur();
    };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);
    this.input.on('pointerdown', onPointerDown);

    this.events.once('shutdown', () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
      this.input.off('pointerdown', onPointerDown);
      if (this.clueTimer) {
        this.clueTimer.remove();
        this.clueTimer = null;
      }
      audioDirector.stopWalking();
      ui().innerHTML = '';
    });
  }

  // ================= ACT I: OPENING MONOLOGUE =================
  private showOpeningMonologueLine() {
    const box = ui().querySelector<HTMLElement>('#opening-dialogue-box');
    const textEl = ui().querySelector<HTMLElement>('#opening-text');
    const counterEl = ui().querySelector<HTMLElement>('#opening-counter');
    const speechBox = ui().querySelector<HTMLElement>('#ugyi-speech-box');
    const speechText = ui().querySelector<HTMLElement>('#ugyi-speech-text');
    const nextBtn = ui().querySelector<HTMLButtonElement>('#btn-next-dialogue');
    const quizWrapper = ui().querySelector<HTMLElement>('#quiz-wrapper');

    if (this.monologueIndex >= UGYI_OPENING_MONOLOGUE.length) {
      this.startQuizPhase();
      return;
    }

    // Strictly hide quiz wrapper during opening monologue
    if (quizWrapper) quizWrapper.hidden = true;

    const currentLine = UGYI_OPENING_MONOLOGUE[this.monologueIndex]!;
    if (box && textEl) {
      box.hidden = false;
      textEl.textContent = currentLine;
    }
    if (counterEl) {
      counterEl.textContent = `စကားပြော ${this.monologueIndex + 1} / ${UGYI_OPENING_MONOLOGUE.length}`;
    }
    if (speechBox && speechText) {
      speechText.textContent = currentLine;
    }
    if (nextBtn) {
      if (this.monologueIndex === UGYI_OPENING_MONOLOGUE.length - 1) {
        nextBtn.textContent = 'စိန်ခေါ်မှု စတင်မည် ⚡';
      } else {
        nextBtn.textContent = 'ဆက်မယ် ▶';
      }
    }

    // U Gyi speaking pose
    this.setUgyiPose(this.monologueIndex % 2 === 0 ? 'guard' : 'recover');
  }

  private startQuizPhase() {
    this.phase = 'QUIZ';
    const box = ui().querySelector<HTMLElement>('#opening-dialogue-box');
    if (box) box.hidden = true;

    const quizWrapper = ui().querySelector<HTMLElement>('#quiz-wrapper');
    if (quizWrapper) quizWrapper.hidden = false;

    const card = ui().querySelector<HTMLElement>('#quiz-card');
    if (card) card.classList.remove('hidden');

    this.setUgyiPose('guard');
    this.renderCurrentQuestion();
  }

  // ================= ACT II: QUEST TO A MILLION MYANMAR =================
  private renderCurrentQuestion() {
    const totalCount = this.activeQuestions.length || CHAPTER_5_QUIZ.length;
    if (this.currentQIndex >= totalCount) {
      this.triggerQuestion20Victory();
      return;
    }

    this.phase = 'QUIZ';
    const q = this.activeQuestions[this.currentQIndex] || CHAPTER_5_QUIZ[this.currentQIndex]!;
    const quizWrapper = ui().querySelector<HTMLElement>('#quiz-wrapper');
    const card = ui().querySelector<HTMLElement>('#quiz-card');
    const tierLabel = ui().querySelector<HTMLElement>('#quiz-tier-label');
    const turnNum = ui().querySelector<HTMLElement>('#quiz-turn-num');
    const questionText = ui().querySelector<HTMLElement>('#quiz-question-text');
    const speechText = ui().querySelector<HTMLElement>('#ugyi-speech-text');

    if (quizWrapper) quizWrapper.hidden = false;
    if (card) card.classList.remove('hidden');
    if (tierLabel) tierLabel.textContent = `${q.tierName} · ${q.category}`;
    if (turnNum) turnNum.textContent = String(this.currentQIndex + 1);
    if (questionText) questionText.textContent = q.question;
    this.setTurnState('မင်းအလှည့် · အဖြေရွေးပါ');

    // Reset button states
    for (let i = 0; i < 4; i++) {
      const btn = ui().querySelector<HTMLButtonElement>(`[data-opt="${i}"]`);
      const label = ui().querySelector<HTMLElement>(`#opt-${i}-text`);
      if (btn) {
        btn.classList.remove('correct', 'wrong');
        btn.disabled = false;
      }
      if (label && q.options[i]) {
        label.textContent = q.options[i]!.text;
      }
    }

    // 5-second thinking window before revealing U Gyi's 50/50 clue
    if (this.clueTimer) {
      this.clueTimer.remove();
      this.clueTimer = null;
    }

    if (speechText) {
      const phrases = CHAPTER5_THINKING_PHRASES;
      const phrase = phrases[Math.floor(Math.random() * phrases.length)] || phrases[0]!;
      speechText.textContent = phrase;
    }

    this.clueTimer = this.time.delayedCall(5000, () => {
      const currentSpeechText = ui().querySelector<HTMLElement>('#ugyi-speech-text');
      if (currentSpeechText && !this.isProcessingAnswer && this.phase === 'QUIZ') {
        currentSpeechText.textContent = q.activeClue || q.ugyiTrick;
      }
      this.clueTimer = null;
    });

    this.setUgyiPose('guard');
    this.isProcessingAnswer = false;
  }

  private handleAnswerSelected(selectedIndex: number, buttonEl: HTMLButtonElement) {
    this.isProcessingAnswer = true;
    if (this.clueTimer) {
      this.clueTimer.remove();
      this.clueTimer = null;
    }
    const q = this.activeQuestions[this.currentQIndex] || CHAPTER_5_QUIZ[this.currentQIndex]!;
    const isCorrect = selectedIndex === q.correctIndex;

    // Disable all options
    ui().querySelectorAll<HTMLButtonElement>('.quiz-opt-btn').forEach(b => (b.disabled = true));

    if (isCorrect) {
      // Correct! Pho Htaung takes his turn and strikes U Gyi.
      buttonEl.classList.add('correct');
      soundEngine.playQuizCorrect();
      this.spawnSmallSparkles(this.playerX, VISUAL_GROUND_Y - 50, 0x22c55e);
      this.setTurnState('ဖိုးထောင် တိုက်ခိုက်နေသည်!');

      const speechText = ui().querySelector<HTMLElement>('#ugyi-speech-text');
      if (speechText) {
        speechText.textContent = `အဖြေမှန်တယ်လို့ ဆိုပေမယ့်… ငါ့ကို လာရိုက်မယ်ပေါ့! (မေးခွန်း ${this.currentQIndex + 1} အောင်မြင်သည်)`;
      }

      this.time.delayedCall(140, () => this.performHeroAttack());
    } else {
      // Wrong! Turn-based stick punishment!
      buttonEl.classList.add('wrong');
      const correctBtn = ui().querySelector<HTMLButtonElement>(`[data-opt="${q.correctIndex}"]`);
      if (correctBtn) correctBtn.classList.add('correct');
      this.setTurnState('ဦးကြီး တိုက်ခိုက်နေသည်!');

      soundEngine.playQuizWrong();
      this.time.delayedCall(450, () => {
        this.triggerPunishmentHit(q);
      });
    }
  }

  // ================= HERO ATTACK TURN =================
  private performHeroAttack() {
    if (this.isAttacking) return;
    if (!this.ugyiSprite || !this.ugyiSprite.active) {
      this.time.delayedCall(500, () => {
        this.currentQIndex++;
        this.renderCurrentQuestion();
      });
      return;
    }

    this.isAttacking = true;
    this.setTurnState('ဖိုးထောင် တိုက်ခိုက်နေသည်!');

    const dir: -1 | 1 = this.ugyiX >= this.playerX ? 1 : -1;
    this.playerFacing = dir;
    this.playerControl = 'IDLE';

    const startX = this.playerX;
    const strikeX = this.ugyiX - dir * 96;

    // Anticipation: lean back before the dash
    this.heroLean = -11 * dir;
    soundEngine.playWhoosh();

    this.tweens.add({
      targets: this,
      playerX: strikeX,
      delay: 140,
      duration: 170,
      ease: 'Quad.In',
      onComplete: () => {
        // Contact!
        this.heroLean = 16 * dir;
        soundEngine.playHit();
        this.cameras.main.shake(170, 0.011);

        const hitX = this.ugyiX - dir * 34;
        const hitY = VISUAL_GROUND_Y - 58;
        this.spawnImpactBurst(hitX, hitY);
        this.spawnSlashArc(hitX, hitY, dir);

        // U Gyi gets hurt: pose, flash, knockback, damage number
        this.setUgyiPose('hit');
        this.ugyiHurtTimer = 0.32;
        this.applyDamageToUgyi(10);

        const knockX = this.ugyiX + dir * 16;
        this.tweens.add({
          targets: this,
          ugyiX: knockX,
          duration: 110,
          ease: 'Quad.Out',
          yoyo: true,
          hold: 60,
        });

        // Recover and hand the turn back
        this.time.delayedCall(280, () => {
          this.heroLean = 0;
          this.setUgyiPose('recover');
          this.tweens.add({
            targets: this,
            playerX: startX,
            duration: 300,
            ease: 'Quad.Out',
          });

          this.time.delayedCall(300, () => {
            this.ugyiHurtTimer = 0;
            this.isAttacking = false;
            if (this.currentQIndex + 1 >= (this.activeQuestions.length || CHAPTER_5_QUIZ.length)) {
              // Final blow: hand off to the victory sequence
              this.currentQIndex++;
              this.renderCurrentQuestion();
              return;
            }
            if (!this.isDead) {
              this.setUgyiPose('guard');
              this.currentQIndex++;
              this.renderCurrentQuestion();
            }
          });
        });
      },
    });
  }

  private applyDamageToUgyi(amount: number) {
    this.ugyiHp = Math.max(0, this.ugyiHp - amount);
    if (this.ugyiHpLabel && this.ugyiHpLabel.active) {
      this.ugyiHpLabel.setText(this.ugyiHpText());
    }
    const bossHp = ui().querySelector<HTMLElement>('#final-boss-hp');
    if (bossHp) bossHp.textContent = `${this.ugyiHp} / ${FinalChapterScene.UGYI_MAX_HP}`;

    const popup = this.add.text(this.ugyiX + 48, VISUAL_GROUND_Y - 136, `-${amount}`, {
      fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#ffd166',
      stroke: '#3b1607',
      strokeThickness: 4,
    }).setOrigin(0.5, 1).setDepth(40);

    this.tweens.add({
      targets: popup,
      y: popup.y - 40,
      x: popup.x + 12,
      alpha: 0,
      duration: 720,
      ease: 'Cubic.Out',
      onComplete: () => popup.destroy(),
    });

    if (this.ugyiHp <= 0) {
      this.setUgyiPose('defeated');
    }
  }

  private spawnSlashArc(x: number, y: number, dir: -1 | 1) {
    const slash = this.add.graphics({ x, y }).setDepth(38);
    slash.lineStyle(7, 0xfff3c4, 0.95);
    slash.beginPath();
    slash.arc(0, 0, 48, Phaser.Math.DegToRad(dir > 0 ? -75 : 75), Phaser.Math.DegToRad(dir > 0 ? 55 : 105), dir < 0);
    slash.strokePath();
    slash.lineStyle(3, 0xffb347, 0.8);
    slash.beginPath();
    slash.arc(0, 0, 58, Phaser.Math.DegToRad(dir > 0 ? -65 : 65), Phaser.Math.DegToRad(dir > 0 ? 45 : 115), dir < 0);
    slash.strokePath();

    this.tweens.add({
      targets: slash,
      alpha: 0,
      scaleX: 1.35,
      scaleY: 1.35,
      duration: 260,
      ease: 'Quad.Out',
      onComplete: () => slash.destroy(),
    });
  }

  private ugyiHpText() {
    return `ဦးကြီး ${this.ugyiHp} / ${FinalChapterScene.UGYI_MAX_HP}`;
  }

  private setTurnState(text: string) {
    const el = ui().querySelector<HTMLElement>('#quiz-turn-state');
    if (el) el.textContent = text;
  }

  // ================= ACT III: TURN-BASED STICK HIT =================
  private triggerPunishmentHit(q: QuizQuestion) {
    this.phase = 'STRIKE';
    const card = ui().querySelector<HTMLElement>('#quiz-card');
    if (card) card.classList.add('hidden');

    const speechText = ui().querySelector<HTMLElement>('#ugyi-speech-text');
    if (speechText) {
      speechText.textContent = `မှားပြီဟေ့ မောင်ဖိုးထောင်! အဖြေမှန်က (${q.options[q.correctIndex]?.label}) ဖြစ်တယ်! ငါ့တုတ်ရိုက်ချက်ကို မြည်းစမ်းပေတော့!`;
    }

    // U Gyi steps forward to strike distance
    this.tweens.add({
      targets: this,
      ugyiX: this.playerX + 110,
      duration: 300,
      ease: 'Quad.Out',
      onComplete: () => {
        // Slam Windup: Raises stick high with both hands!
        this.setUgyiPose('slam_windup');

        this.time.delayedCall(420, () => {
          // Slam Strike! Swings stick down hard!
          this.setUgyiPose('slam_strike');
          soundEngine.playStickWhack();
          this.cameras.main.shake(380, 0.018);

          // Impact sparks & dust
          this.spawnImpactBurst(this.playerX + 15, VISUAL_GROUND_Y - 45);

          // Pho Htung recoil & hurt
          this.isHurt = true;
          this.hurtFlashTimer = 0.35;
          this.playerControl = 'HURT';
          this.playerX -= 25;
          this.health--;

          // Update HUD text
          const hpText = ui().querySelector<HTMLElement>('#final-hp-text');
          if (hpText) hpText.textContent = `${Math.max(0, this.health)} / 3`;

          this.time.delayedCall(450, () => {
            this.isHurt = false;
            this.playerControl = 'IDLE';

            if (this.health > 0) {
              // Pho Htung still has health! Return U Gyi to presenter spot and advance question
              this.tweens.add({
                targets: this,
                ugyiX: F5.bossSpawnX,
                duration: 400,
                ease: 'Quad.In',
                onComplete: () => {
                  this.setUgyiPose('guard');
                  this.playerX = F5.spawnX;
                  this.currentQIndex++;
                  this.phase = 'QUIZ';
                  this.renderCurrentQuestion();
                },
              });
            } else {
              // Health 0! Pho Htung defeated!
              this.triggerDefeatSequence();
            }
          });
        });
      },
    });
  }

  private triggerDefeatSequence() {
    this.isDead = true;
    this.playerControl = 'DEAD';
    soundEngine.playDeath();
    store.death('ch5');

    const deathsEl = ui().querySelector<HTMLElement>('#final-deaths');
    if (deathsEl) deathsEl.textContent = String(store.campaign.deathCount);

    const speechText = ui().querySelector<HTMLElement>('#ugyi-speech-text');
    if (speechText) {
      speechText.textContent = 'ဟားဟားဟား! ဦးကြီးရဲ့ တုတ် ၃ ချက်ဒဏ် မခံနိုင်တော့ဘူး မဟုတ်လား ဖိုးထောင်ရယ်!';
    }

    const checkpointIdx = getCheckpointQuestionIndex(this.currentQIndex);
    const checkpointQNum = checkpointIdx + 1;

    const modal = ui().querySelector<HTMLElement>('#ch5-modal');
    if (modal) {
      modal.hidden = false;
      modal.innerHTML = `
        <section class="dialog" style="text-align:center;">
          <span class="eyebrow" style="color:#f87171;">တိုက်ပွဲ ကျရှုံးသည်</span>
          <h2 style="color:#fca5a5;">💀 မေ့မျောသွားပါပြီ!</h2>
          <p>ဦးကြီး၏ တုတ်ရိုက်ချက် ၃ ချက် ထိမှန်ပြီး မောင်ဖိုးထောင် မေ့လဲသွားခဲ့သည်။<br><b>မေးခွန်း ${this.currentQIndex + 1}</b> တွင် ကျဆုံးခဲ့သည်။</p>
          <p class="warning" style="display:inline-block;margin:12px 0;">Checkpoint မှ ပြန်စတင်နိုင်သည်: မေးခွန်း ${checkpointQNum} (Tier ${Math.floor(checkpointIdx / 5) + 1})</p>
          <div class="actions" style="justify-content:center;margin-top:18px;">
            <button type="button" id="btn-checkpoint-retry" class="primary">မေးခွန်း ${checkpointQNum} မှ ပြန်စမ်းမယ်</button>
            <button type="button" id="btn-defeat-menu" class="secondary">ပင်မစာမျက်နှာ</button>
          </div>
        </section>
      `;

      modal.querySelector('#btn-checkpoint-retry')?.addEventListener('click', () => {
        modal.hidden = true;
        const checkpointTier = getTierFromIndex(checkpointIdx);
        const freshQuestions = refreshTierQuestions(checkpointTier, FinalChapterScene.usedQuestionIds);
        const updatedRun = [...this.activeQuestions];
        for (let i = 0; i < 5; i++) {
          if (freshQuestions[i] && updatedRun[checkpointIdx + i]) {
            updatedRun[checkpointIdx + i] = freshQuestions[i]!;
          }
        }
        this.scene.restart({
          skipIntro: true,
          startQuestion: checkpointIdx,
          preserveRun: true,
          customQuestions: updatedRun,
        });
      });
      modal.querySelector('#btn-defeat-menu')?.addEventListener('click', () => {
        this.scene.start('MENU');
      });
    }
  }

  // ================= ACT IV: QUESTION 20 VICTORY & THE GOLDEN CHEST =================
  private triggerQuestion20Victory() {
    this.phase = 'VICTORY_KEY';
    const card = ui().querySelector<HTMLElement>('#quiz-card');
    if (card) card.classList.add('hidden');

    // Confetti and Victory Fanfare!
    this.spawnConfettiBurst();
    soundEngine.playVictoryFanfare();

    // U Gyi has lost the quiz: hands raised, weapon stowed, no guard stance
    this.setUgyiPose('defeated');
    this.hasGoldenKey = true;

    const speechText = ui().querySelector<HTMLElement>('#ugyi-speech-text');
    if (speechText) {
      speechText.textContent = TWIST_STRINGS.ugyiVictoryPrize;
    }

    // Modal dialogue presenting the golden key and the treasure chest
    const modal = ui().querySelector<HTMLElement>('#ch5-modal');
    if (modal) {
      modal.hidden = false;
      modal.innerHTML = `
        <section class="dialog" style="text-align:center;">
          <span class="eyebrow" style="color:#fbbf24;">ဂုဏ်ယူပါသည် · အောင်ပွဲရပြီ</span>
          <h2 style="color:#fde047;">🎉 မေးခွန်း ၂၀ စလုံး အောင်မြင်သည်!</h2>
          <p style="font-size:16px;line-height:2;">${TWIST_STRINGS.ugyiVictoryPrize}</p>
          <div style="font-size:42px;margin:14px 0;">🗝️✨</div>
          <p style="color:#fde68a;">ရွှေမြို့တော်တံခါးဖွင့် ရွှေသော့နဲ့အတူ ရွှေသေတ္တာကြီးကို ဆုလာဘ်အဖြစ် ရရှိပါပြီ!</p>
          <div class="actions" style="justify-content:center;margin-top:16px;">
            <button type="button" id="btn-take-treasure" class="primary">ရွှေသေတ္တာကြီးဆီ သွားကြည့်မယ်</button>
          </div>
        </section>
      `;

      modal.querySelector('#btn-take-treasure')?.addEventListener('click', () => {
        modal.hidden = true;
        this.startBaitWalkPhase();
      });
    }
  }

  private startBaitWalkPhase() {
    if (this.phase !== 'VICTORY_KEY') return;
    this.phase = 'BAIT_WALK';
    this.treasureRevealed = true;
    this.treasureContainer.setVisible(true);
    this.treasureContainer.setAlpha(0);
    this.treasureContainer.setScale(0.72);

    // Chest reveal: bounces up from the floor with a warm golden pop
    this.tweens.add({
      targets: this.treasureContainer,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 720,
      ease: 'Back.easeOut',
    });
    this.spawnSmallSparkles(F5.treasureX, VISUAL_GROUND_Y - 96, 0xfff2a8);
    this.spawnSmallSparkles(F5.treasureX, VISUAL_GROUND_Y - 40, 0xfde047);

    // U Gyi is unarmed, relaxed, and smiling - he strolls to the escort mark
    this.setUgyiPose('defeated');
    this.ugyiWeaponVisible = false;
    this.ugyiWeaponPull = 0;
    this.ugyiHpLabel.setVisible(false);
    this.tweens.add({
      targets: this,
      ugyiX: 700,
      duration: 900,
      ease: 'Sine.easeInOut',
    });

    const speechText = ui().querySelector<HTMLElement>('#ugyi-speech-text');
    if (speechText) {
      speechText.textContent = TWIST_STRINGS.ugyiEscortLine;
    }
    this.escortSmileTimer = 1.6;

    // Leisurely side-to-side sway while he waits for Pho Htaung
    this.tweens.add({
      targets: this.ugyiSprite,
      angle: 2.4,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  // ================= ACT V: THE TREASURE CHEST OPENING =================
  private startChestOpening() {
    if (this.phase !== 'BAIT_WALK') return;
    this.phase = 'CHEST_OPEN';
    this.walkTargetX = null;
    this.hasGoldenKey = false;

    // Pho Htaung steps to the chest and crouches down to work the lock
    this.playerFacing = 1;
    this.playerControl = 'PICKUP';
    this.tweens.add({
      targets: this,
      playerX: F5.treasureX - 100,
      duration: 380,
      ease: 'Sine.easeOut',
    });

    const speechText = ui().querySelector<HTMLElement>('#ugyi-speech-text');
    if (speechText) speechText.textContent = TWIST_STRINGS.ugyiChestLine;

    // Camera pushes in slowly on the chest
    this.cameras.main.zoomTo(1.16, 900);

    // Rattle the lid: Pho Htaung is taking his time with the lock
    this.time.delayedCall(420, () => {
      if (this.phase !== 'CHEST_OPEN') return;
      soundEngine.playPing();
      this.tweens.add({
        targets: this.treasureLid,
        x: 2,
        duration: 55,
        yoyo: true,
        repeat: 9,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          this.treasureLid.x = 0;
        },
      });
    });

    // A second, harder tug on the old lock
    this.time.delayedCall(980, () => {
      if (this.phase !== 'CHEST_OPEN') return;
      soundEngine.playPing();
      this.spawnSmallSparkles(F5.treasureX - 60, VISUAL_GROUND_Y - 60, 0xffe9a8);
    });

    // Lid finally swings open and golden light floods out
    this.time.delayedCall(1450, () => {
      if (this.phase !== 'CHEST_OPEN') return;
      soundEngine.playPing();
      this.tweens.add({
        targets: this.treasureLid,
        y: -104,
        rotation: -0.42,
        duration: 620,
        ease: 'Back.easeOut',
      });
      this.tweens.add({
        targets: this.treasureGlow,
        alpha: 1,
        duration: 700,
        ease: 'Sine.easeOut',
      });
      this.spawnSmallSparkles(F5.treasureX, VISUAL_GROUND_Y - 110, 0xfff9c4);
      this.spawnSmallSparkles(F5.treasureX, VISUAL_GROUND_Y - 80, 0xfde047);

      // The moment Pho Htaung leans in, U Gyi reaches for his back
      this.time.delayedCall(760, () => {
        if (this.phase !== 'CHEST_OPEN') return;
        this.triggerAmbush();
      });
    });
  }

  // ================= ACT VI: THE AMBUSH & STUN =================
  private triggerAmbush() {
    this.phase = 'AMBUSH';
    this.walkTargetX = null;
    this.playerControl = 'PICKUP';
    this.tweens.killTweensOf(this.ugyiSprite);
    this.ugyiSprite.setAngle(0);

    const speechText = ui().querySelector<HTMLElement>('#ugyi-speech-text');
    if (speechText) {
      speechText.textContent = TWIST_STRINGS.ugyiStrikeLine;
    }

    // Action camera zoom in
    this.cameras.main.zoomTo(1.24, 500);

    // 1. U Gyi calmly pulls the hidden club out from behind his back
    this.ugyiWeaponVisible = true;
    this.ugyiWeaponPull = 0;
    this.tweens.add({
      targets: this,
      ugyiWeaponPull: 1,
      duration: 620,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        if (this.phase !== 'AMBUSH') return;
        this.ugyiWeaponVisible = false;
        this.setUgyiPose('slam_windup');

        // 2. He steps in close behind the crouching Pho Htaung
        this.tweens.add({
          targets: this,
          ugyiX: this.playerX - 62,
          duration: 300,
          ease: 'Sine.easeOut',
        });

        this.time.delayedCall(430, () => {
          if (this.phase !== 'AMBUSH') return;
          // 3. The club comes down on the back of his head
          this.setUgyiPose('slam_strike');
          soundEngine.playStickWhack();
          this.cameras.main.shake(480, 0.03);
          this.spawnImpactBurst(this.playerX, VISUAL_GROUND_Y - 62);
          this.stunPhoeHtaung();
        });
      },
    });
  }

  private stunPhoeHtaung() {
    this.playerStunned = true;
    this.stunTimer = 1.25;
    this.hero?.setTintFill(0xffffff);

    // U Gyi steps back so the dazed Pho Htaung stays clearly visible
    this.time.delayedCall(260, () => {
      if (this.phase !== 'AMBUSH') return;
      this.tweens.add({
        targets: this,
        ugyiX: this.playerX - 130,
        duration: 460,
        ease: 'Sine.easeOut',
      });
    });

    // The blow drops Pho Htaung face-down after a dizzy wobble
    this.time.delayedCall(1250, () => {
      if (this.phase !== 'AMBUSH') return;
      this.playerStunned = false;
      this.playerControl = 'LAYING';
      this.time.delayedCall(600, () => {
        this.triggerBlackoutTwist();
      });
    });
  }

  private triggerBlackoutTwist() {
    this.phase = 'BLACKOUT';
    soundEngine.stopBGM(); // Cut all sound immediately

    const blackoutEl = ui().querySelector<HTMLElement>('#ch5-blackout');
    const typewriterEl = ui().querySelector<HTMLElement>('#ch5-typewriter');
    const laughEl = ui().querySelector<HTMLElement>('#ch5-laugh');
    const endCardEl = ui().querySelector<HTMLElement>('#ch5-end-card');

    if (blackoutEl) blackoutEl.hidden = false;

    // Complete silence for 1.5 seconds, then type out twist text slowly
    this.time.delayedCall(1500, () => {
      const fullText = TWIST_STRINGS.typewriterReveal;
      let charIndex = 0;
      if (typewriterEl) typewriterEl.textContent = '';

      const typeTimer = this.time.addEvent({
        delay: 55,
        repeat: fullText.length - 1,
        callback: () => {
          charIndex++;
          if (typewriterEl) {
            typewriterEl.textContent = fullText.slice(0, charIndex);
          }
          if (charIndex % 3 === 0) {
            soundEngine.playPing();
          }

          if (charIndex >= fullText.length) {
            // Sound cue: loud reverberating laugh!
            this.time.delayedCall(500, () => {
              soundEngine.playReverbLaugh();
              if (laughEl) laughEl.classList.add('visible');

              // Fade in Chapter 5 title end card
              this.time.delayedCall(1200, () => {
                if (endCardEl) endCardEl.classList.add('visible');
                store.campaign.chapter5Completed = true;
                store.save();
              });
            });
          }
        },
      });
    });
  }

  // ================= DRAWING OVERHEAD HEALTH BAR =================
  private drawOverheadHealthBar(x: number, y: number) {
    const fx = this.fxG;
    const width = 56;
    const height = 7;
    const segments = 3;
    const ratio = Phaser.Math.Clamp(this.health / F5.maxHealth, 0, 1);
    const left = Math.round(x - width / 2);
    const top = Math.round(y);
    const flashing = this.isHurt;

    // Outer dark wood plate & brass rim
    fx.fillStyle(0x1d1208, 0.94);
    fx.fillRoundedRect(left - 2, top - 2, width + 4, height + 4, 3);
    fx.lineStyle(1.5, flashing ? 0xffe4a3 : 0xb07c34, 0.9);
    fx.strokeRoundedRect(left - 2, top - 2, width + 4, height + 4, 3);

    // Recessed depleted track
    fx.fillStyle(0x120b05, 0.95);
    fx.fillRect(left, top, width, height);

    // Dynamic brass fill
    let fillColor: number;
    if (flashing) {
      fillColor = 0xfff3c4;
    } else {
      fillColor = ratio > 0.6 ? 0xd9a441 : ratio > 0.3 ? 0xc98f3a : 0x8f2c1d;
    }

    const fillW = Math.max(0, Math.round(width * ratio));
    if (fillW > 0) {
      fx.fillStyle(fillColor, 0.96);
      fx.fillRect(left, top, fillW, height);
      // Top specular highlight strip
      fx.fillStyle(0xffffff, 0.28);
      fx.fillRect(left, top, fillW, Math.max(1, Math.floor(height * 0.35)));
    }

    // Segment dividers for the 3 hit segments
    fx.lineStyle(1, 0x111a14, 0.85);
    for (let i = 1; i < segments; i++) {
      const sx = Math.round(left + (width * i) / segments);
      fx.lineBetween(sx, top, sx, top + height);
    }
  }

  // ================= BOSS HEALTH BAR (200 HP) =================
  private drawUgyiHealthBar(x: number, y: number) {
    const fx = this.fxG;
    const width = 116;
    const height = 11;
    const ratio = Phaser.Math.Clamp(this.ugyiHp / FinalChapterScene.UGYI_MAX_HP, 0, 1);
    const left = Math.round(x - width / 2);
    const top = Math.round(y);
    const flashing = this.ugyiHurtTimer > 0;

    // Deep drop shadow so the bar reads over the bright hall art
    fx.fillStyle(0x000000, 0.45);
    fx.fillRoundedRect(left - 5, top - 5, width + 10, height + 10, 5);

    // Carved wood backing + brass rim
    fx.fillStyle(0x2a1a0c, 0.96);
    fx.fillRoundedRect(left - 3, top - 3, width + 6, height + 6, 4);
    fx.lineStyle(1.5, flashing ? 0xffe4a3 : 0xb07c34, 0.95);
    fx.strokeRoundedRect(left - 3, top - 3, width + 6, height + 6, 4);

    // Recessed track
    fx.fillStyle(0x140b04, 0.95);
    fx.fillRect(left, top, width, height);

    // Ember fill that darkens as U Gyi weakens
    const fillW = Math.max(0, Math.round(width * ratio));
    if (fillW > 0) {
      const fillColor = flashing
        ? 0xfff0c0
        : ratio > 0.5
          ? 0xc8412c
          : ratio > 0.2
            ? 0xa8551f
            : 0x7c1f12;
      fx.fillStyle(fillColor, 0.98);
      fx.fillRect(left, top, fillW, height);
      fx.fillStyle(0xffd9a0, 0.34);
      fx.fillRect(left, top, fillW, Math.max(1, Math.floor(height * 0.32)));
    }

    // Ten notch marks (one per 20 HP)
    fx.lineStyle(1, 0x1a0e04, 0.7);
    for (let i = 1; i < 10; i++) {
      const sx = Math.round(left + (width * i) / 10);
      fx.lineBetween(sx, top, sx, top + height);
    }
  }

  // ================= UTILITIES & EFFECTS =================
  // ================= ENDING CUTSCENE PROPS =================
  private drawBackWeapon() {
    const g = this.fxG;
    const p = Phaser.Math.Clamp(this.ugyiWeaponPull, 0, 1);
    const angle = 2.35 - p * 3.75;
    const ox = this.ugyiX - 26 + p * 8;
    const oy = VISUAL_GROUND_Y - 74 - p * 26;

    g.save();
    g.translateCanvas(ox, oy);
    g.rotateCanvas(angle);
    g.fillStyle(0x2b1a0c, 1);
    g.fillCircle(-4, 0, 5);
    g.fillStyle(0x6b3f1d, 1);
    g.fillRoundedRect(-2, -4.5, 58, 9, 4);
    g.fillStyle(0x9a5b2a, 1);
    g.fillRoundedRect(0, -3.5, 54, 4, 2);
    g.fillStyle(0xc2872f, 1);
    g.fillRoundedRect(50, -5, 9, 10, 3);
    g.lineStyle(1.2, 0x241407, 0.9);
    g.strokeRoundedRect(-2, -4.5, 58, 9, 4);
    g.restore();
  }

  private drawEscortSmile() {
    const g = this.fxG;
    const fade = Math.min(1, this.escortSmileTimer / 0.4);
    const x = this.ugyiX + 22;
    const y = VISUAL_GROUND_Y - 128 + Math.sin(this.elapsed * 3) * 3;

    g.fillStyle(0xfff4c2, 0.95 * fade);
    g.fillCircle(x, y, 11);
    g.lineStyle(2, 0x8a5a12, 0.95 * fade);
    g.strokeCircle(x, y, 11);
    g.fillStyle(0x4a2a08, 0.95 * fade);
    g.fillCircle(x - 3.5, y - 2, 1.5);
    g.fillCircle(x + 3.5, y - 2, 1.5);
    g.beginPath();
    g.arc(x, y + 2, 5, Math.PI * 0.18, Math.PI * 0.82, false);
    g.strokePath();
  }

  private drawDizzyStars() {
    const t = this.elapsed * 5;
    for (let i = 0; i < 3; i++) {
      const a = t + (Math.PI * 2 * i) / 3;
      const sx = this.playerX + Math.cos(a) * 30;
      const sy = VISUAL_GROUND_Y - 96 + Math.sin(a) * 9;
      this.drawStarShape(this.fxG, sx, sy, 6.5, i === 1 ? 0xfff9c4 : 0xfde047, 0.95);
    }
  }

  private drawStarShape(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    radius: number,
    color: number,
    alpha: number
  ) {
    const points: Phaser.Geom.Point[] = [];
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 === 0 ? radius : radius * 0.42;
      const angle = -Math.PI / 2 + (i * Math.PI) / 5;
      points.push(new Phaser.Geom.Point(cx + Math.cos(angle) * rad, cy + Math.sin(angle) * rad));
    }
    g.fillStyle(color, alpha);
    g.fillPoints(points, true);
  }

  private setUgyiPose(pose: keyof typeof UGYI_FRAMES) {
    this.ugyiPose = pose;
    if (this.ugyiSprite && this.ugyiSprite.active) {
      this.ugyiSprite.setFrame(pose);
    }
  }

  private togglePause() {
    if (this.phase === 'BLACKOUT' || this.phase === 'VICTORY_KEY' || this.phase === 'CHEST_OPEN' || this.phase === 'AMBUSH') {
      return;
    }
    const modal = ui().querySelector<HTMLElement>('#ch5-modal');
    if (!modal) return;

    if (!modal.hidden) {
      modal.hidden = true;
      modal.innerHTML = '';
      return;
    }

    modal.hidden = false;
    modal.innerHTML = `
      <section class="dialog" style="text-align:center;">
        <span class="eyebrow">ခဏနားမည်</span>
        <h2>ရပ်ထားပါတယ်</h2>
        <p>ဦးကြီး၏ မေးခွန်း ၂၀ ကို သတိထားဖြေဆိုပါ။ ဦးကြီး၏ အရိပ်အယောင် စကားများကို မယုံပါနှင့်။</p>
        <div class="actions" style="justify-content:center;margin-top:16px;">
          <button type="button" id="btn-ch5-resume" class="primary">ဆက်ကစားမယ်</button>
          <button type="button" id="btn-ch5-menu" class="secondary">ပင်မစာမျက်နှာ</button>
        </div>
      </section>
    `;

    modal.querySelector('#btn-ch5-resume')?.addEventListener('click', () => {
      modal.hidden = true;
    });
    modal.querySelector('#btn-ch5-menu')?.addEventListener('click', () => {
      this.scene.start('MENU');
    });
  }

  private spawnImpactBurst(x: number, y: number) {
    const colors = [0xfffbeb, 0xfde047, 0xf59e0b, 0xea580c, 0xdc2626];
    for (let i = 0; i < 28; i++) {
      const angle = (Math.PI * 2 * i) / 28 + (Math.random() - 0.5) * 0.4;
      const speed = 80 + Math.random() * 200;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        color: colors[i % colors.length]!,
        alpha: 1,
        size: 3 + Math.random() * 5,
      });
    }
  }

  private spawnSmallSparkles(x: number, y: number, color = 0xfde047) {
    for (let i = 0; i < 14; i++) {
      const angle = (Math.PI * 2 * i) / 14;
      const speed = 40 + Math.random() * 80;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        color,
        alpha: 1,
        size: 3 + Math.random() * 3,
      });
    }
  }

  private spawnConfettiBurst() {
    const colors = [0xfacc15, 0xf59e0b, 0xef4444, 0x22c55e, 0x3b82f6, 0xec4899];
    for (let i = 0; i < 70; i++) {
      this.confetti.push({
        x: 640 + (Math.random() - 0.5) * 500,
        y: 600,
        vx: (Math.random() - 0.5) * 320,
        vy: -(260 + Math.random() * 340),
        color: colors[i % colors.length]!,
        alpha: 1,
        size: 5 + Math.random() * 6,
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 8,
      });
    }
  }

  // ================= MAIN LOOP =================
  update(_time: number, delta: number) {
    const dt = delta / 1000;
    this.elapsed += dt;
    this.fxG.clear();
    this.goldenKeySprite.clear();

    if (this.phase === 'BLACKOUT') return;

    // 1. Handle Movement during BAIT WALK
    if (this.phase === 'BAIT_WALK' && !this.isDead) {
      let moveDir = 0;
      if (this.keysHeld.has('a') || this.keysHeld.has('arrowleft')) moveDir -= 1;
      if (this.keysHeld.has('d') || this.keysHeld.has('arrowright')) moveDir += 1;

      if (this.walkTargetX !== null) {
        const diff = this.walkTargetX - this.playerX;
        if (Math.abs(diff) > 10) {
          moveDir = Math.sign(diff);
        } else {
          this.walkTargetX = null;
        }
      }

      if (moveDir !== 0) {
        this.playerX += moveDir * 180 * dt;
        this.playerFacing = moveDir > 0 ? 1 : -1;
        this.playerControl = 'WALK';

        if (_time > this.stepTimer) {
          soundEngine.playFootstep();
          MicroInteractions.spawnFootstepDust(this, this.playerX, VISUAL_GROUND_Y, moveDir);
          this.stepTimer = _time + 260;
        }
      } else {
        this.playerControl = 'IDLE';
      }

      // Check the chest-opening trigger
      this.playerX = Phaser.Math.Clamp(this.playerX, F5.minX + 20, F5.treasureX - 90);

      // U Gyi strolls behind Pho Htaung, smiling the whole way
      const escortTargetX = this.playerX - F5.escortGap;
      if (escortTargetX > this.ugyiX + 1) {
        this.ugyiX = Math.min(escortTargetX, this.ugyiX + 205 * dt);
        if (!this.escortLineShown) {
          this.escortLineShown = true;
          this.escortSmileTimer = 1.8;
          const speechText = ui().querySelector<HTMLElement>('#ugyi-speech-text');
          if (speechText) speechText.textContent = TWIST_STRINGS.ugyiEscortLine;
        }
      }

      if (this.playerX >= F5.chestOpenX) {
        this.startChestOpening();
      }
    }

    if (this.escortSmileTimer > 0) {
      this.escortSmileTimer = Math.max(0, this.escortSmileTimer - dt);
    }
    if (this.stunTimer > 0) {
      this.stunTimer = Math.max(0, this.stunTimer - dt);
    }

    // 2. Position Actors
    if (this.ugyiSprite && this.ugyiSprite.active) {
      const escortWalking = this.phase === 'BAIT_WALK' && this.ugyiX < this.playerX - F5.escortGap - 1;
      const escortBob = escortWalking ? -Math.abs(Math.sin(this.elapsed * 9)) * 4 : 0;
      this.ugyiSprite.setPosition(this.ugyiX, VISUAL_GROUND_Y + escortBob);
      // U Gyi faces player
      this.ugyiSprite.setFlipX(this.playerX > this.ugyiX);

      // Hurt reaction flash
      if (this.ugyiHurtTimer > 0) {
        this.ugyiHurtTimer = Math.max(0, this.ugyiHurtTimer - dt);
        if (this.ugyiHurtTimer > 0.2) {
          this.ugyiSprite.setTintFill(0xffffff);
        } else {
          this.ugyiSprite.setTint(0xff8a6a);
        }
      } else {
        this.ugyiSprite.clearTint();
      }
    }

    if (this.ugyiHpLabel && this.ugyiHpLabel.active) {
      this.ugyiHpLabel.setPosition(this.ugyiX, VISUAL_GROUND_Y - 121);
    }

    // Render Phoe Htung
    if (this.hero) {
      renderPhoe(
        this.hero,
        {
          centerX: this.playerX,
          feetY: VISUAL_GROUND_Y,
          facing: this.playerFacing,
          control: this.playerControl as any,
          holding: this.hasGoldenKey,
          pushing: false,
          vx: this.playerControl === 'WALK' ? this.playerFacing * 180 : 0,
          grounded: true,
        },
        this.elapsed
      );

      if (this.playerStunned) {
        const wobble = Math.sin(this.elapsed * 34) * 11 * Math.min(1, this.stunTimer / 0.35);
        this.hero.setAngle(wobble);
        if (this.stunTimer > 0.8) {
          this.hero.setTintFill(0xffffff);
        } else {
          this.hero.setTint(0xffb0a0);
        }
      } else if (this.isHurt) {
        this.hero.setTintFill(0xff8888);
      } else {
        this.hero.clearTint();
      }

      // Attack lean is applied after the shared renderer so it is not overwritten
      if (this.heroLean !== 0) {
        this.hero.setAngle(this.heroLean);
      }
    }

    // 3. Draw Golden Key in Pho Htung's hands
    if (this.hasGoldenKey && !this.isDead) {
      const keyX = this.playerX + this.playerFacing * 22;
      const keyY = VISUAL_GROUND_Y - 48;
      const g = this.goldenKeySprite;

      g.fillStyle(0xfde047, 1);
      g.fillCircle(keyX, keyY, 6);
      g.fillStyle(0x78350f, 1);
      g.fillCircle(keyX, keyY, 3);
      g.fillStyle(0xf59e0b, 1);
      g.fillRect(keyX - 1, keyY + 4, 3, 14);
      g.fillRect(keyX - 1, keyY + 14, 5, 3);
      g.fillRect(keyX - 1, keyY + 9, 4, 2.5);

      // Sparkling golden rays
      const pulse = Math.sin(this.elapsed * 6) * 3;
      g.lineStyle(1.5, 0xfffbeb, 0.85);
      g.lineBetween(keyX - 8 - pulse, keyY, keyX + 8 + pulse, keyY);
      g.lineBetween(keyX, keyY - 8 - pulse, keyX, keyY + 8 + pulse);
    }

    // 4. Draw Overhead Palace Health Bar (3 Segments) during the quiz battle only
    const battleHud = this.phase === 'QUIZ' || this.phase === 'STRIKE' || this.phase === 'VICTORY_KEY';
    if (this.ugyiHpLabel && this.ugyiHpLabel.active) {
      this.ugyiHpLabel.setVisible(battleHud);
    }
    if (!this.isDead && battleHud) {
      this.drawOverheadHealthBar(this.playerX, VISUAL_GROUND_Y - 98);
    }

    // 4b. U Gyi's 200 HP boss bar, anchored above the sprite
    if (this.ugyiSprite && this.ugyiSprite.active && battleHud) {
      this.drawUgyiHealthBar(this.ugyiX, VISUAL_GROUND_Y - 111);
    }

    // 4c. Ambush weapon prop being pulled from U Gyi's back
    if (this.ugyiWeaponVisible && this.phase === 'AMBUSH') {
      this.drawBackWeapon();
    }

    // 4d. Leisurely smile emote while U Gyi escorts Pho Htaung
    if (this.escortSmileTimer > 0) {
      this.drawEscortSmile();
    }

    // 4e. Dizzy stars orbiting the stunned Pho Htaung
    if (this.playerStunned) {
      this.drawDizzyStars();
    }

    // 5. Update & Draw Particles (Impact Sparks)
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]!;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 320 * dt; // gravity
      p.alpha -= 1.8 * dt;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.fxG.fillStyle(p.color, p.alpha);
      this.fxG.fillCircle(p.x, p.y, p.size);
    }

    // 6. Update & Draw Confetti
    for (let i = this.confetti.length - 1; i >= 0; i--) {
      const c = this.confetti[i]!;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.vy += 220 * dt; // gravity
      c.vx *= 0.98;
      c.rotation = (c.rotation || 0) + (c.vRot || 2) * dt;
      c.alpha -= 0.12 * dt;

      if (c.y > VISUAL_GROUND_Y || c.alpha <= 0) {
        this.confetti.splice(i, 1);
        continue;
      }

      this.fxG.fillStyle(c.color, Math.min(1, c.alpha));
      this.fxG.fillRoundedRect(c.x, c.y, c.size, c.size * 1.5, 1);
    }
  }
}

// Preserve CampaignEndingScene export so main.ts remains completely compatible
export class CampaignEndingScene extends Phaser.Scene {
  constructor() {
    super('CAMPAIGN_END');
  }
  create() {
    this.scene.start('MENU');
  }
}
