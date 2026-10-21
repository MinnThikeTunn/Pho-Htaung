import Phaser from 'phaser';
import { soundEngine } from '../utils/SoundEngine.js';
import { audioDirector } from '../audio/AudioDirector.js';

export default class SubtitleBox {
  constructor(scene) {
    this.scene = scene;
    this.container = null;
    this.timer = null;
    this.isTyping = false;
    this.fullText = '';
    this.onCompleteCallback = null;
    this.create();
  }

  create() {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;

    this.container = this.scene.add.container(width / 2, height - 90).setDepth(300);

    // Dark Burmese Lacquer-style Dialog Box
    this.bg = this.scene.add.graphics();
    this.bg.fillStyle(0x14100c, 0.94);
    this.bg.fillRoundedRect(-width * 0.45, -50, width * 0.9, 100, 20);
    this.bg.lineStyle(2, 0xd97706, 0.7);
    this.bg.strokeRoundedRect(-width * 0.45, -50, width * 0.9, 100, 20);

    // Speaker Name Tag: ဦးကြီး (U Gyi)
    this.nameText = this.scene.add.text(-width * 0.45 + 24, -40, 'ဦးကြီး (U Gyi):', {
      fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans',
      fontSize: '15px',
      fontStyle: '900',
      color: '#f59e0b'
    });

    // Subtitle Text Body
    this.bodyText = this.scene.add.text(-width * 0.45 + 24, -14, '', {
      fontFamily: 'Noto Sans Myanmar, Pyidaungsu, Plus Jakarta Sans',
      fontSize: '15px',
      fontWeight: '600',
      color: '#ffffff',
      wordWrap: { width: width * 0.86 }
    });

    this.container.add([this.bg, this.nameText, this.bodyText]);
    this.container.setVisible(false);

    // Clicking dialogue completes text immediately
    this.container.setSize(width * 0.9, 100);
    this.container.setInteractive({ useHandCursor: true });
    this.container.on('pointerdown', () => this.handleSkip());
  }

  say(text, onComplete) {
    if (this.timer) this.timer.remove();
    this.fullText = text;
    this.onCompleteCallback = onComplete;
    this.container.setVisible(true);
    this.bodyText.setText('');
    this.isTyping = true;
    audioDirector.setDialoguePlaying(true);

    let charIndex = 0;
    const chars = Array.from(text);

    this.timer = this.scene.time.addEvent({
      delay: 24,
      repeat: chars.length - 1,
      callback: () => {
        charIndex++;
        this.bodyText.setText(chars.slice(0, charIndex).join(''));

        // Play voice blip every ~3 characters for natural cadence
        if (charIndex % 3 === 0 && chars[charIndex - 1] !== ' ') {
          soundEngine.playVoiceBlip();
        }

        if (charIndex >= chars.length) {
          this.isTyping = false;
          this.scene.time.delayedCall(1600, () => {
            audioDirector.setDialoguePlaying(false);
            if (this.onCompleteCallback) {
              const cb = this.onCompleteCallback;
              this.onCompleteCallback = null;
              cb();
            }
          });
        }
      }
    });
  }

  handleSkip() {
    if (this.isTyping) {
      if (this.timer) this.timer.remove();
      this.bodyText.setText(this.fullText);
      this.isTyping = false;
      this.scene.time.delayedCall(400, () => {
        audioDirector.setDialoguePlaying(false);
        if (this.onCompleteCallback) {
          const cb = this.onCompleteCallback;
          this.onCompleteCallback = null;
          cb();
        }
      });
    } else {
      this.hide();
    }
  }

  hide() {
    if (this.timer) this.timer.remove();
    this.isTyping = false;
    this.container.setVisible(false);
    audioDirector.setDialoguePlaying(false);
  }

  resize(width, height) {
    if (!this.container || !this.container.active || !this.bodyText || !this.bodyText.active) return;
    this.container.setPosition(width / 2, height - 90);
    this.bg.clear();
    this.bg.fillStyle(0x14100c, 0.94);
    this.bg.fillRoundedRect(-width * 0.45, -50, width * 0.9, 100, 20);
    this.bg.lineStyle(2, 0xd97706, 0.7);
    this.bg.strokeRoundedRect(-width * 0.45, -50, width * 0.9, 100, 20);

    this.nameText.setPosition(-width * 0.45 + 24, -40);
    this.bodyText.setPosition(-width * 0.45 + 24, -14);
    this.bodyText.setStyle({ wordWrap: { width: width * 0.86 } });
    this.container.setSize(width * 0.9, 100);
  }
}
