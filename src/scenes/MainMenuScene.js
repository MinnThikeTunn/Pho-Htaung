import Phaser from 'phaser';
import { audioSynth } from '../utils/AudioSynth.js';

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
  }

  create() {
    const { width, height } = this.cameras.main;

    // Ambient floating starfield background
    this.createStarfield(width, height);

    // Main Title with bold font-black styling
    const title = this.add.text(width / 2, height / 2 - 120, 'COSMIC ORBIT', {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: '56px',
      fontStyle: '900',
      color: '#ffffff',
      letterSpacing: '3px'
    }).setOrigin(0.5);

    // Subtle floating animation on title
    this.tweens.add({
      targets: title,
      y: title.y - 8,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Subtitle
    this.add.text(width / 2, height / 2 - 55, 'COLLECT STARS • DODGE ASTEROIDS • REACH THE HIGHEST SCORE', {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: '14px',
      fontWeight: '700',
      color: '#94a3b8'
    }).setOrigin(0.5);

    // High Score badge
    const highScore = localStorage.getItem('cosmic_high_score') || 0;
    this.add.text(width / 2, height / 2 - 15, `HIGH SCORE: ${highScore}`, {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: '16px',
      fontWeight: '800',
      color: '#fbbf24'
    }).setOrigin(0.5);

    // Sleek rounded play button with micro-animation
    const playBtnBg = this.add.graphics();
    playBtnBg.fillStyle(0x0284c7, 1);
    playBtnBg.fillRoundedRect(-110, -28, 220, 56, 28);
    playBtnBg.lineStyle(2, 0x38bdf8, 0.8);
    playBtnBg.strokeRoundedRect(-110, -28, 220, 56, 28);

    const playBtnText = this.add.text(0, 0, 'LAUNCH GAME', {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: '18px',
      fontStyle: '900',
      color: '#ffffff',
      letterSpacing: '1px'
    }).setOrigin(0.5);

    const playButton = this.add.container(width / 2, height / 2 + 75, [playBtnBg, playBtnText]);
    playButton.setSize(220, 56);
    playButton.setInteractive({ useHandCursor: true });

    playButton.on('pointerover', () => {
      this.tweens.add({
        targets: playButton,
        scaleX: 1.06,
        scaleY: 1.06,
        duration: 150,
        ease: 'Power2'
      });
    });

    playButton.on('pointerout', () => {
      this.tweens.add({
        targets: playButton,
        scaleX: 1,
        scaleY: 1,
        duration: 150,
        ease: 'Power2'
      });
    });

    playButton.on('pointerdown', () => {
      audioSynth.init();
      audioSynth.playCollect();
      this.cameras.main.fade(300, 11, 15, 23);
      this.time.delayedCall(300, () => {
        this.scene.start('GameScene');
      });
    });

    // Keyboard ENTER / SPACE to start
    this.input.keyboard.once('keydown-SPACE', () => {
      playButton.emit('pointerdown');
    });
    this.input.keyboard.once('keydown-ENTER', () => {
      playButton.emit('pointerdown');
    });
  }

  createStarfield(width, height) {
    const starCount = 80;
    this.starfield = [];
    for (let i = 0; i < starCount; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const size = Phaser.Math.FloatBetween(1, 2.5);
      const alpha = Phaser.Math.FloatBetween(0.3, 0.9);
      const star = this.add.circle(x, y, size, 0xffffff, alpha);
      star.speed = Phaser.Math.FloatBetween(0.2, 1.2);
      this.starfield.push(star);
    }
  }

  update() {
    if (!this.starfield) return;
    const { height } = this.cameras.main;
    for (const star of this.starfield) {
      star.y += star.speed;
      if (star.y > height) {
        star.y = 0;
        star.x = Phaser.Math.Between(0, this.cameras.main.width);
      }
    }
  }
}
