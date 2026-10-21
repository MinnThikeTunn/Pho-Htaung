// SettingsModal.js — High-End Perplexity-Aesthetic Settings & Options Dialog
// Conforms to Bagan Lacquer & Teak visual standard with rounded-[32px] containers and font-black headings.

import Phaser from 'phaser';
import { gameState } from '../utils/GameState.js';
import { soundEngine } from '../utils/SoundEngine.js';
import { audioDirector } from '../audio/AudioDirector.js';
import { MicroInteractions } from '../utils/MicroInteractions.js';

export default class SettingsModal {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.options = options;
    this.container = null;
    this.currentTab = 'audio'; // 'audio' | 'gameplay' | 'controls'
    this.contentContainer = null;
    this.tabButtons = {};
    this.onCloseCallback = options.onClose || null;
  }

  show() {
    if (this.container) return;
    soundEngine.playPickup();

    const width = this.scene.scale.width;
    const height = this.scene.scale.height;

    this.container = this.scene.add.container(width / 2, height / 2).setDepth(600);

    // 1. Semi-transparent backdrop overlay
    const backdrop = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.76)
      .setInteractive();
    backdrop.on('pointerdown', (p, lx, ly, ev) => {
      if (ev && ev.stopPropagation) ev.stopPropagation();
      this.close();
    });
    this.container.add(backdrop);

    // 2. Perplexity Rounded-[32px] Dialog Container
    const modalW = Math.min(520, width - 40);
    const modalH = Math.min(500, height - 60);
    this.modalW = modalW;
    this.modalH = modalH;

    const box = this.scene.add.graphics();
    // Warm Burmese Lacquer dark charcoal background
    box.fillStyle(0x14100c, 0.98);
    box.fillRoundedRect(-modalW / 2, -modalH / 2, modalW, modalH, 32);
    // Amber / Gold Foil Accent Outline
    box.lineStyle(2, 0xd97706, 0.85);
    box.strokeRoundedRect(-modalW / 2, -modalH / 2, modalW, modalH, 32);
    this.container.add(box);

    // 3. Header: Font-Black Title & Subtitle
    const title = this.scene.add.text(0, -modalH / 2 + 38, '⚙️ ရွေးချယ်စရာများ / SETTINGS', {
      fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans, sans-serif',
      fontSize: '18px',
      fontStyle: '900',
      color: '#f59e0b',
      letterSpacing: '1px'
    }).setOrigin(0.5);

    const subtitle = this.scene.add.text(0, -modalH / 2 + 64, 'ဖိုးထောင် - ပုဂံရွှေမြို့တော်ရှာပုံတော်', {
      fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans, sans-serif',
      fontSize: '12px',
      fontWeight: '600',
      color: '#a8a29e'
    }).setOrigin(0.5);

    this.container.add([title, subtitle]);

    // 4. Tab Navigation Bar (Audio | Gameplay | Controls)
    this.createTabBar(-modalH / 2 + 104);

    // 5. Dynamic Content Area Container
    this.contentContainer = this.scene.add.container(0, -modalH / 2 + 135);
    this.container.add(this.contentContainer);

    // Render active tab content
    this.renderActiveTab();

    // 6. Bottom Action Controls
    this.createBottomActions(modalH / 2 - 38);

    // 7. Micro-interaction: Spring Entrance Animation
    this.container.setScale(0.92);
    this.container.setAlpha(0);
    this.scene.tweens.add({
      targets: this.container,
      scale: 1,
      alpha: 1,
      duration: 180,
      ease: 'Back.Out'
    });
  }

  createTabBar(y) {
    const tabs = [
      { id: 'audio', label: '🔊 အသံ (Sound)' },
      { id: 'gameplay', label: '🎮 ကစားပုံ (Game)' },
      { id: 'controls', label: '⌨️ ခလုတ်များ (Keys)' }
    ];

    const tabW = (this.modalW - 56) / 3;
    const startX = -this.modalW / 2 + 28 + tabW / 2;

    tabs.forEach((tab, idx) => {
      const tx = startX + idx * tabW;
      const tabBtn = this.scene.add.container(tx, y).setSize(tabW - 6, 34);

      const bg = this.scene.add.graphics();
      tabBtn.bg = bg;

      const label = this.scene.add.text(0, 0, tab.label, {
        fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans, sans-serif',
        fontSize: '12px',
        fontStyle: '900',
        color: '#ffffff'
      }).setOrigin(0.5);
      tabBtn.label = label;

      tabBtn.add([bg, label]);
      tabBtn.setInteractive({ useHandCursor: true });
      MicroInteractions.makeInteractiveHover(tabBtn, 1.04);

      tabBtn.on('pointerdown', (p, lx, ly, ev) => {
        if (ev && ev.stopPropagation) ev.stopPropagation();
        soundEngine.playPickup();
        this.currentTab = tab.id;
        this.updateTabBarStyles();
        this.renderActiveTab();
      });

      this.tabButtons[tab.id] = tabBtn;
      this.container.add(tabBtn);
    });

    this.updateTabBarStyles();
  }

  updateTabBarStyles() {
    const tabW = (this.modalW - 56) / 3;
    Object.keys(this.tabButtons).forEach((tabId) => {
      const tabBtn = this.tabButtons[tabId];
      const isActive = this.currentTab === tabId;
      tabBtn.bg.clear();

      if (isActive) {
        tabBtn.bg.fillStyle(0xd97706, 1);
        tabBtn.bg.fillRoundedRect(-(tabW - 6) / 2, -17, tabW - 6, 34, 17);
        tabBtn.label.setColor('#ffffff');
      } else {
        tabBtn.bg.fillStyle(0x271e17, 0.9);
        tabBtn.bg.fillRoundedRect(-(tabW - 6) / 2, -17, tabW - 6, 34, 17);
        tabBtn.bg.lineStyle(1.2, 0x451a03, 0.9);
        tabBtn.bg.strokeRoundedRect(-(tabW - 6) / 2, -17, tabW - 6, 34, 17);
        tabBtn.label.setColor('#a8a29e');
      }
    });
  }

  renderActiveTab() {
    this.contentContainer.removeAll(true);

    if (this.currentTab === 'audio') {
      this.renderAudioTab();
    } else if (this.currentTab === 'gameplay') {
      this.renderGameplayTab();
    } else if (this.currentTab === 'controls') {
      this.renderControlsTab();
    }
  }

  // --- TAB 1: AUDIO SETTINGS ---
  renderAudioTab() {
    const w = this.modalW - 64;

    // 1. Master Volume Row
    const volTitle = this.scene.add.text(-w / 2, 10, 'ပင်မ အသံပမာဏ / MASTER VOLUME:', {
      fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans, sans-serif',
      fontSize: '12px',
      fontStyle: '900',
      color: '#fef08a'
    });
    this.contentContainer.add(volTitle);

    const levels = [
      { val: 1.0, label: '၁၀၀%' },
      { val: 0.75, label: '၇၅%' },
      { val: 0.5, label: '၅၀%' },
      { val: 0.25, label: '၂၅%' },
      { val: 0.0, label: '🔇 ပိတ်' }
    ];

    const btnW = (w - 20) / levels.length;
    const curVol = audioDirector.getMuted() ? 0.0 : audioDirector.getMasterVolume();

    levels.forEach((lvl, i) => {
      const bx = -w / 2 + btnW / 2 + i * (btnW + 4);
      const isSelected = Math.abs(curVol - lvl.val) < 0.13;

      const btn = this.scene.add.container(bx, 42).setSize(btnW, 30);
      const bg = this.scene.add.graphics();
      bg.fillStyle(isSelected ? 0xd97706 : 0x271e17, 1);
      bg.fillRoundedRect(-btnW / 2, -15, btnW, 30, 15);
      if (!isSelected) {
        bg.lineStyle(1.2, 0x572814, 0.9);
        bg.strokeRoundedRect(-btnW / 2, -15, btnW, 30, 15);
      }

      const txt = this.scene.add.text(0, 0, lvl.label, {
        fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans, sans-serif',
        fontSize: '11px',
        fontStyle: '900',
        color: isSelected ? '#ffffff' : '#d6d3d1'
      }).setOrigin(0.5);

      btn.add([bg, txt]);
      btn.setInteractive({ useHandCursor: true });
      MicroInteractions.makeInteractiveHover(btn, 1.06);

      btn.on('pointerdown', (p, lx, ly, ev) => {
        if (ev && ev.stopPropagation) ev.stopPropagation();
        soundEngine.playPickup();
        if (lvl.val === 0.0) {
          audioDirector.setMuted(true);
        } else {
          audioDirector.setMuted(false);
          audioDirector.setMasterVolume(lvl.val);
        }
        this.renderAudioTab();
      });

      this.contentContainer.add(btn);
    });

    // 2. Stem Background Ambience Toggle
    const bgmRow = this.createSettingToggle(
      -w / 2,
      96,
      w,
      'သဘာဝ နောက်ခံတေး (BGM & Stems):',
      !audioDirector.getMuted(),
      (newVal) => {
        if (!newVal) {
          audioDirector.setMuted(true);
        } else {
          audioDirector.setMuted(false);
          audioDirector.setMasterVolume(1.0);
        }
        this.renderAudioTab();
      }
    );
    this.contentContainer.add(bgmRow);

    // 3. Tactile Foley / SFX Toggle
    const sfxRow = this.createSettingToggle(
      -w / 2,
      148,
      w,
      'ထိတွေ့ အသံသက်ရောက်မှု (Tactile Foley / SFX):',
      !soundEngine.isMuted(),
      (newVal) => {
        soundEngine.toggleMute();
        this.renderAudioTab();
      }
    );
    this.contentContainer.add(sfxRow);
  }

  // --- TAB 2: GAMEPLAY & ACCESSIBILITY ---
  renderGameplayTab() {
    const w = this.modalW - 64;

    // 1. Hotspot Signifiers Toggle
    const isAlwaysHints = Boolean(gameState.state.alwaysShowHints);
    const hintRow = this.createSettingToggle(
      -w / 2,
      16,
      w,
      'သဲလွန်စအဝိုင်း အမြဲပြ (Always Show Hotspot Rings):',
      isAlwaysHints,
      (newVal) => {
        gameState.state.alwaysShowHints = newVal;
        gameState.saveToStorage();
        this.renderGameplayTab();
      }
    );
    this.contentContainer.add(hintRow);

    // 2. Dialogue Typewriter Cadence
    const isFastText = Boolean(gameState.state.fastDialogue);
    const textRow = this.createSettingToggle(
      -w / 2,
      72,
      w,
      'စကားပြော အမြန်နှုန်း (Fast Dialogue Cadence):',
      isFastText,
      (newVal) => {
        gameState.state.fastDialogue = newVal;
        gameState.saveToStorage();
        this.renderGameplayTab();
      }
    );
    this.contentContainer.add(textRow);

    // 3. Fullscreen Action Card
    const fsContainer = this.scene.add.container(0, 142).setSize(w, 42);
    const fsBg = this.scene.add.graphics();
    fsBg.fillStyle(0x271e17, 1);
    fsBg.fillRoundedRect(-w / 2, -21, w, 42, 21);
    fsBg.lineStyle(1.5, 0xd97706, 0.7);
    fsBg.strokeRoundedRect(-w / 2, -21, w, 42, 21);

    const isFs = this.scene.scale.isFullscreen;
    const fsLabel = this.scene.add.text(0, 0, isFs ? '⛶ မျက်နှာပြင်ပြည့် ပိတ်မည် (Exit Fullscreen)' : '⛶ မျက်နှာပြင်ပြည့် ဖွင့်မည် (Enter Fullscreen)', {
      fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans, sans-serif',
      fontSize: '13px',
      fontStyle: '900',
      color: '#fef08a'
    }).setOrigin(0.5);

    fsContainer.add([fsBg, fsLabel]);
    fsContainer.setInteractive({ useHandCursor: true });
    MicroInteractions.makeInteractiveHover(fsContainer, 1.03);

    fsContainer.on('pointerdown', (p, lx, ly, ev) => {
      if (ev && ev.stopPropagation) ev.stopPropagation();
      soundEngine.playPickup();
      if (this.scene.scale.isFullscreen) {
        this.scene.scale.stopFullscreen();
      } else {
        this.scene.scale.startFullscreen();
      }
      this.timeDelayRefresh(150, () => this.renderGameplayTab());
    });

    this.contentContainer.add(fsContainer);
  }

  // --- TAB 3: CONTROLS GUIDE ---
  renderControlsTab() {
    const w = this.modalW - 64;
    const controls = [
      { key: '🖱️ မြေပြင်နှိပ်', desc: 'လမ်းလျှောက်ရန် / အရာဝတ္ထု စစ်ဆေးရန် (Walk & Interact)' },
      { key: '🎒 မျက်နှာပြင်ထိပ်', desc: 'ရှမ်းလွယ်အိတ် ဖွင့်ရန် / ပစ္စည်း စပ်ရန် (Inventory Tray)' },
      { key: '💡 H သို့မဟုတ် Space', desc: 'အပြန်အလှန်ပြုနိုင်သော နေရာများ ပြပါ (Pulse Hotspots)' },
      { key: '🔊 M ခလုတ်', desc: 'အသံ အဖွင့် / အပိတ် ချက်ချင်းလုပ်ရန် (Mute Toggle)' },
      { key: '⛶ F ခလုတ်', desc: 'မျက်နှာပြင် အပြည့် ချဲ့ရန် / ပိတ်ရန် (Fullscreen)' },
      { key: '⚙️ ESC ခလုတ်', desc: 'ဤ ရွေးချယ်စရာ မီနူး ဖွင့်ရန် / ပိတ်ရန် (Options Menu)' }
    ];

    controls.forEach((ctrl, idx) => {
      const cy = 6 + idx * 32;

      const row = this.scene.add.container(0, cy).setSize(w, 28);
      const bg = this.scene.add.graphics();
      bg.fillStyle(0x1a140f, 0.9);
      bg.fillRoundedRect(-w / 2, -14, w, 28, 14);
      bg.lineStyle(1, 0x3b1d11, 0.8);
      bg.strokeRoundedRect(-w / 2, -14, w, 28, 14);

      const kText = this.scene.add.text(-w / 2 + 16, 0, ctrl.key, {
        fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans, sans-serif',
        fontSize: '11px',
        fontStyle: '900',
        color: '#f59e0b'
      }).setOrigin(0, 0.5);

      const dText = this.scene.add.text(-w / 2 + 130, 0, ctrl.desc, {
        fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans, sans-serif',
        fontSize: '11px',
        fontWeight: '600',
        color: '#d6d3d1'
      }).setOrigin(0, 0.5);

      row.add([bg, kText, dText]);
      this.contentContainer.add(row);
    });
  }

  createSettingToggle(x, y, w, labelText, value, onChange) {
    const row = this.scene.add.container(x + w / 2, y).setSize(w, 36);

    const title = this.scene.add.text(-w / 2, 0, labelText, {
      fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans, sans-serif',
      fontSize: '12px',
      fontStyle: '900',
      color: '#e7e5e4'
    }).setOrigin(0, 0.5);

    // Toggle button container (rounded pill)
    const toggleW = 86;
    const toggleH = 28;
    const toggleBtn = this.scene.add.container(w / 2 - toggleW / 2, 0).setSize(toggleW, toggleH);

    const tBg = this.scene.add.graphics();
    tBg.fillStyle(value ? 0x059669 : 0x44403c, 1);
    tBg.fillRoundedRect(-toggleW / 2, -toggleH / 2, toggleW, toggleH, 14);
    tBg.lineStyle(1.5, value ? 0x34d399 : 0x78716c, 0.9);
    tBg.strokeRoundedRect(-toggleW / 2, -toggleH / 2, toggleW, toggleH, 14);

    const tText = this.scene.add.text(0, 0, value ? 'ဖွင့် (ON)' : 'ပိတ် (OFF)', {
      fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans, sans-serif',
      fontSize: '11px',
      fontStyle: '900',
      color: '#ffffff'
    }).setOrigin(0.5);

    toggleBtn.add([tBg, tText]);
    toggleBtn.setInteractive({ useHandCursor: true });
    MicroInteractions.makeInteractiveHover(toggleBtn, 1.08);

    toggleBtn.on('pointerdown', (p, lx, ly, ev) => {
      if (ev && ev.stopPropagation) ev.stopPropagation();
      soundEngine.playPickup();
      onChange(!value);
    });

    row.add([title, toggleBtn]);
    return row;
  }

  createBottomActions(y) {
    const isIntro = this.scene.scene.key === 'IntroScene' || this.scene.scene.key === 'MainMenuScene';
    const actionContainer = this.scene.add.container(0, y);

    if (!isIntro) {
      // In-game: Restart Chapter & Main Menu buttons + Close
      const btnW = 145;

      // 1. Restart Chapter
      const restartBtn = this.createActionButton(-btnW - 10, 0, btnW, 36, '🔄 အခန်း ပြန်စ', () => {
        this.close(() => {
          soundEngine.playPickup();
          this.scene.scene.restart();
        });
      });

      // 2. Main Menu
      const menuBtn = this.createActionButton(0, 0, btnW, 36, '🏠 ပင်မ မီနူး', () => {
        this.close(() => {
          soundEngine.playPickup();
          this.scene.cameras.main.fade(400, 12, 10, 8);
          this.scene.time.delayedCall(400, () => {
            this.scene.scene.start('IntroScene');
          });
        });
      });

      // 3. Close
      const closeBtn = this.createActionButton(btnW + 10, 0, btnW, 36, '❌ ပိတ်မည်', () => {
        this.close();
      });

      actionContainer.add([restartBtn, menuBtn, closeBtn]);
    } else {
      // Title screen: Wide Close Button
      const closeBtn = this.createActionButton(0, 0, 200, 40, '❌ ပိတ်မည် / CLOSE', () => {
        this.close();
      });
      actionContainer.add(closeBtn);
    }

    this.container.add(actionContainer);
  }

  createActionButton(x, y, w, h, labelText, onClick) {
    const btn = this.scene.add.container(x, y).setSize(w, h);

    const bg = this.scene.add.graphics();
    bg.fillStyle(0x271e17, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    bg.lineStyle(1.5, 0xd97706, 0.8);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2);

    const txt = this.scene.add.text(0, 0, labelText, {
      fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans, sans-serif',
      fontSize: '12px',
      fontStyle: '900',
      color: '#ffffff'
    }).setOrigin(0.5);

    btn.add([bg, txt]);
    btn.setInteractive({ useHandCursor: true });
    MicroInteractions.makeInteractiveHover(btn, 1.05);

    btn.on('pointerdown', (p, lx, ly, ev) => {
      if (ev && ev.stopPropagation) ev.stopPropagation();
      soundEngine.playPickup();
      onClick();
    });

    return btn;
  }

  timeDelayRefresh(ms, fn) {
    this.scene.time.delayedCall(ms, fn);
  }

  close(callback) {
    if (!this.container) return;
    soundEngine.playPickup();

    this.scene.tweens.add({
      targets: this.container,
      scale: 0.9,
      alpha: 0,
      duration: 140,
      ease: 'Quad.In',
      onComplete: () => {
        if (this.container) {
          this.container.destroy();
          this.container = null;
        }
        if (this.onCloseCallback) {
          this.onCloseCallback();
        }
        if (callback) {
          callback();
        }
      }
    });
  }

  isOpen() {
    return this.container !== null && this.container.active;
  }
}
