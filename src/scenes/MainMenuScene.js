import Phaser from 'phaser';
import { machinariumAudio } from '../utils/MachinariumAudio.js';

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
  }

  create() {
    const { width, height } = this.cameras.main;

    // Atmospheric Warm/Rusty Gradient Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1c1917, 0x1c1917, 0x0c0a09, 0x0c0a09, 1);
    bg.fillRect(0, 0, width, height);

    // Distant Steampunk Industrial Silhouette
    this.createCitySkyline(width, height);

    // Animated Rotating Industrial Gears in the background
    this.gear1 = this.add.image(140, 150, 'industrial-gear').setScale(1.8).setAlpha(0.25);
    this.gear2 = this.add.image(210, 205, 'industrial-gear').setScale(1.2).setAlpha(0.3);
    this.gear3 = this.add.image(width - 120, height - 160, 'industrial-gear').setScale(2.2).setAlpha(0.2);

    // Rising Steam Emitter
    this.add.particles(140, height - 60, 'steam-puff', {
      speed: { min: 20, max: 50 },
      angle: { min: 260, max: 280 },
      scale: { start: 0.6, end: 1.8 },
      alpha: { start: 0.4, end: 0 },
      lifespan: 3000,
      frequency: 200
    });

    // Decorative Ground Scrap Platform
    const ground = this.add.graphics();
    ground.fillStyle(0x292524, 1);
    ground.fillRoundedRect(width / 2 - 240, height / 2 + 150, 480, 80, 24);
    ground.lineStyle(2, 0x44403c, 1);
    ground.strokeRoundedRect(width / 2 - 240, height / 2 + 150, 480, 80, 24);

    // Animated Josef Preview on Main Menu
    this.createJosefPreview(width / 2, height / 2 + 95);

    // Main Game Title (Amanita Machinarium Style)
    const title = this.add.text(width / 2, height / 2 - 130, 'MACHINARIUM', {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: '52px',
      fontStyle: '900',
      color: '#f59e0b',
      letterSpacing: '4px'
    }).setOrigin(0.5);

    // Gentle mechanical float on title
    this.tweens.add({
      targets: title,
      y: title.y - 6,
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Subtitle & Lore
    this.add.text(width / 2, height / 2 - 70, 'THE SCRAPHEAP AWAKENING • POINT & CLICK ODYSSEY', {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: '13px',
      fontWeight: '800',
      color: '#a8a29e',
      letterSpacing: '1px'
    }).setOrigin(0.5);

    // Start Button Container
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0xb45309, 1);
    btnBg.fillRoundedRect(-110, -26, 220, 52, 26);
    btnBg.lineStyle(2, 0xf59e0b, 0.9);
    btnBg.strokeRoundedRect(-110, -26, 220, 52, 26);

    const btnText = this.add.text(0, 0, 'ENTER SCRAPHEAP', {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: '16px',
      fontStyle: '900',
      color: '#ffffff',
      letterSpacing: '1.5px'
    }).setOrigin(0.5);

    const startButton = this.add.container(width / 2, height / 2 + 180, [btnBg, btnText]);
    startButton.setSize(220, 52);
    startButton.setInteractive({ useHandCursor: true });

    startButton.on('pointerover', () => {
      this.tweens.add({
        targets: startButton,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 140,
        ease: 'Power2'
      });
    });

    startButton.on('pointerout', () => {
      this.tweens.add({
        targets: startButton,
        scaleX: 1,
        scaleY: 1,
        duration: 140,
        ease: 'Power2'
      });
    });

    startButton.on('pointerdown', () => {
      machinariumAudio.init();
      machinariumAudio.playPickup();
      machinariumAudio.startAmbientSoundtrack();
      this.cameras.main.fade(400, 20, 16, 12);
      this.time.delayedCall(400, () => {
        this.scene.start('MachinariumGameScene');
      });
    });

    // Keyboard ENTER / SPACE
    this.input.keyboard.once('keydown-SPACE', () => startButton.emit('pointerdown'));
    this.input.keyboard.once('keydown-ENTER', () => startButton.emit('pointerdown'));
  }

  createCitySkyline(width, height) {
    const skyline = this.add.graphics();
    skyline.fillStyle(0x1c1917, 0.7);

    // Distant towers and industrial smokestacks
    skyline.fillRect(60, height - 320, 90, 320);
    skyline.fillRect(170, height - 260, 60, 260);
    skyline.fillRect(width - 240, height - 380, 110, 380);
    skyline.fillRect(width - 110, height - 290, 80, 290);

    // Pipes connecting buildings
    skyline.lineStyle(6, 0x292524, 0.6);
    skyline.lineBetween(150, height - 280, 220, height - 220);
    skyline.lineBetween(width - 240, height - 330, width - 110, height - 260);
  }

  createJosefPreview(x, y) {
    const previewContainer = this.add.container(x, y);

    const legL = this.add.image(-10, 24, 'robot-leg');
    const legR = this.add.image(10, 24, 'robot-leg');
    const body = this.add.image(0, 0, 'robot-torso');
    const armL = this.add.image(-22, 2, 'robot-arm');
    const armR = this.add.image(22, 2, 'robot-arm');
    const head = this.add.image(0, -32, 'robot-head');

    previewContainer.add([legL, legR, body, armL, armR, head]);

    // Idle breathing & micro-stretching animation
    this.tweens.add({
      targets: head,
      y: -36,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.tweens.add({
      targets: [armL, armR],
      angle: { from: -4, to: 4 },
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  update() {
    if (this.gear1) this.gear1.rotation += 0.005;
    if (this.gear2) this.gear2.rotation -= 0.007;
    if (this.gear3) this.gear3.rotation += 0.003;
  }
}
