import Phaser from 'phaser';
import SubtitleBox from '../ui/SubtitleBox.js';
import SettingsModal from '../ui/SettingsModal.js';
import { gameState } from '../utils/GameState.js';
import { soundEngine } from '../utils/SoundEngine.js';
import { audioDirector } from '../audio/AudioDirector.js';
import { AmbientAtmosphere } from '../utils/AmbientAtmosphere.js';
import { MicroInteractions } from '../utils/MicroInteractions.js';
import { ParallaxBackground } from '../utils/ParallaxBackground.js';

export default class IntroScene extends Phaser.Scene {
  constructor() {
    super('IntroScene');
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    // High-End Settings Modal Instance
    this.settingsModal = new SettingsModal(this);

    // ESC to toggle settings
    this.input.keyboard.on('keydown-ESC', () => {
      if (this.settingsModal.isOpen()) {
        this.settingsModal.close();
      } else {
        this.settingsModal.show();
      }
    });

    // Timeline Event: T = 0.0s Scene Mount, #000000 screen
    // Start STEM_DRONE (0.60), STEM_JUNGLE (0.00), STEM_KALIMBA (0.00) simultaneously
    // T = 2.0s: STEM_JUNGLE fades to 0.50, SFX_BETEL_CHEW loops at 0.25
    // T = 2.5s: Dialogue ducking applied when VO begins
    audioDirector.initScene0Timeline(this);

    // 1. High-End 5-Layer Machinarium Static Background (Zero drift, Zero breathing)
    this.parallax = new ParallaxBackground(this, {
      enableMouseParallax: false,
      enableBreathing: false,
      depthBase: 0
    });

    const groundY = Math.round(this.parallax.getWalkableGroundY());
    this.groundY = groundY;

    // 2. Volumetric Morning God Rays (ရွှေရောင် နေခြည်အလင်းတန်းများ) - Soft & Moody
    this.cityGlow = this.add.graphics().setDepth(25);
    this.cityGlow.fillStyle(0xfbbf24, 0.035);
    this.cityGlow.beginPath();
    this.cityGlow.moveTo(width * 0.52, height * 0.15);
    this.cityGlow.lineTo(width * 0.1, height);
    this.cityGlow.lineTo(width * 0.4, height);
    this.cityGlow.closePath();
    this.cityGlow.fill();
    this.cityGlow.beginPath();
    this.cityGlow.moveTo(width * 0.52, height * 0.15);
    this.cityGlow.lineTo(width * 0.45, height);
    this.cityGlow.lineTo(width * 0.75, height);
    this.cityGlow.closePath();
    this.cityGlow.fill();
    this.cityGlow.beginPath();
    this.cityGlow.moveTo(width * 0.52, height * 0.15);
    this.cityGlow.lineTo(width * 0.78, height);
    this.cityGlow.lineTo(width * 1.05, height);
    this.cityGlow.closePath();
    this.cityGlow.fill();

    // 3. Phoe Htaung Ground Contact Shadow (Soft Ambient Occlusion ellipse under feet)
    this.contactShadow = this.add.ellipse(width * 0.32, groundY + 2, 50, 12, 0x070503, 0.72)
      .setDepth(149);

    // 4. Phoe Htaung Character squatting & chewing betel nut on top of the stone slab
    // Sprite feet are at row 79/84 (originY = 0.94), placing his feet flush on the platform
    this.phoeHtaung = this.add.image(width * 0.32, groundY, 'ph-idle')
      .setOrigin(0.5, 0.94)
      .setScale(1.42)
      .setDepth(150);

    // Betel chewing cheek pulse animation - breathing upward from grounded feet
    this.chewTween = this.tweens.add({
      targets: this.phoeHtaung,
      scaleY: 1.48,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Shadow subtle breathing sync
    this.tweens.add({
      targets: this.contactShadow,
      scaleX: 1.08,
      alpha: 0.80,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Subtitle System
    this.subtitle = new SubtitleBox(this);

    // Floating Golden Dust Motes drifting in morning sunbeams
    AmbientAtmosphere.createDustMotes(this, 32);

    // Machinarium Weathered Parchment Grain & Cinematic Vignette
    AmbientAtmosphere.createWeatheredOverlay(this);
    this.vignette = this.add.image(width / 2, height / 2, 'screen-vignette')
      .setDisplaySize(width, height)
      .setDepth(235)
      .setAlpha(0.68);

    // Clickable Ambient Machinarium Toys ("Juice")
    // 1. Temple sparrow perched on right archway cornice
    this.bird = MicroInteractions.createTempleBird(this, width * 0.78, groundY - 145);

    // 2. Loose ancient terracotta brick in the left stone wall
    this.looseBrick = MicroInteractions.createLooseBrick(this, width * 0.16, groundY - 45);

    // 3. Wall gecko clinging to the ancient stone pillar
    this.gecko = MicroInteractions.createWallGecko(this, width * 0.22, groundY - 110);

    // 4. Ancient Palace bronze bell with verdigris patina
    const bellContainer = this.add.container(width * 0.85, groundY - 180).setSize(48, 64).setDepth(45);
    const bellChain = this.add.graphics();
    bellChain.lineStyle(2, 0x261a12, 0.95);
    bellChain.lineBetween(0, -40, 0, 0);
    const bellImg = this.add.image(0, 16, 'prop-bell').setScale(0.78);
    bellContainer.add([bellChain, bellImg]);
    MicroInteractions.attachAmbientToy(this, bellContainer, 'bell');
    this.bell = bellContainer;

    // Interactive Point-and-Click movement on the Ancient Palace stone slab
    this.targetX = null;
    this.input.on('pointerdown', (pointer) => {
      // Don't intercept clicks on UI buttons
      if (this.menuButtonsContainer.visible && pointer.y < groundY - 70) return;
      if (pointer.y > groundY - 140 && pointer.y < groundY + 100) {
        this.targetX = pointer.x;
        MicroInteractions.spawnClickMarker(this, pointer.x, groundY - 6);
      }
    });

    // Menu Buttons Container (Center) — Perplexity Rounded-[32px] Design
    this.menuButtonsContainer = this.add.container(width / 2, height / 2 - 10).setDepth(250).setVisible(false);

    const btnWidth = 300;
    const btnHeight = 48;
    const btnRadius = 24;

    const hasSave = gameState.hasSavedGame();
    if (hasSave) {
      // 1. Continue Button (Emerald + Gold Accent)
      const contBg = this.add.graphics();
      contBg.fillStyle(0x065f46, 1);
      contBg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, btnRadius);
      contBg.lineStyle(2, 0x34d399, 0.95);
      contBg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, btnRadius);

      const contText = this.add.text(0, 0, '▶ ဆက်လက်ကစားမည် / CONTINUE', {
        fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans, sans-serif',
        fontSize: '14px',
        fontStyle: '900',
        color: '#ffffff'
      }).setOrigin(0.5);

      const contBtn = this.add.container(0, -60, [contBg, contText]).setSize(btnWidth, btnHeight).setInteractive({ useHandCursor: true });
      MicroInteractions.makeInteractiveHover(contBtn, 1.05);

      contBtn.on('pointerdown', () => {
        soundEngine.playPickup();
        this.cameras.main.fade(400, 12, 10, 8);
        this.time.delayedCall(400, () => {
          const targetScene = gameState.state.currentScene || 'Chapter1Scene';
          this.scene.start(targetScene);
        });
      });

      // 2. New Game Button (Rich Amber)
      const newBg = this.add.graphics();
      newBg.fillStyle(0xb45309, 1);
      newBg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, btnRadius);
      newBg.lineStyle(2, 0xf59e0b, 0.95);
      newBg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, btnRadius);

      const newText = this.add.text(0, 0, '★ အသစ်စမည် / NEW GAME', {
        fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans, sans-serif',
        fontSize: '14px',
        fontStyle: '900',
        color: '#ffffff'
      }).setOrigin(0.5);

      const newBtn = this.add.container(0, 0, [newBg, newText]).setSize(btnWidth, btnHeight).setInteractive({ useHandCursor: true });
      MicroInteractions.makeInteractiveHover(newBtn, 1.05);

      newBtn.on('pointerdown', () => {
        soundEngine.playPickup();
        gameState.reset();
        this.cameras.main.fade(400, 12, 10, 8);
        this.time.delayedCall(400, () => {
          this.scene.start('Chapter1Scene');
        });
      });

      // 3. Settings Button (Lacquer Charcoal + Amber Border)
      const setBg = this.add.graphics();
      setBg.fillStyle(0x271e17, 1);
      setBg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, btnRadius);
      setBg.lineStyle(1.8, 0xd97706, 0.85);
      setBg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, btnRadius);

      const setText = this.add.text(0, 0, '⚙️ ရွေးချယ်စရာများ / SETTINGS', {
        fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans, sans-serif',
        fontSize: '14px',
        fontStyle: '900',
        color: '#fef08a'
      }).setOrigin(0.5);

      const setBtn = this.add.container(0, 60, [setBg, setText]).setSize(btnWidth, btnHeight).setInteractive({ useHandCursor: true });
      MicroInteractions.makeInteractiveHover(setBtn, 1.05);

      setBtn.on('pointerdown', () => {
        this.settingsModal.show();
      });

      this.menuButtonsContainer.add([contBtn, newBtn, setBtn]);
    } else {
      // Single Start Button (Rich Amber)
      const btnBg = this.add.graphics();
      btnBg.fillStyle(0xb45309, 1);
      btnBg.fillRoundedRect(-btnWidth / 2, -26, btnWidth, 52, 26);
      btnBg.lineStyle(2.5, 0xf59e0b, 0.95);
      btnBg.strokeRoundedRect(-btnWidth / 2, -26, btnWidth, 52, 26);

      const btnText = this.add.text(0, 0, 'စတင်မည် / START GAME', {
        fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans, sans-serif',
        fontSize: '15px',
        fontStyle: '900',
        color: '#ffffff',
        letterSpacing: '1px'
      }).setOrigin(0.5);

      const startBtn = this.add.container(0, -28, [btnBg, btnText]).setSize(btnWidth, 52).setInteractive({ useHandCursor: true });
      MicroInteractions.makeInteractiveHover(startBtn, 1.05);

      startBtn.on('pointerdown', () => {
        soundEngine.playPickup();
        audioDirector.onStartGameClicked();
        this.cameras.main.fade(400, 12, 10, 8);
        this.time.delayedCall(400, () => {
          this.scene.start('Chapter1Scene');
        });
      });

      // Settings Button
      const setBg = this.add.graphics();
      setBg.fillStyle(0x271e17, 1);
      setBg.fillRoundedRect(-btnWidth / 2, -24, btnWidth, 48, 24);
      setBg.lineStyle(1.8, 0xd97706, 0.85);
      setBg.strokeRoundedRect(-btnWidth / 2, -24, btnWidth, 48, 24);

      const setText = this.add.text(0, 0, '⚙️ ရွေးချယ်စရာများ / SETTINGS', {
        fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans, sans-serif',
        fontSize: '14px',
        fontStyle: '900',
        color: '#fef08a'
      }).setOrigin(0.5);

      const setBtn = this.add.container(0, 36, [setBg, setText]).setSize(btnWidth, 48).setInteractive({ useHandCursor: true });
      MicroInteractions.makeInteractiveHover(setBtn, 1.05);

      setBtn.on('pointerdown', () => {
        this.settingsModal.show();
      });

      this.menuButtonsContainer.add([startBtn, setBtn]);
    }

    // Top Controls (Audio & Fullscreen)
    this.createTopControls(width);

    // Play Voice narration
    this.time.delayedCall(600, () => {
      soundEngine.init();
      this.startIntroMonologue();
    });

    const resizeHandler = (gameSize) => {
      if (this.parallax) {
        this.parallax.resize(gameSize.width, gameSize.height);
      }
      if (this.phoeHtaung) {
        const gy = this.parallax ? this.parallax.getWalkableGroundY() : gameSize.height * 0.80;
        this.phoeHtaung.setPosition(gameSize.width * 0.32, gy);
        if (this.contactShadow) {
          this.contactShadow.setPosition(gameSize.width * 0.32, gy + 2);
        }
      }
      if (this.vignette) {
        this.vignette.setDisplaySize(gameSize.width, gameSize.height);
        this.vignette.setPosition(gameSize.width / 2, gameSize.height / 2);
      }
      const currentGy = this.parallax ? this.parallax.getWalkableGroundY() : gameSize.height * 0.80;
      if (this.bird) this.bird.setPosition(gameSize.width * 0.78, currentGy - 145);
      if (this.looseBrick) this.looseBrick.setPosition(gameSize.width * 0.16, currentGy - 45);
      if (this.gecko) this.gecko.setPosition(gameSize.width * 0.22, currentGy - 110);
      if (this.bell) this.bell.setPosition(gameSize.width * 0.85, currentGy - 180);
      if (this.subtitle && this.subtitle.container && this.subtitle.container.active) {
        this.subtitle.resize(gameSize.width, gameSize.height);
      }
      if (this.topControls && this.topControls.active) {
        this.topControls.setPosition(gameSize.width - 95, 42);
      }
      if (this.menuButtonsContainer && this.menuButtonsContainer.active) {
        this.menuButtonsContainer.setPosition(gameSize.width / 2, gameSize.height / 2 - 20);
      }
    };
    this.scale.on('resize', resizeHandler);
    this.events.once('shutdown', () => {
      this.scale.off('resize', resizeHandler);
      if (this.parallax) {
        this.parallax.destroy();
      }
    });
  }

  update(time, delta) {
    if (this.parallax) {
      this.parallax.update(time, delta);
    }

    // Walking animation along the stone slab
    if (this.targetX !== null && this.phoeHtaung) {
      if (this.chewTween && this.chewTween.isPlaying()) {
        this.chewTween.pause();
      }

      const gy = this.parallax ? this.parallax.getWalkableGroundY() : this.scale.height * 0.80;
      const dist = this.targetX - this.phoeHtaung.x;
      if (Math.abs(dist) > 8) {
        const dir = Math.sign(dist);
        this.phoeHtaung.x += dir * 3.2;
        this.phoeHtaung.y = gy;
        this.phoeHtaung.setScale(dir * 1.42, 1.42);
        if (this.contactShadow) {
          this.contactShadow.x = this.phoeHtaung.x;
          this.contactShadow.y = gy + 2;
        }

        if (!this.stepTimer || time > this.stepTimer) {
          audioDirector.onPlayerStep(time);
          const walkCycle = ['ph-walk-1', 'ph-walk-2', 'ph-walk-3', 'ph-walk-4'];
          this.walkIndex = ((this.walkIndex || 0) + 1) % walkCycle.length;
          this.phoeHtaung.setTexture(walkCycle[this.walkIndex]);
          MicroInteractions.spawnFootstepDust(this, this.phoeHtaung.x, gy, dir);
          this.stepTimer = time + 250;
        }
      } else {
        this.targetX = null;
        this.phoeHtaung.y = gy;
        this.phoeHtaung.setTexture('ph-idle');
        if (this.chewTween) {
          this.chewTween.resume();
        }
      }
    }
  }

  createTopControls(width) {
    this.topControls = this.add.container(width - 115, 42).setDepth(280);
    const bg = this.add.graphics();
    bg.fillStyle(0x1c1815, 0.94);
    bg.fillRoundedRect(-100, -21, 200, 42, 21);
    bg.lineStyle(1.6, 0xd97706, 0.75);
    bg.strokeRoundedRect(-100, -21, 200, 42, 21);
    this.topControls.add(bg);

    // 1. Audio button
    const audioLabel = audioDirector.getMuted() ? '🔇' : '🔊';
    const audioBtn = this.add.text(-55, 0, audioLabel, { fontSize: '15px' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    MicroInteractions.makeInteractiveHover(audioBtn, 1.2);

    audioBtn.on('pointerdown', (p, lx, ly, ev) => {
      ev.stopPropagation();
      const isMuted = audioDirector.toggleMute();
      audioBtn.setText(isMuted ? '🔇' : '🔊');
    });

    // 2. Fullscreen button
    const fsText = this.add.text(0, 0, '⛶ FULL', {
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

    // 3. Settings icon button
    const setBtn = this.add.text(56, 0, '⚙️', { fontSize: '15px' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    MicroInteractions.makeInteractiveHover(setBtn, 1.2);

    setBtn.on('pointerdown', (p, lx, ly, ev) => {
      ev.stopPropagation();
      this.settingsModal.show();
    });

    this.topControls.add([audioBtn, fsText, setBtn]);
  }

  startIntroMonologue() {
    const speech1 = 'တောကြီးမြိုင်လယ်၊ တိမ်တောင်တွေကြားမှာ ကွယ်ဝှက်ထားတဲ့ ပျောက်ဆုံးနေသော ရွှေမြို့တော်ကြီးပေါ့ဗျာ...။ နှစ်ပေါင်း ထောင်နဲ့ချီပြီး ဘယ်သူမှ မရောက်ဖူးတဲ့ ဒီနေရာကို တိုင်းပြည်အသီးသီးက စွန့်စားသူတွေ လာခဲ့ဖူးပေမဲ့ အားလုံး အသက်ပျောက်ခဲ့ကြရရှာတယ်။ ဒါပေမဲ့ ဒီကနေ့မှာတော့... ထူးခြားလှတဲ့ သူရဲကောင်းတစ်ယောက် ပေါ်ထွန်းလာခဲ့ပြီဗျို့!';

    this.subtitle.say(speech1, () => {
      // Timeline Event: VO reaches "...အယ်! သူရဲကောင်းဆိုလို့..."
      // Comedic needle drop: Cut STEM_DRONE for 500ms and play SFX_RECORD_SCRATCH
      audioDirector.triggerComedicNeedleDrop(this);

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
