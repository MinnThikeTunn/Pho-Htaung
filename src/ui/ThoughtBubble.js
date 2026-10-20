import Phaser from 'phaser';
import { soundEngine } from '../utils/SoundEngine.js';

export default class ThoughtBubble {
  constructor(scene) {
    this.scene = scene;
    this.container = null;
    this.activeTween = null;
    this.hideTimer = null;
  }

  show(targetX, targetY, itemKey, captionText = '') {
    this.hide();

    soundEngine.playBubblePop();

    this.container = this.scene.add.container(targetX, targetY - 60).setDepth(220);

    // Three rising thought circles (Machinarium cloud trail)
    const dot1 = this.scene.add.circle(-10, 30, 4, 0xf8fafc, 0.9);
    const dot2 = this.scene.add.circle(-4, 18, 6, 0xf8fafc, 0.9);
    const dot3 = this.scene.add.circle(2, 6, 8, 0xf8fafc, 0.9);

    // Main Thought Cloud Bubble
    const bubbleBg = this.scene.add.graphics();
    bubbleBg.fillStyle(0xf8fafc, 0.96);
    bubbleBg.lineStyle(2.5, 0x1e293b, 1);

    // Cloud arcs
    bubbleBg.fillRoundedRect(-50, -42, 100, 60, 24);
    bubbleBg.strokeRoundedRect(-50, -42, 100, 60, 24);

    this.container.add([dot1, dot2, dot3, bubbleBg]);

    // Item Icon inside thought bubble
    if (itemKey) {
      const itemSprite = this.scene.add.image(0, -12, itemKey)
        .setScale(1.1);
      this.container.add(itemSprite);
    }

    // Optional Question Mark / Exclamation Mark
    const symbolText = this.scene.add.text(22, -32, '💡', {
      fontSize: '16px'
    }).setOrigin(0.5);
    this.container.add(symbolText);

    // Optional subtitle hint below cloud
    if (captionText) {
      const hint = this.scene.add.text(0, 28, captionText, {
        fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#fef08a',
        backgroundColor: '#1c1917',
        padding: { x: 8, y: 3 }
      }).setOrigin(0.5);
      this.container.add(hint);
    }

    // Gentle floating bob tween
    this.container.setScale(0.2);
    this.scene.tweens.add({
      targets: this.container,
      scale: 1,
      duration: 250,
      ease: 'Back.Out'
    });

    this.activeTween = this.scene.tweens.add({
      targets: this.container,
      y: targetY - 66,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });

    // Auto dismiss after 3 seconds
    this.hideTimer = this.scene.time.delayedCall(3200, () => {
      this.hide();
    });
  }

  hide() {
    if (this.hideTimer) {
      this.hideTimer.remove();
      this.hideTimer = null;
    }
    if (this.activeTween) {
      this.activeTween.stop();
      this.activeTween = null;
    }
    if (this.container) {
      this.scene.tweens.add({
        targets: this.container,
        scale: 0,
        alpha: 0,
        duration: 200,
        onComplete: () => {
          if (this.container) {
            this.container.destroy();
            this.container = null;
          }
        }
      });
    }
  }
}
