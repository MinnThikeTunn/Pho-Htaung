import Phaser from 'phaser';
import { soundEngine } from './SoundEngine.js';

export class MicroInteractions {
  /**
   * Spawns an animated Machinarium-style golden click marker ripple on the ground
   */
  static spawnClickMarker(scene, x, y) {
    soundEngine.playPing();

    const marker = scene.add.container(x, y).setDepth(180);

    const ring = scene.add.graphics();
    ring.lineStyle(2, 0xf59e0b, 0.9);
    ring.strokeCircle(0, 0, 16);

    // Crosshair ticks
    ring.lineStyle(2, 0xfef08a, 0.95);
    ring.lineBetween(-10, 0, -3, 0);
    ring.lineBetween(3, 0, 10, 0);
    ring.lineBetween(0, -10, 0, -3);
    ring.lineBetween(0, 3, 0, 10);

    // Center dot
    const dot = scene.add.circle(0, 0, 2.5, 0xf59e0b, 1);

    marker.add([ring, dot]);
    marker.setScale(0.3);

    scene.tweens.add({
      targets: marker,
      scale: 1.3,
      alpha: 0,
      duration: 380,
      ease: 'Quad.Out',
      onComplete: () => marker.destroy()
    });
  }

  /**
   * Spawns a tiny footstep dust puff behind the walking foot
   */
  static spawnFootstepDust(scene, x, y, direction = 1) {
    const dust = scene.add.circle(x - direction * 14, y + 36, 4, 0xd4a373, 0.45).setDepth(18);

    scene.tweens.add({
      targets: dust,
      x: dust.x - direction * 8,
      y: dust.y - 6,
      scale: 1.8,
      alpha: 0,
      duration: 260,
      ease: 'Quad.Out',
      onComplete: () => dust.destroy()
    });
  }

  /**
   * Machinarium Parabolic Item Arc into Phoe Htaung's Shan Shoulder Bag
   */
  static pickupItemToBag(scene, itemSprite, player, onBagged) {
    soundEngine.playWoosh();

    // Disable physics / hitzone immediately
    if (itemSprite.body) itemSprite.body.enable = false;
    itemSprite.disableInteractive();
    itemSprite.setDepth(200);

    const startX = itemSprite.x;
    const startY = itemSprite.y;
    const bagTargetX = player.x - 8 * Math.sign(player.scaleX || 1);
    const bagTargetY = player.y + 6;

    // Peak height above both points
    const peakY = Math.min(startY, bagTargetY) - 50;

    const dummy = { t: 0 };
    scene.tweens.add({
      targets: dummy,
      t: 1,
      duration: 480,
      ease: 'Cubic.InOut',
      onUpdate: () => {
        const t = dummy.t;
        // Parabolic Bezier curve interpolation
        itemSprite.x = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * ((startX + bagTargetX) / 2) + t * t * bagTargetX;
        itemSprite.y = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * peakY + t * t * bagTargetY;
        itemSprite.angle = t * 360;
        itemSprite.scale = Phaser.Math.Linear(1.1, 0.2, t);
      },
      onComplete: () => {
        // Star sparkle burst at bag opening
        MicroInteractions.spawnBagSparkle(scene, bagTargetX, bagTargetY);
        soundEngine.playPickup();
        soundEngine.playBagRustle();

        // Phoe Htaung proud squish reaction
        scene.tweens.add({
          targets: player,
          scaleY: 1.08,
          scaleX: (player.scaleX > 0 ? 1 : -1) * 0.94,
          duration: 120,
          yoyo: true,
          ease: 'Back.Out'
        });

        itemSprite.destroy();
        if (onBagged) onBagged();
      }
    });
  }

  /**
   * Sparkle burst at bag opening when item enters
   */
  static spawnBagSparkle(scene, x, y) {
    const star = scene.add.text(x, y - 10, '✨', {
      fontSize: '18px'
    }).setOrigin(0.5).setDepth(220);

    scene.tweens.add({
      targets: star,
      y: y - 26,
      scale: 1.4,
      alpha: 0,
      duration: 450,
      ease: 'Quad.Out',
      onComplete: () => star.destroy()
    });
  }

  /**
   * Denial interaction when clicking locked or impossible mechanisms
   */
  static triggerDenial(scene, targetObject, player, message, hintItemKey, thought, subtitle) {
    soundEngine.playDenial();

    // Rattle / shake target object
    if (targetObject) {
      const origX = targetObject.x;
      scene.tweens.add({
        targets: targetObject,
        x: origX + 6,
        duration: 45,
        yoyo: true,
        repeat: 4,
        onComplete: () => {
          targetObject.x = origX;
        }
      });
    }

    // Phoe Htaung shakes head with sweat drop
    if (player) {
      const origAngle = player.angle || 0;
      scene.tweens.add({
        targets: player,
        angle: origAngle + 7,
        duration: 60,
        yoyo: true,
        repeat: 3,
        onComplete: () => {
          player.angle = origAngle;
        }
      });

      // Sweat drop popping out
      const sweat = scene.add.text(player.x + 16, player.y - 28, '💦', {
        fontSize: '15px'
      }).setDepth(210);

      scene.tweens.add({
        targets: sweat,
        y: player.y - 44,
        alpha: 0,
        scale: 1.3,
        duration: 500,
        ease: 'Quad.Out',
        onComplete: () => sweat.destroy()
      });
    }

    // Show Machinarium Thought Bubble with requested item
    if (thought && hintItemKey && player) {
      thought.show(player.x, player.y, hintItemKey);
    }

    // Subtitle reaction
    if (subtitle && message) {
      subtitle.say(message);
    }
  }

  /**
   * Adds interactive hover scale and pointer cursor to GameObjects
   */
  static makeInteractiveHover(gameObject, hoverScale = 1.08) {
    gameObject.setInteractive({ useHandCursor: true });
    const origScaleX = gameObject.scaleX;
    const origScaleY = gameObject.scaleY;

    gameObject.on('pointerover', () => {
      gameObject.scene.tweens.add({
        targets: gameObject,
        scaleX: origScaleX * hoverScale,
        scaleY: origScaleY * hoverScale,
        duration: 160,
        ease: 'Quad.Out'
      });
    });

    gameObject.on('pointerout', () => {
      gameObject.scene.tweens.add({
        targets: gameObject,
        scaleX: origScaleX,
        scaleY: origScaleY,
        duration: 160,
        ease: 'Quad.Out'
      });
    });
  }

  /**
   * Spontaneous slapstick idle micro-behavior (Betel spitting, bag shake, cheek pulse)
   */
  static triggerIdleAction(scene, player, groundY) {
    if (!player || !player.active) return;
    const currentTexture = player.texture?.key;
    if (currentTexture !== 'ph-idle') return;

    const action = Phaser.Math.Between(1, 3);

    if (action === 1) {
      // 1. Betel Nut Spit ("Ptooey!")
      soundEngine.playSpit();

      // Duck anticipation
      scene.tweens.add({
        targets: player,
        scaleY: 0.92,
        duration: 120,
        yoyo: true,
        onYoyo: () => {
          // Spit red droplet in arc
          const dir = Math.sign(player.scaleX || 1);
          const spitX = player.x + dir * 18;
          const spitY = player.y - 12;
          const spit = scene.add.circle(spitX, spitY, 2.5, 0xb91c1c).setDepth(25);

          const targetLandX = player.x + dir * 36;
          const targetLandY = groundY ? groundY - 2 : player.y + 38;

          scene.tweens.add({
            targets: spit,
            x: targetLandX,
            y: targetLandY,
            duration: 220,
            ease: 'Quad.In',
            onComplete: () => {
              spit.destroy();

              // Tiny red splat on the ground that fades
              const splat = scene.add.ellipse(targetLandX, targetLandY, 7, 3, 0x991b1b, 0.85).setDepth(4);
              scene.tweens.add({
                targets: splat,
                alpha: 0,
                duration: 4000,
                ease: 'Linear',
                onComplete: () => splat.destroy()
              });
            }
          });
        }
      });

    } else if (action === 2) {
      // 2. Shan bag rustle & shoulder shrug
      soundEngine.playBagRustle();
      scene.tweens.add({
        targets: player,
        angle: 4,
        scaleY: 1.05,
        duration: 140,
        yoyo: true,
        repeat: 1,
        ease: 'Sine.easeInOut'
      });

    } else {
      // 3. Quick 3-beat cheek pulse
      scene.tweens.add({
        targets: player,
        scaleY: 1.04,
        duration: 100,
        yoyo: true,
        repeat: 2,
        ease: 'Sine.easeInOut'
      });
    }
  }
}
