import Phaser from 'phaser';
import { soundEngine } from '../utils/SoundEngine.js';
import { gameState } from '../utils/GameState.js';
import { MicroInteractions } from '../utils/MicroInteractions.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  init(data) {
    this.finalScore = (data && data.score) || 0;
    this.targetScene = (data && data.currentScene) || gameState.state.currentScene || 'Chapter1Scene';
  }

  create() {
    const { width, height } = this.cameras.main;

    // 1. Semi-transparent dark overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0705, 0.88);

    // 2. High-End Perplexity Rounded-[32px] Dialog Container
    const boxW = 420;
    const boxH = 360;
    const box = this.add.graphics();
    box.fillStyle(0x14100c, 0.98);
    box.fillRoundedRect(width / 2 - boxW / 2, height / 2 - boxH / 2, boxW, boxH, 32);
    box.lineStyle(2, 0xd97706, 0.85);
    box.strokeRoundedRect(width / 2 - boxW / 2, height / 2 - boxH / 2, boxW, boxH, 32);

    // 3. Comedic Slapstick Title
    this.add.text(width / 2, height / 2 - 120, '💀 အသက်ပျောက်သွားပါပြီ!', {
      fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans, sans-serif',
      fontSize: '22px',
      fontStyle: '900',
      color: '#f87171',
      letterSpacing: '0.5px'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 92, 'DIED AGAIN IN BAGAN', {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: '12px',
      fontWeight: '800',
      color: '#a8a29e',
      letterSpacing: '2px'
    }).setOrigin(0.5);

    // 4. Narrative Subtitle
    this.add.text(width / 2, height / 2 - 55, 'ဦးကြီးရဲ့ အကြံပေးချက်ကို ယုံမိသွားတဲ့ မောင်ဖိုးထောင်...', {
      fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans, sans-serif',
      fontSize: '13px',
      color: '#d6d3d1'
    }).setOrigin(0.5);

    // 5. Death Counter Badge (Burmese Numeral)
    const deathTally = gameState.getDeathCountBurmese();
    const deathBadge = this.add.text(width / 2, height / 2 - 15, `💀 စုစုပေါင်း သေဆုံးမှု: ${deathTally} ကြိမ်`, {
      fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans, sans-serif',
      fontSize: '15px',
      fontStyle: '900',
      color: '#f59e0b'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: deathBadge,
      scale: 1.05,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Helper for sleek rounded button
    const createPillButton = (y, text, isPrimary, onClick) => {
      const btnW = 280;
      const btnH = 46;
      const btn = this.add.container(width / 2, y).setSize(btnW, btnH);

      const bg = this.add.graphics();
      bg.fillStyle(isPrimary ? 0xb45309 : 0x271e17, 1);
      bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 23);
      bg.lineStyle(1.6, isPrimary ? 0xf59e0b : 0x78350f, 0.95);
      bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 23);

      const label = this.add.text(0, 0, text, {
        fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans, sans-serif',
        fontSize: '13px',
        fontStyle: '900',
        color: '#ffffff'
      }).setOrigin(0.5);

      btn.add([bg, label]);
      btn.setInteractive({ useHandCursor: true });
      MicroInteractions.makeInteractiveHover(btn, 1.05);

      btn.on('pointerdown', (p, lx, ly, ev) => {
        if (ev && ev.stopPropagation) ev.stopPropagation();
        soundEngine.playPickup();
        onClick();
      });

      return btn;
    };

    // 1. Try Again Button
    const restartBtn = createPillButton(height / 2 + 50, '🔄 ပြန်လည်ကြိုးစားမည် / TRY AGAIN', true, () => {
      this.cameras.main.fade(300, 12, 10, 8);
      this.time.delayedCall(300, () => {
        this.scene.start(this.targetScene);
      });
    });

    // 2. Main Menu Button
    createPillButton(height / 2 + 112, '🏠 ပင်မ မီနူး / MAIN MENU', false, () => {
      this.cameras.main.fade(300, 12, 10, 8);
      this.time.delayedCall(300, () => {
        this.scene.start('IntroScene');
      });
    });

    // Keyboard Shortcuts
    this.input.keyboard.once('keydown-SPACE', () => restartBtn.emit('pointerdown'));
    this.input.keyboard.once('keydown-ENTER', () => restartBtn.emit('pointerdown'));
  }
}
