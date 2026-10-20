import Phaser from 'phaser';
import SubtitleBox from '../ui/SubtitleBox.js';
import { gameState } from '../utils/GameState.js';
import { soundEngine } from '../utils/SoundEngine.js';
import { AmbientAtmosphere } from '../utils/AmbientAtmosphere.js';
import { MicroInteractions } from '../utils/MicroInteractions.js';

export default class IntroScene extends Phaser.Scene {
  constructor() {
    super('IntroScene');
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    // 1. Atmosphere Background & Tropical Dawn Sky
    this.bg = this.add.graphics();
    // Sky gradient: Deep twilight navy into morning amber & misty gold
    this.bg.fillGradientStyle(0x0a0f1d, 0x0a0f1d, 0x3b1d11, 0x5c2b0e, 1);
    this.bg.fillRect(0, 0, width, height);

    // 2. Distant Mist-shrouded Mountain Ranges
    const mountains = this.add.graphics();
    // Far mountains (cool purplish slate)
    mountains.fillStyle(0x1a1c2e, 0.7);
    mountains.beginPath();
    mountains.moveTo(0, height * 0.55);
    mountains.lineTo(width * 0.15, height * 0.42);
    mountains.lineTo(width * 0.35, height * 0.52);
    mountains.lineTo(width * 0.5, height * 0.38);
    mountains.lineTo(width * 0.7, height * 0.48);
    mountains.lineTo(width * 0.85, height * 0.40);
    mountains.lineTo(width, height * 0.52);
    mountains.lineTo(width, height);
    mountains.lineTo(0, height);
    mountains.closePath();
    mountains.fill();

    // Midground mountains with mist
    mountains.fillStyle(0x231818, 0.85);
    mountains.beginPath();
    mountains.moveTo(0, height * 0.62);
    mountains.lineTo(width * 0.22, height * 0.50);
    mountains.lineTo(width * 0.45, height * 0.60);
    mountains.lineTo(width * 0.62, height * 0.46);
    mountains.lineTo(width * 0.82, height * 0.58);
    mountains.lineTo(width, height * 0.50);
    mountains.lineTo(width, height);
    mountains.lineTo(0, height);
    mountains.closePath();
    mountains.fill();

    // 3. Ancient Bagan Pagoda Silhouettes (စေတီပုထိုးများ) in Morning Mist
    const pagodas = this.add.graphics();
    pagodas.fillStyle(0x18100c, 0.95);
    // Left Pagoda (Ananda Temple silhouette)
    const p1x = width * 0.18;
    const p1y = height * 0.58;
    pagodas.fillRect(p1x - 30, p1y - 35, 60, 35);
    pagodas.fillRect(p1x - 20, p1y - 55, 40, 20);
    pagodas.fillTriangle(p1x - 12, p1y - 55, p1x + 12, p1y - 55, p1x, p1y - 95);
    // Golden Stupa Finial
    pagodas.fillStyle(0xf59e0b, 0.9);
    pagodas.fillCircle(p1x, p1y - 98, 3.5);

    // Center Grand Golden Stupa (Shwedagon / Bagan style silhouette)
    const p2x = width * 0.52;
    const p2y = height * 0.52;
    pagodas.fillStyle(0x1a0f0a, 0.98);
    pagodas.fillRect(p2x - 45, p2y - 45, 90, 45);
    pagodas.fillRect(p2x - 30, p2y - 75, 60, 30);
    pagodas.fillTriangle(p2x - 18, p2y - 75, p2x + 18, p2y - 75, p2x, p2y - 140);
    // Radiant Golden Finial (ထီးတော်)
    pagodas.fillStyle(0xfbbf24, 1);
    pagodas.fillCircle(p2x, p2y - 143, 4.5);
    pagodas.lineStyle(2, 0xd97706, 0.9);
    pagodas.lineBetween(p2x, p2y - 148, p2x, p2y - 138);

    // Right Ancient Stupa
    const p3x = width * 0.82;
    const p3y = height * 0.60;
    pagodas.fillStyle(0x1c110b, 0.95);
    pagodas.fillRect(p3x - 25, p3y - 30, 50, 30);
    pagodas.fillTriangle(p3x - 14, p3y - 30, p3x + 14, p3y - 30, p3x, p3y - 80);
    pagodas.fillStyle(0xf59e0b, 0.9);
    pagodas.fillCircle(p3x, p3y - 82, 3);

    // 4. Volumetric Morning God Rays (ရွှေရောင် နေခြည်အလင်းတန်းများ)
    this.cityGlow = this.add.graphics();
    this.cityGlow.fillStyle(0xfbbf24, 0.08);
    this.cityGlow.beginPath();
    this.cityGlow.moveTo(width * 0.52, height * 0.2);
    this.cityGlow.lineTo(width * 0.1, height);
    this.cityGlow.lineTo(width * 0.4, height);
    this.cityGlow.closePath();
    this.cityGlow.fill();
    this.cityGlow.beginPath();
    this.cityGlow.moveTo(width * 0.52, height * 0.2);
    this.cityGlow.lineTo(width * 0.45, height);
    this.cityGlow.lineTo(width * 0.75, height);
    this.cityGlow.closePath();
    this.cityGlow.fill();
    this.cityGlow.beginPath();
    this.cityGlow.moveTo(width * 0.52, height * 0.2);
    this.cityGlow.lineTo(width * 0.78, height);
    this.cityGlow.lineTo(width * 1.05, height);
    this.cityGlow.closePath();
    this.cityGlow.fill();

    // 5. Morning Fog Mist Bands
    const mist = this.add.graphics();
    mist.fillStyle(0xfde68a, 0.06);
    mist.fillRoundedRect(0, height * 0.48, width, 55, 20);
    mist.fillStyle(0x78350f, 0.12);
    mist.fillRoundedRect(0, height * 0.56, width, 65, 25);

    // 6. Jungle Ground with Weathered Bagan Bricks & Mossy Flagstones
    this.ground = this.add.graphics();
    const groundY = height - 120;
    // Dark forest loam
    this.ground.fillStyle(0x18130e, 1);
    this.ground.fillRect(0, groundY, width, 120);

    // Ancient red-ochre Bagan terracotta brick pathway
    this.ground.fillStyle(0x572814, 0.9);
    this.ground.fillRect(0, groundY, width, 18);

    // Individual brick borders & cracks
    this.ground.lineStyle(1.5, 0x361609, 0.85);
    for (let bx = 0; bx < width; bx += 48) {
      this.ground.strokeRect(bx, groundY, 46, 18);
      // Small crack in brick
      if (bx % 96 === 0) {
        this.ground.lineBetween(bx + 14, groundY + 2, bx + 22, groundY + 16);
      }
    }

    // Lush green moss & fern tufts along path edge
    this.ground.fillStyle(0x166534, 0.9);
    for (let mx = 10; mx < width; mx += 36) {
      this.ground.fillCircle(mx, groundY + 1, 4.5);
      this.ground.fillCircle(mx + 6, groundY - 1, 3.5);
    }
    this.ground.fillStyle(0x22c55e, 0.7);
    for (let fx = 15; fx < width; fx += 72) {
      this.ground.fillTriangle(fx - 4, groundY, fx + 4, groundY, fx, groundY - 8);
    }

    // 7. Foreground Cinematic Banyan Tree Vines (ညောင်ပင်လိပ်) framing edges
    const jungleFrame = this.add.graphics();
    jungleFrame.fillStyle(0x0e0b08, 0.95);
    // Left massive banyan trunk & hanging lianas
    jungleFrame.fillRect(0, 0, 45, height);
    jungleFrame.lineStyle(4, 0x140e0a, 0.9);
    jungleFrame.beginPath();
    jungleFrame.moveTo(40, 0);
    jungleFrame.lineTo(55, height * 0.2);
    jungleFrame.lineTo(58, height * 0.4);
    jungleFrame.lineTo(48, height * 0.6);
    jungleFrame.lineTo(42, height * 0.7);
    jungleFrame.stroke();

    jungleFrame.beginPath();
    jungleFrame.moveTo(25, 0);
    jungleFrame.lineTo(38, height * 0.25);
    jungleFrame.lineTo(42, height * 0.5);
    jungleFrame.lineTo(32, height * 0.75);
    jungleFrame.lineTo(30, height);
    jungleFrame.stroke();

    // Right hanging aerial roots
    jungleFrame.lineStyle(3, 0x140e0a, 0.85);
    jungleFrame.beginPath();
    jungleFrame.moveTo(width - 30, 0);
    jungleFrame.lineTo(width - 45, height * 0.2);
    jungleFrame.lineTo(width - 48, height * 0.4);
    jungleFrame.lineTo(width - 35, height * 0.55);
    jungleFrame.lineTo(width - 25, height * 0.65);
    jungleFrame.stroke();

    jungleFrame.beginPath();
    jungleFrame.moveTo(width - 15, 0);
    jungleFrame.lineTo(width - 30, height * 0.3);
    jungleFrame.lineTo(width - 32, height * 0.5);
    jungleFrame.lineTo(width - 22, height * 0.75);
    jungleFrame.lineTo(width - 18, height);
    jungleFrame.stroke();

    // Phoe Htaung squatting / chewing betel nut
    this.phoeHtaung = this.add.image(width * 0.32, height - 150, 'ph-idle').setScale(1.2);

    // Betel chewing cheek pulse animation
    this.tweens.add({
      targets: this.phoeHtaung,
      scaleY: 1.25,
      y: height - 153,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Subtitle System
    this.subtitle = new SubtitleBox(this);

    // Floating Golden Dust Motes drifting in morning sunbeams
    AmbientAtmosphere.createDustMotes(this, 32);

    // Menu Buttons Container (Center)
    this.menuButtonsContainer = this.add.container(width / 2, height / 2 - 20).setDepth(250).setVisible(false);

    const hasSave = gameState.hasSavedGame();
    if (hasSave) {
      // 1. Continue Button
      const contBg = this.add.graphics();
      contBg.fillStyle(0x059669, 1);
      contBg.fillRoundedRect(-140, -56, 280, 48, 24);
      contBg.lineStyle(2, 0x34d399, 0.9);
      contBg.strokeRoundedRect(-140, -56, 280, 48, 24);

      const contText = this.add.text(0, -32, '▶ ဆက်လက်ကစားမည် / CONTINUE', {
        fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans',
        fontSize: '15px',
        fontStyle: '900',
        color: '#ffffff'
      }).setOrigin(0.5);

      const contBtn = this.add.container(0, 0, [contBg, contText]).setSize(280, 48).setInteractive({ useHandCursor: true });
      MicroInteractions.makeInteractiveHover(contBtn, 1.05);

      contBtn.on('pointerdown', () => {
        soundEngine.playPickup();
        this.cameras.main.fade(400, 12, 10, 8);
        this.time.delayedCall(400, () => {
          const targetScene = gameState.state.currentScene || 'Chapter1Scene';
          this.scene.start(targetScene);
        });
      });

      // 2. New Game Button
      const newBg = this.add.graphics();
      newBg.fillStyle(0xb45309, 1);
      newBg.fillRoundedRect(-140, 4, 280, 48, 24);
      newBg.lineStyle(2, 0xf59e0b, 0.9);
      newBg.strokeRoundedRect(-140, 4, 280, 48, 24);

      const newText = this.add.text(0, 28, '★ အသစ်စမည် / NEW GAME', {
        fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans',
        fontSize: '15px',
        fontStyle: '900',
        color: '#ffffff'
      }).setOrigin(0.5);

      const newBtn = this.add.container(0, 0, [newBg, newText]).setSize(280, 48).setInteractive({ useHandCursor: true });
      MicroInteractions.makeInteractiveHover(newBtn, 1.05);

      newBtn.on('pointerdown', () => {
        soundEngine.playPickup();
        gameState.reset();
        this.cameras.main.fade(400, 12, 10, 8);
        this.time.delayedCall(400, () => {
          this.scene.start('Chapter1Scene');
        });
      });

      this.menuButtonsContainer.add([contBtn, newBtn]);
    } else {
      // Single Start Button
      const btnBg = this.add.graphics();
      btnBg.fillStyle(0xb45309, 1);
      btnBg.fillRoundedRect(-140, -26, 280, 52, 26);
      btnBg.lineStyle(2.5, 0xf59e0b, 0.9);
      btnBg.strokeRoundedRect(-140, -26, 280, 52, 26);

      const btnText = this.add.text(0, 0, 'စတင်မည် / START GAME', {
        fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans',
        fontSize: '16px',
        fontStyle: '900',
        color: '#ffffff',
        letterSpacing: '1px'
      }).setOrigin(0.5);

      const startBtn = this.add.container(0, 0, [btnBg, btnText]).setSize(280, 52).setInteractive({ useHandCursor: true });
      MicroInteractions.makeInteractiveHover(startBtn, 1.05);

      startBtn.on('pointerdown', () => {
        soundEngine.playPickup();
        this.cameras.main.fade(400, 12, 10, 8);
        this.time.delayedCall(400, () => {
          this.scene.start('Chapter1Scene');
        });
      });

      this.menuButtonsContainer.add(startBtn);
    }

    // Top Controls (Audio & Fullscreen)
    this.createTopControls(width);

    // Play Voice narration
    this.time.delayedCall(600, () => {
      soundEngine.init();
      this.startIntroMonologue();
    });

    this.scale.on('resize', (gameSize) => {
      this.subtitle.resize(gameSize.width, gameSize.height);
      if (this.topControls) this.topControls.setPosition(gameSize.width - 95, 42);
      if (this.menuButtonsContainer) this.menuButtonsContainer.setPosition(gameSize.width / 2, gameSize.height / 2 - 20);
    });
  }

  createTopControls(width) {
    this.topControls = this.add.container(width - 95, 42).setDepth(280);
    const bg = this.add.graphics();
    bg.fillStyle(0x1c1815, 0.92);
    bg.fillRoundedRect(-85, -20, 170, 40, 20);
    bg.lineStyle(1.5, 0xf59e0b, 0.6);
    bg.strokeRoundedRect(-85, -20, 170, 40, 20);
    this.topControls.add(bg);

    // Audio button
    const audioLabel = soundEngine.isMuted() ? '🔇' : '🔊';
    const audioBtn = this.add.text(-45, 0, audioLabel, { fontSize: '15px' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    MicroInteractions.makeInteractiveHover(audioBtn, 1.2);

    audioBtn.on('pointerdown', (p, lx, ly, ev) => {
      ev.stopPropagation();
      const isMuted = soundEngine.toggleMute();
      audioBtn.setText(isMuted ? '🔇' : '🔊');
    });

    // Fullscreen text button
    const fsText = this.add.text(18, 0, '⛶ FULL', {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '11px',
      fontStyle: '900',
      color: '#f59e0b'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    MicroInteractions.makeInteractiveHover(fsText, 1.15);

    fsText.on('pointerdown', (p, lx, ly, ev) => {
      ev.stopPropagation();
      if (this.scale.isFullscreen) this.scale.stopFullscreen();
      else this.scale.startFullscreen();
    });

    this.topControls.add([audioBtn, fsText]);
  }

  startIntroMonologue() {
    const speech1 = 'တောကြီးမြိုင်လယ်၊ တိမ်တောင်တွေကြားမှာ ကွယ်ဝှက်ထားတဲ့ ပျောက်ဆုံးနေသော ရွှေမြို့တော်ကြီးပေါ့ဗျာ...။ နှစ်ပေါင်း ထောင်နဲ့ချီပြီး ဘယ်သူမှ မရောက်ဖူးတဲ့ ဒီနေရာကို တိုင်းပြည်အသီးသီးက စွန့်စားသူတွေ လာခဲ့ဖူးပေမဲ့ အားလုံး အသက်ပျောက်ခဲ့ကြရရှာတယ်။ ဒါပေမဲ့ ဒီကနေ့မှာတော့... ထူးခြားလှတဲ့ သူရဲကောင်းတစ်ယောက် ပေါ်ထွန်းလာခဲ့ပြီဗျို့!';

    this.subtitle.say(speech1, () => {
      const speech2 = '...အယ်! သူရဲကောင်းဆိုလို့ အထင်မကြီးကြပါနဲ့ဦး။ ဒါ ရွာထဲမှာ အလုပ်မရှိ လေလုံးပဲ ထွားနေတဲ့ ကွမ်းစားကြူး မောင်ဖိုးထောင်တဲ့ဗျာ! အကြွေးရှင်တွေ လိုက်လို့ ရွှေမြို့တော်ဘက် ထွက်ပြေးလာတာ။ ကဲ... မင်း ရွှေမြို့တော်က ရတနာတွေ ယူပြီး သူဌေးလုပ်ချင်တယ်ပေါ့လေ? ငါ လမ်းပြပေးပါ့မယ်။ စလိုက်ကြရအောင် မောင်မင်းကြီးသား!';

      this.subtitle.say(speech2, () => {
        this.menuButtonsContainer.setVisible(true);
        this.menuButtonsContainer.setScale(0.9);
        this.menuButtonsContainer.setAlpha(0);
        this.tweens.add({
          targets: this.menuButtonsContainer,
          scale: 1,
          alpha: 1,
          duration: 300,
          ease: 'Back.Out'
        });
      });
    });
  }
}
