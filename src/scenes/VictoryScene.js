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
    bg.fillGradientStyle(0x271e17, 0x271e17, 0x0c0a08, 0x0c0a08, 1);
    bg.fillRect(0, 0, width, height);

    // Glowing mechanical city light beams
    const beam = this.add.graphics();
    beam.fillStyle(0xf59e0b, 0.14);
    beam.fillTriangle(width / 2, 0, width / 2 - 350, height, width / 2 + 350, height);

    // Rotating celebration clockwork gears
    this.gearL = this.add.image(160, height / 2, 'industrial-gear').setScale(2.4).setAlpha(0.22);
    this.gearR = this.add.image(width - 160, height / 2, 'industrial-gear').setScale(2.4).setAlpha(0.22);

    // Centered Josef in Full Glory
    const josefContainer = this.add.container(width / 2, height / 2 - 30);
    const legL = this.add.image(-12, 30, 'robot-leg');
    const legR = this.add.image(12, 30, 'robot-leg');
    const body = this.add.image(0, 0, 'robot-torso');
    const armL = this.add.image(-28, -12, 'robot-arm').setRotation(-0.85); // Waving arm!
    const armR = this.add.image(28, 4, 'robot-arm');
    const head = this.add.image(0, -42, 'robot-head');
    const pupilL = this.add.image(-6, -42, 'robot-pupil');
    const pupilR = this.add.image(6, -42, 'robot-pupil');

    josefContainer.add([legL, legR, body, armL, armR, head, pupilL, pupilR]);

    // Waving animation
    this.tweens.add({
      targets: armL,
      rotation: { from: -0.6, to: -1.3 },
      duration: 480,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Victory Title
    this.add.text(width / 2, height / 2 - 160, 'CITY OF MACHINA UNLOCKED!', {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '52px',
      fontStyle: '900',
      color: '#ffffff',
      letterSpacing: '4px'
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, height / 2 + 75, 'Josef has successfully crossed the drawbridge into the gleaming mechanical metropolis.', {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '17px',
      fontWeight: '700',
      color: '#e7e5e4'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 105, 'All scrapheap environmental puzzles solved with flawless engineering.', {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '14px',
      fontWeight: '600',
      color: '#a8a29e'
    }).setOrigin(0.5);

    // Play Again Button
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0xb45309, 1);
    btnBg.fillRoundedRect(-120, -28, 240, 56, 28);
    btnBg.lineStyle(2.5, 0xf59e0b, 0.9);
    btnBg.strokeRoundedRect(-120, -28, 240, 56, 28);

    const btnText = this.add.text(0, 0, 'PLAY AGAIN', {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '17px',
      fontStyle: '900',
      color: '#ffffff',
      letterSpacing: '1.5px'
    }).setOrigin(0.5);

    const playAgainBtn = this.add.container(width / 2, height / 2 + 180, [btnBg, btnText]);
    playAgainBtn.setSize(240, 56);
    playAgainBtn.setInteractive({ useHandCursor: true });

    playAgainBtn.on('pointerdown', () => {
      machinariumAudio.playPickup();
      this.cameras.main.fade(300, 12, 10, 8);
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
