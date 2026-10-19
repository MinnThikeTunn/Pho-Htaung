import Phaser from 'phaser';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    const { width, height } = this.cameras.main;

    // Loading Screen Dark Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x0c0a08);

    // Sleek Perplexity Loading Bar
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x1c1815, 1);
    progressBox.fillRoundedRect(width / 2 - 200, height / 2 - 15, 400, 30, 15);
    progressBox.lineStyle(2, 0xf59e0b, 0.4);
    progressBox.strokeRoundedRect(width / 2 - 200, height / 2 - 15, 400, 30, 15);

    const progressBar = this.add.graphics();

    this.add.text(width / 2, height / 2 - 55, 'INITIALIZING CLOCKWORK REALM...', {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: '18px',
      fontStyle: '900',
      color: '#f59e0b',
      letterSpacing: '2px'
    }).setOrigin(0.5);

    const percentText = this.add.text(width / 2, height / 2 + 55, '0%', {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: '15px',
      fontWeight: '700',
      color: '#a8a29e'
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0xf59e0b, 1);
      progressBar.fillRoundedRect(width / 2 - 195, height / 2 - 10, 390 * value, 20, 10);
      percentText.setText(`${Math.floor(value * 100)}%`);
    });

    // Generate full HD Steampunk art assets procedurally
    this.createSteampunkAssets();
  }

  createSteampunkAssets() {
    // 1. Josef Head Base (No pupils, so pupils can dynamically follow cursor!)
    const headG = this.make.graphics({ x: 0, y: 0, add: false });
    // Cap
    headG.fillStyle(0x78350f, 1);
    headG.fillEllipse(30, 26, 26, 20);
    // Metallic rim & rivets
    headG.fillStyle(0x92400e, 1);
    headG.fillRect(16, 32, 28, 14);
    headG.fillStyle(0xd97706, 1);
    headG.fillCircle(20, 36, 2.5);
    headG.fillCircle(40, 36, 2.5);
    // Eye Sockets (Warm Amber Background)
    headG.fillStyle(0x451a03, 1);
    headG.fillCircle(24, 28, 7.5);
    headG.fillCircle(36, 28, 7.5);
    headG.fillStyle(0xfef08a, 1);
    headG.fillCircle(24, 28, 6);
    headG.fillCircle(36, 28, 6);
    // Antenna
    headG.lineStyle(2.5, 0xd97706, 1);
    headG.lineBetween(30, 16, 30, 3);
    headG.fillStyle(0xef4444, 1);
    headG.fillCircle(30, 3, 4);
    headG.generateTexture('robot-head', 60, 50);

    // Eye Pupil (Tracks Cursor)
    const pupilG = this.make.graphics({ x: 0, y: 0, add: false });
    pupilG.fillStyle(0x451a03, 1);
    pupilG.fillCircle(3, 3, 2.5);
    pupilG.generateTexture('robot-pupil', 6, 6);

    // 2. Josef Torso (Closed Hatch)
    const bodyG = this.make.graphics({ x: 0, y: 0, add: false });
    bodyG.fillStyle(0x78350f, 1);
    bodyG.fillRoundedRect(6, 4, 46, 56, 14);
    bodyG.lineStyle(2.5, 0x92400e, 1);
    bodyG.strokeRoundedRect(6, 4, 46, 56, 14);
    // Belly storage hatch
    bodyG.fillStyle(0x451a03, 1);
    bodyG.fillRoundedRect(16, 16, 26, 32, 8);
    bodyG.fillStyle(0xd97706, 1);
    bodyG.fillCircle(22, 32, 3); // Hatch lock
    // Rivets
    bodyG.fillStyle(0xb45309, 1);
    bodyG.fillCircle(12, 10, 2);
    bodyG.fillCircle(46, 10, 2);
    bodyG.fillCircle(12, 54, 2);
    bodyG.fillCircle(46, 54, 2);
    bodyG.generateTexture('robot-torso', 58, 64);

    // 2b. Josef Torso (Open Hatch during pickup)
    const bodyOpenG = this.make.graphics({ x: 0, y: 0, add: false });
    bodyOpenG.fillStyle(0x78350f, 1);
    bodyOpenG.fillRoundedRect(6, 4, 46, 56, 14);
    bodyOpenG.lineStyle(2.5, 0x92400e, 1);
    bodyOpenG.strokeRoundedRect(6, 4, 46, 56, 14);
    // Open belly interior (dark cavity)
    bodyOpenG.fillStyle(0x1c1917, 1);
    bodyOpenG.fillRoundedRect(16, 16, 26, 32, 6);
    // Swung open door
    bodyOpenG.fillStyle(0x451a03, 1);
    bodyOpenG.fillRoundedRect(40, 16, 12, 32, 4);
    bodyOpenG.generateTexture('robot-torso-open', 58, 64);

    // 3. Telescopic Neck Accordion Segment
    const neckG = this.make.graphics({ x: 0, y: 0, add: false });
    neckG.fillStyle(0x57534e, 1);
    neckG.fillRoundedRect(2, 0, 22, 10, 4);
    neckG.lineStyle(1.5, 0x292524, 1);
    neckG.lineBetween(2, 5, 24, 5);
    neckG.generateTexture('robot-neck', 26, 10);

    // 4. Robot Arm
    const armG = this.make.graphics({ x: 0, y: 0, add: false });
    armG.fillStyle(0x78350f, 1);
    armG.fillCircle(8, 8, 5);
    armG.fillRect(5, 8, 6, 20);
    armG.fillCircle(8, 28, 4);
    armG.fillRect(5, 28, 6, 18);
    // Claw
    armG.lineStyle(2.5, 0xd97706, 1);
    armG.lineBetween(5, 46, 2, 54);
    armG.lineBetween(11, 46, 14, 54);
    armG.generateTexture('robot-arm', 18, 58);

    // 5. Robot Leg
    const legG = this.make.graphics({ x: 0, y: 0, add: false });
    legG.fillStyle(0x57534e, 1);
    legG.fillRect(6, 2, 8, 28);
    legG.fillStyle(0x78350f, 1);
    legG.fillCircle(10, 16, 5); // Piston joint
    legG.fillRoundedRect(2, 28, 20, 8, 4); // Foot plate
    legG.generateTexture('robot-leg', 24, 38);

    // 6. Mechanical Rat Critter
    const ratG = this.make.graphics({ x: 0, y: 0, add: false });
    ratG.fillStyle(0x44403c, 1);
    ratG.fillEllipse(26, 18, 22, 14);
    ratG.fillCircle(38, 10, 5); // Ears
    ratG.fillStyle(0xef4444, 1);
    ratG.fillCircle(40, 16, 3); // Red glowing eye
    ratG.lineStyle(2, 0xd97706, 1);
    ratG.lineBetween(18, 6, 18, 0); // Windup key
    ratG.strokeCircle(18, 0, 4);
    ratG.lineBetween(8, 22, 0, 18); // Tail
    ratG.generateTexture('robot-rat', 52, 32);

    // 7. Item: Toy Wind-up Doll
    const dollG = this.make.graphics({ x: 0, y: 0, add: false });
    dollG.fillStyle(0xf59e0b, 1);
    dollG.fillRoundedRect(4, 8, 26, 20, 8);
    dollG.fillStyle(0xef4444, 1);
    dollG.fillCircle(16, 16, 4);
    dollG.lineStyle(2, 0xffffff, 1);
    dollG.strokeCircle(30, 18, 5);
    dollG.generateTexture('item-doll', 40, 36);

    // 8. Item: Horseshoe Magnet
    const magnetG = this.make.graphics({ x: 0, y: 0, add: false });
    magnetG.lineStyle(8, 0xdc2626, 1);
    magnetG.beginPath();
    magnetG.arc(20, 16, 12, Math.PI, 0, false);
    magnetG.strokePath();
    magnetG.lineBetween(8, 16, 8, 30);
    magnetG.lineBetween(32, 16, 32, 30);
    magnetG.fillStyle(0xe2e8f0, 1);
    magnetG.fillRect(4, 26, 8, 8);
    magnetG.fillRect(28, 26, 8, 8);
    magnetG.generateTexture('item-magnet', 40, 40);

    // 9. Item: Copper Wire Coil
    const wireG = this.make.graphics({ x: 0, y: 0, add: false });
    wireG.lineStyle(4, 0xf59e0b, 1);
    wireG.strokeCircle(20, 20, 14);
    wireG.strokeCircle(22, 20, 12);
    wireG.lineBetween(28, 28, 36, 36);
    wireG.generateTexture('item-wire', 40, 40);

    // 10. Item: Combined Magnetic Grapple
    const grappleG = this.make.graphics({ x: 0, y: 0, add: false });
    grappleG.lineStyle(2.5, 0xf59e0b, 1);
    grappleG.lineBetween(20, 2, 20, 16);
    grappleG.lineStyle(5, 0xdc2626, 1);
    grappleG.beginPath();
    grappleG.arc(20, 22, 10, Math.PI, 0, false);
    grappleG.strokePath();
    grappleG.lineBetween(10, 22, 10, 32);
    grappleG.lineBetween(30, 22, 30, 32);
    grappleG.fillStyle(0xe2e8f0, 1);
    grappleG.fillRect(7, 30, 6, 6);
    grappleG.fillRect(27, 30, 6, 6);
    grappleG.generateTexture('item-grapple', 40, 40);

    // 11. Item: Glowing Power Core
    const coreG = this.make.graphics({ x: 0, y: 0, add: false });
    coreG.fillStyle(0x06b6d4, 0.4);
    coreG.fillCircle(20, 20, 18);
    coreG.fillStyle(0x22d3ee, 1);
    coreG.fillCircle(20, 20, 11);
    coreG.fillStyle(0xffffff, 1);
    coreG.fillCircle(20, 20, 5);
    coreG.lineStyle(2.5, 0xd97706, 1);
    coreG.strokeRect(12, 10, 16, 20);
    coreG.generateTexture('item-powercore', 40, 40);

    // 12. Rusty Industrial Gear
    const gearG = this.make.graphics({ x: 0, y: 0, add: false });
    gearG.fillStyle(0x78350f, 1);
    gearG.fillCircle(40, 40, 32);
    gearG.fillStyle(0x451a03, 1);
    gearG.fillCircle(40, 40, 14);
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5;
      const tx = 40 + Math.cos(angle) * 34;
      const ty = 40 + Math.sin(angle) * 34;
      gearG.fillStyle(0x92400e, 1);
      gearG.fillCircle(tx, ty, 6);
    }
    gearG.generateTexture('industrial-gear', 80, 80);

    // 13. High Electric Control Box (on tall post)
    const boxG = this.make.graphics({ x: 0, y: 0, add: false });
    boxG.fillStyle(0x292524, 1);
    boxG.fillRect(22, 30, 8, 120); // Tall pole
    boxG.fillStyle(0x44403c, 1);
    boxG.fillRoundedRect(4, 4, 44, 48, 8);
    boxG.lineStyle(2.5, 0xd97706, 1);
    boxG.strokeRoundedRect(4, 4, 44, 48, 8);
    // Gauge Meter
    boxG.fillStyle(0x1c1917, 1);
    boxG.fillRect(10, 10, 32, 14);
    boxG.lineStyle(1.5, 0xef4444, 1);
    boxG.lineBetween(14, 20, 22, 14); // Gauge needle
    // Lever switch
    boxG.lineStyle(4, 0xef4444, 1);
    boxG.lineBetween(26, 32, 38, 16);
    boxG.fillStyle(0xef4444, 1);
    boxG.fillCircle(38, 16, 5);
    boxG.generateTexture('control-lever-box', 52, 150);

    // 14. Toxic Green Sludge Pool
    const poolG = this.make.graphics({ x: 0, y: 0, add: false });
    poolG.fillStyle(0x1e3a1e, 0.9);
    poolG.fillEllipse(90, 32, 88, 26);
    poolG.fillStyle(0x22c55e, 0.75);
    poolG.fillEllipse(90, 32, 68, 18);
    poolG.fillStyle(0x86efac, 0.9);
    poolG.fillCircle(70, 26, 5);
    poolG.fillCircle(110, 34, 4);
    poolG.fillCircle(92, 24, 3);
    poolG.generateTexture('toxic-puddle', 180, 64);

    // 15. Comic Thought Bubble Frame
    const bubbleG = this.make.graphics({ x: 0, y: 0, add: false });
    bubbleG.fillStyle(0xfffbeb, 1);
    bubbleG.fillRoundedRect(10, 8, 180, 110, 24);
    bubbleG.lineStyle(3.5, 0x451a03, 1);
    bubbleG.strokeRoundedRect(10, 8, 180, 110, 24);
    bubbleG.fillCircle(30, 128, 8);
    bubbleG.strokeCircle(30, 128, 8);
    bubbleG.fillCircle(18, 142, 4.5);
    bubbleG.strokeCircle(18, 142, 4.5);
    bubbleG.generateTexture('thought-bubble', 200, 154);

    // 16. Soft Steam Particle
    const steamG = this.make.graphics({ x: 0, y: 0, add: false });
    steamG.fillStyle(0xe7e5e4, 0.5);
    steamG.fillCircle(12, 12, 12);
    steamG.generateTexture('steam-puff', 24, 24);

    // 17. Electric Spark Particle
    const sparkG = this.make.graphics({ x: 0, y: 0, add: false });
    sparkG.fillStyle(0x38bdf8, 1);
    sparkG.fillCircle(4, 4, 4);
    sparkG.generateTexture('spark-particle', 8, 8);

    // 18. Click Pulse Target Ring
    const pulseG = this.make.graphics({ x: 0, y: 0, add: false });
    pulseG.lineStyle(2.5, 0xf59e0b, 1);
    pulseG.strokeCircle(16, 16, 14);
    pulseG.fillStyle(0xf59e0b, 0.8);
    pulseG.fillCircle(16, 16, 4);
    pulseG.generateTexture('click-pulse', 32, 32);
  }

  create() {
    this.time.delayedCall(300, () => {
      this.scene.start('MainMenuScene');
    });
  }
}
