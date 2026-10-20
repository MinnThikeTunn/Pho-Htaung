import Phaser from 'phaser';
import { gameState, ITEM_NAMES_MY } from '../utils/GameState.js';
import { soundEngine } from '../utils/SoundEngine.js';

export default class InventoryBar {
  constructor(scene, onCombineCallback) {
    this.scene = scene;
    this.onCombineCallback = onCombineCallback;
    this.container = null;
    this.selectedItem = null;
    this.slotImages = [];
    this.slotLabels = [];
    this.create();
  }

  create() {
    const width = this.scene.scale.width;
    this.container = this.scene.add.container(width / 2, 42).setDepth(200);

    // Rounded Floating Bar
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x14100c, 0.94);
    bg.fillRoundedRect(-280, -32, 560, 64, 32);
    bg.lineStyle(2, 0xd97706, 0.6);
    bg.strokeRoundedRect(-280, -32, 560, 64, 32);
    this.container.add(bg);

    // Tooltip text
    this.tooltipText = this.scene.add.text(0, 42, '', {
      fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans',
      fontSize: '13px',
      fontStyle: '900',
      color: '#fef08a',
      backgroundColor: '#1c1917',
      padding: { x: 10, y: 4 }
    }).setOrigin(0.5).setVisible(false);
    this.container.add(this.tooltipText);

    // 6 Slots
    this.slotImages = [];
    for (let i = 0; i < 6; i++) {
      const sx = -200 + i * 80;
      const slotBox = this.scene.add.graphics();
      slotBox.fillStyle(0x271e17, 1);
      slotBox.fillRoundedRect(sx - 28, -24, 56, 48, 14);
      slotBox.lineStyle(1.5, 0x451a03, 1);
      slotBox.strokeRoundedRect(sx - 28, -24, 56, 48, 14);
      this.container.add(slotBox);

      const itemImg = this.scene.add.image(sx, 0, 'item-betel-cutter')
        .setVisible(false)
        .setScale(0.9)
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
        this.tooltipText.setVisible(false);
      });

      itemImg.on('pointerdown', (pointer, lx, ly, event) => {
        event.stopPropagation();
        this.handleClickSlot(itemImg.slotIndex);
      });

      this.container.add(itemImg);
      this.slotImages.push(itemImg);
    }

    this.refresh();
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
        if (this.onCombineCallback) this.onCombineCallback('half_bottle');
        return;
      }
    }

    this.selectedItem = itemKey;
    soundEngine.playPickup();
    const myName = ITEM_NAMES_MY[itemKey] || itemKey;
    this.tooltipText.setText(`ကိုင်ထားသည်: ${myName}`).setVisible(true);

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
  }

  refresh() {
    for (let i = 0; i < 6; i++) {
      const itemKey = gameState.state.inventory[i];
      if (itemKey) {
        let tex = 'item-betel-cutter';
        if (itemKey === 'torn_bottle') tex = 'item-torn-bottle';
        else if (itemKey === 'half_bottle') tex = 'item-half-bottle';
        else if (itemKey === 'rusty_spike') tex = 'item-rusty-spike';
        else if (itemKey === 'dried_chili') tex = 'item-chili';
        else if (itemKey === 'dry_twigs') tex = 'item-twigs';
        else if (itemKey === 'stone_3') tex = 'item-stone-3';
        else if (itemKey === 'gold_7') tex = 'item-gold-7';
        else if (itemKey === 'red_gem') tex = 'item-red-gem';
        else if (itemKey === 'bamboo_pole') tex = 'item-bamboo-pole';
        else if (itemKey === 'rusty_cog') tex = 'item-cog';
        else if (itemKey === 'chalk') tex = 'item-chalk';
        else if (itemKey === 'engineer_note') tex = 'item-engineer-note';

        this.slotImages[i].setTexture(tex).setVisible(true);
      } else {
        this.slotImages[i].setVisible(false);
      }
    }
  }

  resize(width) {
    if (this.container) {
      this.container.setPosition(width / 2, 42);
    }
  }
}
