import Phaser from 'phaser';
import { gameState, ITEM_NAMES_MY, ITEM_TEXTURE_KEYS } from '../utils/AdventureState.js';
import { soundEngine } from '../utils/SoundEngine.js';
import { CREAM, drawMyanmarTraditionalBag } from '../view/BridgeView.js';

export default class InventoryBar {
  constructor(scene, options = {}) {
    this.scene = scene;
    if (typeof options === 'function') {
      this.options = { onCombineCallback: options };
    } else {
      this.options = options || {};
    }
    this.onCombineCallback = this.options.onCombineCallback || null;
    this.bagContainer = null;
    this.trayContainer = null;
    this.selectedItem = null;
    this.slotImages = [];
    this.slotBoxGraphics = [];
    this.slotXCoords = [];
    this.isRevealed = false;
    this.isPinned = false;
    this.hideTimer = null;
    this.activeSlotCount = 0;
    this.create();
  }

  create() {
    const maxSlots = this.options.maxSlots || 12;
    const slotSpacing = 48;
    this.slotSpacing = slotSpacing;
    this.maxSlots = maxSlots;

    // =========================================================================
    // 1. Permanent Bottom-Left Dock: Myanmar Traditional Bag (Lwe-Ait - လွယ်အိတ်)
    // Anchored at bottom left (x = 52, y = 668, Depth: 320)
    // Borderless, textless, pure Shan woven bag icon!
    // =========================================================================
    const bagX = 52;
    const bagY = 668;
    this.bagContainer = this.scene.add.container(bagX, bagY).setDepth(320).setScrollFactor(0);

    // Procedural / Hand-Inked Myanmar Traditional Bag Icon (Faithful to reference/images.jpg)
    if (this.scene.textures && this.scene.textures.exists('traditional_bag_icon')) {
      this.bagIcon = this.scene.add
        .image(0, 0, 'traditional_bag_icon')
        .setDisplaySize(50, 62)
        .setOrigin(0.5);
      this.bagContainer.add(this.bagIcon);
    } else if (this.scene.textures && this.scene.textures.exists('myanmar_traditional_bag')) {
      this.bagIcon = this.scene.add
        .image(0, 0, 'myanmar_traditional_bag')
        .setScale(0.85)
        .setOrigin(0.5);
      this.bagContainer.add(this.bagIcon);
    } else {
      const bagG = this.scene.add.graphics();
      drawMyanmarTraditionalBag(bagG, -25, -34, 50, 68);
      this.bagContainer.add(bagG);
    }

    // Make the bottom-left bag icon interactive with hover & micro-interactions
    this.bagContainer.setSize(52, 64);
    this.bagContainer.setInteractive({ useHandCursor: true });

    this.bagContainer.on('pointerover', () => {
      this.cancelHideTimer();
      this.reveal();
      this.scene.tweens.killTweensOf(this.bagContainer);
      this.scene.tweens.add({
        targets: this.bagContainer,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 120,
        ease: 'Quad.Out'
      });
    });

    this.bagContainer.on('pointerout', () => {
      this.scene.tweens.killTweensOf(this.bagContainer);
      this.scene.tweens.add({
        targets: this.bagContainer,
        scaleX: 1.0,
        scaleY: 1.0,
        duration: 120,
        ease: 'Quad.Out'
      });
      this.startHideTimer();
    });

    this.bagContainer.on('pointerdown', (pointer, lx, ly, event) => {
      if (event && event.stopPropagation) event.stopPropagation();
      this.isPinned = !this.isPinned;
      if (this.isPinned) {
        this.cancelHideTimer();
        this.reveal();
      } else {
        this.hide();
      }
    });

    // =========================================================================
    // 2. Expandable Side-Flyout Item Tray
    // Positioned immediately to the right of the bag (x = 88, y = 668, Depth: 315)
    // =========================================================================
    this.trayContainer = this.scene.add.container(64, bagY).setDepth(315).setScrollFactor(0);
    this.trayContainer.setAlpha(0);
    this.trayContainer.setVisible(false);

    // Rounded Floating Tray Backdrop (Minimalist Dark Slate & Gold Bevel)
    this.trayBg = this.scene.add.graphics();
    this.trayContainer.add(this.trayBg);

    // Hit zone over the entire tray to detect hover smoothly
    this.trayHitZone = this.scene.add.zone(0, 0, 100, 56).setOrigin(0, 0.5).setInteractive();
    this.trayContainer.add(this.trayHitZone);

    this.trayHitZone.on('pointerover', () => {
      this.cancelHideTimer();
    });

    this.trayHitZone.on('pointerout', () => {
      this.startHideTimer();
    });

    // Tooltip text above the hovered item
    this.tooltipText = this.scene.add
      .text(0, -36, '', {
        fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans, sans-serif',
        fontSize: '12px',
        fontStyle: '900',
        color: '#f4e3c1',
        backgroundColor: '#2b1a0c',
        padding: { x: 10, y: 4 }
      })
      .setOrigin(0.5)
      .setVisible(false);
    this.trayContainer.add(this.tooltipText);

    // Create item slots
    this.slotImages = [];
    this.slotBoxGraphics = [];
    this.slotXCoords = [];

    for (let i = 0; i < maxSlots; i++) {
      const sx = 26 + i * slotSpacing;
      this.slotXCoords.push(sx);

      const slotBox = this.scene.add.graphics();
      this.trayContainer.add(slotBox);
      this.slotBoxGraphics.push(slotBox);
      this.drawSlot(i, false, sx);

      const itemImg = this.scene.add
        .image(sx, 0, 'item-betel-cutter')
        .setVisible(false)
        .setScale(0.72)
        .setInteractive({ useHandCursor: true });

      itemImg.slotIndex = i;

      itemImg.on('pointerover', () => {
        this.cancelHideTimer();
        const info = this.getItemAt(itemImg.slotIndex);
        if (info) {
          const myName = info.name || ITEM_NAMES_MY[info.key] || info.key;
          this.tooltipText.setText(myName).setPosition(sx, -36).setVisible(true);
        }
      });

      itemImg.on('pointerout', () => {
        if (!this.selectedItem) {
          this.tooltipText.setVisible(false);
        }
        this.startHideTimer();
      });

      itemImg.on('pointerdown', (pointer, lx, ly, event) => {
        if (event && event.stopPropagation) event.stopPropagation();
        this.handleClickSlot(itemImg.slotIndex);
      });

      this.trayContainer.add(itemImg);
      this.slotImages.push(itemImg);
    }

    // =========================================================================
    // 3. Global Shortcut Key & Click Listeners (B / Tab / I / Escape / Locomotion)
    // =========================================================================
    this.keyHandler = (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();

      // [B], [Tab], or [I] toggles the inventory tray
      if (key === 'b' || key === 'tab' || key === 'i') {
        e.preventDefault();
        this.isPinned = !this.isPinned;
        if (this.isPinned) {
          this.cancelHideTimer();
          this.reveal();
        } else {
          this.hide();
        }
        return;
      }

      // [Escape] closes tray if opened
      if (key === 'escape' && this.isRevealed) {
        e.preventDefault();
        this.isPinned = false;
        this.hide();
        return;
      }

      // Norman's Law (Action Canceling): Locomotion or jump immediately dismisses open inventory
      if (
        this.isRevealed &&
        ['a', 'd', 'w', 's', ' ', 'arrowleft', 'arrowright', 'arrowup', 'arrowdown'].includes(key)
      ) {
        this.isPinned = false;
        this.hide();
      }

      // Number keys 1-9 to select slots if tray is open
      if (this.isRevealed && ['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(key)) {
        const idx = parseInt(key, 10) - 1;
        if (idx >= 0 && idx < this.slotImages.length) {
          this.handleClickSlot(idx);
        }
      }
    };

    // Ambient Click-Outside-to-Close Dismissal
    this.scenePointerDown = (pointer) => {
      if (!this.isRevealed) return;
      const bagBounds = { left: 24, right: 80, top: 636, bottom: 700 };
      const trayWidth = Math.max(80, this.activeSlotCount * slotSpacing + 16);
      const trayBounds = {
        left: 80,
        right: 88 + trayWidth,
        top: 636,
        bottom: 700
      };
      const inBag =
        pointer.x >= bagBounds.left &&
        pointer.x <= bagBounds.right &&
        pointer.y >= bagBounds.top &&
        pointer.y <= bagBounds.bottom;
      const inTray =
        pointer.x >= trayBounds.left &&
        pointer.x <= trayBounds.right &&
        pointer.y >= trayBounds.top &&
        pointer.y <= trayBounds.bottom;

      if (!inBag && !inTray) {
        this.isPinned = false;
        this.hide();
      }
    };
    this.scene.input.on('pointerdown', this.scenePointerDown);

    window.addEventListener('keydown', this.keyHandler);
    this.scene.events.once('shutdown', () => {
      this.cancelHideTimer();
      window.removeEventListener('keydown', this.keyHandler);
      if (this.scene && this.scene.input) {
        this.scene.input.off('pointerdown', this.scenePointerDown);
      }
    });

    this.refresh();
  }

  cancelHideTimer() {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }

  startHideTimer() {
    this.cancelHideTimer();
    if (this.isPinned) return;
    this.hideTimer = setTimeout(() => {
      if (!this.isPinned) {
        this.hide();
      }
    }, 220);
  }

  getItemAt(index) {
    if (typeof this.options.getItems === 'function') {
      const items = this.options.getItems();
      if (!items || !items[index]) return null;
      const item = items[index];
      if (typeof item === 'string') {
        return { key: item, name: ITEM_NAMES_MY[item] || item };
      }
      return item;
    }
    const key = gameState.state.inventory[index];
    if (!key) return null;
    return { key, name: ITEM_NAMES_MY[key] || key };
  }

  drawSlot(index, isSelected, sx, hasItem = true) {
    const g = this.slotBoxGraphics[index];
    if (!g) return;

    g.clear();
    if (isSelected) {
      // Glowing active brass border on a warm wood slot
      g.fillStyle(0x5d3a1e, 1);
      g.fillRoundedRect(sx - 21, -21, 42, 42, 10);
      g.fillStyle(CREAM, 0.2).fillRect(sx - 17, -17, 34, 3);
      g.lineStyle(2, 0xf6d68a, 1);
      g.strokeRoundedRect(sx - 21, -21, 42, 42, 10);
    } else if (hasItem) {
      // Carved wood slot with brass trim
      g.fillStyle(0x3a2410, 1);
      g.fillRoundedRect(sx - 21, -21, 42, 42, 10);
      g.fillStyle(CREAM, 0.12).fillRect(sx - 17, -17, 34, 3);
      g.lineStyle(1.5, 0xb07c34, 0.9);
      g.strokeRoundedRect(sx - 21, -21, 42, 42, 10);
    } else {
      // Empty slot - recessed dark wood (no bright placeholder)
      g.fillStyle(0x1a1008, 0.75);
      g.fillRoundedRect(sx - 21, -21, 42, 42, 10);
      g.lineStyle(1, 0x7c5320, 0.45);
      g.strokeRoundedRect(sx - 21, -21, 42, 42, 10);
    }
  }

  reveal() {
    if (this.isRevealed) return;
    this.isRevealed = true;
    soundEngine.playBagRustle();
    this.refresh();
    this.trayContainer.setVisible(true);

    this.scene.tweens.killTweensOf(this.trayContainer);
    this.scene.tweens.add({
      targets: this.trayContainer,
      x: 88,
      alpha: 1,
      duration: 220,
      ease: 'Back.Out'
    });
  }

  hide() {
    if (!this.isRevealed) return;
    this.isRevealed = false;
    this.isPinned = false;
    this.cancelHideTimer();
    soundEngine.playBagRustle();

    this.scene.tweens.killTweensOf(this.trayContainer);
    this.scene.tweens.add({
      targets: this.trayContainer,
      x: 64,
      alpha: 0,
      duration: 180,
      ease: 'Power2',
      onComplete: () => {
        if (!this.isRevealed) {
          this.trayContainer.setVisible(false);
        }
      }
    });
  }

  toggleReveal() {
    if (this.isRevealed) {
      this.hide();
    } else {
      this.isPinned = true;
      this.reveal();
    }
  }

  handleClickSlot(index) {
    const item = this.getItemAt(index);
    if (!item) return;

    if (typeof this.options.onItemClick === 'function') {
      this.options.onItemClick(item, index);
      this.refresh();
      return;
    }

    const itemKey = item.key;

    // Check inventory combination (crafting)
    if (this.selectedItem && this.selectedItem !== itemKey) {
      if (
        (this.selectedItem === 'betel_cutter' && itemKey === 'torn_bottle') ||
        (this.selectedItem === 'torn_bottle' && itemKey === 'betel_cutter')
      ) {
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
    const myName = item.name || ITEM_NAMES_MY[itemKey] || itemKey;
    this.tooltipText.setText(`ကိုင်ထားသည်: ${myName}`).setVisible(true);

    if (typeof this.scene.showHeldItem === 'function') {
      this.scene.showHeldItem(itemKey);
    }

    if (
      itemKey === 'engineer_note' &&
      typeof this.scene.showBlueprintOverlay === 'function'
    ) {
      this.scene.showBlueprintOverlay();
    }

    this.refresh();
  }

  setSelected(itemKey) {
    if (!itemKey) {
      this.clearSelected();
      return;
    }
    this.selectedItem = itemKey;
    const myName = ITEM_NAMES_MY[itemKey] || itemKey;
    if (this.tooltipText) {
      this.tooltipText.setText(`ကိုင်ထားသည်: ${myName}`).setVisible(true);
    }
    if (typeof this.scene.showHeldItem === 'function') {
      this.scene.showHeldItem(itemKey);
    }
    this.refresh();
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
    this.refresh();
  }

  refresh() {
    let itemsList = [];
    if (typeof this.options.getItems === 'function') {
      itemsList = this.options.getItems() || [];
    } else {
      itemsList = gameState.state.inventory || [];
    }

    // Filter to active items to size the side-flyout neatly
    const activeItems = [];
    for (let i = 0; i < this.maxSlots; i++) {
      const it = itemsList[i];
      if (it) activeItems.push(it);
    }
    this.activeSlotCount = Math.max(1, activeItems.length);
    const trayWidth = this.activeSlotCount * this.slotSpacing + 12;

    // Draw tray rounded backing capsule
    this.trayBg.clear();
    this.trayBg.fillStyle(0x241608, 0.95);
    this.trayBg.fillRoundedRect(0, -25, trayWidth, 50, 25);
    this.trayBg.fillStyle(0xf6d68a, 0.06);
    this.trayBg.fillRoundedRect(0, -25, trayWidth, 18, { tl: 25, tr: 25, bl: 0, br: 0 });
    this.trayBg.lineStyle(1.5, 0xb07c34, 0.85);
    this.trayBg.strokeRoundedRect(0, -25, trayWidth, 50, 25);

    // Update hit zone width
    this.trayHitZone.setSize(trayWidth, 56);

    for (let i = 0; i < this.slotImages.length; i++) {
      const sx = this.slotXCoords[i];
      const rawItem = itemsList[i];
      const isVisibleSlot = i < this.activeSlotCount;

      if (!isVisibleSlot) {
        this.slotBoxGraphics[i].clear();
        this.slotImages[i].setVisible(false);
        continue;
      }

      let itemKey = null;
      let isSelected = false;
      let texKey = null;
      let frameKey = null;
      let scale = 0.72;

      if (rawItem) {
        if (typeof rawItem === 'string') {
          itemKey = rawItem;
          isSelected = Boolean(this.selectedItem && this.selectedItem === itemKey);
        } else {
          itemKey = rawItem.key || rawItem.id;
          isSelected = Boolean(rawItem.selected || (this.selectedItem && this.selectedItem === itemKey));
          texKey = rawItem.texture;
          frameKey = rawItem.frame;
          if (rawItem.scale) scale = rawItem.scale;
        }
      }

      this.drawSlot(i, isSelected, sx);

      if (itemKey) {
        if (texKey && this.scene.textures && this.scene.textures.exists(texKey)) {
          this.slotImages[i].setTexture(texKey, frameKey).setScale(scale).setAngle(0).setVisible(true);
        } else if (itemKey === 'rusty_cog') {
          this.slotImages[i]
            .setTexture('ch1_vector_cog')
            .setScale(0.75)
            .setAngle(0)
            .setVisible(true);
        } else if (itemKey === 'bamboo_pole') {
          this.slotImages[i]
            .setTexture('ch1_vector_bamboo_icon')
            .setScale(0.85)
            .setAngle(0)
            .setVisible(true);
        } else {
          const tex = ITEM_TEXTURE_KEYS[itemKey] || (this.scene.textures.exists(itemKey) ? itemKey : 'item-betel-cutter');
          this.slotImages[i]
            .setTexture(tex)
            .setScale(scale)
            .setAngle(0)
            .setVisible(true);
        }
      } else {
        this.slotImages[i].setVisible(false);
      }
    }
  }

  resize(width, height) {
    if (this.bagContainer) {
      this.bagContainer.setPosition(52, 668);
    }
    if (this.trayContainer) {
      const targetX = this.isRevealed ? 88 : 64;
      this.trayContainer.setPosition(targetX, 668);
    }
  }
}
