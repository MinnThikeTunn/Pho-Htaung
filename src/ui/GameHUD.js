// High-End Perplexity-Aesthetic Universal Game HUD
// Features: Rounded-[32px] pill container, death counter, audio toggle, hotspot hint pulse, fullscreen, options modal

import Phaser from 'phaser';
import { gameState, toBurmeseNumeral } from '../utils/GameState.js';
import { soundEngine } from '../utils/SoundEngine.js';
import { AmbientAtmosphere } from '../utils/AmbientAtmosphere.js';
import { MicroInteractions } from '../utils/MicroInteractions.js';
import SettingsModal from './SettingsModal.js';

export default class GameHUD {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.options = options;
    this.container = null;
    this.settingsModal = new SettingsModal(scene);
    this.create();
  }

  create() {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;

    this.container = this.scene.add.container(width - 150, 42).setDepth(350);

    // Rounded Pill Container
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x14100c, 0.92);
    bg.fillRoundedRect(-140, -22, 280, 44, 22);
    bg.lineStyle(1.8, 0xd97706, 0.7);
    bg.strokeRoundedRect(-140, -22, 280, 44, 22);
    this.container.add(bg);

    // 1. Death Counter Badge (Left of pill)
    this.deathText = this.scene.add.text(-125, 0, `💀 ${gameState.getDeathCountBurmese()}`, {
      fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans',
      fontSize: '13px',
      fontStyle: '900',
      color: '#f87171'
    }).setOrigin(0, 0.5);
    this.container.add(this.deathText);

    // Helper to make sleek circular button
    const createIconButton = (x, iconText, tooltipText, onClick) => {
      const btn = this.scene.add.container(x, 0).setSize(32, 32);

      const btnBg = this.scene.add.graphics();
      btnBg.fillStyle(0x271e17, 0.9);
      btnBg.fillCircle(0, 0, 15);
      btnBg.lineStyle(1.2, 0x78350f, 0.9);
      btnBg.strokeCircle(0, 0, 15);

      const label = this.scene.add.text(0, 0, iconText, {
        fontSize: '14px',
        color: '#fef08a'
      }).setOrigin(0.5);

      btn.add([btnBg, label]);
      btn.setInteractive({ useHandCursor: true });
      MicroInteractions.makeInteractiveHover(btn, 1.15);

      btn.on('pointerdown', (pointer, lx, ly, event) => {
        if (event && event.stopPropagation) event.stopPropagation();
        onClick(btn, label);
      });

      this.container.add(btn);
      return { btn, label };
    };

    // 2. Hotspot Hint Button (💡)
    this.hintBtn = createIconButton(-20, '💡', 'အရာဝတ္ထုများ ပြပါ (Hotspots)', () => {
      AmbientAtmosphere.triggerHotspotPulse(this.scene);
    });

    // 3. Audio / Mute Toggle Button (🔊/🔇)
    const initialAudioIcon = soundEngine.isMuted() ? '🔇' : '🔊';
    this.audioBtn = createIconButton(22, initialAudioIcon, 'အသံ ဖွင့်/ပိတ်', (btn, label) => {
      const isMuted = soundEngine.toggleMute();
      label.setText(isMuted ? '🔇' : '🔊');
    });

    // 4. Fullscreen Toggle Button (⛶)
    this.fsBtn = createIconButton(64, '⛶', 'မျက်နှာပြင်ပြည့်', () => {
      if (this.scene.scale.isFullscreen) {
        this.scene.scale.stopFullscreen();
      } else {
        this.scene.scale.startFullscreen();
      }
    });

    // 5. Options Menu Button (⚙️)
    this.menuBtn = createIconButton(106, '⚙️', 'မီနူး', () => {
      this.toggleOptionsMenu();
    });

    // Setup Keyboard Shortcuts
    this.setupHotkeys();

    // Resize handler
    const resizeHandler = (gameSize) => {
      if (this.container && this.container.active) {
        this.resize(gameSize.width, gameSize.height);
      }
    };
    this.scene.scale.on('resize', resizeHandler);
    this.scene.events.once('shutdown', () => {
      this.scene.scale.off('resize', resizeHandler);
    });
  }

  setupHotkeys() {
    // Space or H -> Hotspot pulse
    this.scene.input.keyboard.on('keydown-SPACE', (e) => {
      AmbientAtmosphere.triggerHotspotPulse(this.scene);
    });
    this.scene.input.keyboard.on('keydown-H', (e) => {
      AmbientAtmosphere.triggerHotspotPulse(this.scene);
    });

    // M -> Mute toggle
    this.scene.input.keyboard.on('keydown-M', (e) => {
      const isMuted = soundEngine.toggleMute();
      if (this.audioBtn && this.audioBtn.label) {
        this.audioBtn.label.setText(isMuted ? '🔇' : '🔊');
      }
    });

    // F -> Fullscreen toggle
    this.scene.input.keyboard.on('keydown-F', (e) => {
      if (this.scene.scale.isFullscreen) {
        this.scene.scale.stopFullscreen();
      } else {
        this.scene.scale.startFullscreen();
      }
    });

    // ESC -> Options menu toggle
    this.scene.input.keyboard.on('keydown-ESC', (e) => {
      this.toggleOptionsMenu();
    });
  }

  updateDeathCount() {
    if (this.deathText) {
      this.deathText.setText(`💀 ${gameState.getDeathCountBurmese()}`);
    }
  }

  toggleOptionsMenu() {
    if (this.settingsModal && this.settingsModal.isOpen()) {
      this.closeOptionsMenu();
    } else {
      this.openOptionsMenu();
    }
  }

  openOptionsMenu() {
    if (this.settingsModal) {
      this.settingsModal.show();
    }
  }

  closeOptionsMenu() {
    if (this.settingsModal) {
      this.settingsModal.close();
    }
  }

  resize(width, height) {
    if (this.container) {
      if (width < 960) {
        this.container.setPosition(width - 125, 36);
        this.container.setScale(0.82);
      } else {
        this.container.setPosition(width - 150, 42);
        this.container.setScale(1);
      }
    }
    if (this.settingsModal && this.settingsModal.container) {
      this.settingsModal.container.setPosition(width / 2, height / 2);
    }
  }
}
