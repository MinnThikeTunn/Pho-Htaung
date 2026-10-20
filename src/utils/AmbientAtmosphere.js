// Ambient Atmosphere System for Phoe Htaung: The Lost City of Bagan
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
}
