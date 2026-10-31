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
  private health = F5.maxHealth;
  private currentQIndex = 0;
  private phase: 'OPENING' | 'QUIZ' | 'STRIKE' | 'VICTORY_KEY' | 'BAIT_WALK' | 'AMBUSH' | 'BLACKOUT' = 'OPENING';
  private monologueIndex = 0;
  private isProcessingAnswer = false;
  private isHurt = false;
  private isDead = false;
  private walkTargetX: number | null = null;
  private keysHeld = new Set<string>();
  private clueTimer: Phaser.Time.TimerEvent | null = null;

  // Actors & Positions
  private playerX = F5.spawnX;
  private playerFacing: -1 | 1 = 1;
  private playerControl = 'IDLE';
  private ugyiX: number = F5.bossSpawnX;
  private ugyiPose: keyof typeof UGYI_FRAMES = 'guard';
  private hasGoldenKey = false;
  private treasureRevealed = false;

  // Visuals
  private hero!: ReturnType<typeof createPhoe>;
  private ugyiSprite!: Phaser.GameObjects.Image;
  private treasureContainer!: Phaser.GameObjects.Container;
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
    this.playerX = F5.spawnX;
    this.playerFacing = 1;
    this.playerControl = 'IDLE';
    this.ugyiX = F5.bossSpawnX;
    this.ugyiPose = 'guard';
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

    // 3. Treasure Mountain Container (Appears on Q20 Victory)
    this.createTreasurePile();

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

  private createTreasurePile() {
    // Ground anchor at VISUAL_GROUND_Y (576px)
    this.treasureContainer = this.add.container(F5.treasureX, VISUAL_GROUND_Y).setDepth(16);
    this.treasureContainer.setVisible(false);

    // 1. Volumetric Golden Ambient Aura & Ground Warm Glow
    const auraG = this.add.graphics();
    // Warm floor reflection
    auraG.fillStyle(0xf59e0b, 0.22);
    auraG.fillEllipse(0, 4, 380, 40);
    auraG.fillStyle(0xfef08a, 0.15);
    auraG.fillEllipse(-10, 0, 260, 26);
    // Atmospheric god-ray cone angling down from upper vault
    auraG.fillGradientStyle(0xfde047, 0xfacc15, 0xca8a04, 0x854d0e, 0.12, 0.08, 0, 0);
    auraG.fillTriangle(-80, -320, 160, -320, -10, 0);
    auraG.fillTriangle(0, -320, 240, -320, 80, 0);

    // Breathing glow animation
    this.tweens.add({
      targets: auraG,
      alpha: 0.65,
      scaleX: 1.05,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 2. Base Mountain of Heaped Antique Gold Coins (Layered Vector Silhouette)
    const baseMoundG = this.add.graphics();

    // Dark foundational under-shadow
    baseMoundG.fillStyle(0x1a0f05, 0.7);
    baseMoundG.fillEllipse(0, 2, 340, 36);

    // Deep shadow mound of gold
    baseMoundG.fillStyle(0x5c380e, 1);
    baseMoundG.beginPath();
    baseMoundG.moveTo(-180, 0);
    baseMoundG.lineTo(-150, -22);
    baseMoundG.lineTo(-110, -42);
    baseMoundG.lineTo(-60, -68);
    baseMoundG.lineTo(-10, -82);
    baseMoundG.lineTo(40, -78);
    baseMoundG.lineTo(95, -55);
    baseMoundG.lineTo(145, -28);
    baseMoundG.lineTo(175, 0);
    baseMoundG.closePath();
    baseMoundG.fillPath();

    // Mid-tier warm amber-gold layer
    baseMoundG.fillStyle(0x9a3412, 0.9);
    baseMoundG.beginPath();
    baseMoundG.moveTo(-160, 0);
    baseMoundG.lineTo(-120, -30);
    baseMoundG.lineTo(-70, -56);
    baseMoundG.lineTo(-15, -74);
    baseMoundG.lineTo(35, -68);
    baseMoundG.lineTo(85, -46);
    baseMoundG.lineTo(135, -20);
    baseMoundG.lineTo(155, 0);
    baseMoundG.closePath();
    baseMoundG.fillPath();

    // Luminous upper gold body
    baseMoundG.fillStyle(0xca8a04, 1);
    baseMoundG.beginPath();
    baseMoundG.moveTo(-140, 0);
    baseMoundG.lineTo(-100, -24);
    baseMoundG.lineTo(-50, -48);
    baseMoundG.lineTo(-10, -64);
    baseMoundG.lineTo(30, -58);
    baseMoundG.lineTo(75, -38);
    baseMoundG.lineTo(120, -14);
    baseMoundG.lineTo(135, 0);
    baseMoundG.closePath();
    baseMoundG.fillPath();

    // 3. Royal Ancient Palace Teakwood & Brass Vault Chest
    const chestG = this.add.graphics();
    const cx = -18;
    const cy = -68;
    const cw = 114;
    const ch = 68;

    // Open Lid Shadow
    chestG.fillStyle(0x110a04, 0.65);
    chestG.fillRoundedRect(cx - 8, cy - 42, cw + 16, 38, 8);

    // Open Lid (Tilted back at authentic perspective)
    chestG.fillStyle(0x3b1f0c, 1);
    chestG.fillRoundedRect(cx - 4, cy - 38, cw + 8, 34, 8);
    chestG.lineStyle(2, 0x1a0d05, 1);
    chestG.strokeRoundedRect(cx - 4, cy - 38, cw + 8, 34, 8);

    // Lid Brass Bands & Rim
    chestG.fillStyle(0xb45309, 1);
    chestG.fillRect(cx + 12, cy - 38, 12, 34);
    chestG.fillRect(cx + cw - 24, cy - 38, 12, 34);
    chestG.fillStyle(0xfde047, 1);
    chestG.fillRect(cx + 14, cy - 38, 8, 34);
    chestG.fillRect(cx + cw - 22, cy - 38, 8, 34);

    // Inner Velvet Chamber (Deep Royal Crimson)
    chestG.fillStyle(0x4c0519, 1);
    chestG.fillRoundedRect(cx + 4, cy - 4, cw - 8, 18, 4);

    // Main Chest Teakwood Body
    chestG.fillStyle(0x271407, 1);
    chestG.fillRoundedRect(cx, cy + 4, cw, ch, 6);
    chestG.lineStyle(2, 0x120803, 1);
    chestG.strokeRoundedRect(cx, cy + 4, cw, ch, 6);

    // Teakwood Planks Horizontal Bevels
    chestG.lineStyle(1.5, 0x170b04, 0.85);
    chestG.lineBetween(cx + 2, cy + 26, cx + cw - 2, cy + 26);
    chestG.lineBetween(cx + 2, cy + 48, cx + cw - 2, cy + 48);
    chestG.lineStyle(1, 0x4a2a14, 0.6);
    chestG.lineBetween(cx + 2, cy + 28, cx + cw - 2, cy + 28);
    chestG.lineBetween(cx + 2, cy + 50, cx + cw - 2, cy + 50);

    // Heavy Brass Straps (Left & Right)
    const drawBrassStrap = (bx: number) => {
      chestG.fillStyle(0x92400e, 1);
      chestG.fillRect(bx - 1, cy + 4, 16, ch);
      chestG.fillStyle(0xf59e0b, 1);
      chestG.fillRect(bx, cy + 4, 14, ch);
      chestG.fillStyle(0xfef08a, 0.8);
      chestG.fillRect(bx + 2, cy + 4, 4, ch);
      chestG.lineStyle(1.5, 0x1a0e05, 0.9);
      chestG.strokeRect(bx - 1, cy + 4, 16, ch);

      // Brass dome rivets down the strap
      const rivetYs = [cy + 12, cy + 24, cy + 37, cy + 50, cy + 62];
      for (const ry of rivetYs) {
        chestG.fillStyle(0x1a0e05, 1);
        chestG.fillCircle(bx + 7, ry, 3.2);
        chestG.fillStyle(0xfef08a, 1);
        chestG.fillCircle(bx + 6.5, ry - 0.5, 2.2);
        chestG.fillStyle(0xffffff, 1);
        chestG.fillCircle(bx + 6, ry - 1, 1);
      }
    };
    drawBrassStrap(cx + 14);
    drawBrassStrap(cx + cw - 30);

    // Brass Corner Reinforcement Brackets
    chestG.fillStyle(0xf59e0b, 1);
    chestG.fillTriangle(cx, cy + 4, cx + 18, cy + 4, cx, cy + 22);
    chestG.fillTriangle(cx + cw, cy + 4, cx + cw - 18, cy + 4, cx + cw, cy + 22);
    chestG.fillTriangle(cx, cy + ch + 4, cx + 18, cy + ch + 4, cx, cy + ch - 14);
    chestG.fillTriangle(cx + cw, cy + ch + 4, cx + cw - 18, cy + ch + 4, cx + cw, cy + ch - 14);

    // Central Ornate Royal Brass Lockplate & Keyhole
    const lockX = cx + cw / 2;
    const lockY = cy + 24;
    chestG.fillStyle(0x78350f, 1);
    chestG.fillRoundedRect(lockX - 16, lockY - 14, 32, 30, 4);
    chestG.fillStyle(0xf59e0b, 1);
    chestG.fillRoundedRect(lockX - 14, lockY - 12, 28, 26, 3);
    chestG.fillStyle(0xfef08a, 0.9);
    chestG.fillRoundedRect(lockX - 12, lockY - 10, 24, 6, 2);
    chestG.lineStyle(1.5, 0x1f1105, 1);
    chestG.strokeRoundedRect(lockX - 14, lockY - 12, 28, 26, 3);

    // Ancient Royal Keyhole
    chestG.fillStyle(0x0c0703, 1);
    chestG.fillCircle(lockX, lockY + 2, 4);
    chestG.fillTriangle(lockX - 2.5, lockY + 2, lockX + 2.5, lockY + 2, lockX, lockY + 11);

    // 4. Overflowing Gold Bullion Bars, Chalices & Stacked Coins
    const treasureG = this.add.graphics();

    // Stamped Gold Bullion Bars
    const drawGoldBar = (bx: number, by: number, w: number, h: number, rot = 0) => {
      treasureG.save();
      treasureG.translateCanvas(bx, by);
      if (rot !== 0) treasureG.rotateCanvas(rot);
      // Top face
      treasureG.fillStyle(0xfef08a, 1);
      treasureG.fillRect(-w / 2, -h / 2, w, h * 0.45);
      // Front face
      treasureG.fillStyle(0xeab308, 1);
      treasureG.fillRect(-w / 2, -h / 2 + h * 0.45, w, h * 0.55);
      // Outline
      treasureG.lineStyle(1.5, 0x713f12, 1);
      treasureG.strokeRect(-w / 2, -h / 2, w, h);
      // Embossed Palace lotus mark
      treasureG.fillStyle(0xca8a04, 1);
      treasureG.fillCircle(0, 0, 2.5);
      treasureG.restore();
    };

    drawGoldBar(cx + 25, cy - 2, 34, 12, -0.08);
    drawGoldBar(cx + 56, cy - 5, 36, 13, 0.05);
    drawGoldBar(cx + 86, cy + 2, 32, 12, 0.14);
    drawGoldBar(cx + 40, cy - 12, 32, 11, -0.04);
    drawGoldBar(cx + 70, cy - 14, 30, 11, 0.08);

    // Royal Golden Chalice / Goblet
    treasureG.fillStyle(0xfacc15, 1);
    treasureG.beginPath();
    treasureG.moveTo(cx + 20, cy - 22);
    treasureG.lineTo(cx + 34, cy - 22);
    treasureG.lineTo(cx + 31, cy - 8);
    treasureG.lineTo(cx + 27, cy - 3);
    treasureG.lineTo(cx + 27, cy + 5);
    treasureG.lineTo(cx + 23, cy + 5);
    treasureG.lineTo(cx + 23, cy - 3);
    treasureG.lineTo(cx + 19, cy - 8);
    treasureG.closePath();
    treasureG.fillPath();
    treasureG.lineStyle(1.2, 0x854d0e, 1);
    treasureG.strokePath();

    // 5. Individual Hand-Inked Gold Coins & Cascading Piles
    const drawCoin = (x: number, y: number, rx = 7, ry = 4.5, rot = 0, tone = 0) => {
      treasureG.save();
      treasureG.translateCanvas(x, y);
      if (rot !== 0) treasureG.rotateCanvas(rot);

      // Under-shadow
      treasureG.fillStyle(0x1a0f05, 0.5);
      treasureG.fillEllipse(0, 1.2, rx * 2, ry * 2);

      // Rim base
      const rimColors = [0xb45309, 0xca8a04, 0x78350f];
      treasureG.fillStyle(rimColors[tone % 3]!, 1);
      treasureG.fillEllipse(0, 0, rx * 2, ry * 2);

      // Coin face
      const faceColors = [0xfacc15, 0xfde047, 0xeab308];
      treasureG.fillStyle(faceColors[tone % 3]!, 1);
      treasureG.fillEllipse(0, -0.8, (rx - 1.2) * 2, (ry - 0.8) * 2);

      // Embossed inner ring
      treasureG.lineStyle(0.8, 0xca8a04, 0.8);
      treasureG.strokeEllipse(0, -0.8, (rx - 2.8) * 2, (ry - 1.8) * 2);

      // Specular highlight crescent
      treasureG.fillStyle(0xfffbeb, 0.9);
      treasureG.fillCircle(-rx * 0.35, -ry * 0.45, 1.3);

      treasureG.restore();
    };

    // Coin piles tumbling across the mound and floor
    const coinCoords: [number, number, number, number, number, number][] = [
      // Left foreground cascade towards player
      [-175, -2, 7, 4, 0.1, 0], [-160, -6, 7.5, 4.5, -0.15, 1], [-145, -4, 8, 4.8, 0.2, 2],
      [-155, -12, 7, 4.2, 0.05, 0], [-140, -14, 8, 4.6, -0.1, 1], [-125, -8, 8.5, 5, 0.15, 0],
      [-135, -22, 7.5, 4.4, 0.25, 2], [-115, -18, 8, 4.5, -0.2, 0], [-100, -12, 8, 4.7, 0.05, 1],
      [-120, -28, 7.2, 4.3, 0.1, 1], [-95, -26, 8, 4.6, -0.12, 2], [-80, -16, 8.5, 5, 0.18, 0],
      // Center base pile
      [-65, -8, 8.5, 5.2, 0.05, 0], [-50, -14, 8, 4.8, -0.08, 1], [-35, -6, 9, 5.2, 0.12, 2],
      [-20, -10, 8.5, 5, -0.15, 0], [-5, -6, 9, 5.4, 0.02, 1], [15, -8, 8.5, 5.1, 0.14, 0],
      [30, -12, 8, 4.7, -0.1, 2], [45, -6, 8.5, 5.2, 0.05, 1], [60, -14, 8, 4.8, 0.2, 0],
      // Right edge cascade
      [75, -8, 8.2, 4.9, -0.15, 1], [90, -16, 8, 4.6, 0.1, 0], [105, -10, 8.5, 5, -0.05, 2],
      [120, -18, 7.8, 4.5, 0.22, 1], [135, -12, 7.5, 4.3, -0.18, 0], [150, -6, 7.2, 4.1, 0.08, 2],
      [165, -2, 6.8, 3.8, -0.12, 1],
      // Upper slope coins
      [-80, -38, 7.8, 4.5, 0.14, 0], [-60, -48, 8, 4.6, -0.2, 1], [-45, -58, 8, 4.8, 0.05, 2],
      [-30, -66, 7.5, 4.4, -0.1, 0], [-15, -74, 8, 4.7, 0.15, 1], [5, -72, 8, 4.6, -0.05, 0],
      [25, -65, 8, 4.8, 0.12, 2], [45, -52, 7.8, 4.5, -0.18, 1], [65, -42, 8, 4.6, 0.08, 0],
      [85, -32, 7.5, 4.3, -0.14, 2], [105, -24, 7.8, 4.5, 0.2, 1],
      // Cascading down the front of the chest
      [cx + 8, cy + 58, 7.5, 4.4, 0.15, 0], [cx + 24, cy + 64, 8, 4.7, -0.1, 1],
      [cx + 42, cy + 62, 8.5, 5, 0.08, 2], [cx + 60, cy + 66, 8, 4.8, -0.15, 0],
      [cx + 78, cy + 63, 8.2, 4.9, 0.2, 1], [cx + 96, cy + 59, 7.8, 4.5, -0.05, 2],
      [cx + 110, cy + 54, 7.5, 4.3, 0.18, 0],
    ];

    for (const [x, y, rx, ry, rot, tone] of coinCoords) {
      drawCoin(x, y, rx, ry, rot, tone);
    }

    // Stacks of gold coin rolls (cylindrical towers)
    const drawCoinStack = (sx: number, sy: number, heightCoins: number) => {
      for (let i = 0; i < heightCoins; i++) {
        drawCoin(sx, sy - i * 3.8, 8, 4.4, 0, i % 2);
      }
    };
    drawCoinStack(-130, -2, 5);
    drawCoinStack(-118, -4, 7);
    drawCoinStack(125, -4, 6);
    drawCoinStack(138, -2, 4);
    drawCoinStack(78, -12, 5);

    // 6. Faceted Gemstones (Mogok Pigeon-Blood Rubies, Sapphires & Jade)
    const gemG = this.add.graphics();

    // Mogok Pigeon-Blood Ruby (Brilliant Cut Diamond Rhombus)
    const drawRuby = (gx: number, gy: number, r = 7) => {
      gemG.fillStyle(0x7f1d1d, 1);
      gemG.fillCircle(gx, gy + 1, r * 1.1);
      // Dark red body
      gemG.fillStyle(0xdc2626, 1);
      gemG.beginPath();
      gemG.moveTo(gx, gy - r);
      gemG.lineTo(gx + r, gy);
      gemG.lineTo(gx, gy + r);
      gemG.lineTo(gx - r, gy);
      gemG.closePath();
      gemG.fillPath();
      // Bright facet highlight
      gemG.fillStyle(0xef4444, 1);
      gemG.beginPath();
      gemG.moveTo(gx, gy - r);
      gemG.lineTo(gx + r * 0.6, gy - r * 0.2);
      gemG.lineTo(gx, gy + r * 0.2);
      gemG.lineTo(gx - r * 0.6, gy - r * 0.2);
      gemG.closePath();
      gemG.fillPath();
      // White glint
      gemG.fillStyle(0xfff1f2, 1);
      gemG.fillCircle(gx - r * 0.3, gy - r * 0.35, 1.8);
      gemG.lineStyle(1.2, 0x450a0a, 0.8);
      gemG.strokeCircle(gx, gy, r);
    };

    // Burmese Jade / Imperial Emerald
    const drawEmerald = (gx: number, gy: number, w = 11, h = 8) => {
      gemG.fillStyle(0x064e3b, 1);
      gemG.fillRoundedRect(gx - w / 2, gy - h / 2, w, h, 2);
      gemG.fillStyle(0x059669, 1);
      gemG.fillRoundedRect(gx - w / 2 + 1, gy - h / 2 + 1, w - 2, h - 2, 1.5);
      gemG.fillStyle(0x34d399, 1);
      gemG.fillRect(gx - w / 2 + 2, gy - h / 2 + 1.5, w * 0.4, h - 3);
      gemG.fillStyle(0xffffff, 0.9);
      gemG.fillCircle(gx - w * 0.2, gy - h * 0.2, 1.3);
    };

    // Royal Blue Sapphire
    const drawSapphire = (gx: number, gy: number, r = 6) => {
      gemG.fillStyle(0x1e3a8a, 1);
      gemG.fillCircle(gx, gy, r);
      gemG.fillStyle(0x2563eb, 1);
      gemG.fillCircle(gx - 0.8, gy - 0.8, r - 1.2);
      gemG.fillStyle(0x60a5fa, 1);
      gemG.fillCircle(gx - 1.8, gy - 1.8, (r - 1.5) * 0.5);
      gemG.fillStyle(0xffffff, 1);
      gemG.fillCircle(gx - 2, gy - 2, 1.2);
    };

    // Drooping Pearl Necklace over chest rim
    const drawPearlString = () => {
      const pearls: [number, number][] = [
        [cx + 12, cy + 2], [cx + 16, cy + 8], [cx + 20, cy + 15],
        [cx + 23, cy + 22], [cx + 25, cy + 30], [cx + 24, cy + 38],
        [cx + 20, cy + 44], [cx + 15, cy + 48], [cx + 9, cy + 50],
      ];
      for (const [px, py] of pearls) {
        gemG.fillStyle(0x1e150b, 0.4);
        gemG.fillCircle(px, py + 1, 3.2);
        gemG.fillStyle(0xf1f5f9, 1);
        gemG.fillCircle(px, py, 3);
        gemG.fillStyle(0xffffff, 1);
        gemG.fillCircle(px - 0.8, py - 0.8, 1.2);
      }
    };

    drawRuby(cx + 46, cy + 6, 8.5);
    drawRuby(-70, -18, 7.5);
    drawRuby(48, -16, 7);
    drawRuby(-140, -8, 6.5);
    drawRuby(cx + 92, cy - 8, 7.5);

    drawEmerald(cx + 72, cy + 6, 13, 9);
    drawEmerald(-40, -12, 12, 8);
    drawEmerald(88, -22, 11, 7.5);
    drawEmerald(-105, -16, 12, 8);

    drawSapphire(cx + 34, cy - 10, 6.5);
    drawSapphire(12, -18, 6);
    drawSapphire(-88, -32, 6);
    drawSapphire(112, -14, 5.5);

    drawPearlString();

    // 7. Animated Specular Shimmer Star Glints (✨)
    const glintsG = this.add.graphics();
    const drawStarGlint = (gx: number, gy: number, size = 10, color = 0xffffff) => {
      glintsG.fillStyle(color, 0.95);
      // Horizontal bar
      glintsG.fillTriangle(gx - size, gy, gx + size, gy, gx, gy - 1.2);
      glintsG.fillTriangle(gx - size, gy, gx + size, gy, gx, gy + 1.2);
      // Vertical bar
      glintsG.fillTriangle(gx, gy - size, gx, gy + size, gx - 1.2, gy);
      glintsG.fillTriangle(gx, gy - size, gx, gy + size, gx + 1.2, gy);
      // Center halo
      glintsG.fillStyle(0xffffff, 1);
      glintsG.fillCircle(gx, gy, size * 0.28);
    };

    drawStarGlint(cx + 46, cy + 4, 11, 0xfff1f2); // Ruby glint
    drawStarGlint(cx + 72, cy + 5, 9, 0xa7f3d0);  // Emerald glint
    drawStarGlint(cx + 34, cy - 12, 8, 0xbfdbfe); // Sapphire glint
    drawStarGlint(-70, -20, 10, 0xfef08a);       // Coin mound glint
    drawStarGlint(12, -22, 12, 0xfffbeb);        // Gold glint
    drawStarGlint(-125, -12, 9, 0xfde047);       // Base coin glint
    drawStarGlint(90, -20, 11, 0xfef08a);        // Right cascade glint
    drawStarGlint(cx + cw / 2, cy + 18, 7, 0xfef08a); // Brass lock glint

    // Continuous magical glint shimmer rotation & pulse
    this.tweens.add({
      targets: glintsG,
      alpha: 0.35,
      scale: 1.15,
      duration: 750,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Gentle chest jewel pulsation
    this.tweens.add({
      targets: gemG,
      scaleX: 1.02,
      scaleY: 1.02,
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Assemble all hoard layers into container
    this.treasureContainer.add([auraG, baseMoundG, chestG, treasureG, gemG, glintsG]);
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
          <div><span>လက်ကျန်သွေး</span><b id="final-hp-text">${this.health} / 3</b></div>
        </div>
        <button id="final-pause" class="icon-button" aria-label="Pause">Ⅱ</button>
      </div>

      <!-- Presenter Speech Toast for U Gyi (Randomized 50/50 Honest vs Deceptive Clues) -->
      <div class="ugyi-presenter-speech" id="ugyi-speech-box">
        <span class="speaker-badge">ဦးကြီး</span>
        <p class="speaker-body" id="ugyi-speech-text">${q0Clue}</p>
      </div>

      <!-- Quest to a Million Myanmar 4-Choice Question Panel -->
      <div class="quiz-panel-wrapper" id="quiz-wrapper" ${this.phase === 'QUIZ' ? '' : 'hidden'}>
        <div class="quiz-card" id="quiz-card">
          <div class="quiz-header">
            <span class="quiz-tier-badge" id="quiz-tier-label">${q0.tierName} · ${q0.category}</span>
            <span class="quiz-progress-text" id="quiz-progress-label">မေးခွန်း ၁ / ${totalCount}</span>
          </div>
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
    const progressLabel = ui().querySelector<HTMLElement>('#quiz-progress-label');
    const questionText = ui().querySelector<HTMLElement>('#quiz-question-text');
    const speechText = ui().querySelector<HTMLElement>('#ugyi-speech-text');

    if (quizWrapper) quizWrapper.hidden = false;
    if (card) card.classList.remove('hidden');
    if (tierLabel) tierLabel.textContent = `${q.tierName} · ${q.category}`;
    if (progressLabel) progressLabel.textContent = `မေးခွန်း ${this.currentQIndex + 1} / ${totalCount}`;
    if (questionText) questionText.textContent = q.question;

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
      // Correct!
      buttonEl.classList.add('correct');
      soundEngine.playQuizCorrect();
      this.spawnSmallSparkles(this.playerX, VISUAL_GROUND_Y - 50, 0x22c55e);

      const speechText = ui().querySelector<HTMLElement>('#ugyi-speech-text');
      if (speechText) {
        speechText.textContent = `ဟေ့… မင်း အဖြေမှန်သွားပြန်ပြီလား! (မေးခွန်း ${this.currentQIndex + 1} အောင်မြင်သည်)`;
      }

      this.time.delayedCall(750, () => {
        this.currentQIndex++;
        this.renderCurrentQuestion();
      });
    } else {
      // Wrong! Turn-based stick punishment!
      buttonEl.classList.add('wrong');
      const correctBtn = ui().querySelector<HTMLButtonElement>(`[data-opt="${q.correctIndex}"]`);
      if (correctBtn) correctBtn.classList.add('correct');

      soundEngine.playQuizWrong();
      this.time.delayedCall(450, () => {
        this.triggerPunishmentHit(q);
      });
    }
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

  // ================= ACT IV: QUESTION 20 VICTORY & PRIZE FIRST TWIST =================
  private triggerQuestion20Victory() {
    this.phase = 'VICTORY_KEY';
    const card = ui().querySelector<HTMLElement>('#quiz-card');
    if (card) card.classList.add('hidden');

    // Confetti and Victory Fanfare!
    this.spawnConfettiBurst();
    soundEngine.playVictoryFanfare();

    // U Gyi drops strict host persona, laughs, and presents Golden Key
    this.setUgyiPose('recover');
    this.hasGoldenKey = true;

    const speechText = ui().querySelector<HTMLElement>('#ugyi-speech-text');
    if (speechText) {
      speechText.textContent = TWIST_STRINGS.ugyiVictoryPrize;
    }

    // Modal dialogue presenting Golden Key
    const modal = ui().querySelector<HTMLElement>('#ch5-modal');
    if (modal) {
      modal.hidden = false;
      modal.innerHTML = `
        <section class="dialog" style="text-align:center;">
          <span class="eyebrow" style="color:#fbbf24;">ဂုဏ်ယူပါသည် · အောင်ပွဲရပြီ</span>
          <h2 style="color:#fde047;">🎉 မေးခွန်း ၂၀ စလုံး အောင်မြင်သည်!</h2>
          <p style="font-size:16px;line-height:2;">${TWIST_STRINGS.ugyiVictoryPrize}</p>
          <div style="font-size:42px;margin:14px 0;">🗝️✨</div>
          <p style="color:#fde68a;">ရွှေမြို့တော်တံခါးဖွင့် ရွှေသော့ကို လက်ခံရရှိပါပြီ!</p>
          <div class="actions" style="justify-content:center;margin-top:16px;">
            <button type="button" id="btn-take-treasure" class="primary">ရွှေပုံကြီးဆီ သွားယူမယ်</button>
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
    this.phase = 'BAIT_WALK';
    this.treasureRevealed = true;
    this.treasureContainer.setVisible(true);

    const speechText = ui().querySelector<HTMLElement>('#ugyi-speech-text');
    if (speechText) {
      speechText.textContent = 'ဟောဟိုမှာ ရွှေပုံကြီး... မင်း ချမ်းသာပြီ ဖိုးထောင်ရေ! အနားသွားပြီး ကောက်စမ်း မောင်မင်းကြီးသား!';
    }

    // U Gyi standing watchfully at x = 780
    this.ugyiX = 780;
    this.setUgyiPose('guard');
  }

  // ================= ACT V: THE AMBUSH & INSTANT BLACKOUT =================
  private triggerAmbush() {
    this.phase = 'AMBUSH';
    this.walkTargetX = null;
    this.playerControl = 'BOW'; // Pho Htung bends forward toward chest

    const speechBox = ui().querySelector<HTMLElement>('#ugyi-speech-box');
    if (speechBox) speechBox.hidden = true;

    // Action camera zoom in
    this.cameras.main.zoomTo(1.22, 500);

    // U Gyi tiptoes behind Pho Htung with a wicked grin
    this.setUgyiPose('rush');
    this.tweens.add({
      targets: this,
      ugyiX: this.playerX + 85,
      duration: 520,
      ease: 'Linear',
      onComplete: () => {
        // U Gyi raises walking stick high with BOTH hands!
        this.setUgyiPose('slam_windup');

        this.time.delayedCall(450, () => {
          // U Gyi swings down HARD!
          this.setUgyiPose('slam_strike');
          soundEngine.playStickWhack();
          this.cameras.main.shake(450, 0.026);

          // Explosive impact flash & immediate instant blackout!
          this.time.delayedCall(160, () => {
            this.triggerBlackoutTwist();
          });
        });
      },
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

  // ================= UTILITIES & EFFECTS =================
  private setUgyiPose(pose: keyof typeof UGYI_FRAMES) {
    this.ugyiPose = pose;
    if (this.ugyiSprite && this.ugyiSprite.active) {
      this.ugyiSprite.setFrame(pose);
    }
  }

  private togglePause() {
    if (this.phase === 'BLACKOUT') return;
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

      // Check Ambush Trigger condition
      if (this.playerX >= F5.triggerAmbushX) {
        this.triggerAmbush();
      }
    }

    // 2. Position Actors
    if (this.ugyiSprite && this.ugyiSprite.active) {
      this.ugyiSprite.setPosition(this.ugyiX, VISUAL_GROUND_Y);
      // U Gyi faces player
      this.ugyiSprite.setFlipX(this.playerX > this.ugyiX);
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

      if (this.isHurt) {
        this.hero.setTintFill(0xff8888);
      } else {
        this.hero.clearTint();
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

    // 4. Draw Overhead Palace Health Bar (3 Segments)
    if (!this.isDead && this.phase !== 'OPENING') {
      this.drawOverheadHealthBar(this.playerX, VISUAL_GROUND_Y - 98);
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
