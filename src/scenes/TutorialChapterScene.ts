import Phaser from 'phaser';
import SubtitleBox from '../ui/BridgeSubtitle.js';
import InventoryBar from '../ui/InventoryBar.js';
import DiegeticGrab from '../ui/DiegeticGrab';
import { VirtualTouchControls } from '../ui/VirtualTouchControls';
import { createPhoe, renderPhoe } from '../view/PhoeHtaungView';
import { soundEngine } from '../utils/SoundEngine.js';
import { audioDirector } from '../audio/AudioDirector.js';
import { gameState } from '../utils/AdventureState.js';
import { store } from '../services/adventure';
import { DIALOGUE } from '../content/dialogue.my';
import { TutorialStep } from '../domain/tutorial';
import { MicroInteractions } from '../utils/MicroInteractions.js';
import {
  INK,
  CREAM,
  GOLD,
  STONE,
  STEP_STONE,
  drawBlock,
  ensureBridgeTextures
} from '../view/BridgeView';

export { TutorialStep };

/**
 * TutorialChapterScene — Diegetic Prologue Walkthrough
 * 
 * Strictly follows:
 * - @[.agents/rules/core_design_system.md]:
 *   1. U Gyi overhead speech balloon (top: 14%) is the sole narrative guide.
 *   2. Universal Walkable Baseline: groundY = 576px (80% of 720px canvas).
 *   3. 3-Layer procedural vector inking formula: Outer INK outline (0x182720) -> base fill (STONE 0x3b4b3d) -> CREAM bevel (0xe9dfbd).
 *   4. Subterranean Base down to 720px with vertical strata lines every 92px.
 *   5. Myanmar traditional bag (Lwe-Ait) docked at bottom center (x = 640, y = 672).
 *   6. Multi-route and comedic troll trap mechanics.
 * - @[character.md]:
 *   1. Official Phoe Htaung character with PhoeHtaungView.
 *   2. Physical hitbox 36x56 standing, 25.2px prone belly-crawl (55% reduction, 88 px/s).
 *   3. Standardized 3-phase DiegeticGrab (crouch reach -> slide into Shan bag -> proud bounce).
 *   4. Universal mouth verb E: betel spit particle arc and splat.
 *   5. Comedic slapstick pancake squashed death ('ph-flat') with dizzy spinning stars.
 */
export default class TutorialChapterScene extends Phaser.Scene {
  public readonly groundY = 576; // Universal Walkable Baseline: 576px
  public step: TutorialStep = TutorialStep.WALK;
  public subtitle: SubtitleBox | null = null;
  public inventoryBar: InventoryBar | null = null;
  public diegeticGrab: DiegeticGrab | null = null;
  public touchControls: VirtualTouchControls | null = null;

  // Character Kinematics & States (character.md)
  public actor!: Phaser.GameObjects.Sprite;
  public playerShadow!: Phaser.GameObjects.Ellipse;
  public centerX = 180;
  public feetY = 576;
  public vx = 0;
  public vy = 0;
  public grounded = true;
  public facing: -1 | 1 = 1;
  public controlState: 'FREE' | 'TAUNTING' | 'LOCKED' | 'DEAD' | 'PICKUP' | 'RUMMAGE' | 'LAYING' = 'FREE';
  public poseOverride: string | undefined = undefined;
  public isLaying = false;
  public isDead = false;
  public jumpPressed = false;
  public walkDistance = 0;
  public lastX = 180;
  public crouchDuration = 0;
  public clock = 0;
  public lastStepAudioTime = 0;
  public leftHeld = false;
  public rightHeld = false;
  public downHeld = false;
  public targetX: number | null = null;
  public pendingAction: (() => void) | null = null;

  // Pre-cached input keys
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;
  private keyE!: Phaser.Input.Keyboard.Key;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  // Environment & Hazards
  public obstacleBlock: Phaser.GameObjects.Graphics | null = null;
  public trapBoulder: Phaser.GameObjects.Image | null = null;
  public trapTriggered = false;
  public nutItemContainer: Phaser.GameObjects.Container | null = null;
  public itemAura: Phaser.GameObjects.Graphics | null = null;

  // Window input listeners
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;
  private keyupHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor() {
    super('TUTORIAL');
  }

  create() {
    this.physics.world.resume();
    this.time.paused = false;
    this.input.enabled = true;
    this.cameras.main.fadeIn(350, 12, 10, 8);

    const width = 1280;
    const height = 720;
    this.step = TutorialStep.WALK;
    this.controlState = 'FREE';
    this.poseOverride = undefined;
    this.isDead = false;
    this.isLaying = false;
    this.jumpPressed = false;
    this.centerX = 180;
    this.feetY = this.groundY;
    this.vx = 0;
    this.vy = 0;
    this.grounded = true;
    this.facing = 1;
    this.walkDistance = 0;
    this.crouchDuration = 0;
    this.trapTriggered = false;
    this.clock = 0;
    this.lastStepAudioTime = 0;
    this.lastX = this.centerX;
    this.targetX = null;

    // Audio setup
    soundEngine.init?.();
    if (!soundEngine.muted) {
      soundEngine.startBGM?.();
      audioDirector.startStems?.(0.18, 0.14, 0.16);
      audioDirector.handleRespawn?.();
    }

    // Ensure procedural textures exist
    ensureBridgeTextures(this, 192);

    // =========================================================================
    // 1. Static Scenic Background (Zero mouse-parallax drift & zero breathing)
    // =========================================================================
    this.add.rectangle(640, 360, width, height, 0x1f3427).setDepth(0);
    if (this.textures.exists('background')) {
      this.add
        .image(640, 360, 'background')
        .setDisplaySize(width, height)
        .setAlpha(0.85)
        .setDepth(1);
    }

    // Atmospheric Morning Sunbeams
    const sunbeam = this.add.graphics().setDepth(2);
    sunbeam.fillStyle(0xfbbf24, 0.045);
    sunbeam.fillTriangle(width * 0.52, 0, width * 0.12, height, width * 0.72, height);
    sunbeam.fillStyle(0xfbbf24, 0.025);
    sunbeam.fillTriangle(width * 0.65, 0, width * 0.40, height, width * 0.95, height);

    // =========================================================================
    // 2. Ground Design from core_design_system.md & BridgeView.ts
    // =========================================================================
    const sg = this.add.graphics().setDepth(10);

    // Universal Walkable Baseline: groundY = 576px, subterranean height = 144px (down to 720px)
    // 3-Layer Procedural Inking: Outer INK outline (0x182720) -> base fill STONE (0x3b4b3d) -> CREAM highlight bevel
    drawBlock(sg, { x: 0, y: this.groundY, w: width, h: 144 }, STONE);

    // Top grass/moss rim (height 8px)
    sg.fillStyle(0x8e9470, 1).fillRect(0, this.groundY, width, 8);

    // Vertical subterranean rock strata lines down to bottom (720px)
    for (let x = 0; x < width; x += 92) {
      sg.lineStyle(1.2, 0x172820, 0.55).lineBetween(x, this.groundY + 10, x + 12, 720);
    }

    // Organic stone stress cracks along ground surface
    sg.lineStyle(1, 0x182720, 0.6);
    sg.beginPath();
    sg.moveTo(340, this.groundY + 1);
    sg.lineTo(343, this.groundY + 9);
    sg.lineTo(339, this.groundY + 18);
    sg.strokePath();

    sg.beginPath();
    sg.moveTo(680, this.groundY + 1);
    sg.lineTo(678, this.groundY + 8);
    sg.lineTo(682, this.groundY + 16);
    sg.strokePath();

    // =========================================================================
    // 3. Ancient Obstacle Boundary (at x = 620px)
    // =========================================================================
    this.obstacleBlock = this.add.graphics().setDepth(12);
    drawBlock(
      this.obstacleBlock,
      { x: 620, y: this.groundY - 36, w: 56, h: 36 },
      STEP_STONE,
      true
    );

    // =========================================================================
    // 4. Character from character.md (Phoe Htaung Official Actor)
    // =========================================================================
    // Soft Ambient Occlusion shadow under feet
    this.playerShadow = this.add.ellipse(this.centerX, this.groundY + 2, 48, 12, 0x070503, 0.70)
      .setDepth(149);

    // Authentic High-Resolution Phoe Htaung Actor (Depth 150)
    const phoeSprite = createPhoe(this, 150);
    if (phoeSprite) {
      this.actor = phoeSprite;
    } else {
      this.actor = this.add.sprite(this.centerX, this.groundY, 'ph-idle').setDepth(150);
    }

    // =========================================================================
    // 5. UI Overlays (Lwe-Ait Bag at 640x672, U Gyi Speech Balloon at top: 14%)
    // =========================================================================
    this.subtitle = new SubtitleBox(this);
    this.inventoryBar = new InventoryBar(this);
    // Center traditional Shan bag permanently in subterranean base (core_design_system.md)
    if (this.inventoryBar) {
      (this.inventoryBar as any).isMobile = true;
      (this.inventoryBar as any).repositionBag?.();
    }

    this.touchControls = new VirtualTouchControls(this, {
      mode: 'CH1',
      onAction: () => {
        this.handleMouthVerb();
      }
    });

    // =========================================================================
    // 6. 3-Phase Diegetic Grab Component & Ground Betel Nut Spawn
    // =========================================================================
    gameState.checkpointChapter('TUTORIAL');
    this.diegeticGrab = new DiegeticGrab(this, {
      inventoryBar: this.inventoryBar,
      onAutoWalk: (targetX, onReach) => {
        this.interactWithProximity(targetX, onReach);
      },
      getActor: () => ({
        x: this.centerX,
        y: this.groundY - 40,
        facing: this.facing,
        setControl: (ctrl: string) => {
          this.controlState = ctrl as any;
        },
        bounce: () => {
          this.tweens.add({
            targets: this.actor,
            scaleY: (this.actor.scaleY || 1) * 1.08,
            duration: 120,
            yoyo: true,
            ease: 'Back.easeOut'
          });
        },
        sprite: this.actor
      })
    });

    // Spawn Betel Nut Chunk immediately on the ground with sparkling aura
    this.spawnBetelNutPickup();

    // Mouse click-to-walk affordance
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isDead || this.controlState === 'PICKUP' || this.controlState === 'RUMMAGE') return;
      if (pointer.y > 640 && (pointer.x < 140 || pointer.x > 1140)) return;
      if (pointer.y < 120) return;
      this.pendingAction = null;
      this.targetX = pointer.x;
      try { MicroInteractions.spawnClickMarker(this, pointer.x, this.groundY - 6); } catch {}
    });

    // Setup input keys
    this.setupControls();

    // Shutdown cleanup
    this.events.once('shutdown', () => {
      this.cleanupControls();
      audioDirector.stopWalking?.();
    });

    // Focus canvas for reliable immediate keyboard input
    try {
      this.game.canvas.tabIndex = 0;
      this.game.canvas.focus();
    } catch {}

    // Start Step 1 dialogue immediately without delay
    this.startStepEntry();
  }

  private setupControls() {
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
      this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

      this.keyE.on('down', () => {
        if (document.activeElement instanceof HTMLInputElement) return;
        this.handleMouthVerb();
      });
    }

    this.keydownHandler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      this.targetX = null;
      const k = e.key.toLowerCase();
      if (k === 'a' || k === 'arrowleft') this.leftHeld = true;
      if (k === 'd' || k === 'arrowright') this.rightHeld = true;
      if (k === 's' || k === 'arrowdown') this.downHeld = true;
      if ([' ', 'w', 'arrowup'].includes(k)) {
        e.preventDefault();
        this.jumpPressed = true;
      }
      if (k === 'e') {
        this.handleMouthVerb();
      }
    };

    this.keyupHandler = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'a' || k === 'arrowleft') this.leftHeld = false;
      if (k === 'd' || k === 'arrowright') this.rightHeld = false;
      if (k === 's' || k === 'arrowdown') this.downHeld = false;
      if ([' ', 'w', 'arrowup'].includes(k)) {
        this.jumpPressed = false;
      }
    };

    window.addEventListener('keydown', this.keydownHandler);
    window.addEventListener('keyup', this.keyupHandler);
  }

  private cleanupControls() {
    if (this.keydownHandler) {
      window.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }
    if (this.keyupHandler) {
      window.removeEventListener('keyup', this.keyupHandler);
      this.keyupHandler = null;
    }
  }

  // =========================================================================
  // Step Progression Logic
  // =========================================================================

  private startStepEntry() {
    this.step = TutorialStep.WALK;
    this.subtitle?.say(DIALOGUE.tutorial_entry, undefined, 7000);
  }

  private triggerCrouchLesson() {
    if (this.step !== TutorialStep.WALK) return;
    this.step = TutorialStep.CROUCH;
    this.subtitle?.say(DIALOGUE.tutorial_crouch, undefined, 6500);
  }

  private spawnBetelNutPickup() {
    const nutX = 380;
    const nutY = this.groundY - 18;

    // Golden ambient sparkle aura beneath the betel nut
    this.itemAura = this.add.graphics().setDepth(144);
    this.itemAura.fillStyle(0xf59e0b, 0.18).fillCircle(nutX, this.groundY - 14, 22);

    // Register standardized 3-phase DiegeticGrab pickup (character.md Section 5)
    this.diegeticGrab?.createPickup({
      id: 'betel_nut',
      campaignKey: 'betel_nut',
      x: nutX,
      y: nutY,
      textureKey: 'ch1_vector_betel_nut',
      scale: 1.35,
      depth: 145,
      bobRange: 4,
      bobDuration: 1100,
      proximityRadius: 85,
      onBagged: () => {
        if (this.itemAura) {
          this.itemAura.destroy();
          this.itemAura = null;
        }
        this.step = TutorialStep.SPIT;
        this.subtitle?.say(DIALOGUE.tutorial_item_picked, () => {
          this.subtitle?.say(DIALOGUE.tutorial_betel_prompt, undefined, 7500);
        }, 1600);
      }
    });
  }

  public restoreBetelNutPickup() {
    if (this.nutItemContainer) {
      this.nutItemContainer.destroy();
      this.nutItemContainer = null;
    }
    if (this.itemAura) {
      this.itemAura.destroy();
      this.itemAura = null;
    }
    this.diegeticGrab?.clear();
    this.spawnBetelNutPickup();
  }

  public interactWithProximity(targetX: number, onReach: () => void) {
    if (this.isDead || this.controlState === 'PICKUP' || this.controlState === 'RUMMAGE') return;
    const offset = this.centerX < targetX ? -20 : 20;
    const destX = targetX + offset;

    if (Math.abs(this.centerX - destX) <= 6) {
      this.facing = this.centerX < targetX ? 1 : -1;
      this.vx = 0;
      this.targetX = null;
      this.pendingAction = null;
      onReach();
    } else {
      this.targetX = destX;
      this.pendingAction = () => {
        this.facing = this.centerX < targetX ? 1 : -1;
        this.vx = 0;
        onReach();
      };
    }
  }

  public handleMouthVerb() {
    if (this.isDead || this.step === TutorialStep.FINISHED) return;

    // 1. Proximity check: If near the pickup, walk directly up to it and grab into Shan bag via E
    if (this.diegeticGrab && (this.step === TutorialStep.PICKUP || this.step === TutorialStep.CROUCH || this.step === TutorialStep.WALK)) {
      const nutSprite = this.diegeticGrab.getPickupSprite('betel_nut');
      if (nutSprite && nutSprite.active) {
        const dist = Math.abs(this.centerX - nutSprite.x);
        if (dist <= 120) {
          this.interactWithProximity(nutSprite.x, () => {
            this.diegeticGrab?.executeGrab('betel_nut');
          });
          return;
        }
      }
    }

    // 2. Universal Mouth Verb: Betel Nut Spit
    this.controlState = 'TAUNTING';
    soundEngine.playSpit?.();

    // Emits red betel spit particle arc
    const spitX = this.centerX + this.facing * 18;
    const spitY = this.groundY - 38;
    const spit = this.add.circle(spitX, spitY, 4, 0xb91c1c).setDepth(160);

    this.tweens.add({
      targets: spit,
      x: spitX + this.facing * 140,
      y: this.groundY - 2,
      duration: 240,
      ease: 'Quad.easeIn',
      onComplete: () => {
        const splat = this.add.ellipse(spit.x, this.groundY - 1, 10, 4, 0x7f1d1d).setDepth(148);
        this.time.delayedCall(4000, () => splat.destroy());
        spit.destroy();
      }
    });

    this.time.delayedCall(350, () => {
      if (this.controlState === 'TAUNTING') {
        this.controlState = 'FREE';
      }
    });

    if (this.step === TutorialStep.SPIT) {
      this.step = TutorialStep.JUMP;
      this.subtitle?.say(DIALOGUE.tutorial_betel_spit, () => {
        this.subtitle?.say(DIALOGUE.tutorial_jump_prompt, undefined, 8000);
      }, 1600);
    }
  }

  public triggerJumpTrollTrap() {
    if (this.trapTriggered || this.isDead) return;
    this.trapTriggered = true;
    this.isDead = true;
    this.step = TutorialStep.TRAP;
    this.controlState = 'DEAD';
    this.vx = 0;
    this.vy = 0;

    // Audio effects: record scratch needle drop + heavy bonk
    audioDirector.handleTrapInvisibleBlock?.();
    soundEngine.playWoosh?.();

    // Reveal hidden troll block crashing directly onto head
    const blockX = this.centerX;
    const targetBlockY = this.groundY - 55;

    const blockTexture = this.textures.exists('ch1-trap-block') ? 'ch1-trap-block' : 'ch1_vector_brick';
    this.trapBoulder = this.add.image(blockX, targetBlockY - 140, blockTexture)
      .setDepth(165)
      .setScale(1.4);

    this.tweens.add({
      targets: this.trapBoulder,
      y: targetBlockY,
      duration: 130,
      ease: 'Back.easeIn',
      onComplete: () => {
        this.cameras.main.shake(350, 0.04);
        try { (soundEngine as any).playSplat?.(); } catch {}

        // Crumbling stone dust particles
        try {
          MicroInteractions.spawnFootstepDust(this, blockX, targetBlockY + 15, 1);
          MicroInteractions.spawnFootstepDust(this, blockX, targetBlockY + 15, -1);
        } catch {}

        // Comedic Slapstick Squashed Pancake Pose (character.md Section 3)
        this.poseOverride = 'ph-flat';
        this.feetY = this.groundY;

        // Dizzy stars floating above squashed head
        const stars = this.add.text(this.centerX - 16, this.groundY - 45, '💫 💫', { fontSize: '24px' }).setDepth(170);
        this.tweens.add({
          targets: stars,
          y: stars.y - 28,
          alpha: 0.35,
          yoyo: true,
          repeat: 5,
          duration: 320
        });

        // U Gyi Unleashes Mocking Laugh & Roast
        this.time.delayedCall(450, () => {
          this.step = TutorialStep.ROAST;
          gameState.addDeath();
          gameState.restoreChapterOnFailure('TUTORIAL');
          this.inventoryBar?.refresh();
          this.inventoryBar?.clearSelected();
          this.restoreBetelNutPickup();

          this.subtitle?.say(DIALOGUE.tutorial_trap_death, () => {
            this.finishWalkthroughAndAdvance();
          }, 6500);

          // Failsafe auto-advance after 6s
          this.time.delayedCall(6000, () => {
            this.finishWalkthroughAndAdvance();
          });
        });
      }
    });
  }

  public finishWalkthroughAndAdvance() {
    if (this.step === TutorialStep.FINISHED) return;
    this.step = TutorialStep.FINISHED;

    store.completeTutorial();

    this.cameras.main.fade(600, 12, 10, 8);
    this.time.delayedCall(650, () => {
      this.scene.start('Chapter1Scene');
    });
  }

  // =========================================================================
  // Update Loop & Kinematic Physics Controller (character.md Section 4)
  // =========================================================================

  update(time: number, delta: number) {
    const dt = Math.min(delta / 1000, 0.05);
    this.clock += dt;

    if (this.isDead) {
      if (this.actor) {
        renderPhoe(
          this.actor,
          {
            centerX: this.centerX,
            feetY: this.groundY,
            vx: 0,
            vy: 0,
            grounded: true,
            facing: this.facing,
            control: 'DEAD',
            poseOverride: this.poseOverride
          },
          this.clock
        );
      }
      return;
    }

    // Input polling from cached keys
    const touchL = this.touchControls?.isLeft() ?? false;
    const touchR = this.touchControls?.isRight() ?? false;
    const touchDown = this.touchControls?.isCrawl() ?? false;
    const touchJump = this.touchControls?.isJump() ?? false;

    const left = Boolean(this.cursors?.left?.isDown || this.keyA?.isDown || this.leftHeld || touchL);
    const right = Boolean(this.cursors?.right?.isDown || this.keyD?.isDown || this.rightHeld || touchR);
    const down = Boolean(this.cursors?.down?.isDown || this.keyS?.isDown || this.downHeld || touchDown);
    const jump = Boolean(this.cursors?.up?.isDown || this.keyW?.isDown || this.keySpace?.isDown || this.jumpPressed || touchJump);

    // Prone Belly-Crawl Mechanics (character.md Section 4.2)
    if (down && this.grounded && !this.isLaying && this.controlState !== 'PICKUP' && this.controlState !== 'RUMMAGE') {
      this.isLaying = true;
      this.controlState = 'LAYING';
      soundEngine.playLongyiRustle?.();
    } else if (!down && this.isLaying && this.controlState === 'LAYING') {
      this.isLaying = false;
      this.controlState = 'FREE';
    }

    if (this.isLaying) {
      this.crouchDuration += dt;
      if (this.step === TutorialStep.CROUCH && this.crouchDuration >= 0.25) {
        this.step = TutorialStep.PICKUP;
        this.subtitle?.say(DIALOGUE.tutorial_item_prompt, undefined, 7500);
      }
    }

    // Horizontal Locomotion: 220 px/s walk, 88 px/s prone crawl (character.md Section 4.1 & 4.2)
    const baseSpeed = this.isLaying ? 88 : 220;
    this.vx = 0;

    if (this.controlState !== 'PICKUP' && this.controlState !== 'RUMMAGE') {
      if (left && !right) {
        this.vx = -baseSpeed;
        this.facing = -1;
        this.targetX = null;
        this.pendingAction = null;
      } else if (right && !left) {
        this.vx = baseSpeed;
        this.facing = 1;
        this.targetX = null;
        this.pendingAction = null;
      } else if (this.targetX !== null) {
        const diff = this.targetX - this.centerX;
        if (Math.abs(diff) > 4) {
          this.vx = Math.sign(diff) * baseSpeed;
          this.facing = diff > 0 ? 1 : -1;
        } else {
          this.centerX = this.targetX;
          this.vx = 0;
          this.targetX = null;
          if (this.pendingAction) {
            const action = this.pendingAction;
            this.pendingAction = null;
            action();
          }
        }
      }
    }

    // Integrate horizontal position
    this.centerX += this.vx * dt;
    this.centerX = Math.max(36, Math.min(1244, this.centerX));

    // Obstacle block collision: stop grounded movement at x = 620 so player must jump
    if (this.grounded && this.centerX > 602 && this.centerX < 640) {
      this.centerX = 602;
      this.targetX = null;
    }

    // Jump impulse: -570 px/s (character.md Section 4.1)
    if (jump && this.grounded && !this.isLaying && this.controlState === 'FREE') {
      this.vy = -570;
      this.grounded = false;
      soundEngine.playJump?.();
      this.jumpPressed = false;
    }

    // Vertical Gravity Integration: 1700 px/s^2 (character.md Section 4.1)
    if (!this.grounded) {
      this.vy += 1700 * dt;
      this.feetY += this.vy * dt;

      // Landing on Universal Baseline (576px)
      if (this.feetY >= this.groundY) {
        this.feetY = this.groundY;
        this.vy = 0;
        this.grounded = true;
      }
    }

    // Track walk distance for Step 1
    const dx = Math.abs(this.centerX - this.lastX);
    this.lastX = this.centerX;
    if (this.grounded && this.vx !== 0 && !this.isLaying) {
      this.walkDistance += dx;
      if (this.step === TutorialStep.WALK && this.walkDistance >= 50) {
        this.triggerCrouchLesson();
      }
    }

    // Footstep audio & dust particles
    if (this.grounded && this.vx !== 0) {
      if (this.isLaying) {
        try { MicroInteractions.spawnFootstepDust(this, this.centerX, this.groundY, this.facing); } catch {}
      } else {
        if (time - this.lastStepAudioTime > 220) {
          this.lastStepAudioTime = time;
          audioDirector.onPlayerStep?.(time);
          try { MicroInteractions.spawnFootstepDust(this, this.centerX, this.groundY, this.facing); } catch {}
        }
      }
    }

    // Update shadow position to match feet baseline
    if (this.playerShadow) {
      this.playerShadow.x = this.centerX;
      this.playerShadow.y = this.groundY + 2;
    }

    // Troll Trap Trigger: strictly appears when jumping the obstacle (x >= 590 && x <= 710)
    if (!this.grounded && this.centerX >= 590 && this.centerX <= 710) {
      this.triggerJumpTrollTrap();
    }

    // Render Phoe Htaung Official Actor View (character.md Section 3)
    if (this.actor) {
      renderPhoe(
        this.actor,
        {
          centerX: this.centerX,
          feetY: this.feetY,
          vx: this.vx,
          vy: this.vy,
          grounded: this.grounded,
          facing: this.facing,
          control: this.controlState,
          poseOverride: this.poseOverride
        },
        this.clock
      );
    }
  }
}
