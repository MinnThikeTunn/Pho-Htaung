import Phaser from 'phaser';
import { soundEngine } from '../utils/SoundEngine.js';
import { gameState } from '../utils/GameState.js';
import { MicroInteractions } from '../utils/MicroInteractions.js';

export default class VictoryScene extends Phaser.Scene {
  constructor() {
    super('VictoryScene');
  }

  create() {
    this.setupLayout();
    const resizeHandler = () => this.setupLayout();
    this.scale.on('resize', resizeHandler);
    this.events.once('shutdown', () => {
      this.scale.off('resize', resizeHandler);
    });
  }

  setupLayout() {
    const { width, height } = this.scale;

    if (this.mainContainer) this.mainContainer.destroy();
    this.mainContainer = this.add.container(0, 0);

    // 1. Warm Bagan atmospheric background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x271e17, 0x271e17, 0x0c0a08, 0x0c0a08, 1);
    bg.fillRect(0, 0, width, height);
    this.mainContainer.add(bg);

    // 2. Glowing golden temple light beams
    const beam = this.add.graphics();
    beam.fillStyle(0xf59e0b, 0.12);
    beam.fillTriangle(width / 2, 0, width / 2 - 380, height, width / 2 + 380, height);
    this.mainContainer.add(beam);

    // 3. Central Phoe Htaung Character Preview (Celebrating)
    const ph = this.add.image(width / 2, height / 2 - 10, 'ph-idle')
      .setScale(1.6)
      .setDepth(20);
    this.mainContainer.add(ph);

    // Subtle celebratory bounce
    this.tweens.add({
      targets: ph,
      y: ph.y - 12,
      duration: 650,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // 4. Perplexity Rounded-[32px] Victory Card Box
    const cardW = Math.min(540, width - 40);
    const cardH = 340;
    const card = this.add.graphics();
    card.fillStyle(0x14100c, 0.94);
    card.fillRoundedRect(width / 2 - cardW / 2, height / 2 - 190, cardW, cardH, 32);
    card.lineStyle(2, 0xd97706, 0.85);
    card.strokeRoundedRect(width / 2 - cardW / 2, height / 2 - 190, cardW, cardH, 32);
    this.mainContainer.add(card);

    // 5. Victory Headings
    const title = this.add.text(width / 2, height / 2 - 145, '🏆 ရွှေမြို့တော်သို့ ရောက်ရှိသွားပြီ!', {
      fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans, sans-serif',
      fontSize: 'clamp(20px, 3.5vw, 28px)',
      fontStyle: '900',
      color: '#fbbf24',
      letterSpacing: '1px'
    }).setOrigin(0.5);

    const subEng = this.add.text(width / 2, height / 2 - 115, 'BAGAN GOLDEN CITY UNLOCKED', {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: '12px',
      fontWeight: '800',
      color: '#a8a29e',
      letterSpacing: '2px'
    }).setOrigin(0.5);

    const desc = this.add.text(width / 2, height / 2 - 80, 'မောင်ဖိုးထောင်တစ်ယောက် ရတနာသိုက်ကြီးကို အောင်မြင်စွာ ရှာဖွေနိုင်ခဲ့ပါပြီ!', {
      fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans, sans-serif',
      fontSize: '13px',
      color: '#e7e5e4'
    }).setOrigin(0.5);

    const deaths = this.add.text(width / 2, height / 2 + 75, `💀 စုစုပေါင်း သေဆုံးမှု: ${gameState.getDeathCountBurmese()} ကြိမ်`, {
      fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans, sans-serif',
      fontSize: '15px',
      fontStyle: '900',
      color: '#f59e0b'
    }).setOrigin(0.5);

    this.mainContainer.add([title, subEng, desc, deaths]);

    // 6. Action Buttons Container
    const btnW = 220;
    const btnH = 46;

    // Play Again Button (Rich Amber)
    const playAgainBtn = this.add.container(width / 2 - 120, height / 2 + 195).setSize(btnW, btnH);
    const pBg = this.add.graphics();
    pBg.fillStyle(0xb45309, 1);
    pBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 23);
    pBg.lineStyle(2, 0xf59e0b, 0.95);
    pBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 23);

    const pText = this.add.text(0, 0, '★ အစမှ ပြန်ကစားမည်', {
      fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans, sans-serif',
      fontSize: '13px',
      fontStyle: '900',
      color: '#ffffff'
    }).setOrigin(0.5);

    playAgainBtn.add([pBg, pText]);
    playAgainBtn.setInteractive({ useHandCursor: true });
    MicroInteractions.makeInteractiveHover(playAgainBtn, 1.05);

    playAgainBtn.on('pointerdown', () => {
      soundEngine.playPickup();
      gameState.reset();
      this.cameras.main.fade(300, 12, 10, 8);
      this.time.delayedCall(300, () => {
        this.scene.start('Chapter1Scene');
      });
    });

    // Main Menu Button (Lacquer Charcoal)
    const menuBtn = this.add.container(width / 2 + 120, height / 2 + 195).setSize(btnW, btnH);
    const mBg = this.add.graphics();
    mBg.fillStyle(0x271e17, 1);
    mBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 23);
    mBg.lineStyle(1.8, 0xd97706, 0.85);
    mBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 23);

    const mText = this.add.text(0, 0, '🏠 ပင်မ မီနူး / MENU', {
      fontFamily: 'Noto Sans Myanmar, Plus Jakarta Sans, sans-serif',
      fontSize: '13px',
      fontStyle: '900',
      color: '#fef08a'
    }).setOrigin(0.5);

    menuBtn.add([mBg, mText]);
    menuBtn.setInteractive({ useHandCursor: true });
    MicroInteractions.makeInteractiveHover(menuBtn, 1.05);

    menuBtn.on('pointerdown', () => {
      soundEngine.playPickup();
      this.cameras.main.fade(300, 12, 10, 8);
      this.time.delayedCall(300, () => {
        this.scene.start('IntroScene');
      });
    });

    this.mainContainer.add([playAgainBtn, menuBtn]);

    // 7. Atmospheric Screen Edge Vignette
    const vignette = this.add.image(width / 2, height / 2, 'screen-vignette')
      .setDisplaySize(width, height)
      .setAlpha(0.65)
      .setDepth(50);
    this.mainContainer.add(vignette);

    // Keyboard Shortcuts
    this.input.keyboard.once('keydown-SPACE', () => playAgainBtn.emit('pointerdown'));
    this.input.keyboard.once('keydown-ENTER', () => playAgainBtn.emit('pointerdown'));
  }
}
