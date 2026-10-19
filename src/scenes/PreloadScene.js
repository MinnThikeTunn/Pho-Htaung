import Phaser from 'phaser';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    const { width, height } = this.cameras.main;

    // Loading Bar Background
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x1e293b, 0.8);
    progressBox.fillRoundedRect(width / 2 - 160, height / 2 - 15, 320, 30, 15);

    // Dynamic Loading Bar Fill
    const progressBar = this.add.graphics();
    const loadingText = this.add.text(width / 2, height / 2 - 50, 'INITIALIZING GAME ENGINE...', {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: '18px',
      fontStyle: '900',
      color: '#22d3ee'
    }).setOrigin(0.5);

    const percentText = this.add.text(width / 2, height / 2 + 50, '0%', {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: '14px',
      fontWeight: '700',
      color: '#94a3b8'
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0x22d3ee, 1);
      progressBar.fillRoundedRect(width / 2 - 155, height / 2 - 10, 310 * value, 20, 10);
      percentText.setText(`${Math.floor(value * 100)}%`);
    });

    // Generate procedural game textures so game runs anywhere with zero asset latency
    this.createProceduralTextures();
  }

  createProceduralTextures() {
    // 1. Player Spaceship
    const shipGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    shipGraphics.fillStyle(0x0284c7, 1);
    shipGraphics.beginPath();
    shipGraphics.moveTo(32, 8);
    shipGraphics.lineTo(48, 44);
    shipGraphics.lineTo(32, 38);
    shipGraphics.lineTo(16, 44);
    shipGraphics.closePath();
    shipGraphics.fillPath();

    // Ship Cockpit & Wings
    shipGraphics.fillStyle(0x38bdf8, 1);
    shipGraphics.fillTriangle(32, 14, 38, 32, 26, 32);
    shipGraphics.fillStyle(0x22d3ee, 1);
    shipGraphics.fillCircle(32, 36, 4);
    shipGraphics.generateTexture('player', 64, 64);

    // 2. Laser Projectile
    const laserGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    laserGraphics.fillStyle(0x22d3ee, 1);
    laserGraphics.fillRoundedRect(2, 0, 4, 16, 2);
    laserGraphics.generateTexture('laser', 8, 16);

    // 3. Collectable Star Gem
    const starGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    starGraphics.fillStyle(0xfbbf24, 1);
    starGraphics.beginPath();
    const cx = 16, cy = 16, spikes = 5, outerRadius = 14, innerRadius = 7;
    let rot = (Math.PI / 2) * 3;
    let step = Math.PI / spikes;
    starGraphics.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      let x = cx + Math.cos(rot) * outerRadius;
      let y = cy + Math.sin(rot) * outerRadius;
      starGraphics.lineTo(x, y);
      rot += step;
      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      starGraphics.lineTo(x, y);
      rot += step;
    }
    starGraphics.lineTo(cx, cy - outerRadius);
    starGraphics.closePath();
    starGraphics.fillPath();

    starGraphics.fillStyle(0xfffbeb, 1);
    starGraphics.fillCircle(16, 16, 4);
    starGraphics.generateTexture('star', 32, 32);

    // 4. Asteroid / Hazard
    const rockGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    rockGraphics.fillStyle(0x64748b, 1);
    rockGraphics.fillCircle(24, 24, 20);
    rockGraphics.fillStyle(0x475569, 1);
    rockGraphics.fillCircle(18, 18, 6);
    rockGraphics.fillCircle(30, 26, 8);
    rockGraphics.fillCircle(20, 32, 5);
    rockGraphics.generateTexture('asteroid', 48, 48);

    // 5. Particle
    const particleGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    particleGraphics.fillStyle(0x38bdf8, 1);
    particleGraphics.fillCircle(4, 4, 4);
    particleGraphics.generateTexture('particle', 8, 8);
  }

  create() {
    this.time.delayedCall(400, () => {
      this.scene.start('MainMenuScene');
    });
  }
}
