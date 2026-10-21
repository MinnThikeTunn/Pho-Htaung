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

    // 1. Warm Bagan Dawn Gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x271e17, 0x271e17, 0x0c0a08, 0x0c0a08, 1);
    bg.fillRect(0, 0, width, height);
    this.mainContainer.add(bg);

    // 2. Volumetric Morning God Rays
    const rays = this.add.graphics();
    rays.fillStyle(0xf59e0b, 0.05);
    rays.fillTriangle(width * 0.45, 0, width * 0.1, height, width * 0.7, height);
    rays.fillTriangle(width * 0.75, 0, width * 0.45, height, width, height);
    this.mainContainer.add(rays);

    // 3. Ancient Temple Archway Silhouettes
    const stupas = this.add.graphics();
    stupas.fillStyle(0x181310, 0.88);
    stupas.fillRect(width * 0.08, height - 380, width * 0.14, 380);
    stupas.fillRect(width * 0.76, height - 420, width * 0.16, 420);
    this.mainContainer.add(stupas);

    // 4. Ground Platform
    const ground = this.add.graphics();
    ground.fillStyle(0x292524, 1);
    ground.fillRoundedRect(width / 2 - 320, height / 2 + 180, 640, 110, 36);
    ground.lineStyle(3, 0x44403c, 1);
    ground.strokeRoundedRect(width / 2 - 320, height / 2 + 180, 640, 110, 36);
    this.mainContainer.add(ground);

    // 5. Phoe Htaung Character Preview (Idle with longyi & Shan bag)
    const ph = this.add.image(width / 2, height / 2 + 115, 'ph-idle')
      .setScale(1.5)
      .setDepth(20);
    this.mainContainer.add(ph);

    this.tweens.add({
      targets: ph,
      scaleY: 1.55,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // 6. Header Badge
    const badgeBg = this.add.graphics();
    badgeBg.fillStyle(0xf59e0b, 0.12);
    badgeBg.fillRoundedRect(width / 2 - 160, height / 2 - 210, 320, 36, 18);
    badgeBg.lineStyle(1.5, 0xf59e0b, 0.4);
    badgeBg.strokeRoundedRect(width / 2 - 160, height / 2 - 210, 320, 36, 18);

    const badgeText = this.add.text(width / 2, height / 2 - 192, '• ပုဂံရွှေမြို့တော် ရှာပုံတော် •', {
      fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans, sans-serif',
      fontSize: '12px',
      fontStyle: '900',
      color: '#f59e0b',
      letterSpacing: '1px'
    }).setOrigin(0.5);
    this.mainContainer.add([badgeBg, badgeText]);

    // 7. Main Game Title (Bagan Aesthetic)
    const title = this.add.text(width / 2, height / 2 - 135, 'မောင်ဖိုးထောင်', {
      fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans, sans-serif',
      fontSize: 'clamp(36px, 5.5vw, 64px)',
      fontStyle: '900',
      color: '#ffffff',
      letterSpacing: '2px'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      y: title.y - 6,
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    this.mainContainer.add(title);

    // Subtitle
    const subtitle = this.add.text(width / 2, height / 2 - 68, 'DIE AGAIN IN THE GOLDEN CITY', {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: '14px',
      fontWeight: '800',
      color: '#a8a29e',
      letterSpacing: '2.5px'
    }).setOrigin(0.5);
    this.mainContainer.add(subtitle);

    // 8. Buttons Container (Perplexity Rounded-[32px])
    const btnW = 260;
    const btnH = 50;

    // Start / Continue Button
    const startBtn = this.add.container(width / 2 - 140, height / 2 + 225).setSize(btnW, btnH);
    const sBg = this.add.graphics();
    sBg.fillStyle(0xb45309, 1);
    sBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 25);
    sBg.lineStyle(2, 0xf59e0b, 0.95);
    sBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 25);

    const sText = this.add.text(0, 0, '▶ စတင်မည် / PLAY', {
      fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans, sans-serif',
      fontSize: '15px',
      fontStyle: '900',
      color: '#ffffff'
    }).setOrigin(0.5);

    startBtn.add([sBg, sText]);
    startBtn.setInteractive({ useHandCursor: true });
    MicroInteractions.makeInteractiveHover(startBtn, 1.05);

    startBtn.on('pointerdown', () => {
      soundEngine.playPickup();
      this.cameras.main.fade(300, 12, 10, 8);
      this.time.delayedCall(300, () => {
        this.scene.start('IntroScene');
      });
    });

    // Settings Button
    const setBtn = this.add.container(width / 2 + 140, height / 2 + 225).setSize(btnW, btnH);
    const setBg = this.add.graphics();
    setBg.fillStyle(0x271e17, 1);
    setBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 25);
    setBg.lineStyle(1.8, 0xd97706, 0.85);
    setBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 25);

    const setText = this.add.text(0, 0, '⚙️ ရွေးချယ်စရာများ / SETTINGS', {
      fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans, sans-serif',
      fontSize: '14px',
      fontStyle: '900',
      color: '#fef08a'
    }).setOrigin(0.5);

    setBtn.add([setBg, setText]);
    setBtn.setInteractive({ useHandCursor: true });
    MicroInteractions.makeInteractiveHover(setBtn, 1.05);

    setBtn.on('pointerdown', () => {
      this.settingsModal.show();
    });

    this.mainContainer.add([startBtn, setBtn]);
  }
}
