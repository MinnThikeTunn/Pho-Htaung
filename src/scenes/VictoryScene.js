import Phaser from 'phaser';
import { machinariumAudio } from '../utils/MachinariumAudio.js';

export default class VictoryScene extends Phaser.Scene {
  constructor() {
    super('VictoryScene');
  }

  create() {
    const { width, height } = this.cameras.main;

    // Atmospheric warm background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1c1917, 0x1c1917, 0x0c0a09, 0x0c0a09, 1);
    bg.fillRect(0, 0, width, height);

    // Glowing mechanical city light beam
    const beam = this.add.graphics();
    beam.fillStyle(0xf59e0b, 0.12);
    beam.fillTriangle(width / 2, 0, width / 2 - 250, height, width / 2 + 250, height);

    // Rotating celebration gears
    this.gearL = this.add.image(120, height / 2, 'industrial-gear').setScale(2).setAlpha(0.2);
    this.gearR = this.add.image(width - 120, height / 2, 'industrial-gear').setScale(2).setAlpha(0.2);

    // Centered Josef in Full Glory
    const josefContainer = this.add.container(width / 2, height / 2 - 40);
    const legL = this.add.image(-10, 24, 'robot-leg');
    const legR = this.add.image(10, 24, 'robot-leg');
    const body = this.add.image(0, 0, 'robot-torso');
    const armL = this.add.image(-22, -10, 'robot-arm').setRotation(-0.8); // Waving arm!
    const armR = this.add.image(22, 2, 'robot-arm');
    const head = this.add.image(0, -32, 'robot-head');
    josefContainer.add([legL, legR, body, armL, armR, head]);

    // Waving animation
    this.tweens.add({
      targets: armL,
      rotation: { from: -0.6, to: -1.2 },
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Victory Title
    this.add.text(width / 2, height / 2 - 130, 'CITY GATE UNLOCKED!', {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '44px',
      fontStyle: '900',
      color: '#f59e0b',
      letterSpacing: '3px'
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, height / 2 + 55, 'Josef has successfully crossed the drawbridge into the City of Machina.', {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '15px',
      fontWeight: '600',
      color: '#d6d3d1'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 82, 'All scrapheap environmental puzzles solved with distinction.', {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '13px',
      fontWeight: '500',
      color: '#a8a29e'
    }).setOrigin(0.5);

    // Play Again Button
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0xb45309, 1);
    btnBg.fillRoundedRect(-110, -25, 220, 50, 25);
    btnBg.lineStyle(2, 0xf59e0b, 0.9);
    btnBg.strokeRoundedRect(-110, -25, 220, 50, 25);

    const btnText = this.add.text(0, 0, 'PLAY AGAIN', {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '16px',
      fontStyle: '900',
      color: '#ffffff',
      letterSpacing: '1px'
    }).setOrigin(0.5);

    const playAgainBtn = this.add.container(width / 2, height / 2 + 145, [btnBg, btnText]);
    playAgainBtn.setSize(220, 50);
    playAgainBtn.setInteractive({ useHandCursor: true });

    playAgainBtn.on('pointerdown', () => {
      machinariumAudio.playPickup();
      this.cameras.main.fade(300, 20, 16, 12);
      this.time.delayedCall(300, () => {
        this.scene.start('MachinariumGameScene');
      });
    });

    // Keyboard ENTER / SPACE
    this.input.keyboard.once('keydown-SPACE', () => playAgainBtn.emit('pointerdown'));
    this.input.keyboard.once('keydown-ENTER', () => playAgainBtn.emit('pointerdown'));
  }

  update() {
    if (this.gearL) this.gearL.rotation += 0.005;
    if (this.gearR) this.gearR.rotation -= 0.005;
  }
}
