import LegacyBridge from './Chapter1Scene.js';
import { C } from '../content/chapter1';
import { createPhoe, renderPhoe } from '../view/PhoeHtaungView';
import { gameState } from '../utils/AdventureState.js';
import { store } from '../services/adventure';
import { soundEngine } from '../utils/SoundEngine.js';
import { audioDirector } from '../audio/AudioDirector.js';
import { ITEM_TEXTURE_KEYS } from '../utils/AdventureState.js';
import { installBridgePart } from '../domain/bridge';
import { MicroInteractions } from '../utils/MicroInteractions.js';
import {
  INK,
  CREAM,
  GOLD,
  METAL,
  WOOD,
  STONE,
  STEP_STONE,
  drawBlock,
  ensureBridgeTextures,
  drawBridgeTerrain,
  drawCeilingSpikes,
  createBrickTexture,
  drawFishingLine
} from '../view/BridgeView';
import { DIALOGUE } from '../content/dialogue.my';

let retryMustRelease = false;

/**
 * BridgeChapterScene — Chapter 1 Modernized Adapter
 * Inherits mechanics, inputs, campaign boundaries, and friend's legacy puzzle logic.
 * Overhauls visuals to match Chapter 2's clean procedural vector art style:
 * - Static background with zero parallax drift or camera breathing
 * - Crisp procedural vector flagstone platforms and pit chasm
 * - Procedural WOOD drawbridge with dark iron straps and GOLD rivets
 * - Procedural METAL winch with dynamic suspension cable
 * - Vector item pickups (rusty cog and bamboo pole) with subtle idle bob and gold aura
 * - Stylized clue stele and secret wall crack
 */
export default class BridgeChapterScene extends LegacyBridge {
  init(data = {}) {
    this.replay = Boolean(data.replay);
  }

  // Suppress legacy decorative clutter before it creates
  createAmbientToys() {}
  createRightCaveEntrance() {}

  createCeilingSpikes() {
    this.spikesG = this.add.graphics().setDepth(20);
    drawCeilingSpikes(this.spikesG, this.scale.width);
  }

  create() {
    this.physics.world.resume();
    this.time.paused = false;
    this.input.enabled = true;

    // Ensure our crisp procedural vector textures exist
    const pitWidth = this.scale.width * 0.15;
    ensureBridgeTextures(this, pitWidth + 26);

    super.create();

    // Ensure clean 60% left platform, 15% pit, 25% right platform proportions
    this.leftPlatWidth = this.scale.width * 0.60;
    this.pitWidth = this.scale.width * 0.15;
    this.rightPlatX = this.scale.width * 0.75;
    this.rightPlatWidth = this.scale.width - this.rightPlatX;

    // 1. Deactivate & destroy moving parallax background
    if (this.parallax) {
      this.parallax.destroy();
      this.parallax = null;
    }

    // 2. Clean up heavy atmospheric clutter (dust motes, volumetric rays, dark silhouettes)
    this.children.list
      .filter(
        c =>
          (c.depth >= 110 && c.depth <= 130) ||
          (c.depth >= 240 && c.depth <= 260)
      )
      .forEach(c => c.destroy());

    // 3. Mount clean static background matching Chapter 2
    this.add.rectangle(640, 360, 1280, 720, 0x22382c).setDepth(0);
    if (this.textures.exists('background')) {
      this.add
        .image(640, 360, 'background')
        .setDisplaySize(1280, 720)
        .setAlpha(0.82)
        .setDepth(1);
    }

    // 4. Draw crisp procedural terrain, platforms, pit, and exit gateway
    this.terrainG = this.add.graphics().setDepth(15);
    drawBridgeTerrain(
      this.terrainG,
      this.leftPlatWidth,
      this.pitWidth,
      this.rightPlatX,
      this.rightPlatWidth,
      this.groundY
    );

    // 5. Left Secret Wall & Crack Overlay
    this.leftWallG = this.add.graphics().setDepth(16);
    drawBlock(this.leftWallG, { x: 0, y: this.groundY - 140, w: 26, h: 140 }, STEP_STONE);
    this.leftWallG.lineStyle(2, INK, 0.8).lineBetween(13, this.groundY - 140, 13, this.groundY);
    this.leftWall.setAlpha(0.001); // Invisible click collider
    this.secretTunnelDoor.setDepth(17);

    // Authentic U Gyi opening voiceover prompt from narration.txt
    this.time.delayedCall(500, () => {
      this.subtitle.say(
        'ဟောဒီမှာ ကြည့်စမ်း... ရွှေမြို့တော် အဝင်တောင်ကြားလမ်းတဲ့။ ရှေ့မှာ တွင်းလေး နည်းနည်းဟနေတယ်။ မောင်ဖိုးထောင်ရေ... မင်း ခြေထောက်သန်ပါတယ်၊ တစ်ချက်လောက် ခုန်ကူးပြလိုက်စမ်းပါ!'
      );
    });

    // State & physics setup
    this.sharedPaused = false;
    this.completing = false;
    this.deathClock = 0;
    this.deathType = null;
    this.squashedAgainstSpikes = false;
    this.activeTime = 0;
    this.restartHeldTime = 0;
    this.jumpHeld = false;
    this.jumpBuffer = 0;
    this.coyote = 0;
    this.facing = 1;
    this.winchJammed = false;
    this.winchLubricated = false;
    this.poleTied = true;
    this.cogWedged = true;
    this.isPrying = false;
    this.bambooItem = null;
    this.cogItem = null;
    if (!gameState.hasItem('betel_cutter')) {
      gameState.addItem('betel_cutter');
    }
    this.inventoryBar?.refresh();
    this.jamCounter = 0;
    this.hazardStarted = false;
    this.nextBrickTimer = 7.0;
    this.hazardDropIndex = 0;
    this.firstHazardTriggered = false;
    this.isVaulting = false;
    this.coinYoinked = false;
    this.isLaying = false;
    this.crawlDustTimer = 0;
    this.isMudSubmerged = false;
    this.muddyTimer = 0;
    this.hasActiveBees = false;
    this.beeChaseSpeed = 140;
    this.activeBees = [];
    this.beeswaxItem = null;
    this.mudPatch = null;
    this.mudBounds = null;

    // Procedural Mud Patch on left platform
    this.createMudPatch(this.groundY);

    // Split Right Platform into Safe Landing Shelf, Collapsible Trapdoor Slab, and Safe Exit Ledge
    if (this.rightPlatCollider) {
      this.physics.world.removeCollider(this.rightPlatCollider);
      this.rightPlatCollider = null;
    }
    if (this.rightPlat) {
      this.rightPlat.destroy();
      this.rightPlat = null;
    }

    // Safe Landing Shelf (960 to 1030, center 995, width 70)
    this.rightLandingPlat = this.add
      .rectangle(995, this.groundY + 60, 70, 120, 0x000000)
      .setAlpha(0);
    this.physics.add.existing(this.rightLandingPlat, true);
    this.physics.add.collider(this.player, this.rightLandingPlat);

    // Collapsible Ground Segment under the Gold Coin (1030 to 1120, center 1075, width 90, height 120)
    this.trapFloorColliderBody = this.add
      .rectangle(1075, this.groundY + 60, 90, 120, 0x000000)
      .setAlpha(0);
    this.physics.add.existing(this.trapFloorColliderBody, true);
    this.trapFloorCollider = this.physics.add.collider(
      this.player,
      this.trapFloorColliderBody
    );
    this.trapTriggered = false;

    // Safe Exit Ledge (1120 to 1280, center 1200, width 160)
    this.rightExitPlat = this.add
      .rectangle(1200, this.groundY + 60, 160, 120, 0x000000)
      .setAlpha(0);
    this.physics.add.existing(this.rightExitPlat, true);
    this.physics.add.collider(this.player, this.rightExitPlat);

    // Fishing line graphics layer for legacy coin yoink fallback
    this.fishingLineG = this.add.graphics().setDepth(29);

    // Configure Trap 1: Invisible Sky Block (Die Again head-bonk)
    if (this.invisibleBlock) {
      this.invisibleBlock.setTexture('ch1-trap-block').setScale(1).setAlpha(0).setDepth(40);
      this.invisibleBlock.body?.updateFromGameObject?.();
    }

    // Configure Deceptive Bait: Giant Shiny Gold Coin on normal ground
    if (this.coin) {
      this.coin.setPosition(1075, this.groundY - 24);
      this.coin.setTexture('coin-bait').setScale(0.85).setDepth(28);
      this.coin.setInteractive({ useHandCursor: true });
      this.coin.on('pointerdown', (_p, _x, _y, event) => {
        event?.stopPropagation();
        this.interactWithProximity(1075, () => {
          this.triggerGreedyCoinTrap();
        });
      });
    }

    // Clean up checkpoint flag text sticker
    if (this.flag) {
      this.flag.setVisible(false);
      this.flag.destroy();
      this.flag = null;
    }

    // Tantalizing ambient gold aura under the coin bait
    this.baitGlow = this.add.graphics().setDepth(27);
    this.baitGlow.fillStyle(GOLD, 0.15).fillCircle(1075, this.groundY - 26, 28);

    // Character setup
    this.playerBaseScale = 1;
    this.player.setScale(1).setOrigin(0.5, 1).setVisible(false).setGravityY(C.gravity);
    this.fixBody();
    this.phoe = createPhoe(this, 180);
    if (!this.phoe) this.player.setVisible(true);

    // Controls
    this.rKey = this.input.keyboard.addKey('R');
    this.eKey = this.input.keyboard.addKey('E');
    this.eKey.on('down', () => {
      if (!this.sharedPaused && !(document.activeElement instanceof HTMLInputElement)) {
        this.handleBetelSpit();
      }
    });
    this.game.canvas.tabIndex = 0;
    this.game.canvas.focus();
    this.jumpPressed = false;

    const down = e => {
      if (e.repeat || this.sharedPaused || e.target instanceof HTMLInputElement) return;
      const k = e.key.toLowerCase();
      if (k === 'r') retryMustRelease = false;
      if (k === 'e') this.handleBetelSpit();
      if ([' ', 'w', 'arrowup'].includes(k)) {
        e.preventDefault();
        this.jumpPressed = true;
      }
    };
    const up = e => {
      if (e.key.toLowerCase() === 'r') retryMustRelease = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);

    // Projectile throwing interaction for 'ancient_brick'
    this.input.on('pointerdown', (pointer, currentlyOver) => {
      if (this.isDead || this.completing || this.isVaulting) return;
      if (this.inventoryBar?.getSelected() === 'ancient_brick') {
        if (currentlyOver?.some(obj => obj.depth >= 100)) return;
        this.targetX = null;
        this.pendingAction = null;
        gameState.removeItem('ancient_brick');
        this.inventoryBar.clearSelected();
        this.inventoryBar.refresh();
        this.hideHeldItem();
        this.throwBrick(pointer.worldX || pointer.x, pointer.worldY || pointer.y);
      }
    });

    this.events.once('shutdown', () => {
      this.beeChaseTimer?.remove();
      this.activeBees = [];
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      audioDirector.stopWalking();
      audioDirector.hardMuteStems();
      soundEngine.stopBGM();
    });
  }

  createMudPatch(groundY) {
    const mx = 180;
    const my = groundY - 6;
    this.mudPatch = this.add.image(mx, my, 'ch1_vector_mud_patch').setDepth(22);
    this.mudBounds = { minX: mx - 55, maxX: mx + 55, y: my };

    // Ambient bubbling effect
    this.mudBubbleTimer = this.time.addEvent({
      delay: 2200,
      loop: true,
      callback: () => {
        if (!this.mudPatch?.active) return;
        const bx = mx + Phaser.Math.Between(-35, 35);
        const bubble = this.add.circle(bx, my - 2, 3, 0x5d4037, 0.85).setDepth(23);
        this.tweens.add({
          targets: bubble,
          y: my - 14,
          alpha: 0,
          scale: 1.5,
          duration: 650,
          onComplete: () => bubble.destroy()
        });
      }
    });
  }

  createWallChalkDiagram(_x, _y) {
    // Horizontally centered in the middle of the screen (x = 640) and safely below the HUD (clueY = 190)
    const clueX = 640;
    const clueY = 190;
    this.chalkContainer = this.add.container(clueX, clueY).setDepth(20);
    const diagram = this.add.image(0, 0, 'ch1_vector_stele');

    const hit = this.add
      .rectangle(0, 0, 130, 80, 0x000000, 0.001)
      .setInteractive({ useHandCursor: true });

    hit.on('pointerdown', () => {
      this.interactWithProximity(clueX, () => {
        soundEngine.playPaper();
        this.subtitle.say(
          'ကျောက်နံရံပေါ်က ပုံကြမ်းပဲ... စက်သီးမှာ ဂီယာနဲ့ ဝါးလုံးတပ်ပြီး လှည့်ရမယ်။ ဘယ်ဘက်နံရံကိုလည်း မျှားပြထားတယ်။'
        );
      });
    });

    this.chalkContainer.add([diagram, hit]);
  }

  createDrawbridgeAssembly(leftPlatWidth, groundY, pitWidth) {
    ensureBridgeTextures(this, pitWidth + 26);

    // 1. Winch Container at cliff edge (Depth: 35)
    this.winchContainer = this.add.container(leftPlatWidth - 45, groundY - 30).setDepth(35);

    // Winch Chassis graphics
    const winchG = this.add.graphics();
    drawBlock(winchG, { x: -22, y: -4, w: 44, h: 16 }, WOOD, true);
    drawBlock(winchG, { x: -14, y: -40, w: 28, h: 38 }, METAL);
    winchG.fillStyle(GOLD, 1).fillCircle(0, -20, 12);
    winchG.lineStyle(2, INK, 1).strokeCircle(0, -20, 12);
    winchG.fillStyle(INK, 1).fillCircle(0, -20, 4);

    // Cog Slot
    this.winchCogSlot = this.add
      .image(0, -20, 'ch1_vector_cog')
      .setScale(0.65)
      .setVisible(this.hasCog);

    // Lever Slot
    this.winchLeverSlot = this.add
      .image(0, -20, 'ch1_vector_bamboo')
      .setScale(0.6)
      .setOrigin(0.5, 0.9)
      .setAngle(-35)
      .setVisible(this.hasLever);

    // Interactive Hit Zone
    this.winchHitZone = this.add
      .rectangle(0, -10, 70, 80, 0x00ff00, 0.001)
      .setInteractive({ useHandCursor: true });

    this.winchHitZone.on('pointerdown', () => {
      this.interactWithProximity(this.winchContainer.x, () => {
        this.interactWithWinch();
      });
    });

    this.winchContainer.add([
      winchG,
      this.winchCogSlot,
      this.winchLeverSlot,
      this.winchHitZone
    ]);

    // 2. Procedural Vector Drawbridge Deck (Retracted upright at 0 deg, Depth: 25)
    this.bridgePivotX = leftPlatWidth + 2;
    this.bridgePivotY = groundY;
    this.bridgeLength = pitWidth + 26;

    this.drawbridge = this.add
      .image(this.bridgePivotX, this.bridgePivotY, 'ch1_vector_bridge')
      .setOrigin(0, 1)
      .setAngle(0)
      .setDepth(25);

    // Heavy Forged-Iron Pivot Hinge Bracket
    this.bridgeHinge = this.add.graphics().setDepth(26);
    this.bridgeHinge.fillStyle(INK, 1).fillCircle(this.bridgePivotX, this.bridgePivotY - 4, 8);
    this.bridgeHinge.fillStyle(0x4c4432, 1).fillCircle(this.bridgePivotX, this.bridgePivotY - 4, 5);
    this.bridgeHinge.fillStyle(GOLD, 1).fillCircle(this.bridgePivotX, this.bridgePivotY - 4, 2.5);

    // Dynamic Suspension Cable
    this.bridgeCable = this.add.graphics().setDepth(34);
    this.updateBridgeCable(0);
  }

  updateBridgeCable(angleDeg) {
    if (!this.bridgeCable) return;
    try {
      this.bridgeCable.clear();

      const spoolX = this.leftPlatWidth - 45;
      const spoolY = this.groundY - 50;

      const rad = (angleDeg * Math.PI) / 180;
      const tipX = this.bridgePivotX + Math.sin(rad) * this.bridgeLength;
      const tipY = this.bridgePivotY - Math.cos(rad) * this.bridgeLength;

      // Drop shadow
      this.bridgeCable.lineStyle(3, 0x000000, 0.35);
      this.bridgeCable.lineBetween(spoolX, spoolY + 2, tipX, tipY + 2);

      // Dark ink steel core
      this.bridgeCable.lineStyle(2.5, INK, 0.95);
      this.bridgeCable.lineBetween(spoolX, spoolY, tipX, tipY);

      // Steel highlight line
      this.bridgeCable.lineStyle(1.0, 0x94a3b8, 0.85);
      this.bridgeCable.lineBetween(spoolX, spoolY, tipX, tipY);

      // Eyelet bracket at tip
      this.bridgeCable.fillStyle(0x4c4432, 1).fillCircle(tipX, tipY, 4.5);
      this.bridgeCable.fillStyle(GOLD, 1).fillCircle(tipX, tipY, 2.0);
    } catch (e) {
      // Graceful fallback
    }
  }

  blockRetry() {
    retryMustRelease = true;
    this.jumpPressed = false;
  }

  interactWithProximity(targetX, onReachCallback) {
    if (this.isDead || this.completing) return;
    const reach = () => {
      this.facing = targetX > this.player.x ? 1 : -1;
      onReachCallback();
    };
    if (Math.abs(this.player.x - targetX) <= 85) reach();
    else {
      this.targetX = targetX > this.player.x ? targetX - 55 : targetX + 55;
      this.pendingAction = reach;
    }
  }

  createToolPickups(groundY) {
    this.pickupHalos = [];
    this.bambooItem = null;
    this.cogItem = null;

    // 1. Floating Stone Platform in the former stele location (x ≈ 340, y = groundY - 110)
    const platX = 340;
    const platY = groundY - 110;
    this.floatingPlat = this.add
      .image(platX, platY, 'ch1_vector_floating_platform')
      .setDepth(22);
    this.physics.add.existing(this.floatingPlat, true);
    this.physics.add.collider(this.player, this.floatingPlat);

    // Support bracket & Tied Bamboo Pole on Floating Platform
    this.scaffoldG = this.add.graphics().setDepth(23);
    drawBlock(this.scaffoldG, { x: platX - 9, y: platY - 68, w: 18, h: 56 }, WOOD, true);
    this.scaffoldG.fillStyle(INK, 1).fillCircle(platX, platY - 58, 3);
    this.scaffoldG.fillStyle(GOLD, 1).fillCircle(platX, platY - 58, 1.8);

    // Bamboo pole standing upright against bracket on floating platform
    this.tiedPoleSprite = this.add
      .image(platX, platY - 48, 'ch1_vector_bamboo')
      .setDepth(28)
      .setInteractive({ useHandCursor: true });

    // Coiled hemp rope knot bound over pole
    this.ropeKnotSprite = this.add
      .image(platX, platY - 45, 'ch1_vector_rope_knot')
      .setDepth(30)
      .setInteractive({ useHandCursor: true });

    const onPoleClick = (_p, _x, _y, event) => {
      event?.stopPropagation();
      this.interactWithProximity(platX, () => this.handleTiedPoleInteraction());
    };
    this.tiedPoleSprite.on('pointerdown', onPoleClick);
    this.ropeKnotSprite.on('pointerdown', onPoleClick);

    const onPoleOver = () => {
      if (this.tiedPoleSprite) this.tiedPoleSprite.setScale(1.08);
      if (this.ropeKnotSprite) this.ropeKnotSprite.setScale(1.08);
    };
    const onPoleOut = () => {
      if (this.tiedPoleSprite) this.tiedPoleSprite.setScale(1.0);
      if (this.ropeKnotSprite) this.ropeKnotSprite.setScale(1.0);
    };
    this.tiedPoleSprite.on('pointerover', onPoleOver);
    this.tiedPoleSprite.on('pointerout', onPoleOut);
    this.ropeKnotSprite.on('pointerover', onPoleOver);
    this.ropeKnotSprite.on('pointerout', onPoleOut);

    // 2. Wedged Cog in Fallen Rock Crevice (x = 580)
    // Heavy angular boulder matching STEP_STONE palette
    this.stuckRockSprite = this.add
      .image(580, groundY - 21, 'ch1_vector_stuck_rock')
      .setDepth(28)
      .setInteractive({ useHandCursor: true });

    // Cog teeth peeking out from boulder crevice at 20 deg
    this.wedgedCogSprite = this.add
      .image(592, groundY - 14, 'ch1_vector_cog')
      .setScale(0.55)
      .setAngle(20)
      .setDepth(29)
      .setInteractive({ useHandCursor: true });

    const onRockClick = (_p, _x, _y, event) => {
      event?.stopPropagation();
      this.interactWithProximity(580, () => this.handleStuckCogInteraction());
    };
    this.stuckRockSprite.on('pointerdown', onRockClick);
    this.wedgedCogSprite.on('pointerdown', onRockClick);

    const onRockOver = () => {
      if (this.stuckRockSprite) this.stuckRockSprite.setScale(1.06);
      if (this.wedgedCogSprite) this.wedgedCogSprite.setScale(0.55 * 1.1);
    };
    const onRockOut = () => {
      if (this.stuckRockSprite) this.stuckRockSprite.setScale(1.0);
      if (this.wedgedCogSprite) this.wedgedCogSprite.setScale(0.55);
    };
    this.stuckRockSprite.on('pointerover', onRockOver);
    this.stuckRockSprite.on('pointerout', onRockOut);
    this.wedgedCogSprite.on('pointerover', onRockOver);
    this.wedgedCogSprite.on('pointerout', onRockOut);
  }

  handleTiedPoleInteraction() {
    if (!this.poleTied || this.isInteracting || this.isDead || this.completing) return;
    const selected = this.inventoryBar?.getSelected();

    if (selected === 'betel_cutter') {
      this.isInteracting = true;
      this.hideHeldItem();
      soundEngine.playScissors();

      const dropTargetY = this.floatingPlat ? this.floatingPlat.y - 12 : this.groundY;

      // 1. Sever rope knot with drop & fade
      if (this.ropeKnotSprite) {
        this.tweens.add({
          targets: this.ropeKnotSprite,
          y: dropTargetY,
          alpha: 0,
          duration: 320,
          ease: 'Quad.In',
          onComplete: () => {
            if (this.ropeKnotSprite) {
              this.ropeKnotSprite.destroy();
              this.ropeKnotSprite = null;
            }
          }
        });
      }

      // 2. Bamboo pole tilts 0 -> 90 deg and drops into hand/bag
      if (this.tiedPoleSprite) {
        this.tweens.add({
          targets: this.tiedPoleSprite,
          angle: 90,
          y: dropTargetY - 4,
          duration: 260,
          ease: 'Bounce.Out',
          onComplete: () => {
            if (this.tiedPoleSprite) {
              this.tiedPoleSprite.destroy();
              this.tiedPoleSprite = null;
            }
            gameState.addItem('bamboo_pole');
            this.inventoryBar?.refresh();
            this.poleTied = false;
            this.isInteracting = false;
            soundEngine.playPickup();
            this.subtitle.say(DIALOGUE.bridge_rope_cut);
          }
        });
      } else {
        gameState.addItem('bamboo_pole');
        this.inventoryBar?.refresh();
        this.poleTied = false;
        this.isInteracting = false;
        soundEngine.playPickup();
        this.subtitle.say(DIALOGUE.bridge_rope_cut);
      }
      return;
    }

    // Bare-handed click: Narrator speaks clue directly
    soundEngine.playPing();
    this.subtitle.say(DIALOGUE.bridge_rope_hint);
  }

  handleStuckCogInteraction() {
    if (!this.cogWedged || this.isInteracting || this.isDead || this.completing) return;
    const selected = this.inventoryBar?.getSelected();

    if (selected === 'bamboo_pole') {
      this.isInteracting = true;
      this.isPrying = true;
      this.hideHeldItem();
      soundEngine.playStoneGrind();

      const rockX = this.stuckRockSprite ? this.stuckRockSprite.x : 580;
      const targetLandX = rockX + 37;
      // Temporary prying lever sprite
      const pryLever = this.add
        .image(rockX + 10, this.groundY - 18, 'ch1_vector_bamboo')
        .setOrigin(0.1, 0.9)
        .setAngle(40)
        .setDepth(34);

      // Rock tilt shift
      if (this.stuckRockSprite) {
        this.tweens.add({
          targets: this.stuckRockSprite,
          y: this.groundY - 26,
          duration: 220,
          yoyo: true,
          ease: 'Sine.InOut'
        });
      }

      // Lever prying motion + Cog launch
      this.tweens.add({
        targets: pryLever,
        angle: 65,
        duration: 220,
        yoyo: true,
        onYoyo: () => {
          soundEngine.playClang();
          MicroInteractions.spawnFootstepDust(this, rockX + 20, this.groundY, 1);

          if (this.wedgedCogSprite) {
            // Parabolic arc launch: X: rockX -> targetLandX, Y: arc up to groundY - 55 then land at groundY - 14
            this.tweens.add({
              targets: this.wedgedCogSprite,
              x: targetLandX,
              duration: 360,
              ease: 'Linear'
            });
            this.tweens.add({
              targets: this.wedgedCogSprite,
              y: this.groundY - 55,
              duration: 180,
              ease: 'Quad.Out',
              yoyo: true,
              easeYoyo: 'Quad.In',
              onComplete: () => {
                soundEngine.playClang();
                MicroInteractions.spawnFootstepDust(this, targetLandX, this.groundY, 1);
                if (this.wedgedCogSprite) {
                  this.wedgedCogSprite.destroy();
                  this.wedgedCogSprite = null;
                }
                this.cogWedged = false;
                this.isPrying = false;
                pryLever.destroy();
                this.isInteracting = false;
                this.spawnCogPickup(targetLandX, this.groundY - 14);
                this.subtitle.say(DIALOGUE.bridge_cog_pried);
              }
            });
            this.tweens.add({
              targets: this.wedgedCogSprite,
              angle: 180,
              duration: 360,
              ease: 'Quad.Out'
            });
          } else {
            this.cogWedged = false;
            this.isPrying = false;
            pryLever.destroy();
            this.isInteracting = false;
            this.spawnCogPickup(targetLandX, this.groundY - 14);
            this.subtitle.say(DIALOGUE.bridge_cog_pried);
          }
        }
      });
      return;
    }

    // Bare-handed click: Narrator speaks clue directly
    soundEngine.playPing();
    this.subtitle.say(DIALOGUE.bridge_cog_hint);
  }

  spawnCogPickup(px, py) {
    if (this.cogItem) {
      this.cogItem.destroy();
    }
    const halo = this.add.graphics().setDepth(28);
    halo.fillStyle(GOLD, 0.16).fillCircle(px, py, 18);
    this.cogPickupHalo = halo;

    const item = this.add
      .image(px, py, 'ch1_vector_cog')
      .setScale(0.75)
      .setDepth(30)
      .setInteractive({ useHandCursor: true });

    this.cogItem = item;

    // Hover micro-interaction
    item.on('pointerover', () => item.setScale(0.75 * 1.15));
    item.on('pointerout', () => item.setScale(0.75));

    item.on('pointerdown', (_p, _x, _y, event) => {
      event?.stopPropagation();
      this.interactWithProximity(item.x, () => {
        if (!item.active || this.isInteracting) return;
        this.isInteracting = true;
        this.pickupState = 'PICKUP';
        soundEngine.playWoosh();

        if (this.cogPickupHalo) {
          this.cogPickupHalo.destroy();
          this.cogPickupHalo = null;
        }

        const handX = this.player.body.center.x + this.facing * 18;
        const handY = this.groundY - 20;

        this.tweens.add({
          targets: item,
          x: handX,
          y: handY,
          scale: 0.4,
          duration: 220,
          ease: 'Quad.Out',
          onComplete: () => {
            soundEngine.playPickup();
            this.pickupState = 'RUMMAGE';
            soundEngine.playBagRustle();

            const bagX = this.player.body.center.x - this.facing * 10;
            const bagY = this.groundY - 45;

            this.tweens.add({
              targets: item,
              x: bagX,
              y: bagY,
              scale: 0.1,
              alpha: 0.3,
              duration: 260,
              ease: 'Cubic.In',
              onComplete: () => {
                gameState.addItem('rusty_cog');
                item.destroy();
                this.cogItem = null;
                this.inventoryBar?.refresh();
                this.pickupState = null;
                this.isInteracting = false;
                this.subtitle.say('ဂီယာခွေ ရပြီ။ လွယ်အိတ်က ရွေးပြီး စက်သီးမှာ တပ်ပါ။');
              }
            });
          }
        });
      });
    });
  }

  interactWithWinch() {
    if (this.bridgeLowered || this.isDead || this.isInteracting || this.isVaulting) return;

    const selected = this.inventoryBar.getSelected();
    const canInstall =
      (selected === 'rusty_cog' && !this.hasCog) ||
      (selected === 'bamboo_pole' && !this.hasLever);

    if (canInstall) {
      const result = installBridgePart(
        gameState.state.inventory,
        { cog: this.hasCog, lever: this.hasLever },
        selected
      );
      if (result) {
        const newlyInstalledCog = !this.hasCog && result.installed.cog;
        gameState.state.inventory = result.inventory;
        this.hasCog = result.installed.cog;
        this.hasLever = result.installed.lever;
        this.winchCogSlot.setVisible(this.hasCog);
        this.winchLeverSlot.setVisible(this.hasLever);
        this.hideHeldItem();
        this.inventoryBar.clearSelected();
        this.inventoryBar.refresh();
        soundEngine.playGearClick();

        if (this.hasCog && !this.winchLubricated) {
          this.winchJammed = true;
          soundEngine.playStoneGrind();
          this.subtitle.say(DIALOGUE.bridge_winch_jammed);
          return;
        }

        if (!this.winchJammed && this.hasCog && this.hasLever) {
          this.checkWinchReady();
        }
        return;
      }
    }

    // Winch clicked without an installable item selected
    if (this.winchJammed) {
      if (selected === 'beeswax' || gameState.hasItem('beeswax')) {
        this.handleApplyBeeswax();
        return;
      }
      this.jamCounter = (this.jamCounter || 0) + 1;
      if (this.jamCounter >= 2) {
        this.triggerWinchCatapult();
      } else {
        this.subtitle.say(DIALOGUE.bridge_winch_jammed);
        soundEngine.playStoneGrind();
        this.tweens.add({
          targets: [this.winchCogSlot, this.winchLeverSlot],
          angle: '+=8',
          yoyo: true,
          duration: 90,
          repeat: 2
        });
      }
      return;
    }

    if (!this.hasCog || !this.hasLever) {
      this.subtitle.say(
        'တံတားချရန် ဂီယာခွေနဲ့ ဝါးလုံးမောင်းတံ လိုတယ်။ လွယ်အိတ်က ရွေးပြီး စက်သီးမှာ သုံးပါ။'
      );
      return;
    }

    this.checkWinchReady();
  }

  checkWinchReady() {
    if (this.winchJammed) {
      this.subtitle.say(DIALOGUE.bridge_winch_jammed);
      soundEngine.playStoneGrind();
      return;
    }
    if (this.hasCog && this.hasLever && !this.bridgeLowered) {
      this.time.delayedCall(300, () => {
        this.turnWinchAndLowerBridge();
      });
    }
  }

  handleBetelSpit() {
    if (this.isDead || this.completing || this.isInteracting || this.isVaulting) return;
    if (this.activeTime - (this.lastSpitTime || 0) < 0.25) return;
    this.lastSpitTime = this.activeTime;

    const nearWinch = Math.abs(this.player.x - this.winchContainer.x) <= 85;

    if (nearWinch) {
      if (this.winchJammed) {
      this.isInteracting = true;
      this.facing = this.winchContainer.x > this.player.x ? 1 : -1;

      soundEngine.playWoosh();

      const startX = this.player.x + this.facing * 16;
      const startY = this.player.y - 36;
      const drop = this.add.sprite(startX, startY, 'ch1_betel_drop').setDepth(160);

      this.tweens.add({
        targets: drop,
        x: this.winchContainer.x,
        y: this.winchContainer.y - 20,
        duration: 320,
        ease: 'Quad.In',
        onComplete: () => {
          soundEngine.playPickup();
          drop.destroy();

          this.winchJammed = false;
          this.winchLubricated = true;
          this.isInteracting = false;

          // Golden sparkle flash on cog
          const sparkle = this.add.graphics().setDepth(40);
          sparkle.fillStyle(GOLD, 0.8).fillCircle(this.winchContainer.x, this.winchContainer.y - 20, 16);
          this.tweens.add({
            targets: sparkle,
            scaleX: 2.2,
            scaleY: 2.2,
            alpha: 0,
            duration: 450,
            onComplete: () => sparkle.destroy()
          });

          if (this.winchCogSlot) {
            this.winchCogSlot.setTint(0xffe066);
            this.time.delayedCall(350, () => this.winchCogSlot.clearTint());
          }

          this.subtitle.say(DIALOGUE.bridge_betel_spit);

          if (this.hasLever) {
            this.time.delayedCall(400, () => {
              this.checkWinchReady();
            });
          }
        }
      });
      return;
      } else if (!this.hasCog && gameState.hasItem('rusty_cog')) {
        this.inventoryBar?.setSelected('rusty_cog');
        this.interactWithWinch();
        return;
      } else if (!this.hasLever && gameState.hasItem('bamboo_pole')) {
        this.inventoryBar?.setSelected('bamboo_pole');
        this.interactWithWinch();
        return;
      } else if (this.hasCog && this.hasLever && !this.bridgeLowered) {
        this.interactWithWinch();
        return;
      }
    }

    // Check tied pole and stuck rock proximity
    const poleCheckX = this.floatingPlat ? this.floatingPlat.x : 340;
    const rockCheckX = this.stuckRockSprite ? this.stuckRockSprite.x : 580;
    if (this.poleTied && Math.abs(this.player.x - poleCheckX) <= 85) {
      this.handleTiedPoleInteraction();
      return;
    }
    if (this.cogWedged && Math.abs(this.player.x - rockCheckX) <= 85) {
      this.handleStuckCogInteraction();
      return;
    }

    // Check floor pickups within 85px proximity
    for (const field of ['cogItem', 'bambooItem', 'beeswaxItem']) {
      const item = this[field];
      if (item && item.active && Math.abs(this.player.x - item.x) <= 85) {
        item.emit('pointerdown');
        return;
      }
    }

    // Harmless betel spit if not near interactive entity
    soundEngine.playWoosh();
    const startX = this.player.x + this.facing * 16;
    const startY = this.player.y - 36;
    const drop = this.add.sprite(startX, startY, 'ch1_betel_drop').setDepth(160);
    this.tweens.add({
      targets: drop,
      x: startX + this.facing * 45,
      y: this.groundY,
      duration: 300,
      ease: 'Quad.In',
      onComplete: () => drop.destroy()
    });
  }

  handleApplyBeeswax() {
    if (this.bridgeLowered || this.isDead || this.isInteracting || this.isVaulting) return;

    gameState.removeItem('beeswax');
    this.inventoryBar?.clearSelected();
    this.inventoryBar?.refresh();
    this.hideHeldItem();

    this.winchJammed = false;
    this.winchLubricated = true;

    try { soundEngine.playStoneGrind(); } catch (e) {}
    try { soundEngine.playGearClick(); } catch (e) {}

    // Golden sparkle flash on cog
    const sparkle = this.add.graphics().setDepth(40);
    sparkle.fillStyle(GOLD, 0.8).fillCircle(this.winchContainer.x, this.winchContainer.y - 20, 16);
    this.tweens.add({
      targets: sparkle,
      scaleX: 2.2,
      scaleY: 2.2,
      alpha: 0,
      duration: 450,
      onComplete: () => sparkle.destroy()
    });

    if (this.winchCogSlot) {
      this.winchCogSlot.setTint(0xffe066);
      this.time.delayedCall(350, () => this.winchCogSlot.clearTint());
    }

    this.subtitle.say(DIALOGUE.bridge_beeswax_lubricate);

    if (this.hasLever) {
      this.time.delayedCall(400, () => {
        this.checkWinchReady();
      });
    }
  }

  triggerWinchCatapult() {
    if (this.isDead || this.completing) return;
    this.isDead = true;
    this.deathType = 'WINCH_CATAPULT';
    this.deathClock = 0;
    this.hideHeldItem();
    this.isInteracting = false;

    // Lever snaps backward with high torque
    if (this.winchLeverSlot) {
      this.tweens.add({
        targets: this.winchLeverSlot,
        angle: -180,
        duration: 160,
        ease: 'Bounce.Out'
      });
    }

    soundEngine.playClang();
    soundEngine.playStoneGrind();

    this.player.body.setVelocity(0, 0);
    this.physics.world.pause();

    gameState.addDeath();
    this.hud?.updateDeathCount();
    this.cameras.main.shake(300, 0.035);

    // Knocks Phoe Htaung backward into left wall
    this.tweens.add({
      targets: this.player,
      x: 32,
      duration: 340,
      ease: 'Quad.Out',
      onComplete: () => {
        try {
          MicroInteractions.spawnFootstepDust(this, 32, this.groundY, 1);
        } catch (e) {}
        try {
          soundEngine.playFootstep('stone');
        } catch (e) {}
      }
    });

    const stars = this.add
      .text(this.player.x, this.player.y - 20, '💫', { fontSize: '22px' })
      .setDepth(190);
    this.tweens.add({
      targets: stars,
      y: stars.y - 30,
      alpha: 0,
      duration: 800,
      onComplete: () => stars.destroy()
    });

    this.subtitle.say(DIALOGUE.bridge_winch_catapult);
  }

  showHeldItem(id) {
    this.hideHeldItem();
    const key =
      id === 'bamboo_pole'
        ? 'ch1_vector_bamboo'
        : id === 'rusty_cog'
        ? 'ch1_vector_cog'
        : id === 'beeswax'
        ? 'ch1_vector_beeswax'
        : id === 'ancient_brick'
        ? 'ch1_vector_brick'
        : ITEM_TEXTURE_KEYS[id];
    if (key) {
      this.heldItemSprite = this.add
        .image(this.player.x + 20, this.player.y - 15, key)
        .setScale(0.5)
        .setDepth(190);
    }
  }

  setPlayerPose() {
    if (this.player) {
      this.player.setTexture('ph-idle');
      this.fixBody();
    }
  }

  setLayingBody() {
    if (!this.player?.body) return;
    const f = this.player.frame;
    const w = C.playerW * 1.3;
    const h = C.playerH * 0.45;
    this.player.body.setSize(w, h, false);
    this.player.body.setOffset((f.realWidth - w) / 2, f.realHeight - h);
  }

  fixBody(force = false) {
    if (!this.player?.body) return;
    if (this.isLaying && !force) return;
    const f = this.player.frame;
    this.player.body.setSize(C.playerW, C.playerH, false);
    this.player.body.setOffset(
      (f.realWidth - C.playerW) / 2,
      f.realHeight - C.playerH
    );
    this.player.body.setMaxVelocity(900, C.terminal);
  }

  update(time, delta) {
    if (this.sharedPaused || this.completing) return;
    if (this.isVaulting) {
      this.drawPhoe();
      return;
    }
    const dt = Math.min(delta / 1000, 0.1);
    this.activeTime += dt;

    this.fixBody();

    // Decrement muddy timer
    if (this.muddyTimer > 0) {
      this.muddyTimer = Math.max(0, this.muddyTimer - dt);
    }

    // Dynamic Falling Hazards (Bricks & Beehive) on left platform
    // Per game_mechanic.md: Only begin hazard timer after Phoe Htaung moves >= 150px into the room
    if (!this.hazardStarted && this.player.x >= 150) {
      this.hazardStarted = true;
      this.nextBrickTimer = 7.0; // 7.0s grace period after moving in
    }

    if (this.hazardStarted && !this.isDead && !this.completing && !this.isVaulting && this.player.x < this.leftPlatWidth) {
      this.nextBrickTimer -= dt;
      if (this.nextBrickTimer <= 0) {
        // Safe Pockets (The Mud Patch): If submerged, disarm hazard and keep generous safe buffer
        if (this.isMudSubmerged) {
          this.nextBrickTimer = 9.0;
        } else {
          // Predictable discrete rhythm clock: 10-14s breathing room between hazard waves
          this.nextBrickTimer = Phaser.Math.Between(10, 14);

          this.hazardDropIndex = (this.hazardDropIndex || 0) + 1;
          if (this.hazardDropIndex % 4 === 3 && !this.hasActiveBees) {
            this.triggerFallingBeehive();
          } else {
            this.triggerFallingBrick();
          }
        }
      }
    }

    // Subtle Chapter 2 idle bob for active ground pickups
    if (this.bambooItem?.active) {
      this.bambooItem.y = this.groundY - 14 + Math.sin(this.activeTime * 3) * 2;
    }
    if (this.cogItem?.active) {
      this.cogItem.y = this.groundY - 14 + Math.sin(this.activeTime * 3 + 1) * 2;
    }
    if (this.beeswaxItem?.active) {
      this.beeswaxItem.y = this.groundY - 14 + Math.sin(this.activeTime * 3 + 2) * 2;
    }

    if (this.isDead) {
      this.deathClock += dt;
      const fade = document.querySelector('#reset-fade');
      if (fade)
        fade.style.opacity = String(
          Math.max(0, (this.deathClock - C.deathFreeze) / C.resetFade)
        );
      if (this.deathClock >= C.deathTotal)
        this.scene.restart({ replay: this.replay });
      this.drawPhoe();
      return;
    }

    if (this.player.body.y > this.groundY + 80) {
      this.fallIntoPit();
      return;
    }

    if (this.rKey.isDown && !retryMustRelease) {
      this.restartHeldTime += dt;
      if (this.restartHeldTime >= C.restartHold) {
        retryMustRelease = true;
        this.input.keyboard.resetKeys();
        this.scene.restart({ replay: this.replay });
        return;
      }
    } else {
      this.restartHeldTime = 0;
    }

    const left = this.cursors.left.isDown || this.wasd.A.isDown;
    const right = this.cursors.right.isDown || this.wasd.D.isDown;
    const jump =
      this.cursors.up.isDown || this.cursors.space.isDown || this.wasd.W.isDown;
    const grounded =
      this.player.body.blocked.down || this.player.body.touching.down;
    const down = Boolean(this.cursors.down?.isDown || this.wasd.S?.isDown);

    this.coyote = grounded ? C.coyote : Math.max(0, this.coyote - dt);
    this.jumpBuffer = this.jumpPressed
      ? C.buffer
      : Math.max(0, this.jumpBuffer - dt);
    this.jumpPressed = false;
    this.jumpHeld = jump;

    let vx = (Number(right) - Number(left)) * C.speed;
    if (left || right || jump || this.jumpBuffer > 0) {
      this.targetX = null;
      this.pendingAction = null;
    }
    if (!left && !right && this.targetX !== null) {
      const gap = this.targetX - this.player.x;
      if (Math.abs(gap) > 8) vx = Math.sign(gap) * C.speed;
      else {
        this.targetX = null;
        const action = this.pendingAction;
        this.pendingAction = null;
        action?.();
      }
    }
    if (this.isInteracting) vx = 0;

    // Mud Patch bounds check
    const inMud =
      this.mudBounds &&
      this.player.x >= this.mudBounds.minX &&
      this.player.x <= this.mudBounds.maxX;

    // Laying down and belly-crawling gameplay mechanics
    if (grounded && down && !this.isDead && !this.isVaulting && !this.isInteracting) {
      if (!this.isLaying) {
        this.isLaying = true;
        try { soundEngine.playLongyiRustle(); } catch (e) {}
        this.setLayingBody();
      }
      if (left || right) {
        vx = (Number(right) - Number(left)) * (C.speed * 0.40);
        if (time > (this.crawlDustTimer || 0)) {
          try {
            MicroInteractions.spawnFootstepDust(this, this.player.x, this.groundY, Math.sign(vx));
          } catch (e) {}
          this.crawlDustTimer = time + 300;
        }
      } else {
        vx = 0;
      }

      if (inMud) {
        if (!this.isMudSubmerged) {
          this.isMudSubmerged = true;
          try { soundEngine.playBubblePop(); } catch (e) {}
          for (let i = 0; i < 4; i++) {
            const bx = this.player.x + Phaser.Math.Between(-14, 14);
            const bubble = this.add.circle(bx, this.groundY - 2, 3.5, 0x5d4037, 0.85).setDepth(23);
            this.tweens.add({
              targets: bubble,
              y: this.groundY - 18 - i * 4,
              alpha: 0,
              scale: 1.6,
              duration: 350 + i * 90,
              onComplete: () => bubble.destroy()
            });
          }
        }
        if (this.hasActiveBees) {
          this.scatterBees();
        }
      }
    } else if (this.isLaying && (!down || !grounded || this.isDead || this.isVaulting)) {
      this.isLaying = false;
      this.fixBody(true);
    }

    // Emerging from mud
    if (this.isMudSubmerged && !this.isLaying) {
      const wantsToEmerge = jump || this.jumpPressed || left || right;
      if (wantsToEmerge) {
        this.isMudSubmerged = false;
        this.muddyTimer = 6.0;
        try { soundEngine.playBubblePop(); } catch (e) {}
        this.subtitle.say(DIALOGUE.bridge_mud_dive);
      } else {
        vx = 0;
      }
    }

    if (this.player.x < 24) {
      this.player.x = 24;
      if (vx < 0) vx = 0;
    }
    if (this.player.x > 1262) {
      this.player.x = 1262;
      if (vx > 0) vx = 0;
    }

    this.player.setScale(1);
    this.player.setVelocityX(vx);
    if (vx) this.facing = Math.sign(vx);

    // Active Bee Swarm Chase behavior
    if (this.hasActiveBees && this.activeBees.length > 0) {
      const targetHeadX = this.player.x;
      const targetHeadY = this.player.y - 32;

      for (const bee of this.activeBees) {
        if (!bee.active) continue;
        const tx = targetHeadX + bee.getData('offsetX');
        const ty = targetHeadY + bee.getData('offsetY') + Math.sin(this.activeTime * 14 + bee.getData('phase')) * 8;
        const dx = tx - bee.x;
        const dy = ty - bee.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const stepDist = bee.getData('speed') * dt;

        if (dist > 4) {
          bee.x += (dx / dist) * Math.min(stepDist, dist);
          bee.y += (dy / dist) * Math.min(stepDist, dist);
        }
        bee.flipX = dx < 0;

        // Collision check
        if (!this.isDead && !this.completing && !this.isVaulting) {
          if (this.isMudSubmerged) {
            this.scatterBees();
            break;
          } else {
            const playerDx = Math.abs(bee.x - this.player.x);
            const playerDy = Math.abs(bee.y - (this.player.y - 28));
            if (playerDx < 22 && playerDy < 28) {
              this.hitByBees();
              break;
            }
          }
        }
      }
    }

    if (this.heldItemSprite) {
      this.heldItemSprite.x = this.player.body.center.x + this.facing * 26;
      this.heldItemSprite.y = this.player.body.bottom - 34;
      this.heldItemSprite.setScale(this.facing > 0 ? 0.42 : -0.42, 0.42);
    }

    // Outside-the-Box Mechanic 2: Village Bamboo Pole-Vault
    const hasBamboo =
      gameState.hasItem('bamboo_pole') ||
      (this.inventoryBar && this.inventoryBar.getSelected() === 'bamboo_pole');
    const nearPitEdge =
      this.player.x >= this.leftPlatWidth - 110 &&
      this.player.x <= this.leftPlatWidth + 30;
    const isSprintingRight = right && vx > 150;

    if (
      hasBamboo &&
      nearPitEdge &&
      isSprintingRight &&
      (this.jumpBuffer > 0 || jump) &&
      !this.isInteracting &&
      !this.isDead
    ) {
      this.triggerBambooPoleVault();
      this.drawPhoe();
      return;
    }

    if (this.jumpBuffer > 0 && this.coyote > 0 && !this.isInteracting) {
      this.player.setVelocityY(C.jump);
      this.jumpBuffer = 0;
      this.coyote = 0;
      soundEngine.playJump();
    }

    // Troll Trap: Grabbing the Gold Coin triggers the ground collapse
    if (
      !this.trapTriggered &&
      !this.isDead &&
      !this.completing &&
      Math.abs(this.player.x - 1075) <= 22 &&
      this.player.body.bottom >= this.groundY - 12
    ) {
      this.triggerGreedyCoinTrap();
    }

    this.pushTimer = this.player.x <= 35 && left ? this.pushTimer + delta : 0;
    if (this.pushTimer >= 1000 && !this.tunnelOpened) this.openSecretTunnel();

    if (this.player.x >= 1180 || (this.tunnelOpened && this.player.x <= 35)) {
      this.advanceToChapter2();
    }

    this.drawPhoe();
    this.hud.updateDeathCount();
  }

  hitInvisibleBlock() {
    if (this.isDead || this.completing || this.isVaulting) return;
    this.isDead = true;
    this.deathType = 'SKY_BLOCK';
    this.deathClock = 0;
    this.invisibleBlock?.setAlpha(1);

    audioDirector.handleTrapInvisibleBlock();

    try {
      MicroInteractions.spawnFootstepDust(
        this,
        this.invisibleBlock.x,
        this.invisibleBlock.y + 15,
        1
      );
      MicroInteractions.spawnFootstepDust(
        this,
        this.invisibleBlock.x,
        this.invisibleBlock.y + 15,
        -1
      );
    } catch (e) {}

    this.player.setVelocity(-60, 240);
    this.physics.world.pause();

    gameState.addDeath();
    this.hud?.updateDeathCount();

    const stars = this.add
      .text(this.player.x, this.player.y - 20, '💫', { fontSize: '22px' })
      .setDepth(190);
    this.tweens.add({
      targets: stars,
      y: stars.y - 30,
      alpha: 0,
      duration: 800,
      onComplete: () => stars.destroy()
    });

    this.cameras.main.shake(220, 0.025);

    this.subtitle.say(
      'ဟားဟားဟား! ကြည့်စမ်း... မြေကြီးကို ကြည့်မလျှောက်ဘဲ ကောင်းကင်ကို ခေါင်းနဲ့ သွားတိုက်တယ်! အပေါ်မှာ မမြင်ရတဲ့ ကျောက်တုံးရှိမှန်း မသိဘူးလားကွဲ့? ဦးနှောက်မပါတာ ကောင်းကင်ကပါ လာဆော်ထည့်တာ တွေ့လား။ ကဲ... ပထမဆုံးအကြိမ် ဇောက်ထိုးသေဆုံးခြင်းပေါ့ဗျာ!'
    );
  }

  triggerFallingBrick() {
    if (this.isDead || this.completing || this.player.x >= this.leftPlatWidth) return;

    createBrickTexture(this);

    let targetX = Phaser.Math.Clamp(
      this.player.x + Phaser.Math.Between(-15, 15),
      60,
      this.leftPlatWidth - 40
    );
    let locked = false;

    // =========================================================================
    // BEAT 1 (0.0s - 1.0s): Visual Windup (Machinery ticks, ceiling creaks, shadow forms)
    // =========================================================================
    this.cameras.main.shake(120, 0.002);
    try { soundEngine.playStoneGrind(); } catch (e) {}

    // Warning shadow container at depth 28 cleanly above terrain
    const shadow = this.add.container(targetX, this.groundY - 2).setDepth(28);
    const halo = this.add.ellipse(0, 0, 56, 18, 0xe7bb55, 0.20);
    const core = this.add.ellipse(0, 0, 44, 12, 0x070503, 0.30);
    const reticle = this.add.ellipse(0, 0, 48, 14, 0xd97706, 0);
    reticle.setStrokeStyle(1.5, 0xe7bb55, 0);
    shadow.add([halo, core, reticle]);

    // Outer warning ring pulsing softly
    this.tweens.add({
      targets: halo,
      alpha: { from: 0.15, to: 0.45 },
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 500,
      yoyo: true,
      repeat: 2
    });

    // Core starts subtle and breathes
    core.setScale(0.45, 0.45);
    this.tweens.add({
      targets: core,
      scaleX: 0.65,
      scaleY: 0.65,
      alpha: 0.50,
      duration: 1000,
      ease: 'Quad.Out'
    });

    // Gentle tracking of player during Beat 1 & 2 (0ms - 1900ms)
    const trackTimer = this.time.addEvent({
      delay: 50,
      repeat: 38,
      callback: () => {
        if (locked || !shadow.active || this.isDead || this.completing) return;
        const desiredX = Phaser.Math.Clamp(this.player.x, 60, this.leftPlatWidth - 40);
        targetX = Phaser.Math.Linear(targetX, desiredX, 0.12);
        shadow.x = targetX;
      }
    });

    // =========================================================================
    // BEAT 2 (1.0s - 2.0s): Acoustic Warning (Acoustic click, ceiling dust/mortar chips drop)
    // =========================================================================
    this.time.delayedCall(1000, () => {
      if (this.isDead || this.completing || !shadow.active) return;
      try { soundEngine.playBrickRattle(); } catch (e) {}

      // Trickle 3-4 small falling stone chips / mortar dust particles from ceiling
      for (let i = 0; i < 4; i++) {
        this.time.delayedCall(i * 200, () => {
          if (this.isDead || this.completing || !shadow.active) return;
          const chipX = targetX + Phaser.Math.Between(-14, 14);
          const chip = this.add.circle(chipX, 22 + i * 12, Phaser.Math.Between(1.5, 2.5), 0x839b8b).setDepth(30);
          this.tweens.add({
            targets: chip,
            y: this.groundY - 2,
            duration: 320,
            ease: 'Quad.In',
            onComplete: () => {
              try { MicroInteractions.spawnFootstepDust(this, chipX, this.groundY, 1); } catch (e) {}
              chip.destroy();
            }
          });
        });
      }

      this.tweens.add({
        targets: core,
        scaleX: 0.85,
        scaleY: 0.85,
        alpha: 0.70,
        duration: 900,
        ease: 'Quad.Out'
      });
    });

    // =========================================================================
    // BEAT 3 (2.0s - 3.0s): Target Lock (Telegraphed trajectory fixed; safe to inspect clues & react)
    // =========================================================================
    this.time.delayedCall(2000, () => {
      if (this.isDead || this.completing || !shadow.active) return;
      locked = true;
      trackTimer.remove();
      shadow.x = targetX;

      try { soundEngine.playGearClick(); } catch (e) {}

      // Flash crisp locked target reticle
      reticle.setStrokeStyle(2, 0xe7bb55, 0.95);
      this.tweens.add({
        targets: reticle,
        scaleX: { from: 1.25, to: 1.0 },
        scaleY: { from: 1.25, to: 1.0 },
        alpha: { from: 0.95, to: 0.45 },
        duration: 450,
        yoyo: true,
        repeat: 1
      });

      this.tweens.add({
        targets: core,
        scaleX: 1.0,
        scaleY: 1.0,
        alpha: 0.90,
        duration: 300,
        ease: 'Back.Out'
      });
    });

    // =========================================================================
    // BEAT 4 (3.0s - 3.8s): HAZARD DISCHARGE (Falling stone discharge)
    // =========================================================================
    this.time.delayedCall(3000, () => {
      if (this.isDead || this.completing) {
        shadow.destroy();
        return;
      }
      locked = true;
      trackTimer.remove();

      try { soundEngine.playWoosh(); } catch (e) {}

      const lockedX = targetX;
      const brick = this.add.sprite(lockedX, 10, 'ch1_vector_brick').setDepth(32);
      let hitPlayer = false;
      const startY = 10;
      const targetY = this.groundY - 14;

      this.tweens.add({
        targets: brick,
        y: targetY,
        duration: 380,
        ease: 'Quad.In',
        onUpdate: () => {
          const progress = Phaser.Math.Clamp((brick.y - startY) / (targetY - startY), 0, 1);
          if (shadow && shadow.active) {
            shadow.setAlpha(Phaser.Math.Linear(0.85, 1.0, progress));
            shadow.setScale(
              Phaser.Math.Linear(1.0, 1.25, progress),
              Phaser.Math.Linear(1.0, 1.15, progress)
            );
          }

          if (!hitPlayer && !this.isDead && !this.completing) {
            // Mud Patch: Complete immunity while submerged
            if (this.isMudSubmerged) return;

            const dx = Math.abs(brick.x - this.player.x);
            const playerTargetY = this.isLaying ? this.player.y - 8 : this.player.y - 25;
            const reachY = this.isLaying ? 15 : 32;
            const dy = Math.abs(brick.y - playerTargetY);
            if (dx < 26 && dy < reachY) {
              hitPlayer = true;
              this.hitByFallingBrick();
            }
          }
        },
        onComplete: () => {
          shadow.destroy();
          try {
            MicroInteractions.spawnFootstepDust(this, brick.x, this.groundY, 1);
            MicroInteractions.spawnFootstepDust(this, brick.x, this.groundY, -1);
          } catch (e) {}

          if (this.isMudSubmerged && Math.abs(brick.x - this.player.x) < 40) {
            try { soundEngine.playBubblePop(); } catch (e) {}
          } else {
            soundEngine.playStoneGrind();
            soundEngine.playClang();
            this.cameras.main.shake(110, 0.006);
          }

          this.makeBrickCollectible(brick);
        }
      });
    });
  }

  hitByFallingBrick() {
    if (this.isDead || this.completing) return;

    if (!this.firstHazardTriggered) {
      this.firstHazardTriggered = true;
      // Slapstick cushion ("First Hit is Cartoon, Not Death") per game_mechanic.md
      soundEngine.playClang();
      this.cameras.main.shake(180, 0.015);

      const stars = this.add
        .text(this.player.x, this.player.y - 30, '💫', { fontSize: '24px' })
        .setDepth(190);
      this.tweens.add({
        targets: stars,
        y: stars.y - 35,
        alpha: 0,
        duration: 1200,
        onComplete: () => stars.destroy()
      });

      if (this.phoe) {
        this.tweens.add({
          targets: this.phoe,
          scaleY: 0.4,
          scaleX: 1.3,
          duration: 150,
          yoyo: true,
          repeat: 1,
          ease: 'Quad.InOut'
        });
      }

      this.subtitle.say(DIALOGUE.bridge_hazard_cushion);
      return;
    }

    this.isDead = true;
    this.deathType = 'FALLING_BRICK';
    this.deathClock = 0;
    this.player.setVelocity(0, 0);
    this.physics.world.pause();

    gameState.addDeath();
    this.hud?.updateDeathCount();

    const stars = this.add
      .text(this.player.x, this.player.y - 20, '💫', { fontSize: '22px' })
      .setDepth(190);
    this.tweens.add({
      targets: stars,
      y: stars.y - 30,
      alpha: 0,
      duration: 800,
      onComplete: () => stars.destroy()
    });

    this.cameras.main.shake(250, 0.03);
    soundEngine.playClang();
    this.subtitle.say(DIALOGUE.bridge_falling_brick);
  }

  triggerFallingBeehive() {
    if (this.isDead || this.completing || this.player.x >= this.leftPlatWidth) return;

    let targetX = Phaser.Math.Clamp(
      this.player.x + Phaser.Math.Between(-15, 15),
      80,
      this.leftPlatWidth - 40
    );
    let locked = false;

    // =========================================================================
    // BEAT 1 (0.0s - 1.0s): Visual Windup & Buzzing Scuttle
    // =========================================================================
    try { soundEngine.playInsectScuttle(); } catch (e) {}
    this.subtitle.say(DIALOGUE.bridge_hive_drop);

    const shadow = this.add.container(targetX, this.groundY - 2).setDepth(28);
    const halo = this.add.ellipse(0, 0, 56, 18, 0xd97706, 0.25);
    const core = this.add.ellipse(0, 0, 44, 12, 0x271306, 0.35);
    const reticle = this.add.ellipse(0, 0, 48, 14, 0xf59e0b, 0);
    reticle.setStrokeStyle(1.5, 0xf59e0b, 0);
    shadow.add([halo, core, reticle]);

    this.tweens.add({
      targets: halo,
      alpha: { from: 0.20, to: 0.55 },
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 500,
      yoyo: true,
      repeat: 2
    });

    core.setScale(0.45, 0.45);
    this.tweens.add({
      targets: core,
      scaleX: 0.65,
      scaleY: 0.65,
      alpha: 0.55,
      duration: 1000,
      ease: 'Quad.Out'
    });

    // Tracking loop during Beats 1 & 2
    const trackTimer = this.time.addEvent({
      delay: 50,
      repeat: 38,
      callback: () => {
        if (locked || !shadow.active || this.isDead || this.completing) return;
        const desiredX = Phaser.Math.Clamp(this.player.x, 80, this.leftPlatWidth - 40);
        targetX = Phaser.Math.Linear(targetX, desiredX, 0.12);
        shadow.x = targetX;
      }
    });

    // =========================================================================
    // BEAT 2 (1.0s - 2.0s): Acoustic Warning & Honey Drips
    // =========================================================================
    this.time.delayedCall(1000, () => {
      if (this.isDead || this.completing || !shadow.active) return;
      try { soundEngine.playInsectScuttle(); } catch (e) {}

      for (let i = 0; i < 3; i++) {
        this.time.delayedCall(i * 240, () => {
          if (this.isDead || this.completing || !shadow.active) return;
          const drip = this.add.circle(targetX + Phaser.Math.Between(-8, 8), 35, 2.5, 0xd97706).setDepth(30);
          this.tweens.add({
            targets: drip,
            y: this.groundY - 2,
            duration: 350,
            ease: 'Quad.In',
            onComplete: () => drip.destroy()
          });
        });
      }

      this.tweens.add({
        targets: core,
        scaleX: 0.85,
        scaleY: 0.85,
        alpha: 0.70,
        duration: 900,
        ease: 'Quad.Out'
      });
    });

    // =========================================================================
    // BEAT 3 (2.0s - 3.0s): Target Lock
    // =========================================================================
    this.time.delayedCall(2000, () => {
      if (this.isDead || this.completing || !shadow.active) return;
      locked = true;
      trackTimer.remove();
      shadow.x = targetX;

      try { soundEngine.playGearClick(); } catch (e) {}

      reticle.setStrokeStyle(2, 0xf59e0b, 0.95);
      this.tweens.add({
        targets: reticle,
        scaleX: { from: 1.25, to: 1.0 },
        scaleY: { from: 1.25, to: 1.0 },
        alpha: { from: 0.95, to: 0.45 },
        duration: 450,
        yoyo: true,
        repeat: 1
      });

      this.tweens.add({
        targets: core,
        scaleX: 1.0,
        scaleY: 1.0,
        alpha: 0.90,
        duration: 300,
        ease: 'Back.Out'
      });
    });

    // =========================================================================
    // BEAT 4 (3.0s - 3.8s): HAZARD DISCHARGE (Beehive Drop)
    // =========================================================================
    this.time.delayedCall(3000, () => {
      if (this.isDead || this.completing) {
        shadow.destroy();
        return;
      }
      locked = true;
      trackTimer.remove();

      try { soundEngine.playWoosh(); } catch (e) {}

      const lockedX = targetX;
      const hive = this.add.sprite(lockedX, 10, 'ch1_vector_beehive').setDepth(32);
      const startY = 10;
      const targetY = this.groundY - 14;

      this.tweens.add({
        targets: hive,
        y: targetY,
        duration: 380,
        ease: 'Quad.In',
        onUpdate: () => {
          const progress = Phaser.Math.Clamp((hive.y - startY) / (targetY - startY), 0, 1);
          if (shadow && shadow.active) {
            shadow.setAlpha(Phaser.Math.Linear(0.85, 1.0, progress));
            shadow.setScale(
              Phaser.Math.Linear(1.0, 1.25, progress),
              Phaser.Math.Linear(1.0, 1.15, progress)
            );
          }
        },
        onComplete: () => {
          shadow.destroy();
          try {
            soundEngine.playWoosh();
            soundEngine.playBubblePop();
            MicroInteractions.spawnFootstepDust(this, hive.x, this.groundY, 1);
            MicroInteractions.spawnFootstepDust(this, hive.x, this.groundY, -1);
          } catch (e) {}
          this.cameras.main.shake(120, 0.005);

          // Squash and splat animation
          this.tweens.add({
            targets: hive,
            scaleX: 1.45,
            scaleY: 0.55,
            duration: 140,
            yoyo: true,
            onComplete: () => {
              const hiveX = hive.x;
              hive.destroy();
              this.spawnBeeswaxItem(hiveX, this.groundY - 14);
              this.spawnBeeSwarm(hiveX, this.groundY - 24);
            }
          });
        }
      });
    });
  }

  spawnBeeSwarm(startX, startY) {
    if (this.hasActiveBees) return;
    this.hasActiveBees = true;
    this.activeBees = [];
    this.beeChaseSpeed = 190;

    for (let i = 0; i < 10; i++) {
      const bee = this.add.sprite(
        startX + Phaser.Math.Between(-16, 16),
        startY + Phaser.Math.Between(-16, 16),
        'ch1_vector_bee'
      ).setDepth(45);
      bee.setData('offsetX', Phaser.Math.Between(-28, 28));
      bee.setData('offsetY', Phaser.Math.Between(-38, -6));
      bee.setData('speed', Phaser.Math.Between(140, this.beeChaseSpeed || 190));
      bee.setData('phase', Math.random() * Math.PI * 2);
      this.activeBees.push(bee);
    }

    try { soundEngine.playInsectScuttle(); } catch (e) {}
    this.subtitle.say(DIALOGUE.bridge_bee_chase);
  }

  scatterBees() {
    if (!this.hasActiveBees && this.activeBees.length === 0) return;
    this.hasActiveBees = false;
    this.beeChaseSpeed = 190;

    try { soundEngine.playInsectScuttle(); } catch (e) {}

    for (const bee of this.activeBees) {
      if (!bee.active) continue;
      this.tweens.add({
        targets: bee,
        x: bee.x + Phaser.Math.Between(-120, 120),
        y: -60,
        alpha: 0,
        duration: Phaser.Math.Between(550, 950),
        ease: 'Quad.In',
        onComplete: () => bee.destroy()
      });
    }
    this.activeBees = [];
  }

  makeBrickCollectible(brick) {
    if (!brick?.active) return;

    brick.setInteractive({ useHandCursor: true });
    brick.on('pointerover', () => {
      if (brick.active && !brick.getData('pickedUp')) brick.setScale(1.15);
    });
    brick.on('pointerout', () => {
      if (brick.active && !brick.getData('pickedUp')) brick.setScale(1.0);
    });

    const pulseTween = this.tweens.add({
      targets: brick,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 600,
      yoyo: true,
      repeat: -1
    });

    const dissolveTimer = this.time.delayedCall(12000, () => {
      if (brick.active && !brick.getData('pickedUp')) {
        pulseTween.stop();
        this.tweens.add({
          targets: brick,
          alpha: 0,
          duration: 400,
          onComplete: () => brick.destroy()
        });
      }
    });

    brick.on('pointerdown', (_p, _x, _y, event) => {
      event?.stopPropagation();
      if (!brick.active || brick.getData('pickedUp')) return;
      this.interactWithProximity(brick.x, () => {
        if (!brick.active || brick.getData('pickedUp') || this.isInteracting) return;
        brick.setData('pickedUp', true);
        pulseTween.stop();
        dissolveTimer.remove();
        this.isInteracting = true;
        this.pickupState = 'PICKUP';
        soundEngine.playWoosh();

        const handX = this.player.body.center.x + this.facing * 18;
        const handY = this.groundY - 20;

        this.tweens.add({
          targets: brick,
          x: handX,
          y: handY,
          scale: 0.4,
          duration: 220,
          ease: 'Quad.Out',
          onComplete: () => {
            soundEngine.playPickup();
            this.pickupState = 'RUMMAGE';
            soundEngine.playBagRustle();

            const bagX = this.player.body.center.x - this.facing * 10;
            const bagY = this.groundY - 45;

            this.tweens.add({
              targets: brick,
              x: bagX,
              y: bagY,
              scale: 0.1,
              alpha: 0.3,
              duration: 260,
              ease: 'Cubic.In',
              onComplete: () => {
                gameState.addItem('ancient_brick');
                brick.destroy();
                this.inventoryBar?.refresh();
                this.pickupState = null;
                this.isInteracting = false;
                this.subtitle.say(DIALOGUE.bridge_brick_pickup);
              }
            });
          }
        });
      });
    });
  }

  throwBrick(targetX, targetY) {
    this.facing = targetX > this.player.x ? 1 : -1;
    soundEngine.playWoosh();

    const startX = this.player.x + this.facing * 16;
    const startY = this.player.y - 28;
    const flyingBrick = this.add.sprite(startX, startY, 'ch1_vector_brick').setScale(0.85).setDepth(35);

    const arcPeak = -40;
    let hitSwarm = false;

    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 500,
      ease: 'Linear',
      onUpdate: (tw) => {
        const t = tw.getValue();
        flyingBrick.x = startX + (targetX - startX) * t;
        flyingBrick.y = startY + (targetY - startY) * t + arcPeak * 4 * t * (1 - t);
        flyingBrick.angle = t * 360 * this.facing;

        // Collision check with Bee Swarm
        if (!hitSwarm && this.hasActiveBees && this.activeBees?.length > 0) {
          for (const bee of this.activeBees) {
            if (!bee.active) continue;
            const dist = Phaser.Math.Distance.Between(flyingBrick.x, flyingBrick.y, bee.x, bee.y);
            const dx = Math.abs(flyingBrick.x - bee.x);
            const dy = Math.abs(flyingBrick.y - bee.y);
            if (dist < 48 || (dx < 38 && dy < 54)) {
              hitSwarm = true;
              tw.stop();
              this.enrageBeeSwarm(flyingBrick);
              break;
            }
          }
        }
      },
      onComplete: () => {
        if (hitSwarm) return;
        try { soundEngine.playClang(); } catch (e) {}
        try {
          MicroInteractions.spawnFootstepDust(this, flyingBrick.x, flyingBrick.y, 1);
          MicroInteractions.spawnFootstepDust(this, flyingBrick.x, flyingBrick.y, -1);
        } catch (e) {}

        this.time.delayedCall(500, () => {
          if (flyingBrick.active) {
            this.tweens.add({
              targets: flyingBrick,
              alpha: 0,
              scale: 0.5,
              duration: 250,
              onComplete: () => flyingBrick.destroy()
            });
          }
        });
      }
    });
  }

  enrageBeeSwarm(flyingBrick) {
    try { soundEngine.playClang(); } catch (e) {}

    // Brick clatters to the ground
    if (flyingBrick?.active) {
      this.tweens.add({
        targets: flyingBrick,
        y: this.groundY - 8,
        angle: '+=90',
        duration: 220,
        ease: 'Bounce.Out',
        onComplete: () => {
          this.time.delayedCall(600, () => {
            if (flyingBrick.active) flyingBrick.destroy();
          });
        }
      });
    }

    // Double chase speed and enrage visuals
    this.beeChaseSpeed = 330;
    if (this.activeBees) {
      for (const bee of this.activeBees) {
        if (!bee.active) continue;
        bee.setTint(0xff2222);
        bee.setScale(1.35);
        bee.setData('speed', 330);
      }
    }

    // Spawn 💢 floating rage particles over swarm
    const avgX = this.activeBees?.length
      ? this.activeBees.reduce((acc, b) => acc + (b.active ? b.x : 0), 0) / this.activeBees.length
      : this.player.x;
    const avgY = this.activeBees?.length
      ? this.activeBees.reduce((acc, b) => acc + (b.active ? b.y : 0), 0) / this.activeBees.length - 20
      : this.player.y - 50;

    for (let i = 0; i < 3; i++) {
      const rage = this.add
        .text(avgX + Phaser.Math.Between(-20, 20), avgY + Phaser.Math.Between(-15, 15), '💢', {
          fontSize: '22px'
        })
        .setDepth(50);
      this.tweens.add({
        targets: rage,
        y: rage.y - 35,
        alpha: 0,
        scale: 1.4,
        duration: 750 + i * 150,
        onComplete: () => rage.destroy()
      });
    }

    this.cameras.main.shake(180, 0.008);
    this.subtitle.say(DIALOGUE.bridge_bee_enraged);
  }

  hitByBees() {
    if (this.isDead || this.completing || this.isMudSubmerged || this.isVaulting) return;
    this.isDead = true;
    this.deathType = 'BEE_STUNG';
    this.deathClock = 0;
    this.hideHeldItem();
    this.isInteracting = false;

    try {
      soundEngine.playElectricZap();
    } catch (e) {
      try { soundEngine.playClang(); } catch (e2) {}
    }

    gameState.addDeath();
    this.hud?.updateDeathCount();
    this.cameras.main.shake(260, 0.03);

    // Launch Phoe Htaung into pit with parabolic knockback
    this.player.body.setVelocity(280, -340);

    const stars = this.add
      .text(this.player.x, this.player.y - 20, '💫', { fontSize: '22px' })
      .setDepth(190);
    this.tweens.add({
      targets: stars,
      y: stars.y - 30,
      alpha: 0,
      duration: 800,
      onComplete: () => stars.destroy()
    });

    this.subtitle.say(DIALOGUE.bridge_bee_stung);

    this.time.delayedCall(400, () => {
      this.scatterBees();
    });
  }

  spawnBeeswaxItem(x, y) {
    if (this.beeswaxItem?.active) return;

    const halo = this.add.graphics().setDepth(28);
    halo.fillStyle(GOLD, 0.18).fillCircle(x, y, 16);

    const wax = this.add
      .image(x, y, 'ch1_vector_beeswax')
      .setScale(0.8)
      .setDepth(30)
      .setInteractive({ useHandCursor: true });
    this.beeswaxItem = wax;

    wax.on('pointerover', () => wax.setScale(0.95));
    wax.on('pointerout', () => wax.setScale(0.8));

    wax.on('pointerdown', (_p, _x, _y, event) => {
      event?.stopPropagation();
      this.interactWithProximity(wax.x, () => {
        if (!wax.active || this.isInteracting) return;
        this.isInteracting = true;
        this.pickupState = 'PICKUP';
        try { soundEngine.playWoosh(); } catch (e) {}
        halo.destroy();

        const handX = this.player.body.center.x + this.facing * 18;
        const handY = this.groundY - 20;

        this.tweens.add({
          targets: wax,
          x: handX,
          y: handY,
          scale: 0.4,
          duration: 220,
          ease: 'Quad.Out',
          onComplete: () => {
            try { soundEngine.playPickup(); } catch (e) {}
            this.pickupState = 'RUMMAGE';
            try { soundEngine.playBagRustle(); } catch (e) {}

            const bagX = this.player.body.center.x - this.facing * 10;
            const bagY = this.groundY - 45;

            this.tweens.add({
              targets: wax,
              x: bagX,
              y: bagY,
              scale: 0.1,
              alpha: 0.3,
              duration: 260,
              ease: 'Cubic.In',
              onComplete: () => {
                gameState.addItem('beeswax');
                wax.destroy();
                this.beeswaxItem = null;
                this.inventoryBar?.refresh();
                this.pickupState = null;
                this.isInteracting = false;
                this.subtitle.say('ပျားဖယောင်း ရပြီ! စက်သီးဂီယာမှာ ချောဆီအဖြစ် သုံးနိုင်တယ်။');
              }
            });
          }
        });
      });
    });
  }

  triggerBambooPoleVault() {
    this.isVaulting = true;
    this.targetX = null;
    this.jumpPressed = false;
    this.jumpBuffer = 0;
    this.coyote = 0;
    this.player.setVelocity(0, 0);
    this.player.body.setAllowGravity(false);

    soundEngine.playJump();
    soundEngine.playWoosh();

    const poleX = this.leftPlatWidth - 8;
    const poleY = this.groundY;
    const vaultPole = this.add
      .image(poleX, poleY, 'ch1_vector_bamboo')
      .setOrigin(0.5, 1)
      .setAngle(-25)
      .setDepth(24);

    this.tweens.add({
      targets: vaultPole,
      angle: 50,
      duration: 650,
      ease: 'Quad.InOut'
    });

    const startX = this.player.x;
    const startY = this.groundY;
    const targetX = this.rightPlatX + 45;
    const targetY = this.groundY;
    const arcHeight = 200;

    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 700,
      ease: 'Quad.InOut',
      onUpdate: (tw) => {
        const t = tw.getValue();
        this.player.x = startX + (targetX - startX) * t;
        this.player.y = startY - arcHeight * (4 * t * (1 - t));
        this.fixBody();
      },
      onComplete: () => {
        this.player.x = targetX;
        this.player.y = targetY;
        this.player.body.setAllowGravity(true);
        this.player.setVelocity(0, 0);
        this.fixBody();
        this.isVaulting = false;
        this.isInteracting = false;
        this.jumpPressed = false;
        this.jumpBuffer = 0;
        this.coyote = 0;
        this.targetX = null;

        try {
          MicroInteractions.spawnFootstepDust(this, this.player.x, this.groundY, 1);
          MicroInteractions.spawnFootstepDust(this, this.player.x, this.groundY, -1);
        } catch (e) {}
        try {
          soundEngine.playFootstep('stone');
        } catch (e) {}
        this.cameras.main.shake(120, 0.008);

        this.subtitle.say(DIALOGUE.bridge_pole_vault);

        this.tweens.add({
          targets: vaultPole,
          angle: 85,
          y: this.groundY + 80,
          alpha: 0,
          duration: 500,
          onComplete: () => vaultPole.destroy()
        });
      }
    });
  }

  triggerGreedyCoinTrap() {
    if (this.trapTriggered || this.isDead || this.completing) return;
    this.trapTriggered = true;

    if (this.baitGlow) {
      this.baitGlow.destroy();
      this.baitGlow = null;
    }

    try {
      soundEngine.playShatter();
    } catch (e) {}

    try {
      MicroInteractions.spawnFootstepDust(this, 1030, this.groundY, 1);
      MicroInteractions.spawnFootstepDust(this, 1120, this.groundY, -1);
    } catch (e) {}

    // Disable player collider with the trap floor segment immediately
    if (this.trapFloorCollider) {
      this.physics.world.removeCollider(this.trapFloorCollider);
      this.trapFloorCollider = null;
    }
    if (this.trapFloorColliderBody) {
      this.trapFloorColliderBody.destroy();
      this.trapFloorColliderBody = null;
    }

    // Redraw the terrain with the newly opened chasm gap
    drawBridgeTerrain(
      this.terrainG,
      this.leftPlatWidth,
      this.pitWidth,
      this.rightPlatX,
      this.rightPlatWidth,
      this.groundY,
      { startX: 1030, endX: 1120 }
    );

    // Spawn the falling chunk of ground matching normal ground block that just broke away
    const fallingChunk = this.add.graphics().setDepth(20);
    drawBlock(fallingChunk, { x: 0, y: 0, w: 90, h: 144 }, STONE);
    fallingChunk.fillStyle(0x8e9470, 1).fillRect(0, 0, 90, 7);
    fallingChunk.setPosition(1030, this.groundY);

    this.tweens.add({
      targets: fallingChunk,
      y: this.groundY + 360,
      angle: 25,
      alpha: 0.6,
      duration: 450,
      ease: 'Quad.easeIn',
      onComplete: () => {
        fallingChunk.destroy();
      }
    });

    // Set custom death quote for when Phoe falls into the pit
    this.customPitDeathQuote = DIALOGUE.bridge_coin_trap;

    // The greedy bait coin plunges down with the falling ground chunk
    if (this.coin && this.coin.active) {
      this.tweens.killTweensOf(this.coin);
      this.tweens.add({
        targets: this.coin,
        y: this.groundY + 340,
        angle: 45,
        alpha: 0.5,
        duration: 420,
        ease: 'Quad.easeIn',
        onComplete: () => {
          this.coin?.destroy();
          this.coin = null;
        }
      });
    }

    // Accelerate player downward into the abyss
    if (this.player.x >= 1020 && this.player.x <= 1125) {
      this.targetX = null;
      this.pendingAction = null;
      this.player.setVelocityX(0);
      this.player.setVelocityY(Math.max(180, this.player.body.velocity.y));
    }
  }

  triggerCoinYoink() {
    this.triggerGreedyCoinTrap();
  }

  triggerRocketTrap() {
    // Intentionally inert in combined build: right platform is a safe landing surface.
  }

  drawPhoe() {
    const b = this.player.body;
    const ctrl = this.isDead
      ? 'DEAD'
      : this.pickupState
      ? this.pickupState
      : this.isInteracting
      ? 'TAUNTING'
      : this.isLaying
      ? 'LAYING'
      : 'FREE';

    let poseOverride = undefined;
    if (this.squashedAgainstSpikes) {
      poseOverride = 'ph-flat';
    } else if (
      this.deathType === 'SKY_BLOCK' ||
      this.deathType === 'FALLING_BRICK' ||
      this.deathType === 'WINCH_CATAPULT' ||
      this.deathType === 'BEE_STUNG'
    ) {
      poseOverride = 'ph-shock';
    }

    const feetY = this.squashedAgainstSpikes
      ? 44
      : this.isMudSubmerged
      ? b.bottom + 18
      : b.bottom;

    if (this.phoe) {
      renderPhoe(
        this.phoe,
        {
          centerX: b.center.x,
          feetY: feetY,
          vx: b.velocity.x,
          vy: b.velocity.y,
          grounded: b.blocked.down || b.touching.down,
          facing: this.facing,
          control: ctrl,
          pushing: Boolean(this.pushTimer > 0),
          holding: Boolean(this.heldItemSprite),
          poseOverride
        },
        this.activeTime
      );

      if (this.muddyTimer > 0) {
        this.phoe.setTint(0x5d4037);
      } else {
        this.phoe.clearTint();
      }
    }
    if (this.playerShadow) {
      this.playerShadow.x = b.center.x;
      this.playerShadow.y = this.groundY + 2;
      this.playerShadow.setVisible(!this.squashedAgainstSpikes && !this.isMudSubmerged);
    }
  }

  fallIntoPit(customQuote) {
    if (this.isDead || this.completing || this.isVaulting) return;
    this.isDead = true;
    this.deathType = 'PIT';
    this.deathClock = 0;
    this.player.setVelocity(0, 0);
    this.physics.world.pause();
    audioDirector.handleTrapInvisibleBlock();
    gameState.addDeath();
    this.hud?.updateDeathCount();
    this.subtitle.say(
      customQuote ||
        this.customPitDeathQuote ||
        'ဟားဟားဟား! တွင်းထဲ ဇောက်ထိုးကျသွားပြန်ပြီ! မြေကြီးကို ကြည့်မလျှောက်ဘဲ ဇွတ်ပြေးတာကိုး။'
    );
  }

  openSecretTunnel() {
    if (this.tunnelOpened) return;
    this.tunnelOpened = true;
    gameState.setFlag('ch1_tunnel_open');
    this.leftWallG?.setVisible(false);
    this.leftWall.setVisible(false);
    this.secretTunnelDoor.setVisible(true);
    this.targetX = 25;
    audioDirector.handleTrollWallSolved();
    this.subtitle.say(
      'အမယ်လေးတော်... အရှေ့မသွားဘဲ နောက်ပြန်ဆုတ်ပြီး နံရံကို ဇွတ်သွားတိုက်တယ်! ဒါပေမဲ့ ကံကောင်းသွားတယ်ဗျို့၊ မြေအောက်လမ်း ပွင့်သွားပြန်ပြီ။ ကဲ သွား... အောက်လမ်းကပဲ လျှောက်တော့၊ မင်းလိုကောင်မျိုးက အောက်လမ်းနဲ့ပဲ တန်တယ်!'
    );
  }

  advanceToChapter2() {
    if (this.completing || this.isDead) return;
    const b = this.player.body;
    const exit = {
      alive: true,
      grounded: b.blocked.down || b.touching.down,
      x: b.center.x,
      feetY: b.bottom,
      groundY: this.groundY,
      width: 1280,
      tunnelOpened: this.tunnelOpened
    };
    if (
      !exit.grounded ||
      Math.abs(exit.feetY - exit.groundY) > 1 ||
      !(exit.x >= 1280 * 0.78 || (exit.tunnelOpened && exit.x <= 35))
    )
      return;

    store.completeBridge(gameState.attemptId, exit);
    this.completing = true;
    this.player.setVelocity(0, 0);
    this.physics.world.pause();
    this.scene.start('BRIDGE_EXIT_LINK', { replay: this.replay });
  }

  snapshot() {
    return {
      player: {
        x: this.player ? this.player.x : 0,
        y: this.player ? this.player.y : 0,
        vx: this.player?.body ? this.player.body.velocity.x : 0,
        vy: this.player?.body ? this.player.body.velocity.y : 0,
        grounded: this.player?.body ? Boolean(this.player.body.blocked.down || this.player.body.touching.down) : false,
        isLaying: Boolean(this.isLaying),
        isVaulting: Boolean(this.isVaulting)
      },
      inventory: [...(gameState?.state?.inventory || [])],
      hasCog: Boolean(this.hasCog),
      hasLever: Boolean(this.hasLever),
      winchJammed: Boolean(this.winchJammed),
      winchLubricated: Boolean(this.winchLubricated),
      bridgeLowered: Boolean(this.bridgeLowered),
      poleTied: Boolean(this.poleTied),
      cogWedged: Boolean(this.cogWedged),
      tunnelOpened: Boolean(this.tunnelOpened),
      trapTriggered: Boolean(this.trapTriggered),
      firstHazardTriggered: Boolean(this.firstHazardTriggered),
      isDead: Boolean(this.isDead),
      deathType: this.deathType,
      activeTime: this.activeTime,
      coyote: this.coyote,
      jumpBuffer: this.jumpBuffer,
      selectedItem: this.inventoryBar?.getSelected() || null
    };
  }
}
