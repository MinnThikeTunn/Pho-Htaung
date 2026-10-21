import Phaser from 'phaser';
import { soundEngine } from '../utils/SoundEngine.js';
import { gameState } from '../utils/GameState.js';
import { MicroInteractions } from '../utils/MicroInteractions.js';
import SettingsModal from '../ui/SettingsModal.js';

export default class PauseScene extends Phaser.Scene {
  constructor() {
    super('PauseScene');
  }

  init(data) {
    this.callingScene = (data && data.callingScene) || gameState.state.currentScene || 'Chapter1Scene';
  }

  create() {
    const { width, height } = this.cameras.main;

    // 1. Dark backdrop overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.78);

    // 2. High-End Perplexity Rounded-[32px] Dialog Box
    const boxW = 380;
    const boxH = 340;
    const box = this.add.graphics();
    box.fillStyle(0x14100c, 0.98);
    box.fillRoundedRect(width / 2 - boxW / 2, height / 2 - boxH / 2, boxW, boxH, 32);
    box.lineStyle(2, 0xd97706, 0.85);
    box.strokeRoundedRect(width / 2 - boxW / 2, height / 2 - boxH / 2, boxW, boxH, 32);

    // 3. Headings
    this.add.text(width / 2, height / 2 - 110, '⏸️ ခေတ္တရပ်ထားသည်', {
      fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans, sans-serif',
      fontSize: '20px',
      fontStyle: '900',
      color: '#f59e0b',
      letterSpacing: '0.5px'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 82, 'GAME PAUSED', {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: '12px',
      fontWeight: '800',
      color: '#a8a29e',
      letterSpacing: '2px'
    }).setOrigin(0.5);

    // Helper for sleek action button
    const createPillButton = (y, text, isPrimary, onClick) => {
      const btnW = 280;
      const btnH = 44;
      const btn = this.add.container(width / 2, y).setSize(btnW, btnH);

      const bg = this.add.graphics();
      bg.fillStyle(isPrimary ? 0xb45309 : 0x271e17, 1);
      bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 22);
      bg.lineStyle(1.6, isPrimary ? 0xf59e0b : 0x78350f, 0.9);
      bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 22);

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

    // 1. Resume Button
    createPillButton(height / 2 - 25, '▶ ဆက်လက်ကစားမည် / RESUME', true, () => {
      this.resumeGame();
    });

    // 2. Settings Button
    createPillButton(height / 2 + 35, '⚙️ ရွေးချယ်စရာများ / SETTINGS', false, () => {
      if (!this.settingsModal) {
        this.settingsModal = new SettingsModal(this);
      }
      this.settingsModal.show();
    });

    // 3. Quit to Main Menu Button
    createPillButton(height / 2 + 95, '🏠 ပင်မ မီနူး / MAIN MENU', false, () => {
      this.scene.stop(this.callingScene);
      this.scene.stop('PauseScene');
      this.scene.start('IntroScene');
    });

    // Keyboard Shortcuts
    this.input.keyboard.on('keydown-P', () => this.resumeGame());
    this.input.keyboard.on('keydown-ESC', () => {
      if (this.settingsModal && this.settingsModal.isOpen()) {
        this.settingsModal.close();
      } else {
        this.resumeGame();
      }
    });
  }

  resumeGame() {
    soundEngine.playPickup();
    this.scene.stop();
    if (this.scene.isPaused(this.callingScene)) {
      this.scene.resume(this.callingScene);
    }
  }
}
