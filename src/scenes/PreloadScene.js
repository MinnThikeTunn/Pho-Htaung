import Phaser from 'phaser';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    const { width, height } = this.cameras.main;

    this.add.rectangle(width / 2, height / 2, width, height, 0x0c0a08);

    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x1c1815, 1);
    progressBox.fillRoundedRect(width / 2 - 200, height / 2 - 15, 400, 30, 15);
    progressBox.lineStyle(2, 0xd97706, 0.5);
    progressBox.strokeRoundedRect(width / 2 - 200, height / 2 - 15, 400, 30, 15);

    const progressBar = this.add.graphics();

    // Steampunk Rotating Brass Gear
    const gearContainer = this.add.container(width / 2, height / 2 - 110);
    const gearG = this.add.graphics();
    gearG.fillStyle(0xd97706, 1);
    gearG.fillCircle(0, 0, 22);
    gearG.fillStyle(0x0c0a08, 1);
    gearG.fillCircle(0, 0, 9);
    gearG.lineStyle(4, 0xf59e0b, 1);
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
      gearG.lineBetween(
        Math.cos(a) * 18,
        Math.sin(a) * 18,
        Math.cos(a) * 30,
        Math.sin(a) * 30
      );
    }
    gearContainer.add(gearG);

    this.tweens.add({
      targets: gearContainer,
      angle: 360,
      duration: 2500,
      repeat: -1,
      ease: 'Linear'
    });

    this.add.text(width / 2, height / 2 - 55, 'ငကြောင်ဖိုးထောင် ရွှေမြို့တော်ရှာပုံတော် ပြင်ဆင်နေသည်...', {
      fontFamily: 'Noto Sans Myanmar, Pyidaungsu, Plus Jakarta Sans',
      fontSize: '17px',
      fontStyle: '900',
      color: '#f59e0b',
      letterSpacing: '1px'
    }).setOrigin(0.5);

    const percentText = this.add.text(width / 2, height / 2 + 55, '0%', {
      fontFamily: 'Plus Jakarta Sans',
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

    // Load official Game-Icons.net vector assets
    this.load.svg('item-chili', 'assets/icons/chili-pepper.svg', { width: 56, height: 56 });
    this.load.svg('item-torn-bottle', 'assets/icons/broken-bottle.svg', { width: 56, height: 56 });
    this.load.svg('item-betel-cutter', 'assets/icons/pincers.svg', { width: 56, height: 56 });
    this.load.svg('item-rusty-spike', 'assets/icons/nails.svg', { width: 56, height: 56 });
    this.load.svg('item-cog', 'assets/icons/cog.svg', { width: 56, height: 56 });
    this.load.svg('item-red-gem', 'assets/icons/fire-gem.svg', { width: 56, height: 56 });
    this.load.svg('item-twigs', 'assets/icons/dead-wood.svg', { width: 56, height: 56 });
    this.load.svg('item-stone-3', 'assets/icons/rune-stone.svg', { width: 56, height: 56 });
    this.load.svg('item-gold-7', 'assets/icons/gold-stack.svg', { width: 56, height: 56 });
    this.load.svg('icon-scales', 'assets/icons/metal-scales.svg', { width: 96, height: 96 });
    this.load.svg('icon-shears', 'assets/icons/gardening-shears.svg', { width: 64, height: 64 });
    this.load.svg('icon-chest', 'assets/icons/treasure-chest.svg', { width: 72, height: 72 });
    this.load.svg('icon-lock', 'assets/icons/dial-padlock.svg', { width: 64, height: 64 });
    this.load.svg('icon-barn', 'assets/icons/barn.svg', { width: 80, height: 80 });
  }

  create() {
    this.createAllGameAssets();
    this.time.delayedCall(300, () => {
      this.scene.start('IntroScene');
    });
  }

  createAllGameAssets() {
    // 1. Phoe Htaung Character (Longyi tucked up, shoulder bag, one flip-flop, betel nut chewer)
    this.createPhoeHtaungTextures();

    // 2. U Gyi Character (Upper Myanmar shady broker, short longyi, smoking cheroot)
    this.createUGyiTextures();

    // 3. Item Icons
    this.createItemIcons();

    // 4. Trap & Puzzle Objects
    this.createTrapObjects();

    // 5. Particles & Vignette
    this.createParticlesAndVignette();
  }

  createPhoeHtaungTextures() {
    // Helper to draw Phoe Htaung in idle or walking frames
    const drawPH = (ctx, mode = 'idle') => {
      ctx.save();

      // Top-left lighting setup
      // 1. Head & Hair
      // Unruly Burmese village boy hair
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.arc(30, 18, 13, 0, Math.PI * 2);
      ctx.fill();
      // Jagged hair tufts
      ctx.beginPath();
      ctx.moveTo(20, 16);
      ctx.lineTo(16, 10);
      ctx.lineTo(24, 12);
      ctx.lineTo(28, 6);
      ctx.lineTo(34, 12);
      ctx.lineTo(42, 8);
      ctx.lineTo(42, 16);
      ctx.fill();

      // Hair top-left highlight
      ctx.fillStyle = '#382f29';
      ctx.beginPath();
      ctx.ellipse(26, 12, 7, 3, -0.3, 0, Math.PI * 2);
      ctx.fill();

      // Face base (Warm Myanmar tan complexion)
      ctx.fillStyle = '#b47a46'; // shadow tone
      ctx.beginPath();
      ctx.ellipse(30, 22, 10.5, 11, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#d49b6a'; // mid-tone
      ctx.beginPath();
      ctx.ellipse(29, 21, 9.5, 10, -0.1, 0, Math.PI * 2);
      ctx.fill();

      // Forehead highlight (2-tone top-left)
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.ellipse(26, 17, 5, 3, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // Bulging Betel Nut Cheek (Right side)
      ctx.fillStyle = '#c58354';
      ctx.beginPath();
      ctx.arc(37, 24, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(185, 28, 28, 0.45)'; // betel nut red flush
      ctx.beginPath();
      ctx.arc(37, 25, 3, 0, Math.PI * 2);
      ctx.fill();

      // Expressive Big Machinarium Cartoon Eyes
      // Left eye
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(26, 19, 3.2, 3.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1c1917';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Right eye
      ctx.beginPath();
      ctx.ellipse(33, 19, 3.2, 3.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Pupils (Curious / roguish gaze looking forward-up)
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(mode === 'walk-2' ? 26.5 : 27, 19, 1.6, 0, Math.PI * 2);
      ctx.arc(mode === 'walk-2' ? 33.5 : 34, 19, 1.6, 0, Math.PI * 2);
      ctx.fill();

      // Catchlight white dots
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(26.2, 18.2, 0.7, 0, Math.PI * 2);
      ctx.arc(33.2, 18.2, 0.7, 0, Math.PI * 2);
      ctx.fill();

      // Eyebrows
      ctx.strokeStyle = '#1c1917';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(23, 14.5);
      ctx.quadraticCurveTo(26, 13.5, 29, 15);
      ctx.moveTo(31, 15);
      ctx.quadraticCurveTo(34, 13, 37, 14.5);
      ctx.stroke();

      // Grinning Mouth with Betel Nut Red Stain
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(27, 26);
      ctx.quadraticCurveTo(31, 28.5, 36, 25.5);
      ctx.stroke();
      // Betel drip / dot
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.arc(36.5, 26, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Chin stubble
      ctx.fillStyle = 'rgba(28, 25, 23, 0.35)';
      ctx.fillRect(29, 29, 1, 1);
      ctx.fillRect(32, 29.5, 1, 1);

      // 2. Torso (Collarless Burmese cotton shirt with wrinkles & smudges)
      const torsoY = (mode === 'walk-1' || mode === 'walk-2') ? 31 : 32;

      // Shirt shadow
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.roundRect(19, torsoY, 22, 22, 3);
      ctx.fill();

      // Shirt body
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.roundRect(19, torsoY, 19, 21, 3);
      ctx.fill();

      // Shirt highlight (top-left)
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.roundRect(19, torsoY, 12, 10, 2);
      ctx.fill();

      // Neckline & Burmese loop buttons (ကြယ်သီးကွင်း)
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(27, torsoY);
      ctx.lineTo(27, torsoY + 12);
      ctx.stroke();
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(27, torsoY + 4, 1, 0, Math.PI * 2);
      ctx.arc(27, torsoY + 8, 1, 0, Math.PI * 2);
      ctx.fill();

      // Dirt smudges on shirt
      ctx.fillStyle = 'rgba(120, 53, 15, 0.2)';
      ctx.beginPath();
      ctx.arc(23, torsoY + 14, 2.5, 0, Math.PI * 2);
      ctx.arc(34, torsoY + 16, 2, 0, Math.PI * 2);
      ctx.fill();

      // 3. Authentic Shan Shoulder Bag (လွယ်အိတ်စုတ်ကြီး)
      let bagX = 14;
      let bagY = torsoY + 6;
      if (mode === 'walk-1') bagX = 16;
      if (mode === 'walk-2') bagX = 12;

      // Woven strap crossing chest
      ctx.strokeStyle = '#365314';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(35, torsoY);
      ctx.lineTo(bagX + 4, bagY + 2);
      ctx.stroke();

      // Brass buckle
      ctx.fillStyle = '#d97706';
      ctx.fillRect(28, torsoY + 4, 3, 3);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(29, torsoY + 4.5, 1, 1);

      // Bag Body
      ctx.fillStyle = '#1e3a1e'; // shadow
      ctx.beginPath();
      ctx.roundRect(bagX - 1, bagY - 1, 15, 18, 4);
      ctx.fill();

      ctx.fillStyle = '#4d7c0f'; // midtone
      ctx.beginPath();
      ctx.roundRect(bagX, bagY, 13, 16, 3);
      ctx.fill();

      // Ethnic diamond embroidery motif
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(bagX + 6.5, bagY + 4);
      ctx.lineTo(bagX + 10, bagY + 8);
      ctx.lineTo(bagX + 6.5, bagY + 12);
      ctx.lineTo(bagX + 3, bagY + 8);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(bagX + 6.5, bagY + 8, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Hanging bottom tassels
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(bagX + 3, bagY + 16);
      ctx.lineTo(bagX + 3, bagY + 20);
      ctx.moveTo(bagX + 7, bagY + 16);
      ctx.lineTo(bagX + 7, bagY + 21);
      ctx.moveTo(bagX + 10, bagY + 16);
      ctx.lineTo(bagX + 10, bagY + 20);
      ctx.stroke();

      // 4. Tucked-up Longyi (ပုဆိုးခါးတောင်းကျိုက် - Checkered Green Pattern)
      const longyiY = torsoY + 20;

      // Longyi base bunched around thighs
      ctx.fillStyle = '#064e3b';
      ctx.beginPath();
      ctx.roundRect(17, longyiY, 26, 14, 5);
      ctx.fill();

      ctx.fillStyle = '#047857';
      ctx.beginPath();
      ctx.roundRect(18, longyiY, 22, 13, 4);
      ctx.fill();

      // Rolled waist knot (ခါးပုံစ)
      ctx.fillStyle = '#022c22';
      ctx.beginPath();
      ctx.ellipse(30, longyiY + 2, 4.5, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.ellipse(29, longyiY + 1.5, 3, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Checkered grid pattern lines
      ctx.strokeStyle = '#022c22';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(21, longyiY + 3); ctx.lineTo(21, longyiY + 14);
      ctx.moveTo(25, longyiY + 3); ctx.lineTo(25, longyiY + 14);
      ctx.moveTo(29, longyiY + 3); ctx.lineTo(29, longyiY + 14);
      ctx.moveTo(33, longyiY + 3); ctx.lineTo(33, longyiY + 14);
      ctx.moveTo(37, longyiY + 3); ctx.lineTo(37, longyiY + 14);
      ctx.moveTo(18, longyiY + 6); ctx.lineTo(41, longyiY + 6);
      ctx.moveTo(18, longyiY + 10); ctx.lineTo(41, longyiY + 10);
      ctx.stroke();

      // 5. Legs & Feet
      const legY = longyiY + 13;

      if (mode === 'idle') {
        // Left Leg (Wearing single blue flip-flop)
        ctx.fillStyle = '#b47a46';
        ctx.fillRect(21, legY, 5, 14);
        ctx.fillStyle = '#d49b6a';
        ctx.fillRect(21, legY, 3.5, 13);
        // Knee bump
        ctx.fillStyle = '#fed7aa';
        ctx.fillRect(21, legY + 3, 3, 2);

        // Blue Flip-Flop (ခြေညှပ်ဖိနပ်)
        ctx.fillStyle = '#1d4ed8'; // blue rubber sole
        ctx.beginPath();
        ctx.roundRect(18, 78, 11, 4.5, 2);
        ctx.fill();
        ctx.fillStyle = '#60a5fa'; // sole highlight
        ctx.fillRect(19, 78, 8, 1.2);
        // White Y-strap
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(20, 80);
        ctx.lineTo(23.5, 76.5);
        ctx.lineTo(27, 80);
        ctx.stroke();

        // Right Leg (Completely bare foot with toes)
        ctx.fillStyle = '#b47a46';
        ctx.fillRect(34, legY, 5, 14);
        ctx.fillStyle = '#d49b6a';
        ctx.fillRect(34, legY, 3.5, 13);
        // Knee bump
        ctx.fillStyle = '#fed7aa';
        ctx.fillRect(34, legY + 3, 3, 2);

        // Bare Foot with cartoon toes
        ctx.fillStyle = '#d49b6a';
        ctx.beginPath();
        ctx.roundRect(32, 78, 10, 4.5, 2);
        ctx.fill();
        // Visible toes
        ctx.fillStyle = '#b47a46';
        ctx.fillRect(33, 79, 1.2, 3);
        ctx.fillRect(35, 79, 1.2, 3);
        ctx.fillRect(37, 79, 1.2, 3);
        // Heel dirt
        ctx.fillStyle = '#78350f';
        ctx.fillRect(40, 80, 2, 2);

      } else if (mode === 'walk-1') {
        // Walk frame 1: Left leg (blue flip-flop) stepped forward, Right leg pushed back
        // Left Leg forward
        ctx.fillStyle = '#d49b6a';
        ctx.beginPath();
        ctx.moveTo(22, legY);
        ctx.lineTo(17, 78);
        ctx.lineTo(22, 78);
        ctx.lineTo(26, legY);
        ctx.closePath();
        ctx.fill();

        // Flip-flop forward
        ctx.fillStyle = '#1d4ed8';
        ctx.beginPath();
        ctx.roundRect(13, 78, 11, 4.5, 2);
        ctx.fill();
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(15, 80);
        ctx.lineTo(18.5, 76.5);
        ctx.lineTo(22, 80);
        ctx.stroke();

        // Right bare leg trailing back
        ctx.fillStyle = '#b47a46';
        ctx.beginPath();
        ctx.moveTo(33, legY);
        ctx.lineTo(39, 76);
        ctx.lineTo(44, 76);
        ctx.lineTo(37, legY);
        ctx.closePath();
        ctx.fill();
        // Bare toes touching ground angled
        ctx.fillStyle = '#d49b6a';
        ctx.beginPath();
        ctx.ellipse(40, 77, 4, 3, 0.4, 0, Math.PI * 2);
        ctx.fill();

      } else if (mode === 'walk-2') {
        // Walk frame 2: Right bare leg stepped forward, Left flip-flop leg trailing back
        // Right Leg forward (Bare foot)
        ctx.fillStyle = '#d49b6a';
        ctx.beginPath();
        ctx.moveTo(33, legY);
        ctx.lineTo(28, 78);
        ctx.lineTo(33, 78);
        ctx.lineTo(37, legY);
        ctx.closePath();
        ctx.fill();

        // Bare foot forward with toes
        ctx.fillStyle = '#d49b6a';
        ctx.beginPath();
        ctx.roundRect(26, 78, 10, 4.5, 2);
        ctx.fill();
        ctx.fillStyle = '#b47a46';
        ctx.fillRect(27, 79, 1.2, 3);
        ctx.fillRect(29, 79, 1.2, 3);
        ctx.fillRect(31, 79, 1.2, 3);

        // Left flip-flop leg trailing back
        ctx.fillStyle = '#b47a46';
        ctx.beginPath();
        ctx.moveTo(21, legY);
        ctx.lineTo(15, 75);
        ctx.lineTo(19, 75);
        ctx.lineTo(25, legY);
        ctx.closePath();
        ctx.fill();

        // Flip-flop lifted at angle
        ctx.save();
        ctx.translate(16, 75);
        ctx.rotate(-0.35);
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(-5, 0, 10, 4);
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-3, 2);
        ctx.lineTo(0, -1);
        ctx.lineTo(3, 2);
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    };

    // 1. ph-idle
    const phCanvas = this.textures.createCanvas('ph-idle', 60, 84);
    drawPH(phCanvas.getContext(), 'idle');
    phCanvas.refresh();

    // 2. ph-walk-1
    const w1Canvas = this.textures.createCanvas('ph-walk-1', 60, 84);
    drawPH(w1Canvas.getContext(), 'walk-1');
    w1Canvas.refresh();

    // 3. ph-walk-2
    const w2Canvas = this.textures.createCanvas('ph-walk-2', 60, 84);
    drawPH(w2Canvas.getContext(), 'walk-2');
    w2Canvas.refresh();

    // 4. Flattened / Smashed Pancake Phoe Htaung (90x30)
    const flatCanvas = this.textures.createCanvas('ph-flat', 90, 30);
    const fctx = flatCanvas.getContext();
    // Squished flat pancake face & body
    fctx.fillStyle = '#b47a46';
    fctx.beginPath();
    fctx.ellipse(45, 19, 42, 9, 0, 0, Math.PI * 2);
    fctx.fill();
    fctx.fillStyle = '#d49b6a';
    fctx.beginPath();
    fctx.ellipse(45, 17, 39, 8, 0, 0, Math.PI * 2);
    fctx.fill();

    // Squashed green checkered longyi
    fctx.fillStyle = '#064e3b';
    fctx.fillRect(20, 11, 50, 7);
    fctx.strokeStyle = '#022c22';
    fctx.lineWidth = 1;
    for (let x = 24; x < 68; x += 6) {
      fctx.strokeRect(x, 11, 4, 7);
    }

    // Goofy spiral/star stunned eyes
    fctx.strokeStyle = '#1e293b';
    fctx.lineWidth = 1.5;
    fctx.beginPath();
    // Left eye spiral
    fctx.arc(36, 17, 4, 0, Math.PI * 1.5);
    fctx.stroke();
    fctx.beginPath();
    // Right eye spiral
    fctx.arc(54, 17, 4, 0, Math.PI * 1.5);
    fctx.stroke();

    // Betel juice splatter puddle
    fctx.fillStyle = '#b91c1c';
    fctx.beginPath();
    fctx.arc(72, 18, 6, 0, Math.PI * 2);
    fctx.arc(78, 20, 3.5, 0, Math.PI * 2);
    fctx.arc(82, 17, 2, 0, Math.PI * 2);
    fctx.fill();

    // Blue flip-flop popped off to the side
    fctx.fillStyle = '#1d4ed8';
    fctx.fillRect(6, 20, 10, 4);
    fctx.fillStyle = '#f8fafc';
    fctx.fillRect(9, 18, 3, 2);

    // Stunned yellow stars floating
    fctx.fillStyle = '#facc15';
    fctx.beginPath();
    fctx.arc(30, 6, 2, 0, Math.PI * 2);
    fctx.arc(45, 4, 2.5, 0, Math.PI * 2);
    fctx.arc(60, 6, 2, 0, Math.PI * 2);
    fctx.fill();
    flatCanvas.refresh();

    // 5. Boiled Red Shrimp Phoe Htaung (Steam death - 60x84)
    const boilCanvas = this.textures.createCanvas('ph-boiled', 60, 84);
    const bctx = boilCanvas.getContext();
    drawPH(bctx, 'idle');
    // Overlap searing lobster/prawn red overlay
    bctx.fillStyle = 'rgba(239, 68, 68, 0.65)';
    bctx.beginPath();
    bctx.arc(30, 20, 13, 0, Math.PI * 2);
    bctx.fillRect(18, 32, 24, 46);
    bctx.fill();

    // Blistering steam bubbles & sweat drops
    bctx.fillStyle = '#fee2e2';
    bctx.beginPath();
    bctx.arc(22, 14, 3, 0, Math.PI * 2);
    bctx.arc(38, 12, 4, 0, Math.PI * 2);
    bctx.arc(43, 28, 2.5, 0, Math.PI * 2);
    bctx.arc(17, 40, 3, 0, Math.PI * 2);
    bctx.fill();

    // X_X dazed cartoon eyes
    bctx.strokeStyle = '#ffffff';
    bctx.lineWidth = 2;
    bctx.beginPath();
    // left X
    bctx.moveTo(24, 17); bctx.lineTo(28, 21);
    bctx.moveTo(28, 17); bctx.lineTo(24, 21);
    // right X
    bctx.moveTo(31, 17); bctx.lineTo(35, 21);
    bctx.moveTo(35, 17); bctx.lineTo(31, 21);
    bctx.stroke();

    // Rising steam puffs
    bctx.fillStyle = 'rgba(241, 245, 249, 0.8)';
    bctx.beginPath();
    bctx.arc(28, 6, 3, 0, Math.PI * 2);
    bctx.arc(34, 4, 3.5, 0, Math.PI * 2);
    bctx.fill();
    boilCanvas.refresh();

    // 6. Ash Pile with Blinking Eyes (Laser / Trap death - 70x40)
    const ashCanvas = this.textures.createCanvas('ph-ash', 70, 40);
    const actx = ashCanvas.getContext();
    // Ash mound
    actx.fillStyle = '#334155';
    actx.beginPath();
    actx.ellipse(35, 28, 32, 10, 0, 0, Math.PI * 2);
    actx.fill();
    actx.fillStyle = '#1e293b';
    actx.beginPath();
    actx.ellipse(35, 25, 24, 8, 0, 0, Math.PI * 2);
    actx.fill();

    // Glowing orange embers inside ash
    actx.fillStyle = '#ea580c';
    actx.beginPath();
    actx.arc(22, 28, 2, 0, Math.PI * 2);
    actx.arc(46, 27, 2.5, 0, Math.PI * 2);
    actx.arc(34, 32, 1.8, 0, Math.PI * 2);
    actx.fill();
    actx.fillStyle = '#f97316';
    actx.beginPath();
    actx.arc(22, 28, 1, 0, Math.PI * 2);
    actx.arc(46, 27, 1.2, 0, Math.PI * 2);
    actx.fill();

    // Big wide white cartoon eyeballs peering out of ash
    actx.fillStyle = '#ffffff';
    actx.beginPath();
    actx.arc(29, 17, 5.5, 0, Math.PI * 2);
    actx.arc(41, 17, 5.5, 0, Math.PI * 2);
    actx.fill();
    actx.strokeStyle = '#0f172a';
    actx.lineWidth = 1.4;
    actx.stroke();

    // Bewildered cartoon pupils
    actx.fillStyle = '#0f172a';
    actx.beginPath();
    actx.arc(30, 17, 2.2, 0, Math.PI * 2);
    actx.arc(42, 17, 2.2, 0, Math.PI * 2);
    actx.fill();

    // Smoke wisp rising
    actx.strokeStyle = 'rgba(203, 213, 225, 0.6)';
    actx.lineWidth = 1.5;
    actx.beginPath();
    actx.moveTo(35, 12);
    actx.quadraticCurveTo(32, 6, 36, 2);
    actx.stroke();
    ashCanvas.refresh();

    // 7. Cut Legs Phoe Htaung (Scissor / Razor trap death - 60x84)
    const cutCanvas = this.textures.createCanvas('ph-cut-legs', 60, 84);
    const cctx = cutCanvas.getContext();
    drawPH(cctx, 'idle');

    // Sever torso at hip line with 8px horizontal gap
    cctx.clearRect(0, 52, 60, 10);

    // Scream mouth on face
    cctx.fillStyle = '#7f1d1d';
    cctx.beginPath();
    cctx.ellipse(31, 26, 4, 3, 0, 0, Math.PI * 2);
    cctx.fill();

    // Giant shock sweat droplets spraying out
    cctx.fillStyle = '#38bdf8';
    cctx.beginPath();
    cctx.arc(46, 12, 3.5, 0, Math.PI * 2);
    cctx.arc(14, 16, 3, 0, Math.PI * 2);
    cctx.arc(49, 36, 2.5, 0, Math.PI * 2);
    cctx.fill();
    cutCanvas.refresh();
  }

  createUGyiTextures() {
    // U Gyi: Shady broker smoking a cheroot (ဆေးပေါ့လိပ်)
    const ugCanvas = this.textures.createCanvas('ugyi-standing', 70, 96);
    const uctx = ugCanvas.getContext();

    // 1. Golden Silk Gaungbaung Turban (ခေါင်းပေါင်း)
    // Turban dome wrap
    uctx.fillStyle = '#b45309'; // shadow
    uctx.beginPath();
    uctx.ellipse(35, 14, 16, 8, 0, 0, Math.PI * 2);
    uctx.fill();

    uctx.fillStyle = '#d97706'; // midtone gold
    uctx.beginPath();
    uctx.ellipse(34, 13, 15, 7, -0.05, 0, Math.PI * 2);
    uctx.fill();

    // Silk wrap folds
    uctx.strokeStyle = '#78350f';
    uctx.lineWidth = 1.2;
    uctx.beginPath();
    uctx.moveTo(22, 14);
    uctx.quadraticCurveTo(34, 11, 46, 14);
    uctx.moveTo(24, 17);
    uctx.quadraticCurveTo(35, 14, 47, 17);
    uctx.stroke();

    // Golden folded wing flap on right (မဟူရာရွှေရောင် အနားလိပ်)
    uctx.fillStyle = '#f59e0b';
    uctx.beginPath();
    uctx.moveTo(46, 11);
    uctx.lineTo(55, 6);
    uctx.lineTo(52, 16);
    uctx.lineTo(45, 15);
    uctx.closePath();
    uctx.fill();
    uctx.strokeStyle = '#b45309';
    uctx.stroke();

    // 2. Head & Weathered Face
    uctx.fillStyle = '#a16207'; // shadow
    uctx.beginPath();
    uctx.ellipse(35, 25, 13, 12, 0, 0, Math.PI * 2);
    uctx.fill();

    uctx.fillStyle = '#c58b59'; // midtone tan
    uctx.beginPath();
    uctx.ellipse(34, 24, 12, 11, 0, 0, Math.PI * 2);
    uctx.fill();

    // Wrinkles / Crows feet
    uctx.strokeStyle = '#78350f';
    uctx.lineWidth = 1;
    uctx.beginPath();
    uctx.moveTo(22, 22); uctx.lineTo(25, 23);
    uctx.moveTo(43, 22); uctx.lineTo(46, 23);
    uctx.stroke();

    // Crafty Squinting Cartoon Eyes
    uctx.fillStyle = '#ffffff';
    uctx.beginPath();
    uctx.ellipse(28, 22, 3, 2.2, 0.1, 0, Math.PI * 2);
    uctx.ellipse(39, 22, 3, 2.2, -0.1, 0, Math.PI * 2);
    uctx.fill();
    uctx.strokeStyle = '#292524';
    uctx.lineWidth = 1;
    uctx.stroke();

    // Dark cunning pupils
    uctx.fillStyle = '#1c1917';
    uctx.beginPath();
    uctx.arc(29, 22, 1.4, 0, Math.PI * 2);
    uctx.arc(40, 22, 1.4, 0, Math.PI * 2);
    uctx.fill();

    // Arched Scheming Eyebrows
    uctx.strokeStyle = '#292524';
    uctx.lineWidth = 1.6;
    uctx.beginPath();
    uctx.moveTo(25, 18); uctx.quadraticCurveTo(28, 16.5, 31, 18);
    uctx.moveTo(36, 18); uctx.quadraticCurveTo(39, 16, 42, 18.5);
    uctx.stroke();

    // Drooping Salt-and-Pepper Mustache
    uctx.fillStyle = '#292524';
    uctx.beginPath();
    uctx.moveTo(35, 28);
    uctx.quadraticCurveTo(26, 27, 24, 33);
    uctx.quadraticCurveTo(29, 31, 35, 30);
    uctx.quadraticCurveTo(41, 31, 46, 33);
    uctx.quadraticCurveTo(44, 27, 35, 28);
    uctx.fill();
    // Gray flecks
    uctx.strokeStyle = '#a8a29e';
    uctx.lineWidth = 1;
    uctx.beginPath();
    uctx.moveTo(26, 30); uctx.lineTo(29, 29);
    uctx.moveTo(41, 29); uctx.lineTo(44, 30);
    uctx.stroke();

    // Wide Smug Grin with Sparkling Gold Tooth
    uctx.fillStyle = '#1c1917';
    uctx.beginPath();
    uctx.arc(35, 30, 4, 0, Math.PI);
    uctx.fill();
    // Gold tooth
    uctx.fillStyle = '#fbbf24';
    uctx.fillRect(35.5, 30, 2, 2.5);

    // 3. Burmese Cheroot (ဆေးပေါ့လိပ်) with glowing ember & smoke
    uctx.fillStyle = '#57534e'; // rolled leaf
    uctx.fillRect(39, 30, 18, 4.5);
    uctx.fillStyle = '#f8fafc'; // white filter band
    uctx.fillRect(40, 30, 3, 4.5);

    // Glowing red ember tip
    uctx.fillStyle = '#ea580c';
    uctx.beginPath();
    uctx.arc(57, 32.2, 3, 0, Math.PI * 2);
    uctx.fill();
    uctx.fillStyle = '#fef08a';
    uctx.beginPath();
    uctx.arc(57.5, 32.2, 1.5, 0, Math.PI * 2);
    uctx.fill();

    // Delicate curling smoke plume
    uctx.strokeStyle = 'rgba(226, 232, 240, 0.7)';
    uctx.lineWidth = 1.8;
    uctx.beginPath();
    uctx.moveTo(58, 31);
    uctx.quadraticCurveTo(63, 24, 60, 18);
    uctx.quadraticCurveTo(57, 12, 63, 6);
    uctx.stroke();

    // 4. Tweed Vest & Silk Shirt
    // Silk collar / shirt
    uctx.fillStyle = '#fef3c7';
    uctx.fillRect(30, 36, 10, 8);

    // Brown vintage tweed vest
    uctx.fillStyle = '#451a03'; // shadow
    uctx.beginPath();
    uctx.roundRect(20, 38, 30, 28, 4);
    uctx.fill();

    uctx.fillStyle = '#78350f'; // midtone
    uctx.beginPath();
    uctx.roundRect(21, 38, 27, 27, 3);
    uctx.fill();

    // Golden brass pocket watch chain looping into vest pocket
    uctx.strokeStyle = '#f59e0b';
    uctx.lineWidth = 1.5;
    uctx.beginPath();
    uctx.moveTo(33, 46);
    uctx.quadraticCurveTo(37, 54, 43, 50);
    uctx.stroke();

    // Vest buttons
    uctx.fillStyle = '#d97706';
    uctx.beginPath();
    uctx.arc(33, 44, 1.3, 0, Math.PI * 2);
    uctx.arc(33, 50, 1.3, 0, Math.PI * 2);
    uctx.arc(33, 56, 1.3, 0, Math.PI * 2);
    uctx.fill();

    // 5. Rich Mandalay Paso (ပုဆိုး) with Lun Taya Acheik (လွန်းတစ်ရာအချိတ်) pattern
    uctx.fillStyle = '#7f1d1d'; // ruby red base
    uctx.beginPath();
    uctx.roundRect(18, 64, 34, 18, 4);
    uctx.fill();

    // Wavy gold Acheik zigzag pattern
    uctx.strokeStyle = '#f59e0b';
    uctx.lineWidth = 1.6;
    uctx.beginPath();
    uctx.moveTo(19, 68);
    for (let x = 19; x < 50; x += 6) {
      uctx.lineTo(x + 3, 72);
      uctx.lineTo(x + 6, 68);
    }
    uctx.moveTo(19, 74);
    for (let x = 19; x < 50; x += 6) {
      uctx.lineTo(x + 3, 78);
      uctx.lineTo(x + 6, 74);
    }
    uctx.stroke();

    // 6. Legs & Velvet Mandalay Slippers (ကတ္တီပါဖိနပ်)
    uctx.fillStyle = '#c58b59';
    uctx.fillRect(25, 82, 6, 9);
    uctx.fillRect(39, 82, 6, 9);

    // Maroon velvet slippers with gold embroidery rim
    uctx.fillStyle = '#4c0519';
    uctx.beginPath();
    uctx.roundRect(22, 89, 12, 5, 2);
    uctx.roundRect(36, 89, 12, 5, 2);
    uctx.fill();
    uctx.strokeStyle = '#d97706';
    uctx.lineWidth = 1;
    uctx.strokeRect(22, 89, 12, 1.5);
    uctx.strokeRect(36, 89, 12, 1.5);
    ugCanvas.refresh();
  }

  createItemIcons() {
    // 1. Betel Nut Cutter (ကွမ်းသီးညှပ်)
    if (!this.textures.exists('item-betel-cutter')) {
      const bcCanvas = this.textures.createCanvas('item-betel-cutter', 44, 44);
      const bctx = bcCanvas.getContext();
      bctx.strokeStyle = '#94a3b8';
      bctx.lineWidth = 4;
      bctx.beginPath();
      bctx.moveTo(8, 36);
      bctx.lineTo(24, 12);
      bctx.lineTo(36, 12);
      bctx.moveTo(8, 12);
      bctx.lineTo(24, 36);
      bctx.stroke();
      bctx.fillStyle = '#f59e0b';
      bctx.beginPath();
      bctx.arc(24, 24, 4, 0, Math.PI * 2);
      bctx.fill();
      bcCanvas.refresh();
    }

    // 2. Torn Plastic Bottle (ရေဗူးစုတ်)
    if (!this.textures.exists('item-torn-bottle')) {
      const tbCanvas = this.textures.createCanvas('item-torn-bottle', 44, 44);
      const tctx = tbCanvas.getContext();
      tctx.fillStyle = '#38bdf8';
      tctx.beginPath();
      tctx.roundRect(14, 12, 16, 26, 6);
      tctx.fill();
      tctx.strokeStyle = '#0284c7';
      tctx.lineWidth = 2;
      tctx.stroke();
      tctx.fillStyle = '#1c1917';
      tctx.beginPath();
      tctx.moveTo(14, 34);
      tctx.lineTo(20, 30);
      tctx.lineTo(24, 38);
      tctx.lineTo(30, 32);
      tctx.lineTo(30, 38);
      tctx.lineTo(14, 38);
      tctx.fill();
      tbCanvas.refresh();
    }

    // 3. Half Bottle (ထက်ခြမ်းခွဲထားသော ရေဗူးစုတ်)
    if (!this.textures.exists('item-half-bottle')) {
      const hbCanvas = this.textures.createCanvas('item-half-bottle', 44, 44);
      const hctx = hbCanvas.getContext();
      hctx.fillStyle = '#38bdf8';
      hctx.beginPath();
      hctx.moveTo(10, 10);
      hctx.lineTo(34, 10);
      hctx.lineTo(30, 34);
      hctx.lineTo(14, 34);
      hctx.closePath();
      hctx.fill();
      hctx.strokeStyle = '#0284c7';
      hctx.lineWidth = 2;
      hctx.stroke();
      hbCanvas.refresh();
    }

    // 4. 50-Viss Rusty Spike (၅၀ ပိဿာ သံမှိုကြီး)
    if (!this.textures.exists('item-rusty-spike')) {
      const spCanvas = this.textures.createCanvas('item-rusty-spike', 44, 44);
      const spctx = spCanvas.getContext();
      spctx.fillStyle = '#78350f';
      spctx.fillRect(8, 8, 28, 8);
      spctx.beginPath();
      spctx.moveTo(18, 16);
      spctx.lineTo(26, 16);
      spctx.lineTo(22, 40);
      spctx.closePath();
      spctx.fill();
      spctx.fillStyle = '#d97706';
      spctx.fillRect(20, 18, 4, 16);
      spCanvas.refresh();
    }

    // 5. Dried Chili (ငရုတ်သီးခြောက်တောင့်)
    if (!this.textures.exists('item-chili')) {
      const chCanvas = this.textures.createCanvas('item-chili', 44, 44);
      const chctx = chCanvas.getContext();
      chctx.strokeStyle = '#15803d';
      chctx.lineWidth = 3;
      chctx.beginPath();
      chctx.moveTo(14, 10);
      chctx.lineTo(18, 16);
      chctx.stroke();
      chctx.fillStyle = '#dc2626';
      chctx.beginPath();
      chctx.moveTo(18, 16);
      chctx.quadraticCurveTo(34, 22, 28, 38);
      chctx.quadraticCurveTo(20, 32, 18, 16);
      chctx.fill();
      chCanvas.refresh();
    }

    // 6. Dry Twigs (သစ်ကိုင်းခြောက်များ)
    if (!this.textures.exists('item-twigs')) {
      const twCanvas = this.textures.createCanvas('item-twigs', 44, 44);
      const twctx = twCanvas.getContext();
      twctx.strokeStyle = '#78350f';
      twctx.lineWidth = 3;
      twctx.beginPath();
      twctx.moveTo(10, 36);
      twctx.lineTo(34, 8);
      twctx.moveTo(22, 22);
      twctx.lineTo(34, 28);
      twctx.moveTo(18, 28);
      twctx.lineTo(8, 18);
      twctx.stroke();
      twCanvas.refresh();
    }

    // 7. Stone 3-Viss (၃ ပိဿာ)
    if (!this.textures.exists('item-stone-3')) {
      const stCanvas = this.textures.createCanvas('item-stone-3', 44, 44);
      const stctx = stCanvas.getContext();
      stctx.fillStyle = '#64748b';
      stctx.beginPath();
      stctx.ellipse(22, 24, 18, 14, 0, 0, Math.PI * 2);
      stctx.fill();
      stctx.fillStyle = '#ffffff';
      stctx.font = 'bold 12px Plus Jakarta Sans, Noto Sans Myanmar';
      stctx.fillText('၃', 18, 28);
      stCanvas.refresh();
    }

    // 8. Gold 7-Viss (၇ ပိဿာ)
    if (!this.textures.exists('item-gold-7')) {
      const gdCanvas = this.textures.createCanvas('item-gold-7', 44, 44);
      const gdctx = gdCanvas.getContext();
      gdctx.fillStyle = '#eab308';
      gdctx.beginPath();
      gdctx.roundRect(8, 14, 28, 18, 4);
      gdctx.fill();
      gdctx.strokeStyle = '#ca8a04';
      gdctx.lineWidth = 2;
      gdctx.stroke();
      gdctx.fillStyle = '#1c1917';
      gdctx.font = 'bold 12px Plus Jakarta Sans, Noto Sans Myanmar';
      gdctx.fillText('၇', 18, 28);
      gdCanvas.refresh();
    }

    // 9. Red Gem (ကျောက်မျက်နီ)
    if (!this.textures.exists('item-red-gem')) {
      const rgCanvas = this.textures.createCanvas('item-red-gem', 44, 44);
      const rgctx = rgCanvas.getContext();
      rgctx.fillStyle = '#ef4444';
      rgctx.beginPath();
      rgctx.moveTo(22, 6);
      rgctx.lineTo(36, 18);
      rgctx.lineTo(22, 38);
      rgctx.lineTo(8, 18);
      rgctx.closePath();
      rgctx.fill();
      rgctx.strokeStyle = '#b91c1c';
      rgctx.lineWidth = 2;
      rgctx.stroke();
      rgCanvas.refresh();
    }

    // 10. Bamboo Pole Lever (ဝါးလုံးတုတ်)
    if (!this.textures.exists('item-bamboo-pole')) {
      const bpCanvas = this.textures.createCanvas('item-bamboo-pole', 44, 44);
      const bpctx = bpCanvas.getContext();
      bpctx.strokeStyle = '#65a30d';
      bpctx.lineWidth = 6;
      bpctx.lineCap = 'round';
      bpctx.beginPath();
      bpctx.moveTo(8, 36);
      bpctx.lineTo(36, 8);
      bpctx.stroke();
      bpctx.strokeStyle = '#3f6212';
      bpctx.lineWidth = 2;
      bpctx.beginPath();
      bpctx.moveTo(16, 26);
      bpctx.lineTo(20, 30);
      bpctx.moveTo(24, 18);
      bpctx.lineTo(28, 22);
      bpctx.stroke();
      bpCanvas.refresh();
    }

    // 11. Rusty Brass Cogwheel (သံချေးတက် ဂီယာခွေ)
    if (!this.textures.exists('item-cog')) {
      const cogCanvas = this.textures.createCanvas('item-cog', 44, 44);
      const cogctx = cogCanvas.getContext();
      cogctx.fillStyle = '#b45309';
      cogctx.beginPath();
      cogctx.arc(22, 22, 14, 0, Math.PI * 2);
      cogctx.fill();
      cogctx.strokeStyle = '#78350f';
      cogctx.lineWidth = 2;
      cogctx.stroke();
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        cogctx.fillStyle = '#d97706';
        cogctx.fillRect(22 + Math.cos(a) * 14 - 3, 22 + Math.sin(a) * 14 - 3, 6, 6);
      }
      cogctx.fillStyle = '#1c1917';
      cogctx.beginPath();
      cogctx.arc(22, 22, 5, 0, Math.PI * 2);
      cogctx.fill();
      cogCanvas.refresh();
    }

    // 12. Chalk / Charcoal Stylus (ကျောက်ဖြူတုံး)
    const chkCanvas = this.textures.createCanvas('item-chalk', 44, 44);
    const chkctx = chkCanvas.getContext();
    chkctx.fillStyle = '#f1f5f9';
    chkctx.beginPath();
    chkctx.roundRect(14, 10, 16, 26, 4);
    chkctx.fill();
    chkctx.strokeStyle = '#94a3b8';
    chkctx.lineWidth = 2;
    chkctx.stroke();
    chkCanvas.refresh();

    // 13. Folded Parchment Engineer Note (လျှို့ဝှက်ပုံကြမ်း စာရွက်)
    const ntCanvas = this.textures.createCanvas('item-engineer-note', 44, 44);
    const ntctx = ntCanvas.getContext();
    ntctx.fillStyle = '#fef3c7';
    ntctx.beginPath();
    ntctx.roundRect(8, 8, 28, 30, 4);
    ntctx.fill();
    ntctx.strokeStyle = '#d97706';
    ntctx.lineWidth = 2;
    ntctx.stroke();
    // Blueprint text lines
    ntctx.fillStyle = '#92400e';
    ntctx.fillRect(12, 14, 20, 2);
    ntctx.fillRect(12, 20, 16, 2);
    ntctx.fillRect(12, 26, 18, 2);
    ntCanvas.refresh();
  }

  createTrapObjects() {
    // 50-Ton "VICTORY!" Stone Block (Chapter 5)
    const vicCanvas = this.textures.createCanvas('victory-block', 240, 120);
    const vctx = vicCanvas.getContext();
    vctx.fillStyle = '#475569';
    vctx.fillRect(4, 4, 232, 112);
    vctx.lineWidth = 4;
    vctx.strokeStyle = '#1e293b';
    vctx.strokeRect(4, 4, 232, 112);
    vctx.fillStyle = '#f8fafc';
    vctx.font = '900 36px Plus Jakarta Sans';
    vctx.fillText('VICTORY!', 38, 72);
    vicCanvas.refresh();

    // Gold Coin (Chapter 1 Bait)
    const coinCanvas = this.textures.createCanvas('coin-bait', 48, 48);
    const cctx = coinCanvas.getContext();
    cctx.fillStyle = '#eab308';
    cctx.beginPath();
    cctx.arc(24, 24, 20, 0, Math.PI * 2);
    cctx.fill();
    cctx.strokeStyle = '#ca8a04';
    cctx.lineWidth = 3;
    cctx.stroke();
    cctx.fillStyle = '#713f12';
    cctx.font = '900 20px Plus Jakarta Sans';
    cctx.fillText('$', 18, 31);
    coinCanvas.refresh();

    // Giant Iron Safe (Chapter 4)
    const safeCanvas = this.textures.createCanvas('iron-safe', 160, 180);
    const sfctx = safeCanvas.getContext();
    sfctx.fillStyle = '#334155';
    sfctx.beginPath();
    sfctx.roundRect(6, 6, 148, 168, 16);
    sfctx.fill();
    sfctx.lineWidth = 4;
    sfctx.strokeStyle = '#0f172a';
    sfctx.stroke();

    // Round Vault Door
    sfctx.fillStyle = '#475569';
    sfctx.beginPath();
    sfctx.arc(80, 90, 56, 0, Math.PI * 2);
    sfctx.fill();
    sfctx.lineWidth = 3;
    sfctx.strokeStyle = '#1e293b';
    sfctx.stroke();

    // Keyhole
    sfctx.fillStyle = '#0f172a';
    sfctx.beginPath();
    sfctx.arc(80, 84, 8, 0, Math.PI * 2);
    sfctx.fillRect(77, 84, 6, 18);
    sfctx.fill();
    safeCanvas.refresh();

    // 10-Viss Weight
    const wCanvas = this.textures.createCanvas('weight-10', 50, 50);
    const wctx = wCanvas.getContext();
    wctx.fillStyle = '#1e293b';
    wctx.beginPath();
    wctx.roundRect(4, 12, 42, 34, 6);
    wctx.fill();
    wctx.fillRect(18, 4, 14, 8);
    wctx.fillStyle = '#f8fafc';
    wctx.font = 'bold 13px Noto Sans Myanmar, Plus Jakarta Sans';
    wctx.fillText('၁၀', 15, 34);
    wCanvas.refresh();

    // Ancient Cable Winch Mechanism (Chapter 1 Machinarium Contraption)
    const winchCanvas = this.textures.createCanvas('winch-machine', 80, 90);
    const wnctx = winchCanvas.getContext();
    wnctx.fillStyle = '#334155';
    wnctx.fillRect(15, 30, 50, 55);
    wnctx.lineWidth = 3;
    wnctx.strokeStyle = '#1e293b';
    wnctx.strokeRect(15, 30, 50, 55);
    // Cable Spool
    wnctx.fillStyle = '#78350f';
    wnctx.beginPath();
    wnctx.arc(40, 48, 16, 0, Math.PI * 2);
    wnctx.fill();
    wnctx.strokeStyle = '#d97706';
    wnctx.lineWidth = 2;
    wnctx.stroke();
    // Cable wires
    wnctx.strokeStyle = '#94a3b8';
    wnctx.beginPath();
    wnctx.moveTo(40, 32);
    wnctx.lineTo(80, 20);
    wnctx.stroke();
    winchCanvas.refresh();

    // Canyon Chalk Diagram (Chapter 1 Mechanical Hint)
    const cdCanvas = this.textures.createCanvas('chalk-diagram', 140, 90);
    const cdctx = cdCanvas.getContext();
    cdctx.strokeStyle = '#e2e8f0';
    cdctx.lineWidth = 2;
    cdctx.setLineDash([4, 4]);
    // Draw bridge sketch & gear arrow
    cdctx.strokeRect(10, 20, 60, 40);
    cdctx.beginPath();
    cdctx.arc(40, 40, 12, 0, Math.PI * 2);
    cdctx.stroke();
    // Left secret tunnel hint arrow
    cdctx.setLineDash([]);
    cdctx.strokeStyle = '#facc15';
    cdctx.beginPath();
    cdctx.moveTo(110, 50);
    cdctx.lineTo(75, 50);
    cdctx.lineTo(85, 40);
    cdctx.moveTo(75, 50);
    cdctx.lineTo(85, 60);
    cdctx.stroke();
    cdCanvas.refresh();

    // Engineer's Parchment Note Overlay (Chapter 4 Clue)
    const noCanvas = this.textures.createCanvas('note-overlay', 380, 260);
    const noctx = noCanvas.getContext();
    noctx.fillStyle = '#fef3c7';
    noctx.beginPath();
    noctx.roundRect(10, 10, 360, 240, 14);
    noctx.fill();
    noctx.strokeStyle = '#b45309';
    noctx.lineWidth = 3;
    noctx.stroke();

    // Header
    noctx.fillStyle = '#78350f';
    noctx.font = 'bold 14px Noto Sans Myanmar, Plus Jakarta Sans';
    noctx.fillText('📜 အင်ဂျင်နီယာ၏ လျှို့ဝှက်ပုံကြမ်း (Secret Blueprint)', 30, 42);

    // Trap 1 Warning: 4-2-3 with Big Red X and Scissors
    noctx.strokeStyle = '#ef4444';
    noctx.lineWidth = 4;
    noctx.strokeRect(40, 65, 120, 90);
    noctx.beginPath();
    noctx.moveTo(40, 65);
    noctx.lineTo(160, 155);
    noctx.moveTo(160, 65);
    noctx.lineTo(40, 155);
    noctx.stroke();

    noctx.fillStyle = '#ef4444';
    noctx.font = 'bold 18px Plus Jakarta Sans';
    noctx.fillText('4 - 2 - 3', 68, 105);
    noctx.font = 'bold 12px Noto Sans Myanmar';
    noctx.fillText('⚠️ ထောင်ချောက် (TRAP!)', 48, 135);

    // True Solution Clue: Chili Pepper sneezing
    noctx.strokeStyle = '#15803d';
    noctx.lineWidth = 3;
    noctx.strokeRect(200, 65, 140, 90);

    noctx.fillStyle = '#dc2626';
    noctx.font = 'bold 24px sans-serif';
    noctx.fillText('🌶️ ➔ 🔑', 225, 105);
    noctx.fillStyle = '#15803d';
    noctx.font = 'bold 12px Noto Sans Myanmar';
    noctx.fillText('💨 အဟွတ်! ဟက်ချိုး!', 220, 135);

    // Footer advice
    noctx.fillStyle = '#451a03';
    noctx.font = '12px Noto Sans Myanmar';
    noctx.fillText('“သော့ခလောက်ပြုလုပ်သူသည် ငရုတ်သီးနှင့် ဓာတ်မတည့်ပါ”', 45, 195);
    noctx.fillStyle = '#94a3b8';
    noctx.font = '11px Plus Jakarta Sans';
    noctx.fillText('[ Click anywhere to close ]', 125, 230);
    noCanvas.refresh();
  }

  createParticlesAndVignette() {
    const steamG = this.make.graphics({ x: 0, y: 0, add: false });
    steamG.fillStyle(0xe2e8f0, 0.5);
    steamG.fillCircle(12, 12, 12);
    steamG.generateTexture('steam-puff', 24, 24);

    const vigCanvas = this.textures.createCanvas('screen-vignette', 512, 512);
    const vctx = vigCanvas.getContext();
    const vGrad = vctx.createRadialGradient(256, 256, 140, 256, 256, 256);
    vGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vGrad.addColorStop(0.75, 'rgba(12, 10, 8, 0.45)');
    vGrad.addColorStop(1, 'rgba(12, 10, 8, 0.9)');
    vctx.fillStyle = vGrad;
    vctx.fillRect(0, 0, 512, 512);
    vigCanvas.refresh();
  }
}
