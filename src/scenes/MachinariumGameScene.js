import Phaser from 'phaser';
import { machinariumAudio } from '../utils/MachinariumAudio.js';

export default class MachinariumGameScene extends Phaser.Scene {
  constructor() {
    super('MachinariumGameScene');
  }

  init() {
    // Game Progression Flags
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
    this.buildScene();
    this.scale.on('resize', () => this.handleResize(), this);

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

    // Opening Awakening Clue
    this.time.delayedCall(1200, () => {
      this.showThoughtBubble('search-scrap');
      this.showBannerNotification('WAKE UP, JOSEF! SEARCH THE SCRAP WRECKAGE TO REASSEMBLE YOUR BODY.');
    });
  }

  handleResize() {
    // Retain current Josef position percentage
    const oldWidth = this.currentWidth || 1280;
    const ratioX = this.josef ? this.josef.x / oldWidth : 0.3;

    this.buildScene();

    if (this.josef) {
      this.josef.x = ratioX * this.scale.width;
      this.josef.y = this.scale.height - 145;
    }
  }

  buildScene() {
    const width = this.scale.width;
    const height = this.scale.height;
    this.currentWidth = width;
    this.currentHeight = height;

    // Clear previous elements if rebuilding during resize
    if (this.worldLayer) this.worldLayer.destroy();
    this.worldLayer = this.add.container(0, 0);

    // 1. Multi-layered Atmospheric Scenery
    this.createAtmosphere(width, height);

    // 2. Interactive World Props
    this.createWorldProps(width, height);

    // 3. Articulated Josef Robot
    if (!this.josef) {
      this.createJosef(width * 0.32, height - 145);
    } else {
      this.josef.y = height - 145;
      this.worldLayer.add(this.josef);
    }

    // 4. Mechanical Rat Critter
    if (!this.ratTraded) {
      this.createMechanicalRat(width * 0.54, height - 140);
    }

    // 5. In-Game Floating HUD
    this.createFloatingHUD(width, height);

    // 6. Comic Thought Bubble Container
    this.createThoughtBubble();

    // 7. Full-Screen Atmospheric Vignette
    this.vignette = this.add.image(width / 2, height / 2, 'screen-vignette')
      .setDisplaySize(width, height)
      .setAlpha(0.65)
      .setDepth(100);
    this.worldLayer.add(this.vignette);

    // Input Handling
    this.input.off('pointerdown');
    this.input.on('pointerdown', (pointer) => this.handlePointerDown(pointer));
  }

  createAtmosphere(width, height) {
    // Dark twilight steampunk gradient
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x271e17, 0x271e17, 0x0c0a08, 0x0c0a08, 1);
    sky.fillRect(0, 0, width, height);
    this.worldLayer.add(sky);

    // Volumetric Twilight God-Rays
    const rays = this.add.graphics();
    rays.fillStyle(0xf59e0b, 0.04);
    rays.fillTriangle(width * 0.35, 0, width * 0.05, height, width * 0.65, height);
    rays.fillTriangle(width * 0.75, 0, width * 0.45, height, width, height);
    this.worldLayer.add(rays);

    // Distant Industrial Skyline (Layers of Scrap Towers & Smokestacks)
    const skyline = this.add.graphics();
    skyline.fillStyle(0x181310, 0.9);
    skyline.fillRect(width * 0.06, 90, width * 0.12, height - 90);
    skyline.fillRect(width * 0.19, 140, width * 0.08, height - 140);
    skyline.fillRect(width * 0.7, 70, width * 0.13, height - 70);
    skyline.fillRect(width * 0.85, 110, width * 0.12, height - 110);

    // Connecting giant conduits
    skyline.lineStyle(12, 0x241d18, 0.9);
    skyline.lineBetween(width * 0.16, 230, width * 0.28, 190);
    skyline.lineBetween(width * 0.7, 180, width * 0.85, 250);
    this.worldLayer.add(skyline);

    // Animated Background Clockwork Gears
    this.gear1 = this.add.image(width * 0.14, 180, 'industrial-gear').setScale(2.2).setAlpha(0.24);
    this.gear2 = this.add.image(width * 0.24, 250, 'industrial-gear').setScale(1.5).setAlpha(0.28);
    this.gear3 = this.add.image(width * 0.78, 160, 'industrial-gear').setScale(2.5).setAlpha(0.2);
    this.worldLayer.add([this.gear1, this.gear2, this.gear3]);

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

    // Riveted ground rim line
    this.groundGraphic.lineStyle(4, 0x451a03, 1);
    this.groundGraphic.lineBetween(0, height - 125, width * 0.82, height - 125);
    this.groundGraphic.lineBetween(width * 0.82, height - 125, width, height - 145);
    this.worldLayer.add(this.groundGraphic);

    // Steam pipe with particle emitter
    const steam = this.add.particles(width * 0.08, height - 160, 'steam-puff', {
      speed: { min: 25, max: 55 },
      angle: { min: 245, max: 275 },
      scale: { start: 0.6, end: 2.2 },
      alpha: { start: 0.45, end: 0 },
      lifespan: 2800,
      frequency: 240
    });
    this.worldLayer.add(steam);
  }

  createWorldProps(width, height) {
    // 1. Scrap Wreckage (Bathtub + Girders)
    this.scrapPileX = width * 0.16;
    this.scrapPileY = height - 135;
    this.scrapPile = this.add.container(this.scrapPileX, this.scrapPileY);

    const scrapSprite = this.add.image(0, 0, 'scrap-wreckage-hd');

    this.scrapGlow = this.add.graphics().setVisible(false);
    this.scrapGlow.lineStyle(4, 0xf59e0b, 0.7);
    this.scrapGlow.strokeRoundedRect(-85, -55, 170, 95, 20);

    const scrapLabel = this.add.text(0, -62, 'SCRAP WRECKAGE', {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '12px',
      fontStyle: '900',
      color: '#f59e0b'
    }).setOrigin(0.5);

    this.scrapPile.add([this.scrapGlow, scrapSprite, scrapLabel]);
    this.scrapPile.setSize(160, 100);
    this.scrapPile.setInteractive({ useHandCursor: true });

    this.scrapPile.on('pointerover', () => this.scrapGlow.setVisible(true));
    this.scrapPile.on('pointerout', () => this.scrapGlow.setVisible(false));
    this.scrapPile.on('pointerdown', (pointer, localX, localY, event) => {
      event.stopPropagation();
      this.moveToAndExecute(this.scrapPileX + 80, () => this.inspectScrapPile());
    });
    this.worldLayer.add(this.scrapPile);

    // 2. Toxic Sludge Pool
    this.sludgeX = width * 0.48;
    this.sludgeY = height - 100;
    this.sludgePool = this.add.image(this.sludgeX, this.sludgeY, 'toxic-puddle').setInteractive({ useHandCursor: true });

    const sludgeLabel = this.add.text(this.sludgeX, this.sludgeY - 44, 'CORROSIVE SLUDGE', {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '11px',
      fontStyle: '900',
      color: '#22c55e'
    }).setOrigin(0.5);
    this.worldLayer.add([this.sludgePool, sludgeLabel]);

    // Submerged Glowing Core
    this.submergedCore = this.add.image(this.sludgeX, this.sludgeY + 4, 'item-powercore')
      .setScale(0.85)
      .setAlpha(0.75)
      .setVisible(!this.sludgeFished);

    this.tweens.add({
      targets: this.submergedCore,
      alpha: 0.35,
      scale: 0.78,
      duration: 800,
      yoyo: true,
      repeat: -1
    });
    this.worldLayer.add(this.submergedCore);

    this.sludgePool.on('pointerdown', (pointer, localX, localY, event) => {
      event.stopPropagation();
      this.moveToAndExecute(this.sludgeX - 90, () => this.inspectSludgePool());
    });

    // 3. Broken Lamp Post with Wire
    this.lampX = width * 0.7;
    this.lampY = height - 235;
    this.lampPost = this.add.container(this.lampX, this.lampY);

    const lampG = this.add.graphics();
    lampG.fillStyle(0x292524, 1);
    lampG.fillRect(-6, 0, 12, 120);
    lampG.fillStyle(0x78350f, 1);
    lampG.fillCircle(0, 0, 16);

    this.wireItemSprite = this.add.image(12, 34, 'item-wire').setScale(0.95).setVisible(!this.inventory.includes('item-wire') && !this.inventory.includes('item-grapple') && !this.sludgeFished);
    const lampLabel = this.add.text(0, -25, 'LAMP POST', {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '11px',
      fontStyle: '900',
      color: '#f59e0b'
    }).setOrigin(0.5);

    this.lampPost.add([lampG, this.wireItemSprite, lampLabel]);
    this.lampPost.setSize(60, 140);
    this.lampPost.setInteractive({ useHandCursor: true });

    this.lampPost.on('pointerdown', (pointer, localX, localY, event) => {
      event.stopPropagation();
      this.moveToAndExecute(this.lampX - 55, () => this.inspectLampPost());
    });
    this.worldLayer.add(this.lampPost);

    // 4. High Electric Control Tower
    this.controlX = width * 0.88;
    this.controlY = height - 240;
    this.controlBox = this.add.image(this.controlX, this.controlY, 'control-lever-box').setInteractive({ useHandCursor: true });
    this.leverLight = this.add.circle(this.controlX - 12, this.controlY - 60, 5.5, this.bridgePowered ? 0x22c55e : 0xef4444);

    const boxLabel = this.add.text(this.controlX, this.controlY - 95, 'HIGH SWITCH BOX', {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '11px',
      fontStyle: '900',
      color: '#ef4444'
    }).setOrigin(0.5);
    this.worldLayer.add([this.controlBox, this.leverLight, boxLabel]);

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
    this.gateGraphics.fillRect(width * 0.91, height - 340, 60, 195);
    this.gateGraphics.fillStyle(0x0a0806, 1);
    this.gateGraphics.fillRoundedRect(width * 0.92, height - 260, 42, 115, 12);
    this.worldLayer.add(this.gateGraphics);

    // Drawbridge plank
    this.bridgePlank = this.add.graphics();
    this.worldLayer.add(this.bridgePlank);
    this.renderBridgePlank(!this.bridgeLowered);
  }

  renderBridgePlank(isUpright) {
    this.bridgePlank.clear();
    const width = this.scale.width;
    const height = this.scale.height;
    const startX = width * 0.91;
    const startY = height - 140;

    if (isUpright) {
      // Raised drawbridge
      this.bridgePlank.fillStyle(0x78350f, 1);
      this.bridgePlank.fillRect(startX, startY - 100, 16, 100);
      this.bridgePlank.lineStyle(3, 0xd97706, 1);
      this.bridgePlank.strokeRect(startX, startY - 100, 16, 100);
      // Heavy chain
      this.bridgePlank.lineStyle(2.5, 0x57534e, 1);
      this.bridgePlank.lineBetween(startX + 8, startY - 100, width * 0.91, height - 300);
    } else {
      // Lowered drawbridge
      this.bridgePlank.fillStyle(0x78350f, 1);
      this.bridgePlank.fillRect(startX - 110, startY - 8, 120, 16);
      this.bridgePlank.lineStyle(3, 0xd97706, 1);
      this.bridgePlank.strokeRect(startX - 110, startY - 8, 120, 16);
      this.leverLight.setFillStyle(0x22c55e);

      // Warm golden beam spilling from the gate
      const gateGlow = this.add.graphics().setDepth(5);
      gateGlow.fillStyle(0xf59e0b, 0.28);
      gateGlow.fillTriangle(width * 0.93, height - 220, width * 0.76, height - 140, width * 0.93, height - 140);
      this.worldLayer.add(gateGlow);
    }
  }

  createJosef(x, y) {
    this.josef = this.add.container(x, y).setDepth(30);

    // Left Leg
    this.josefLegL = this.add.image(-12, 30, 'robot-leg');
    // Right Leg
    this.josefLegR = this.add.image(12, 30, 'robot-leg').setVisible(this.hasLeg);

    // Torso
    this.josefTorso = this.add.image(0, 0, 'robot-torso');

    // Telescopic Neck Segments
    this.neckSegments = [];
    for (let i = 0; i < 4; i++) {
      const seg = this.add.image(0, -32 - (i * 12), 'robot-neck').setVisible(false);
      this.neckSegments.push(seg);
    }

    // Left Arm
    this.josefArmL = this.add.image(-30, 4, 'robot-arm').setVisible(this.hasArm);
    // Right Arm
    this.josefArmR = this.add.image(30, 4, 'robot-arm');

    // Head
    this.josefHead = this.add.image(0, -42, 'robot-head');

    // Eyeball Pupils (Track Cursor)
    this.pupilL = this.add.image(-7, -42, 'robot-pupil');
    this.pupilR = this.add.image(7, -42, 'robot-pupil');

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

    this.josef.setSize(68, 96);
    this.josef.setInteractive({ useHandCursor: true });

    this.josef.on('pointerdown', (pointer, localX, localY, event) => {
      event.stopPropagation();
      this.cycleStature();
    });
    this.worldLayer.add(this.josef);
  }

  createMechanicalRat(x, y) {
    this.rat = this.add.container(x, y).setDepth(20);
    const ratSprite = this.add.image(0, 0, 'robot-rat');
    this.ratLegItem = this.add.image(-10, 8, 'robot-leg').setScale(0.75).setRotation(1.3);

    const ratLabel = this.add.text(0, -25, 'RAT CRITTER', {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '10px',
      fontStyle: '900',
      color: '#a8a29e'
    }).setOrigin(0.5);

    this.rat.add([ratSprite, this.ratLegItem, ratLabel]);
    this.rat.setSize(60, 36);
    this.rat.setInteractive({ useHandCursor: true });

    this.rat.on('pointerdown', (pointer, localX, localY, event) => {
      event.stopPropagation();
      this.moveToAndExecute(this.rat.x - 70, () => this.inspectRat());
    });

    this.tweens.add({
      targets: this.rat,
      x: x + 10,
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    this.worldLayer.add(this.rat);
  }

  createFloatingHUD(width, height) {
    // 1. Sliding Top Inventory Drawer
    this.invPanel = this.add.container(width / 2, 46).setDepth(150);

    const invBg = this.add.graphics();
    invBg.fillStyle(0x14100c, 0.94);
    invBg.fillRoundedRect(-280, -34, 560, 68, 34);
    invBg.lineStyle(2, 0xd97706, 0.5);
    invBg.strokeRoundedRect(-280, -34, 560, 68, 34);
    this.invPanel.add(invBg);

    // 6 Inventory Slots
    this.slotIcons = [];
    for (let i = 0; i < 6; i++) {
      const slotX = -205 + i * 82;
      const slotG = this.add.graphics();
      slotG.fillStyle(0x271e17, 1);
      slotG.fillRoundedRect(slotX - 30, -26, 60, 52, 16);
      slotG.lineStyle(1.5, 0x451a03, 1);
      slotG.strokeRoundedRect(slotX - 30, -26, 60, 52, 16);
      this.invPanel.add(slotG);

      const icon = this.add.image(slotX, 0, 'item-doll').setVisible(false).setScale(0.95);
      icon.slotIndex = i;
      icon.setInteractive({ useHandCursor: true });
      icon.on('pointerdown', (pointer, localX, localY, event) => {
        event.stopPropagation();
        this.selectInventoryItem(icon.slotIndex);
      });
      this.invPanel.add(icon);
      this.slotIcons.push(icon);
    }
    this.refreshInventoryUI();

    // 2. Stature Control Center (Bottom Floating Bar)
    this.staturePanel = this.add.container(width / 2, height - 42).setDepth(150);

    const statBg = this.add.graphics();
    statBg.fillStyle(0x14100c, 0.92);
    statBg.fillRoundedRect(-220, -22, 440, 44, 22);
    statBg.lineStyle(1.5, 0xd97706, 0.6);
    statBg.strokeRoundedRect(-220, -22, 440, 44, 22);

    this.statLabel = this.add.text(0, 0, 'HEIGHT: NORMAL • PRESS [W] TO STRETCH / [S] TO CROUCH', {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '11px',
      fontStyle: '900',
      color: '#f59e0b',
      letterSpacing: '1px'
    }).setOrigin(0.5);

    this.staturePanel.add([statBg, this.statLabel]);
    this.staturePanel.setSize(440, 44);
    this.staturePanel.setInteractive({ useHandCursor: true });
    this.staturePanel.on('pointerdown', () => this.cycleStature());

    // Keyboard bindings
    this.input.keyboard.off('keydown-W');
    this.input.keyboard.off('keydown-S');
    this.input.keyboard.off('keydown-SPACE');
    this.input.keyboard.on('keydown-W', () => this.setStature(1));
    this.input.keyboard.on('keydown-UP', () => this.setStature(1));
    this.input.keyboard.on('keydown-S', () => this.setStature(-1));
    this.input.keyboard.on('keydown-DOWN', () => this.setStature(-1));
    this.input.keyboard.on('keydown-SPACE', () => this.setStature(0));

    // 3. Top Right Controls (Fullscreen & Hint)
    const utilContainer = this.add.container(width - 160, 46).setDepth(150);

    const fsBg = this.add.graphics();
    fsBg.fillStyle(0x1c1815, 0.9);
    fsBg.fillRoundedRect(-125, -20, 115, 40, 20);
    fsBg.lineStyle(1.5, 0xf59e0b, 0.5);
    fsBg.strokeRoundedRect(-125, -20, 115, 40, 20);

    const fsText = this.add.text(-68, 0, '⛶ FULLSCREEN', {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '11px',
      fontStyle: '900',
      color: '#f59e0b'
    }).setOrigin(0.5);

    const fsBtn = this.add.container(0, 0, [fsBg, fsText]);
    fsBtn.setSize(115, 40);
    fsBtn.setInteractive({ useHandCursor: true });
    fsBtn.on('pointerdown', (pointer, lx, ly, event) => {
      event.stopPropagation();
      if (this.scale.isFullscreen) {
        this.scale.stopFullscreen();
      } else {
        this.scale.startFullscreen();
      }
    });

    const hintBg = this.add.graphics();
    hintBg.fillStyle(0x78350f, 1);
    hintBg.fillRoundedRect(5, -20, 90, 40, 20);
    hintBg.lineStyle(1.5, 0xf59e0b, 0.8);
    hintBg.strokeRoundedRect(5, -20, 90, 40, 20);

    const hintText = this.add.text(50, 0, '📖 HINT', {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '12px',
      fontStyle: '900',
      color: '#ffffff'
    }).setOrigin(0.5);

    const hintBtn = this.add.container(0, 0, [hintBg, hintText]);
    hintBtn.setSize(90, 40);
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
    this.bubbleIcon1 = this.add.image(60, -80, 'item-doll').setScale(1);
    this.bubbleIcon2 = this.add.image(140, -80, 'item-doll').setScale(1);
    this.bubbleArrow = this.add.text(100, -83, '➜', {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '24px',
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
      this.statLabel.setText('HEIGHT: STRETCHED [▲] • REACH HIGH CONTROLS & LEVERS');
      this.neckSegments.forEach((seg, i) => {
        seg.setVisible(true);
        seg.y = -32 - (i * 12);
      });
      this.tweens.add({
        targets: [this.josefHead, this.pupilL, this.pupilR],
        y: '-=46',
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

  moveToAndExecute(targetX, onArrivalCallback) {
    const width = this.scale.width;
    const clampedX = Phaser.Math.Clamp(targetX, 90, this.bridgeLowered ? width + 60 : width * 0.88);
    this.targetX = clampedX;
    this.pendingAction = onArrivalCallback;
    this.isMoving = true;

    // Face walking direction
    if (this.targetX < this.josef.x) {
      this.josef.setScale(-1, 1);
    } else {
      this.josef.setScale(1, 1);
    }
  }

  handlePointerDown(pointer) {
    if (this.bubbleContainer.visible) {
      this.bubbleContainer.setVisible(false);
    }

    // Ignore clicks on top HUD or bottom stature bar
    if (pointer.y < 88 || pointer.y > this.scale.height - 75) {
      return;
    }

    // Spawn Click Confirmation Pulse Ring
    const pulse = this.add.image(pointer.x, pointer.y, 'click-pulse').setDepth(15);
    this.tweens.add({
      targets: pulse,
      scale: 1.8,
      alpha: 0,
      duration: 350,
      onComplete: () => pulse.destroy()
    });

    this.moveToAndExecute(pointer.x, null);
  }

  update(time, delta) {
    if (this.gear1) this.gear1.rotation += 0.003;
    if (this.gear2) this.gear2.rotation -= 0.005;
    if (this.gear3) this.gear3.rotation += 0.0025;

    // Josef Movement
    if (this.isMoving && this.targetX !== null) {
      const speed = (this.hasLeg ? 140 : 80) * (delta / 1000);
      const diff = this.targetX - this.josef.x;

      if (Math.abs(diff) <= speed) {
        this.josef.x = this.targetX;
        this.isMoving = false;
        this.targetX = null;
        this.josefLegL.y = 30;
        if (this.josefLegR) this.josefLegR.y = 30;

        if (this.pendingAction) {
          const action = this.pendingAction;
          this.pendingAction = null;
          action();
        }

        if (this.bridgeLowered && this.josef.x >= this.scale.width * 0.9) {
          this.victoryTransition();
        }
      } else {
        this.josef.x += Math.sign(diff) * speed;

        if (this.hasLeg) {
          const legBob = Math.sin(time / 80) * 5;
          this.josefLegL.y = 30 + legBob;
          this.josefLegR.y = 30 - legBob;
        } else {
          const hopBob = Math.abs(Math.sin(time / 110)) * 14;
          this.josef.y = (this.scale.height - 145) - hopBob;
        }
      }
    }

    // Dynamic Eyeball Tracking (Pupils Look At Cursor)
    if (this.pupilL && this.pupilR && this.josef) {
      const pointer = this.input.activePointer;
      const headGlobalY = this.josef.y + this.josefHead.y;
      const angle = Phaser.Math.Angle.Between(this.josef.x, headGlobalY, pointer.x, pointer.y);
      const dist = Math.min(3.5, Phaser.Math.Distance.Between(this.josef.x, headGlobalY, pointer.x, pointer.y) / 75);
      const dx = Math.cos(angle) * dist * (this.josef.scaleX > 0 ? 1 : -1);
      const dy = Math.sin(angle) * dist;

      this.pupilL.x = -7 + dx;
      this.pupilL.y = this.josefHead.y + dy;
      this.pupilR.x = 7 + dx;
      this.pupilR.y = this.josefHead.y + dy;
    }
  }

  // --- Puzzle Interactions ---

  inspectScrapPile() {
    if (!this.hasArm) {
      this.hasArm = true;
      this.josefArmL.setVisible(true);

      this.openChestHatch(() => {
        this.addItem('item-doll');
        this.addItem('item-magnet');
        machinariumAudio.playPickup();
        this.showBannerNotification('DISCOVERED: MISSING ARM, HORSESHOE MAGNET & TOY WIND-UP DOLL!');
        this.showThoughtBubble('rat-trade');
      });
    } else {
      this.showBannerNotification('THE SCRAP WRECKAGE HAS BEEN THOROUGHLY SEARCHED.');
    }
  }

  inspectRat() {
    if (this.selectedItem === 'item-doll') {
      this.removeItem('item-doll');
      this.ratLegItem.setVisible(false);
      this.hasLeg = true;
      this.ratTraded = true;
      this.josefLegR.setVisible(true);
      machinariumAudio.playCombine();
      machinariumAudio.playRatChirp();

      this.showBannerNotification('GAVE TOY TO RAT! RETRIEVED MISSING LEG — BIPEDAL WALKING RESTORED!');

      this.tweens.add({
        targets: this.rat,
        x: this.scale.width + 80,
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

      machinariumAudio.playSplash();

      const line = this.add.graphics().setDepth(25);
      line.lineStyle(2, 0xf59e0b, 1);
      line.lineBetween(this.josef.x + 20, this.josef.y - 10, this.sludgeX, this.sludgeY);

      this.time.delayedCall(450, () => {
        line.destroy();
        this.openChestHatch(() => {
          this.addItem('item-powercore');
          machinariumAudio.playCombine();
          this.showBannerNotification('FISHED OUT: GLOWING VACUUM-TUBE POWER CORE!');
          this.showThoughtBubble('need-stretch');
        });
      });
    } else {
      this.showThoughtBubble('sludge-magnet');
      this.showBannerNotification('CORROSIVE CHEMICALS! CRAFT A MAGNETIC GRAPPLE (WIRE + MAGNET) TO FISH IT.');
    }
  }

  inspectControlBox() {
    if (this.stature !== 1) {
      this.showThoughtBubble('need-stretch');
      this.showBannerNotification('TOO HIGH! PRESS [W] OR [▲] TO STRETCH JOSEF TALL TO REACH THE LEVER.');
      return;
    }

    if (this.selectedItem === 'item-powercore') {
      this.removeItem('item-powercore');
      this.bridgePowered = true;
      this.bridgeLowered = true;

      machinariumAudio.playSpark();
      machinariumAudio.playPuzzleSolved();
      machinariumAudio.playSteamHiss();
      machinariumAudio.playGateGroan();

      this.renderBridgePlank(false);
      this.cameras.main.shake(400, 0.02);

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
      this.showBannerNotification('THE SWITCH BOX REQUIRES A POWER CORE TO ACTIVATE THE DRAWBRIDGE.');
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
    if (!this.slotIcons) return;
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
    const width = this.scale.width;

    this.notifText = this.add.text(width / 2, 92, text, {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '13px',
      fontStyle: '900',
      color: '#fef08a',
      backgroundColor: '#1c1917',
      padding: { x: 20, y: 8 }
    }).setOrigin(0.5).setDepth(180);

    this.time.delayedCall(3200, () => {
      if (this.notifText) this.notifText.destroy();
    });
  }

  showHintBook() {
    machinariumAudio.playBubblePop();
    const width = this.scale.width;
    const height = this.scale.height;

    const modalBg = this.add.rectangle(width / 2, height / 2, width, height, 0x050403, 0.9).setDepth(250);

    const book = this.add.graphics().setDepth(251);
    book.fillStyle(0xfffbeb, 1);
    book.fillRoundedRect(width / 2 - 250, height / 2 - 170, 500, 340, 28);
    book.lineStyle(3.5, 0x78350f, 1);
    book.strokeRoundedRect(width / 2 - 250, height / 2 - 170, 500, 340, 28);

    const title = this.add.text(width / 2, height / 2 - 120, 'JOSEF\'S SKETCHBOOK GUIDE', {
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

    const closeBtn = this.add.text(width / 2, height / 2 + 120, '[ CLOSE SKETCHBOOK ]', {
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
