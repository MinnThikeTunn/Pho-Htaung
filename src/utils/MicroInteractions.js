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
   * Machinarium-style Diegetic Item Pickup Animation
   * Phoe Htaung bends down (ph-crouch), grabs the item into his hands,
   * stands up to rummage open his Shan bag (ph-bag-rummage),
   * slides the item into the bag with a gleam & rustle sound,
   * then pats his bag proudly and returns to idle (ph-idle).
   */
  static pickupItemToBag(scene, itemSprite, player, onBagged) {
    if (scene.isInteracting) return;
    scene.isInteracting = true;

    // Firmly lock player physics so gravity/collision never drops him through the platform
    const originalGravity = player.body ? player.body.allowGravity : true;
    if (player.body) {
      player.body.setVelocity(0, 0);
      player.body.setAllowGravity(false);
    }

    // Disable item physics / interaction immediately
    if (itemSprite.body) itemSprite.body.enable = false;
    itemSprite.disableInteractive();
    itemSprite.setDepth(200);

    const baseScale = scene.playerBaseScale || 1.42;
    const dir = itemSprite.x >= player.x ? 1 : -1;
    player.setScale(dir * baseScale, baseScale);

    // Initial coordinates
    const startX = itemSprite.x;
    const startY = itemSprite.y;
    // Hand position in front of crouched/standing player
    const handX = player.x + dir * 18 * (baseScale / 1.42);
    const handY = player.y + 10 * (baseScale / 1.42);
    const bagTargetX = player.x - dir * 10 * (baseScale / 1.42);
    const bagTargetY = player.y + 4 * (baseScale / 1.42);

    // Phase 1: Crouch & Reach (ph-crouch texture naturally renders lower without moving player.y into ground)
    soundEngine.playWoosh();
    player.setTexture('ph-crouch');

    // Item shrinks to small handheld size (scale: 0.38) as it snaps into Phoe Htaung's reaching hands
    scene.tweens.add({
      targets: itemSprite,
      x: handX,
      y: handY,
      scale: 0.38,
      duration: 180,
      ease: 'Back.Out',
      onComplete: () => {
        soundEngine.playPickup();

        // Phase 2: Stand up & Open Shan bag (ph-bag-rummage)
        player.setTexture('ph-bag-rummage');

        // Slide item from hand right into the open Shan shoulder bag mouth
        const peakY = Math.min(handY, bagTargetY) - 22;
        const dummy = { t: 0 };

        scene.tweens.add({
          targets: dummy,
          t: 1,
          duration: 320,
          ease: 'Cubic.InOut',
          onUpdate: () => {
            const t = dummy.t;
            // Smooth parabolic arc into the bag mouth
            itemSprite.x = (1 - t) * (1 - t) * handX + 2 * (1 - t) * t * ((handX + bagTargetX) / 2) + t * t * bagTargetX;
            itemSprite.y = (1 - t) * (1 - t) * handY + 2 * (1 - t) * t * peakY + t * t * bagTargetY;
            itemSprite.angle = t * 180;
            // Shrinks down into bag
            itemSprite.scale = Phaser.Math.Linear(0.38, 0.08, t);
          },
          onComplete: () => {
            // Item safely inside bag
            MicroInteractions.spawnBagSparkle(scene, bagTargetX, bagTargetY);
            soundEngine.playBagRustle();
            itemSprite.destroy();

            // Phase 3: Pat bag & proud bounce back to ph-idle
            scene.tweens.add({
              targets: player,
              scaleY: baseScale * 1.08,
              scaleX: dir * baseScale * 0.94,
              duration: 120,
              yoyo: true,
              ease: 'Back.Out',
              onComplete: () => {
                player.setTexture('ph-idle');
                player.setScale(dir * baseScale, baseScale);
                if (player.body) {
                  player.body.setAllowGravity(originalGravity);
                  player.body.setVelocity(0, 0);
                }
                scene.isInteracting = false;
                if (onBagged) onBagged();
              }
            });
          }
        });
      }
    });
  }

  /**
   * Machinarium-style Diegetic Item Pull-out Animation
   * Phoe Htaung rummages inside his Shan shoulder bag (ph-bag-rummage),
   * reaches his hand in and pulls out the chosen item (pops out with a gleam & woosh),
   * holds it proudly, then transfers/slots it into the target puzzle mechanism (or hands it over).
   */
  static pullItemFromBag(scene, player, itemTextureKey, targetPoint = null, onPulled = null) {
    if (scene.isInteracting) return;
    scene.isInteracting = true;

    const originalGravity = player.body ? player.body.allowGravity : true;
    if (player.body) {
      player.body.setVelocity(0, 0);
      player.body.setAllowGravity(false);
    }

    const baseScale = scene.playerBaseScale || 1.25;
    const dir = targetPoint ? (targetPoint.x >= player.x ? 1 : -1) : Math.sign(player.scaleX || 1);
    player.setScale(dir * baseScale, baseScale);

    const bagX = player.x - dir * 8 * (baseScale / 1.25);
    const bagY = player.y + 2 * (baseScale / 1.25);
    const handX = player.x + dir * 18 * (baseScale / 1.25);
    const handY = player.y - 10 * (baseScale / 1.25);

    // Phase 1: Switch to bag rummage posture & play bag rustle
    player.setTexture('ph-bag-rummage');
    soundEngine.playBagRustle();

    // Small rummage body shake
    scene.tweens.add({
      targets: player,
      angle: dir * -4,
      duration: 90,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        player.setAngle(0);

        // Phase 2: Pull item out of bag! Small cute scale: 0.45
        const pulledItem = scene.add.image(bagX, bagY, itemTextureKey)
          .setScale(0.1)
          .setDepth(200);

        soundEngine.playWoosh();
        soundEngine.playPickup();
        MicroInteractions.spawnBagSparkle(scene, bagX, bagY);

        // Arc up from inside the bag to Phoe Htaung's raised hand
        scene.tweens.add({
          targets: pulledItem,
          x: handX,
          y: handY,
          scale: 0.48, // Small, neat handheld scale
          angle: 360,
          duration: 280,
          ease: 'Back.Out',
          onComplete: () => {
            player.setTexture('ph-idle');

            if (targetPoint) {
              // Phase 3: Deliver to target mechanism (e.g. Winch gear slot or lever)
              scene.tweens.add({
                targets: pulledItem,
                x: targetPoint.x,
                y: targetPoint.y,
                scale: targetPoint.scale || 0.65,
                duration: 320,
                ease: 'Quad.InOut',
                onComplete: () => {
                  MicroInteractions.spawnBagSparkle(scene, targetPoint.x, targetPoint.y);
                  pulledItem.destroy();
                  if (player.body) {
                    player.body.setAllowGravity(originalGravity);
                    player.body.setVelocity(0, 0);
                  }
                  scene.isInteracting = false;
                  if (onPulled) onPulled();
                }
              });
            } else {
              // Holding item in hand
              if (player.body) {
                player.body.setAllowGravity(originalGravity);
                player.body.setVelocity(0, 0);
              }
              scene.isInteracting = false;
              if (onPulled) onPulled(pulledItem);
            }
          }
        });
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
    if (gameObject instanceof Phaser.GameObjects.Container && (!gameObject.width || !gameObject.height)) {
      gameObject.setSize(gameObject.width || 60, gameObject.height || 60);
    }
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
   * Continuous organic breathing and posture micro-animation (Inhaling & Exhaling).
   * Ensures Phoe Htaung is always alive and breathing even when waiting for player input.
   */
  static applyIdleBreathing(player, time, baseScale = 1.0) {
    if (!player || !player.active || player.isPerformingIdle) return;
    const dir = Math.sign(player.scaleX || 1);

    // 1. Organic Breathing Cycle (~2.6 seconds per full inhale-exhale)
    const breath = Math.sin(time * 0.0024);
    const inhaleAmount = breath * 0.026; // subtle 2.6% expansion

    // 2. Secondary slow posture micro-sway (~5.2 seconds cycle)
    const sway = Math.sin(time * 0.0012) * 0.75 * dir;

    // 3. Periodic Betel Chew Jaw Twitch (every ~3.2 seconds)
    const chewCycle = time % 3200;
    const isChewing = chewCycle < 180;
    const chewPulse = isChewing ? Math.sin(chewCycle * 0.04) * 0.015 : 0;

    // Apply scale with conservation of volume (taller when inhaling, slightly narrower)
    const currentScaleY = baseScale * (1 + inhaleAmount + chewPulse);
    const currentScaleX = dir * baseScale * (1 - inhaleAmount * 0.4);

    player.setScale(currentScaleX, currentScaleY);
    player.setAngle(sway);

    if (player.body) {
      player.body.setSize(38, 72);
      player.body.setOffset(11, 12);
    }
  }

  /**
   * Cancels any active idle animation and restores standard idle state
   */
  static cancelIdleAction(scene, player) {
    if (!player) return;
    player.isPerformingIdle = false;
    scene.tweens.killTweensOf(player);
    player.setAngle(0);
    const baseScale = scene?.playerBaseScale || player.baseScale || 1.25;
    const dir = Math.sign(player.scaleX || 1);
    player.setScale(dir * baseScale, baseScale);

    if (player.body) {
      player.body.setAllowGravity(true);
      if (player.body.velocity.y > 0) {
        player.body.setVelocityY(0);
      }
      player.body.setSize(38, 72);
      player.body.setOffset(11, 12);
    }

    if (player.idleEffectObj) {
      player.idleEffectObj.destroy();
      player.idleEffectObj = null;
    }
  }

  /**
   * Spontaneous slapstick idle micro-behavior using sliced sprite frames:
   * 1. Laughing / Chuckling (ph-laugh)
   * 2. Thinking / Pondering (ph-think)
   * 3. Being Mad / Furious Tantrum (ph-mad)
   * 4. Betel Nut Spit ("Ptooey!")
   * 5. Fly swatting with flip-flop
   * 6. Shan shoulder bag rummage (ph-bag-rummage)
   */
  static triggerIdleAction(scene, player, groundY) {
    if (!player || !player.active || scene.isInteracting || scene.isDead) return;
    const currentTexture = player.texture?.key;
    if (currentTexture !== 'ph-idle' && !['ph-laugh', 'ph-think', 'ph-mad'].includes(currentTexture)) return;

    player.isPerformingIdle = true;
    const baseScale = scene?.playerBaseScale || player.baseScale || 1.25;
    const dir = Math.sign(player.scaleX || 1);
    const action = Phaser.Math.Between(1, 6);

    // Freeze physics movement and gravity during idle micro-actions
    // This stops Phoe Htaung from losing ground collision, floating, or falling down!
    if (player.body) {
      player.body.setVelocity(0, 0);
      player.body.setAllowGravity(false);
    }

    const safeReset = (duration = 1300) => {
      scene.time.delayedCall(duration, () => {
        if (!player || !player.active || !player.isPerformingIdle) return;
        player.isPerformingIdle = false;
        player.setAngle(0);
        player.setScale(dir * baseScale, baseScale);

        if (player.body) {
          player.body.setAllowGravity(true);
          player.body.setVelocityY(0);
        }

        if (player.texture?.key !== 'ph-flat' && player.texture?.key !== 'ph-boiled' && player.texture?.key !== 'ph-ash') {
          player.setTexture('ph-idle');
        }
        if (player.idleEffectObj) {
          player.idleEffectObj.destroy();
          player.idleEffectObj = null;
        }
      });
    };

    if (action === 1) {
      // 1. Laughing / Chuckling (ph-laugh)
      player.setTexture('ph-laugh');
      soundEngine.playLaugh();

      // Slapstick belly-laugh bounce
      scene.tweens.add({
        targets: player,
        scaleY: baseScale * 0.94,
        angle: -4 * dir,
        duration: 80,
        yoyo: true,
        repeat: 4,
        ease: 'Quad.easeInOut'
      });

      // Floating playful laughter bubble
      const laughBubble = scene.add.container(player.x + dir * 14, player.y - 48).setDepth(45);
      const bubbleBg = scene.add.graphics();
      bubbleBg.fillStyle(0x1e1b18, 0.9);
      bubbleBg.fillRoundedRect(-18, -12, 36, 24, 10);
      bubbleBg.lineStyle(1.2, 0xfacc15, 0.85);
      bubbleBg.strokeRoundedRect(-18, -12, 36, 24, 10);

      const laughText = scene.add.text(0, -1, 'ဟိ...', {
        fontFamily: 'Noto Sans Myanmar, Pyidaungsu, sans-serif',
        fontSize: '11px',
        fontStyle: '900',
        color: '#fef08a'
      }).setOrigin(0.5);

      laughBubble.add([bubbleBg, laughText]);
      player.idleEffectObj = laughBubble;

      scene.tweens.add({
        targets: laughBubble,
        y: laughBubble.y - 20,
        alpha: 0,
        scale: 1.15,
        duration: 1100,
        ease: 'Cubic.easeOut',
        onComplete: () => laughBubble.destroy()
      });

      safeReset(1250);

    } else if (action === 2) {
      // 2. Thinking / Pondering (ph-think)
      player.setTexture('ph-think');
      soundEngine.playThinkingChime();

      // Thoughtful head tilt & gentle breathing
      scene.tweens.add({
        targets: player,
        angle: 5 * dir,
        scaleY: baseScale * 1.03,
        duration: 400,
        yoyo: true,
        repeat: 1,
        ease: 'Sine.easeInOut'
      });

      // Machinarium Thought Balloon with a rotating cog / question mark
      const thinkBubble = scene.add.container(player.x + dir * 16, player.y - 50).setDepth(45);
      const dot1 = scene.add.circle(-8, 8, 2.5, 0x292524, 0.9);
      const dot2 = scene.add.circle(-4, 3, 3.5, 0x292524, 0.9);
      const cloud = scene.add.graphics();
      cloud.fillStyle(0x1c1917, 0.92);
      cloud.fillCircle(10, -6, 14);
      cloud.fillCircle(2, -8, 12);
      cloud.fillCircle(18, -8, 10);
      cloud.lineStyle(1.5, 0xf59e0b, 0.9);
      cloud.strokeCircle(10, -6, 14);

      const mark = scene.add.text(10, -7, '?', {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: '14px',
        fontStyle: '900',
        color: '#fbbf24'
      }).setOrigin(0.5);

      thinkBubble.add([dot1, dot2, cloud, mark]);
      thinkBubble.setScale(0.2);
      player.idleEffectObj = thinkBubble;

      scene.tweens.add({
        targets: thinkBubble,
        scale: 1.0,
        duration: 350,
        ease: 'Back.easeOut'
      });

      scene.tweens.add({
        targets: mark,
        angle: 15,
        duration: 250,
        yoyo: true,
        repeat: 2
      });

      scene.tweens.add({
        targets: thinkBubble,
        alpha: 0,
        delay: 1200,
        duration: 300,
        onComplete: () => thinkBubble.destroy()
      });

      safeReset(1550);

    } else if (action === 3) {
      // 3. Being Mad / Furious Tantrum (ph-mad)
      player.setTexture('ph-mad');
      soundEngine.playMadGrunt();

      // Impatient anger jitter tremor
      const startX = player.x;
      scene.tweens.add({
        targets: player,
        x: startX + 3,
        duration: 45,
        yoyo: true,
        repeat: 5,
        ease: 'Linear',
        onComplete: () => {
          player.x = startX;
          // Impatient foot stomp with dust puff
          soundEngine.playFootstep('flipflop');
          MicroInteractions.spawnFootstepDust(scene, player.x, groundY ? groundY - 36 : player.y, dir);
        }
      });

      // Steam puff particles from ears
      const steamLeft = scene.add.circle(player.x - 14, player.y - 28, 4, 0xf8fafc, 0.85).setDepth(40);
      const steamRight = scene.add.circle(player.x + 14, player.y - 28, 4, 0xf8fafc, 0.85).setDepth(40);

      scene.tweens.add({
        targets: [steamLeft, steamRight],
        y: '-=18',
        scale: 2.0,
        alpha: 0,
        duration: 500,
        ease: 'Quad.easeOut',
        onComplete: () => {
          steamLeft.destroy();
          steamRight.destroy();
        }
      });

      safeReset(1400);

    } else if (action === 4) {
      // 4. Betel Nut Spit ("Ptooey!")
      soundEngine.playSpit();

      scene.tweens.add({
        targets: player,
        scaleY: baseScale * 0.94,
        duration: 120,
        yoyo: true,
        onYoyo: () => {
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

      safeReset(900);

    } else if (action === 5) {
      // 5. Fly swatting with flip-flop
      soundEngine.playFootstep('stone');
      soundEngine.playMumbledGrunt('phoe_htaung');
      scene.tweens.add({
        targets: player,
        angle: -7 * dir,
        scaleY: baseScale * 0.94,
        duration: 90,
        yoyo: true,
        repeat: 2,
        ease: 'Back.Out'
      });

      safeReset(850);

    } else {
      // 6. Shan shoulder bag rummage (ph-bag-rummage)
      player.setTexture('ph-bag-rummage');
      soundEngine.playLongyiRustle();

      scene.tweens.add({
        targets: player,
        scaleY: baseScale * 1.04,
        duration: 140,
        yoyo: true,
        repeat: 2,
        ease: 'Sine.easeInOut'
      });

      safeReset(1100);
    }
  }

  /**
   * Ambient Interactive "Toy" Handler (Dog, Temple Bell, Clay Pots)
   * Non-puzzle background elements that reward player curiosity.
   */
  static attachAmbientToy(scene, gameObject, type = 'pot') {
    if (gameObject instanceof Phaser.GameObjects.Container && (!gameObject.width || !gameObject.height)) {
      if (type === 'dog') {
        gameObject.setSize(36, 20);
      } else if (type === 'bell') {
        gameObject.setSize(40, 50);
      } else {
        gameObject.setSize(40, 40);
      }
    }
    gameObject.setInteractive({ useHandCursor: true });
    MicroInteractions.makeInteractiveHover(gameObject, 1.12);

    gameObject.on('pointerdown', (pointer, lx, ly, event) => {
      if (event && event.stopPropagation) event.stopPropagation();

      if (type === 'dog') {
        soundEngine.playDogGrunt();
        // Squash and stretch
        const origSx = gameObject.scaleX;
        const origSy = gameObject.scaleY;
        scene.tweens.add({
          targets: gameObject,
          scaleX: origSx * 1.12,
          scaleY: origSy * 0.88,
          duration: 120,
          yoyo: true,
          ease: 'Back.Out'
        });

        // Floating '!' or '💤'
        const mark = scene.add.text(gameObject.x, gameObject.y - 20, '💢 ဝုတ်!', {
          fontFamily: 'Noto Sans Myanmar, sans-serif',
          fontSize: '13px',
          fontStyle: '900',
          color: '#f87171'
        }).setOrigin(0.5).setDepth(230);

        scene.tweens.add({
          targets: mark,
          y: gameObject.y - 42,
          alpha: 0,
          duration: 650,
          ease: 'Quad.Out',
          onComplete: () => mark.destroy()
        });

      } else if (type === 'bell') {
        soundEngine.playTempleBell();
        // Swaying bell physics
        scene.tweens.add({
          targets: gameObject,
          angle: -16,
          duration: 90,
          yoyo: true,
          repeat: 3,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            scene.tweens.add({
              targets: gameObject,
              angle: 0,
              duration: 300,
              ease: 'Elastic.Out'
            });
          }
        });

        // Golden sound ring ripple
        const chimeWave = scene.add.graphics().setDepth(200);
        chimeWave.lineStyle(2, 0xfde047, 0.8);
        chimeWave.strokeCircle(gameObject.x, gameObject.y, 20);
        scene.tweens.add({
          targets: chimeWave,
          scale: 2.2,
          alpha: 0,
          duration: 700,
          ease: 'Quad.Out',
          onComplete: () => chimeWave.destroy()
        });

      } else if (type === 'pot') {
        soundEngine.playPotWobble();
        const origX = gameObject.x;
        scene.tweens.add({
          targets: gameObject,
          x: origX + 5,
          angle: 4,
          duration: 60,
          yoyo: true,
          repeat: 3,
          ease: 'Quad.InOut',
          onComplete: () => {
            gameObject.x = origX;
            gameObject.angle = 0;
          }
        });
      } else if (type === 'bird') {
        soundEngine.playBirdChirp();
        // Machinarium bird flap & hopping bounce
        scene.tweens.add({
          targets: gameObject,
          y: gameObject.y - 12,
          scaleY: 1.25,
          duration: 110,
          yoyo: true,
          repeat: 2,
          ease: 'Back.Out'
        });

        // Floating musical note
        const note = scene.add.text(gameObject.x, gameObject.y - 18, '🎵', {
          fontSize: '14px'
        }).setOrigin(0.5).setDepth(220);

        scene.tweens.add({
          targets: note,
          y: gameObject.y - 38,
          alpha: 0,
          duration: 700,
          ease: 'Quad.Out',
          onComplete: () => note.destroy()
        });

      } else if (type === 'brick') {
        soundEngine.playBrickRattle();
        const origX = gameObject.x;
        const origY = gameObject.y;

        // Brick violent jiggle
        scene.tweens.add({
          targets: gameObject,
          x: origX + Phaser.Math.Between(-3, 3),
          y: origY + 2,
          duration: 40,
          yoyo: true,
          repeat: 4,
          ease: 'Sine.easeInOut'
        });

        // Crumbling brick dust puff
        for (let i = 0; i < 6; i++) {
          const dust = scene.add.circle(
            gameObject.x + Phaser.Math.Between(-12, 12),
            gameObject.y + 10,
            Phaser.Math.Between(1.5, 3.5),
            0xb45309,
            0.8
          ).setDepth(150);

          scene.tweens.add({
            targets: dust,
            y: dust.y + Phaser.Math.Between(10, 24),
            x: dust.x + Phaser.Math.Between(-8, 8),
            alpha: 0,
            duration: 400,
            ease: 'Quad.In',
            onComplete: () => dust.destroy()
          });
        }

      } else if (type === 'gecko') {
        soundEngine.playInsectScuttle();
        // Tail whip and rapid darting
        scene.tweens.add({
          targets: gameObject,
          x: gameObject.x + (gameObject.scaleX > 0 ? 18 : -18),
          angle: 8,
          duration: 80,
          yoyo: true,
          repeat: 2,
          ease: 'Quad.InOut'
        });
      }
    });
  }

  /**
   * Spawns an illustrated Machinarium-style temple sparrow perched on stone
   */
  static createTempleBird(scene, x, y) {
    const bird = scene.add.image(x, y, 'prop-bird')
      .setScale(0.85)
      .setDepth(45)
      .setOrigin(0.5, 0.85);

    // Idle head/tail twitching every few seconds
    scene.time.addEvent({
      delay: Phaser.Math.Between(2600, 4800),
      loop: true,
      callback: () => {
        if (!bird.active) return;
        scene.tweens.add({
          targets: bird,
          angle: Phaser.Math.Between(-8, 8),
          scaleY: 0.82,
          duration: 80,
          yoyo: true
        });
      }
    });

    MicroInteractions.attachAmbientToy(scene, bird, 'bird');
    return bird;
  }

  /**
   * Spawns a loose ancient terracotta brick embedded in the temple wall
   */
  static createLooseBrick(scene, x, y) {
    const brick = scene.add.image(x, y, 'prop-brick')
      .setScale(0.82)
      .setDepth(25);

    MicroInteractions.attachAmbientToy(scene, brick, 'brick');
    return brick;
  }

  /**
   * Spawns an animated Bagan wall gecko clinging to stone
   */
  static createWallGecko(scene, x, y) {
    const gecko = scene.add.image(x, y, 'prop-gecko')
      .setScale(0.85)
      .setDepth(26);

    MicroInteractions.attachAmbientToy(scene, gecko, 'gecko');
    return gecko;
  }

  /**
   * Comedic Slapstick: Black Soot Puff on Invalid Interaction
   */
  static triggerSootPuff(scene, player, onRecover) {
    soundEngine.playSootPuff();
    soundEngine.playMumbledGrunt('phoe_htaung');

    // Spawn expanding black soot particles around Phoe Htaung's face
    const sootContainer = scene.add.container(player.x, player.y - 15).setDepth(240);
    for (let i = 0; i < 16; i++) {
      const sp = scene.add.circle(
        Phaser.Math.Between(-10, 10),
        Phaser.Math.Between(-10, 10),
        Phaser.Math.Between(4, 9),
        0x1c1917,
        0.85
      );
      sootContainer.add(sp);

      scene.tweens.add({
        targets: sp,
        x: sp.x + Phaser.Math.Between(-28, 28),
        y: sp.y + Phaser.Math.Between(-24, 18),
        scale: 1.8,
        alpha: 0,
        duration: Phaser.Math.Between(450, 750),
        ease: 'Quad.Out'
      });
    }

    // Player recoils and blinks with cartoon eyes
    scene.tweens.add({
      targets: player,
      scaleY: 0.85,
      angle: -10,
      duration: 140,
      yoyo: true,
      repeat: 1,
      ease: 'Back.Out',
      onComplete: () => {
        sootContainer.destroy();
        if (onRecover) onRecover();
      }
    });
  }
}
