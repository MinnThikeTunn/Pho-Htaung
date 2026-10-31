// Ambient Atmosphere System for Phoe Htaung: The Lost Ancient Palace
// Implements Machinarium-style floating dust motes, cavern drips, and interactive hotspot reveals.

import Phaser from 'phaser';
import { soundEngine } from './SoundEngine.js';

export class AmbientAtmosphere {
  /**
   * Spawns floating golden dust motes that drift across light beams and cavern air.
   */
  static createDustMotes(scene, count = 22) {
    const width = scene.scale.width;
    const height = scene.scale.height;
    const container = scene.add.container(0, 0).setDepth(120);

    const motes = [];
    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(30, height - 80);
      const radius = Phaser.Math.FloatBetween(1.2, 2.8);
      const alpha = Phaser.Math.FloatBetween(0.15, 0.45);

      const circle = scene.add.circle(x, y, radius, 0xfde68a, alpha);
      container.add(circle);
      motes.push({
        sprite: circle,
        baseX: x,
        baseY: y,
        speedY: Phaser.Math.FloatBetween(0.15, 0.45),
        swaySpeed: Phaser.Math.FloatBetween(0.001, 0.0025),
        swayAmp: Phaser.Math.FloatBetween(12, 35),
        phase: Math.random() * Math.PI * 2
      });
    }

    // Gentle motion updater
    const timer = scene.time.addEvent({
      delay: 35,
      loop: true,
      callback: () => {
        const time = scene.time.now;
        for (const m of motes) {
          m.baseY -= m.speedY;
          if (m.baseY < -10) {
            m.baseY = height + 10;
            m.baseX = Phaser.Math.Between(0, width);
          }
          m.sprite.x = m.baseX + Math.sin(time * m.swaySpeed + m.phase) * m.swayAmp;
          m.sprite.y = m.baseY;
        }
      }
    });

    scene.events.once('shutdown', () => {
      timer.destroy();
      container.destroy();
    });

    return container;
  }

  /**
   * Starts subtle cavern water droplets with echoing audio and floor splash ripples.
   */
  static startCavernDrips(scene, groundY) {
    const width = scene.scale.width;

    const dripTimer = scene.time.addEvent({
      delay: Phaser.Math.Between(5500, 9500),
      loop: true,
      callback: () => {
        soundEngine.playCaveDrip();

        // Spawn a subtle floor splash ripple
        const dx = Phaser.Math.Between(width * 0.15, width * 0.85);
        const dy = groundY + Phaser.Math.Between(-8, 12);

        const ripple = scene.add.graphics().setDepth(25);
        ripple.lineStyle(1.2, 0x38bdf8, 0.5);
        ripple.strokeEllipse(dx, dy, 8, 4);

        scene.tweens.add({
          targets: ripple,
          scaleX: 2.5,
          scaleY: 2.2,
          alpha: 0,
          duration: 700,
          ease: 'Cubic.Out',
          onComplete: () => ripple.destroy()
        });
      }
    });

    scene.events.once('shutdown', () => {
      dripTimer.destroy();
    });
  }

  /**
   * Machinarium Hotspot Reveal: Pulses a glowing golden sketch ring around all interactive objects.
   * Triggered by Space / H key or HUD 💡 hint button.
   */
  static triggerHotspotPulse(scene, targets = []) {
    soundEngine.playHintChime();

    // Find all interactive game objects if none passed
    const activeTargets = targets.length > 0 
      ? targets 
      : scene.children.list.filter(c => c.input && c.input.enabled && c.visible && c.alpha > 0.1);

    for (const obj of activeTargets) {
      if (!obj || !obj.active) continue;

      // Extract bounds or position
      const bounds = typeof obj.getBounds === 'function' ? obj.getBounds() : null;
      const x = bounds ? bounds.centerX : obj.x;
      const y = bounds ? bounds.centerY : obj.y;
      const radius = bounds ? Math.max(24, Math.max(bounds.width, bounds.height) * 0.6) : 32;

      // Golden sketch hand-drawn marker ring
      const ring = scene.add.graphics().setDepth(280);
      ring.lineStyle(2.5, 0xf59e0b, 0.95);
      ring.strokeCircle(x, y, radius);
      ring.lineStyle(1.2, 0xfef08a, 0.8);
      ring.strokeCircle(x, y, radius + 4);

      // Micro-sparkle
      const sparkle = scene.add.text(x + radius * 0.7, y - radius * 0.7, '✨', {
        fontSize: '18px'
      }).setOrigin(0.5).setDepth(281);

      scene.tweens.add({
        targets: [ring, sparkle],
        scaleX: 1.25,
        scaleY: 1.25,
        alpha: { from: 1, to: 0 },
        duration: 1200,
        ease: 'Quad.Out',
        onComplete: () => {
          ring.destroy();
          sparkle.destroy();
        }
      });
    }
  }

  /**
   * Machinarium Weathered Parchment & Grunge Texture Overlay
   * Applies subtle paper grain, dust motes, and weathered vignette across the viewport.
   */
  static createWeatheredOverlay(scene) {
    const width = scene.scale.width;
    const height = scene.scale.height;

    const overlay = scene.add.container(0, 0).setDepth(240);

    // Subtle grunge grain mask
    const grain = scene.add.graphics();
    grain.fillStyle(0x0c0a08, 0.12);
    for (let i = 0; i < 90; i++) {
      const gx = Phaser.Math.Between(0, width);
      const gy = Phaser.Math.Between(0, height);
      const gw = Phaser.Math.Between(2, 6);
      const gh = Phaser.Math.Between(1, 3);
      grain.fillRect(gx, gy, gw, gh);
    }
    overlay.add(grain);

    // Warm golden-hour vignette edges
    const vignette = scene.add.graphics();
    vignette.fillStyle(0x27170a, 0.08);
    vignette.fillRect(0, 0, width, 24);
    vignette.fillRect(0, height - 24, width, 24);
    vignette.fillRect(0, 0, 24, height);
    vignette.fillRect(width - 24, 0, 24, height);
    overlay.add(vignette);

    scene.events.once('shutdown', () => {
      overlay.destroy();
    });

    return overlay;
  }

  /**
   * Layer 4: Dark Silhouette Foreground (Overhanging ancient temple archways & banyan vines)
   * Moves with subtle parallax to create authentic 2.5D depth.
   */
  static createForegroundSilhouettes(scene, style = 'canyon') {
    const width = scene.scale.width;
    const height = scene.scale.height;
    const fg = scene.add.graphics().setDepth(250);

    fg.fillStyle(0x080605, 0.96);

    if (style === 'canyon' || style === 'temple') {
      // Top-left jagged stone arch overhang
      fg.beginPath();
      fg.moveTo(0, 0);
      fg.lineTo(width * 0.28, 0);
      fg.lineTo(width * 0.22, 45);
      fg.lineTo(width * 0.16, 32);
      fg.lineTo(width * 0.08, 70);
      fg.lineTo(0, 95);
      fg.closePath();
      fg.fill();

      // Hanging ancient roots / vines from arch
      fg.lineStyle(2.5, 0x050403, 1);
      fg.beginPath();
      fg.moveTo(width * 0.08, 70);
      fg.lineTo(width * 0.09, 110);
      fg.lineTo(width * 0.07, 140);
      fg.moveTo(width * 0.16, 32);
      fg.lineTo(width * 0.15, 75);
      fg.lineTo(width * 0.17, 105);
      fg.stroke();

      // Top-right silhouette rock outcropping
      fg.beginPath();
      fg.moveTo(width, 0);
      fg.lineTo(width * 0.76, 0);
      fg.lineTo(width * 0.82, 38);
      fg.lineTo(width * 0.91, 26);
      fg.lineTo(width, 75);
      fg.closePath();
      fg.fill();
    }

    scene.events.once('shutdown', () => {
      fg.destroy();
    });

    return fg;
  }

  /**
   * Volumetric Golden-Hour Rays (နေခြည်အလင်းတန်းများ) cutting through ancient stone archways
   */
  static createVolumetricRays(scene, originX, originY) {
    const width = scene.scale.width;
    const height = scene.scale.height;

    const rays = scene.add.graphics().setDepth(15);
    const ox = originX !== undefined ? originX : width * 0.35;
    const oy = originY !== undefined ? originY : 0;

    rays.fillStyle(0xfbbf24, 0.05);
    rays.beginPath();
    rays.moveTo(ox, oy);
    rays.lineTo(ox - 90, height);
    rays.lineTo(ox + 40, height);
    rays.closePath();
    rays.fill();

    rays.beginPath();
    rays.moveTo(ox + 50, oy);
    rays.lineTo(ox + 60, height);
    rays.lineTo(ox + 180, height);
    rays.closePath();
    rays.fill();

    // Gentle opacity breathing tween
    scene.tweens.add({
      targets: rays,
      alpha: { from: 0.6, to: 1 },
      duration: 3800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });

    scene.events.once('shutdown', () => {
      rays.destroy();
    });

    return rays;
  }

  /**
   * Natural Signifiers: Specular glints and loose-tile wobbles to guide the eye
   * replacing explicit dashed boxes.
   */
  static startNaturalSignifiers(scene, glintTargets = []) {
    const timer = scene.time.addEvent({
      delay: 4200,
      loop: true,
      callback: () => {
        if (!glintTargets || glintTargets.length === 0) return;
        const target = glintTargets[Math.floor(Math.random() * glintTargets.length)];
        if (!target || !target.active || !target.visible) return;

        const bounds = typeof target.getBounds === 'function' ? target.getBounds() : null;
        const gx = bounds ? bounds.centerX : target.x;
        const gy = bounds ? bounds.centerY : target.y;

        // Specular glint star
        const glint = scene.add.text(gx, gy, '✦', {
          fontFamily: 'sans-serif',
          fontSize: '18px',
          color: '#fef08a'
        }).setOrigin(0.5).setDepth(260).setAlpha(0).setScale(0.4);

        scene.tweens.add({
          targets: glint,
          scale: 1.2,
          alpha: { from: 0, to: 0.9 },
          duration: 350,
          yoyo: true,
          ease: 'Sine.InOut',
          onComplete: () => glint.destroy()
        });
      }
    });

    scene.events.once('shutdown', () => {
      timer.destroy();
    });
  }
}
