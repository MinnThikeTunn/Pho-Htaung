import Phaser from 'phaser';
import { soundEngine } from '../utils/SoundEngine.js';
import { gameState } from '../utils/GameState.js';
import { MicroInteractions } from '../utils/MicroInteractions.js';
import SettingsModal from '../ui/SettingsModal.js';

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
  }

  create() {
    this.setupLayout();
    this.settingsModal = new SettingsModal(this);

    const resizeHandler = () => this.setupLayout();
    this.scale.on('resize', resizeHandler);
    this.events.once('shutdown', () => {
      this.scale.off('resize', resizeHandler);
    });

    this.input.keyboard.on('keydown-ESC', () => {
      if (this.settingsModal.isOpen()) {
        this.settingsModal.close();
      } else {
        this.settingsModal.show();
      }
    });
  }

  setupLayout() {
    const { width, height } = this.scale;

    if (this.mainContainer) this.mainContainer.destroy();
    this.mainContainer = this.add.container(0, 0);

    // 1. Deep Atmospheric Gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x18120d, 0x18120d, 0x0c0a08, 0x0c0a08, 1);
    bg.fillRect(0, 0, width, height);
    this.mainContainer.add(bg);

    // Subtle vignette
    const vig = this.add.graphics();
    vig.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0);
    const vigGrad = vig.fillGradientStyle(0x0c0a08, 0x0c0a08, 0x0c0a08, 0x0c0a08, 1);
    vig.fillRect(0, 0, width, height);
    vig.setAlpha(0.6);
    this.mainContainer.add(vig);

    // 2. Volumetric God Rays
    const rays = this.add.graphics();
    rays.fillStyle(0xf59e0b, 0.04);
    rays.fillTriangle(width * 0.38, 0, width * 0.12, height, width * 0.58, height);
    rays.fillTriangle(width * 0.72, 0, width * 0.48, height, width * 0.92, height);
    this.mainContainer.add(rays);
    this.tweens.add({ targets: rays, alpha: 0.7, duration: 5200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // 3. Layered Temple Silhouettes
    const stupas = this.add.graphics();
    stupas.fillStyle(0x120f0b, 0.92);
    stupas.fillRect(width * 0.06, height - 420, width * 0.16, 420);
    stupas.fillRect(width * 0.24, height - 340, width * 0.1, 340);
    stupas.fillStyle(0x0f0d09, 0.95);
    stupas.fillRect(width * 0.72, height - 460, width * 0.18, 460);
    stupas.fillRect(width * 0.62, height - 360, width * 0.12, 360);
    this.mainContainer.add(stupas);

    // 4. Misty Ground
    const ground = this.add.graphics();
    ground.fillStyle(0x211b16, 1);
    ground.fillRoundedRect(width / 2 - 360, height / 2 + 190, 720, 120, 40);
    ground.lineStyle(2, 0x8c7356, 0.5);
    ground.strokeRoundedRect(width / 2 - 360, height / 2 + 190, 720, 120, 40);
    this.mainContainer.add(ground);

    // 5. Phoe Htaung Character Preview
    const ph = this.add.image(width / 2, height / 2 + 125, 'ph-idle')
      .setScale(1.58)
      .setDepth(20);
    this.mainContainer.add(ph);

    this.tweens.add({
      targets: ph,
      scaleY: 1.62,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // 6. Ornamental Header Badge
    const badgeBg = this.add.graphics();
    badgeBg.fillStyle(0xf59e0b, 0.14);
    badgeBg.fillRoundedRect(width / 2 - 190, height / 2 - 236, 380, 38, 19);
    badgeBg.lineStyle(1.6, 0xfbbf24, 0.55);
    badgeBg.strokeRoundedRect(width / 2 - 190, height / 2 - 236, 380, 38, 19);

    const badgeText = this.add.text(width / 2, height / 2 - 217, '• ရှေးဟောင်းနန်းတော် စွန့်စားခန်း •', {
      fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans, sans-serif',
      fontSize: '12px',
      fontStyle: '900',
      color: '#fbbf24',
      letterSpacing: '4px'
    }).setOrigin(0.5);
    this.mainContainer.add([badgeBg, badgeText]);

    // 7. Main Title
    const title = this.add.text(width / 2, height / 2 - 148, 'မောင်ဖိုးထောင်', {
      fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans, sans-serif',
      fontSize: Math.min(width * 0.08, 92) + 'px',
      fontStyle: '900',
      color: '#f8f3e7',
      letterSpacing: '6px'
    }).setOrigin(0.5);
    title.setShadow(0, 18, '#0c0a08', 60, true, true);

    this.tweens.add({
      targets: title,
      y: title.y - 8,
      duration: 2400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    this.mainContainer.add(title);

    // Subtitle
    const subtitle = this.add.text(width / 2, height / 2 - 76, 'DIE AGAIN IN THE GOLDEN CITY', {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: '13px',
      fontWeight: '900',
      color: '#e7d7b5',
      letterSpacing: '10px'
    }).setOrigin(0.5);
    subtitle.setAlpha(0.9);
    this.mainContainer.add(subtitle);

    // 8. Buttons
    const btnW = 280;
    const btnH = 54;

    // Start Button
    const startBtn = this.add.container(width / 2, height / 2 + 245).setSize(btnW, btnH);
    const sBg = this.add.graphics();
    sBg.fillGradientStyle(0xb45309, 0xf59e0b, 0xb45309, 0xf59e0b, 1);
    sBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 27);
    sBg.lineStyle(2, 0xfbbf24, 0.95);
    sBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 27);

    const sText = this.add.text(0, 0, 'စတင်မည် / PLAY', {
      fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans, sans-serif',
      fontSize: '15px',
      fontStyle: '900',
      color: '#fff7ed',
      letterSpacing: '4px'
    }).setOrigin(0.5);

    startBtn.add([sBg, sText]);
    startBtn.setInteractive({ useHandCursor: true });
    MicroInteractions.makeInteractiveHover(startBtn, 1.06);

    startBtn.on('pointerdown', () => {
      soundEngine.playPickup();
      this.cameras.main.fade(320, 12, 10, 8);
      this.time.delayedCall(320, () => {
        this.scene.start('IntroScene');
      });
    });

    // Settings Button
    const setBtn = this.add.container(width / 2, height / 2 + 315).setSize(btnW, btnH);
    const setBg = this.add.graphics();
    setBg.fillStyle(0x1c1815, 0.95);
    setBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 27);
    setBg.lineStyle(1.6, 0xd97706, 0.7);
    setBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 27);

    const setText = this.add.text(0, 0, 'ဆက်တင် / SETTINGS', {
      fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans, sans-serif',
      fontSize: '14px',
      fontStyle: '900',
      color: '#f5efe6',
      letterSpacing: '4px'
    }).setOrigin(0.5);

    setBtn.add([setBg, setText]);
    setBtn.setInteractive({ useHandCursor: true });
    MicroInteractions.makeInteractiveHover(setBtn, 1.06);

    setBtn.on('pointerdown', () => {
      this.settingsModal.show();
    });

    this.mainContainer.add([startBtn, setBtn]);
  }
}
