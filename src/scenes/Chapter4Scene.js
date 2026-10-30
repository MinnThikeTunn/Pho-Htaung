import Phaser from 'phaser';
import SubtitleBox from '../ui/SubtitleBox.js';
import InventoryBar from '../ui/InventoryBar.js';
import DiegeticGrab from '../ui/DiegeticGrab';
import ThoughtBubble from '../ui/ThoughtBubble.js';
import GameHUD from '../ui/GameHUD.js';
import { gameState, BURMESE_DIGITS } from '../utils/GameState.js';
import { soundEngine } from '../utils/SoundEngine.js';
import { MicroInteractions } from '../utils/MicroInteractions.js';
import { AmbientAtmosphere } from '../utils/AmbientAtmosphere.js';

export default class Chapter4Scene extends Phaser.Scene {
  constructor() {
    super('Chapter4Scene');
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    this.cameras.main.fadeIn(400, 12, 10, 8);

    this.isDead = false;
    gameState.setCurrentScene('Chapter4Scene');
    this.safeUnlocked = gameState.getFlag('ch4_safe_unlocked');
    this.dials = [0, 0, 0];
    this.targetX = null;
    this.blueprintOpen = false;
    this.lastMoveTime = 0;
    this.nextIdleTime = 4500;

    // 1. Vault Chamber Atmosphere Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1c1713, 0x1c1713, 0x0a0807, 0x0a0807, 1);
    bg.fillRect(0, 0, width, height);

    this.createChamberDecor(width, height);

    // Ground line - Unified exact Chapter 1 Baseline (576px on 1280x720)
    const groundY = Math.round(height * 0.80);
    this.groundY = groundY;
    const ground = this.add.rectangle(width / 2, groundY + 60, width, 120, 0x18120e);
    this.physics.add.existing(ground, true);

    // 2. Sphinx Riddle on the Wall (Left side)
    this.createRiddleWall(width * 0.28, 140);

    // 3. Giant Iron Safe with Dials and Keyhole (Center-Right)
    this.safeX = width * 0.68;
    this.safeY = groundY - 140;
    this.createIronSafe(this.safeX, this.safeY);

    // 4. Phoe Htaung Player Character (Left of Safe)
    this.playerBaseScale = 1.42;
    this.playerX = width * 0.44;
    this.playerY = groundY - 58;
    this.player = this.add.sprite(this.playerX, this.playerY, 'ph-idle').setScale(this.playerBaseScale).setDepth(30);

    // Point-and-click walking
    this.input.on('pointerdown', (pointer) => {
      if (this.blueprintOpen) return;
      if (pointer.y > groundY - 100 && pointer.y < groundY + 80) {
        this.targetX = pointer.x;
        this.pendingAction = null;
        MicroInteractions.spawnClickMarker(this, pointer.x, groundY - 20);
      }
    });

    // 5. HUD & Auto-Hiding Inventory Bar & Thought Bubble & DiegeticGrab
    this.hud = new GameHUD(this);
    this.thought = new ThoughtBubble(this);
    this.inventoryBar = new InventoryBar(this, (combined) => {});
    this.subtitle = new SubtitleBox(this);

    this.diegeticGrab = new DiegeticGrab(this, {
      inventoryBar: this.inventoryBar,
      player: this.player,
      speak: (text, duration) => this.subtitle.say(text),
      onAutoWalk: (targetX, onReach) => this.interactWithProximity(targetX, onReach)
    });

    // 6. Tool Pickups (Engineer's Secret Note via DiegeticGrab)
    this.createFloorItems(groundY);

    // 7. Floating Dust Motes & Cavern Drips & Atmosphere Overlays
    AmbientAtmosphere.createDustMotes(this, 24);
    AmbientAtmosphere.startCavernDrips(this, groundY);
    AmbientAtmosphere.createWeatheredOverlay(this);
    AmbientAtmosphere.createForegroundSilhouettes(this, 'canyon');
    AmbientAtmosphere.createVolumetricRays(this, width * 0.68, 0);

    // 8. Ambient Toys (Machinarium Juice)
    this.createAmbientToys(groundY, width);

    // Natural Signifiers
    AmbientAtmosphere.startNaturalSignifiers(this, [this.noteItem, this.safeContainer, this.keyholeHitZone]);

    // Universal verb E for proximity pickup
    this.input.keyboard?.on('keydown-E', () => {
      if (this.isDead || this.blueprintOpen) return;
      this.diegeticGrab.handleProximityVerb(this.player.x, this.player.y);
    });

    // Screen Vignette
    this.add.image(width / 2, height / 2, 'screen-vignette')
      .setDisplaySize(width, height)
      .setDepth(150)
      .setAlpha(0.65);

    // Entry Dialogue
    this.time.delayedCall(400, () => {
      this.subtitle.say('အမလေး... သံမဏိ သေတ္တာကြီးက တစ်တုံးလုံး တစ်ခဲနက်ပါလား! နံရံမှာ စကားထာ ရေးထားတယ်... သေတ္တာမှာတော့ ဂဏန်း ၃ လုံး လှည့်တဲ့ ဒိုင်ခွက်နဲ့ သော့ပေါက် ပါတယ်ဗျာ။');
    });
  }

  createChamberDecor(width, height) {
    const decor = this.add.graphics();

    const wallGroundY = this.groundY || Math.round(height * 0.80);
    // 1. Bolted Iron Bulkhead Walls with Rust Streaks
    decor.fillStyle(0x191410, 0.98);
    decor.fillRect(0, 0, width, wallGroundY);

    // Bulkhead seams
    decor.lineStyle(2, 0x334155, 0.85);
    for (let bx = 0; bx < width; bx += 110) {
      decor.strokeRect(bx, 0, 108, wallGroundY);

      // Industrial hex bolts along seams
      decor.fillStyle(0x475569, 1);
      for (let by = 30; by < wallGroundY; by += 40) {
        decor.fillCircle(bx + 4, by, 3);
        decor.fillCircle(bx + 104, by, 3);
      }
    }

    // Rust streaks running down from seams
    decor.fillStyle(0x78350f, 0.3);
    for (let rx = 55; rx < width; rx += 110) {
      decor.fillRect(rx, 20, 10, 80);
      decor.fillRect(rx + 2, 90, 6, 45);
    }

    // 2. Yellow & Charcoal Industrial Hazard Warning Stripes (Along ceiling & base)
    const stripeW = 16;
    for (let x = 0; x < width; x += stripeW * 2) {
      decor.fillStyle(0xeab308, 0.75); // caution yellow
      decor.beginPath();
      decor.moveTo(x, 0);
      decor.lineTo(x + stripeW, 0);
      decor.lineTo(x, 16);
      decor.closePath();
      decor.fill();

      decor.beginPath();
      decor.moveTo(x + stripeW, 0);
      decor.lineTo(x + stripeW * 2, 0);
      decor.lineTo(x + stripeW, 16);
      decor.lineTo(x, 16);
      decor.closePath();
      decor.fillStyle(0x0f172a, 0.85); // hazard charcoal
      decor.fill();
    }

    // 3. Exposed Clockwork Cavity inside Wall (Steampunk gears)
    const gearX = width * 0.12;
    const gearY = height * 0.38;
    decor.fillStyle(0x0c0a09, 1);
    decor.fillCircle(gearX, gearY, 42);
    decor.lineStyle(3, 0x475569, 1);
    decor.strokeCircle(gearX, gearY, 42);

    // Brass gear inside cavity
    decor.fillStyle(0xd97706, 0.85);
    decor.fillCircle(gearX, gearY, 26);
    decor.fillStyle(0x0c0a09, 1);
    decor.fillCircle(gearX, gearY, 10);
    // Gear teeth
    decor.fillStyle(0xd97706, 0.85);
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
      const gx = gearX + Math.cos(a) * 30;
      const gy = gearY + Math.sin(a) * 30;
      decor.fillCircle(gx, gy, 5);
    }

    // 4. Dangling Caged Industrial Trouble-Light with Gentle Sway
    const lampX = width * 0.68;
    const lamp = this.add.container(lampX, 0).setDepth(20);

    const wire = this.add.graphics();
    wire.lineStyle(2, 0x1e293b, 1);
    wire.lineBetween(0, 0, 0, 110);

    // Protective wire cage & bulb
    const cage = this.add.graphics();
    cage.fillStyle(0x334155, 1);
    cage.fillRect(-10, 110, 20, 24);
    cage.lineStyle(1.5, 0x64748b, 1);
    cage.strokeRect(-10, 110, 20, 24);

    // Glowing incandescent filament
    cage.fillStyle(0xf59e0b, 1);
    cage.fillCircle(0, 122, 6);
    cage.fillStyle(0xfef08a, 1);
    cage.fillCircle(0, 122, 3);

    // Warm radial light cone
    const lampGlow = this.add.graphics();
    lampGlow.fillStyle(0xf59e0b, 0.12);
    lampGlow.fillCircle(0, 122, 110);

    lamp.add([wire, cage, lampGlow]);

    this.tweens.add({
      targets: lamp,
      angle: { from: -2.5, to: 2.5 },
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // 5. Diamond-Plate Steel Industrial Decking Floor
    const groundY = this.groundY || Math.round(height * 0.80);
    const floorDetail = this.add.graphics().setDepth(3);
    floorDetail.fillStyle(0x241d18, 1);
    floorDetail.fillRect(0, groundY, width, 18);
    floorDetail.lineStyle(1.5, 0x0f172a, 0.85);
    for (let fx = 0; fx < width; fx += 50) {
      floorDetail.strokeRect(fx, groundY, 48, 18);
      // Diamond criss-cross embossing
      floorDetail.lineBetween(fx + 10, groundY + 4, fx + 16, groundY + 14);
      floorDetail.lineBetween(fx + 24, groundY + 4, fx + 30, groundY + 14);
    }
  }

  createRiddleWall(x, y) {
    const plaque = this.add.container(x, y).setDepth(15);

    const bg = this.add.graphics();
    bg.fillStyle(0x231a14, 0.95);
    bg.fillRoundedRect(-160, -70, 320, 140, 16);
    bg.lineStyle(2, 0xd97706, 0.8);
    bg.strokeRoundedRect(-160, -70, 320, 140, 16);
    plaque.add(bg);

    const title = this.add.text(0, -48, '📜 ရှေးဟောင်း စကားထာ ကျောက်စာ', {
      fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#f59e0b'
    }).setOrigin(0.5);
    plaque.add(title);

    const riddle = this.add.text(0, 8, '“နံနက်တွင် ခြေ ၄ ချောင်း၊\nနေ့လယ်တွင် ခြေ ၂ ချောင်း၊\nညနေတွင် ခြေ ၃ ချောင်း\nဖြစ်သော သတ္တဝါကား အဘယ်နည်း?”', {
      fontFamily: 'Noto Sans Myanmar, Pyidaungsu',
      fontSize: '13px',
      color: '#fef08a',
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5);
    plaque.add(riddle);
  }

  createIronSafe(x, y) {
    this.safeContainer = this.add.container(x, y).setDepth(20);

    // Safe Body
    this.safeBody = this.add.graphics();
    this.safeBody.fillStyle(0x334155, 1);
    this.safeBody.fillRoundedRect(-110, -130, 220, 260, 20);
    this.safeBody.lineStyle(4, 0x0f172a, 1);
    this.safeBody.strokeRoundedRect(-110, -130, 220, 260, 20);
    this.safeContainer.add(this.safeBody);

    const lockIcon = this.add.image(0, -84, 'icon-lock').setScale(0.5).setAlpha(0.9);
    this.safeContainer.add(lockIcon);

    // Safe Circular Vault Door
    this.vaultDoor = this.add.container(0, 0);
    const vaultPlate = this.add.graphics();
    vaultPlate.fillStyle(0x475569, 1);
    vaultPlate.fillCircle(0, 0, 85);
    vaultPlate.lineStyle(3, 0x1e293b, 1);
    vaultPlate.strokeCircle(0, 0, 85);

    // Golden Passageway inside safe (visible when opened)
    this.safeInsideGlow = this.add.graphics();
    this.safeInsideGlow.fillStyle(0xf59e0b, 1);
    this.safeInsideGlow.fillCircle(0, 0, 80);
    this.safeInsideGlow.setVisible(this.safeUnlocked);
    this.safeContainer.add(this.safeInsideGlow);

    // Keyhole
    this.keyholeG = this.add.graphics();
    this.keyholeG.fillStyle(0x0f172a, 1);
    this.keyholeG.fillCircle(0, 40, 10);
    this.keyholeG.fillRect(-4, 40, 8, 22);

    // Keyhole Hit Zone (for dragging dried chili)
    this.keyholeHitZone = this.add.rectangle(0, 48, 44, 44, 0x00ff00, 0.001)
      .setInteractive({ useHandCursor: true });

    this.keyholeHitZone.on('pointerdown', () => {
      this.interactWithProximity(this.safeX - 35, () => {
        this.handleKeyholeClick();
      });
    });

    this.vaultDoor.add([vaultPlate, this.keyholeG, this.keyholeHitZone]);
    this.safeContainer.add(this.vaultDoor);

    // 3-Digit Rotary Dials [D1] [D2] [D3]
    this.dialTexts = [];
    const dialXOffsets = [-48, 0, 48];

    for (let i = 0; i < 3; i++) {
      const dx = dialXOffsets[i];
      const dy = -25;

      // Dial frame (Heavy brass Machinarium tumbler)
      const dialBox = this.add.graphics();
      dialBox.fillStyle(0x0f172a, 1);
      dialBox.fillRoundedRect(dx - 18, dy - 26, 36, 52, 8);
      dialBox.lineStyle(1.8, 0xd97706, 1);
      dialBox.strokeRoundedRect(dx - 18, dy - 26, 36, 52, 8);
      this.safeContainer.add(dialBox);

      // Dial number text with Burmese numeral pair
      const dText = this.add.text(dx, dy, `0\n၀`, {
        fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans',
        fontSize: '14px',
        fontStyle: '900',
        align: 'center',
        color: '#fde047'
      }).setOrigin(0.5);
      this.safeContainer.add(dText);
      this.dialTexts.push(dText);

      // Up arrow button
      const upBtn = this.add.text(dx, dy - 34, '▲', {
        fontSize: '12px',
        color: '#94a3b8'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      upBtn.on('pointerdown', () => {
        this.interactWithProximity(this.safeX - 45, () => {
          this.changeDial(i, 1);
        });
      });
      this.safeContainer.add(upBtn);

      // Down arrow button
      const downBtn = this.add.text(dx, dy + 34, '▼', {
        fontSize: '12px',
        color: '#94a3b8'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      downBtn.on('pointerdown', () => {
        this.interactWithProximity(this.safeX - 45, () => {
          this.changeDial(i, -1);
        });
      });
      this.safeContainer.add(downBtn);
    }

    // Submit / Open Handle Button
    this.handleBtn = this.add.container(0, 105).setSize(130, 36).setInteractive({ useHandCursor: true });
    const hBg = this.add.graphics();
    hBg.fillStyle(0x0284c7, 1);
    hBg.fillRoundedRect(-65, -18, 130, 36, 18);
    hBg.lineStyle(1.5, 0x38bdf8, 1);
    hBg.strokeRoundedRect(-65, -18, 130, 36, 18);

    const hLabel = this.add.text(0, 0, '🔓 ဖွင့်မည် (Pull)', {
      fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.handleBtn.add([hBg, hLabel]);
    MicroInteractions.makeInteractiveHover(this.handleBtn, 1.05);
    this.safeContainer.add(this.handleBtn);

    this.handleBtn.on('pointerdown', () => {
      this.interactWithProximity(this.safeX - 45, () => {
        this.submitCode();
      });
    });

    if (this.safeUnlocked) {
      this.vaultDoor.setVisible(false);
      this.handleBtn.setVisible(false);
    }
  }

  changeDial(index, delta) {
    if (this.safeUnlocked || this.isDead) return;
    this.dials[index] = (this.dials[index] + delta + 10) % 10;
    this.dialTexts[index].setText(`${this.dials[index]}\n${BURMESE_DIGITS[this.dials[index]]}`);
    soundEngine.playGearClick();
  }

  submitCode() {
    if (this.isDead || this.safeUnlocked) return;

    soundEngine.playClang();

    // Check code
    const code = `${this.dials[0]}-${this.dials[1]}-${this.dials[2]}`;

    if (code === '4-2-3') {
      // Trap 1: The Sphinx Riddle Hater!
      this.triggerScissorTrap();
    } else {
      MicroInteractions.triggerDenial(
        this,
        this.safeContainer,
        this.player,
        'မှားတယ်ဟေ့! စာလေးဘာလေး ဖတ်ပါဦးလား! ပုံကြမ်းစာရွက်ထဲက သတိပေးချက်ကို သေချာ ကြည့်စမ်းပါ!',
        'item-engineer-note',
        this.thought,
        this.subtitle
      );
    }
  }

  triggerScissorTrap() {
    this.isDead = true;

    // Giant scissors burst out from safe bottom!
    soundEngine.playScissors();

    const scissorL = this.add.graphics().setDepth(35);
    scissorL.fillStyle(0x94a3b8, 1);
    scissorL.lineStyle(3, 0x334155, 1);

    // Animate scissors snapping forward towards Phoe Htaung's legs
    const scissorImg = this.add.image(this.safeX - 60, this.playerY + 28, 'item-betel-cutter')
      .setScale(2)
      .setAngle(-45)
      .setDepth(35);

    this.tweens.add({
      targets: scissorImg,
      x: this.playerX + 15,
      duration: 180,
      ease: 'Quad.In',
      onComplete: () => {
        soundEngine.playScissors();
        soundEngine.playDeath();
        this.cameras.main.shake(300, 0.035);

        this.player.setTexture('ph-cut-legs');
        scissorImg.destroy();
        gameState.addDeath();
        this.hud.updateDeathCount();

        this.subtitle.say('နံပါတ် ၄-၂-၃... စကားထာ အဖြေမှန်ပေါ့ဗျာ။ လူ ဆိုတဲ့ သတ္တဝါပေါ့! ကဲ... သေတ္တာ ပွင့်ပြီလား ကြည့်ရအောင်... ဟားဟားဟား! သေတ္တာလုပ်တဲ့ ရှေးလူကြီးက အဲဒီစကားထာကို မုန်းလွန်းလို့ အဲဒီနံပါတ် ရိုက်ထည့်ရင် ခြေထောက်ဖြတ်တဲ့ ကတ်ကြေး ထည့်ထားတာကွဲ့! မင်း အခုတော့ ခြေထောက် မရှိတော့ဘူး... ညနေခင်း ခြေ ၃ ချောင်းတောင် မဖြစ်နိုင်တော့ဘူး!', () => {
          this.respawn();
        });
      }
    });
  }

  handleKeyholeClick() {
    if (this.isDead || this.safeUnlocked) return;

    const selected = this.inventoryBar.getSelected();
    if (selected === 'dried_chili') {
      this.triggerChiliSneezeUnlock();
    } else if (selected) {
      MicroInteractions.triggerSootPuff(this, this.player, () => {
        this.subtitle.say('ဒါကို သော့ပေါက်ထဲ ထိုးထည့်လို့ မရဘူးဟေ့! မီးခိုးတွေ မင်းမျက်နှာထဲ မှုတ်ထုတ်လိုက်ပြီ!');
      });
    } else {
      this.subtitle.say('သော့ပေါက်ကြီး ဟောင်းလောင်း ဖြစ်နေတယ်။ ပုံကြမ်းထဲကလို ငရုတ်သီးနဲ့ စမ်းသပ်ကြည့်ရင် ကောင်းမလား?');
    }
  }

  triggerChiliSneezeUnlock() {
    this.safeUnlocked = true;
    gameState.setFlag('ch4_safe_unlocked', true);
    gameState.removeItem('dried_chili');
    this.inventoryBar.clearSelected();
    this.inventoryBar.refresh();

    soundEngine.playPickup();

    // Safe turns red and shakes violently
    this.safeBody.clear();
    this.safeBody.fillStyle(0xef4444, 1);
    this.safeBody.fillRoundedRect(-110, -130, 220, 260, 20);
    this.safeBody.lineStyle(4, 0x991b1b, 1);
    this.safeBody.strokeRoundedRect(-110, -130, 220, 260, 20);

    // Coughing sfx
    soundEngine.playSneeze();
    this.cameras.main.shake(400, 0.02);

    this.time.delayedCall(400, () => {
      soundEngine.playSneeze();
      this.cameras.main.shake(400, 0.03);

      this.time.delayedCall(500, () => {
        // Big sneeze: Lock cylinder blows right off!
        soundEngine.playClang();
        soundEngine.playPickup();

        this.tweens.add({
          targets: this.vaultDoor,
          x: 200,
          y: -80,
          angle: 120,
          alpha: 0,
          duration: 400,
          ease: 'Quad.Out',
          onComplete: () => {
            this.vaultDoor.setVisible(false);
          }
        });

        this.safeInsideGlow.setVisible(true);
        this.handleBtn.setVisible(false);

        // Clickable passageway to Chapter 5
        const exitHit = this.add.circle(0, 0, 80, 0x000000, 0.001)
          .setInteractive({ useHandCursor: true });

        exitHit.on('pointerdown', () => {
          this.advanceToChapter5();
        });
        this.safeContainer.add(exitHit);

        this.subtitle.say('ဟောဗျာ... ငရုတ်သီးခြောက်တောင့်ကို သော့ပေါက်ထဲ သွားထိုးတယ်! သေတ္တာက ငရုတ်သီးစပ်ပြီး ချောင်းတွေဆိုး၊ သော့ကလန့် ပြုတ်ကျသွားတယ်ဗျို့! ဒီကောင့် ဆေးမြီးတို နည်းတွေကတော့ ကမ္ဘာ့အံ့ဖွယ် စာရင်းထဲ သွင်းရတော့မယ်! (ရွှေရောင် လမ်းကြောင်းထဲ နှိပ်ပြီး ဝင်ပါ)');
      });
    });
  }

  advanceToChapter5() {
    soundEngine.playPickup();
    this.cameras.main.fade(400, 12, 10, 8);
    this.time.delayedCall(400, () => {
      this.scene.start('Chapter5Scene');
    });
  }

  createAmbientToys(groundY, width) {
    // 1. Clockwork Wall Cavity Gear Toy
    const gearToy = this.add.image(width * 0.12, this.scale.height * 0.38, 'item-cog').setScale(0.8).setTint(0xf59e0b).setDepth(14);
    MicroInteractions.attachAmbientToy(this, gearToy, 'pot');

    // 2. Heavy iron scrap bucket / pot
    const ironUrn = this.add.image(width * 0.22, groundY - 16, 'item-stone-3').setScale(0.9).setTint(0x475569).setDepth(14);
    MicroInteractions.attachAmbientToy(this, ironUrn, 'pot');
  }

  interactWithProximity(targetX, onReachCallback) {
    if (this.isDead || this.blueprintOpen) return;
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
    if (!gameState.hasItem('engineer_note')) {
      this.noteItem = this.diegeticGrab.createPickup({
        id: 'engineer_note',
        x: this.scale.width * 0.38,
        y: groundY - 14,
        textureKey: 'item-engineer-note',
        scale: 0.5,
        hoverScale: 0.58,
        onBagged: () => {
          gameState.addItem('engineer_note');
          this.inventoryBar.refresh();
          this.showBlueprintOverlay();
        }
      });
    }
  }

  showBlueprintOverlay() {
    if (this.blueprintContainer) {
      this.blueprintContainer.destroy();
    }
    this.blueprintOpen = true;
    soundEngine.playPaper();

    const width = this.scale.width;
    const height = this.scale.height;

    this.blueprintContainer = this.add.container(width / 2, height / 2).setDepth(300);

    const dim = this.add.rectangle(0, 0, width, height, 0x000000, 0.65)
      .setInteractive({ useHandCursor: true });

    dim.on('pointerdown', () => {
      this.closeBlueprintOverlay();
    });

    const blueprintImg = this.add.image(0, 0, 'note-overlay')
      .setScale(1.15)
      .setInteractive({ useHandCursor: true });

    blueprintImg.on('pointerdown', () => {
      this.closeBlueprintOverlay();
    });

    // Close Pill Button
    const closeBtn = this.add.container(0, 165).setSize(140, 36);
    const cBg = this.add.graphics();
    cBg.fillStyle(0x271e17, 0.95);
    cBg.fillRoundedRect(-70, -18, 140, 36, 18);
    cBg.lineStyle(1.5, 0xd97706, 0.85);
    cBg.strokeRoundedRect(-70, -18, 140, 36, 18);

    const cText = this.add.text(0, 0, '❌ ပိတ်မည်', {
      fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans, sans-serif',
      fontSize: '12px',
      fontStyle: '900',
      color: '#ffffff'
    }).setOrigin(0.5);

    closeBtn.add([cBg, cText]);
    closeBtn.setInteractive({ useHandCursor: true });
    MicroInteractions.makeInteractiveHover(closeBtn, 1.08);
    closeBtn.on('pointerdown', () => this.closeBlueprintOverlay());

    this.blueprintContainer.add([dim, blueprintImg, closeBtn]);

    this.subtitle.say('အင်ဂျင်နီယာ ရေးဆွဲထားတဲ့ လျှို့ဝှက်ပုံကြမ်းပဲ! ၄-၂-၃ ဆိုတဲ့ စကားထာအဖြေက ကတ်ကြေးထောင်ချောက်တဲ့ဗျာ! ငရုတ်သီးနဲ့မှ သော့ခလောက် ပြုတ်ကျမှာတဲ့!');
  }

  closeBlueprintOverlay() {
    if (this.blueprintContainer) {
      soundEngine.playPaper();
      this.blueprintContainer.destroy();
      this.blueprintContainer = null;
    }
    this.blueprintOpen = false;
  }

  update(time, delta) {
    if (this.isDead || this.blueprintOpen) return;
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
        if (!isIdleSpecial && this.player.texture.key !== 'ph-idle' && this.player.texture.key !== 'ph-cut-legs' && this.player.texture.key !== 'ph-flat') {
          this.player.setTexture('ph-idle');
        }
      }
    } else {
      this.player.setAngle(0);
      const isIdleSpecial = this.player.isPerformingIdle || ['ph-mad', 'ph-think', 'ph-laugh', 'ph-bag-rummage'].includes(this.player.texture.key);
      if (!isIdleSpecial && this.player.texture.key !== 'ph-idle' && this.player.texture.key !== 'ph-cut-legs' && this.player.texture.key !== 'ph-flat') {
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
