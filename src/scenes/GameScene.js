import Phaser from 'phaser';
import { audioSynth } from '../utils/AudioSynth.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init() {
    this.score = 0;
    this.lives = 3;
    this.isGameOver = false;
    this.lastFired = 0;
  }

  create() {
    const { width, height } = this.cameras.main;

    // Background starfield
    this.createStarfield(width, height);

    // Physics Groups
    this.lasers = this.physics.add.group({
      defaultKey: 'laser',
      maxSize: 30
    });

    this.asteroids = this.physics.add.group();
    this.stars = this.physics.add.group();

    // Spawn Player
    this.player = this.physics.add.sprite(width / 2, height - 100, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setDrag(800);
    this.player.setMaxVelocity(400);

    // Particle Emitter for thrusters
    this.thrusterParticles = this.add.particles(0, 0, 'particle', {
      speed: { min: 20, max: 60 },
      angle: { min: 80, max: 100 },
      scale: { start: 0.6, end: 0 },
      blendMode: 'ADD',
      lifespan: 300,
      frequency: 25,
      follow: this.player,
      followOffset: { x: 0, y: 24 }
    });

    // Spawn Initial Collectables
    for (let i = 0; i < 5; i++) {
      this.spawnStar();
    }

    // Spawn Initial Asteroids
    for (let i = 0; i < 4; i++) {
      this.spawnAsteroid();
    }

    // Timed asteroid spawner
    this.asteroidTimer = this.time.addEvent({
      delay: 2000,
      callback: this.spawnAsteroid,
      callbackScope: this,
      loop: true
    });

    // Input Setup
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.muteKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);

    this.pauseKey.on('down', () => {
      this.scene.pause();
      this.scene.launch('PauseScene');
    });

    this.muteKey.on('down', () => {
      const isMuted = audioSynth.toggleMute();
      this.hudMute.setText(isMuted ? 'AUDIO: MUTED' : 'AUDIO: ON');
    });

    // Mobile / Mouse Pointer Down to Shoot
    this.input.on('pointerdown', (pointer) => {
      this.fireLaser();
    });

    // Collisions and Overlaps
    this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this);
    this.physics.add.overlap(this.lasers, this.asteroids, this.hitAsteroid, null, this);
    this.physics.add.overlap(this.player, this.asteroids, this.playerHit, null, this);

    // Sleek Modern HUD
    this.createHUD(width);
  }

  createHUD(width) {
    this.hudScore = this.add.text(24, 24, 'SCORE: 0', {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: '20px',
      fontStyle: '900',
      color: '#ffffff'
    });

    this.hudLives = this.add.text(width - 24, 24, 'LIVES: ❤️❤️❤️', {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: '18px',
      fontWeight: '800',
      color: '#f43f5e'
    }).setOrigin(1, 0);

    this.hudMute = this.add.text(width / 2, 24, 'AUDIO: ON [M]', {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: '14px',
      fontWeight: '700',
      color: '#64748b'
    }).setOrigin(0.5, 0);
  }

  spawnStar() {
    const { width, height } = this.cameras.main;
    const x = Phaser.Math.Between(40, width - 40);
    const y = Phaser.Math.Between(60, height - 180);
    const star = this.stars.create(x, y, 'star');
    star.body.setAllowGravity(false);

    // Subtle gentle float animation
    this.tweens.add({
      targets: star,
      y: y + Phaser.Math.Between(-15, 15),
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  spawnAsteroid() {
    if (this.asteroids.getChildren().length > 10) return;
    const { width } = this.cameras.main;
    const x = Phaser.Math.Between(30, width - 30);
    const asteroid = this.asteroids.create(x, -30, 'asteroid');
    asteroid.setVelocity(Phaser.Math.Between(-60, 60), Phaser.Math.Between(100, 220));
    asteroid.setAngularVelocity(Phaser.Math.Between(-120, 120));
  }

  fireLaser() {
    const time = this.time.now;
    if (time - this.lastFired < 200) return;
    this.lastFired = time;

    const laser = this.lasers.get(this.player.x, this.player.y - 20);
    if (laser) {
      laser.setActive(true);
      laser.setVisible(true);
      laser.body.velocity.y = -650;
      audioSynth.playShoot();
    }
  }

  collectStar(player, star) {
    star.destroy();
    this.score += 100;
    this.hudScore.setText(`SCORE: ${this.score}`);
    audioSynth.playCollect();

    // Pop animation on score text
    this.tweens.add({
      targets: this.hudScore,
      scale: 1.2,
      duration: 80,
      yoyo: true
    });

    // Spawn replacement star
    this.time.delayedCall(800, () => this.spawnStar());
  }

  hitAsteroid(laser, asteroid) {
    laser.destroy();

    // Explosion particle burst
    const emitter = this.add.particles(asteroid.x, asteroid.y, 'particle', {
      speed: { min: 60, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      lifespan: 400,
      maxParticles: 14
    });
    this.time.delayedCall(450, () => emitter.destroy());

    asteroid.destroy();
    this.score += 250;
    this.hudScore.setText(`SCORE: ${this.score}`);
    audioSynth.playExplosion();
  }

  playerHit(player, asteroid) {
    asteroid.destroy();
    this.lives -= 1;
    audioSynth.playHit();

    // Camera shake effect
    this.cameras.main.shake(200, 0.02);

    let hearts = '';
    for (let i = 0; i < this.lives; i++) hearts += '❤️';
    this.hudLives.setText(`LIVES: ${hearts || '💀'}`);

    if (this.lives <= 0 && !this.isGameOver) {
      this.isGameOver = true;
      audioSynth.playGameOver();
      this.cameras.main.fade(400, 11, 15, 23);
      this.time.delayedCall(400, () => {
        this.scene.start('GameOverScene', { score: this.score });
      });
    }
  }

  createStarfield(width, height) {
    this.bgStars = [];
    for (let i = 0; i < 60; i++) {
      const star = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.FloatBetween(1, 2),
        0xffffff,
        Phaser.Math.FloatBetween(0.2, 0.7)
      );
      star.speed = Phaser.Math.FloatBetween(0.5, 2);
      this.bgStars.push(star);
    }
  }

  update() {
    if (this.isGameOver) return;

    const { width, height } = this.cameras.main;

    // Background parallax scroll
    for (const star of this.bgStars) {
      star.y += star.speed;
      if (star.y > height) {
        star.y = 0;
        star.x = Phaser.Math.Between(0, width);
      }
    }

    // Clean up out-of-bounds lasers
    this.lasers.children.each((laser) => {
      if (laser.active && laser.y < -20) {
        laser.destroy();
      }
    });

    // Clean up out-of-bounds asteroids
    this.asteroids.children.each((asteroid) => {
      if (asteroid.active && asteroid.y > height + 40) {
        asteroid.destroy();
      }
    });

    // Keyboard Movement
    const speed = 320;
    let vx = 0;
    let vy = 0;

    if (this.cursors.left.isDown || this.wasd.A.isDown) vx -= speed;
    if (this.cursors.right.isDown || this.wasd.D.isDown) vx += speed;
    if (this.cursors.up.isDown || this.wasd.W.isDown) vy -= speed;
    if (this.cursors.down.isDown || this.wasd.S.isDown) vy += speed;

    // Mobile / Touch Pointer Steering
    if (this.input.activePointer.isDown) {
      const targetX = this.input.activePointer.x;
      const targetY = this.input.activePointer.y;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, targetX, targetY);
      if (dist > 15) {
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, targetX, targetY);
        vx = Math.cos(angle) * speed;
        vy = Math.sin(angle) * speed;
      }
    }

    this.player.setVelocity(vx, vy);

    // Fire laser with Space
    if (this.spaceKey.isDown) {
      this.fireLaser();
    }
  }
}
