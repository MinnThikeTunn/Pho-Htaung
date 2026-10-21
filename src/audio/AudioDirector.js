// AudioDirector.js — Howler-Powered Audio Director & Timeline Synchronization
// Implements: audio_event_timeline_specification.md for Scene 0 (Intro) & Scene 1 (Chapter 1)

import { Howl, Howler } from 'howler';

/**
 * Section 1: Asset Registry & Preload Manifest
 */
export const AUDIO_MANIFEST = {
  // Stems (Phase-Locked Vertical Synchrony) — Subtle background bed
  STEM_DRONE: {
    src: ['/audio/stem_drone.ogg', '/assets/audio/bgm/stem_drone.ogg'],
    type: 'stem',
    baseVol: 0.18,
    loop: true
  },
  STEM_JUNGLE: {
    src: ['/audio/stem_jungle.ogg', '/assets/audio/bgm/stem_jungle.ogg'],
    type: 'stem',
    baseVol: 0.00,
    loop: true
  },
  STEM_KALIMBA: {
    src: ['/audio/stem_kalimba.ogg', '/assets/audio/bgm/stem_kalimba.ogg'],
    type: 'stem',
    baseVol: 0.00,
    loop: true
  },

  // SFX Registry — High-presence tactile foley
  SFX_BETEL_CHEW: {
    src: ['/audio/sfx_betel_chew.ogg', '/assets/audio/sfx/sfx_betel_chew.ogg'],
    type: 'sfx',
    baseVol: 0.70,
    loop: true
  },
  SFX_STEP_FLIPFLOP: {
    src: ['/audio/sfx_step_flipflop.ogg', '/assets/audio/sfx/sfx_step_flipflop.ogg'],
    type: 'sfx',
    baseVol: 0.70,
    loop: true
  },
  SFX_STEP_BAREFOOT: {
    src: ['/audio/sfx_step_barefoot.ogg', '/assets/audio/sfx/sfx_step_barefoot.ogg'],
    type: 'sfx',
    baseVol: 0.55,
    loop: false
  },
  SFX_CLANG_FALL: {
    src: ['/audio/sfx_clang_fall.ogg', '/audio/sfx_clang_fall1.ogg', '/assets/audio/sfx/sfx_clang_fall.ogg'],
    type: 'sfx',
    baseVol: 0.90,
    loop: false
  },
  SFX_ROCKET_SPLAT: {
    src: ['/audio/sfx_rocket_splat.ogg', '/assets/audio/sfx/sfx_rocket_splat.ogg'],
    type: 'sfx',
    baseVol: 0.95,
    loop: false
  },
  SFX_RECORD_SCRATCH: {
    src: ['/audio/sfx_record_scratch.ogg', '/assets/audio/sfx/sfx_record_scratch.ogg'],
    type: 'sfx',
    baseVol: 0.70,
    loop: false
  },
  SFX_STONE_GRIND: {
    src: ['/audio/sfx_stone_grind.ogg', '/assets/audio/sfx/sfx_stone_grind.ogg'],
    type: 'sfx',
    baseVol: 0.80,
    loop: false
  },
  SFX_PUZZLE_CHIME: {
    src: ['/audio/sfx_puzzle_chime.ogg', '/assets/audio/sfx/sfx_puzzle_chime.ogg'],
    type: 'sfx',
    baseVol: 0.65,
    loop: false
  }
};

class AudioDirector {
  constructor() {
    this.howls = {};
    this.isMuted = false;
    this.masterVolume = 1.0;

    // Stem playback tracking (Low volume bed for VO clarity)
    this.stemsStarted = false;
    this.stemTargetVolumes = {
      STEM_DRONE: 0.18,
      STEM_JUNGLE: 0.00,
      STEM_KALIMBA: 0.00
    };

    // Dialogue ducking state
    this.isDialoguePlaying = false;
    this.duckMultiplier = 0.35; // -65% ducking for voiceover headroom

    // Movement step engine state
    this.isFlipFlop = true;
    this.lastStepTime = 0;
    this.STEP_INTERVAL_MS = 280;
    this.isWalking = false;

    // Active looping sound IDs
    this.activeLoops = {};

    this.initialized = false;
  }

  /**
   * Preload & initialize all Howl audio instances
   */
  init() {
    if (this.initialized) return;
    this.initialized = true;

    for (const [key, cfg] of Object.entries(AUDIO_MANIFEST)) {
      this.howls[key] = new Howl({
        src: cfg.src,
        loop: Boolean(cfg.loop),
        volume: cfg.baseVol,
        html5: false, // Force Web Audio API for sample-accurate stem synchronization
        preload: true
      });
    }

    // Resume AudioContext if suspended by browser autoplay policy on first interaction
    const unlockAudio = () => {
      if (Howler.ctx && Howler.ctx.state === 'suspended') {
        Howler.ctx.resume();
      }
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
    window.addEventListener('pointerdown', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
  }

  /**
   * Section 2: Phase-Locked Clock Stem Initialization
   * Starts STEM_DRONE, STEM_JUNGLE, STEM_KALIMBA simultaneously at t = 0.0s (low ambient bed)
   */
  startStems(initialDroneVol = 0.18, initialJungleVol = 0.00, initialKalimbaVol = 0.00) {
    this.init();

    this.stemTargetVolumes.STEM_DRONE = initialDroneVol;
    this.stemTargetVolumes.STEM_JUNGLE = initialJungleVol;
    this.stemTargetVolumes.STEM_KALIMBA = initialKalimbaVol;

    if (!this.stemsStarted) {
      this.stemsStarted = true;

      // Start all 3 simultaneously at identical playback position
      const drone = this.howls.STEM_DRONE;
      const jungle = this.howls.STEM_JUNGLE;
      const kalimba = this.howls.STEM_KALIMBA;

      if (drone) {
        drone.volume(initialDroneVol);
        drone.play();
      }
      if (jungle) {
        jungle.volume(initialJungleVol);
        jungle.play();
      }
      if (kalimba) {
        kalimba.volume(initialKalimbaVol);
        kalimba.play();
      }

      // Synchronize playheads to sample-accurate zero
      if (drone && jungle && kalimba) {
        drone.seek(0);
        jungle.seek(0);
        kalimba.seek(0);
      }
    } else {
      // If already started, smoothly fade to desired levels
      this.fadeStem('STEM_DRONE', initialDroneVol, 600);
      this.fadeStem('STEM_JUNGLE', initialJungleVol, 600);
      this.fadeStem('STEM_KALIMBA', initialKalimbaVol, 600);
    }
  }

  /**
   * Adjusts / fades a specific stem with optional ducking awareness
   */
  fadeStem(stemKey, targetVol, durationMs = 600) {
    this.stemTargetVolumes[stemKey] = targetVol;
    const howl = this.howls[stemKey];
    if (!howl) return;

    const effectiveTarget = this.isDialoguePlaying ? targetVol * this.duckMultiplier : targetVol;
    howl.fade(howl.volume(), effectiveTarget, durationMs);
  }

  /**
   * Section 2: Dialogue Ducking Curve
   * -60% linear ramp over 300ms on start; restore over 400ms on end
   */
  setDialoguePlaying(isPlaying) {
    if (this.isDialoguePlaying === isPlaying) return;
    this.isDialoguePlaying = isPlaying;

    const duration = isPlaying ? 300 : 400;

    for (const [key, targetVol] of Object.entries(this.stemTargetVolumes)) {
      const howl = this.howls[key];
      if (!howl) continue;

      const effectiveTarget = isPlaying ? targetVol * this.duckMultiplier : targetVol;
      howl.fade(howl.volume(), effectiveTarget, duration);
    }
  }

  /**
   * Section 2: Comedic Hard Mute
   * Immediately zeroes out stems (gain = 0.0 within 15ms)
   */
  hardMuteStems() {
    this.stopWalking();
    for (const key of ['STEM_DRONE', 'STEM_JUNGLE', 'STEM_KALIMBA']) {
      this.stemTargetVolumes[key] = 0.0;
      const howl = this.howls[key];
      if (howl) {
        howl.mute(true);
        howl.volume(0.0);
      }
    }
  }

  /**
   * Section 3: Timeline Sequence for Scene 0 [Intro]
   */
  initScene0Timeline(scene) {
    this.init();

    // T = 0.0s: Mount, black screen: subtle drone stem (Drone 0.18, Jungle 0.00, Kalimba 0.00)
    this.startStems(0.18, 0.00, 0.00);

    // T = 2.0s: Fade in Jungle ambience softly to 0.14 over 2000ms & start clearly audible betel chew loop at 0.70
    scene.time.delayedCall(2000, () => {
      this.fadeStem('STEM_JUNGLE', 0.14, 2000);
      this.playLoop('SFX_BETEL_CHEW', 0.70);
    });

    // T = 2.5s: Dialogue ducking applied when U Gyi VO starts
    scene.time.delayedCall(2500, () => {
      this.setDialoguePlaying(true);
    });
  }

  /**
   * Scene 0 Script Event: VO reaches "...အယ်! သူရဲကောင်းဆိုလို့..."
   * Needle drop: Cut STEM_DRONE for 500ms, play SFX_RECORD_SCRATCH
   */
  triggerComedicNeedleDrop(scene) {
    this.playOneShot('SFX_RECORD_SCRATCH', 0.70);
    const drone = this.howls.STEM_DRONE;
    if (drone) {
      drone.volume(0.0);
      scene.time.delayedCall(500, () => {
        const target = this.isDialoguePlaying ? 0.07 : 0.18;
        drone.fade(0.0, target, 200);
      });
    }
  }

  /**
   * Scene 0 UI Event: Click [ စတင်မည် / Start Game ]
   * Stop betel loop, fade in Kalimba as gentle acoustic background (0.00 -> 0.16 over 1500ms), preserve drone/jungle
   */
  onStartGameClicked() {
    this.stopLoop('SFX_BETEL_CHEW');
    this.fadeStem('STEM_KALIMBA', 0.16, 1500);
  }

  /**
   * Section 4: Movement Audio State Engine
   * Seamlessly loops the cropped flip-flop walking track while moving at prominent foley volume (0.70),
   * and shuts down immediately when the player stops.
   */
  startWalking(volume = 0.70) {
    if (this.isWalking) return;
    this.init();
    this.isWalking = true;

    const howl = this.howls.SFX_STEP_FLIPFLOP;
    if (!howl) return;

    howl.loop(true);
    howl.volume(volume);
    if (!howl.playing()) {
      howl.play();
    }
  }

  stopWalking() {
    if (!this.isWalking) return;
    this.isWalking = false;

    const howl = this.howls.SFX_STEP_FLIPFLOP;
    if (howl) {
      howl.stop();
    }
    const barefoot = this.howls.SFX_STEP_BAREFOOT;
    if (barefoot) {
      barefoot.stop();
    }
  }

  onPlayerStep(nowTime) {
    this.startWalking();
  }

  /**
   * Section 4 Trap 1: Invisible Block Mid-Air Collision
   */
  handleTrapInvisibleBlock() {
    // 1. Instant Mute (gain = 0 within 15ms)
    this.hardMuteStems();

    // 2. Impact Playback
    this.playOneShot('SFX_CLANG_FALL', 0.90);
  }

  /**
   * Section 4 Trap 2: Right Platform Rocket Launch & Crush
   */
  handleTrapRocketPlatform() {
    // 1. Instant Mute
    this.hardMuteStems();

    // 2. Rocket & Squash Audio
    this.playOneShot('SFX_ROCKET_SPLAT', 0.95);
  }

  /**
   * Section 4 Respawn Hook
   * Fade STEM_DRONE -> 0.18 and STEM_KALIMBA -> 0.16 over 800ms
   */
  handleRespawn() {
    for (const key of ['STEM_DRONE', 'STEM_JUNGLE', 'STEM_KALIMBA']) {
      const howl = this.howls[key];
      if (howl) {
        howl.mute(false);
      }
    }
    this.fadeStem('STEM_DRONE', 0.18, 800);
    this.fadeStem('STEM_KALIMBA', 0.16, 800);
  }

  /**
   * Section 4 Troll Solution: Left Wall Push Interaction
   * Pushing against wall (x <= 20) for t >= 1.0s
   */
  handleTrollWallSolved(onComplete) {
    // 1. Discovery Stinger
    this.playOneShot('SFX_STONE_GRIND', 0.85);
    this.playOneShot('SFX_PUZZLE_CHIME', 0.70);

    // Keep acoustic audio (STEM_KALIMBA) gentle during U Gyi's victory commentary
    this.fadeStem('STEM_KALIMBA', 0.18, 500);

    if (onComplete) {
      setTimeout(onComplete, 500);
    }
  }

  /**
   * Transition from Scene 1 to Scene 2:
   * Carries the acoustic audio (STEM_KALIMBA) across the scene boundary,
   * then fades it out slowly over 4000ms.
   */
  transitionChapter1ToChapter2(fadeDurationMs = 4000) {
    this.stopWalking();
    // Fade out acoustic Kalimba slowly across the transition
    this.fadeStem('STEM_KALIMBA', 0.00, fadeDurationMs);
    // Keep ambient drone at subtle cave background level
    this.fadeStem('STEM_DRONE', 0.10, fadeDurationMs);
    this.fadeStem('STEM_JUNGLE', 0.00, 2000);
  }

  /**
   * Plays a one-shot sound effect
   */
  playOneShot(key, volumeOverride) {
    this.init();
    const howl = this.howls[key];
    if (!howl) return;

    const baseVol = AUDIO_MANIFEST[key]?.baseVol ?? 1.0;
    const vol = volumeOverride !== undefined ? volumeOverride : baseVol;
    howl.volume(vol);
    howl.play();
  }

  /**
   * Plays a looping sound effect
   */
  playLoop(key, volumeOverride) {
    this.init();
    const howl = this.howls[key];
    if (!howl) return;

    if (this.activeLoops[key]) return; // already looping

    const baseVol = AUDIO_MANIFEST[key]?.baseVol ?? 1.0;
    const vol = volumeOverride !== undefined ? volumeOverride : baseVol;
    howl.volume(vol);
    const soundId = howl.play();
    this.activeLoops[key] = soundId;
  }

  /**
   * Stops a looping sound effect
   */
  stopLoop(key) {
    const howl = this.howls[key];
    if (howl) {
      howl.stop();
    }
    delete this.activeLoops[key];
  }

  /**
   * Master Mute Toggle (Integrated with GameHUD)
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    Howler.mute(this.isMuted);
    return this.isMuted;
  }

  setMuted(muted) {
    this.isMuted = Boolean(muted);
    Howler.mute(this.isMuted);
  }

  getMuted() {
    return this.isMuted;
  }

  getMasterVolume() {
    return this.masterVolume !== undefined ? this.masterVolume : 1.0;
  }

  setMasterVolume(vol) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    Howler.volume(this.masterVolume);
  }
}

export const audioDirector = new AudioDirector();
