import Phaser from 'phaser';
import SubtitleBox from '../ui/SubtitleBox.js';
import GameHUD from '../ui/GameHUD.js';
import { gameState } from '../utils/GameState.js';
import { soundEngine } from '../utils/SoundEngine.js';
import { MicroInteractions } from '../utils/MicroInteractions.js';
import { AmbientAtmosphere } from '../utils/AmbientAtmosphere.js';

export default class Chapter5Scene extends Phaser.Scene {
  constructor() {
    super('Chapter5Scene');
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    this.isCrushed = false;
    gameState.setCurrentScene('Chapter5Scene');

    // 1. Lavish Glittering Golden Hall Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x78350f, 0x78350f, 0x1c120c, 0x1c120c, 1);
    bg.fillRect(0, 0, width, height);

    this.createGoldenHall(width, height);

    const groundY = height - 120;
    const ground = this.add.rectangle(width / 2, groundY + 60, width, 120, 0x451a03);
    this.physics.add.existing(ground, true);

    // 2. Massive Mountain of Gold Coins & Glowing Treasure Chest
    const treasureX = width * 0.65;
    const treasureY = groundY - 50;
    this.createTreasurePile(treasureX, treasureY);

    // 3. Phoe Htaung Character (Left side, excited)
    this.playerX = width * 0.28;
    this.playerY = groundY - 42;
    this.player = this.add.sprite(this.playerX, this.playerY, 'ph-idle').setDepth(20);

    // 4. Floating Golden Dust Motes & Perplexity GameHUD
    AmbientAtmosphere.createDustMotes(this, 30);
    this.hud = new GameHUD(this);

    // 5. Subtitle Box
    this.subtitle = new SubtitleBox(this);

    // Vignette
    this.add.image(width / 2, height / 2, 'screen-vignette')
      .setDisplaySize(width, height)
      .setDepth(150)
      .setAlpha(0.5);

    // Sparkle particles
    this.createSparkles(width, height);

    // Entry Dialogue
    this.time.delayedCall(400, () => {
      this.subtitle.say('နောက်ဆုံးတော့... မောင်ဖိုးထောင်တစ်ယောက် ရွှေမြို့တော် ဗဟိုချက်မကို ရောက်လာခဲ့ပြီဗျာ! ဟောဒီမှာ ကြည့်စမ်း... ရွှေတွေ၊ ငွေတွေ၊ စိန်ရတနာတွေ ပုံလိုက်ကြီးပဲ! မင်း ချမ်းသာပြီ ဖိုးထောင်ရေ! ပြေးစမ်း... ပြေးယူလိုက်စမ်း! (ရတနာပုံကို နှိပ်ပါ)');
    });
  }

  createGoldenHall(width, height) {
    const decor = this.add.graphics();

    // 1. Gilded Royal Palace Wall & Kanok Floral Arches
    decor.fillStyle(0x451a03, 0.95);
    decor.fillRect(0, 0, width, height - 120);

    // Gilded Wall Panels & Trim
    decor.lineStyle(2, 0xd97706, 0.8);
    for (let px = 60; px < width - 60; px += 100) {
      decor.strokeRect(px, 30, 96, height - 180);
      decor.fillStyle(0xf59e0b, 0.15);
      decor.fillRect(px + 4, 34, 88, height - 188);
    }

    // Grand Gilded Royal Pillars
    const drawGoldPillar = (px) => {
      decor.fillStyle(0xb45309, 1);
      decor.fillRect(px - 25, 0, 50, height - 120);
      decor.fillStyle(0xf59e0b, 0.95);
      decor.fillRect(px - 20, 0, 40, height - 120);
      decor.fillStyle(0xfef08a, 0.8);
      decor.fillRect(px - 8, 0, 16, height - 120); // gleaming specular streak

      // Pillar capital & base
      decor.fillStyle(0xd97706, 1);
      decor.fillRect(px - 32, 0, 64, 25);
      decor.fillRect(px - 30, height - 150, 60, 30);
      decor.lineStyle(2, 0x78350f, 1);
      decor.strokeRect(px - 32, 0, 64, 25);
      decor.strokeRect(px - 30, height - 150, 60, 30);
    };

    drawGoldPillar(70);
    drawGoldPillar(width - 70);

    // 2. Royal Crimson Velvet Curtains (ကတ္တီပါခန်းဆီးကြီးများ) with Gold Fringe
    decor.fillStyle(0x7f1d1d, 0.95);
    // Left curtain drape
    decor.beginPath();
    decor.moveTo(0, 0);
    decor.lineTo(240, 0);
    decor.lineTo(210, 80);
    decor.lineTo(190, 160);
    decor.lineTo(185, 240);
    decor.lineTo(110, 220);
    decor.lineTo(0, 260);
    decor.closePath();
    decor.fill();

    // Right curtain drape
    decor.beginPath();
    decor.moveTo(width, 0);
    decor.lineTo(width - 240, 0);
    decor.lineTo(width - 210, 80);
    decor.lineTo(width - 190, 160);
    decor.lineTo(width - 185, 240);
    decor.lineTo(width - 110, 220);
    decor.lineTo(width, 260);
    decor.closePath();
    decor.fill();

    // Gold braided rope & tassels
    decor.lineStyle(3, 0xf59e0b, 1);
    decor.beginPath();
    decor.moveTo(220, 0);
    decor.lineTo(200, 80);
    decor.lineTo(190, 160);
    decor.lineTo(185, 240);
    decor.stroke();

    decor.beginPath();
    decor.moveTo(width - 220, 0);
    decor.lineTo(width - 200, 80);
    decor.lineTo(width - 190, 160);
    decor.lineTo(width - 185, 240);
    decor.stroke();

    // Gold tassels
    decor.fillStyle(0xfbbf24, 1);
    decor.fillCircle(190, 240, 8);
    decor.fillCircle(width - 190, 240, 8);

    // 3. Volumetric Golden God Rays from Palace Skylight
    const rays = this.add.graphics().setDepth(2);
    rays.fillStyle(0xfde047, 0.09);
    rays.beginPath();
    rays.moveTo(width / 2, 0);
    rays.lineTo(width * 0.45, height - 120);
    rays.lineTo(width * 0.85, height - 120);
    rays.closePath();
    rays.fill();

    // 4. Magnificent Crystal & Gold Palace Chandelier
    const chand = this.add.graphics().setDepth(10);
    chand.lineStyle(2, 0xd97706, 1);
    chand.lineBetween(width / 2, 0, width / 2, 45);

    // Tiered chandelier arms
    chand.fillStyle(0xf59e0b, 1);
    chand.fillRect(width / 2 - 40, 45, 80, 8);
    chand.fillRect(width / 2 - 25, 55, 50, 6);

    // Radiant glowing crystal bulbs
    chand.fillStyle(0xfef08a, 1);
    for (let cx = width / 2 - 35; cx <= width / 2 + 35; cx += 18) {
      chand.fillCircle(cx, 49, 4);
    }
    chand.fillCircle(width / 2, 65, 8);

    // Chandelier warm ambient glow
    const chGlow = this.add.graphics().setDepth(3);
    chGlow.fillStyle(0xf59e0b, 0.15);
    chGlow.fillCircle(width / 2, 65, 90);
  }

  createSparkles(width, height) {
    for (let i = 0; i < 20; i++) {
      const sparkle = this.add.text(
        Phaser.Math.Between(width * 0.4, width * 0.9),
        Phaser.Math.Between(height * 0.3, height - 140),
        '✨',
        { fontSize: `${Phaser.Math.Between(14, 26)}px` }
      ).setAlpha(0);

      this.tweens.add({
        targets: sparkle,
        alpha: { from: 0, to: 0.9 },
        scale: { from: 0.6, to: 1.2 },
        duration: Phaser.Math.Between(600, 1200),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 1500)
      });
    }
  }

  createTreasurePile(x, y) {
    this.treasureContainer = this.add.container(x, y).setDepth(15);

    // Mountain of gold
    const goldG = this.add.graphics();
    goldG.fillStyle(0xeab308, 1);
    goldG.fillEllipse(0, 30, 280, 100);

    // Shimmer layers
    goldG.fillStyle(0xfde047, 0.9);
    goldG.fillEllipse(0, 20, 220, 70);

    // Glowing Chest on top of gold
    const chest = this.add.graphics();
    chest.fillStyle(0x78350f, 1);
    chest.fillRoundedRect(-35, -20, 70, 45, 6);
    chest.lineStyle(3, 0xfacc15, 1);
    chest.strokeRoundedRect(-35, -20, 70, 45, 6);

    // Glowing light from inside chest
    const chestLight = this.add.graphics();
    chestLight.fillStyle(0xfef08a, 0.95);
    chestLight.fillCircle(0, -5, 14);

    this.tweens.add({
      targets: chestLight,
      scale: 1.3,
      alpha: 0.7,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    const bannerText = this.add.text(0, -50, '👑 မဟာရတနာသိုက်', {
      fontFamily: 'Noto Sans Myanmar',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#fef08a'
    }).setOrigin(0.5);

    const chestIcon = this.add.image(0, 0, 'icon-chest').setScale(0.85);

    const hitZone = this.add.rectangle(0, 0, 240, 120, 0x000000, 0.001)
      .setInteractive({ useHandCursor: true });
    MicroInteractions.makeInteractiveHover(this.treasureContainer, 1.05);

    hitZone.on('pointerdown', () => {
      this.claimTreasureTrap();
    });

    this.treasureContainer.add([goldG, chest, chestLight, chestIcon, bannerText, hitZone]);
  }

  claimTreasureTrap() {
    if (this.isCrushed) return;
    this.isCrushed = true;

    // Phoe Htaung rushes ecstatically to the treasure!
    this.player.setAngle(5);
    const dustTimer = this.time.addEvent({
      delay: 130,
      repeat: 4,
      callback: () => {
        soundEngine.playFootstep();
        this.player.setTexture(this.player.texture.key === 'ph-walk-1' ? 'ph-walk-2' : 'ph-walk-1');
        MicroInteractions.spawnFootstepDust(this, this.player.x, this.player.y, 1);
      }
    });

    this.tweens.add({
      targets: this.player,
      x: this.treasureContainer.x - 30,
      duration: 650,
      ease: 'Quad.Out',
      onComplete: () => {
        dustTimer.destroy();
        this.player.setAngle(0);
        this.player.setTexture('ph-idle');

        // Stop BGM for maximum comedic impact
        soundEngine.stopBGM();

        // Triumphant Fanfare plays!
        soundEngine.playVictoryFanfare();

        // 1.5s delay before the troll crash
        this.time.delayedCall(1400, () => {
          this.dropVictoryBlock();
        });
      }
    });
  }

  dropVictoryBlock() {
    // 50-Ton "VICTORY!" Stone Block drops with vy = 2500 px/s!
    const targetY = this.playerY + 10;
    const victoryBlock = this.add.image(this.player.x, -120, 'victory-block')
      .setDepth(50);

    this.tweens.add({
      targets: victoryBlock,
      y: targetY,
      duration: 220,
      ease: 'Linear',
      onComplete: () => {
        soundEngine.playDeath();
        this.cameras.main.shake(450, 0.05);

        // Phoe Htaung crushed flat
        this.player.setTexture('ph-flat').setY(targetY + 15);

        gameState.addDeath();
        this.hud.updateDeathCount();

        this.time.delayedCall(400, () => {
          this.subtitle.say('ကျွတ်... ကျွတ်... ကျွတ်! သနားစရာ ကောင်းလိုက်တာ ဖိုးထောင်ရယ်။ "VICTORY" ဆိုတဲ့ စာတန်းကြီးနဲ့ ဖိသတ်ခံရတာ ဇာတ်သိမ်း အရသာ ရှိရဲ့လားကွဲ့?', () => {
            // Cutscene Transition to SCENE 6: THE BIG REVEAL
            this.time.delayedCall(600, () => {
              this.cameras.main.fade(600, 12, 10, 8);
              this.time.delayedCall(600, () => {
                this.scene.start('RevealScene');
              });
            });
          });
        });
      }
    });
  }
}
