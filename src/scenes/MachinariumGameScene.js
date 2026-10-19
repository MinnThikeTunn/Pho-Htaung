import Phaser from 'phaser';
import { machinariumAudio } from '../utils/MachinariumAudio.js';

export default class MachinariumGameScene extends Phaser.Scene {
  constructor() {
    super('MachinariumGameScene');
  }

  init() {
    // Game State Flags
    this.hasArm = false;
    this.hasLeg = false;
    this.isAssembled = false;
    this.ratTraded = false;
    this.sludgeFished = false;
    this.bridgePowered = false;
    this.bridgeLowered = false;

    // Josef Stature (crouched = -1, normal = 0, stretched = 1)
    this.stature = 0;
    this.isWalking = false;
    this.targetX = null;
    this.inventory = [];
    this.selectedItem = null;
  }

  create() {
    const { width, height } = this.cameras.main;

    // 1. Atmospheric Scenery
    this.createScenery(width, height);

    // 2. Interactive World Props
    this.createWorldProps(width, height);

    // 3. Build Josef Protagonist Container
    this.createJosef(width / 2 - 80, height - 135);

    // 4. Build Mechanical Mouse Critter
    this.createMechanicalRat(width / 2 + 100, height - 130);

    // 5. Inventory Bar & Stature Controls (UI HUD)
    this.createHUD(width, height);

    // 6. Thought Bubble Container
    this.createThoughtBubble();

    // 7. Mouse Point-and-Click Input Handling
    this.input.on('pointerdown', (pointer) => this.handleWorldClick(pointer));

    // Footstep timer
    this.time.addEvent({
      delay: 350,
      callback: () => {
        if (this.isWalking && this.hasLeg) {
          machinariumAudio.playFootstep();
        }
      },
      loop: true
    });

    // Opening thought clue after a brief pause
    this.time.delayedCall(1200, () => {
      this.showThoughtBubble('search-scrap');
    });
  }

  createScenery(width, height) {
    // Steampunk sky gradient
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x271e17, 0x271e17, 0x14100c, 0x14100c, 1);
    sky.fillRect(0, 0, width, height);

    // Distant background city silhouette
    const bgBuildings = this.add.graphics();
    bgBuildings.fillStyle(0x1a1512, 0.8);
    bgBuildings.fillRect(50, 80, 110, height - 80);
    bgBuildings.fillRect(190, 120, 80, height - 120);
    bgBuildings.fillRect(width - 280, 50, 130, height - 50);
    bgBuildings.fillRect(width - 130, 90, 110, height - 90);

    // Industrial pipes
    bgBuildings.lineStyle(10, 0x221a14, 0.9);
    bgBuildings.lineBetween(160, 200, 280, 170);
    bgBuildings.lineBetween(width - 280, 150, width - 140, 210);

    // Animated gears
    this.bgGear1 = this.add.image(130, 150, 'industrial-gear').setScale(1.6).setAlpha(0.2);
    this.bgGear2 = this.add.image(width - 210, 130, 'industrial-gear').setScale(2).setAlpha(0.25);

    // Ground & Scrap Valley
    this.groundGraphic = this.add.graphics();
    this.groundGraphic.fillStyle(0x2c221a, 1);
    this.groundGraphic.beginPath();
    this.groundGraphic.moveTo(0, height - 110);
    this.groundGraphic.lineTo(width * 0.28, height - 110);
    this.groundGraphic.lineTo(width * 0.32, height - 90); // Toxic pool dip
    this.groundGraphic.lineTo(width * 0.52, height - 90);
    this.groundGraphic.lineTo(width * 0.56, height - 110);
    this.groundGraphic.lineTo(width * 0.8, height - 110);
    this.groundGraphic.lineTo(width * 0.85, height - 125); // Bridge outpost platform
    this.groundGraphic.lineTo(width, height - 125);
    this.groundGraphic.lineTo(width, height);
    this.groundGraphic.lineTo(0, height);
    this.groundGraphic.closePath();
    this.groundGraphic.fillPath();

    // Riveted ground rim line
    this.groundGraphic.lineStyle(3, 0x451a03, 1);
    this.groundGraphic.lineBetween(0, height - 110, width * 0.8, height - 110);
    this.groundGraphic.lineBetween(width * 0.8, height - 110, width, height - 125);

    // Steam pipe with particle emitter
    this.add.particles(70, height - 140, 'steam-puff', {
      speed: { min: 20, max: 40 },
      angle: { min: 240, max: 270 },
      scale: { start: 0.5, end: 1.6 },
      alpha: { start: 0.5, end: 0 },
      lifespan: 2500,
      frequency: 300
    });
  }

  createWorldProps(width, height) {
    // 1. Scrap Pile (Bathtub & Wreckage)
    this.scrapPile = this.add.container(width * 0.16, height - 120);
    const scrapG = this.add.graphics();
    scrapG.fillStyle(0x44403c, 1);
    scrapG.fillEllipse(0, 0, 70, 30);
    scrapG.fillStyle(0x78350f, 1);
    scrapG.fillRoundedRect(-35, -25, 70, 30, 8);
    scrapG.lineStyle(2, 0x92400e, 1);
    scrapG.strokeRoundedRect(-35, -25, 70, 30, 8);

    const scrapLabel = this.add.text(0, -38, 'SCRAP PILE', {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '11px',
      fontWeight: '800',
      color: '#d97706'
    }).setOrigin(0.5);

    this.scrapPile.add([scrapG, scrapLabel]);
    this.scrapPile.setSize(90, 60);
    this.scrapPile.setInteractive({ useHandCursor: true });
    this.scrapPile.on('pointerdown', () => this.inspectScrapPile());

    // 2. Toxic Sludge Puddle
    this.sludgePool = this.add.image(width * 0.42, height - 85, 'toxic-puddle').setInteractive({ useHandCursor: true });
    const sludgeLabel = this.add.text(width * 0.42, height - 120, 'TOXIC POOL', {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '11px',
      fontWeight: '800',
      color: '#22c55e'
    }).setOrigin(0.5);

    // Glowing core submerged in sludge
    this.submergedCore = this.add.image(width * 0.42, height - 82, 'item-powercore').setScale(0.7).setAlpha(0.7);
    this.tweens.add({
      targets: this.submergedCore,
      alpha: 0.3,
      duration: 900,
      yoyo: true,
      repeat: -1
    });

    this.sludgePool.on('pointerdown', () => this.inspectSludgePool());

    // 3. Broken Lamp Post with dangling wire
    this.lampPost = this.add.container(width * 0.62, height - 190);
    const lampG = this.add.graphics();
    lampG.fillStyle(0x292524, 1);
    lampG.fillRect(-4, 0, 8, 90);
    lampG.fillStyle(0x78350f, 1);
    lampG.fillCircle(0, 0, 10);
    // Dangling copper wire coil
    this.wireItemSprite = this.add.image(8, 25, 'item-wire').setScale(0.85);
    this.lampPost.add([lampG, this.wireItemSprite]);
    this.lampPost.setSize(40, 100);
    this.lampPost.setInteractive({ useHandCursor: true });
    this.lampPost.on('pointerdown', () => this.inspectLampPost());

    // 4. High Control Tower with Lever Box
    this.controlBox = this.add.image(width * 0.88, height - 195, 'control-lever-box').setInteractive({ useHandCursor: true });
    this.leverLight = this.add.circle(width * 0.88 - 8, height - 240, 4, 0xef4444); // Red indicator
    this.controlBox.on('pointerdown', () => this.inspectControlBox());

    // 5. Drawbridge and City Gate
    this.createDrawbridge(width, height);
  }

  createDrawbridge(width, height) {
    this.gateX = width * 0.95;
    this.gateY = height - 130;

    // Heavy Gate Arch
    this.gateGraphics = this.add.graphics();
    this.gateGraphics.fillStyle(0x1c1917, 1);
    this.gateGraphics.fillRect(width * 0.92, height - 260, 40, 140);
    this.gateGraphics.fillStyle(0x0c0a09, 1);
    this.gateGraphics.fillRoundedRect(width * 0.93, height - 210, 30, 90, 8); // Dark portal doorway

    // Drawbridge plank (starts upright / closed)
    this.bridgePlank = this.add.graphics();
    this.renderBridgePlank(true);
  }

  renderBridgePlank(isUpright) {
    this.bridgePlank.clear();
    const { width, height } = this.cameras.main;
    const startX = width * 0.92;
    const startY = height - 120;

    if (isUpright) {
      // Raised bridge
      this.bridgePlank.fillStyle(0x78350f, 1);
      this.bridgePlank.fillRect(startX, startY - 70, 10, 70);
      this.bridgePlank.lineStyle(2, 0xd97706, 1);
      this.bridgePlank.strokeRect(startX, startY - 70, 10, 70);
      // Cable
      this.bridgePlank.lineStyle(2, 0x44403c, 1);
      this.bridgePlank.lineBetween(startX + 5, startY - 70, width * 0.92, height - 230);
    } else {
      // Lowered drawbridge spanning the scrap chasm
      this.bridgePlank.fillStyle(0x78350f, 1);
      this.bridgePlank.fillRect(startX - 75, startY - 5, 80, 10);
      this.bridgePlank.lineStyle(2, 0xd97706, 1);
      this.bridgePlank.strokeRect(startX - 75, startY - 5, 80, 10);
      // Green light on gate arch
      this.leverLight.setFillStyle(0x22c55e);
    }
  }

  createJosef(x, y) {
    this.josef = this.add.container(x, y);

    // Left Leg
    this.josefLegL = this.add.image(-10, 22, 'robot-leg');
    // Right Leg (starts missing if !this.hasLeg)
    this.josefLegR = this.add.image(10, 22, 'robot-leg').setVisible(this.hasLeg);

    // Torso
    this.josefTorso = this.add.image(0, 0, 'robot-torso');

    // Telescopic Neck Segments
    this.neckSegments = [];
    for (let i = 0; i < 4; i++) {
      const seg = this.add.image(0, -24 - (i * 8), 'robot-neck').setVisible(false);
      this.neckSegments.push(seg);
    }

    // Left Arm (starts missing if !this.hasArm)
    this.josefArmL = this.add.image(-22, 0, 'robot-arm').setVisible(this.hasArm);
    // Right Arm
    this.josefArmR = this.add.image(22, 0, 'robot-arm');

    // Head
    this.josefHead = this.add.image(0, -32, 'robot-head');

    this.josef.add([
      this.josefLegL,
      this.josefLegR,
      this.josefTorso,
      ...this.neckSegments,
      this.josefArmL,
      this.josefArmR,
      this.josefHead
    ]);

    this.josef.setSize(54, 76);
    this.josef.setInteractive({ useHandCursor: true });
    this.josef.on('pointerdown', (pointer, localX, localY, event) => {
      event.stopPropagation();
      this.cycleStature();
    });
  }

  createMechanicalRat(x, y) {
    this.rat = this.add.container(x, y);
    const ratSprite = this.add.image(0, 0, 'robot-rat');
    this.ratLegItem = this.add.image(-8, 6, 'robot-leg').setScale(0.7).setRotation(1.2);

    this.rat.add([ratSprite, this.ratLegItem]);
    this.rat.setSize(44, 26);
    this.rat.setInteractive({ useHandCursor: true });
    this.rat.on('pointerdown', () => this.inspectRat());

    // Idle wiggle animation
    this.tweens.add({
      targets: this.rat,
      x: x + 8,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  createHUD(width, height) {
    // 1. Top Sleek Inventory Drawer
    this.invPanel = this.add.container(width / 2, 38);

    const invBg = this.add.graphics();
    invBg.fillStyle(0x14100c, 0.95);
    invBg.fillRoundedRect(-240, -28, 480, 56, 28);
    invBg.lineStyle(1.5, 0xd97706, 0.4);
    invBg.strokeRoundedRect(-240, -28, 480, 56, 28);

    this.invPanel.add(invBg);

    // Inventory Slots
    this.slotIcons = [];
    for (let i = 0; i < 6; i++) {
      const slotX = -175 + i * 70;
      const slotG = this.add.graphics();
      slotG.fillStyle(0x271e17, 1);
      slotG.fillRoundedRect(slotX - 24, -20, 48, 40, 12);
      slotG.lineStyle(1, 0x451a03, 1);
      slotG.strokeRoundedRect(slotX - 24, -20, 48, 40, 12);
      this.invPanel.add(slotG);

      const icon = this.add.image(slotX, 0, 'item-doll').setVisible(false).setScale(0.8);
      icon.slotIndex = i;
      icon.setInteractive({ useHandCursor: true });
      icon.on('pointerdown', (pointer, localX, localY, event) => {
        event.stopPropagation();
        this.selectInventoryItem(icon.slotIndex);
      });
      this.invPanel.add(icon);
      this.slotIcons.push(icon);
    }

    // 2. Josef Stature Control Panel (Bottom Right)
    this.statureControls = this.add.container(width - 120, height - 42);

    const statBg = this.add.graphics();
    statBg.fillStyle(0x14100c, 0.9);
    statBg.fillRoundedRect(-100, -20, 200, 40, 20);
    statBg.lineStyle(1.5, 0xd97706, 0.5);
    statBg.strokeRoundedRect(-100, -20, 200, 40, 20);

    this.statLabel = this.add.text(0, 0, 'HEIGHT: NORMAL [W/S]', {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '11px',
      fontStyle: '900',
      color: '#f59e0b'
    }).setOrigin(0.5);

    this.statureControls.add([statBg, this.statLabel]);
    this.statureControls.setSize(200, 40);
    this.statureControls.setInteractive({ useHandCursor: true });
    this.statureControls.on('pointerdown', () => this.cycleStature());

    // 3. Hint Book Button (Top Right)
    this.hintBtn = this.add.container(width - 70, 38);
    const hintBg = this.add.graphics();
    hintBg.fillStyle(0x78350f, 1);
    hintBg.fillRoundedRect(-50, -22, 100, 44, 22);
    hintBg.lineStyle(1.5, 0xf59e0b, 0.8);
    hintBg.strokeRoundedRect(-50, -22, 100, 44, 22);

    const hintText = this.add.text(0, 0, '📖 HINT', {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '13px',
      fontStyle: '900',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.hintBtn.add([hintBg, hintText]);
    this.hintBtn.setSize(100, 44);
    this.hintBtn.setInteractive({ useHandCursor: true });
    this.hintBtn.on('pointerdown', () => this.showHintBook());

    // Keyboard Shortcuts for Stature: W / Up (Stretch), S / Down (Crouch)
    this.input.keyboard.on('keydown-W', () => this.setStature(1));
    this.input.keyboard.on('keydown-UP', () => this.setStature(1));
    this.input.keyboard.on('keydown-S', () => this.setStature(-1));
    this.input.keyboard.on('keydown-DOWN', () => this.setStature(-1));
    this.input.keyboard.on('keydown-SPACE', () => this.setStature(0));
  }

  createThoughtBubble() {
    this.bubbleContainer = this.add.container(0, 0).setVisible(false).setDepth(100);
    const bubbleBg = this.add.image(0, 0, 'thought-bubble').setOrigin(0.15, 1);
    this.bubbleIcon1 = this.add.image(45, -60, 'item-doll').setScale(0.85);
    this.bubbleIcon2 = this.add.image(95, -60, 'item-doll').setScale(0.85);
    this.bubbleArrow = this.add.text(70, -62, '➜', {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '18px',
      color: '#451a03'
    }).setOrigin(0.5);

    this.bubbleContainer.add([bubbleBg, this.bubbleIcon1, this.bubbleArrow, this.bubbleIcon2]);
  }

  showThoughtBubble(type) {
    machinariumAudio.playBubblePop();
    this.bubbleContainer.setPosition(this.josef.x, this.josef.y - 45);
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
    this.bubbleTimer = this.time.delayedCall(3400, () => {
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
      this.statLabel.setText('HEIGHT: STRETCHED [▲]');
      this.neckSegments.forEach((seg, i) => {
        seg.setVisible(true);
        seg.y = -24 - (i * 9);
      });
      this.tweens.add({
        targets: this.josefHead,
        y: -64,
        duration: 250,
        ease: 'Back.easeOut'
      });
    } else if (this.stature === -1) {
      // Crouched
      this.statLabel.setText('HEIGHT: CROUCHED [▼]');
      this.neckSegments.forEach((seg) => seg.setVisible(false));
      this.tweens.add({
        targets: this.josefHead,
        y: -18,
        duration: 250,
        ease: 'Quad.easeInOut'
      });
    } else {
      // Normal Height
      this.statLabel.setText('HEIGHT: NORMAL [◆]');
      this.neckSegments.forEach((seg) => seg.setVisible(false));
      this.tweens.add({
        targets: this.josefHead,
        y: -32,
        duration: 200,
        ease: 'Quad.easeInOut'
      });
    }
  }

  handleWorldClick(pointer) {
    // Hide thought bubble on click
    if (this.bubbleContainer.visible) {
      this.bubbleContainer.setVisible(false);
    }

    // Ignore clicks on top HUD or bottom stature bar
    if (pointer.y < 80 || (pointer.y > this.cameras.main.height - 70 && pointer.x > this.cameras.main.width - 250)) {
      return;
    }

    // If Josef does not yet have both legs, he hops in place
    if (!this.hasLeg) {
      machinariumAudio.playFootstep();
      this.tweens.add({
        targets: this.josef,
        y: this.josef.y - 12,
        duration: 120,
        yoyo: true
      });
      this.showThoughtBubble('search-scrap');
      return;
    }

    // Set target walk point
    const clampedX = Phaser.Math.Clamp(pointer.x, 80, this.bridgeLowered ? this.cameras.main.width + 40 : this.cameras.main.width * 0.88);
    this.targetX = clampedX;
    this.isWalking = true;

    // Flip Josef orientation
    if (this.targetX < this.josef.x) {
      this.josef.setScale(-1, 1);
    } else {
      this.josef.setScale(1, 1);
    }
  }

  update(time, delta) {
    // Gear rotations
    if (this.bgGear1) this.bgGear1.rotation += 0.003;
    if (this.bgGear2) this.bgGear2.rotation -= 0.004;

    // Josef Walk Movement
    if (this.isWalking && this.targetX !== null) {
      const speed = 120 * (delta / 1000);
      const diff = this.targetX - this.josef.x;

      if (Math.abs(diff) <= speed) {
        this.josef.x = this.targetX;
        this.isWalking = false;
        this.targetX = null;
        this.josefLegL.y = 22;
        this.josefLegR.y = 22;

        // Check if Josef crossed into the open city gate!
        if (this.bridgeLowered && this.josef.x >= this.cameras.main.width * 0.9) {
          this.victoryTransition();
        }
      } else {
        this.josef.x += Math.sign(diff) * speed;
        // Leg walk wobble
        const legBob = Math.sin(time / 80) * 4;
        this.josefLegL.y = 22 + legBob;
        this.josefLegR.y = 22 - legBob;
      }
    }
  }

  // --- Puzzle Interactions ---

  inspectScrapPile() {
    const dist = Phaser.Math.Distance.Between(this.josef.x, this.josef.y, this.scrapPile.x, this.scrapPile.y);
    if (dist > 180 && this.hasLeg) {
      this.targetX = this.scrapPile.x + 60;
      this.isWalking = true;
      return;
    }

    if (!this.hasArm) {
      this.hasArm = true;
      this.josefArmL.setVisible(true);
      this.addItem('item-doll');
      this.addItem('item-magnet');
      machinariumAudio.playPickup();

      // Floating discovery label
      this.showWorldNotification('FOUND: MISSING ARM, MAGNET & TOY DOLL!');
      this.showThoughtBubble('rat-trade');
    } else {
      this.showWorldNotification('THE SCRAP PILE HAS BEEN THOROUGHLY SEARCHED.');
    }
  }

  inspectRat() {
    const dist = Phaser.Math.Distance.Between(this.josef.x, this.josef.y, this.rat.x, this.rat.y);
    if (dist > 160 && this.hasLeg) {
      this.targetX = this.rat.x - 60;
      this.isWalking = true;
      return;
    }

    if (this.selectedItem === 'item-doll') {
      // Successful trade with the rat!
      this.removeItem('item-doll');
      this.ratLegItem.setVisible(false);
      this.hasLeg = true;
      this.josefLegR.setVisible(true);
      machinariumAudio.playCombine();

      this.showWorldNotification('TRADED TOY WITH RAT! RETRIEVED MISSING LEG!');

      // Rat scurries away
      this.tweens.add({
        targets: this.rat,
        x: this.cameras.main.width + 60,
        duration: 1200,
        ease: 'Quad.easeIn',
        onComplete: () => this.rat.destroy()
      });

      this.time.delayedCall(1000, () => {
        this.showThoughtBubble('sludge-magnet');
      });
    } else {
      this.showThoughtBubble('rat-trade');
      this.showWorldNotification('THE ROBOT RAT WANTS A PLAYTHING IN RETURN!');
    }
  }

  inspectLampPost() {
    if (this.wireItemSprite.visible) {
      this.wireItemSprite.setVisible(false);
      this.addItem('item-wire');
      machinariumAudio.playPickup();
      this.showWorldNotification('COLLECTED: COIL OF COPPER WIRE!');
    }
  }

  inspectSludgePool() {
    if (this.sludgeFished) {
      this.showWorldNotification('THE TOXIC POOL IS NOW INERT.');
      return;
    }

    if (this.selectedItem === 'item-grapple') {
      this.sludgeFished = true;
      this.removeItem('item-grapple');
      this.submergedCore.setVisible(false);
      this.addItem('item-powercore');
      machinariumAudio.playCombine();
      this.showWorldNotification('FISHED OUT: GLOWING POWER CORE!');

      this.time.delayedCall(1000, () => {
        this.showThoughtBubble('need-stretch');
      });
    } else {
      this.showThoughtBubble('sludge-magnet');
      this.showWorldNotification('TOO TOXIC TO REACH BY HAND! CRAFT A TOOL TO RETRIEVE IT.');
    }
  }

  inspectControlBox() {
    if (this.stature !== 1) {
      // Must stretch to reach high lever!
      this.showThoughtBubble('need-stretch');
      this.showWorldNotification('THE CONTROL SWITCH IS TOO HIGH! STRETCH UPWARDS [W / ▲] TO REACH IT.');
      return;
    }

    if (this.selectedItem === 'item-powercore') {
      // Restore power to bridge!
      this.removeItem('item-powercore');
      this.bridgePowered = true;
      this.bridgeLowered = true;
      machinariumAudio.playPuzzleSolved();
      machinariumAudio.playSteamHiss();

      // Lower drawbridge
      this.renderBridgePlank(false);
      this.showWorldNotification('POWER CORE INSERTED! DRAWBRIDGE LOWERED!');

      this.cameras.main.shake(300, 0.015);
    } else if (!this.bridgePowered) {
      this.showThoughtBubble('insert-core');
      this.showWorldNotification('THE SWITCH BOX REQUIRES A GLOWING POWER CORE TO ENGAGE.');
    } else {
      this.showWorldNotification('DRAWBRIDGE IS LOWERED. ENTER THE MECHANICAL CITY!');
    }
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

    // Check item combination: Wire + Magnet
    if (this.selectedItem && this.selectedItem !== item) {
      if ((this.selectedItem === 'item-magnet' && item === 'item-wire') ||
          (this.selectedItem === 'item-wire' && item === 'item-magnet')) {
        this.removeItem('item-magnet');
        this.removeItem('item-wire');
        this.addItem('item-grapple');
        this.selectedItem = 'item-grapple';
        machinariumAudio.playCombine();
        this.showWorldNotification('COMBINED: CRAFTED MAGNETIC GRAPPLING LINE!');
        return;
      }
    }

    this.selectedItem = item;
    machinariumAudio.playPickup();
    this.showWorldNotification(`SELECTED ITEM: ${item.toUpperCase().replace('ITEM-', '')}`);
  }

  showWorldNotification(text) {
    if (this.notifText) this.notifText.destroy();
    const { width } = this.cameras.main;

    this.notifText = this.add.text(width / 2, 75, text, {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '12px',
      fontStyle: '900',
      color: '#fef08a',
      backgroundColor: '#1c1917',
      padding: { x: 12, y: 6 }
    }).setOrigin(0.5);

    this.time.delayedCall(3000, () => {
      if (this.notifText) this.notifText.destroy();
    });
  }

  showHintBook() {
    machinariumAudio.playBubblePop();
    const { width, height } = this.cameras.main;

    // Modal Background
    const modalBg = this.add.rectangle(width / 2, height / 2, width, height, 0x050403, 0.85).setDepth(200);

    const book = this.add.graphics().setDepth(201);
    book.fillStyle(0xfffbeb, 1);
    book.fillRoundedRect(width / 2 - 200, height / 2 - 140, 400, 280, 24);
    book.lineStyle(3, 0x78350f, 1);
    book.strokeRoundedRect(width / 2 - 200, height / 2 - 140, 400, 280, 24);

    const title = this.add.text(width / 2, height / 2 - 100, 'JOSEF\'S SKETCHBOOK', {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '20px',
      fontStyle: '900',
      color: '#78350f'
    }).setOrigin(0.5).setDepth(202);

    let hintContent = '';
    if (!this.hasLeg) {
      hintContent = '1. Search scrap pile for missing arm & toy doll.\n2. Trade doll with mechanical rat for leg.\n3. Snap parts together to walk!';
    } else if (!this.sludgeFished) {
      hintContent = '1. Retrieve copper wire from lamp post.\n2. In inventory, combine WIRE + MAGNET.\n3. Fish power core from toxic sludge!';
    } else if (!this.bridgeLowered) {
      hintContent = '1. Approach high watchtower pole.\n2. Press [W] or [▲] to STRETCH Josef tall.\n3. Insert glowing power core to lower bridge!';
    } else {
      hintContent = 'Drawbridge is down! Walk across into the mechanical city!';
    }

    const body = this.add.text(width / 2, height / 2, hintContent, {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '14px',
      fontWeight: '700',
      color: '#44403c',
      align: 'center',
      lineSpacing: 10
    }).setOrigin(0.5).setDepth(202);

    const closeBtn = this.add.text(width / 2, height / 2 + 100, '[ CLOSE GUIDE ]', {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '14px',
      fontStyle: '900',
      color: '#b45309'
    }).setOrigin(0.5).setDepth(202).setInteractive({ useHandCursor: true });

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
    this.cameras.main.fade(500, 20, 16, 12);
    this.time.delayedCall(500, () => {
      this.scene.start('VictoryScene');
    });
  }
}
