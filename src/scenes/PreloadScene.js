import Phaser from 'phaser';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    const { width, height } = this.cameras.main;

    // Loading Screen Dark Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x0c0a08);

    // Sleek Loading Bar
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x1c1815, 1);
    progressBox.fillRoundedRect(width / 2 - 200, height / 2 - 15, 400, 30, 15);
    progressBox.lineStyle(2, 0xd97706, 0.5);
    progressBox.strokeRoundedRect(width / 2 - 200, height / 2 - 15, 400, 30, 15);

    const progressBar = this.add.graphics();

    this.add.text(width / 2, height / 2 - 55, 'RENDERING AMANITA CLOCKWORK REALM...', {
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

    // Generate Canvas 2D Hand-Painted Textures
    this.createAmanitaHandDrawnTextures();
  }

  createAmanitaHandDrawnTextures() {
    // 1. Josef Head (Conical Cap + Eye Sockets + Antenna with Glow)
    const headCanvas = this.textures.createCanvas('robot-head', 64, 56);
    const hctx = headCanvas.getContext();

    // Cap Gradient
    const capGrad = hctx.createLinearGradient(16, 10, 48, 30);
    capGrad.addColorStop(0, '#5c3516');
    capGrad.addColorStop(0.5, '#9e622f');
    capGrad.addColorStop(1, '#42240e');
    hctx.fillStyle = capGrad;
    hctx.beginPath();
    hctx.ellipse(32, 28, 28, 20, 0, 0, Math.PI * 2);
    hctx.fill();
    hctx.lineWidth = 2.5;
    hctx.strokeStyle = '#291508';
    hctx.stroke();

    // Cap Rim & Rivets
    hctx.fillStyle = '#b47339';
    hctx.fillRect(16, 34, 32, 14);
    hctx.lineWidth = 2;
    hctx.strokeStyle = '#291508';
    hctx.strokeRect(16, 34, 32, 14);

    // Rivets
    hctx.fillStyle = '#f59e0b';
    hctx.beginPath();
    hctx.arc(20, 40, 2.5, 0, Math.PI * 2);
    hctx.arc(44, 40, 2.5, 0, Math.PI * 2);
    hctx.fill();

    // Glowing Optical Lenses (Slightly asymmetrical, hand-crafted feel)
    hctx.fillStyle = '#1c1917';
    hctx.beginPath();
    hctx.arc(25, 30, 8.5, 0, Math.PI * 2);
    hctx.arc(39, 30, 8.5, 0, Math.PI * 2);
    hctx.fill();

    // Warm amber lens glass
    const lensGrad = hctx.createRadialGradient(25, 30, 2, 25, 30, 7);
    lensGrad.addColorStop(0, '#fffff0');
    lensGrad.addColorStop(0.5, '#fef08a');
    lensGrad.addColorStop(1, '#d97706');
    hctx.fillStyle = lensGrad;
    hctx.beginPath();
    hctx.arc(25, 30, 7, 0, Math.PI * 2);
    hctx.arc(39, 30, 7, 0, Math.PI * 2);
    hctx.fill();

    // Antenna with red glowing LED
    hctx.strokeStyle = '#78350f';
    hctx.lineWidth = 3;
    hctx.beginPath();
    hctx.moveTo(32, 18);
    hctx.lineTo(32, 5);
    hctx.stroke();

    // Red Bulb with soft bloom
    hctx.shadowBlur = 10;
    hctx.shadowColor = '#ef4444';
    hctx.fillStyle = '#ef4444';
    hctx.beginPath();
    hctx.arc(32, 5, 4.5, 0, Math.PI * 2);
    hctx.fill();
    hctx.shadowBlur = 0; // reset shadow
    headCanvas.refresh();

    // 2. Eye Pupil (With highlight shine, tracks cursor)
    const pupilCanvas = this.textures.createCanvas('robot-pupil', 8, 8);
    const pctx = pupilCanvas.getContext();
    pctx.fillStyle = '#451a03';
    pctx.beginPath();
    pctx.arc(4, 4, 3.5, 0, Math.PI * 2);
    pctx.fill();
    pctx.fillStyle = '#ffffff';
    pctx.beginPath();
    pctx.arc(3, 3, 1.2, 0, Math.PI * 2);
    pctx.fill();
    pupilCanvas.refresh();

    // 3. Josef Torso (Weathered Metallic Shading + Hinged Belly Hatch)
    const torsoCanvas = this.textures.createCanvas('robot-torso', 64, 72);
    const tctx = torsoCanvas.getContext();

    // Body Gradient
    const bGrad = tctx.createLinearGradient(6, 6, 58, 66);
    bGrad.addColorStop(0, '#4a2c13');
    bGrad.addColorStop(0.3, '#855127');
    bGrad.addColorStop(0.7, '#6b3e1b');
    bGrad.addColorStop(1, '#3b1f0c');
    tctx.fillStyle = bGrad;
    tctx.beginPath();
    tctx.roundRect(6, 4, 52, 64, 16);
    tctx.fill();
    tctx.lineWidth = 3;
    tctx.strokeStyle = '#291508';
    tctx.stroke();

    // Perimeter Rivets
    tctx.fillStyle = '#d97706';
    [[14, 12], [50, 12], [14, 60], [50, 60], [14, 36], [50, 36]].forEach(([rx, ry]) => {
      tctx.beginPath();
      tctx.arc(rx, ry, 2.5, 0, Math.PI * 2);
      tctx.fill();
    });

    // Belly Hatch Panel (Closed)
    tctx.fillStyle = '#261609';
    tctx.beginPath();
    tctx.roundRect(18, 18, 28, 36, 8);
    tctx.fill();
    tctx.lineWidth = 2;
    tctx.strokeStyle = '#92400e';
    tctx.stroke();

    // Brass Hatch Lock & Hinges
    tctx.fillStyle = '#f59e0b';
    tctx.beginPath();
    tctx.arc(24, 36, 3.5, 0, Math.PI * 2);
    tctx.fill();
    tctx.fillRect(42, 24, 4, 8);
    tctx.fillRect(42, 40, 4, 8);
    torsoCanvas.refresh();

    // 3b. Josef Torso (Open Hatch)
    const torsoOpenCanvas = this.textures.createCanvas('robot-torso-open', 64, 72);
    const toctx = torsoOpenCanvas.getContext();
    toctx.drawImage(headCanvas.getSourceImage(), 0, 0); // copy base
    toctx.clearRect(0, 0, 64, 72);

    toctx.fillStyle = bGrad;
    toctx.beginPath();
    toctx.roundRect(6, 4, 52, 64, 16);
    toctx.fill();
    toctx.lineWidth = 3;
    toctx.strokeStyle = '#291508';
    toctx.stroke();

    // Dark Cavity Interior
    toctx.fillStyle = '#0f0a06';
    toctx.beginPath();
    toctx.roundRect(18, 18, 28, 36, 6);
    toctx.fill();

    // Swung open door
    toctx.fillStyle = '#381f0d';
    toctx.beginPath();
    toctx.roundRect(44, 18, 14, 36, 4);
    toctx.fill();
    toctx.lineWidth = 2;
    toctx.strokeStyle = '#78350f';
    toctx.stroke();
    torsoOpenCanvas.refresh();

    // 4. Telescopic Accordion Neck Segment
    const neckCanvas = this.textures.createCanvas('robot-neck', 32, 14);
    const nctx = neckCanvas.getContext();
    const neckGrad = nctx.createLinearGradient(0, 0, 32, 14);
    neckGrad.addColorStop(0, '#57534e');
    neckGrad.addColorStop(0.5, '#78716c');
    neckGrad.addColorStop(1, '#292524');
    nctx.fillStyle = neckGrad;
    nctx.beginPath();
    nctx.roundRect(2, 2, 28, 10, 4);
    nctx.fill();
    nctx.lineWidth = 1.5;
    nctx.strokeStyle = '#1c1917';
    nctx.stroke();
    neckCanvas.refresh();

    // 5. Articulated Mechanical Arm & Claw
    const armCanvas = this.textures.createCanvas('robot-arm', 22, 64);
    const actx = armCanvas.getContext();
    // Shoulder Joint
    actx.fillStyle = '#78350f';
    actx.beginPath();
    actx.arc(11, 10, 6, 0, Math.PI * 2);
    actx.fill();
    // Upper Arm
    actx.fillStyle = '#92400e';
    actx.fillRect(7, 10, 8, 22);
    // Elbow Joint
    actx.fillStyle = '#57534e';
    actx.beginPath();
    actx.arc(11, 32, 5, 0, Math.PI * 2);
    actx.fill();
    // Forearm
    actx.fillStyle = '#78350f';
    actx.fillRect(7, 32, 8, 18);
    // Pincer Claw
    actx.strokeStyle = '#f59e0b';
    actx.lineWidth = 3;
    actx.beginPath();
    actx.moveTo(7, 50);
    actx.lineTo(3, 60);
    actx.moveTo(15, 50);
    actx.lineTo(19, 60);
    actx.stroke();
    armCanvas.refresh();

    // 6. Robot Leg & Heavy Footplate
    const legCanvas = this.textures.createCanvas('robot-leg', 26, 46);
    const lctx = legCanvas.getContext();
    // Upper Piston
    lctx.fillStyle = '#57534e';
    lctx.fillRect(8, 2, 10, 24);
    // Shock Absorber Joint
    lctx.fillStyle = '#78350f';
    lctx.beginPath();
    lctx.arc(13, 18, 6, 0, Math.PI * 2);
    lctx.fill();
    // Cast-iron boot
    const bootGrad = lctx.createLinearGradient(2, 26, 24, 44);
    bootGrad.addColorStop(0, '#78350f');
    bootGrad.addColorStop(1, '#292524');
    lctx.fillStyle = bootGrad;
    lctx.beginPath();
    lctx.roundRect(2, 26, 22, 16, 6);
    lctx.fill();
    lctx.lineWidth = 2;
    lctx.strokeStyle = '#1c1917';
    lctx.stroke();
    legCanvas.refresh();

    // 7. Mechanical Rat Critter
    const ratCanvas = this.textures.createCanvas('robot-rat', 60, 36);
    const rctx = ratCanvas.getContext();
    // Body
    const rGrad = rctx.createRadialGradient(28, 20, 4, 28, 20, 22);
    rGrad.addColorStop(0, '#665c54');
    rGrad.addColorStop(1, '#2c2520');
    rctx.fillStyle = rGrad;
    rctx.beginPath();
    rctx.ellipse(30, 20, 24, 14, 0, 0, Math.PI * 2);
    rctx.fill();
    // Brass Ear
    rctx.fillStyle = '#92400e';
    rctx.beginPath();
    rctx.arc(44, 12, 6, 0, Math.PI * 2);
    rctx.fill();
    // Glowing Ruby Eye
    rctx.fillStyle = '#ef4444';
    rctx.beginPath();
    rctx.arc(46, 18, 3, 0, Math.PI * 2);
    rctx.fill();
    // Brass Windup Key
    rctx.strokeStyle = '#f59e0b';
    rctx.lineWidth = 2.5;
    rctx.beginPath();
    rctx.moveTo(20, 8);
    rctx.lineTo(20, 2);
    rctx.stroke();
    rctx.strokeRect(16, 0, 8, 4);
    // Curled Wire Tail
    rctx.beginPath();
    rctx.moveTo(8, 24);
    rctx.quadraticCurveTo(0, 18, 2, 10);
    rctx.stroke();
    ratCanvas.refresh();

    // 8. Scrap Wreckage (Bathtub + Girders + Gears)
    const scrapCanvas = this.textures.createCanvas('scrap-wreckage-hd', 160, 100);
    const sctx = scrapCanvas.getContext();
    // Base junk mound
    sctx.fillStyle = '#2c221a';
    sctx.beginPath();
    sctx.ellipse(80, 70, 75, 26, 0, 0, Math.PI * 2);
    sctx.fill();
    // Bathtub / Basin
    const tubGrad = sctx.createLinearGradient(20, 20, 140, 80);
    tubGrad.addColorStop(0, '#57534e');
    tubGrad.addColorStop(0.5, '#78350f');
    tubGrad.addColorStop(1, '#292524');
    sctx.fillStyle = tubGrad;
    sctx.beginPath();
    sctx.roundRect(25, 25, 110, 50, 18);
    sctx.fill();
    sctx.lineWidth = 3;
    sctx.strokeStyle = '#1c1917';
    sctx.stroke();
    // Rust streaks
    sctx.strokeStyle = '#b45309';
    sctx.lineWidth = 2;
    sctx.beginPath();
    sctx.moveTo(40, 28);
    sctx.lineTo(40, 65);
    sctx.moveTo(90, 28);
    sctx.lineTo(90, 60);
    sctx.stroke();
    scrapCanvas.refresh();

    // 9. Toxic Green Sludge Pool (Luminescent & Corrosive)
    const sludgeCanvas = this.textures.createCanvas('toxic-puddle', 240, 80);
    const slctx = sludgeCanvas.getContext();
    // Deep pool basin
    slctx.fillStyle = '#142014';
    slctx.beginPath();
    slctx.ellipse(120, 40, 115, 34, 0, 0, Math.PI * 2);
    slctx.fill();
    // Radioactive green glow
    const greenGrad = slctx.createRadialGradient(120, 40, 10, 120, 40, 100);
    greenGrad.addColorStop(0, '#4ade80');
    greenGrad.addColorStop(0.5, '#16a34a');
    greenGrad.addColorStop(0.85, '#14532d');
    greenGrad.addColorStop(1, 'rgba(20, 83, 45, 0)');
    slctx.fillStyle = greenGrad;
    slctx.beginPath();
    slctx.ellipse(120, 40, 105, 28, 0, 0, Math.PI * 2);
    slctx.fill();
    // Floating chemical bubbles
    slctx.fillStyle = '#86efac';
    [[80, 32, 6], [150, 42, 5], [115, 30, 4], [170, 35, 3]].forEach(([bx, by, br]) => {
      slctx.beginPath();
      slctx.arc(bx, by, br, 0, Math.PI * 2);
      slctx.fill();
    });
    sludgeCanvas.refresh();

    // 10. High Electric Control Box (Dial Gauge + Ceramic Pole)
    const ctrlCanvas = this.textures.createCanvas('control-lever-box', 64, 180);
    const cctx = ctrlCanvas.getContext();
    // Iron pole with ceramic ribbed rings
    cctx.fillStyle = '#292524';
    cctx.fillRect(28, 30, 8, 150);
    cctx.fillStyle = '#78350f';
    cctx.fillRect(24, 70, 16, 6);
    cctx.fillRect(24, 110, 16, 6);

    // Main Control Box
    const boxGrad = cctx.createLinearGradient(4, 4, 60, 60);
    boxGrad.addColorStop(0, '#57534e');
    boxGrad.addColorStop(0.5, '#78350f');
    boxGrad.addColorStop(1, '#292524');
    cctx.fillStyle = boxGrad;
    cctx.beginPath();
    cctx.roundRect(4, 4, 56, 60, 10);
    cctx.fill();
    cctx.lineWidth = 3;
    cctx.strokeStyle = '#1c1917';
    cctx.stroke();

    // Round Voltmeter Glass Dial
    cctx.fillStyle = '#fffbeb';
    cctx.beginPath();
    cctx.arc(32, 28, 16, 0, Math.PI * 2);
    cctx.fill();
    cctx.lineWidth = 2;
    cctx.strokeStyle = '#92400e';
    cctx.stroke();
    // Red indicator needle
    cctx.strokeStyle = '#ef4444';
    cctx.lineWidth = 2;
    cctx.beginPath();
    cctx.moveTo(32, 28);
    cctx.lineTo(24, 20);
    cctx.stroke();

    // Lever Switch Handle
    cctx.strokeStyle = '#ef4444';
    cctx.lineWidth = 5;
    cctx.beginPath();
    cctx.moveTo(34, 44);
    cctx.lineTo(48, 26);
    cctx.stroke();
    cctx.fillStyle = '#ef4444';
    cctx.beginPath();
    cctx.arc(48, 26, 6, 0, Math.PI * 2);
    cctx.fill();
    ctrlCanvas.refresh();

    // 11. Clockwork Industrial Gear
    const gearCanvas = this.textures.createCanvas('industrial-gear', 96, 96);
    const gctx = gearCanvas.getContext();
    const gearGrad = gctx.createRadialGradient(48, 48, 10, 48, 48, 46);
    gearGrad.addColorStop(0, '#5c3516');
    gearGrad.addColorStop(0.7, '#8d5727');
    gearGrad.addColorStop(1, '#3b1f0c');
    gctx.fillStyle = gearGrad;
    gctx.beginPath();
    gctx.arc(48, 48, 38, 0, Math.PI * 2);
    gctx.fill();
    // Gear Teeth (12 cogs)
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6;
      const tx = 48 + Math.cos(angle) * 42;
      const ty = 48 + Math.sin(angle) * 42;
      gctx.fillStyle = '#92400e';
      gctx.beginPath();
      gctx.arc(tx, ty, 7, 0, Math.PI * 2);
      gctx.fill();
    }
    // Axle hole
    gctx.fillStyle = '#1c1917';
    gctx.beginPath();
    gctx.arc(48, 48, 14, 0, Math.PI * 2);
    gctx.fill();
    gearCanvas.refresh();

    // 12. Items: Doll, Magnet, Wire, Grapple, PowerCore
    // Doll
    const dollCanvas = this.textures.createCanvas('item-doll', 44, 40);
    const dctx = dollCanvas.getContext();
    dctx.fillStyle = '#f59e0b';
    dctx.beginPath();
    dctx.roundRect(6, 10, 30, 22, 10);
    dctx.fill();
    dctx.fillStyle = '#ef4444';
    dctx.beginPath();
    dctx.arc(21, 21, 5, 0, Math.PI * 2);
    dctx.fill();
    dctx.strokeStyle = '#ffffff';
    dctx.lineWidth = 2.5;
    dctx.beginPath();
    dctx.arc(36, 21, 5, 0, Math.PI * 2);
    dctx.stroke();
    dollCanvas.refresh();

    // Magnet
    const magCanvas = this.textures.createCanvas('item-magnet', 44, 44);
    const mctx = magCanvas.getContext();
    mctx.strokeStyle = '#dc2626';
    mctx.lineWidth = 9;
    mctx.beginPath();
    mctx.arc(22, 18, 13, Math.PI, 0, false);
    mctx.stroke();
    mctx.beginPath();
    mctx.moveTo(9, 18);
    mctx.lineTo(9, 34);
    mctx.moveTo(35, 18);
    mctx.lineTo(35, 34);
    mctx.stroke();
    mctx.fillStyle = '#e2e8f0';
    mctx.fillRect(4, 30, 10, 10);
    mctx.fillRect(30, 30, 10, 10);
    magCanvas.refresh();

    // Wire
    const wireCanvas = this.textures.createCanvas('item-wire', 44, 44);
    const wctx = wireCanvas.getContext();
    wctx.strokeStyle = '#f59e0b';
    wctx.lineWidth = 4.5;
    wctx.beginPath();
    wctx.arc(22, 22, 15, 0, Math.PI * 2);
    wctx.stroke();
    wctx.beginPath();
    wctx.arc(24, 22, 12, 0, Math.PI * 2);
    wctx.stroke();
    wctx.beginPath();
    wctx.moveTo(32, 32);
    wctx.lineTo(40, 40);
    wctx.stroke();
    wireCanvas.refresh();

    // Grapple (Combined)
    const grpCanvas = this.textures.createCanvas('item-grapple', 44, 44);
    const gactx = grpCanvas.getContext();
    gactx.drawImage(wireCanvas.getSourceImage(), 0, 0);
    gactx.drawImage(magCanvas.getSourceImage(), 0, 4);
    grpCanvas.refresh();

    // Power Core (Glowing Vacuum Tube)
    const coreCanvas = this.textures.createCanvas('item-powercore', 44, 44);
    const crctx = coreCanvas.getContext();
    crctx.shadowBlur = 12;
    crctx.shadowColor = '#22d3ee';
    crctx.fillStyle = 'rgba(34, 211, 238, 0.4)';
    crctx.beginPath();
    crctx.arc(22, 20, 18, 0, Math.PI * 2);
    crctx.fill();
    crctx.fillStyle = '#22d3ee';
    crctx.beginPath();
    crctx.arc(22, 20, 10, 0, Math.PI * 2);
    crctx.fill();
    crctx.fillStyle = '#ffffff';
    crctx.beginPath();
    crctx.arc(22, 20, 4, 0, Math.PI * 2);
    crctx.fill();
    crctx.shadowBlur = 0;
    crctx.strokeStyle = '#d97706';
    crctx.lineWidth = 3;
    crctx.strokeRect(14, 10, 16, 22);
    coreCanvas.refresh();

    // 13. Comic Thought Bubble
    const bubbleCanvas = this.textures.createCanvas('thought-bubble', 220, 160);
    const bbctx = bubbleCanvas.getContext();
    bbctx.fillStyle = '#fffbeb';
    bbctx.beginPath();
    bbctx.roundRect(10, 10, 200, 120, 28);
    bbctx.fill();
    bbctx.lineWidth = 4;
    bbctx.strokeStyle = '#451a03';
    bbctx.stroke();
    // Tail
    bbctx.fillStyle = '#fffbeb';
    bbctx.beginPath();
    bbctx.arc(36, 140, 9, 0, Math.PI * 2);
    bbctx.fill();
    bbctx.stroke();
    bbctx.beginPath();
    bbctx.arc(22, 152, 5, 0, Math.PI * 2);
    bbctx.fill();
    bbctx.stroke();
    bubbleCanvas.refresh();

    // 14. Full-Screen Atmospheric Vignette
    const vigCanvas = this.textures.createCanvas('screen-vignette', 512, 512);
    const vctx = vigCanvas.getContext();
    const vGrad = vctx.createRadialGradient(256, 256, 140, 256, 256, 256);
    vGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vGrad.addColorStop(0.7, 'rgba(12, 10, 8, 0.4)');
    vGrad.addColorStop(1, 'rgba(12, 10, 8, 0.85)');
    vctx.fillStyle = vGrad;
    vctx.fillRect(0, 0, 512, 512);
    vigCanvas.refresh();

    // 15. Particles & Reticle
    const steamG = this.make.graphics({ x: 0, y: 0, add: false });
    steamG.fillStyle(0xe7e5e4, 0.45);
    steamG.fillCircle(14, 14, 14);
    steamG.generateTexture('steam-puff', 28, 28);

    const sparkG = this.make.graphics({ x: 0, y: 0, add: false });
    sparkG.fillStyle(0x38bdf8, 1);
    sparkG.fillCircle(4, 4, 4);
    sparkG.generateTexture('spark-particle', 8, 8);

    const pulseG = this.make.graphics({ x: 0, y: 0, add: false });
    pulseG.lineStyle(3, 0xf59e0b, 1);
    pulseG.strokeCircle(20, 20, 18);
    pulseG.fillStyle(0xf59e0b, 0.9);
    pulseG.fillCircle(20, 20, 5);
    pulseG.generateTexture('click-pulse', 40, 40);
  }

  create() {
    this.time.delayedCall(300, () => {
      this.scene.start('MainMenuScene');
    });
  }
}
