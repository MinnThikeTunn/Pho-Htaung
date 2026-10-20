import Phaser from 'phaser';
import SubtitleBox from '../ui/SubtitleBox.js';
import { gameState, toBurmeseNumeral } from '../utils/GameState.js';
import { soundEngine } from '../utils/SoundEngine.js';
import { AmbientAtmosphere } from '../utils/AmbientAtmosphere.js';
import { MicroInteractions } from '../utils/MicroInteractions.js';

export default class RevealScene extends Phaser.Scene {
  constructor() {
    super('RevealScene');
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    this.dodgeCount = 0;
    this.canClickButton = false;

    // 1. Dilapidated Cowshed / Scrap Warehouse Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x191410, 0x191410, 0x0a0806, 0x0a0806, 1);
    bg.fillRect(0, 0, width, height);

    gameState.setCurrentScene('RevealScene');
    this.createCowshedScenery(width, height);
    AmbientAtmosphere.createDustMotes(this, 30);

    // 2. Cardboard "Golden Palace" Props in the Center
    this.createCardboardPalaceProps(width / 2, height / 2 + 30);

    // 3. Subtitle Box
    this.subtitle = new SubtitleBox(this);

    // 4. Initial Camera setup for Zoom-Out Reveal
    this.cameras.main.setZoom(1.3);
    this.cameras.main.pan(width / 2, height / 2 + 40, 0);

    // Zoom-out animation revealing the cardboard cowshed
    this.time.delayedCall(400, () => {
      this.cameras.main.zoomTo(1.0, 1800, 'Cubic.InOut');
      this.cameras.main.pan(width / 2, height / 2, 1800, 'Cubic.InOut');

      // 5. U Gyi enters from the right puffing his cheroot
      this.time.delayedCall(1900, () => {
        soundEngine.startBGM();
        this.enterUGyi(width, height);
      });
    });

    // Reset keyboard shortcut: R key
    this.rKey = this.input.keyboard.addKey('R');
    this.rKey.on('down', () => {
      this.restartGame();
    });
  }

  createCowshedScenery(width, height) {
    const decor = this.add.graphics();

    // 1. Weathered Barn Timber Walls & Galvanized Corrugated Tin Roofing
    decor.fillStyle(0x1c1510, 0.98);
    decor.fillRect(0, 0, width, height - 60);

    // Corrugated galvanized roof panels with rust spots
    decor.fillStyle(0x334155, 0.9);
    decor.fillRect(0, 0, width, 40);
    decor.lineStyle(2, 0x1e293b, 0.8);
    for (let rx = 0; rx < width; rx += 14) {
      decor.lineBetween(rx, 0, rx, 40);
      if (rx % 42 === 0) {
        decor.fillStyle(0x78350f, 0.8); // rust streaks on tin roof
        decor.fillRect(rx - 2, 8, 5, 24);
      }
    }

    // Heavy Rustic Timber Barn Trusses & Cross-Beams
    decor.lineStyle(7, 0x451a03, 1);
    for (let x = 40; x < width; x += 190) {
      decor.lineBetween(x, 40, x + 95, 135);
      decor.lineBetween(x + 95, 135, x + 190, 40);
      decor.lineBetween(x + 95, 135, x + 95, height - 120);
      // Horizontal cross-tie beam
      decor.lineBetween(x + 35, 95, x + 155, 95);

      // Iron bracket plates & bolts at timber joints
      decor.fillStyle(0x1e293b, 1);
      decor.fillRect(x + 87, 127, 16, 16);
      decor.fillStyle(0x94a3b8, 1);
      decor.fillCircle(x + 91, 131, 2);
      decor.fillCircle(x + 99, 139, 2);
    }

    // 2. Dramatic Morning Sunbeams Streaming Through Tin Roof Holes
    const sunbeams = this.add.graphics().setDepth(2);
    sunbeams.fillStyle(0xfef08a, 0.08);
    sunbeams.beginPath();
    sunbeams.moveTo(width * 0.25, 40);
    sunbeams.lineTo(width * 0.1, height - 60);
    sunbeams.lineTo(width * 0.35, height - 60);
    sunbeams.closePath();
    sunbeams.fill();

    sunbeams.beginPath();
    sunbeams.moveTo(width * 0.72, 40);
    sunbeams.lineTo(width * 0.55, height - 60);
    sunbeams.lineTo(width * 0.85, height - 60);
    sunbeams.closePath();
    sunbeams.fill();

    // 3. Hay Bales & Trampled Straw Bedding
    // Straw floor scatter
    decor.fillStyle(0xa16207, 0.4);
    for (let sx = 10; sx < width; sx += 20) {
      decor.fillRect(sx, height - 70, 14, 3);
      decor.fillRect(sx + 5, height - 66, 10, 2);
    }

    // Stacked textured hay bales in corner
    decor.fillStyle(0xca8a04, 0.9);
    decor.fillRoundedRect(35, height - 200, 110, 65, 8);
    decor.lineStyle(2, 0xa16207, 1);
    decor.strokeRoundedRect(35, height - 200, 110, 65, 8);

    decor.fillStyle(0xeab308, 0.95);
    decor.fillRoundedRect(55, height - 250, 90, 55, 8);
    decor.strokeRoundedRect(55, height - 250, 90, 55, 8);

    // Hay binding twine ropes
    decor.strokeStyle = '#78350f';
    decor.lineWidth = 1.5;
    decor.beginPath();
    decor.moveTo(70, height - 200); decor.lineTo(70, height - 135);
    decor.moveTo(110, height - 200); decor.lineTo(110, height - 135);
    decor.moveTo(85, height - 250); decor.lineTo(85, height - 195);
    decor.stroke();

    // 4. Old Weathered Cow Feeding Trough & Scrap Piles
    decor.fillStyle(0x3e2314, 1);
    decor.fillRect(width - 240, height - 170, 160, 55);
    decor.lineStyle(2, 0x1f1008, 1);
    decor.strokeRect(width - 240, height - 170, 160, 55);

    // Cobwebs in top corner
    decor.strokeStyle = 'rgba(241, 245, 249, 0.35)';
    decor.lineWidth = 1;
    decor.beginPath();
    decor.moveTo(0, 40); decor.lineTo(70, 110);
    decor.moveTo(0, 75); decor.lineTo(45, 40);
    decor.moveTo(0, 110); decor.lineTo(110, 40);
    decor.stroke();

    // Ground line
    const ground = this.add.rectangle(width / 2, height - 60, width, 120, 0x140f0c);
    this.physics.add.existing(ground, true);

    // Barn Sign & Vector Icon
    this.add.image(56, 38, 'icon-barn').setScale(0.55).setAlpha(0.85).setDepth(10);
    this.add.text(90, 30, '🏚️ ဦးကြီး၏ သံတိုသံစ နွားတင်းကုတ်ဂိုဒေါင် (Old Cowshed Warehouse)', {
      fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#d97706'
    }).setDepth(10);
  }

  createCardboardPalaceProps(x, y) {
    this.cardboardContainer = this.add.container(x, y).setDepth(15);

    // Rough 2x4 Timber Kickstand Struts holding up the cardboard
    const stands = this.add.graphics();
    stands.fillStyle(0x78350f, 1);
    stands.fillRect(-175, 25, 16, 75);
    stands.fillRect(160, 25, 16, 75);
    stands.lineStyle(2, 0x451a03, 1);
    stands.strokeRect(-175, 25, 16, 75);
    stands.strokeRect(160, 25, 16, 75);

    // Diagonal wooden supports
    stands.lineStyle(4, 0x572814, 1);
    stands.lineBetween(-167, 30, -195, 100);
    stands.lineBetween(168, 30, 195, 100);

    // Fake Cardboard Palace Arch Cutout (Corrugated edges & brown packing tape)
    const cardArch = this.add.graphics();
    // Corrugated cardboard brown body
    cardArch.fillStyle(0xb45309, 1);
    cardArch.fillRoundedRect(-180, -125, 360, 185, 14);
    cardArch.lineStyle(3, 0x92400e, 1);
    cardArch.strokeRoundedRect(-180, -125, 360, 185, 14);

    // Fluted corrugated texture on edge
    cardArch.lineStyle(1, 0x78350f, 0.7);
    for (let cx = -175; cx < 175; cx += 8) {
      cardArch.lineBetween(cx, -125, cx, -118);
    }

    // Crude Yellow Poster Spray-Paint with dripping edges
    cardArch.fillStyle(0xfde047, 0.85);
    cardArch.fillRoundedRect(-160, -105, 320, 145, 10);
    // Spray paint drips
    cardArch.fillRect(-80, 40, 8, 16);
    cardArch.fillRect(60, 40, 6, 22);

    // Brown parcel packing tape strips criss-crossing corners
    cardArch.fillStyle(0xd97706, 0.9);
    cardArch.fillRect(-175, -120, 45, 14);
    cardArch.fillRect(130, -120, 45, 14);

    // "FAKE GOLDEN CITY" Burmese label taped on
    const fakeLabel = this.add.text(0, -60, '📦 [ ရွှေမြို့တော် စက္ကူကတ်ထူပြား ပုံစံတူ ] 📦\n(Cardboard Movie Prop)', {
      fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#78350f',
      align: 'center'
    }).setOrigin(0.5);

    // Smashed Phoe Htaung under the "VICTORY!" foam block
    const smashedPH = this.add.image(-40, 65, 'ph-flat').setScale(0.85);
    const vicBlock = this.add.image(-40, 50, 'victory-block').setScale(0.7);

    this.cardboardContainer.add([stands, cardArch, fakeLabel, smashedPH, vicBlock]);
  }

  enterUGyi(width, height) {
    const groundY = height - 120;
    this.ugyi = this.add.sprite(width + 80, groundY - 48, 'ugyi-standing').setDepth(25);

    // Smoke puffs from cheroot
    this.smokeTimer = this.time.addEvent({
      delay: 500,
      callback: () => {
        if (!this.ugyi) return;
        const puff = this.add.circle(this.ugyi.x + 20, this.ugyi.y - 18, 5, 0xe2e8f0, 0.6).setDepth(26);
        this.tweens.add({
          targets: puff,
          y: puff.y - 30,
          x: puff.x + Phaser.Math.Between(-10, 10),
          alpha: 0,
          scale: 2,
          duration: 900,
          onComplete: () => puff.destroy()
        });
      },
      loop: true
    });

    // U Gyi walks in to width * 0.75
    this.tweens.add({
      targets: this.ugyi,
      x: width * 0.72,
      duration: 1200,
      ease: 'Quad.Out',
      onComplete: () => {
        this.playRevealDialogue();
      }
    });
  }

  playRevealDialogue() {
    const deathsBurmese = toBurmeseNumeral(gameState.getDeathCount());

    const dialogueText = `ဟဲဟဲဟဲ... မင်း ထင်နေတာက ရွှေမြို့တော်ကို မင်း ပထမဆုံး ရောက်လာတယ်ပေါ့လေ?
အမှန်တော့ ဒီနေရာက ငါ အရင်တစ်ခေါက် လာတုန်းက သေသွားတဲ့ကောင်တွေဆီက ပစ္စည်းတွေကို လာစုထားတဲ့ ငါ့ဂိုဒေါင်ဟောင်းကြီးကွဲ့!
မင်း ${deathsBurmese} ခါ သေသွားတော့ မင်းဆီက ကျန်ခဲ့တဲ့ ဓားမရယ်၊ လွယ်အိတ်စုတ်ရယ်၊ ဖိနပ်တစ်ဖက်ရယ်ကို ငါ သံတိုသံစဆိုင် သွားရောင်းရင်တောင် ဆေးပေါ့လိပ် ၅ လိပ်ဖိုး ရပြီဗျာ!
ကဲ... ဒီဂိမ်းကို ထိုင်ဆော့နေတဲ့ ကစားသမားလေးလည်း ခေါင်းမီးတောက်ပြီး သွေးတက်နေလောက်ပြီ။ သွား... သွား... ရေခဲရေလေး သောက်ပြီး ခေါင်းအေးအောင် သွားလုပ်ပေတော့! ဟားဟားဟား!`;

    this.subtitle.say(dialogueText, () => {
      this.time.delayedCall(800, () => {
        this.showGameOverScreen();
      });
    });
  }

  showGameOverScreen() {
    const width = this.scale.width;
    const height = this.scale.height;

    // Dim background overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7).setDepth(200);

    // Modern High-End Stats Card (Perplexity Aesthetic: rounded-32px, font-black headings)
    const card = this.add.container(width / 2, height / 2 - 40).setDepth(210);

    const cardBg = this.add.graphics();
    cardBg.fillStyle(0x14100c, 0.98);
    cardBg.fillRoundedRect(-240, -150, 480, 300, 32);
    cardBg.lineStyle(2, 0xd97706, 0.8);
    cardBg.strokeRoundedRect(-240, -150, 480, 300, 32);
    card.add(cardBg);

    const title = this.add.text(0, -100, '💀 GAME OVER 💀', {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '28px',
      fontStyle: '900',
      color: '#ef4444',
      letterSpacing: '2px'
    }).setOrigin(0.5);
    card.add(title);

    const sub = this.add.text(0, -60, 'ငကြောင်ဖိုးထောင် ရွှေမြို့တော်ရှာပုံတော် ပြီးဆုံးပါပြီ', {
      fontFamily: 'Noto Sans Myanmar',
      fontSize: '14px',
      color: '#a8a29e'
    }).setOrigin(0.5);
    card.add(sub);

    // Stats Grid
    const statsText = this.add.text(0, 10,
      `• စုစုပေါင်း သေဆုံးမှု: ${gameState.getDeathCountBurmese()} ကြိမ်\n• ဆုံးရှုံးသွားသော ဦးနှောက် IQ: ၉၉.၉%\n• ဦးကြီး ရရှိသွားသော ဆေးပေါ့လိပ်: ၅ လိပ်\n• ကစားသမား အခြေအနေ: သွေးတိုး / ခေါင်းမီးတောက်`, {
      fontFamily: 'Noto Sans Myanmar, Pyidaungsu, Plus Jakarta Sans',
      fontSize: '14px',
      color: '#fef08a',
      align: 'center',
      lineSpacing: 10
    }).setOrigin(0.5);
    card.add(statsText);

    // Hint for restart
    const hintText = this.add.text(0, 110, '💡 အကြံပြုချက်: [R] ခလုတ်ကို နှိပ်ပြီး ချက်ချင်း ပြန်ကစားနိုင်သည်', {
      fontFamily: 'Noto Sans Myanmar',
      fontSize: '11px',
      color: '#94a3b8'
    }).setOrigin(0.5);
    card.add(hintText);

    // Evasive [ Play Again / ပြန်ကစားမည် ] Button
    this.createEvasiveButton(width, height);
  }

  createEvasiveButton(width, height) {
    this.btnContainer = this.add.container(width / 2, height / 2 + 150).setDepth(250);

    this.btnBg = this.add.graphics();
    this.drawButtonShape(0x22c55e, 0x16a34a);
    this.btnContainer.add(this.btnBg);

    this.btnLabel = this.add.text(0, 0, '🔄 ပြန်ကစားမည် (Play Again)', {
      fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans',
      fontSize: '15px',
      fontStyle: '900',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.btnContainer.add(this.btnLabel);

    this.btnContainer.setSize(240, 52);
    this.btnContainer.setInteractive({ useHandCursor: true });

    this.btnContainer.on('pointerdown', () => {
      this.restartGame();
    });

    // Pointer move evasion logic
    this.input.on('pointermove', (pointer) => {
      if (this.canClickButton) return;

      const bx = this.btnContainer.x;
      const by = this.btnContainer.y;
      const dist = Phaser.Math.Distance.Between(pointer.x, pointer.y, bx, by);

      if (dist < 100) {
        this.dodgeButton(pointer.x, pointer.y, width, height);
      }
    });
  }

  drawButtonShape(fillColor, strokeColor) {
    this.btnBg.clear();
    this.btnBg.fillStyle(fillColor, 1);
    this.btnBg.fillRoundedRect(-120, -26, 240, 52, 26);
    this.btnBg.lineStyle(2, strokeColor, 1);
    this.btnBg.strokeRoundedRect(-120, -26, 240, 52, 26);
  }

  dodgeButton(mx, my, width, height) {
    this.dodgeCount++;
    soundEngine.playVoiceBlip();

    const trollTaunts = [
      'မမိပါဘူးကွာ!',
      'သွားအိပ်တော့!',
      'ဟားဟားဟား!',
      'ဘယ်လိုက်နိုင်မလဲ!',
      'လက်သွက်တယ် ထင်နေလား!',
      'ခေါင်းအေးအောင် အရင်လုပ်ပါ!',
      'ရေခဲရေ သွားသောက်!',
      'ဖမ်းမရဘူးဟေ့!'
    ];
    const taunt = trollTaunts[Phaser.Math.Between(0, trollTaunts.length - 1)];

    // Show floating troll taunt at previous location
    const tauntText = this.add.text(this.btnContainer.x, this.btnContainer.y - 20, taunt, {
      fontFamily: 'Noto Sans Myanmar',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#f87171'
    }).setOrigin(0.5).setDepth(260);

    this.tweens.add({
      targets: tauntText,
      y: tauntText.y - 40,
      alpha: 0,
      duration: 800,
      onComplete: () => tauntText.destroy()
    });

    // Find new position with distance >= 200px from mouse
    let newX, newY, newDist;
    let attempts = 0;
    do {
      newX = Phaser.Math.Between(160, width - 160);
      newY = Phaser.Math.Between(100, height - 100);
      newDist = Phaser.Math.Distance.Between(mx, my, newX, newY);
      attempts++;
    } while (newDist < 200 && attempts < 20);

    // Reposition with snappy animation
    this.tweens.add({
      targets: this.btnContainer,
      x: newX,
      y: newY,
      duration: 120,
      ease: 'Back.Out'
    });

    // After 10 dodges, button gets tired and allows clicking!
    if (this.dodgeCount >= 10 && !this.canClickButton) {
      this.canClickButton = true;
      this.btnLabel.setText('😴 မောသွားပြီ... နှိပ်တော့!');
      this.drawButtonShape(0xef4444, 0xb91c1c);
    }
  }

  restartGame() {
    soundEngine.playPickup();
    gameState.reset();
    this.cameras.main.fade(400, 12, 10, 8);
    this.time.delayedCall(400, () => {
      this.scene.start('IntroScene');
    });
  }
}
