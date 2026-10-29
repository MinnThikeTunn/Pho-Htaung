import Phaser from 'phaser';
import SubtitleBox from '../ui/SubtitleBox.js';
import InventoryBar from '../ui/InventoryBar.js';
import ThoughtBubble from '../ui/ThoughtBubble.js';
import GameHUD from '../ui/GameHUD.js';
import { gameState } from '../utils/GameState.js';
import { soundEngine } from '../utils/SoundEngine.js';
import { audioDirector } from '../audio/AudioDirector.js';
import { MicroInteractions } from '../utils/MicroInteractions.js';
import { AmbientAtmosphere } from '../utils/AmbientAtmosphere.js';

export default class Chapter2Scene extends Phaser.Scene {
  constructor() {
    super('Chapter2Scene');
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    this.cameras.main.fadeIn(400, 12, 10, 8);

    this.isDead = false;
    gameState.setCurrentScene('Chapter2Scene');

    // Smoothly fade out acoustic Kalimba across the transition into Chapter 2 cavern
    audioDirector.fadeStem('STEM_KALIMBA', 0.00, 3800);
    this.leverCovered = gameState.getFlag('ch2_lever_covered');
    this.doorOpen = gameState.getFlag('ch2_door_open');
    this.targetX = null;
    this.pressure = 30;
    this.lastMoveTime = 0;
    this.nextIdleTime = 4500;

    // 1. Atmosphere Cave Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1512, 0x1a1512, 0x090706, 0x090706, 1);
    bg.fillRect(0, 0, width, height);

    // Cave ceiling stalactites & rock textures
    this.createCaveEnvironment(width, height);

    // Ground line
    const groundY = height - 120;
    this.groundY = groundY;
    const ground = this.add.rectangle(width / 2, groundY + 60, width, 120, 0x1f1914);
    this.physics.add.existing(ground, true);

    // 2. Sealed Cave Door (Center-Right)
    const doorX = width * 0.72;
    const doorY = groundY - 110;
    this.createCaveDoor(doorX, doorY);

    // 3. Furnace / Hearth under or beside door
    const furnaceX = doorX - 110;
    const furnaceY = groundY - 40;
    this.createFurnace(furnaceX, furnaceY);

    // 4. Intricate 3x3 Pipe Grid & Steam Assembly (Left side)
    const pipeX = width * 0.22;
    const pipeY = groundY - 140;
    this.createPipeAssembly(pipeX, pipeY, furnaceX, furnaceY);

    // 5. Phoe Htaung Character
    this.playerBaseScale = 1.42;
    this.playerX = width * 0.48;
    this.playerY = groundY - 58;
    this.player = this.add.sprite(this.playerX, this.playerY, 'ph-idle').setScale(this.playerBaseScale).setDepth(20);

    // Point-and-click walking
    this.input.on('pointerdown', (pointer) => {
      if (pointer.y > groundY - 100 && pointer.y < groundY + 80) {
        this.targetX = pointer.x;
        MicroInteractions.spawnClickMarker(this, pointer.x, groundY - 20);
      }
    });

    // 6. Floor Items (Pickups)
    this.createFloorItems(groundY);

    // 7. Floating Dust Motes & Cavern Drips & Atmosphere Overlays
    AmbientAtmosphere.createDustMotes(this, 26);
    AmbientAtmosphere.startCavernDrips(this, groundY);
    AmbientAtmosphere.createWeatheredOverlay(this);
    AmbientAtmosphere.createForegroundSilhouettes(this, 'temple');
    AmbientAtmosphere.createVolumetricRays(this, width * 0.45, 0);

    // 8. Ambient Toys (Machinarium Juice)
    this.createAmbientToys(groundY, width);

    // 9. HUD & Auto-Hiding Inventory Bar & Thought Bubble
    this.hud = new GameHUD(this);
    this.thought = new ThoughtBubble(this);

    this.inventoryBar = new InventoryBar(this, (combined) => {
      this.subtitle.say('အံမယ်... ကွမ်းသီးညှပ်နဲ့ ရေဗူးစုတ်ကို ထက်ခြမ်း လှီးချလိုက်တယ်ဟေ့! ရေဗူးခြမ်းလေး ရသွားပြီ။ ပိုက်ခေါင်းမှာ သွားစွပ်ကြည့်မလား?');
    });

    // Natural Signifiers
    AmbientAtmosphere.startNaturalSignifiers(this, [this.spikeItem, this.chiliItem, this.twigsItem, this.leverContainer]);

    // 10. Subtitle Box
    this.subtitle = new SubtitleBox(this);

    // Vignette overlay
    this.add.image(width / 2, height / 2, 'screen-vignette')
      .setDisplaySize(width, height)
      .setDepth(150)
      .setAlpha(0.65);

    // Entry Dialogue
    this.time.delayedCall(400, () => {
      this.subtitle.say('ကဲ... ဂူတံခါးကြီး ပိတ်နေပြီ။ ကြမ်းပြင်ပေါ်မှာ ပစ္စည်းတွေ ပြန့်ကျဲနေတာပဲ။ ကောက်စမ်း မောင်ဖိုးထောင်... လွယ်အိတ်ထဲ ထည့်စမ်း!');
    });
  }

  createCaveEnvironment(width, height) {
    const rocks = this.add.graphics();

    // 1. Heavy Curved Boiler Bulkhead Plates & Verdigris Patina
    rocks.fillStyle(0x271912, 0.95);
    rocks.fillRect(0, 0, width, height - 120);

    // Copper / Rusted Iron Boiler Panels with Seam Welds
    rocks.lineStyle(2, 0x572814, 0.85);
    for (let px = 0; px < width; px += 90) {
      rocks.strokeRect(px, 0, 88, height - 120);

      // Rivet rows along panel seams
      rocks.fillStyle(0x78350f, 1);
      for (let ry = 25; ry < height - 120; ry += 35) {
        rocks.fillCircle(px + 4, ry, 2.5);
        rocks.fillCircle(px + 84, ry, 2.5);
      }
    }

    // Greenish verdigris copper corrosion stains & rust streaks
    rocks.fillStyle(0x0f766e, 0.25);
    for (let vx = 30; vx < width; vx += 120) {
      rocks.fillRect(vx, 40, 16, 90);
    }
    rocks.fillStyle(0x78350f, 0.35);
    for (let rx = 70; rx < width; rx += 140) {
      rocks.fillRect(rx, 20, 12, 110);
    }

    // 2. Overhead Steampunk Pipes with Brass Flanges & Leaking Drips
    rocks.fillStyle(0x78350f, 1);
    rocks.fillRect(0, 48, width, 14); // main overhead pipe
    rocks.fillStyle(0xd97706, 0.9);
    rocks.fillRect(0, 51, width, 4); // pipe metallic highlight

    // Pipe joints / flanges
    rocks.fillStyle(0x451a03, 1);
    for (let fx = 60; fx < width; fx += 110) {
      rocks.fillRect(fx - 4, 44, 8, 22);
      rocks.lineStyle(1.5, 0xd97706, 0.8);
      rocks.strokeRect(fx - 4, 44, 8, 22);
    }

    // 3. Stalactites from ceiling crevices
    rocks.fillStyle(0x1a120c, 1);
    for (let x = 0; x < width; x += 45) {
      const h = (x % 3 === 0) ? 75 : 45;
      rocks.beginPath();
      rocks.moveTo(x, 0);
      rocks.lineTo(x + 22, h);
      rocks.lineTo(x + 45, 0);
      rocks.closePath();
      rocks.fill();
    }

    // 4. Damp floor reflections and puddles
    const groundY = height - 120;
    rocks.fillStyle(0xf59e0b, 0.12); // orange furnace light bounce on wet floor
    rocks.fillEllipse(width * 0.65, groundY + 12, 120, 14);
    rocks.fillStyle(0x0284c7, 0.15); // cool water puddle reflection
    rocks.fillEllipse(width * 0.32, groundY + 14, 80, 10);
  }

  createCaveDoor(x, y) {
    this.doorContainer = this.add.container(x, y).setDepth(10);

    // Stone Frame
    const frame = this.add.graphics();
    frame.fillStyle(0x27201b, 1);
    frame.fillRoundedRect(-70, -110, 140, 220, 16);
    frame.lineStyle(3, 0x57483d, 1);
    frame.strokeRoundedRect(-70, -110, 140, 220, 16);

    // Door Slab (moves up or opens)
    this.doorSlab = this.add.graphics();
    this.doorSlab.fillStyle(0x3e322a, 1);
    this.doorSlab.fillRoundedRect(-60, -100, 120, 200, 10);
    this.doorSlab.lineStyle(2, 0x1f1914, 1);
    this.doorSlab.strokeRoundedRect(-60, -100, 120, 200, 10);

    // Runes / Myanmar carved patterns
    const runeText = this.add.text(0, -20, 'ရွှေ\nမြို့\nတော်', {
      fontFamily: 'Noto Sans Myanmar, Pyidaungsu',
      fontSize: '22px',
      fontStyle: '900',
      color: '#786452',
      align: 'center',
      lineSpacing: 10
    }).setOrigin(0.5);

    // Glowing door exit when opened
    this.doorGlow = this.add.rectangle(0, 0, 110, 190, 0xf59e0b, 0.4)
      .setVisible(this.doorOpen)
      .setInteractive({ useHandCursor: true });

    this.doorGlow.on('pointerdown', () => {
      if (this.doorOpen) {
        this.advanceToChapter3();
      }
    });

    this.doorContainer.add([frame, this.doorSlab, runeText, this.doorGlow]);

    if (this.doorOpen) {
      this.doorSlab.y = -190;
      runeText.y = -210;
    }
  }

  createFurnace(x, y) {
    this.furnaceContainer = this.add.container(x, y).setDepth(12);

    const hearth = this.add.graphics();
    hearth.fillStyle(0x1c1917, 1);
    hearth.fillRoundedRect(-40, -40, 80, 80, 8);
    hearth.lineStyle(3, 0x44403c, 1);
    hearth.strokeRoundedRect(-40, -40, 80, 80, 8);

    // Furnace grate
    hearth.fillStyle(0x0c0a09, 1);
    hearth.fillRect(-30, -20, 60, 50);

    // Fire glow
    this.fireGlow = this.add.graphics();
    this.fireGlow.fillStyle(0xef4444, 0.85);
    this.fireGlow.fillCircle(0, 5, 20);
    this.fireGlow.fillStyle(0xf59e0b, 0.9);
    this.fireGlow.fillCircle(0, 8, 14);

    this.tweens.add({
      targets: this.fireGlow,
      scaleX: 1.15,
      scaleY: 0.9,
      duration: 350,
      yoyo: true,
      repeat: -1
    });

    // Fire status text
    this.fireLabel = this.add.text(0, -52, 'မီးဖို (ပိတ်ဆို့)', {
      fontFamily: 'Noto Sans Myanmar',
      fontSize: '11px',
      color: '#f87171'
    }).setOrigin(0.5);

    this.furnaceContainer.add([hearth, this.fireGlow, this.fireLabel]);

    if (this.doorOpen) {
      this.fireGlow.setVisible(false);
      this.fireLabel.setText('မီးငြိမ်းသွားပြီ').setColor('#22c55e');
    }
  }

  createPipeAssembly(x, y, furnaceX, furnaceY) {
    this.pipeAssembly = this.add.container(x, y).setDepth(15);

    // Background panel for 3x3 Pipe Grid
    const panel = this.add.graphics();
    panel.fillStyle(0x271e17, 1);
    panel.fillRoundedRect(-100, -100, 200, 200, 14);
    panel.lineStyle(3, 0x78350f, 1);
    panel.strokeRoundedRect(-100, -100, 200, 200, 14);
    this.pipeAssembly.add(panel);

    const title = this.add.text(0, -114, 'စက်မှု ရေနွေးငွေ့ ပိုက်လိုင်း ၃x၃', {
      fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#f59e0b'
    }).setOrigin(0.5);
    this.pipeAssembly.add(title);

    // Steam Pressure Gauge (Machinarium Dial)
    this.gaugeContainer = this.add.container(60, -114);
    const gaugeBg = this.add.graphics();
    gaugeBg.fillStyle(0xd97706, 1);
    gaugeBg.fillCircle(0, 0, 16);
    gaugeBg.lineStyle(2, 0x451a03, 1);
    gaugeBg.strokeCircle(0, 0, 16);
    gaugeBg.fillStyle(0xf8fafc, 1);
    gaugeBg.fillCircle(0, 0, 13);

    // Needle
    this.gaugeNeedle = this.add.graphics();
    this.gaugeNeedle.lineStyle(2, 0xdc2626, 1);
    this.gaugeNeedle.lineBetween(0, 0, 0, -10);
    this.gaugeContainer.add([gaugeBg, this.gaugeNeedle]);
    this.pipeAssembly.add(this.gaugeContainer);

    // 3x3 Grid of Rotatable Pipes
    this.pipes = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const px = -60 + col * 60;
        const py = -60 + row * 60;

        const pipeBox = this.add.graphics();
        pipeBox.fillStyle(0x14100c, 1);
        pipeBox.fillRoundedRect(px - 26, py - 26, 52, 52, 8);
        pipeBox.lineStyle(1.5, 0x451a03, 1);
        pipeBox.strokeRoundedRect(px - 26, py - 26, 52, 52, 8);
        this.pipeAssembly.add(pipeBox);

        // Pipe shape container to rotate
        const pipeObj = this.add.container(px, py).setSize(52, 52).setInteractive({ useHandCursor: true });
        const pipeG = this.add.graphics();
        pipeG.fillStyle(0xd97706, 1);
        pipeG.fillRect(-6, -24, 12, 48); // Vertical line
        pipeG.fillRect(-24, -6, 48, 12); // Cross or elbow
        pipeObj.add(pipeG);

        pipeObj.on('pointerdown', () => {
          pipeObj.angle += 90;
          soundEngine.playGearClick();

          // Wiggle pressure needle
          this.pressure = Phaser.Math.Between(40, 95);
          this.tweens.add({
            targets: this.gaugeNeedle,
            angle: Phaser.Math.Between(-60, 60),
            duration: 150,
            yoyo: true
          });
        });

        this.pipeAssembly.add(pipeObj);
        this.pipes.push(pipeObj);
      }
    }

    // Pipe Steam Nozzle pointing right toward Phoe Htaung
    this.nozzle = this.add.graphics();
    this.nozzle.fillStyle(0x94a3b8, 1);
    this.nozzle.fillRect(100, -12, 40, 24);
    this.nozzle.fillStyle(0x475569, 1);
    this.nozzle.fillRect(135, -18, 10, 36); // Nozzle mouth
    this.pipeAssembly.add(this.nozzle);

    // Plastic bottle cover over nozzle (when covered)
    this.bottleCover = this.add.image(146, 0, 'item-half-bottle')
      .setAngle(90)
      .setScale(0.85)
      .setVisible(this.leverCovered);
    this.pipeAssembly.add(this.bottleCover);

    // Interactive target for dragging or clicking half-bottle
    this.nozzleHitZone = this.add.rectangle(135, 0, 50, 50, 0x00ff00, 0.001)
      .setInteractive({ useHandCursor: true });

    this.nozzleHitZone.on('pointerdown', () => {
      this.interactWithProximity(this.pipeAssembly.x + 135, () => {
        const selected = this.inventoryBar.getSelected();
        if (selected === 'half_bottle') {
          this.coverNozzle();
        } else if (selected) {
          MicroInteractions.triggerSootPuff(this, this.player, () => {
            this.subtitle.say('ဟားဟား! ဒီပစ္စည်းက ရေနွေးငွေ့ပိုက်ဝနဲ့ အံမဝင်ဘူးဗျ! မီးခိုးတွေ ပန်းထွက်လာပြီ!');
          });
        } else {
          this.subtitle.say('ရေနွေးငွေ့ထွက်မယ့် ခေါင်းပေါက်ကြီးပဲ... အပေါက်ကို ကာမထားရင် ရေနွေးငွေ့က ငါ့ဆီ တည့်တည့်လာမှန်လိမ့်မယ်!');
        }
      });
    });
    this.pipeAssembly.add(this.nozzleHitZone);

    // Steam Lever
    this.leverContainer = this.add.container(110, 50).setSize(40, 60).setInteractive({ useHandCursor: true });
    this.leverBase = this.add.rectangle(0, 0, 16, 44, 0x334155);
    this.leverHandle = this.add.rectangle(0, -18, 28, 10, 0xef4444);
    this.leverLabel = this.add.text(0, 26, 'လီဗာ', {
      fontFamily: 'Noto Sans Myanmar',
      fontSize: '11px',
      color: '#f87171'
    }).setOrigin(0.5);

    this.leverContainer.add([this.leverBase, this.leverHandle, this.leverLabel]);
    this.pipeAssembly.add(this.leverContainer);

    this.leverContainer.on('pointerdown', () => {
      this.interactWithProximity(this.pipeAssembly.x + 110, () => {
        this.pullSteamLever(furnaceX, furnaceY);
      });
    });
  }

  coverNozzle() {
    this.leverCovered = true;
    gameState.setFlag('ch2_lever_covered', true);
    gameState.removeItem('half_bottle');
    this.inventoryBar.clearSelected();
    this.inventoryBar.refresh();
    this.bottleCover.setVisible(true);
    soundEngine.playPickup();

    this.subtitle.say('ဟောဗျာ... ထက်ခြမ်းခြမ်းထားတဲ့ ရေဗူးစုတ်ကို ပိုက်ခေါင်းဝမှာ သွားစွပ်လိုက်တယ်! ပိုက်ခေါင်း အောက်ဘက် ကွေးသွားသလိုပဲ။');
  }

  pullSteamLever(furnaceX, furnaceY) {
    if (this.isDead) return;

    soundEngine.playClang();
    soundEngine.playHiss();

    // Animate lever pulling
    this.tweens.add({
      targets: this.leverHandle,
      y: 18,
      duration: 150,
      yoyo: true
    });

    if (!this.leverCovered) {
      // Trap 2: Steam blasts Phoe Htaung directly!
      this.triggerSteamTrap();
    } else {
      // Troll Solution: Deflected into furnace!
      this.extinguishFurnaceAndOpenDoor();
    }
  }

  triggerSteamTrap() {
    this.isDead = true;

    // Steam particles blast towards Phoe Htaung
    for (let i = 0; i < 15; i++) {
      const puff = this.add.image(this.pipeAssembly.x + 140, this.pipeAssembly.y, 'steam-puff').setDepth(30);
      this.tweens.add({
        targets: puff,
        x: this.playerX + Phaser.Math.Between(-20, 20),
        y: this.playerY + Phaser.Math.Between(-30, 30),
        scale: 2.5,
        alpha: 0,
        duration: 500,
        delay: i * 30,
        onComplete: () => puff.destroy()
      });
    }

    this.time.delayedCall(300, () => {
      soundEngine.playDeath();
      this.player.setTexture('ph-boiled');
      this.cameras.main.shake(250, 0.02);
      gameState.addDeath();
      this.hud.updateDeathCount();

      this.subtitle.say('ဟားဟားဟား! ပိုက်လိုင်းဆက်တာတော့ အင်ဂျင်နီယာကြီး ကျနေတာပဲဗျာ! ပိုက်တွေ အကုန်ဆက်ပြီး လီဗာဆွဲချလိုက်တော့... အယ်! ပိုက်ခေါင်းက မင်းဘက် လှည့်နေတာ မမြင်ဘူးလား? မင်းကိုယ်မင်း ရေနွေးဖျောထည့်လိုက်တာ တွေ့လား? တော်တော် ဉာဏ်ကြီးတဲ့ ကောင်လေးဗျာ!', () => {
        this.respawn();
      });
    });
  }

  extinguishFurnaceAndOpenDoor() {
    // Steam deflects downwards into furnace
    for (let i = 0; i < 12; i++) {
      const puff = this.add.image(this.pipeAssembly.x + 146, this.pipeAssembly.y + 10, 'steam-puff').setDepth(30);
      this.tweens.add({
        targets: puff,
        x: this.furnaceContainer.x,
        y: this.furnaceContainer.y,
        scale: 2,
        alpha: 0,
        duration: 600,
        delay: i * 40,
        onComplete: () => puff.destroy()
      });
    }

    this.time.delayedCall(500, () => {
      soundEngine.playHiss();
      this.fireGlow.setVisible(false);
      this.fireLabel.setText('မီးငြိမ်းသွားပြီ').setColor('#22c55e');

      // Door opens
      this.doorOpen = true;
      gameState.setFlag('ch2_door_open', true);

      this.tweens.add({
        targets: this.doorSlab,
        y: -190,
        duration: 900,
        ease: 'Cubic.Out',
        onComplete: () => {
          this.doorGlow.setVisible(true);
        }
      });

      // Anti-softlock: auto-grant dried_chili if missed
      if (!gameState.hasItem('dried_chili')) {
        gameState.addItem('dried_chili');
        if (this.chiliItem) this.chiliItem.destroy();
        this.inventoryBar.refresh();
      }

      this.subtitle.say('ကွမ်းသီးညှပ်နဲ့ ရေဗူးကို လှီးတယ်တဲ့ဗျာ! ဘယ်တုန်းကမှ မကြားဖူးတဲ့ တောတွင်းနည်းပညာတွေ သုံးနေပြန်ပြီ။ မီးငြိမ်းသွားပြီး တံခါးပွင့်သွားတယ်... ဟေ့ကောင် ဖိုးထောင်၊ ငါ အံ့ဩလို့ သေတော့မယ်! (တံခါးကို နှိပ်ပြီး ဝင်ပါ)');
    });
  }

  createAmbientToys(groundY, width) {
    // 1. Rattling steam valve pipe toy
    const valve = this.add.image(width * 0.12, groundY - 160, 'item-cog').setScale(0.7).setTint(0xd97706).setDepth(16);
    MicroInteractions.attachAmbientToy(this, valve, 'pot');

    // 2. Ancient terracotta ash pot near furnace
    const ashPot = this.add.image(width * 0.68, groundY - 14, 'item-stone-3').setScale(0.85).setTint(0x78350f).setDepth(14);
    MicroInteractions.attachAmbientToy(this, ashPot, 'pot');
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
    // 1. Rusty Spike (50 viss trap)
    this.spikeItem = this.add.image(this.scale.width * 0.4, groundY - 14, 'item-rusty-spike')
      .setScale(0.55);
    MicroInteractions.makeInteractiveHover(this.spikeItem, 1.15);

    this.spikeItem.on('pointerdown', () => {
      this.interactWithProximity(this.spikeItem.x, () => {
        this.triggerRustySpikeTrap();
      });
    });

    // 2. Dried Chili
    if (!gameState.hasItem('dried_chili')) {
      this.chiliItem = this.add.image(this.scale.width * 0.58, groundY - 14, 'item-chili')
        .setScale(0.48);
      MicroInteractions.makeInteractiveHover(this.chiliItem, 1.15);

      this.chiliItem.on('pointerdown', () => {
        this.interactWithProximity(this.chiliItem.x, () => {
          MicroInteractions.pickupItemToBag(this, this.chiliItem, this.player, () => {
            gameState.addItem('dried_chili');
            this.inventoryBar.refresh();
            this.subtitle.say('ငရုတ်သီးခြောက်တောင့် ကောက်ရလိုက်ပြီ။ စပ်လိုက်မယ့်ဖြစ်ခြင်း... လွယ်အိတ်ထဲ ထည့်ထားလိုက်မယ်။');
          });
        });
      });
    }

    // 3. Dry Twigs
    if (!gameState.hasItem('dry_twigs')) {
      this.twigsItem = this.add.image(this.scale.width * 0.63, groundY - 14, 'item-twigs')
        .setScale(0.52);
      MicroInteractions.makeInteractiveHover(this.twigsItem, 1.15);

      this.twigsItem.on('pointerdown', () => {
        this.interactWithProximity(this.twigsItem.x, () => {
          MicroInteractions.pickupItemToBag(this, this.twigsItem, this.player, () => {
            gameState.addItem('dry_twigs');
            this.inventoryBar.refresh();
            this.subtitle.say('သစ်ကိုင်းခြောက်လေးတွေ ကောက်ရလိုက်ပြီ။');
          });
        });
      });
    }
  }

  triggerRustySpikeTrap() {
    if (this.isDead) return;
    this.isDead = true;

    soundEngine.playPickup();
    this.spikeItem.setVisible(false);

    // Phoe Htaung puts it in bag -> bag snaps
    this.time.delayedCall(200, () => {
      soundEngine.playClang();

      // Animate spike falling on toe
      const fallingSpike = this.add.image(this.playerX - 6, this.playerY + 10, 'item-rusty-spike').setDepth(25);
      this.tweens.add({
        targets: fallingSpike,
        y: this.playerY + 36,
        duration: 250,
        ease: 'Quad.In',
        onComplete: () => {
          soundEngine.playDeath();
          this.cameras.main.shake(300, 0.035);
          fallingSpike.destroy();
          this.player.setTexture('ph-flat');
          gameState.addDeath();
          this.hud.updateDeathCount();

          this.subtitle.say('တွေ့ကရာ အမှိုက်ကောက်တဲ့ကောင်! သံမှိုက ပိဿာ ၅၀ လေးတာကို အိတ်စုတ်ထဲ အတင်းထိုးထည့်တယ်! ခြေမ ကွဲထွက်သွားတာ မြင်ရတာ အတော် မျက်စိအေးတာပဲကွယ်... သေပေါ့!', () => {
            this.respawn();
          });
        }
      });
    });
  }

  advanceToChapter3() {
    soundEngine.playPickup();
    this.cameras.main.fade(400, 12, 10, 8);
    this.time.delayedCall(400, () => {
      this.scene.start('Chapter3Scene');
    });
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
        if (!isIdleSpecial && this.player.texture.key !== 'ph-idle' && this.player.texture.key !== 'ph-boiled' && this.player.texture.key !== 'ph-flat') {
          this.player.setTexture('ph-idle');
        }
      }
    } else {
      this.player.setAngle(0);
      const isIdleSpecial = this.player.isPerformingIdle || ['ph-mad', 'ph-think', 'ph-laugh', 'ph-bag-rummage'].includes(this.player.texture.key);
      if (!isIdleSpecial && this.player.texture.key !== 'ph-idle' && this.player.texture.key !== 'ph-boiled' && this.player.texture.key !== 'ph-flat') {
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

  respawn() {
    this.cameras.main.fade(300, 12, 10, 8);
    this.time.delayedCall(300, () => {
      this.scene.restart();
    });
  }
}
