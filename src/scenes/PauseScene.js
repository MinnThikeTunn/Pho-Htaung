import Phaser from 'phaser';
import { audioSynth } from '../utils/AudioSynth.js';

export default class PauseScene extends Phaser.Scene {
  constructor() {
    super('PauseScene');
  }

  create() {
    const { width, height } = this.cameras.main;

    // Dark backdrop overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0x050811, 0.75);

    // Pause Dialog Box
    const box = this.add.graphics();
    box.fillStyle(0x141b26, 1);
    box.fillRoundedRect(width / 2 - 180, height / 2 - 120, 360, 240, 32);
    box.lineStyle(1.5, 0x38bdf8, 0.4);
    box.strokeRoundedRect(width / 2 - 180, height / 2 - 120, 360, 240, 32);

    // Heading
    this.add.text(width / 2, height / 2 - 70, 'GAME PAUSED', {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: '26px',
      fontStyle: '900',
      color: '#ffffff',
      letterSpacing: '1px'
    }).setOrigin(0.5);

    // Resume Button
    const resumeBtn = this.add.text(width / 2, height / 2 - 5, 'RESUME PLAY', {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: '16px',
      fontStyle: '900',
      color: '#22d3ee'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    resumeBtn.on('pointerdown', () => this.resumeGame());

    // Quit to Menu Button
    const quitBtn = this.add.text(width / 2, height / 2 + 50, 'QUIT TO MAIN MENU', {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: '14px',
      fontWeight: '700',
      color: '#94a3b8'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    quitBtn.on('pointerdown', () => {
      audioSynth.playCollect();
      this.scene.stop('GameScene');
      this.scene.stop('PauseScene');
      this.scene.start('MainMenuScene');
    });

    // Keyboard 'P' to unpause
    this.input.keyboard.on('keydown-P', () => this.resumeGame());
    this.input.keyboard.on('keydown-ESC', () => this.resumeGame());
  }

  resumeGame() {
    audioSynth.playCollect();
    this.scene.stop();
    this.scene.resume('GameScene');
  }
}
