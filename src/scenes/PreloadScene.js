import Phaser from 'phaser';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    const { width, height } = this.cameras.main;

    // Loading Screen Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x14100c);

    // Progress Bar Shell
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x271e17, 1);
    progressBox.fillRoundedRect(width / 2 - 160, height / 2 - 15, 320, 30, 15);
    progressBox.lineStyle(2, 0xd97706, 0.4);
    progressBox.strokeRoundedRect(width / 2 - 160, height / 2 - 15, 320, 30, 15);

    const progressBar = this.add.graphics();

    this.add.text(width / 2, height / 2 - 50, 'ASSEMBLING MECHANICAL WORLD...', {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: '16px',
      fontStyle: '900',
      color: '#f59e0b',
      letterSpacing: '1px'
    }).setOrigin(0.5);

    const percentText = this.add.text(width / 2, height / 2 + 50, '0%', {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: '14px',
      fontWeight: '700',
      color: '#a8a29e'
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0xd97706, 1);
      progressBar.fillRoundedRect(width / 2 - 155, height / 2 - 10, 310 * value, 20, 10);
      percentText.setText(`${Math.floor(value * 100)}%`);
    });

    // Generate full Steampunk art assets procedurally
    this.createSteampunkAssets();
  }

  createSteampunkAssets() {
    // 1. Josef Head
    const headG = this.make.graphics({ x: 0, y: 0, add: false });
    // Cap
    headG.fillStyle(0x854d0e, 1);
    headG.fillEllipse(24, 20, 20, 16);
    // Metallic rim & rivets
    headG.fillStyle(0xa16207, 1);
    headG.fillRect(14, 26, 20, 10);
    headG.fillStyle(0xca8a04, 1);
    headG.fillCircle(17, 29, 2);
    headG.fillCircle(31, 29, 2);
    // Glowing optical lens eyes
    headG.fillStyle(0xfef08a, 1);
    headG.fillCircle(20, 22, 4);
    headG.fillCircle(28, 22, 4);
    headG.fillStyle(0x78350f, 1);
    headG.fillCircle(20, 22, 1.5);
    headG.fillCircle(28, 22, 1.5);
    // Antenna
    headG.lineStyle(2, 0xd97706, 1);
    headG.lineBetween(24, 12, 24, 2);
    headG.fillStyle(0xef4444, 1);
    headG.fillCircle(24, 2, 3);
    headG.generateTexture('robot-head', 48, 40);

    // 2. Josef Torso
    const bodyG = this.make.graphics({ x: 0, y: 0, add: false });
    bodyG.fillStyle(0x78350f, 1);
    bodyG.fillRoundedRect(6, 4, 36, 44, 12);
    bodyG.lineStyle(2, 0x92400e, 1);
    bodyG.strokeRoundedRect(6, 4, 36, 44, 12);
    // Belly storage hatch
    bodyG.fillStyle(0x451a03, 1);
    bodyG.fillRoundedRect(14, 14, 20, 24, 6);
    bodyG.fillStyle(0xd97706, 1);
    bodyG.fillCircle(18, 26, 2.5); // Hatch lock keyhole
    // Rivets
    bodyG.fillStyle(0xb45309, 1);
    bodyG.fillCircle(10, 8, 1.5);
    bodyG.fillCircle(38, 8, 1.5);
    bodyG.fillCircle(10, 44, 1.5);
    bodyG.fillCircle(38, 44, 1.5);
    bodyG.generateTexture('robot-torso', 48, 52);

    // 3. Telescopic Neck Accordion Segment
    const neckG = this.make.graphics({ x: 0, y: 0, add: false });
    neckG.fillStyle(0x57534e, 1);
    neckG.fillRect(2, 0, 16, 8);
    neckG.lineStyle(1.5, 0x292524, 1);
    neckG.lineBetween(2, 4, 18, 4);
    neckG.generateTexture('robot-neck', 20, 8);

    // 4. Robot Arm
    const armG = this.make.graphics({ x: 0, y: 0, add: false });
    armG.fillStyle(0x78350f, 1);
    armG.fillCircle(6, 6, 4);
    armG.fillRect(4, 6, 4, 16);
    armG.fillCircle(6, 22, 3);
    armG.fillRect(4, 22, 4, 14);
    // Claw
    armG.lineStyle(2, 0xd97706, 1);
    armG.lineBetween(4, 36, 2, 42);
    armG.lineBetween(8, 36, 10, 42);
    armG.generateTexture('robot-arm', 14, 46);

    // 5. Robot Leg
    const legG = this.make.graphics({ x: 0, y: 0, add: false });
    legG.fillStyle(0x57534e, 1);
    legG.fillRect(4, 2, 6, 22);
    legG.fillStyle(0x78350f, 1);
    legG.fillCircle(7, 12, 4); // Piston joint
    legG.fillRoundedRect(1, 22, 16, 6, 3); // Foot plate
    legG.generateTexture('robot-leg', 18, 30);

    // 6. Mechanical Rat Critter
    const ratG = this.make.graphics({ x: 0, y: 0, add: false });
    ratG.fillStyle(0x44403c, 1);
    ratG.fillEllipse(20, 14, 16, 10);
    // Ears
    ratG.fillCircle(28, 8, 4);
    // Red glowing eye
    ratG.fillStyle(0xef4444, 1);
    ratG.fillCircle(30, 12, 2);
    // Windup key
    ratG.lineStyle(2, 0xd97706, 1);
    ratG.lineBetween(14, 4, 14, 0);
    ratG.strokeCircle(14, 0, 3);
    // Whiskers and tail
    ratG.lineBetween(6, 18, 0, 14);
    ratG.generateTexture('robot-rat', 40, 24);

    // 7. Item: Toy Wind-up Doll
    const dollG = this.make.graphics({ x: 0, y: 0, add: false });
    dollG.fillStyle(0xf59e0b, 1);
    dollG.fillRoundedRect(4, 6, 20, 16, 6);
    dollG.fillStyle(0xef4444, 1);
    dollG.fillCircle(14, 12, 3);
    dollG.lineStyle(1.5, 0xffffff, 1);
    dollG.strokeCircle(24, 14, 4);
    dollG.generateTexture('item-doll', 32, 28);

    // 8. Item: Magnet
    const magnetG = this.make.graphics({ x: 0, y: 0, add: false });
    magnetG.lineStyle(6, 0xdc2626, 1);
    magnetG.beginPath();
    magnetG.arc(16, 12, 10, Math.PI, 0, false);
    magnetG.strokePath();
    magnetG.lineStyle(6, 0xdc2626, 1);
    magnetG.lineBetween(6, 12, 6, 22);
    magnetG.lineBetween(26, 12, 26, 22);
    magnetG.fillStyle(0xe2e8f0, 1);
    magnetG.fillRect(3, 20, 6, 6);
    magnetG.fillRect(23, 20, 6, 6);
    magnetG.generateTexture('item-magnet', 32, 32);

    // 9. Item: Copper Wire Coil
    const wireG = this.make.graphics({ x: 0, y: 0, add: false });
    wireG.lineStyle(3, 0xf59e0b, 1);
    wireG.strokeCircle(16, 16, 10);
    wireG.strokeCircle(18, 16, 9);
    wireG.lineBetween(24, 22, 28, 28);
    wireG.generateTexture('item-wire', 32, 32);

    // 10. Item: Combined Grappling Magnet (Wire + Magnet)
    const grappleG = this.make.graphics({ x: 0, y: 0, add: false });
    grappleG.lineStyle(2, 0xf59e0b, 1);
    grappleG.lineBetween(16, 2, 16, 14);
    grappleG.lineStyle(4, 0xdc2626, 1);
    grappleG.beginPath();
    grappleG.arc(16, 18, 8, Math.PI, 0, false);
    grappleG.strokePath();
    grappleG.lineBetween(8, 18, 8, 26);
    grappleG.lineBetween(24, 18, 24, 26);
    grappleG.fillStyle(0xe2e8f0, 1);
    grappleG.fillRect(6, 24, 4, 4);
    grappleG.fillRect(22, 24, 4, 4);
    grappleG.generateTexture('item-grapple', 32, 32);

    // 11. Item: Glowing Power Core
    const coreG = this.make.graphics({ x: 0, y: 0, add: false });
    coreG.fillStyle(0x06b6d4, 0.4);
    coreG.fillCircle(16, 16, 14);
    coreG.fillStyle(0x22d3ee, 1);
    coreG.fillCircle(16, 16, 8);
    coreG.fillStyle(0xffffff, 1);
    coreG.fillCircle(16, 16, 4);
    coreG.lineStyle(2, 0xd97706, 1);
    coreG.strokeRect(10, 8, 12, 16);
    coreG.generateTexture('item-powercore', 32, 32);

    // 12. Rusty Industrial Gear
    const gearG = this.make.graphics({ x: 0, y: 0, add: false });
    gearG.fillStyle(0x78350f, 1);
    gearG.fillCircle(32, 32, 26);
    gearG.fillStyle(0x451a03, 1);
    gearG.fillCircle(32, 32, 10);
    // Teeth
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const tx = 32 + Math.cos(angle) * 26;
      const ty = 32 + Math.sin(angle) * 26;
      gearG.fillStyle(0x92400e, 1);
      gearG.fillCircle(tx, ty, 5);
    }
    gearG.generateTexture('industrial-gear', 64, 64);

    // 13. High Electric Control Box (on pole)
    const boxG = this.make.graphics({ x: 0, y: 0, add: false });
    boxG.fillStyle(0x292524, 1);
    boxG.fillRect(18, 24, 6, 90); // Pole
    boxG.fillStyle(0x44403c, 1);
    boxG.fillRoundedRect(4, 4, 34, 38, 6);
    boxG.lineStyle(2, 0xd97706, 1);
    boxG.strokeRoundedRect(4, 4, 34, 38, 6);
    // Lever switch
    boxG.lineStyle(3, 0xef4444, 1);
    boxG.lineBetween(21, 24, 30, 12);
    boxG.fillStyle(0xef4444, 1);
    boxG.fillCircle(30, 12, 4);
    // Indicator Lamp (Inactive red)
    boxG.fillStyle(0xdc2626, 1);
    boxG.fillCircle(12, 12, 3);
    boxG.generateTexture('control-lever-box', 42, 114);

    // 14. Toxic Green Sludge Pool
    const poolG = this.make.graphics({ x: 0, y: 0, add: false });
    poolG.fillStyle(0x1e3a1e, 0.85);
    poolG.fillEllipse(70, 24, 68, 20);
    poolG.fillStyle(0x22c55e, 0.7);
    poolG.fillEllipse(70, 24, 52, 14);
    poolG.fillStyle(0x86efac, 0.9);
    poolG.fillCircle(55, 20, 4);
    poolG.fillCircle(85, 25, 3);
    poolG.fillCircle(72, 18, 2);
    poolG.generateTexture('toxic-puddle', 140, 48);

    // 15. Comic Thought Bubble Frame
    const bubbleG = this.make.graphics({ x: 0, y: 0, add: false });
    bubbleG.fillStyle(0xfffbeb, 1);
    bubbleG.fillRoundedRect(8, 6, 144, 88, 20);
    bubbleG.lineStyle(3, 0x451a03, 1);
    bubbleG.strokeRoundedRect(8, 6, 144, 88, 20);
    // Tail circles leading to character head
    bubbleG.fillCircle(24, 102, 6);
    bubbleG.strokeCircle(24, 102, 6);
    bubbleG.fillCircle(14, 114, 3.5);
    bubbleG.strokeCircle(14, 114, 3.5);
    bubbleG.generateTexture('thought-bubble', 160, 124);

    // 16. Soft Steam Particle
    const steamG = this.make.graphics({ x: 0, y: 0, add: false });
    steamG.fillStyle(0xe7e5e4, 0.45);
    steamG.fillCircle(8, 8, 8);
    steamG.generateTexture('steam-puff', 16, 16);
  }

  create() {
    this.time.delayedCall(400, () => {
      this.scene.start('MainMenuScene');
    });
  }
}
