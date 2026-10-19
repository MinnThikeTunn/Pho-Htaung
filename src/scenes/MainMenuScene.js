import Phaser from 'phaser';
import { machinariumAudio } from '../utils/MachinariumAudio.js';

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
  }

  create() {
    const { width, height } = this.cameras.main;

    // Atmospheric Warm Industrial Gradient Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x271e17, 0x271e17, 0x0c0a08, 0x0c0a08, 1);
    bg.fillRect(0, 0, width, height);

    // Volumetric Twilight God-Rays
    const rays = this.add.graphics();
    rays.fillStyle(0xf59e0b, 0.06);
    rays.fillTriangle(width * 0.4, 0, width * 0.1, height, width * 0.7, height);
    rays.fillTriangle(width * 0.7, 0, width * 0.45, height, width * 0.95, height);

    // Cityscape Silhouettes
    this.createCitySkyline(width, height);

    // Animated Rotating Industrial Gears in the background
    this.gear1 = this.add.image(180, 200, 'industrial-gear').setScale(2.2).setAlpha(0.22);
    this.gear2 = this.add.image(280, 280, 'industrial-gear').setScale(1.6).setAlpha(0.28);
    this.gear3 = this.add.image(width - 180, height - 200, 'industrial-gear').setScale(2.8).setAlpha(0.18);
    this.gear4 = this.add.image(width - 290, height - 130, 'industrial-gear').setScale(1.8).setAlpha(0.22);

    // Rising Steam Emitter
    this.add.particles(180, height - 80, 'steam-puff', {
      speed: { min: 25, max: 60 },
      angle: { min: 260, max: 280 },
      scale: { start: 0.6, end: 2.2 },
      alpha: { start: 0.4, end: 0 },
      lifespan: 3200,
      frequency: 220
    });

    this.add.particles(width - 240, height - 90, 'steam-puff', {
      speed: { min: 20, max: 50 },
      angle: { min: 250, max: 270 },
      scale: { start: 0.5, end: 1.8 },
      alpha: { start: 0.35, end: 0 },
      lifespan: 3000,
      frequency: 300
    });

    // Decorative Ground Scrap Platform
    const ground = this.add.graphics();
    ground.fillStyle(0x292524, 1);
    ground.fillRoundedRect(width / 2 - 300, height / 2 + 180, 600, 100, 32);
    ground.lineStyle(3, 0x44403c, 1);
    ground.strokeRoundedRect(width / 2 - 300, height / 2 + 180, 600, 100, 32);

    // Animated Josef Preview with Eyeball Tracking
    this.createJosefPreview(width / 2, height / 2 + 110);

    // Badge
    const badgeBg = this.add.graphics();
    badgeBg.fillStyle(0xf59e0b, 0.12);
    badgeBg.fillRoundedRect(width / 2 - 130, height / 2 - 200, 260, 34, 17);
    badgeBg.lineStyle(1.5, 0xf59e0b, 0.35);
    badgeBg.strokeRoundedRect(width / 2 - 130, height / 2 - 200, 260, 34, 17);

    this.add.text(width / 2, height / 2 - 183, '• AMANITA DESIGN TRIBUTE •', {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '12px',
      fontStyle: '900',
      color: '#f59e0b',
      letterSpacing: '1.5px'
    }).setOrigin(0.5);

    // Main Game Title (Amanita Machinarium Style)
    const title = this.add.text(width / 2, height / 2 - 130, 'MACHINARIUM', {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: '68px',
      fontStyle: '900',
      color: '#ffffff',
      letterSpacing: '6px'
    }).setOrigin(0.5);

    // Gentle mechanical float on title
    this.tweens.add({
      targets: title,
      y: title.y - 8,
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Subtitle & Lore
    this.add.text(width / 2, height / 2 - 65, 'THE SCRAPHEAP AWAKENING • POINT & CLICK ODYSSEY', {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: '15px',
      fontWeight: '800',
      color: '#a8a29e',
      letterSpacing: '1.5px'
    }).setOrigin(0.5);

    // Start Button Container
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0xb45309, 1);
    btnBg.fillRoundedRect(-130, -30, 260, 60, 30);
    btnBg.lineStyle(2.5, 0xf59e0b, 0.9);
    btnBg.strokeRoundedRect(-130, -30, 260, 60, 30);

    const btnText = this.add.text(0, 0, 'ENTER SCRAPHEAP', {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: '18px',
      fontStyle: '900',
      color: '#ffffff',
      letterSpacing: '2px'
    }).setOrigin(0.5);

    const startButton = this.add.container(width / 2, height / 2 + 215, [btnBg, btnText]);
    startButton.setSize(260, 60);
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

    // Fullscreen Toggle Button in Top Right
    this.createFullscreenButton(width);

    // Keyboard ENTER / SPACE
    this.input.keyboard.once('keydown-SPACE', () => startButton.emit('pointerdown'));
    this.input.keyboard.once('keydown-ENTER', () => startButton.emit('pointerdown'));
  }

  createFullscreenButton(width) {
    const fsContainer = this.add.container(width - 80, 40);
    const fsBg = this.add.graphics();
    fsBg.fillStyle(0x1c1815, 0.85);
    fsBg.fillRoundedRect(-55, -20, 110, 40, 20);
    fsBg.lineStyle(1.5, 0xf59e0b, 0.5);
    fsBg.strokeRoundedRect(-55, -20, 110, 40, 20);

    const fsText = this.add.text(0, 0, '⛶ FULLSCREEN', {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '11px',
      fontStyle: '900',
      color: '#f59e0b'
    }).setOrigin(0.5);

    fsContainer.add([fsBg, fsText]);
    fsContainer.setSize(110, 40);
    fsContainer.setInteractive({ useHandCursor: true });

    fsContainer.on('pointerdown', () => {
      if (this.scale.isFullscreen) {
        this.scale.stopFullscreen();
      } else {
        this.scale.startFullscreen();
      }
    });
  }

  createCitySkyline(width, height) {
    const skyline = this.add.graphics();
    skyline.fillStyle(0x181310, 0.85);

    // Distant towers and industrial smokestacks
    skyline.fillRect(80, height - 400, 130, 400);
    skyline.fillRect(230, height - 320, 80, 320);
    skyline.fillRect(width - 340, height - 460, 150, 460);
    skyline.fillRect(width - 170, height - 350, 130, 350);

    // Pipes connecting buildings
    skyline.lineStyle(8, 0x241d18, 0.7);
    skyline.lineBetween(210, height - 340, 310, height - 270);
    skyline.lineBetween(width - 340, height - 400, width - 170, height - 310);
  }

  createJosefPreview(x, y) {
    this.previewContainer = this.add.container(x, y);

    const legL = this.add.image(-12, 30, 'robot-leg');
    const legR = this.add.image(12, 30, 'robot-leg');
    const body = this.add.image(0, 0, 'robot-torso');
    const armL = this.add.image(-28, 4, 'robot-arm');
    const armR = this.add.image(28, 4, 'robot-arm');
    const head = this.add.image(0, -42, 'robot-head');

    // Dynamic Tracking Pupils
    this.pupilL = this.add.image(-6, -42, 'robot-pupil');
    this.pupilR = this.add.image(6, -42, 'robot-pupil');

    this.previewContainer.add([legL, legR, body, armL, armR, head, this.pupilL, this.pupilR]);

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
    if (this.gear1) this.gear1.rotation += 0.004;
    if (this.gear2) this.gear2.rotation -= 0.006;
    if (this.gear3) this.gear3.rotation += 0.003;
    if (this.gear4) this.gear4.rotation -= 0.005;

    // Track mouse pointer with Josef's pupils
    if (this.pupilL && this.pupilR && this.previewContainer) {
      const pointer = this.input.activePointer;
      const angle = Phaser.Math.Angle.Between(this.previewContainer.x, this.previewContainer.y - 42, pointer.x, pointer.y);
      const dist = Math.min(3, Phaser.Math.Distance.Between(this.previewContainer.x, this.previewContainer.y - 42, pointer.x, pointer.y) / 80);
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;

      this.pupilL.x = -6 + dx;
      this.pupilL.y = -42 + dy;
      this.pupilR.x = 6 + dx;
      this.pupilR.y = -42 + dy;
    }
  }
}
