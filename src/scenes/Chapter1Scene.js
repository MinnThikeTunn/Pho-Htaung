import Phaser from 'phaser';
import SubtitleBox from '../ui/BridgeSubtitle.js';
import InventoryBar from '../ui/InventoryBar.js';
import GameHUD from '../ui/BridgeHUD.js';
import { gameState, ITEM_TEXTURE_KEYS } from '../utils/AdventureState.js';
import { soundEngine } from '../utils/SoundEngine.js';
import { audioDirector } from '../audio/AudioDirector.js';
import { MicroInteractions } from '../utils/MicroInteractions.js';
import { AmbientAtmosphere } from '../utils/AmbientAtmosphere.js';
import { ParallaxBackground } from '../utils/ParallaxBackground.js';

export default class Chapter1Scene extends Phaser.Scene {
  constructor() {
    super('Chapter1Scene');
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    this.cameras.main.fadeIn(400, 12, 10, 8);

    this.isDead = false;
    this.pitTriggered = false;
    this.isRespawning = false;
    this.pushTimer = 0;
    this.tunnelOpened = false;
    this.hasCog = false;
    this.hasLever = false;
    this.bridgeLowered = false;
    this.targetX = null;
    this.lastMoveTime = 0;
    this.nextIdleTime = 4500;

    // Start Machinarium Ambient Sneaky BGM & Floex Drone Stems (Soft background bed)
    gameState.setCurrentScene('Chapter1Scene');
    soundEngine.init?.();
    if (!soundEngine.muted) {
      soundEngine.startBGM?.();
      audioDirector.startStems(0.18, 0.14, 0.16);
      audioDirector.handleRespawn();
    }

    this.events.on('shutdown', () => {
      audioDirector.stopWalking();
      if (this.parallax) {
        this.parallax.destroy();
        this.parallax = null;
      }
    });

    // 1. High-End 5-Layer Machinarium Parallax Background (Adolf Lachman Style)
    const groundY = this.createParallaxBackground(width, height);
    const leftPlatWidth = width * 0.60;
    const pitWidth = width * 0.15;
    const rightPlatX = width * 0.75;
    const rightPlatWidth = width - rightPlatX;

    this.groundY = groundY;
    this.leftPlatWidth = leftPlatWidth;
    this.pitWidth = pitWidth;
    this.rightPlatX = rightPlatX;
    this.rightPlatWidth = rightPlatWidth;

    // 2. Ceiling with Spikes
    this.createCeilingSpikes(width);

    // 3. Platforms (Invisible physics colliders flush with illustrated stone ledges)
    this.leftPlat = this.add.rectangle(leftPlatWidth / 2, groundY + 60, leftPlatWidth, 120, 0x000000).setAlpha(0);
    this.physics.add.existing(this.leftPlat, true);

    this.rightPlat = this.add.rectangle(rightPlatX + rightPlatWidth / 2, groundY + 60, rightPlatWidth, 120, 0x000000).setAlpha(0);
    this.physics.add.existing(this.rightPlat, false);
    this.rightPlat.body.setAllowGravity(false);
    this.rightPlat.body.setImmovable(true);

    // Right side cave entrance (Goal reached via bridge)
    this.createRightCaveEntrance(rightPlatX + 180, groundY - 50);

    // Shiny Giant Gold Coin Bait
    this.coin = this.add.image(rightPlatX + 70, groundY - 20, 'coin-bait').setScale(0.55);
    this.tweens.add({
      targets: this.coin,
      y: groundY - 32,
      duration: 600,
      yoyo: true,
      repeat: -1
    });

    // Checkpoint Flag
    this.flag = this.add.text(rightPlatX + 115, groundY - 44, '🚩 CHECKPOINT', {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '12px',
      fontStyle: '900',
      color: '#22c55e'
    });

    // 4. Invisible Die Again Trap Block (hovering above pit at 42% pit gap)
    const blockX = leftPlatWidth + pitWidth * 0.42;
    const blockY = groundY - 135;
    this.invisibleBlock = this.add.image(blockX, blockY, 'ch1-trap-block')
      .setScale(0.95)
      .setDepth(40)
      .setAlpha(0);
    this.physics.add.existing(this.invisibleBlock, true);

    // 5. Drawbridge Assembly (Machinarium Mechanical Contraption)
    this.createDrawbridgeAssembly(leftPlatWidth, groundY, pitWidth);

    // 6. Wall Chalk Diagram (Machinarium Clue)
    this.createWallChalkDiagram(640, 190);

    // 7. Phoe Htaung Player Character (Top Z-Index Depth: 150)
    this.playerBaseScale = 1.42;
    this.player = this.physics.add.sprite(90, groundY - 60, 'ph-idle');
    this.player.setScale(this.playerBaseScale);
    this.player.setDepth(150); // In front of all background, midground, and foreground layers
    this.player.setCollideWorldBounds(false); // Clean pit fall without bottom screen edge sticking
    this.player.setGravityY(1100);
    this.player.setSize(38, 72);
    this.player.setOffset(11, 12);

    // Dynamic Ground Contact Shadow (Soft Ambient Occlusion ellipse under feet)
    this.playerShadow = this.add.ellipse(this.player.x, groundY + 2, 48, 12, 0x070503, 0.70)
      .setDepth(149);

    // Collisions
    this.physics.add.collider(this.player, this.leftPlat);
    this.rightPlatCollider = this.physics.add.collider(this.player, this.rightPlat, () => this.triggerRocketTrap());
    this.blockCollider = this.physics.add.collider(this.player, this.invisibleBlock, () => this.hitInvisibleBlock());

    // 8. Tool Pickups (Machinarium Tool Picking)
    this.createToolPickups(groundY);

    // 9. Left Wall Secret Hotspot
    this.leftWall = this.add.rectangle(12, groundY - 80, 24, 160, 0x78350f, 0.4).setInteractive({ useHandCursor: true });
    this.secretTunnelDoor = this.add.rectangle(12, groundY - 40, 24, 80, 0x000000).setVisible(false);

    this.leftWall.on('pointerdown', () => {
      this.interactWithProximity(35, () => this.pushLeftWall());
    });

    this.groundY = groundY;

    // 10. Ambient Clickable Toys (Machinarium Juice)
    this.createAmbientToys(groundY, leftPlatWidth);

    // 11. Point-and-Click Movement Handler
    this.input.on('pointerdown', (pointer) => {
      // If clicking near floor on left platform, set targetX
      if (pointer.y > groundY - 120 && pointer.y < groundY + 80 && pointer.x < leftPlatWidth + 10) {
        this.targetX = pointer.x;
        this.pendingAction = null;
        MicroInteractions.spawnClickMarker(this, pointer.x, groundY - 20);
      }
    });

    // 12. Input Controls (Keyboard)
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('A,D,W,S,SPACE');

    // 13. Floating Atmospheric Dust Motes & Cavern Water Drips & Volumetric Rays
    this.createAtmosphere(width, height, groundY);

    // 14. High-End Perplexity HUD & Auto-Hiding Inventory Bar
    this.hud = new GameHUD(this);
    this.inventoryBar = new InventoryBar(this);

    // Natural Signifiers
    this.createNaturalSignifiers();

    // 15. Subtitle Box
    this.subtitle = new SubtitleBox(this);

    // Entry Dialogue
    this.playEntryDialogue();
  }


  createParallaxBackground(width, height) {
    this.parallax = new ParallaxBackground(this, {
      enableMouseParallax: true,
      enableBreathing: true,
      depthBase: 0,
      darkness: 0.18,
      layerKeys: [
        'ch1-layer-0-sky',
        'ch1-layer-1-machinery',
        'ch1-layer-2-cliffs',
        'ch1-layer-3-ground',
        'ch1-layer-4-foreground'
      ],
      targetSurfaceY: height * 0.80,
      surfaceNativeY: 595 // Calibrated flat flagstone paving baseline in 1376x768 coords
    });
    return this.parallax.getWalkableGroundY();
  }

  createAtmosphere(width, height, groundY) {
    AmbientAtmosphere.createDustMotes(this, 26);
    AmbientAtmosphere.startCavernDrips(this, groundY);
    AmbientAtmosphere.createVolumetricRays(this, width * 0.26, 0);
    AmbientAtmosphere.createWeatheredOverlay(this);
    AmbientAtmosphere.createForegroundSilhouettes(this, 'canyon');
  }

  createNaturalSignifiers() {
    AmbientAtmosphere.startNaturalSignifiers(this, [this.winchContainer, this.bambooItem, this.cogItem]);
  }

  playEntryDialogue() {
    this.time.delayedCall(500, () => {
      this.subtitle.say('ဟောဒီမှာ ကြည့်စမ်း... ရွှေမြို့တော် အဝင်တောင်ကြားလမ်းတဲ့။ ရှေ့မှာ တွင်းကြီးဟနေတယ်! စက်သီးကြိုးတံတား စက်ကြီးက ပျက်နေသလိုပဲ... အနားမှာ ပစ္စည်းလေးတွေ ကောက်စမ်း မောင်ဖိုးထောင်!');
    });
  }

  createAmbientToys(groundY, leftPlatWidth) {
    // 1. Bronze Temple Bell hanging from steel cable pylon
    const bellContainer = this.add.container(leftPlatWidth * 0.72, groundY - 130).setSize(40, 50).setDepth(35);
    const bellChain = this.add.graphics();
    bellChain.lineStyle(1.5, 0x64748b, 0.9);
    bellChain.lineBetween(0, -30, 0, 0);
    const bellImg = this.add.image(0, 8, 'item-cog').setScale(0.55).setTint(0xfbbf24);
    bellContainer.add([bellChain, bellImg]);
    MicroInteractions.attachAmbientToy(this, bellContainer, 'bell');

    // 2. Ancient Clay Pot resting near left cavern wall
    const pot = this.add.image(55, groundY - 16, 'item-stone-3').setScale(0.85).setTint(0xb45309).setDepth(30);
    MicroInteractions.attachAmbientToy(this, pot, 'pot');

    // 3. Sleeping Village Stray Dog resting on lower ledge
    const dog = this.add.container(leftPlatWidth * 0.28, groundY - 8).setSize(36, 20).setDepth(30);
    const dogG = this.add.graphics();
    dogG.fillStyle(0x78350f, 0.9);
    dogG.fillEllipse(0, 0, 24, 13);
    dogG.fillCircle(12, -4, 7);
    dogG.fillStyle(0x451a03, 1);
    dogG.fillCircle(14, -7, 3); // floppy ear
    dog.add(dogG);
    MicroInteractions.attachAmbientToy(this, dog, 'dog');
  }

  interactWithProximity(targetX, onReachCallback) {
    if (this.isDead) return;
    const distance = Math.abs(this.player.x - targetX);
    const scale = this.playerBaseScale || 1.25;
    if (distance <= 85) {
      this.player.setScale(targetX > this.player.x ? scale : -scale, scale);
      onReachCallback();
    } else {
      const walkToX = targetX > this.player.x ? targetX - 55 : targetX + 55;
      this.targetX = walkToX;
      this.pendingAction = () => {
        this.player.setScale(targetX > this.player.x ? scale : -scale, scale);
        onReachCallback();
      };
    }
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
    // Ancient Drawbridge Cable Winch at the edge (Depth: 35)
    this.winchContainer = this.add.container(leftPlatWidth - 45, groundY - 32).setDepth(35);
    const winchSprite = this.add.image(0, 0, 'prop-winch-machine').setScale(0.20);

    // Slot for Cog
    this.winchCogSlot = this.add.image(2, -6, 'item-cog')
      .setScale(0.55)
      .setVisible(this.hasCog);

    // Slot for Lever Pole
    this.winchLeverSlot = this.add.image(14, -18, 'item-bamboo-pole')
      .setScale(0.65)
      .setAngle(-35)
      .setVisible(this.hasLever);

    this.winchHitZone = this.add.rectangle(0, 0, 70, 80, 0x00ff00, 0.001)
      .setInteractive({ useHandCursor: true });

    this.winchHitZone.on('pointerdown', () => {
      this.interactWithProximity(this.winchContainer.x, () => {
        this.interactWithWinch();
      });
    });

    this.winchContainer.add([winchSprite, this.winchCogSlot, this.winchLeverSlot, this.winchHitZone]);

    // Solid Heavy Machinarium Drawbridge (Retracted Upright, Depth: 25)
    this.bridgePivotX = leftPlatWidth + 2;
    this.bridgePivotY = groundY;
    this.bridgeLength = pitWidth + 26;
    this.bridgeTargetScaleY = this.bridgeLength / 559;
    this.bridgeTargetScaleX = 0.22; // Authentic deep timber-and-iron beam thickness (~84px)

    this.drawbridge = this.add.image(this.bridgePivotX, this.bridgePivotY, 'prop-drawbridge')
      .setOrigin(0, 1)
      .setScale(this.bridgeTargetScaleX, this.bridgeTargetScaleY)
      .setAngle(0)
      .setDepth(25);

    // Heavy Wrought-Iron Hinge Pivot Bracket at Cliff Edge
    this.bridgeHinge = this.add.graphics().setDepth(26);
    this.bridgeHinge.fillStyle(0x271c14, 1);
    this.bridgeHinge.fillCircle(this.bridgePivotX, this.bridgePivotY - 4, 8);
    this.bridgeHinge.fillStyle(0x78350f, 1);
    this.bridgeHinge.fillCircle(this.bridgePivotX, this.bridgePivotY - 4, 5);
    this.bridgeHinge.fillStyle(0xd97706, 1);
    this.bridgeHinge.fillCircle(this.bridgePivotX, this.bridgePivotY - 4, 2);

    // Dynamic Suspension Cable connecting Winch Spool to Bridge Deck
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
      this.bridgeCable.lineStyle(3, 0x000000, 0.4);
      this.bridgeCable.lineBetween(spoolX, spoolY + 2, tipX, tipY + 2);

      // Dark iron braided core
      this.bridgeCable.lineStyle(2.5, 0x271c14, 0.95);
      this.bridgeCable.lineBetween(spoolX, spoolY, tipX, tipY);

      // Steel highlight wire
      this.bridgeCable.lineStyle(1.0, 0x94a3b8, 0.85);
      this.bridgeCable.lineBetween(spoolX, spoolY, tipX, tipY);

      // Outer eyelet bracket
      this.bridgeCable.fillStyle(0x78350f, 1);
      this.bridgeCable.fillCircle(tipX, tipY, 4.5);
      this.bridgeCable.fillStyle(0xd97706, 1);
      this.bridgeCable.fillCircle(tipX, tipY, 2.0);
    } catch (e) {
      // Graceful fallback
    }
  }

  setPlayerPose(textureKey) {
    if (!this.player || !this.player.active) return;
    if (this.player.texture.key !== textureKey) {
      this.player.setTexture(textureKey);
      if (this.player.body) {
        this.player.body.setSize(38, 72);
        this.player.body.setOffset(11, 12);
      }
    }
  }

  interactWithWinch() {
    if (this.bridgeLowered || this.isDead || this.isInteracting) return;

    const selected = this.inventoryBar.getSelected();

    if (selected === 'rusty_cog') {
      const targetPoint = { x: this.winchContainer.x - 5, y: this.winchContainer.y, scale: 0.8 };
      this.hideHeldItem();
      MicroInteractions.pullItemFromBag(this, this.player, 'item-cog', targetPoint, () => {
        gameState.removeItem('rusty_cog');
        this.inventoryBar.clearSelected();
        this.inventoryBar.refresh();
        this.hasCog = true;
        this.winchCogSlot.setVisible(true);
        soundEngine.playGearClick();

        this.subtitle.say('သံချေးတက် ဂီယာခွေကို စက်သီးခေါင်းထဲ ထည့်တပ်လိုက်ပြီ! လီဗာလှည့်စရာ မောင်းတံတစ်ခုခု လိုနေသေးတယ်။');
        this.checkWinchReady();
      });
      return;
    }

    if (selected === 'bamboo_pole') {
      const targetPoint = { x: this.winchContainer.x + 12, y: this.winchContainer.y - 12, scale: 1.0 };
      this.hideHeldItem();
      MicroInteractions.pullItemFromBag(this, this.player, 'item-bamboo-pole', targetPoint, () => {
        gameState.removeItem('bamboo_pole');
        this.inventoryBar.clearSelected();
        this.inventoryBar.refresh();
        this.hasLever = true;
        this.winchLeverSlot.setVisible(true);
        soundEngine.playClang();

        this.subtitle.say('ဝါးလုံးတုတ်ကို လီဗာလက်ကိုင်အဖြစ် တပ်ဆင်လိုက်ပြီ!');
        this.checkWinchReady();
      });
      return;
    }

    if (selected && selected !== 'rusty_cog' && selected !== 'bamboo_pole') {
      MicroInteractions.triggerSootPuff(this, this.player, () => {
        this.subtitle.say('ဟားဟားဟား! ဒီပစ္စည်းက စက်သီးတံတားနဲ့ ဘာမှမဆိုင်ဘူးဟ! မီးခိုးတွေ မင်းမျက်နှာထဲ မှုတ်ထုတ်လိုက်ပြီ!');
      });
      return;
    }

    // Inspect without parts: U Gyi coaching & Denial reaction!
    if (!this.hasCog || !this.hasLever) {
      const needed = !this.hasCog ? 'item-cog' : 'item-bamboo-pole';
      MicroInteractions.triggerDenial(
        this,
        this.winchContainer,
        this.player,
        'တံတားချမယ့် စက်သီးယန္တရားကြီးပဲ... ဂီယာခွေရယ်၊ လှည့်မယ့် မောင်းတံရယ် မပါရင် လှည့်လို့မရဘူး!',
        needed,
        null,
        this.subtitle
      );
    } else {
      this.turnWinchAndLowerBridge();
    }
  }

  showHeldItem(itemKey) {
    if (this.heldItemSprite) {
      this.heldItemSprite.destroy();
      this.heldItemSprite = null;
    }
    if (!itemKey || this.isDead) return;

    const tex = ITEM_TEXTURE_KEYS[itemKey] || 'item-betel-cutter';
    MicroInteractions.pullItemFromBag(this, this.player, tex, null, (pulledItem) => {
      this.heldItemSprite = pulledItem;
      if (this.heldItemSprite) {
        this.heldItemSprite.setDepth(190);
      }
    });
  }

  hideHeldItem() {
    if (this.heldItemSprite) {
      this.heldItemSprite.destroy();
      this.heldItemSprite = null;
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

    try { soundEngine.playGearClick(); } catch (e) {}
    try { soundEngine.playStoneGrind(); } catch (e) {}

    // 1. Rapid Winch Handle & Cog Rotation (2 full turns)
    this.tweens.add({
      targets: [this.winchCogSlot, this.winchLeverSlot],
      angle: '+=720',
      duration: 1300,
      ease: 'Cubic.InOut'
    });

    // 2. Multi-Stage Realistic Gravity Swing & Bounce ("Slide like character jump")
    // Phase 1: Unlatch & Creak Forward (0 -> 16 degrees, 280ms)
    this.tweens.add({
      targets: this.drawbridge,
      angle: 16,
      duration: 280,
      ease: 'Quad.In',
      onUpdate: () => {
        this.updateBridgeCable(this.drawbridge.angle);
      },
      onComplete: () => {
        try { soundEngine.playChainRattle(); } catch (e) {}

        // Phase 2: Gravitational Acceleration Plunge (16 -> 92 degrees, 620ms)
        this.tweens.add({
          targets: this.drawbridge,
          angle: 92,
          duration: 620,
          ease: 'Cubic.In',
          onUpdate: () => {
            this.updateBridgeCable(this.drawbridge.angle);
          },
          onComplete: () => {
            // SLAM! Heavy impact on the right stone cliff abutment!
            try { soundEngine.playClang(); } catch (e) {}
            this.cameras.main.shake(150, 0.003);

            // Plume of stone dust & wood chips at impact point
            const impactX = this.bridgePivotX + this.bridgeLength - 10;
            try {
              MicroInteractions.spawnFootstepDust(this, impactX, this.groundY, 1);
              MicroInteractions.spawnFootstepDust(this, impactX, this.groundY, -1);
            } catch (e) {}

            // Phase 3: Elastic Rebound & Settle (92 -> 88.5 -> 90.5 -> 90 degrees, 380ms)
            this.tweens.add({
              targets: this.drawbridge,
              angle: 90,
              duration: 380,
              ease: 'Bounce.Out',
              onUpdate: () => {
                this.updateBridgeCable(this.drawbridge.angle);
              },
              onComplete: () => {
                this.updateBridgeCable(90);

                // Create a rock-solid, properly aligned static physics platform body across the entire pit span
                if (this.bridgeWalkPlat) {
                  this.bridgeWalkPlat.destroy();
                }
                const pitWidth = this.pitWidth || this.scale.width * 0.15;
                const leftPlatWidth = this.leftPlatWidth || this.scale.width * 0.60;
                const groundY = this.groundY;

                this.bridgeWalkPlat = this.add.rectangle(leftPlatWidth + pitWidth / 2, groundY + 10, pitWidth + 30, 20, 0x000000).setVisible(false);
                this.physics.add.existing(this.bridgeWalkPlat, true);
                this.physics.add.collider(this.player, this.bridgeWalkPlat);

                this.subtitle.say('ဟောဒီမှာ ကြည့်စမ်း! ဝါးလုံးနဲ့ ဂီယာခွေ တပ်ပြီး လှည့်လိုက်တော့ တံတားကြီး ကျလာပြီဟေ့! အခု လျှောက်ကူးလို့ ရပြီဗျာ!');
              }
            });
          }
        });
      }
    });
  }

  createWallChalkDiagram() {}

  createToolPickups(groundY) {
    // 1. Bamboo Pole Lever (Depth: 30)
    this.bambooItem = this.add.image(this.scale.width * 0.18, groundY - 10, 'item-bamboo-pole')
      .setScale(0.58)
      .setAngle(12)
      .setDepth(30);
    MicroInteractions.makeInteractiveHover(this.bambooItem, 1.15);

    this.bambooItem.on('pointerdown', () => {
      this.interactWithProximity(this.bambooItem.x, () => {
        MicroInteractions.pickupItemToBag(this, this.bambooItem, this.player, () => {
          gameState.addItem('bamboo_pole');
          this.inventoryBar.refresh();
          this.subtitle.say('ခိုင်မာတဲ့ ဝါးလုံးတုတ်တစ်ချောင်း ကောက်ရလိုက်ပြီ။ လီဗာမောင်းတံအဖြစ် သုံးလို့ရနိုင်တယ်!');
        });
      });
    });

    // 2. Rusty Cog (Depth: 30)
    this.cogItem = this.add.image(this.scale.width * 0.28, groundY - 10, 'item-cog')
      .setScale(0.52)
      .setDepth(30);
    MicroInteractions.makeInteractiveHover(this.cogItem, 1.15);

    this.cogItem.on('pointerdown', () => {
      this.interactWithProximity(this.cogItem.x, () => {
        MicroInteractions.pickupItemToBag(this, this.cogItem, this.player, () => {
          gameState.addItem('rusty_cog');
          this.inventoryBar.refresh();
          this.subtitle.say('သံချေးတက်နေတဲ့ ကြေးဝါဂီယာခွေလေး ကောက်ရလိုက်ပြီ။ စက်ယန္တရားတစ်ခုခုမှာ တပ်ဆင်ရမလား?');
        });
      });
    });
  }

  createRightCaveEntrance(x, y) {
    // Authentic Hand-Drawn Adolf Lachman Cave Portal Archway (Depth: 25)
    this.caveDoor = this.add.image(x, this.groundY, 'prop-cave-door')
      .setOrigin(0.5, 1)
      .setScale(0.28)
      .setDepth(25);

    // Warm ambient torchlight flicker pulse from cave interior
    this.tweens.add({
      targets: this.caveDoor,
      alpha: 0.94,
      duration: 650,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const doorHit = this.add.rectangle(x, this.groundY - 80, 110, 160, 0x00ff00, 0.001)
      .setDepth(30)
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
    if (this.parallax) {
      this.parallax.update(time, delta);
    }

    // Dynamic Contact Shadow tracking under Phoe Htaung's feet
    if (this.playerShadow && this.player) {
      this.playerShadow.x = this.player.x;
      const distFromGround = Math.max(0, this.groundY - this.player.y);
      const isGrounded = Boolean(this.player.body?.touching?.down || this.player.body?.blocked?.down);
      this.playerShadow.setAlpha(isGrounded ? 0.70 : Math.max(0.1, 0.70 - distFromGround * 0.003));
      this.playerShadow.setScale(1 + distFromGround * 0.002);
    }

    // Pit Fall Detection: Trigger trap kill cleanly when falling into the abyss
    if (this.player && this.player.y > this.groundY + 80 && !this.pitTriggered) {
      this.pitTriggered = true;
      this.fallIntoPit();
      return;
    }

    if (this.isDead || this.isInteracting) {
      audioDirector.stopWalking();
      return;
    }

    const speed = 220;
    let vx = 0;
    const baseScale = this.playerBaseScale || 1.42;

    // Keyboard movement
    const leftDown = Boolean(this.cursors?.left?.isDown || (this.wasd?.A && this.wasd.A.isDown));
    const rightDown = Boolean(this.cursors?.right?.isDown || (this.wasd?.D && this.wasd.D.isDown));
    const downDown = Boolean(this.cursors?.down?.isDown || (this.wasd?.S && this.wasd.S.isDown));
    const jumpDown = Boolean(this.cursors?.up?.isDown || this.cursors?.space?.isDown || (this.wasd?.W && this.wasd.W.isDown) || (this.wasd?.SPACE && this.wasd.SPACE.isDown));

    if (leftDown) {
      vx -= speed;
      this.player.setScale(-baseScale, baseScale);
      this.targetX = null;
    } else if (rightDown) {
      vx += speed;
      this.player.setScale(baseScale, baseScale);
      this.targetX = null;
    } else if (this.targetX !== null) {
      // Point-and-Click movement towards targetX
      const dist = this.targetX - this.player.x;
      if (Math.abs(dist) > 8) {
        vx = Math.sign(dist) * (speed * 0.85);
        this.player.setScale(Math.sign(dist) * baseScale, baseScale);
      } else {
        this.targetX = null;
        if (this.pendingAction) {
          const act = this.pendingAction;
          this.pendingAction = null;
          act();
        }
      }
    }

    // Keep player inside left cavern wall
    if (this.player.x < 24) {
      this.player.x = 24;
      if (vx < 0) vx = 0;
    }

    const onGround = Boolean(this.player.body?.touching?.down || this.player.body?.blocked?.down);
    const canJump = onGround && !this.isDead && !this.isInteracting;

    // Prevent walking off the cliff edge into the pit when bridge is not lowered
    const leftPlatWidth = this.leftPlatWidth || this.scale.width * 0.60;
    if (!this.bridgeLowered && !jumpDown && onGround) {
      if (this.player.x > leftPlatWidth - 16 && vx > 0) {
        this.player.x = leftPlatWidth - 16;
        vx = 0;
        this.targetX = null;
      }
    }

    this.player.setVelocityX(vx);

    // Update held item position if Phoe Htaung is holding an item pulled from his bag
    if (this.heldItemSprite && this.heldItemSprite.active) {
      const dir = Math.sign(this.player.scaleX || 1);
      this.heldItemSprite.x = this.player.x + dir * 20 * (baseScale / 1.42);
      this.heldItemSprite.y = this.player.y - 12 * (baseScale / 1.42);
      this.heldItemSprite.setScale((dir > 0 ? 0.38 : -0.38), 0.38);
    }

    // Jump Execution (immediate vertical thrust & aerial pose)
    if (jumpDown && canJump) {
      if (this.player.isPerformingIdle) {
        MicroInteractions.cancelIdleAction(this, this.player);
      }
      this.player.setVelocityY(-580);
      this.setPlayerPose('ph-jump-up');
      soundEngine.playJump();
      MicroInteractions.spawnFootstepDust(this, this.player.x, this.groundY, 0);
    }

    // Crouch only when downDown is actively held on the ground while stationary
    const isCrouching = downDown && onGround && Math.abs(vx) <= 10 && !jumpDown;

    if (Math.abs(vx) > 10 && onGround) {
      this.lastMoveTime = time;
      if (this.player.isPerformingIdle) {
        MicroInteractions.cancelIdleAction(this, this.player);
      }
      this.player.setAngle(2.5 * Math.sign(vx));

      // Trigger & maintain looping flip-flop walking audio
      audioDirector.startWalking();

      if (!this.stepTimer || time > this.stepTimer) {
        const walkCycle = ['ph-walk-1', 'ph-walk-2', 'ph-walk-3', 'ph-walk-4'];
        this.walkIndex = ((this.walkIndex || 0) + 1) % walkCycle.length;
        this.setPlayerPose(walkCycle[this.walkIndex]);
        MicroInteractions.spawnFootstepDust(this, this.player.x, this.player.y, Math.sign(vx));
        this.stepTimer = time + 260;
      }
    } else if (!onGround && !this.player.isPerformingIdle && this.player.texture.key !== 'ph-flat') {
      // Shut down walking audio immediately when airborne/jumping
      audioDirector.stopWalking();

      // In-Air Aerial Dynamics: Jump-Up -> Apex Float -> Fall Panic
      if (this.player.body.velocity.y < -100) {
        this.setPlayerPose('ph-jump-up');
      } else if (Math.abs(this.player.body.velocity.y) <= 100) {
        this.setPlayerPose('ph-jump-apex');
      } else if (this.player.body.velocity.y > 100) {
        this.setPlayerPose('ph-jump-fall');
      }
    } else if (onGround && this.player.texture.key !== 'ph-flat') {
      this.player.setAngle(0);

      // Shut down walking audio immediately when stopped/standing still
      audioDirector.stopWalking();

      // Crouch / Sneak state
      if (isCrouching) {
        if (this.player.isPerformingIdle) {
          MicroInteractions.cancelIdleAction(this, this.player);
        }
        this.setPlayerPose('ph-crouch');
      } else {
        const isIdleSpecial = this.player.isPerformingIdle || ['ph-mad', 'ph-think', 'ph-laugh', 'ph-bag-rummage'].includes(this.player.texture.key);
        if (!isIdleSpecial && this.player.texture.key !== 'ph-idle' && !this.isLanding) {
          this.setPlayerPose('ph-idle');
        }

        // Continuous Organic Inhaling/Exhaling Breathing Animation
        if (!isIdleSpecial && this.player.texture.key === 'ph-idle') {
          MicroInteractions.applyIdleBreathing(this.player, time, baseScale);
        }

        // Machinarium Idle Micro-Behaviors (Laughing, Thinking, Mad, Betel spitting, fly swatting)
        if (time - this.lastMoveTime > 3500 && time > this.nextIdleTime) {
          MicroInteractions.triggerIdleAction(this, this.player, this.groundY);
          this.nextIdleTime = time + Phaser.Math.Between(4000, 6500);
        }
      }
    }

    // Left Wall Push Detection (x <= 35) for t >= 1.0s
    if (this.player.x <= 35 && leftDown) {
      this.pushTimer += delta;
      if (this.pushTimer >= 1000 && !this.tunnelOpened) {
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
      audioDirector.handleTrapInvisibleBlock();

      // Crumble stone dust particles around the revealed trap block
      MicroInteractions.spawnFootstepDust(this, this.invisibleBlock.x, this.invisibleBlock.y + 15, 1);
      MicroInteractions.spawnFootstepDust(this, this.invisibleBlock.x, this.invisibleBlock.y + 15, -1);

      // Phoe Htaung bonks head, gets stunned, flips into abyss
      this.isDead = true;
      this.hideHeldItem();
      this.isInteracting = false;
      this.setPlayerPose('ph-shock');
      this.player.setAngle(180);
      this.player.setVelocityX(-40);
      this.player.setVelocityY(260);

      this.cameras.main.shake(220, 0.025);

      const stars = this.add.text(this.player.x, this.player.y - 20, '💫', { fontSize: '20px' }).setDepth(160);
      this.tweens.add({
        targets: stars,
        y: stars.y - 30,
        alpha: 0,
        duration: 800,
        onComplete: () => stars.destroy()
      });
    }
  }

  fallIntoPit() {
    if (this.isRespawning) return;
    this.isRespawning = true;
    this.isDead = true;
    this.hideHeldItem();
    this.isInteracting = false;
    audioDirector.handleTrapInvisibleBlock();
    gameState.addDeath();
    this.hud.updateDeathCount();

    this.subtitle.say('ဟားဟားဟား! ကြည့်စမ်း... စက်သီးတံတားကို မပြင်ဘဲ အပေါ်က ခုန်ကူးတယ်! အပေါ်မှာ မမြင်ရတဲ့ ကျောက်တုံးရှိမှန်း မသိဘူးလားကွဲ့? ဦးနှောက်မပါတာ ကောင်းကင်ကပါ လာဆော်ထည့်တာ တွေ့လား။ ဇောက်ထိုး သေဆုံးခြင်းပေါ့ဗျာ!', () => {
      this.respawn();
    });
  }

  triggerRocketTrap() {
    if (this.isDead) return;
    this.isDead = true;
    this.hideHeldItem();
    this.isInteracting = false;

    // Timeline Event: Trap 2 - Instant mute & trigger SFX_ROCKET_SPLAT (0.95) simultaneously with velocity
    audioDirector.handleTrapRocketPlatform();

    // Rocket platform blasts upwards (vy = -1500)
    this.rightPlat.body.setVelocityY(-1500);
    this.player.setVelocityY(-1500);

    this.time.delayedCall(300, () => {
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

    this.leftWall.destroy();
    this.secretTunnelDoor.setVisible(true);

    // Timeline Event: Troll Solution - SFX_STONE_GRIND (0.80) layered with SFX_PUZZLE_CHIME (0.65)
    // Crossfade stems down to 0.00 across 2000ms
    audioDirector.handleTrollWallSolved();

    this.subtitle.say('အမယ်လေးတော်... အရှေ့မသွားဘဲ နောက်ပြန်ဆုတ်ပြီး နံရံကို ဇွတ်သွားတိုက်တယ်! ဒါပေမဲ့ ကံကောင်းသွားတယ်ဗျို့၊ မြေအောက်လမ်း ပွင့်သွားပြန်ပြီ။ ကဲ သွား... အောက်လမ်းကပဲ လျှောက်တော့၊ မင်းလိုကောင်မျိုးက အောက်လမ်းနဲ့ပဲ တန်တယ်!', () => {
      this.advanceToChapter2();
    });
  }

  advanceToChapter2() {
    audioDirector.transitionChapter1ToChapter2(4200);
    this.cameras.main.fade(500, 12, 10, 8);
    this.time.delayedCall(500, () => {
      this.scene.start('Chapter2Scene');
    });
  }

  respawn() {
    audioDirector.stopWalking();
    this.hideHeldItem();
    this.isInteracting = false;
    this.cameras.main.fade(300, 12, 10, 8);
    this.time.delayedCall(300, () => {
      // Timeline Event: Respawn Hook - Fade STEM_DRONE -> 0.60 and STEM_KALIMBA -> 0.50 over 800ms
      audioDirector.handleRespawn();
      this.scene.restart();
    });
  }
}
