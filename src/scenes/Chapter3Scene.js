import Phaser from 'phaser';
import SubtitleBox from '../ui/SubtitleBox.js';
import InventoryBar from '../ui/InventoryBar.js';
import ThoughtBubble from '../ui/ThoughtBubble.js';
import GameHUD from '../ui/GameHUD.js';
import { gameState } from '../utils/GameState.js';
import { soundEngine } from '../utils/SoundEngine.js';
import { MicroInteractions } from '../utils/MicroInteractions.js';
import { AmbientAtmosphere } from '../utils/AmbientAtmosphere.js';

export default class Chapter3Scene extends Phaser.Scene {
  constructor() {
    super('Chapter3Scene');
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    this.cameras.main.fadeIn(400, 12, 10, 8);

    this.isDead = false;
    gameState.setCurrentScene('Chapter3Scene');
    this.wallScratched = gameState.getFlag('ch3_wall_scratched');
    this.weightKicked = gameState.getFlag('ch3_weight_kicked');
    this.doorOpen = gameState.getFlag('ch3_door_open');
    this.targetX = null;
    this.lastMoveTime = 0;
    this.nextIdleTime = 4500;

    this.leftWeight = this.weightKicked ? 0 : 10;
    this.rightWeight = 0;
    this.rightItems = []; // items placed in right pan

    // 1. Temple Atmosphere Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1e1713, 0x1e1713, 0x0a0807, 0x0a0807, 1);
    bg.fillRect(0, 0, width, height);

    this.createTempleColumns(width, height);

    const groundY = height - 120;
    this.groundY = groundY;
    const ground = this.add.rectangle(width / 2, groundY + 60, width, 120, 0x17120e);
    this.physics.add.existing(ground, true);

    // 2. Temple Exit Door (Right side)
    const doorX = width * 0.84;
    const doorY = groundY - 110;
    this.createTempleDoor(doorX, doorY);

    // 3. Wall Inscription Plaque (Upper Center-Left)
    this.createWallInscription(width * 0.32, 130);

    // 4. Giant Blind Deity Statue with Balance Scale (Center)
    this.statueX = width * 0.52;
    this.statueY = groundY - 150;
    this.createDeityStatue(this.statueX, this.statueY);

    // 5. Phoe Htaung Player Character
    this.playerBaseScale = 1.42;
    this.playerX = width * 0.28;
    this.playerY = groundY - 58;
    this.player = this.add.sprite(this.playerX, this.playerY, 'ph-idle').setScale(this.playerBaseScale).setDepth(30);

    // Point-and-click walking
    this.input.on('pointerdown', (pointer) => {
      if (pointer.y > groundY - 100 && pointer.y < groundY + 80) {
        this.targetX = pointer.x;
        MicroInteractions.spawnClickMarker(this, pointer.x, groundY - 20);
      }
    });

    // 6. Floor Items (Stone 3, Gold 7, Red Gem, Chalk Stylus)
    this.createFloorItems(groundY);

    // 7. Floating Dust Motes & Cavern Drips & Atmosphere Overlays
    AmbientAtmosphere.createDustMotes(this, 28);
    AmbientAtmosphere.startCavernDrips(this, groundY);
    AmbientAtmosphere.createWeatheredOverlay(this);
    AmbientAtmosphere.createForegroundSilhouettes(this, 'temple');
    AmbientAtmosphere.createVolumetricRays(this, width * 0.52, 0);

    // 8. Ambient Toys (Machinarium Juice)
    this.createAmbientToys(groundY, width);

    // 9. HUD & Auto-Hiding Inventory Bar & Thought Bubble
    this.hud = new GameHUD(this);
    this.inventoryBar = new InventoryBar(this);
    this.thought = new ThoughtBubble(this);

    // Natural Signifiers
    AmbientAtmosphere.startNaturalSignifiers(this, [this.stoneItem, this.goldItem, this.gemItem, this.chalkItem, this.wallContainer]);

    // 10. Subtitle Box
    this.subtitle = new SubtitleBox(this);

    // Screen Vignette
    this.add.image(width / 2, height / 2, 'screen-vignette')
      .setDisplaySize(width, height)
      .setDepth(150)
      .setAlpha(0.65);

    // Entry Dialogue
    this.time.delayedCall(400, () => {
      this.subtitle.say('ဟောဗျာ... နတ်ရုပ်ကြီးက မျက်စိနှစ်ဖက် ကန်းနေတာပဲ။ လက်ထဲမှာလည်း ချိန်ခွင်ကြီး ကိုင်ထားတယ်။ နံရံက စာတန်းကို ဖတ်ပြီး ချိန်ခွင်ကို ညှိခိုင်းနေတာလား မသိဘူး!');
    });
  }

  createTempleColumns(width, height) {
    const cols = this.add.graphics();

    // 1. Rear Wall Stone Reliefs & Arched Sanctuary Niches
    cols.fillStyle(0x19130e, 0.95);
    cols.fillRect(0, 0, width, height - 120);

    // Weathered Bagan sandstone brick courses
    cols.lineStyle(1.5, 0x2e1c12, 0.6);
    for (let by = 30; by < height - 120; by += 32) {
      cols.lineBetween(0, by, width, by);
    }

    // Arched Sanctuary Niche in Center (Behind Deity Statue)
    cols.fillStyle(0x0e0a07, 1);
    cols.beginPath();
    cols.arc(width * 0.52, height * 0.32, 70, Math.PI, 0);
    cols.fillRect(width * 0.52 - 70, height * 0.32, 140, height * 0.35);
    cols.fill();
    cols.lineStyle(3, 0x57321a, 0.9);
    cols.stroke();

    // 2. Carved Fluted Sandstone Pillars with Lotus Capitals
    const drawPillar = (px) => {
      // Base
      cols.fillStyle(0x3e2314, 1);
      cols.fillRect(px - 45, height - 160, 90, 40);
      cols.lineStyle(2, 0x6e3c1d, 1);
      cols.strokeRect(px - 45, height - 160, 90, 40);

      // Shaft
      cols.fillStyle(0x2d1a0f, 1);
      cols.fillRect(px - 36, 40, 72, height - 200);
      cols.lineStyle(2, 0x4d2a17, 1);
      cols.strokeRect(px - 36, 40, 72, height - 200);

      // Fluting lines
      cols.lineStyle(1.5, 0x1a0f08, 0.8);
      cols.lineBetween(px - 20, 40, px - 20, height - 160);
      cols.lineBetween(px, 40, px, height - 160);
      cols.lineBetween(px + 20, 40, px + 20, height - 160);

      // Tiered Lotus Petal Capital (ထီးပုထိုး ကနုတ်ပန်းခွေ)
      cols.fillStyle(0x57321a, 1);
      cols.fillRect(px - 48, 15, 96, 25);
      cols.lineStyle(2, 0x854d0e, 1);
      cols.strokeRect(px - 48, 15, 96, 25);

      // Carved rosettes
      cols.fillStyle(0xd97706, 0.85);
      for (let i = 0; i < 4; i++) {
        cols.fillCircle(px, 80 + i * 85, 10);
      }
    };

    drawPillar(85);
    drawPillar(width - 95);

    // 3. Wall Torch Sconces with Animated Flickering Flame
    const createTorch = (tx, ty) => {
      // Iron bracket
      cols.fillStyle(0x1e293b, 1);
      cols.fillRect(tx - 3, ty, 6, 24);
      cols.fillRect(tx - 12, ty + 18, 24, 6);

      // Flame
      const flame = this.add.graphics().setDepth(5);
      flame.fillStyle(0xf59e0b, 0.9);
      flame.fillCircle(tx, ty - 6, 9);
      flame.fillStyle(0xfef08a, 1);
      flame.fillCircle(tx, ty - 6, 5);

      // Warm torchlight glow pool
      const glow = this.add.graphics().setDepth(2);
      glow.fillStyle(0xf59e0b, 0.12);
      glow.fillCircle(tx, ty - 6, 65);

      // Flickering animation
      this.tweens.add({
        targets: [flame, glow],
        scaleX: 1.15,
        scaleY: 0.92,
        duration: 250 + Math.random() * 150,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    };

    createTorch(width * 0.22, 180);
    createTorch(width * 0.76, 180);

    // 4. Temple Floor Slabs with Ancient Cracks & Lotus Medallion
    const groundY = height - 120;
    const floorDetail = this.add.graphics().setDepth(3);
    floorDetail.fillStyle(0x271911, 1);
    floorDetail.fillRect(0, groundY, width, 20);
    floorDetail.lineStyle(1.5, 0x140c08, 0.9);
    for (let fx = 0; fx < width; fx += 55) {
      floorDetail.strokeRect(fx, groundY, 52, 20);
      if (fx % 110 === 0) {
        floorDetail.lineBetween(fx + 12, groundY + 2, fx + 26, groundY + 18);
      }
    }
    // Lotus medallion in front of statue
    floorDetail.lineStyle(2, 0xd97706, 0.4);
    floorDetail.strokeCircle(width * 0.52, groundY + 10, 24);
  }

  createTempleDoor(x, y) {
    this.doorContainer = this.add.container(x, y).setDepth(10);

    const frame = this.add.graphics();
    frame.fillStyle(0x29211b, 1);
    frame.fillRoundedRect(-65, -110, 130, 220, 16);
    frame.lineStyle(3, 0x5c493c, 1);
    frame.strokeRoundedRect(-65, -110, 130, 220, 16);

    this.doorSlab = this.add.graphics();
    this.doorSlab.fillStyle(0x382c23, 1);
    this.doorSlab.fillRoundedRect(-55, -100, 110, 200, 10);
    this.doorSlab.lineStyle(2, 0x1f1914, 1);
    this.doorSlab.strokeRoundedRect(-55, -100, 110, 200, 10);

    const runeText = this.add.text(0, -20, 'ဗိသုကာ\nလျှို့ဝှက်\nတံခါး', {
      fontFamily: 'Noto Sans Myanmar',
      fontSize: '18px',
      fontStyle: '900',
      color: '#8b7355',
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5);

    this.doorGlow = this.add.rectangle(0, 0, 100, 190, 0xf59e0b, 0.4)
      .setVisible(this.doorOpen)
      .setInteractive({ useHandCursor: true });

    this.doorGlow.on('pointerdown', () => {
      if (this.doorOpen) {
        this.advanceToChapter4();
      }
    });

    this.doorContainer.add([frame, this.doorSlab, runeText, this.doorGlow]);

    if (this.doorOpen) {
      this.doorSlab.y = -190;
      runeText.y = -210;
    }
  }

  createWallInscription(x, y) {
    this.wallContainer = this.add.container(x, y).setDepth(15);

    const stonePlaque = this.add.graphics();
    stonePlaque.fillStyle(0x231b15, 0.95);
    stonePlaque.fillRoundedRect(-140, -32, 280, 64, 12);
    stonePlaque.lineStyle(2, 0x78350f, 0.9);
    stonePlaque.strokeRoundedRect(-140, -32, 280, 64, 12);
    this.wallContainer.add(stonePlaque);

    const currentWeightStr = this.wallScratched ? '၀' : '၁၀';
    this.inscriptionText = this.add.text(0, 0, `"${currentWeightStr} ပိဿာ ညီမျှလျှင် တံခါးပွင့်အံ့"`, {
      fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#fde68a'
    }).setOrigin(0.5);
    this.wallContainer.add(this.inscriptionText);

    // Interactive zone on the plaque
    const plaqueHit = this.add.rectangle(0, 0, 280, 64, 0x000000, 0.001)
      .setInteractive({ useHandCursor: true });

    plaqueHit.on('pointerdown', () => {
      this.interactWithProximity(x, () => {
        const selected = this.inventoryBar.getSelected();
        if (selected === 'betel_cutter' || selected === 'chalk') {
          this.scratchInscription();
        } else if (selected) {
          MicroInteractions.triggerSootPuff(this, this.player, () => {
            this.subtitle.say('ဒီပစ္စည်းနဲ့ ကျောက်စာကို ခြစ်ပြင်လို့ မရဘူးဗျာ!');
          });
        } else {
          this.thought.show(this.player.x, this.player.y, 'item-betel-cutter', 'ကျောက်စာ ဂဏန်း ပြင်ဆင်ရန်');
          this.subtitle.say('ကျောက်စာပေါ်မှာ "၁၀ ပိဿာ ညီမျှလျှင် တံခါးပွင့်အံ့" လို့ ရေးထားတယ်။ ချွန်ထက်တဲ့ ကွမ်းသီးညှပ် ဒါမှမဟုတ် ကျောက်ဖြူတုံးနဲ့ ဂဏန်းကို ခြစ်ပြင်လို့ ရနိုင်မလား?');
        }
      });
    });
    this.wallContainer.add(plaqueHit);
  }

  scratchInscription() {
    if (this.wallScratched) {
      this.subtitle.say('ဂဏန်းကို "၀" လို့ အောင်အောင်မြင်မြင် ပြင်ထားပြီးသားပါဗျာ!');
      return;
    }

    soundEngine.playScissors();
    this.wallScratched = true;
    gameState.setFlag('ch3_wall_scratched', true);
    this.inscriptionText.setText('"၀ ပိဿာ ညီမျှလျှင် တံခါးပွင့်အံ့"').setColor('#22c55e');

    this.subtitle.say('ကျောက်စာပေါ်က "၁၀" ထဲက "၁" ကို ကွမ်းသီးညှပ်နဲ့ အပီအပြင် ခြစ်ဖျက်လိုက်တယ်! အခု "၀ ပိဿာ" ဖြစ်သွားပြီ။ ကဲ... ချိန်ခွင်ပေါ်က အလေးတုံးကို ကန်ချလိုက်စမ်း!', () => {
      this.checkDoorUnlock();
    });
  }

  createDeityStatue(x, y) {
    this.statueContainer = this.add.container(x, y).setDepth(20);

    // Massive Stone Body & Arms
    const body = this.add.graphics();
    body.fillStyle(0x3f342c, 1);
    body.fillRoundedRect(-50, -100, 100, 160, 20); // Torso
    body.lineStyle(3, 0x1c1713, 1);
    body.strokeRoundedRect(-50, -100, 100, 160, 20);

    // Head
    body.fillStyle(0x4a3d34, 1);
    body.fillCircle(0, -140, 42);
    body.strokeCircle(0, -140, 42);

    // Crown / Ancient Headdress
    body.fillStyle(0xd97706, 0.9);
    body.beginPath();
    body.moveTo(-35, -165);
    body.lineTo(0, -200);
    body.lineTo(35, -165);
    body.closePath();
    body.fill();

    // Eye sockets (Empty / Blind)
    this.eyeLeft = this.add.circle(-14, -142, 6, 0x140e0a);
    this.eyeRight = this.add.circle(14, -142, 6, 0x140e0a);
    this.statueContainer.add([body, this.eyeLeft, this.eyeRight]);

    // Red Gem in eye socket (when inserted)
    this.gemInEye = this.add.image(-14, -142, 'item-red-gem').setScale(0.5).setVisible(false);
    this.statueContainer.add(this.gemInEye);

    // Eye Hit Zone (for dragging red gem)
    this.eyesHitZone = this.add.rectangle(0, -142, 50, 24, 0x00ff00, 0.001)
      .setInteractive({ useHandCursor: true });

    this.eyesHitZone.on('pointerdown', () => {
      this.interactWithProximity(x, () => {
        const selected = this.inventoryBar.getSelected();
        if (selected === 'red_gem') {
          this.triggerRedGemLaserTrap();
        } else if (selected) {
          MicroInteractions.triggerSootPuff(this, this.player, () => {
            this.subtitle.say('ဒါကို နတ်ရုပ်ကြီး မျက်လုံးထဲ ထည့်လို့ မရဘူး!');
          });
        } else {
          this.subtitle.say('နတ်ရုပ်ကြီးက မျက်စိကန်းနေတယ်။ မျက်လုံးခေါင်းပေါက်ကြီးတွေ ဟနေတာပဲ။');
        }
      });
    });
    this.statueContainer.add(this.eyesHitZone);

    // --- Dynamic Balance Scale Assembly ---
    this.scaleBeamContainer = this.add.container(0, -40);

    // Fulcrum Pivot
    const fulcrum = this.add.graphics();
    fulcrum.fillStyle(0x78350f, 1);
    fulcrum.fillTriangle(-12, 10, 12, 10, 0, -10);
    this.statueContainer.add(fulcrum);

    // Beam Bar (Width: 260px)
    this.beam = this.add.graphics();
    this.beam.fillStyle(0x94a3b8, 1);
    this.beam.fillRect(-130, -4, 260, 8);
    this.beam.lineStyle(1.5, 0x334155, 1);
    this.beam.strokeRect(-130, -4, 260, 8);
    this.scaleBeamContainer.add(this.beam);

    // --- Left Pan Assembly (-110px) ---
    this.leftPanContainer = this.add.container(-110, 0);
    const leftChains = this.add.graphics();
    leftChains.lineStyle(2, 0x64748b, 1);
    leftChains.lineBetween(0, 0, -25, 60);
    leftChains.lineBetween(0, 0, 25, 60);

    const leftPanPlate = this.add.graphics();
    leftPanPlate.fillStyle(0xb45309, 1);
    leftPanPlate.fillRoundedRect(-35, 60, 70, 12, 5);
    leftPanPlate.lineStyle(1.5, 0x78350f, 1);
    leftPanPlate.strokeRoundedRect(-35, 60, 70, 12, 5);

    // Left Pan weight 10 viss item
    this.weight10Sprite = this.add.image(0, 48, 'weight-10')
      .setScale(0.85)
      .setVisible(!this.weightKicked);
    MicroInteractions.makeInteractiveHover(this.weight10Sprite, 0.95);

    this.weight10Sprite.on('pointerdown', () => {
      this.interactWithProximity(x - 110, () => {
        this.kickWeight10();
      });
    });

    this.leftPanContainer.add([leftChains, leftPanPlate, this.weight10Sprite]);
    this.scaleBeamContainer.add(this.leftPanContainer);

    // --- Right Pan Assembly (+110px) ---
    this.rightPanContainer = this.add.container(110, 0);
    const rightChains = this.add.graphics();
    rightChains.lineStyle(2, 0x64748b, 1);
    rightChains.lineBetween(0, 0, -25, 60);
    rightChains.lineBetween(0, 0, 25, 60);

    const rightPanPlate = this.add.graphics();
    rightPanPlate.fillStyle(0xb45309, 1);
    rightPanPlate.fillRoundedRect(-35, 60, 70, 12, 5);
    rightPanPlate.lineStyle(1.5, 0x78350f, 1);
    rightPanPlate.strokeRoundedRect(-35, 60, 70, 12, 5);

    // Right Pan Hit Zone (to place items on right pan)
    this.rightPanHit = this.add.rectangle(0, 50, 80, 50, 0x00ff00, 0.001)
      .setInteractive({ useHandCursor: true });

    this.rightPanHit.on('pointerdown', () => {
      this.interactWithProximity(x + 110, () => {
        this.handleRightPanClick();
      });
    });

    this.rightPanContainer.add([rightChains, rightPanPlate, this.rightPanHit]);
    this.scaleBeamContainer.add(this.rightPanContainer);

    this.statueContainer.add(this.scaleBeamContainer);

    this.updateScaleBeamAngle(false);
  }

  updateScaleBeamAngle(animated = true) {
    // Left heavier -> tilts counter-clockwise (negative angle)
    // Right heavier -> tilts clockwise (positive angle)
    const diff = this.rightWeight - this.leftWeight;
    let targetAngle = 0;
    if (diff > 0) targetAngle = Math.min(18, diff * 3);
    else if (diff < 0) targetAngle = Math.max(-18, diff * 3);

    if (animated) {
      this.tweens.add({
        targets: this.scaleBeamContainer,
        angle: targetAngle,
        duration: 400,
        ease: 'Back.Out'
      });
      // Keep pans hanging vertical
      this.tweens.add({
        targets: [this.leftPanContainer, this.rightPanContainer],
        angle: -targetAngle,
        duration: 400,
        ease: 'Back.Out'
      });
    } else {
      this.scaleBeamContainer.angle = targetAngle;
      this.leftPanContainer.angle = -targetAngle;
      this.rightPanContainer.angle = -targetAngle;
    }
  }

  handleRightPanClick() {
    const selected = this.inventoryBar.getSelected();
    if (!selected) {
      this.subtitle.say('ညာဘက် ချိန်ခွင်ခွက်က အလွတ်ကြီး ဖြစ်နေတယ်။ အလေးတုံး ဒါမှမဟုတ် ကျောက်ခဲ တစ်ခုခု တင်ရမလား?');
      return;
    }

    if (selected === 'stone_3') {
      gameState.removeItem('stone_3');
      this.inventoryBar.clearSelected();
      this.inventoryBar.refresh();
      this.rightWeight += 3;
      this.rightItems.push('stone_3');
      soundEngine.playClang();

      const img = this.add.image(-12, 50, 'item-stone-3').setScale(0.7);
      this.rightPanContainer.add(img);

      this.updateScaleBeamAngle(true);
      this.checkScaleCondition();
    } else if (selected === 'gold_7') {
      gameState.removeItem('gold_7');
      this.inventoryBar.clearSelected();
      this.inventoryBar.refresh();
      this.rightWeight += 7;
      this.rightItems.push('gold_7');
      soundEngine.playClang();

      const img = this.add.image(12, 50, 'item-gold-7').setScale(0.7);
      this.rightPanContainer.add(img);

      this.updateScaleBeamAngle(true);
      this.checkScaleCondition();
    } else if (selected === 'red_gem') {
      this.subtitle.say('ကျောက်မျက်နီက ချိန်ခွင်ခွက်ထဲ တင်ဖို့ မဟုတ်ဘူးထင်တယ်... ပေါ့ပေါ့လေးရယ်။');
    } else {
      this.subtitle.say('ဒါကို ချိန်ခွင်ခွက်ထဲ တင်လို့ မရပါဘူးဗျာ။');
    }
  }

  checkScaleCondition() {
    if (this.leftWeight === 10 && this.rightWeight === 10) {
      // Trap 1: Correct math punishment!
      this.triggerScaleSmashTrap();
    }
  }

  triggerScaleSmashTrap() {
    this.isDead = true;

    // Statue eyes flash angry white/red
    this.eyeLeft.setFillStyle(0xef4444);
    this.eyeRight.setFillStyle(0xef4444);

    this.time.delayedCall(400, () => {
      soundEngine.playClang();

      // Pan swings downwards to smash Phoe Htaung
      this.tweens.add({
        targets: this.scaleBeamContainer,
        angle: 45,
        duration: 180,
        ease: 'Quad.In',
        onComplete: () => {
          soundEngine.playDeath();
          this.cameras.main.shake(350, 0.04);
          this.player.setTexture('ph-flat');
          gameState.addDeath();
          this.hud.updateDeathCount();

          this.subtitle.say('အိုဟိုး... သင်္ချာဂုဏ်ထူးရှင်ကြီး! ၃ ရယ် ၇ ရယ် ပေါင်းရင် ၁၀ ရတယ်ဆိုပြီး ချိန်ခွင်ကို ကွက်တိ ညှိပြသွားတယ်! ဒါပေမဲ့... နတ်ရုပ်ကြီးက သင်္ချာတော်တဲ့ကောင်တွေကို ကြည့်မရဘူးကွဲ့! "ငါတောင် မပေါင်းတတ်တာ မင်းက လာပေါင်းပြတယ်" ဆိုပြီး ချိန်ခွင်နဲ့ ရိုက်ခွဲလိုက်တာ တွေ့လား? သေဦးပေါ့!', () => {
            this.respawn();
          });
        }
      });
    });
  }

  triggerRedGemLaserTrap() {
    if (this.isDead) return;
    this.isDead = true;

    gameState.removeItem('red_gem');
    this.inventoryBar.clearSelected();
    this.inventoryBar.refresh();

    this.gemInEye.setVisible(true);
    soundEngine.playPickup();

    this.time.delayedCall(300, () => {
      // Twin laser beams shoot from statue eyes towards Phoe Htaung
      soundEngine.playLaser();

      const laser = this.add.graphics().setDepth(40);
      laser.lineStyle(6, 0xef4444, 1);
      laser.lineBetween(this.statueX - 14, this.statueY - 142, this.playerX, this.playerY);
      laser.lineBetween(this.statueX + 14, this.statueY - 142, this.playerX, this.playerY);

      this.cameras.main.flash(200, 239, 68, 68);

      this.time.delayedCall(200, () => {
        laser.destroy();
        soundEngine.playDeath();
        this.player.setTexture('ph-ash');
        gameState.addDeath();
        this.hud.updateDeathCount();

        this.subtitle.say('မျက်စိကန်းနေတဲ့ နတ်ရုပ်ကို မျက်လုံး သွားတပ်ပေးတယ်... ဟုတ်ပြီ၊ နတ်ရုပ်ကြီး မြင်သွားပြီဗျို့! မြင်မြင်ချင်းပဲ လေဆာနဲ့ ပစ်ခွဲလိုက်တာ ကြည့်စမ်း! မင်း ကျေးဇူးသိတတ်ပုံကတော့ ကမ္ဘာကျော်တယ် နတ်ရုပ်ကြီးရေ!', () => {
          this.respawn();
        });
      });
    });
  }

  kickWeight10() {
    if (this.weightKicked) return;

    soundEngine.playClang();
    this.weightKicked = true;
    gameState.setFlag('ch3_weight_kicked', true);
    this.leftWeight = 0;

    // Phoe Htaung kicks it flying
    this.tweens.add({
      targets: this.weight10Sprite,
      x: -180,
      y: 120,
      angle: 180,
      duration: 350,
      ease: 'Quad.In',
      onComplete: () => {
        this.weight10Sprite.destroy();
      }
    });

    this.updateScaleBeamAngle(true);
    this.checkDoorUnlock();
  }

  checkDoorUnlock() {
    // Solved when: wall is scratched to "0 viss" AND weight_10 is kicked (left=0, right=0)
    if (this.wallScratched && this.weightKicked && this.rightWeight === 0) {
      this.time.delayedCall(300, () => {
        this.doorOpen = true;
        gameState.setFlag('ch3_door_open', true);
        soundEngine.playPickup();

        this.tweens.add({
          targets: this.doorSlab,
          y: -190,
          duration: 900,
          ease: 'Cubic.Out',
          onComplete: () => {
            this.doorGlow.setVisible(true);
          }
        });

        this.subtitle.say('ကျောက်စာပေါ်က ဂဏန်းကို ကွမ်းသီးညှပ်နဲ့ ခြစ်ဖျက်ပစ်တယ်! ဟာ... စာမေးပွဲ အောင်လက်မှတ်ကို အမှတ်ခိုးပြင်တဲ့ အကျင့်ဟောင်းတွေ ဒီမှာ လာသုံးနေတယ်ဗျာ။ အံမယ်... တံခါးက ပွင့်သွားသေးတယ်! ရှေးခေတ်လူတွေလည်း ဒီကောင့်လောက်တော့ မလည်ဘူးထင်ပါရဲ့! (တံခါးကို နှိပ်ပြီး ဝင်ပါ)');
      });
    }
  }

  createAmbientToys(groundY, width) {
    // 1. Hanging bronze temple bell on left column
    const bellContainer = this.add.container(width * 0.16, groundY - 140).setSize(40, 50).setDepth(14);
    const chain = this.add.graphics();
    chain.lineStyle(1.5, 0x64748b, 0.9);
    chain.lineBetween(0, -30, 0, 0);
    const bellImg = this.add.image(0, 8, 'item-cog').setScale(0.5).setTint(0xf59e0b);
    bellContainer.add([chain, bellImg]);
    MicroInteractions.attachAmbientToy(this, bellContainer, 'bell');

    // 2. Stone offering bowl on sanctuary floor
    const bowl = this.add.image(width * 0.62, groundY - 14, 'item-stone-3').setScale(0.8).setTint(0x57321a).setDepth(14);
    MicroInteractions.attachAmbientToy(this, bowl, 'pot');
  }

  interactWithProximity(targetX, onReachCallback) {
    if (this.isDead) return;
    const distance = Math.abs(this.player.x - targetX);
    const baseScale = this.playerBaseScale || 1.42;
    if (distance <= 85) {
      this.player.setScale(targetX > this.player.x ? baseScale : -baseScale, baseScale);
      onReachCallback();
    } else {
      const walkToX = targetX > this.player.x ? targetX - 55 : targetX + 55;
      this.targetX = walkToX;
      this.pendingAction = () => {
        this.player.setScale(targetX > this.player.x ? baseScale : -baseScale, baseScale);
        onReachCallback();
      };
    }
  }

  createFloorItems(groundY) {
    // 1. Stone 3 Viss
    if (!gameState.hasItem('stone_3') && !this.rightItems.includes('stone_3')) {
      const stone = this.add.image(this.scale.width * 0.42, groundY - 14, 'item-stone-3')
        .setScale(0.52);
      MicroInteractions.makeInteractiveHover(stone, 1.15);

      stone.on('pointerdown', () => {
        this.interactWithProximity(stone.x, () => {
          MicroInteractions.pickupItemToBag(this, stone, this.player, () => {
            gameState.addItem('stone_3');
            this.inventoryBar.refresh();
            this.subtitle.say('၃ ပိဿာ အလေးချိန်ရှိတဲ့ ကျောက်ခဲကို ကောက်ရလိုက်ပြီ။');
          });
        });
      });
    }

    // 2. Gold 7 Viss
    if (!gameState.hasItem('gold_7') && !this.rightItems.includes('gold_7')) {
      const gold = this.add.image(this.scale.width * 0.47, groundY - 14, 'item-gold-7')
        .setScale(0.52);
      MicroInteractions.makeInteractiveHover(gold, 1.15);

      gold.on('pointerdown', () => {
        this.interactWithProximity(gold.x, () => {
          MicroInteractions.pickupItemToBag(this, gold, this.player, () => {
            gameState.addItem('gold_7');
            this.inventoryBar.refresh();
            this.subtitle.say('၇ ပိဿာ လေးတဲ့ ရွှေတုံးကြီးဗျာ! ဒါပေမဲ့ အရမ်းလေးနေတယ်။');
          });
        });
      });
    }

    // 3. Red Gem
    if (!gameState.hasItem('red_gem')) {
      const gem = this.add.image(this.scale.width * 0.68, groundY - 14, 'item-red-gem')
        .setScale(0.5);
      MicroInteractions.makeInteractiveHover(gem, 1.15);

      gem.on('pointerdown', () => {
        this.interactWithProximity(gem.x, () => {
          MicroInteractions.pickupItemToBag(this, gem, this.player, () => {
            gameState.addItem('red_gem');
            this.inventoryBar.refresh();
            this.subtitle.say('တောက်ပနေတဲ့ ကျောက်မျက်နီကြီး ကောက်ရလိုက်ပြီ။ မျက်လုံးနဲ့တောင် တူနေသလိုပဲ!');
          });
        });
      });
    }

    // 4. Chalk Stylus (ကျောက်ဖြူတုံး) on Pedestal
    if (!gameState.hasItem('chalk')) {
      const chalkPed = this.add.graphics();
      chalkPed.fillStyle(0x332820, 1);
      chalkPed.fillRect(this.scale.width * 0.36 - 12, groundY - 14, 24, 14);

      const chalk = this.add.image(this.scale.width * 0.36, groundY - 20, 'item-chalk')
        .setScale(0.48);
      MicroInteractions.makeInteractiveHover(chalk, 1.15);

      chalk.on('pointerdown', () => {
        this.interactWithProximity(chalk.x, () => {
          MicroInteractions.pickupItemToBag(this, chalk, this.player, () => {
            gameState.addItem('chalk');
            this.inventoryBar.refresh();
            this.subtitle.say('ကျောက်ဖြူတုံးလေး ကောက်ရလိုက်ပြီ! ကျောက်စာတွေပေါ်မှာ စာရေး/စာပြင်လို့ ရတယ်!');
          });
        });
      });
    }
  }

  update(time, delta) {
    if (this.isDead) return;
    const baseScale = this.playerBaseScale || 1.42;

    if (this.targetX !== null) {
      const dist = this.targetX - this.player.x;
      if (Math.abs(dist) > 8) {
        this.player.x += Math.sign(dist) * 3.5;
        this.player.setScale(Math.sign(dist) * baseScale, baseScale);
        this.player.setAngle(2.5 * Math.sign(dist));
        this.playerX = this.player.x;
        this.lastMoveTime = time;
        if (this.player.isPerformingIdle) {
          MicroInteractions.cancelIdleAction(this, this.player);
        }

        if (!this.stepTimer || time > this.stepTimer) {
          soundEngine.playFootstep();
          this.walkFrame = this.walkFrame === 'ph-walk-1' ? 'ph-walk-2' : 'ph-walk-1';
          this.player.setTexture(this.walkFrame);
          MicroInteractions.spawnFootstepDust(this, this.player.x, this.player.y, Math.sign(dist));
          this.stepTimer = time + 260;
        }
      } else {
        this.targetX = null;
        if (this.pendingAction) {
          const act = this.pendingAction;
          this.pendingAction = null;
          act();
        }
        this.player.setAngle(0);
        const isIdleSpecial = this.player.isPerformingIdle || ['ph-mad', 'ph-think', 'ph-laugh', 'ph-bag-rummage'].includes(this.player.texture.key);
        if (!isIdleSpecial && this.player.texture.key !== 'ph-idle' && this.player.texture.key !== 'ph-ash' && this.player.texture.key !== 'ph-flat') {
          this.player.setTexture('ph-idle');
        }
      }
    } else {
      this.player.setAngle(0);
      const isIdleSpecial = this.player.isPerformingIdle || ['ph-mad', 'ph-think', 'ph-laugh', 'ph-bag-rummage'].includes(this.player.texture.key);
      if (!isIdleSpecial && this.player.texture.key !== 'ph-idle' && this.player.texture.key !== 'ph-ash' && this.player.texture.key !== 'ph-flat') {
        this.player.setTexture('ph-idle');
      }

      // Continuous Organic Inhaling/Exhaling Breathing Animation
      if (!isIdleSpecial && this.player.texture.key === 'ph-idle') {
        MicroInteractions.applyIdleBreathing(this.player, time, 1.0);
      }

      // Machinarium Idle Micro-Behaviors (Laughing, Thinking, Mad, Betel spitting, fly swatting)
      if (time - this.lastMoveTime > 3500 && time > this.nextIdleTime) {
        MicroInteractions.triggerIdleAction(this, this.player, this.groundY);
        this.nextIdleTime = time + Phaser.Math.Between(4000, 6500);
      }
    }
  }

  advanceToChapter4() {
    soundEngine.playPickup();
    this.cameras.main.fade(400, 12, 10, 8);
    this.time.delayedCall(400, () => {
      this.scene.start('Chapter4Scene');
    });
  }

  respawn() {
    this.cameras.main.fade(300, 12, 10, 8);
    this.time.delayedCall(300, () => {
      this.scene.restart();
    });
  }
}
