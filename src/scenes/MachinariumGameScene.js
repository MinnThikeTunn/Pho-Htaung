import Phaser from 'phaser';
import { machinariumAudio } from '../utils/MachinariumAudio.js';

export default class MachinariumGameScene extends Phaser.Scene {
  constructor() {
    super('MachinariumGameScene');
  }

  init() {
    // Game Progression States
    this.hasArm = false;
    this.hasLeg = false;
    this.isAssembled = false;
    this.ratTraded = false;
    this.sludgeFished = false;
    this.bridgePowered = false;
    this.bridgeLowered = false;

    // Josef Stature (-1 = crouch, 0 = normal, 1 = stretch)
    this.stature = 0;
    this.isMoving = false;
    this.targetX = null;
    this.pendingAction = null;

    // Inventory
    this.inventory = [];
    this.selectedItem = null;
  }

  create() {
    const { width, height } = this.cameras.main;

    // 1. Multi-layered Atmospheric Industrial Scenery
    this.createAtmosphere(width, height);

    // 2. Interactive World Props
    this.createWorldProps(width, height);

    // 3. Articulated Josef Robot (Starts at scrap pile on the left)
    this.createJosef(width * 0.32, height - 145);

    // 4. Mechanical Rat Critter
    this.createMechanicalRat(width * 0.54, height - 140);

    // 5. In-Game Floating HUD (Inventory, Controls, Fullscreen, Hints)
    this.createFloatingHUD(width, height);

    // 6. Comic Thought Bubble System
    this.createThoughtBubble();

    // 7. Ground Click Input Handling & Reticle Feedback
    this.input.on('pointerdown', (pointer) => this.handlePointerDown(pointer));

    // Footstep / Hop sound loop
    this.time.addEvent({
      delay: 320,
      callback: () => {
        if (this.isMoving) {
          if (this.hasLeg) {
            machinariumAudio.playFootstep();
          } else {
            machinariumAudio.playHop();
          }
        }
      },
      loop: true
    });

    // Opening thought clue after a brief awakening
    this.time.delayedCall(1000, () => {
      this.showThoughtBubble('search-scrap');
      this.showBannerNotification('WAKE UP, JOSEF! SEARCH THE SCRAP PILE TO REASSEMBLE YOUR BODY.');
    });
  }

  createAtmosphere(width, height) {
    // Dark twilight steampunk sky
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x241b15, 0x241b15, 0x0c0a08, 0x0c0a08, 1);
    sky.fillRect(0, 0, width, height);

    // Volumetric Twilight God-Rays
    this.rays = this.add.graphics();
    this.rays.fillStyle(0xf59e0b, 0.05);
    this.rays.fillTriangle(width * 0.35, 0, width * 0.05, height, width * 0.65, height);
    this.rays.fillTriangle(width * 0.75, 0, width * 0.45, height, width, height);

    // Distant Industrial Skyline (Layers of Scrap Towers & Smokestacks)
    const skyline = this.add.graphics();
    skyline.fillStyle(0x181310, 0.9);
    skyline.fillRect(90, 100, 140, height - 100);
    skyline.fillRect(250, 150, 90, height - 150);
    skyline.fillRect(width - 360, 80, 160, height - 80);
    skyline.fillRect(width - 180, 120, 140, height - 120);

    // Interconnecting giant copper pipes
    skyline.lineStyle(12, 0x241d18, 0.9);
    skyline.lineBetween(210, 240, 360, 200);
    skyline.lineBetween(width - 360, 180, width - 180, 260);

    // Animated Background Clockwork Gears
    this.gear1 = this.add.image(190, 180, 'industrial-gear').setScale(2).setAlpha(0.25);
    this.gear2 = this.add.image(290, 250, 'industrial-gear').setScale(1.4).setAlpha(0.3);
    this.gear3 = this.add.image(width - 260, 160, 'industrial-gear').setScale(2.4).setAlpha(0.22);

    // Ground Scrap Valley
    this.groundGraphic = this.add.graphics();
    this.groundGraphic.fillStyle(0x2c221a, 1);
    this.groundGraphic.beginPath();
    this.groundGraphic.moveTo(0, height - 125);
    this.groundGraphic.lineTo(width * 0.34, height - 125);
    this.groundGraphic.lineTo(width * 0.38, height - 105); // Toxic pool dip
    this.groundGraphic.lineTo(width * 0.58, height - 105);
    this.groundGraphic.lineTo(width * 0.62, height - 125);
    this.groundGraphic.lineTo(width * 0.82, height - 125);
    this.groundGraphic.lineTo(width * 0.86, height - 145); // Bridge outpost platform
    this.groundGraphic.lineTo(width, height - 145);
    this.groundGraphic.lineTo(width, height);
    this.groundGraphic.lineTo(0, height);
    this.groundGraphic.closePath();
    this.groundGraphic.fillPath();

    // Riveted ground border line
    this.groundGraphic.lineStyle(4, 0x451a03, 1);
    this.groundGraphic.lineBetween(0, height - 125, width * 0.82, height - 125);
    this.groundGraphic.lineBetween(width * 0.82, height - 125, width, height - 145);

    // High-pressure steam pipe
    this.add.particles(90, height - 160, 'steam-puff', {
      speed: { min: 25, max: 55 },
      angle: { min: 245, max: 275 },
      scale: { start: 0.6, end: 2 },
      alpha: { start: 0.45, end: 0 },
      lifespan: 2800,
      frequency: 250
    });
  }

  createWorldProps(width, height) {
    // 1. Scrap Pile (Bathtub & Wreckage)
    this.scrapPileX = width * 0.16;
    this.scrapPileY = height - 135;
    this.scrapPile = this.add.container(this.scrapPileX, this.scrapPileY);

    const scrapG = this.add.graphics();
    scrapG.fillStyle(0x44403c, 1);
    scrapG.fillEllipse(0, 0, 90, 40);
    scrapG.fillStyle(0x78350f, 1);
    scrapG.fillRoundedRect(-45, -30, 90, 40, 10);
    scrapG.lineStyle(2.5, 0xd97706, 0.8);
    scrapG.strokeRoundedRect(-45, -30, 90, 40, 10);

    // Interactive Hover Glow
    this.scrapGlow = this.add.graphics().setVisible(false);
    this.scrapGlow.lineStyle(4, 0xf59e0b, 0.6);
    this.scrapGlow.strokeRoundedRect(-48, -33, 96, 46, 12);

    const scrapLabel = this.add.text(0, -48, 'SCRAP WRECKAGE', {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '12px',
      fontStyle: '900',
      color: '#f59e0b'
    }).setOrigin(0.5);

    this.scrapPile.add([this.scrapGlow, scrapG, scrapLabel]);
    this.scrapPile.setSize(110, 80);
    this.scrapPile.setInteractive({ useHandCursor: true });

    this.scrapPile.on('pointerover', () => this.scrapGlow.setVisible(true));
    this.scrapPile.on('pointerout', () => this.scrapGlow.setVisible(false));
    this.scrapPile.on('pointerdown', (pointer, localX, localY, event) => {
      event.stopPropagation();
      this.moveToAndExecute(this.scrapPileX + 80, () => this.inspectScrapPile());
    });

    // 2. Toxic Sludge Pool
    this.sludgeX = width * 0.48;
    this.sludgeY = height - 100;
    this.sludgePool = this.add.image(this.sludgeX, this.sludgeY, 'toxic-puddle').setInteractive({ useHandCursor: true });

    const sludgeLabel = this.add.text(this.sludgeX, this.sludgeY - 38, 'CORROSIVE SLUDGE', {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '11px',
      fontStyle: '900',
      color: '#22c55e'
    }).setOrigin(0.5);

    // Submerged Glowing Core
    this.submergedCore = this.add.image(this.sludgeX, this.sludgeY + 4, 'item-powercore').setScale(0.8).setAlpha(0.7);
    this.tweens.add({
      targets: this.submergedCore,
      alpha: 0.3,
      scale: 0.75,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    this.sludgePool.on('pointerdown', (pointer, localX, localY, event) => {
      event.stopPropagation();
      this.moveToAndExecute(this.sludgeX - 90, () => this.inspectSludgePool());
    });

    // 3. Broken Lamp Post with Copper Wire
    this.lampX = width * 0.7;
    this.lampY = height - 230;
    this.lampPost = this.add.container(this.lampX, this.lampY);

    const lampG = this.add.graphics();
    lampG.fillStyle(0x292524, 1);
    lampG.fillRect(-5, 0, 10, 110);
    lampG.fillStyle(0x78350f, 1);
    lampG.fillCircle(0, 0, 14);

    this.wireItemSprite = this.add.image(10, 32, 'item-wire').setScale(0.9);
    const lampLabel = this.add.text(0, -22, 'LAMP POST', {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '11px',
      fontStyle: '900',
      color: '#f59e0b'
    }).setOrigin(0.5);

    this.lampPost.add([lampG, this.wireItemSprite, lampLabel]);
    this.lampPost.setSize(50, 130);
    this.lampPost.setInteractive({ useHandCursor: true });

    this.lampPost.on('pointerdown', (pointer, localX, localY, event) => {
      event.stopPropagation();
      this.moveToAndExecute(this.lampX - 50, () => this.inspectLampPost());
    });

    // 4. High Electric Control Tower
    this.controlX = width * 0.88;
    this.controlY = height - 235;
    this.controlBox = this.add.image(this.controlX, this.controlY, 'control-lever-box').setInteractive({ useHandCursor: true });
    this.leverLight = this.add.circle(this.controlX - 10, this.controlY - 58, 5, 0xef4444); // Red indicator light

    const boxLabel = this.add.text(this.controlX, this.controlY - 84, 'HIGH SWITCH BOX', {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '11px',
      fontStyle: '900',
      color: '#ef4444'
    }).setOrigin(0.5);

    this.controlBox.on('pointerdown', (pointer, localX, localY, event) => {
      event.stopPropagation();
      this.moveToAndExecute(this.controlX - 60, () => this.inspectControlBox());
    });

    // 5. Drawbridge and City Gate
    this.createDrawbridge(width, height);
  }

  createDrawbridge(width, height) {
    this.gateX = width * 0.94;
    this.gateY = height - 145;

    // Heavy Gate Arch
    this.gateGraphics = this.add.graphics();
    this.gateGraphics.fillStyle(0x181310, 1);
    this.gateGraphics.fillRect(width * 0.91, height - 320, 50, 175);
    this.gateGraphics.fillStyle(0x0a0806, 1);
    this.gateGraphics.fillRoundedRect(width * 0.92, height - 250, 36, 105, 10); // Dark arched doorway

    // Drawbridge plank
    this.bridgePlank = this.add.graphics();
    this.renderBridgePlank(true);
  }

  renderBridgePlank(isUpright) {
    this.bridgePlank.clear();
    const { width, height } = this.cameras.main;
    const startX = width * 0.91;
    const startY = height - 140;

    if (isUpright) {
      // Raised drawbridge
      this.bridgePlank.fillStyle(0x78350f, 1);
      this.bridgePlank.fillRect(startX, startY - 90, 14, 90);
      this.bridgePlank.lineStyle(3, 0xd97706, 1);
      this.bridgePlank.strokeRect(startX, startY - 90, 14, 90);
      // Heavy tension chain
      this.bridgePlank.lineStyle(2.5, 0x57534e, 1);
      this.bridgePlank.lineBetween(startX + 7, startY - 90, width * 0.91, height - 280);
    } else {
      // Lowered drawbridge spanning the scrap chasm
      this.bridgePlank.fillStyle(0x78350f, 1);
      this.bridgePlank.fillRect(startX - 95, startY - 8, 100, 14);
      this.bridgePlank.lineStyle(3, 0xd97706, 1);
      this.bridgePlank.strokeRect(startX - 95, startY - 8, 100, 14);
      // Green power light
      this.leverLight.setFillStyle(0x22c55e);

      // Warm golden glow spilling from inside the gate
      const gateGlow = this.add.graphics().setDepth(5);
      gateGlow.fillStyle(0xf59e0b, 0.25);
      gateGlow.fillTriangle(width * 0.93, height - 200, width * 0.78, height - 140, width * 0.93, height - 140);
    }
  }

  createJosef(x, y) {
    this.josef = this.add.container(x, y).setDepth(20);

    // Left Leg
    this.josefLegL = this.add.image(-12, 28, 'robot-leg');
    // Right Leg (starts missing if !this.hasLeg)
    this.josefLegR = this.add.image(12, 28, 'robot-leg').setVisible(this.hasLeg);

    // Torso (Closed by default)
    this.josefTorso = this.add.image(0, 0, 'robot-torso');

    // Telescopic Neck Segments for Stretch Mechanic
    this.neckSegments = [];
    for (let i = 0; i < 4; i++) {
      const seg = this.add.image(0, -30 - (i * 10), 'robot-neck').setVisible(false);
      this.neckSegments.push(seg);
    }

    // Left Arm (starts missing if !this.hasArm)
    this.josefArmL = this.add.image(-28, 2, 'robot-arm').setVisible(this.hasArm);
    // Right Arm
    this.josefArmR = this.add.image(28, 2, 'robot-arm');

    // Head
    this.josefHead = this.add.image(0, -42, 'robot-head');

    // Expressive Eyeball Pupils (Track Cursor)
    this.pupilL = this.add.image(-6, -42, 'robot-pupil');
    this.pupilR = this.add.image(6, -42, 'robot-pupil');

    this.josef.add([
      this.josefLegL,
      this.josefLegR,
      this.josefTorso,
      ...this.neckSegments,
      this.josefArmL,
      this.josefArmR,
      this.josefHead,
      this.pupilL,
      this.pupilR
    ]);

    this.josef.setSize(64, 90);
    this.josef.setInteractive({ useHandCursor: true });

    // Clicking Josef directly toggles his stretch stature!
    this.josef.on('pointerdown', (pointer, localX, localY, event) => {
      event.stopPropagation();
      this.cycleStature();
    });
  }

  createMechanicalRat(x, y) {
    this.rat = this.add.container(x, y).setDepth(15);
    const ratSprite = this.add.image(0, 0, 'robot-rat');
    this.ratLegItem = this.add.image(-10, 8, 'robot-leg').setScale(0.75).setRotation(1.3);

    const ratLabel = this.add.text(0, -24, 'RAT CRITTER', {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '10px',
      fontStyle: '900',
      color: '#a8a29e'
    }).setOrigin(0.5);

    this.rat.add([ratSprite, this.ratLegItem, ratLabel]);
    this.rat.setSize(54, 34);
    this.rat.setInteractive({ useHandCursor: true });

    this.rat.on('pointerdown', (pointer, localX, localY, event) => {
      event.stopPropagation();
      this.moveToAndExecute(this.rat.x - 70, () => this.inspectRat());
    });

    // Idle wiggle animation
    this.tweens.add({
      targets: this.rat,
      x: x + 10,
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  createFloatingHUD(width, height) {
    // 1. Sliding Top Inventory Drawer (Perplexity Glassmorphism)
    this.invPanel = this.add.container(width / 2, 44).setDepth(150);

    const invBg = this.add.graphics();
    invBg.fillStyle(0x14100c, 0.94);
    invBg.fillRoundedRect(-270, -32, 540, 64, 32);
    invBg.lineStyle(2, 0xd97706, 0.5);
    invBg.strokeRoundedRect(-270, -32, 540, 64, 32);

    this.invPanel.add(invBg);

    // 6 Inventory Slots
    this.slotIcons = [];
    for (let i = 0; i < 6; i++) {
      const slotX = -200 + i * 80;
      const slotG = this.add.graphics();
      slotG.fillStyle(0x271e17, 1);
      slotG.fillRoundedRect(slotX - 28, -24, 56, 48, 14);
      slotG.lineStyle(1.5, 0x451a03, 1);
      slotG.strokeRoundedRect(slotX - 28, -24, 56, 48, 14);
      this.invPanel.add(slotG);

      const icon = this.add.image(slotX, 0, 'item-doll').setVisible(false).setScale(0.9);
      icon.slotIndex = i;
      icon.setInteractive({ useHandCursor: true });
      icon.on('pointerdown', (pointer, localX, localY, event) => {
        event.stopPropagation();
        this.selectInventoryItem(icon.slotIndex);
      });
      this.invPanel.add(icon);
      this.slotIcons.push(icon);
    }

    // 2. Telescopic Stature Control Center (Bottom Floating Bar)
    this.createStatureBar(width, height);

    // 3. Top Right Controls (Hint, Sound, Fullscreen)
    this.createUtilityBar(width);
  }

  createStatureBar(width, height) {
    this.staturePanel = this.add.container(width / 2, height - 42).setDepth(150);

    const statBg = this.add.graphics();
    statBg.fillStyle(0x14100c, 0.92);
    statBg.fillRoundedRect(-210, -22, 420, 44, 22);
    statBg.lineStyle(1.5, 0xd97706, 0.6);
    statBg.strokeRoundedRect(-210, -22, 420, 44, 22);

    this.statLabel = this.add.text(0, 0, 'HEIGHT: NORMAL • PRESS [W] TO STRETCH / [S] TO CROUCH', {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '11px',
      fontStyle: '900',
      color: '#f59e0b',
      letterSpacing: '1px'
    }).setOrigin(0.5);

    this.staturePanel.add([statBg, this.statLabel]);
    this.staturePanel.setSize(420, 44);
    this.staturePanel.setInteractive({ useHandCursor: true });
    this.staturePanel.on('pointerdown', () => this.cycleStature());

    // Keyboard controls
    this.input.keyboard.on('keydown-W', () => this.setStature(1));
    this.input.keyboard.on('keydown-UP', () => this.setStature(1));
    this.input.keyboard.on('keydown-S', () => this.setStature(-1));
    this.input.keyboard.on('keydown-DOWN', () => this.setStature(-1));
    this.input.keyboard.on('keydown-SPACE', () => this.setStature(0));
  }

  createUtilityBar(width) {
    const utilContainer = this.add.container(width - 150, 44).setDepth(150);

    // Fullscreen Button
    const fsBg = this.add.graphics();
    fsBg.fillStyle(0x1c1815, 0.9);
    fsBg.fillRoundedRect(-120, -20, 110, 40, 20);
    fsBg.lineStyle(1.5, 0xf59e0b, 0.5);
    fsBg.strokeRoundedRect(-120, -20, 110, 40, 20);

    const fsText = this.add.text(-65, 0, '⛶ FULLSCREEN', {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '11px',
      fontStyle: '900',
      color: '#f59e0b'
    }).setOrigin(0.5);

    const fsBtn = this.add.container(0, 0, [fsBg, fsText]);
    fsBtn.setSize(110, 40);
    fsBtn.setInteractive({ useHandCursor: true });
    fsBtn.on('pointerdown', (pointer, lx, ly, event) => {
      event.stopPropagation();
      if (this.scale.isFullscreen) {
        this.scale.stopFullscreen();
      } else {
        this.scale.startFullscreen();
      }
    });

    // Hint Button
    const hintBg = this.add.graphics();
    hintBg.fillStyle(0x78350f, 1);
    hintBg.fillRoundedRect(5, -20, 85, 40, 20);
    hintBg.lineStyle(1.5, 0xf59e0b, 0.8);
    hintBg.strokeRoundedRect(5, -20, 85, 40, 20);

    const hintText = this.add.text(47, 0, '📖 HINT', {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '12px',
      fontStyle: '900',
      color: '#ffffff'
    }).setOrigin(0.5);

    const hintBtn = this.add.container(0, 0, [hintBg, hintText]);
    hintBtn.setSize(85, 40);
    hintBtn.setInteractive({ useHandCursor: true });
    hintBtn.on('pointerdown', (pointer, lx, ly, event) => {
      event.stopPropagation();
      this.showHintBook();
    });

    utilContainer.add([fsBtn, hintBtn]);
  }

  createThoughtBubble() {
    this.bubbleContainer = this.add.container(0, 0).setVisible(false).setDepth(200);
    const bubbleBg = this.add.image(0, 0, 'thought-bubble').setOrigin(0.15, 1);
    this.bubbleIcon1 = this.add.image(55, -75, 'item-doll').setScale(0.95);
    this.bubbleIcon2 = this.add.image(125, -75, 'item-doll').setScale(0.95);
    this.bubbleArrow = this.add.text(90, -78, '➜', {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '22px',
      color: '#451a03'
    }).setOrigin(0.5);

    this.bubbleContainer.add([bubbleBg, this.bubbleIcon1, this.bubbleArrow, this.bubbleIcon2]);
  }

  showThoughtBubble(type) {
    machinariumAudio.playBubblePop();
    this.bubbleContainer.setPosition(this.josef.x, this.josef.y - 50);
    this.bubbleContainer.setVisible(true);

    if (type === 'search-scrap') {
      this.bubbleIcon1.setTexture('robot-head');
      this.bubbleArrow.setText('➜');
      this.bubbleIcon2.setTexture('robot-leg');
    } else if (type === 'rat-trade') {
      this.bubbleIcon1.setTexture('item-doll');
      this.bubbleArrow.setText('➜');
      this.bubbleIcon2.setTexture('robot-leg');
    } else if (type === 'sludge-magnet') {
      this.bubbleIcon1.setTexture('item-grapple');
      this.bubbleArrow.setText('➜');
      this.bubbleIcon2.setTexture('item-powercore');
    } else if (type === 'need-stretch') {
      this.bubbleIcon1.setTexture('robot-head');
      this.bubbleArrow.setText('▲');
      this.bubbleIcon2.setTexture('control-lever-box');
    } else if (type === 'insert-core') {
      this.bubbleIcon1.setTexture('item-powercore');
      this.bubbleArrow.setText('➜');
      this.bubbleIcon2.setTexture('control-lever-box');
    }

    if (this.bubbleTimer) this.bubbleTimer.remove();
    this.bubbleTimer = this.time.delayedCall(3600, () => {
      this.bubbleContainer.setVisible(false);
    });
  }

  cycleStature() {
    let next = this.stature + 1;
    if (next > 1) next = -1;
    this.setStature(next);
  }

  setStature(newStature) {
    if (this.stature === newStature) return;
    const isStretching = newStature > this.stature;
    this.stature = newStature;
    machinariumAudio.playStretch(isStretching);

    if (this.stature === 1) {
      // Stretched Tall
      this.statLabel.setText('HEIGHT: STRETCHED [▲] • REACH HIGH CONTROLS & SHELVES');
      this.neckSegments.forEach((seg, i) => {
        seg.setVisible(true);
        seg.y = -30 - (i * 11);
      });
      this.tweens.add({
        targets: [this.josefHead, this.pupilL, this.pupilR],
        y: '-=42',
        duration: 250,
        ease: 'Back.easeOut'
      });
    } else if (this.stature === -1) {
      // Crouched
      this.statLabel.setText('HEIGHT: CROUCHED [▼] • DUCK UNDER PIPES & INSPECT LOW CREVICES');
      this.neckSegments.forEach((seg) => seg.setVisible(false));
      this.tweens.add({
        targets: [this.josefHead, this.pupilL, this.pupilR],
        y: -22,
        duration: 250,
        ease: 'Quad.easeInOut'
      });
    } else {
      // Normal Height
      this.statLabel.setText('HEIGHT: NORMAL [◆] • STANDARD LOCOMOTION');
      this.neckSegments.forEach((seg) => seg.setVisible(false));
      this.tweens.add({
        targets: [this.josefHead, this.pupilL, this.pupilR],
        y: -42,
        duration: 200,
        ease: 'Quad.easeInOut'
      });
    }
  }

  // --- Move to Target with Callback ---

  moveToAndExecute(targetX, onArrivalCallback) {
    const clampedX = Phaser.Math.Clamp(targetX, 90, this.bridgeLowered ? this.cameras.main.width + 50 : this.cameras.main.width * 0.88);
    this.targetX = clampedX;
    this.pendingAction = onArrivalCallback;
    this.isMoving = true;

    // Face direction
    if (this.targetX < this.josef.x) {
      this.josef.setScale(-1, 1);
    } else {
      this.josef.setScale(1, 1);
    }
  }

  handlePointerDown(pointer) {
    // Hide thought bubble on click
    if (this.bubbleContainer.visible) {
      this.bubbleContainer.setVisible(false);
    }

    // Ignore clicks on top HUD or bottom stature bar
    if (pointer.y < 85 || pointer.y > this.cameras.main.height - 75) {
      return;
    }

    // Spawn Click Confirmation Pulse Ring
    const pulse = this.add.image(pointer.x, pointer.y, 'click-pulse').setDepth(10);
    this.tweens.add({
      targets: pulse,
      scale: 1.8,
      alpha: 0,
      duration: 350,
      onComplete: () => pulse.destroy()
    });

    // Move to ground coordinate
    this.moveToAndExecute(pointer.x, null);
  }

  update(time, delta) {
    // Gear rotations
    if (this.gear1) this.gear1.rotation += 0.003;
    if (this.gear2) this.gear2.rotation -= 0.005;
    if (this.gear3) this.gear3.rotation += 0.0025;

    // Josef Movement (Hop or Walk)
    if (this.isMoving && this.targetX !== null) {
      const speed = (this.hasLeg ? 140 : 80) * (delta / 1000);
      const diff = this.targetX - this.josef.x;

      if (Math.abs(diff) <= speed) {
        this.josef.x = this.targetX;
        this.isMoving = false;
        this.targetX = null;
        this.josefLegL.y = 28;
        if (this.josefLegR) this.josefLegR.y = 28;

        // Execute pending puzzle action
        if (this.pendingAction) {
          const action = this.pendingAction;
          this.pendingAction = null;
          action();
        }

        // Check if Josef crossed the lowered bridge!
        if (this.bridgeLowered && this.josef.x >= this.cameras.main.width * 0.9) {
          this.victoryTransition();
        }
      } else {
        this.josef.x += Math.sign(diff) * speed;

        if (this.hasLeg) {
          // Bipedal Walk Oscillation
          const legBob = Math.sin(time / 80) * 5;
          this.josefLegL.y = 28 + legBob;
          this.josefLegR.y = 28 - legBob;
        } else {
          // Lovable One-Legged Hop Bob
          const hopBob = Math.abs(Math.sin(time / 110)) * 14;
          this.josef.y = (this.cameras.main.height - 145) - hopBob;
        }
      }
    }

    // Dynamic Eyeball Tracking (Pupils Look At Cursor)
    if (this.pupilL && this.pupilR && this.josef) {
      const pointer = this.input.activePointer;
      const headGlobalY = this.josef.y + this.josefHead.y;
      const angle = Phaser.Math.Angle.Between(this.josef.x, headGlobalY, pointer.x, pointer.y);
      const dist = Math.min(3.5, Phaser.Math.Distance.Between(this.josef.x, headGlobalY, pointer.x, pointer.y) / 70);
      const dx = Math.cos(angle) * dist * (this.josef.scaleX > 0 ? 1 : -1);
      const dy = Math.sin(angle) * dist;

      this.pupilL.x = -6 + dx;
      this.pupilL.y = this.josefHead.y + dy;
      this.pupilR.x = 6 + dx;
      this.pupilR.y = this.josefHead.y + dy;
    }
  }

  // --- Puzzle Interactions ---

  inspectScrapPile() {
    if (!this.hasArm) {
      this.hasArm = true;
      this.josefArmL.setVisible(true);

      // Open chest hatch suction effect!
      this.openChestHatch(() => {
        this.addItem('item-doll');
        this.addItem('item-magnet');
        machinariumAudio.playPickup();
        this.showBannerNotification('DISCOVERED: MISSING ARM, HORSESHOE MAGNET & TOY WIND-UP DOLL!');
        this.showThoughtBubble('rat-trade');
      });
    } else {
      this.showBannerNotification('THE SCRAP PILE HAS BEEN THOROUGHLY SEARCHED.');
    }
  }

  inspectRat() {
    if (this.selectedItem === 'item-doll') {
      // Successful trade with the rat!
      this.removeItem('item-doll');
      this.ratLegItem.setVisible(false);
      this.hasLeg = true;
      this.josefLegR.setVisible(true);
      machinariumAudio.playCombine();
      machinariumAudio.playRatChirp();

      this.showBannerNotification('GAVE TOY TO RAT! RETRIEVED MISSING LEG — FULL WALKING RESTORED!');

      // Rat scurries away
      this.tweens.add({
        targets: this.rat,
        x: this.cameras.main.width + 80,
        duration: 1200,
        ease: 'Quad.easeIn',
        onComplete: () => this.rat.destroy()
      });

      this.time.delayedCall(1200, () => {
        this.showThoughtBubble('sludge-magnet');
      });
    } else {
      this.showThoughtBubble('rat-trade');
      this.showBannerNotification('THE ROBOT RAT IS PLAYING WITH YOUR MISSING LEG! OFFER THE TOY DOLL.');
    }
  }

  inspectLampPost() {
    if (this.wireItemSprite.visible) {
      this.wireItemSprite.setVisible(false);
      this.openChestHatch(() => {
        this.addItem('item-wire');
        machinariumAudio.playPickup();
        this.showBannerNotification('OBTAINED: COIL OF CONDUCTIVE COPPER WIRE!');
      });
    } else {
      this.showBannerNotification('NOTHING MORE ON THIS OLD LAMP.');
    }
  }

  inspectSludgePool() {
    if (this.sludgeFished) {
      this.showBannerNotification('THE TOXIC POOL IS INERT.');
      return;
    }

    if (this.selectedItem === 'item-grapple') {
      this.sludgeFished = true;
      this.removeItem('item-grapple');
      this.submergedCore.setVisible(false);

      // Animated Magnetic Fishing Sequence!
      machinariumAudio.playSplash();

      // Spawn fishing line visual
      const line = this.add.graphics().setDepth(25);
      line.lineStyle(2, 0xf59e0b, 1);
      line.lineBetween(this.josef.x + 20, this.josef.y - 10, this.sludgeX, this.sludgeY);

      this.time.delayedCall(450, () => {
        line.destroy();
        this.openChestHatch(() => {
          this.addItem('item-powercore');
          machinariumAudio.playCombine();
          this.showBannerNotification('REELING IN SUCCESS! RETRIEVED THE GLOWING POWER CORE!');
          this.showThoughtBubble('need-stretch');
        });
      });
    } else {
      this.showThoughtBubble('sludge-magnet');
      this.showBannerNotification('THE CORROSIVE SLUDGE IS TOO TOXIC! COMBINE WIRE + MAGNET IN INVENTORY.');
    }
  }

  inspectControlBox() {
    if (this.stature !== 1) {
      // Must stretch to reach high lever!
      this.showThoughtBubble('need-stretch');
      this.showBannerNotification('TOO HIGH! PRESS [W] OR [▲] TO STRETCH JOSEF TALL TO REACH THE LEVER.');
      return;
    }

    if (this.selectedItem === 'item-powercore') {
      // Restore power to the bridge!
      this.removeItem('item-powercore');
      this.bridgePowered = true;
      this.bridgeLowered = true;

      machinariumAudio.playSpark();
      machinariumAudio.playPuzzleSolved();
      machinariumAudio.playSteamHiss();
      machinariumAudio.playGateGroan();

      // Lower drawbridge
      this.renderBridgePlank(false);
      this.cameras.main.shake(400, 0.02);

      // Burst of electric sparks from switch box
      const sparks = this.add.particles(this.controlX, this.controlY - 30, 'spark-particle', {
        speed: { min: 80, max: 220 },
        angle: { min: 0, max: 360 },
        scale: { start: 1, end: 0 },
        lifespan: 500,
        maxParticles: 20
      });
      this.time.delayedCall(600, () => sparks.destroy());

      this.showBannerNotification('POWER RESTORED! DRAWBRIDGE LOWERED — CROSS INTO MACHINA!');
    } else if (!this.bridgePowered) {
      this.showThoughtBubble('insert-core');
      this.showBannerNotification('THE SWITCH BOX NEEDS A POWER CORE TO ACTIVATE THE DRAWBRIDGE.');
    } else {
      this.showBannerNotification('DRAWBRIDGE IS DOWN! PROCEED ACROSS THE CHASM.');
    }
  }

  openChestHatch(onCloseCallback) {
    this.josefTorso.setTexture('robot-torso-open');
    this.time.delayedCall(300, () => {
      this.josefTorso.setTexture('robot-torso');
      if (onCloseCallback) onCloseCallback();
    });
  }

  // --- Inventory Management ---

  addItem(key) {
    if (this.inventory.includes(key)) return;
    this.inventory.push(key);
    this.refreshInventoryUI();
  }

  removeItem(key) {
    const idx = this.inventory.indexOf(key);
    if (idx !== -1) {
      this.inventory.splice(idx, 1);
      if (this.selectedItem === key) this.selectedItem = null;
      this.refreshInventoryUI();
    }
  }

  refreshInventoryUI() {
    for (let i = 0; i < this.slotIcons.length; i++) {
      const item = this.inventory[i];
      if (item) {
        this.slotIcons[i].setTexture(item).setVisible(true);
      } else {
        this.slotIcons[i].setVisible(false);
      }
    }
  }

  selectInventoryItem(index) {
    const item = this.inventory[index];
    if (!item) return;

    // Item Combination: Wire + Magnet
    if (this.selectedItem && this.selectedItem !== item) {
      if ((this.selectedItem === 'item-magnet' && item === 'item-wire') ||
          (this.selectedItem === 'item-wire' && item === 'item-magnet')) {
        this.removeItem('item-magnet');
        this.removeItem('item-wire');
        this.addItem('item-grapple');
        this.selectedItem = 'item-grapple';
        machinariumAudio.playCombine();
        machinariumAudio.playSpark();
        this.showBannerNotification('CRAFTED: MAGNETIC GRAPPLING LINE!');
        return;
      }
    }

    this.selectedItem = item;
    machinariumAudio.playPickup();
    this.showBannerNotification(`ACTIVE ITEM: ${item.toUpperCase().replace('ITEM-', '')}`);
  }

  showBannerNotification(text) {
    if (this.notifText) this.notifText.destroy();
    const { width } = this.cameras.main;

    this.notifText = this.add.text(width / 2, 88, text, {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '13px',
      fontStyle: '900',
      color: '#fef08a',
      backgroundColor: '#1c1917',
      padding: { x: 18, y: 8 }
    }).setOrigin(0.5).setDepth(180);

    this.time.delayedCall(3200, () => {
      if (this.notifText) this.notifText.destroy();
    });
  }

  showHintBook() {
    machinariumAudio.playBubblePop();
    const { width, height } = this.cameras.main;

    const modalBg = this.add.rectangle(width / 2, height / 2, width, height, 0x050403, 0.88).setDepth(250);

    const book = this.add.graphics().setDepth(251);
    book.fillStyle(0xfffbeb, 1);
    book.fillRoundedRect(width / 2 - 240, height / 2 - 160, 480, 320, 28);
    book.lineStyle(3.5, 0x78350f, 1);
    book.strokeRoundedRect(width / 2 - 240, height / 2 - 160, 480, 320, 28);

    const title = this.add.text(width / 2, height / 2 - 115, 'JOSEF\'S SKETCHBOOK GUIDE', {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '22px',
      fontStyle: '900',
      color: '#78350f',
      letterSpacing: '1px'
    }).setOrigin(0.5).setDepth(252);

    let hintContent = '';
    if (!this.hasArm) {
      hintContent = 'STEP 1: REASSEMBLY\nSearch the Scrap Wreckage on the left.\nFind your missing arm, horseshoe magnet, and toy doll!';
    } else if (!this.hasLeg) {
      hintContent = 'STEP 2: RAT BARTER\nSelect the Toy Doll from your top inventory.\nClick the mechanical rat to trade the toy for your leg!';
    } else if (!this.sludgeFished) {
      hintContent = 'STEP 3: MAGNETIC GRAPPLE\n1. Retrieve copper wire from the lamp post.\n2. In inventory, combine WIRE + MAGNET.\n3. Click toxic sludge with Grapple to fish out the Power Core!';
    } else if (!this.bridgeLowered) {
      hintContent = 'STEP 4: HIGH SWITCH TOWER\n1. Move near the tall switch post.\n2. Press [W] or [▲] to STRETCH Josef tall.\n3. Insert Power Core and pull the lever to lower the bridge!';
    } else {
      hintContent = 'FINAL STEP: ENTER MACHINA\nDrawbridge is open! Walk across into the mechanical city!';
    }

    const body = this.add.text(width / 2, height / 2, hintContent, {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '15px',
      fontWeight: '800',
      color: '#44403c',
      align: 'center',
      lineSpacing: 10
    }).setOrigin(0.5).setDepth(252);

    const closeBtn = this.add.text(width / 2, height / 2 + 115, '[ CLOSE SKETCHBOOK ]', {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '15px',
      fontStyle: '900',
      color: '#b45309'
    }).setOrigin(0.5).setDepth(252).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => {
      machinariumAudio.playPickup();
      modalBg.destroy();
      book.destroy();
      title.destroy();
      body.destroy();
      closeBtn.destroy();
    });
  }

  victoryTransition() {
    machinariumAudio.playPuzzleSolved();
    this.cameras.main.fade(500, 12, 10, 8);
    this.time.delayedCall(500, () => {
      this.scene.start('VictoryScene');
    });
  }
}
