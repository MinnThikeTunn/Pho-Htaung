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
    // Zero visual bubbles! Forward directly to Narrator talk:
    if (captionText && this.scene?.subtitle) {
      this.scene.subtitle.say(captionText);
    }
  }

  hide() {}
  destroy() {}
}
