import Phaser from 'phaser';
import { audioSynth } from '../utils/AudioSynth.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  init(data) {
    this.finalScore = data.score || 0;
    const currentHigh = parseInt(localStorage.getItem('cosmic_high_score') || '0', 10);
    if (this.finalScore > currentHigh) {
      localStorage.setItem('cosmic_high_score', this.finalScore.toString());
      this.isNewRecord = true;
    } else {
      this.isNewRecord = false;
    }
  }

  create() {
    const { width, height } = this.cameras.main;

    // Semi-transparent overlay backdrop
    this.add.rectangle(width / 2, height / 2, width, height, 0x070a13, 0.9);

    // Title
    this.add.text(width / 2, height / 2 - 130, 'MISSION TERMINATED', {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: '44px',
      fontStyle: '900',
      color: '#f43f5e',
      letterSpacing: '2px'
    }).setOrigin(0.5);

    // Final Score
    this.add.text(width / 2, height / 2 - 50, `FINAL SCORE: ${this.finalScore}`, {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: '28px',
      fontStyle: '900',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Record badge
    if (this.isNewRecord) {
      const recordText = this.add.text(width / 2, height / 2 - 10, '★ NEW HIGH SCORE RECORD! ★', {
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        fontSize: '16px',
        fontWeight: '800',
        color: '#fbbf24'
      }).setOrigin(0.5);

      this.tweens.add({
        targets: recordText,
        scale: 1.1,
        duration: 500,
        yoyo: true,
        repeat: -1
      });
    }

    // Restart Button
    const restartBtnBg = this.add.graphics();
    restartBtnBg.fillStyle(0x0284c7, 1);
    restartBtnBg.fillRoundedRect(-110, -26, 220, 52, 26);
    restartBtnBg.lineStyle(2, 0x38bdf8, 0.8);
    restartBtnBg.strokeRoundedRect(-110, -26, 220, 52, 26);

    const restartBtnText = this.add.text(0, 0, 'PLAY AGAIN', {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: '17px',
      fontStyle: '900',
      color: '#ffffff',
      letterSpacing: '1px'
    }).setOrigin(0.5);

    const restartBtn = this.add.container(width / 2, height / 2 + 65, [restartBtnBg, restartBtnText]);
    restartBtn.setSize(220, 52);
    restartBtn.setInteractive({ useHandCursor: true });

    restartBtn.on('pointerdown', () => {
      audioSynth.playCollect();
      this.cameras.main.fade(300, 11, 15, 23);
      this.time.delayedCall(300, () => {
        this.scene.start('GameScene');
      });
    });

    // Main Menu Button
    const menuBtn = this.add.text(width / 2, height / 2 + 130, 'RETURN TO MAIN MENU', {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: '14px',
      fontWeight: '700',
      color: '#94a3b8'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    menuBtn.on('pointerdown', () => {
      audioSynth.playCollect();
      this.scene.start('MainMenuScene');
    });

    // Keyboard Shortcuts
    this.input.keyboard.once('keydown-SPACE', () => restartBtn.emit('pointerdown'));
    this.input.keyboard.once('keydown-ENTER', () => restartBtn.emit('pointerdown'));
  }
}
