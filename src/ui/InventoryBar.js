import Phaser from 'phaser';
import { gameState, ITEM_NAMES_MY, ITEM_TEXTURE_KEYS } from '../utils/GameState.js';
import { soundEngine } from '../utils/SoundEngine.js';

export default class InventoryBar {
  constructor(scene, onCombineCallback) {
    this.scene = scene;
    this.onCombineCallback = onCombineCallback;
    this.container = null;
    this.selectedItem = null;
    this.slotImages = [];
    this.slotLabels = [];
    this.isRevealed = false;
    this.autoHideTimer = null;
    this.create();
  }

  create() {
    const width = this.scene.scale.width;
    const maxSlots = 12;
    const slotSpacing = 52;
    const startX = -((maxSlots - 1) * slotSpacing) / 2; // -286
    const barWidth = maxSlots * slotSpacing + 64; // 688

    // Start tucked off-screen at y = -65 (Auto-hiding diegetic HUD, Depth: 300)
    this.container = this.scene.add.container(width / 2, -65).setDepth(300);

    // Rounded Floating Bar (Machinarium Lacquer & Brass Trim)
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x14100c, 0.94);
    bg.fillRoundedRect(-barWidth / 2, -32, barWidth, 64, 32);
    bg.lineStyle(2, 0xd97706, 0.7);
    bg.strokeRoundedRect(-barWidth / 2, -32, barWidth, 64, 32);
    this.container.add(bg);

    // Diegetic Burmese Shoulder Bag Tab (လွယ်အိတ် တံဆိပ်) protruding from bottom center
    const bagTab = this.scene.add.container(0, 36).setSize(110, 26);
    const tabBg = this.scene.add.graphics();
    tabBg.fillStyle(0x271e17, 0.95);
    tabBg.fillRoundedRect(-55, -2, 110, 24, 12);
    tabBg.lineStyle(1.5, 0xd97706, 0.8);
    tabBg.strokeRoundedRect(-55, -2, 110, 24, 12);

    const tabLabel = this.scene.add.text(0, 10, '🎒 လွယ်အိတ်', {
      fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans',
      fontSize: '11px',
      fontStyle: '900',
      color: '#fef08a'
    }).setOrigin(0.5);

    bagTab.add([tabBg, tabLabel]);
    bagTab.setInteractive({ useHandCursor: true });
    bagTab.on('pointerdown', (pointer, lx, ly, event) => {
      if (event && event.stopPropagation) event.stopPropagation();
      this.toggleReveal();
    });
    this.container.add(bagTab);

    // Tooltip text
    this.tooltipText = this.scene.add.text(0, 52, '', {
      fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans',
      fontSize: '13px',
      fontStyle: '900',
      color: '#fef08a',
      backgroundColor: '#1c1917',
      padding: { x: 10, y: 4 }
    }).setOrigin(0.5).setVisible(false);
    this.container.add(this.tooltipText);

    // 12 Slots for All Starting Tools & Puzzle Items
    this.slotImages = [];
    for (let i = 0; i < maxSlots; i++) {
      const sx = startX + i * slotSpacing;
      const slotBox = this.scene.add.graphics();
      slotBox.fillStyle(0x271e17, 1);
      slotBox.fillRoundedRect(sx - 23, -24, 46, 48, 12);
      slotBox.lineStyle(1.5, 0x451a03, 1);
      slotBox.strokeRoundedRect(sx - 23, -24, 46, 48, 12);
      this.container.add(slotBox);

      const itemImg = this.scene.add.image(sx, 0, 'item-betel-cutter')
        .setVisible(false)
        .setScale(0.74)
        .setInteractive({ useHandCursor: true });

      itemImg.slotIndex = i;

      itemImg.on('pointerover', () => {
        const itemKey = gameState.state.inventory[itemImg.slotIndex];
        if (itemKey) {
          const myName = ITEM_NAMES_MY[itemKey] || itemKey;
          this.tooltipText.setText(myName).setVisible(true);
        }
      });

      itemImg.on('pointerout', () => {
        if (!this.selectedItem) {
          this.tooltipText.setVisible(false);
        }
      });

      itemImg.on('pointerdown', (pointer, lx, ly, event) => {
        event.stopPropagation();
        this.handleClickSlot(itemImg.slotIndex);
      });

      this.container.add(itemImg);
      this.slotImages.push(itemImg);
    }

    // Auto-reveal on cursor moving near top edge (y < 48)
    this.scene.input.on('pointermove', (pointer) => {
      if (pointer.y < 48 && !this.isRevealed) {
        this.reveal();
      } else if (pointer.y > 110 && this.isRevealed && !this.selectedItem) {
        if (this.autoHideTimer) this.autoHideTimer.remove();
        this.autoHideTimer = this.scene.time.delayedCall(400, () => {
          if (this.isRevealed && !this.selectedItem) {
            this.hide();
          }
        });
      }
    });

    this.refresh();
  }

  reveal() {
    if (this.isRevealed) return;
    this.isRevealed = true;
    soundEngine.playBagRustle();
    this.scene.tweens.add({
      targets: this.container,
      y: 42,
      duration: 260,
      ease: 'Back.Out'
    });
  }

  hide() {
    if (!this.isRevealed || this.selectedItem) return;
    this.isRevealed = false;
    this.scene.tweens.add({
      targets: this.container,
      y: -65,
      duration: 220,
      ease: 'Power2'
    });
  }

  toggleReveal() {
    if (this.isRevealed) {
      this.hide();
    } else {
      this.reveal();
    }
  }

  handleClickSlot(index) {
    const itemKey = gameState.state.inventory[index];
    if (!itemKey) return;

    // Check inventory combination
    if (this.selectedItem && this.selectedItem !== itemKey) {
      if ((this.selectedItem === 'betel_cutter' && itemKey === 'torn_bottle') ||
          (this.selectedItem === 'torn_bottle' && itemKey === 'betel_cutter')) {
        gameState.removeItem('torn_bottle');
        gameState.addItem('half_bottle');
        gameState.setFlag('ch2_bottle_cut', true);
        this.selectedItem = 'half_bottle';
        soundEngine.playScissors();
        this.refresh();
        if (typeof this.scene.showHeldItem === 'function') {
          this.scene.showHeldItem('half_bottle');
        }
        if (this.onCombineCallback) this.onCombineCallback('half_bottle');
        return;
      }
    }

    // Toggle deselection if clicking already selected item
    if (this.selectedItem === itemKey) {
      this.clearSelected();
      return;
    }

    this.selectedItem = itemKey;
    soundEngine.playPickup();
    const myName = ITEM_NAMES_MY[itemKey] || itemKey;
    this.tooltipText.setText(`ကိုင်ထားသည်: ${myName}`).setVisible(true);

    if (typeof this.scene.showHeldItem === 'function') {
      this.scene.showHeldItem(itemKey);
    }

    if (itemKey === 'engineer_note' && typeof this.scene.showBlueprintOverlay === 'function') {
      this.scene.showBlueprintOverlay();
    }
  }

  getSelected() {
    return this.selectedItem;
  }

  clearSelected() {
    this.selectedItem = null;
    this.tooltipText.setVisible(false);
    if (typeof this.scene.hideHeldItem === 'function') {
      this.scene.hideHeldItem();
    }
    if (this.isRevealed) {
      if (this.autoHideTimer) this.autoHideTimer.remove();
      this.autoHideTimer = this.scene.time.delayedCall(800, () => {
        if (!this.selectedItem) this.hide();
      });
    }
  }

  refresh() {
    for (let i = 0; i < this.slotImages.length; i++) {
      const itemKey = gameState.state.inventory[i];
      if (itemKey) {
        const tex = ITEM_TEXTURE_KEYS[itemKey] || 'item-betel-cutter';
        this.slotImages[i].setTexture(tex).setVisible(true);
      } else {
        this.slotImages[i].setVisible(false);
      }
    }
  }

  resize(width) {
    if (this.container) {
      const targetY = this.isRevealed ? 42 : -65;
      this.container.setPosition(width / 2, targetY);
    }
  }
}
