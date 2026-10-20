import Phaser from 'phaser';
import SubtitleBox from '../ui/SubtitleBox.js';
import InventoryBar from '../ui/InventoryBar.js';
import ThoughtBubble from '../ui/ThoughtBubble.js';
import GameHUD from '../ui/GameHUD.js';
import { gameState } from '../utils/GameState.js';
import { soundEngine } from '../utils/SoundEngine.js';
import { MicroInteractions } from '../utils/MicroInteractions.js';
import { AmbientAtmosphere } from '../utils/AmbientAtmosphere.js';

export default class Chapter1Scene extends Phaser.Scene {
  constructor() {
    super('Chapter1Scene');
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    this.isDead = false;
    this.pushTimer = 0;
    this.tunnelOpened = false;
    this.hasCog = false;
    this.hasLever = false;
    this.bridgeLowered = false;
    this.targetX = null;
    this.lastMoveTime = 0;
    this.nextIdleTime = 4500;

    // Start Machinarium Ambient Sneaky BGM & Floex Drone
    gameState.setCurrentScene('Chapter1Scene');
    soundEngine.startBGM();
    soundEngine.startAmbientDrone();

    // 1. Atmosphere Background & Stratified Canyon Chasm
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a120c, 0x1a120c, 0x080604, 0x080604, 1);
    bg.fillRect(0, 0, width, height);

    // Stratified Canyon Cliff Walls (Left & Right)
    const cliffs = this.add.graphics();
    // Left Cliff Strata (Multi-tone sedimentary rock)
    cliffs.fillStyle(0x3b1d11, 0.95);
    cliffs.beginPath();
    cliffs.moveTo(0, 0);
    cliffs.lineTo(width * 0.42, 0);
    cliffs.lineTo(width * 0.40, height * 0.35);
    cliffs.lineTo(width * 0.38, height * 0.65);
    cliffs.lineTo(width * 0.39, height);
    cliffs.lineTo(0, height);
    cliffs.closePath();
    cliffs.fill();

    // Rock sedimentary stripes & fissures (Left)
    cliffs.lineStyle(2, 0x572814, 0.7);
    for (let sy = 50; sy < height - 120; sy += 38) {
      cliffs.beginPath();
      cliffs.moveTo(0, sy);
      cliffs.lineTo(width * 0.38 - (sy % 25), sy + (sy % 15));
      cliffs.stroke();
    }
    // Deep rock fissures
    cliffs.lineStyle(1.5, 0x180b06, 0.85);
    cliffs.beginPath();
    cliffs.moveTo(width * 0.22, 60); cliffs.lineTo(width * 0.25, 140); cliffs.lineTo(width * 0.21, 220);
    cliffs.moveTo(width * 0.12, 180); cliffs.lineTo(width * 0.15, 290);
    cliffs.stroke();

    // Right Cliff Strata
    cliffs.fillStyle(0x361a0f, 0.95);
    cliffs.beginPath();
    cliffs.moveTo(width * 0.64, 0);
    cliffs.lineTo(width, 0);
    cliffs.lineTo(width, height);
    cliffs.lineTo(width * 0.65, height);
    cliffs.lineTo(width * 0.66, height * 0.65);
    cliffs.lineTo(width * 0.63, height * 0.35);
    cliffs.closePath();
    cliffs.fill();

    // Sedimentary bands (Right)
    cliffs.lineStyle(2, 0x4d210e, 0.7);
    for (let sy = 60; sy < height - 120; sy += 42) {
      cliffs.beginPath();
      cliffs.moveTo(width * 0.66 + (sy % 20), sy);
      cliffs.lineTo(width, sy + (sy % 12));
      cliffs.stroke();
    }

    // Heavy Industrial Steel Suspension Pylon & Braided Cables
    const cables = this.add.graphics();
    cables.lineStyle(3, 0x1e293b, 0.9);
    // Steel cross beam pylon on left
    cables.strokeRect(width * 0.34, 40, 24, height * 0.5);
    cables.lineBetween(width * 0.34, 40, width * 0.34 + 24, 120);
    cables.lineBetween(width * 0.34, 120, width * 0.34 + 24, 40);
    cables.lineBetween(width * 0.34, 120, width * 0.34 + 24, 200);
    cables.lineBetween(width * 0.34, 200, width * 0.34 + 24, 120);
    // Braided suspension cable stretching across the pit
    cables.lineStyle(2.5, 0x475569, 0.85);
    cables.beginPath();
    cables.moveTo(width * 0.35, 60);
    cables.lineTo(width * 0.43, 110);
    cables.lineTo(width * 0.52, 135);
    cables.lineTo(width * 0.60, 115);
    cables.lineTo(width * 0.68, 80);
    cables.stroke();

    // Hanging Wrought-Iron Oil Lantern & Amber Light Cone
    const lanternX = width * 0.26;
    const lanternY = height * 0.42;
    // Chain
    cables.lineStyle(1.5, 0x64748b, 0.8);
    cables.lineBetween(lanternX, 30, lanternX, lanternY);
    // Lantern cage
    cables.fillStyle(0x1e293b, 1);
    cables.fillRect(lanternX - 8, lanternY, 16, 22);
    // Glowing amber flame core
    cables.fillStyle(0xf59e0b, 1);
    cables.fillCircle(lanternX, lanternY + 11, 5);
    cables.fillStyle(0xfef08a, 1);
    cables.fillCircle(lanternX, lanternY + 11, 2.5);

    // Warm Conical Lantern Light Pool
    const lightCone = this.add.graphics().setDepth(2);
    lightCone.fillStyle(0xf59e0b, 0.08);
    lightCone.beginPath();
    lightCone.moveTo(lanternX, lanternY + 11);
    lightCone.lineTo(lanternX - 110, height - 120);
    lightCone.lineTo(lanternX + 110, height - 120);
    lightCone.closePath();
    lightCone.fill();

    // 2. Ceiling with Spikes
    this.createCeilingSpikes(width);

    // 3. Platforms
    const groundY = height - 120;
    const leftPlatWidth = width * 0.38;
    const pitWidth = width * 0.28;
    const rightPlatX = leftPlatWidth + pitWidth;
    const rightPlatWidth = width - rightPlatX;

    // Left Platform (Walkable Physics Body)
    this.leftPlat = this.add.rectangle(leftPlatWidth / 2, groundY + 60, leftPlatWidth, 120, 0x241a13);
    this.physics.add.existing(this.leftPlat, true);

    // Left Platform Surface Detailing (Paving slabs & moss)
    const leftDetail = this.add.graphics().setDepth(3);
    leftDetail.fillStyle(0x3e2c1e, 1);
    leftDetail.fillRect(0, groundY, leftPlatWidth, 18);
    leftDetail.lineStyle(1.5, 0x1f150e, 0.9);
    for (let px = 0; px < leftPlatWidth; px += 44) {
      leftDetail.strokeRect(px, groundY, 42, 18);
      if (px % 88 === 0) leftDetail.lineBetween(px + 10, groundY + 2, px + 20, groundY + 16);
    }
    // Rusted rebar / spikes jutting into the pit edge
    leftDetail.lineStyle(2.5, 0x78350f, 0.9);
    leftDetail.lineBetween(leftPlatWidth, groundY + 12, leftPlatWidth + 14, groundY + 18);
    leftDetail.lineBetween(leftPlatWidth, groundY + 28, leftPlatWidth + 10, groundY + 36);

    // Right Platform (Rocket Platform Trap Physics Body)
    this.rightPlat = this.add.rectangle(rightPlatX + rightPlatWidth / 2, groundY + 60, rightPlatWidth, 120, 0x241a13);
    this.physics.add.existing(this.rightPlat, false);
    this.rightPlat.body.setAllowGravity(false);
    this.rightPlat.body.setImmovable(true);

    // Right Platform Detailing
    const rightDetail = this.add.graphics().setDepth(3);
    rightDetail.fillStyle(0x3e2c1e, 1);
    rightDetail.fillRect(rightPlatX, groundY, rightPlatWidth, 18);
    rightDetail.lineStyle(1.5, 0x1f150e, 0.9);
    for (let px = rightPlatX; px < width; px += 44) {
      rightDetail.strokeRect(px, groundY, 42, 18);
    }

    // Right side cave entrance (Goal reached via bridge)
    this.createRightCaveEntrance(rightPlatX + 180, groundY - 60);

    // Shiny Giant Gold Coin Bait
    this.coin = this.add.image(rightPlatX + 70, groundY - 30, 'coin-bait');
    this.tweens.add({
      targets: this.coin,
      y: groundY - 42,
      duration: 600,
      yoyo: true,
      repeat: -1
    });

    // Checkpoint Flag
    this.flag = this.add.text(rightPlatX + 115, groundY - 50, '🚩 CHECKPOINT', {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '12px',
      fontStyle: '900',
      color: '#22c55e'
    });

    // 4. Invisible Collider Block (Die Again Trap above pit)
    const blockX = leftPlatWidth + pitWidth * 0.45;
    const blockY = groundY - 140;
    this.invisibleBlock = this.add.rectangle(blockX, blockY, 56, 56, 0x78350f).setAlpha(0);
    this.physics.add.existing(this.invisibleBlock, true);

    // 5. Drawbridge Assembly (Machinarium Mechanical Contraption)
    this.createDrawbridgeAssembly(leftPlatWidth, groundY, pitWidth);

    // 6. Wall Chalk Diagram (Machinarium Clue)
    this.createWallChalkDiagram(leftPlatWidth * 0.45, groundY - 110);

    // 7. Phoe Htaung Player Character
    this.player = this.physics.add.sprite(90, groundY - 60, 'ph-idle');
    this.player.setCollideWorldBounds(true);
    this.player.setGravityY(1100);
    this.player.setSize(44, 76);

    // Collisions
    this.physics.add.collider(this.player, this.leftPlat);
    this.rightPlatCollider = this.physics.add.collider(this.player, this.rightPlat, () => this.triggerRocketTrap());
    this.blockCollider = this.physics.add.collider(this.player, this.invisibleBlock, () => this.hitInvisibleBlock());

    // Killzone at bottom of pit
    this.pitKillzone = this.add.rectangle(leftPlatWidth + pitWidth / 2, height + 50, pitWidth, 80, 0x000000);
    this.physics.add.existing(this.pitKillzone, true);
    this.physics.add.overlap(this.player, this.pitKillzone, () => this.fallIntoPit());

    // 8. Tool Pickups (Machinarium Tool Picking)
    this.createToolPickups(groundY);

    // 9. Left Wall Secret Hotspot
    this.leftWall = this.add.rectangle(12, groundY - 80, 24, 160, 0x78350f, 0.4).setInteractive({ useHandCursor: true });
    this.secretTunnelDoor = this.add.rectangle(12, groundY - 40, 24, 80, 0x000000).setVisible(false);

    this.leftWall.on('pointerdown', () => {
      this.pushLeftWall();
    });

    this.groundY = groundY;

    // 10. Point-and-Click Movement Handler
    this.input.on('pointerdown', (pointer) => {
      // If clicking near floor on left platform, set targetX
      if (pointer.y > groundY - 120 && pointer.y < groundY + 80 && pointer.x < leftPlatWidth + 10) {
        this.targetX = pointer.x;
        MicroInteractions.spawnClickMarker(this, pointer.x, groundY - 20);
      }
    });

    // 11. Input Controls (Keyboard)
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('A,D,W,SPACE');

    // 12. Floating Atmospheric Dust Motes & Cavern Water Drips
    AmbientAtmosphere.createDustMotes(this, 26);
    AmbientAtmosphere.startCavernDrips(this, groundY);

    // 13. High-End Perplexity HUD & Inventory Bar & Thought Bubble
    this.hud = new GameHUD(this);
    this.inventoryBar = new InventoryBar(this);
    this.thought = new ThoughtBubble(this);

    // 13. Subtitle Box
    this.subtitle = new SubtitleBox(this);

    // Entry Dialogue
    this.time.delayedCall(500, () => {
      this.subtitle.say('ဟောဒီမှာ ကြည့်စမ်း... ရွှေမြို့တော် အဝင်တောင်ကြားလမ်းတဲ့။ ရှေ့မှာ တွင်းကြီးဟနေတယ်! စက်သီးကြိုးတံတား စက်ကြီးက ပျက်နေသလိုပဲ... အနားမှာ ပစ္စည်းလေးတွေ ကောက်စမ်း မောင်ဖိုးထောင်!');
    });
  }

  createCeilingSpikes(width) {
    this.ceiling = this.add.graphics();
    this.ceiling.fillStyle(0x334155, 1);
    this.ceiling.fillRect(0, 0, width, 30);

    this.ceiling.fillStyle(0x94a3b8, 1);
    const spikeWidth = 24;
    const spikeCount = Math.ceil(width / spikeWidth);
    for (let i = 0; i < spikeCount; i++) {
      this.ceiling.beginPath();
      this.ceiling.moveTo(i * spikeWidth, 30);
      this.ceiling.lineTo((i + 0.5) * spikeWidth, 54);
      this.ceiling.lineTo((i + 1) * spikeWidth, 30);
      this.ceiling.closePath();
      this.ceiling.fill();
    }
  }

  createDrawbridgeAssembly(leftPlatWidth, groundY, pitWidth) {
    // Ancient Drawbridge Cable Winch at the edge
    this.winchContainer = this.add.container(leftPlatWidth - 45, groundY - 45).setDepth(15);
    const winchSprite = this.add.image(0, 0, 'winch-machine');

    // Slot for Cog
    this.winchCogSlot = this.add.image(-5, 0, 'item-cog')
      .setScale(0.8)
      .setVisible(this.hasCog);

    // Slot for Lever Pole
    this.winchLeverSlot = this.add.image(12, -18, 'item-bamboo-pole')
      .setScale(0.85)
      .setAngle(-30)
      .setVisible(this.hasLever);

    this.winchHitZone = this.add.rectangle(0, 0, 70, 80, 0x00ff00, 0.001)
      .setInteractive({ useHandCursor: true });

    this.winchHitZone.on('pointerdown', () => {
      this.interactWithWinch();
    });

    this.winchContainer.add([winchSprite, this.winchCogSlot, this.winchLeverSlot, this.winchHitZone]);

    // Upright Retracted Drawbridge Slab
    this.drawbridge = this.add.rectangle(leftPlatWidth + 10, groundY - 60, 16, 120, 0x78350f).setOrigin(0, 1).setDepth(12);
    this.physics.add.existing(this.drawbridge, true);
  }

  interactWithWinch() {
    if (this.bridgeLowered || this.isDead) return;

    const selected = this.inventoryBar.getSelected();

    if (selected === 'rusty_cog') {
      gameState.removeItem('rusty_cog');
      this.inventoryBar.clearSelected();
      this.inventoryBar.refresh();
      this.hasCog = true;
      this.winchCogSlot.setVisible(true);
      soundEngine.playGearClick();

      this.subtitle.say('သံချေးတက် ဂီယာခွေကို စက်သီးခေါင်းထဲ ထည့်တပ်လိုက်ပြီ! လီဗာလှည့်စရာ မောင်းတံတစ်ခုခု လိုနေသေးတယ်။');
      this.checkWinchReady();
      return;
    }

    if (selected === 'bamboo_pole') {
      gameState.removeItem('bamboo_pole');
      this.inventoryBar.clearSelected();
      this.inventoryBar.refresh();
      this.hasLever = true;
      this.winchLeverSlot.setVisible(true);
      soundEngine.playClang();

      this.subtitle.say('ဝါးလုံးတုတ်ကို လီဗာလက်ကိုင်အဖြစ် တပ်ဆင်လိုက်ပြီ!');
      this.checkWinchReady();
      return;
    }

    // Inspect without parts: Show Machinarium Thought Bubble & Denial reaction!
    if (!this.hasCog || !this.hasLever) {
      const needed = !this.hasCog ? 'item-cog' : 'item-bamboo-pole';
      MicroInteractions.triggerDenial(
        this,
        this.winchContainer,
        this.player,
        'တံတားချမယ့် စက်သီးယန္တရားကြီးပဲ... ဂီယာခွေရယ်၊ လှည့်မယ့် မောင်းတံရယ် မပါရင် လှည့်လို့မရဘူး!',
        needed,
        this.thought,
        this.subtitle
      );
    } else {
      this.turnWinchAndLowerBridge();
    }
  }

  checkWinchReady() {
    if (this.hasCog && this.hasLever) {
      this.time.delayedCall(300, () => {
        this.turnWinchAndLowerBridge();
      });
    }
  }

  turnWinchAndLowerBridge() {
    if (this.bridgeLowered) return;
    this.bridgeLowered = true;

    soundEngine.playGearClick();
    soundEngine.playStoneGrind();

    // Rotate Winch Handle & Cog
    this.tweens.add({
      targets: [this.winchCogSlot, this.winchLeverSlot],
      angle: '+=360',
      duration: 1000,
      ease: 'Cubic.InOut'
    });

    // Lower the Drawbridge across the pit
    const pitWidth = this.scale.width * 0.28;
    this.tweens.add({
      targets: this.drawbridge,
      angle: 90,
      scaleX: pitWidth / 120 + 0.1,
      duration: 1200,
      ease: 'Bounce.Out',
      onComplete: () => {
        soundEngine.playClang();
        // Update physics body of drawbridge to be flat walkable surface
        this.drawbridge.setSize(pitWidth + 10, 16);
        this.drawbridge.body.updateFromGameObject();

        // Safe collider across pit!
        this.physics.add.collider(this.player, this.drawbridge);

        this.subtitle.say('ဟောဒီမှာ ကြည့်စမ်း! ဝါးလုံးနဲ့ ဂီယာခွေ တပ်ပြီး လှည့်လိုက်တော့ တံတားကြီး ကျလာပြီဟေ့! အခု လျှောက်ကူးလို့ ရပြီဗျာ!');
      }
    });
  }

  createWallChalkDiagram(x, y) {
    this.chalkContainer = this.add.container(x, y).setDepth(5);
    const diagram = this.add.image(0, 0, 'chalk-diagram').setAlpha(0.7);

    const hit = this.add.rectangle(0, 0, 140, 90, 0x000000, 0.001)
      .setInteractive({ useHandCursor: true });

    hit.on('pointerdown', () => {
      soundEngine.playPaper();
      this.thought.show(this.player.x, this.player.y, 'item-bamboo-pole', 'တံတားယန္တရား ပုံကြမ်း');
      this.subtitle.say('ကျောက်နံရံပေါ်မှာ ထုံးဖြူနဲ့ ဆွဲထားတဲ့ ပုံကြမ်းပဲ... စက်သီးကို ဂီယာတပ်ပြီး လှည့်ရမယ်တဲ့။ ပြီးတော့ ဘယ်ဘက်နံရံဆီ မျှားထိုးပြထားသေးတယ်!');
    });

    this.chalkContainer.add([diagram, hit]);
  }

  createToolPickups(groundY) {
    // 1. Bamboo Pole Lever
    this.bambooItem = this.add.image(this.scale.width * 0.18, groundY - 20, 'item-bamboo-pole')
      .setScale(1);
    MicroInteractions.makeInteractiveHover(this.bambooItem, 1.15);

    this.bambooItem.on('pointerdown', () => {
      MicroInteractions.pickupItemToBag(this, this.bambooItem, this.player, () => {
        gameState.addItem('bamboo_pole');
        this.inventoryBar.refresh();
        this.subtitle.say('ခိုင်မာတဲ့ ဝါးလုံးတုတ်တစ်ချောင်း ကောက်ရလိုက်ပြီ။ လီဗာမောင်းတံအဖြစ် သုံးလို့ရနိုင်တယ်!');
      });
    });

    // 2. Rusty Cog
    this.cogItem = this.add.image(this.scale.width * 0.28, groundY - 18, 'item-cog')
      .setScale(1);
    MicroInteractions.makeInteractiveHover(this.cogItem, 1.15);

    this.cogItem.on('pointerdown', () => {
      MicroInteractions.pickupItemToBag(this, this.cogItem, this.player, () => {
        gameState.addItem('rusty_cog');
        this.inventoryBar.refresh();
        this.subtitle.say('သံချေးတက်နေတဲ့ ကြေးဝါဂီယာခွေလေး ကောက်ရလိုက်ပြီ။ စက်ယန္တရားတစ်ခုခုမှာ တပ်ဆင်ရမလား?');
      });
    });
  }

  createRightCaveEntrance(x, y) {
    // Ancient Carved Stone Portal
    const portal = this.add.graphics().setDepth(4);
    // Dark void inside cave
    portal.fillStyle(0x0a0705, 1);
    portal.fillRect(x - 35, y - 60, 70, 120);

    // Warm torchlight spilling out of cave
    portal.fillStyle(0xf59e0b, 0.25);
    portal.fillCircle(x, y + 10, 36);

    // Stone lintel & jambs with ancient carved reliefs
    portal.fillStyle(0x451a03, 1);
    portal.fillRect(x - 45, y - 72, 90, 16); // lintel
    portal.fillRect(x - 45, y - 60, 14, 120); // left jamb
    portal.fillRect(x + 31, y - 60, 14, 120); // right jamb

    portal.lineStyle(2, 0x78350f, 1);
    portal.strokeRect(x - 45, y - 72, 90, 16);
    portal.strokeRect(x - 45, y - 60, 14, 120);
    portal.strokeRect(x + 31, y - 60, 14, 120);

    // Carved relief glyphs on lintel
    portal.fillStyle(0xd97706, 0.8);
    for (let gx = x - 35; gx <= x + 35; gx += 16) {
      portal.fillCircle(gx, y - 64, 3);
    }

    const doorHit = this.add.rectangle(x, y, 90, 130, 0x00ff00, 0.001)
      .setDepth(6)
      .setInteractive({ useHandCursor: true });

    doorHit.on('pointerdown', () => {
      if (this.player.x > this.scale.width * 0.65) {
        this.advanceToChapter2();
      } else {
        this.subtitle.say('ဂူဝက ဟိုးဘက်ခြမ်းမှာ... တံတားခင်းပြီး ကူးသွားရမယ်!');
      }
    });
  }

  update(time, delta) {
    if (this.isDead) return;

    const speed = 220;
    let vx = 0;

    // Keyboard movement
    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      vx -= speed;
      this.player.setScale(-1, 1);
      this.targetX = null;
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      vx += speed;
      this.player.setScale(1, 1);
      this.targetX = null;
    } else if (this.targetX !== null) {
      // Point-and-Click movement towards targetX
      const dist = this.targetX - this.player.x;
      if (Math.abs(dist) > 8) {
        vx = Math.sign(dist) * (speed * 0.85);
        this.player.setScale(Math.sign(dist), 1);
      } else {
        this.targetX = null;
      }
    }

    this.player.setVelocityX(vx);

    // Flip-flop footstep sound, dust puffs & Machinarium walk animation
    if (Math.abs(vx) > 10 && this.player.body.touching.down) {
      this.lastMoveTime = time;
      this.player.setAngle(2.5 * Math.sign(vx));

      if (!this.stepTimer || time > this.stepTimer) {
        soundEngine.playFootstep();
        this.walkFrame = this.walkFrame === 'ph-walk-1' ? 'ph-walk-2' : 'ph-walk-1';
        this.player.setTexture(this.walkFrame);
        MicroInteractions.spawnFootstepDust(this, this.player.x, this.player.y, Math.sign(vx));
        this.stepTimer = time + 260;
      }
    } else if (this.player.body.touching.down && this.player.texture.key !== 'ph-flat') {
      this.player.setAngle(0);
      if (this.player.texture.key !== 'ph-idle') {
        this.player.setTexture('ph-idle');
      }

      // Machinarium Idle Micro-Behaviors (Betel spitting, bag adjust, cheek twitch)
      if (time - this.lastMoveTime > 4500 && time > this.nextIdleTime) {
        MicroInteractions.triggerIdleAction(this, this.player, this.groundY);
        this.nextIdleTime = time + Phaser.Math.Between(4500, 7500);
      }
    }

    // Jump
    const isJumping = (this.cursors.up.isDown || this.cursors.space.isDown || this.wasd.W.isDown || this.wasd.SPACE.isDown);
    if (isJumping && this.player.body.touching.down) {
      this.player.setVelocityY(-560);
      soundEngine.playJump();
    }

    // Left Wall Push Detection (x <= 35)
    if (this.player.x <= 35 && (this.cursors.left.isDown || this.wasd.A.isDown)) {
      this.pushTimer += delta;
      if (this.pushTimer >= 800 && !this.tunnelOpened) {
        this.openSecretTunnel();
      }
    } else {
      this.pushTimer = 0;
    }

    // Crossing into right cave door
    if (this.player.x > this.scale.width * 0.78 && !this.tunnelOpened) {
      this.advanceToChapter2();
    }
  }

  hitInvisibleBlock() {
    if (this.invisibleBlock.alpha === 0) {
      this.invisibleBlock.setAlpha(1);
      soundEngine.playClang();

      // Phoe Htaung flips upside down and falls
      this.player.setAngle(180);
      this.player.setVelocityX(40);
      this.player.setVelocityY(200);

      this.cameras.main.shake(200, 0.02);
    }
  }

  fallIntoPit() {
    if (this.isDead) return;
    this.isDead = true;
    soundEngine.playDeath();
    gameState.addDeath();
    this.hud.updateDeathCount();

    this.subtitle.say('ဟားဟားဟား! ကြည့်စမ်း... စက်သီးတံတားကို မပြင်ဘဲ အပေါ်က ခုန်ကူးတယ်! အပေါ်မှာ မမြင်ရတဲ့ ကျောက်တုံးရှိမှန်း မသိဘူးလားကွဲ့? ဦးနှောက်မပါတာ ကောင်းကင်ကပါ လာဆော်ထည့်တာ တွေ့လား။ ဇောက်ထိုး သေဆုံးခြင်းပေါ့ဗျာ!', () => {
      this.respawn();
    });
  }

  triggerRocketTrap() {
    if (this.isDead) return;
    this.isDead = true;

    // Rocket platform blasts upwards
    this.rightPlat.body.setVelocityY(-1400);
    this.player.setVelocityY(-1400);

    this.time.delayedCall(300, () => {
      soundEngine.playDeath();
      this.player.setTexture('ph-flat');
      this.cameras.main.shake(300, 0.03);
      gameState.addDeath();
      this.hud.updateDeathCount();

      this.subtitle.say('အမလေး... မြေကြီးပေါ် ခြေချတာနဲ့ ကောင်းကင်ဘုံ တန်းပို့ခံရတယ်! ရှေးခေတ်ပညာရှင်တွေက တွင်းထဲ ကျမသေတဲ့ကောင်တွေကို မျက်နှာကျက်နဲ့ ကပ်သတ်ပစ်တာကွဲ့။ မင်းမျက်နှာ အပေါ်က ဆူးတွေနဲ့ ပြားကပ်သွားတာ ငါးပိကောင်လေး ကျနေတာပဲ!', () => {
        this.respawn();
      });
    });
  }

  pushLeftWall() {
    if (!this.tunnelOpened) {
      this.openSecretTunnel();
    }
  }

  openSecretTunnel() {
    this.tunnelOpened = true;
    gameState.setFlag('ch1_tunnel_open', true);
    soundEngine.playPickup();

    this.leftWall.destroy();
    this.secretTunnelDoor.setVisible(true);

    this.subtitle.say('အမယ်လေးတော်... အရှေ့မသွားဘဲ နောက်ပြန်ဆုတ်ပြီး နံရံကို ဇွတ်သွားတိုက်တယ်! ဒါပေမဲ့ ကံကောင်းသွားတယ်ဗျို့၊ မြေအောက်လမ်း ပွင့်သွားပြန်ပြီ။ ကဲ သွား... အောက်လမ်းကပဲ လျှောက်တော့၊ မင်းလိုကောင်မျိုးက အောက်လမ်းနဲ့ပဲ တန်တယ်!', () => {
      this.advanceToChapter2();
    });
  }

  advanceToChapter2() {
    this.cameras.main.fade(400, 12, 10, 8);
    this.time.delayedCall(400, () => {
      this.scene.start('Chapter2Scene');
    });
  }

  respawn() {
    this.cameras.main.fade(300, 12, 10, 8);
    this.time.delayedCall(300, () => {
      this.scene.restart();
    });
  }
}
