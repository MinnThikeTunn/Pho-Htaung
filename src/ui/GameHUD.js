// High-End Perplexity-Aesthetic Universal Game HUD
// Features: Rounded-[32px] pill container, death counter, audio toggle, hotspot hint pulse, fullscreen, options modal

import Phaser from 'phaser';
import { gameState, toBurmeseNumeral } from '../utils/GameState.js';
import { soundEngine } from '../utils/SoundEngine.js';
import { AmbientAtmosphere } from '../utils/AmbientAtmosphere.js';
import { MicroInteractions } from '../utils/MicroInteractions.js';

export default class GameHUD {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.options = options;
    this.container = null;
    this.menuModal = null;
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
    this.scene.scale.on('resize', (gameSize) => {
      this.resize(gameSize.width, gameSize.height);
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
    if (this.menuModal) {
      this.closeOptionsMenu();
    } else {
      this.openOptionsMenu();
    }
  }

  openOptionsMenu() {
    soundEngine.playPickup();
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;

    this.menuModal = this.scene.add.container(width / 2, height / 2).setDepth(500);

    // Dim background
    const dim = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.72)
      .setInteractive();
    dim.on('pointerdown', (p, lx, ly, ev) => {
      ev.stopPropagation();
      this.closeOptionsMenu();
    });

    // Modal dialog box (rounded-[32px], Perplexity aesthetic)
    const box = this.scene.add.graphics();
    box.fillStyle(0x17120e, 0.98);
    box.fillRoundedRect(-180, -140, 360, 280, 32);
    box.lineStyle(2, 0xd97706, 0.85);
    box.strokeRoundedRect(-180, -140, 360, 280, 32);

    const title = this.scene.add.text(0, -95, '⚙️ မီနူး / OPTIONS', {
      fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans',
      fontSize: '17px',
      fontStyle: '900',
      color: '#f59e0b',
      letterSpacing: '1px'
    }).setOrigin(0.5);

    const subtitle = this.scene.add.text(0, -65, 'ဖိုးထောင် - ပုဂံရွှေမြို့တော်ရှာပုံတော်', {
      fontFamily: 'Noto Sans Myanmar',
      fontSize: '12px',
      color: '#a8a29e'
    }).setOrigin(0.5);

    // Button 1: Restart Chapter
    const restartBtn = this.createMenuButton(0, -15, '🔄 အခန်း ပြန်စမည် (Restart Chapter)', () => {
      this.closeOptionsMenu();
      soundEngine.playPickup();
      this.scene.scene.restart();
    });

    // Button 2: Main Menu
    const menuBtn = this.createMenuButton(0, 45, '🏠 ပင်မ မီနူး (Main Menu)', () => {
      this.closeOptionsMenu();
      soundEngine.playPickup();
      this.scene.cameras.main.fade(400, 12, 10, 8);
      this.scene.time.delayedCall(400, () => {
        this.scene.scene.start('IntroScene');
      });
    });

    // Close X button
    const closeBtn = this.createMenuButton(0, 100, '❌ ပိတ်မည် (Close)', () => {
      this.closeOptionsMenu();
    });

    this.menuModal.add([dim, box, title, subtitle, restartBtn, menuBtn, closeBtn]);

    // Animate open
    this.menuModal.setScale(0.9);
    this.menuModal.setAlpha(0);
    this.scene.tweens.add({
      targets: this.menuModal,
      scale: 1,
      alpha: 1,
      duration: 180,
      ease: 'Back.Out'
    });
  }

  createMenuButton(x, y, labelText, onClick) {
    const btn = this.scene.add.container(x, y).setSize(280, 42);

    const bg = this.scene.add.graphics();
    bg.fillStyle(0x271e17, 1);
    bg.fillRoundedRect(-140, -21, 280, 42, 21);
    bg.lineStyle(1.5, 0x78350f, 0.9);
    bg.strokeRoundedRect(-140, -21, 280, 42, 21);

    const text = this.scene.add.text(0, 0, labelText, {
      fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    btn.add([bg, text]);
    btn.setInteractive({ useHandCursor: true });
    MicroInteractions.makeInteractiveHover(btn, 1.05);

    btn.on('pointerdown', (p, lx, ly, ev) => {
      if (ev && ev.stopPropagation) ev.stopPropagation();
      onClick();
    });

    return btn;
  }

  closeOptionsMenu() {
    if (!this.menuModal) return;
    soundEngine.playPickup();
    this.scene.tweens.add({
      targets: this.menuModal,
      scale: 0.9,
      alpha: 0,
      duration: 140,
      ease: 'Quad.In',
      onComplete: () => {
        if (this.menuModal) {
          this.menuModal.destroy();
          this.menuModal = null;
        }
      }
    });
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
    if (this.menuModal) {
      this.menuModal.setPosition(width / 2, height / 2);
    }
  }
}
