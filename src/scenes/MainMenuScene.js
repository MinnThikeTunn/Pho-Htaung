import Phaser from 'phaser';
import { machinariumAudio } from '../utils/MachinariumAudio.js';

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
  }

  create() {
    this.setupLayout();
    this.scale.on('resize', () => this.setupLayout(), this);
  }

  setupLayout() {
    const { width, height } = this.scale;

    // Clear previous elements if resizing
    if (this.mainContainer) this.mainContainer.destroy();
    this.mainContainer = this.add.container(0, 0);

    // Warm Industrial Sky Gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x271e17, 0x271e17, 0x0c0a08, 0x0c0a08, 1);
    bg.fillRect(0, 0, width, height);
    this.mainContainer.add(bg);

    // Volumetric Twilight God-Rays
    const rays = this.add.graphics();
    rays.fillStyle(0xf59e0b, 0.05);
    rays.fillTriangle(width * 0.4, 0, width * 0.05, height, width * 0.65, height);
    rays.fillTriangle(width * 0.75, 0, width * 0.45, height, width, height);
    this.mainContainer.add(rays);

    // Cityscape Silhouettes
    const skyline = this.add.graphics();
    skyline.fillStyle(0x181310, 0.88);
    skyline.fillRect(width * 0.08, height - 420, width * 0.12, 420);
    skyline.fillRect(width * 0.22, height - 340, width * 0.08, 340);
    skyline.fillRect(width * 0.72, height - 480, width * 0.14, 480);
    skyline.fillRect(width * 0.87, height - 370, width * 0.11, 370);

    // Heavy connecting conduits
    skyline.lineStyle(10, 0x241d18, 0.8);
    skyline.lineBetween(width * 0.2, height - 360, width * 0.3, height - 290);
    skyline.lineBetween(width * 0.72, height - 420, width * 0.87, height - 330);
    this.mainContainer.add(skyline);

    // Animated Rotating Clockwork Gears
    this.gear1 = this.add.image(width * 0.18, height * 0.3, 'industrial-gear').setScale(2.4).setAlpha(0.24);
    this.gear2 = this.add.image(width * 0.27, height * 0.42, 'industrial-gear').setScale(1.7).setAlpha(0.28);
    this.gear3 = this.add.image(width * 0.82, height * 0.7, 'industrial-gear').setScale(2.8).setAlpha(0.2);
    this.gear4 = this.add.image(width * 0.74, height * 0.82, 'industrial-gear').setScale(1.9).setAlpha(0.22);
    this.mainContainer.add([this.gear1, this.gear2, this.gear3, this.gear4]);

    // Bilateral Steam Emitters
    const steamL = this.add.particles(width * 0.15, height - 90, 'steam-puff', {
      speed: { min: 25, max: 65 },
      angle: { min: 260, max: 280 },
      scale: { start: 0.6, end: 2.2 },
      alpha: { start: 0.45, end: 0 },
      lifespan: 3200,
      frequency: 240
    });

    const steamR = this.add.particles(width * 0.82, height - 100, 'steam-puff', {
      speed: { min: 20, max: 55 },
      angle: { min: 250, max: 270 },
      scale: { start: 0.5, end: 1.9 },
      alpha: { start: 0.4, end: 0 },
      lifespan: 3000,
      frequency: 320
    });
    this.mainContainer.add([steamL, steamR]);

    // Ground Platform
    const ground = this.add.graphics();
    ground.fillStyle(0x292524, 1);
    ground.fillRoundedRect(width / 2 - 320, height / 2 + 180, 640, 110, 36);
    ground.lineStyle(3, 0x44403c, 1);
    ground.strokeRoundedRect(width / 2 - 320, height / 2 + 180, 640, 110, 36);
    this.mainContainer.add(ground);

    // Animated Josef Preview with Eye Tracking
    this.createJosefPreview(width / 2, height / 2 + 105);

    // Header Badge
    const badgeBg = this.add.graphics();
    badgeBg.fillStyle(0xf59e0b, 0.12);
    badgeBg.fillRoundedRect(width / 2 - 140, height / 2 - 210, 280, 36, 18);
    badgeBg.lineStyle(1.5, 0xf59e0b, 0.4);
    badgeBg.strokeRoundedRect(width / 2 - 140, height / 2 - 210, 280, 36, 18);

    const badgeText = this.add.text(width / 2, height / 2 - 192, '• AMANITA CLOCKWORK ODYSSEY •', {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '12px',
      fontStyle: '900',
      color: '#f59e0b',
      letterSpacing: '1.5px'
    }).setOrigin(0.5);
    this.mainContainer.add([badgeBg, badgeText]);

    // Main Game Title (Amanita Machinarium Style)
    const title = this.add.text(width / 2, height / 2 - 135, 'MACHINARIUM', {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: 'clamp(44px, 6vw, 76px)',
      fontStyle: '900',
      color: '#ffffff',
      letterSpacing: '6px'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      y: title.y - 8,
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    this.mainContainer.add(title);

    // Subtitle
    const subtitle = this.add.text(width / 2, height / 2 - 68, 'POINT & CLICK SCRAPHEAP AWAKENING', {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: '15px',
      fontWeight: '800',
      color: '#a8a29e',
      letterSpacing: '2px'
    }).setOrigin(0.5);
    this.mainContainer.add(subtitle);

    // Launch Button
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0xb45309, 1);
    btnBg.fillRoundedRect(-140, -30, 280, 60, 30);
    btnBg.lineStyle(2.5, 0xf59e0b, 0.9);
    btnBg.strokeRoundedRect(-140, -30, 280, 60, 30);

    const btnText = this.add.text(0, 0, 'BEGIN ADVENTURE', {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: '18px',
      fontStyle: '900',
      color: '#ffffff',
      letterSpacing: '2px'
    }).setOrigin(0.5);

    const startButton = this.add.container(width / 2, height / 2 + 225, [btnBg, btnText]);
    startButton.setSize(280, 60);
    startButton.setInteractive({ useHandCursor: true });

    startButton.on('pointerover', () => {
      this.tweens.add({
        targets: startButton,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 150,
        ease: 'Power2'
      });
    });

    startButton.on('pointerout', () => {
      this.tweens.add({
        targets: startButton,
        scaleX: 1,
        scaleY: 1,
        duration: 150,
        ease: 'Power2'
      });
    });

    startButton.on('pointerdown', () => {
      machinariumAudio.init();
      machinariumAudio.playPickup();
      machinariumAudio.startAmbientSoundtrack();
      this.cameras.main.fade(400, 12, 10, 8);
      this.time.delayedCall(400, () => {
        this.scene.start('MachinariumGameScene');
      });
    });
    this.mainContainer.add(startButton);

    // Fullscreen Toggle Button in Top Right
    this.createFullscreenButton(width);

    // Atmospheric Edge Vignette
    const vignette = this.add.image(width / 2, height / 2, 'screen-vignette')
      .setDisplaySize(width, height)
      .setAlpha(0.7)
      .setDepth(50);
    this.mainContainer.add(vignette);

    // Keyboard ENTER / SPACE to start
    this.input.keyboard.once('keydown-SPACE', () => startButton.emit('pointerdown'));
    this.input.keyboard.once('keydown-ENTER', () => startButton.emit('pointerdown'));
  }

  createFullscreenButton(width) {
    const fsContainer = this.add.container(width - 85, 42).setDepth(60);
    const fsBg = this.add.graphics();
    fsBg.fillStyle(0x1c1815, 0.9);
    fsBg.fillRoundedRect(-60, -20, 120, 40, 20);
    fsBg.lineStyle(1.5, 0xf59e0b, 0.5);
    fsBg.strokeRoundedRect(-60, -20, 120, 40, 20);

    const fsText = this.add.text(0, 0, '⛶ FULLSCREEN', {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '11px',
      fontStyle: '900',
      color: '#f59e0b'
    }).setOrigin(0.5);

    fsContainer.add([fsBg, fsText]);
    fsContainer.setSize(120, 40);
    fsContainer.setInteractive({ useHandCursor: true });

    fsContainer.on('pointerdown', (pointer, lx, ly, event) => {
      event.stopPropagation();
      if (this.scale.isFullscreen) {
        this.scale.stopFullscreen();
      } else {
        this.scale.startFullscreen();
      }
    });
    this.mainContainer.add(fsContainer);
  }

  createJosefPreview(x, y) {
    this.previewContainer = this.add.container(x, y).setDepth(20);

    const legL = this.add.image(-12, 30, 'robot-leg');
    const legR = this.add.image(12, 30, 'robot-leg');
    const body = this.add.image(0, 0, 'robot-torso');
    const armL = this.add.image(-28, 4, 'robot-arm');
    const armR = this.add.image(28, 4, 'robot-arm');
    const head = this.add.image(0, -42, 'robot-head');

    // Dynamic Tracking Pupils
    this.pupilL = this.add.image(-7, -42, 'robot-pupil');
    this.pupilR = this.add.image(7, -42, 'robot-pupil');

    this.previewContainer.add([legL, legR, body, armL, armR, head, this.pupilL, this.pupilR]);
    this.mainContainer.add(this.previewContainer);

    // Idle breathing & micro-stretching animation
    this.tweens.add({
      targets: [head, this.pupilL, this.pupilR],
      y: '-=6',
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.tweens.add({
      targets: [armL, armR],
      angle: { from: -5, to: 5 },
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  update() {
    if (this.gear1) this.gear1.rotation += 0.003;
    if (this.gear2) this.gear2.rotation -= 0.005;
    if (this.gear3) this.gear3.rotation += 0.0025;
    if (this.gear4) this.gear4.rotation -= 0.004;

    // Track mouse pointer with Josef's pupils
    if (this.pupilL && this.pupilR && this.previewContainer) {
      const pointer = this.input.activePointer;
      const headGlobalY = this.previewContainer.y - 42;
      const angle = Phaser.Math.Angle.Between(this.previewContainer.x, headGlobalY, pointer.x, pointer.y);
      const dist = Math.min(3.5, Phaser.Math.Distance.Between(this.previewContainer.x, headGlobalY, pointer.x, pointer.y) / 80);
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;

      this.pupilL.x = -7 + dx;
      this.pupilL.y = -42 + dy;
      this.pupilR.x = 7 + dx;
      this.pupilR.y = -42 + dy;
    }
  }
}
