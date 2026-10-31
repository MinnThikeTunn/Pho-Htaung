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

    // Pending callback timers
    this._pendingTimers = new Set();

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
        preload: true,
        onloaderror: (_id, err) => {
          console.warn(`[AudioDirector] Failed to load audio ${key}:`, err);
        },
        onplayerror: (_id, err) => {
          console.warn(`[AudioDirector] Play error for ${key}:`, err);
          if (Howler.ctx && Howler.ctx.state === 'suspended') {
            Howler.ctx.resume().catch(() => {});
          }
        }
      });
    }

    // Resume AudioContext if suspended by browser autoplay policy on first interaction
    const unlockAudio = () => {
      if (Howler.ctx && Howler.ctx.state === 'suspended') {
        Howler.ctx.resume().catch(() => {});
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

    if (Howler.ctx && Howler.ctx.state === 'suspended') {
      try { Howler.ctx.resume().catch(() => {}); } catch {}
    }

    this.stemTargetVolumes.STEM_DRONE = initialDroneVol;
    this.stemTargetVolumes.STEM_JUNGLE = initialJungleVol;
    this.stemTargetVolumes.STEM_KALIMBA = initialKalimbaVol;

    this.activeStemLevels = {
      STEM_DRONE: initialDroneVol,
      STEM_JUNGLE: initialJungleVol,
      STEM_KALIMBA: initialKalimbaVol
    };

    this.stemsStarted = true;

    for (const [key, targetVol] of Object.entries(this.stemTargetVolumes)) {
      const howl = this.howls[key];
      if (!howl) continue;
      // Ensure individual howl is unmuted
      howl.mute(false);
      const effectiveVol = this.isDialoguePlaying ? targetVol * this.duckMultiplier : targetVol;
      if (!howl.playing()) {
        howl.volume(effectiveVol);
        if (!this.isMuted) {
          howl.play();
        }
      } else {
        howl.fade(howl.volume(), effectiveVol, 600);
      }
    }
  }

  /**
   * Adjusts / fades a specific stem with optional ducking awareness
   */
  fadeStem(stemKey, targetVol, durationMs = 600) {
    this.stemTargetVolumes[stemKey] = targetVol;
    if (targetVol > 0) {
      if (!this.activeStemLevels) this.activeStemLevels = {};
      this.activeStemLevels[stemKey] = targetVol;
    }
    const howl = this.howls[stemKey];
    if (!howl) return;

    howl.mute(false);
    const effectiveTarget = this.isDialoguePlaying ? targetVol * this.duckMultiplier : targetVol;
    if (effectiveTarget > 0 && !howl.playing() && !this.isMuted) {
      howl.volume(0);
      howl.play();
    }
    howl.fade(howl.volume(), effectiveTarget, durationMs);
  }

  /**
   * Cleanly stop all background stems, reset volume, and cancel any pending fade tweens
   */
  stopStems() {
    this.stemsStarted = false;
    for (const key of ['STEM_DRONE', 'STEM_JUNGLE', 'STEM_KALIMBA']) {
      this.stemTargetVolumes[key] = 0.0;
      const howl = this.howls[key];
      if (howl) {
        try {
          howl.stop();
          howl.volume(0.0);
        } catch {}
      }
    }
  }

  /**
   * Stop all Howl instances, step audio, loops, and reset stem states across scene boundaries
   */
  stopAll() {
    this.stopWalking();
    this.stopStems();
    for (const key of Object.keys(this.activeLoops)) {
      this.stopLoop(key);
    }
    for (const howl of Object.values(this.howls)) {
      if (howl) {
        try { howl.stop(); } catch {}
      }
    }
    if (this._pendingTimers) {
      for (const tid of this._pendingTimers) {
        try { clearTimeout(tid); } catch {}
      }
      this._pendingTimers.clear();
    }
    this.isDialoguePlaying = false;
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
   * Comedic Trap Hook: halts footsteps, but strictly keeps audio system & ambient stems open
   */
  hardMuteStems() {
    this.stopWalking();
    // Audio system remains ALWAYS OPEN per user directive: never mute or close stems on death
    for (const key of ['STEM_DRONE', 'STEM_JUNGLE', 'STEM_KALIMBA']) {
      const howl = this.howls[key];
      if (howl && typeof howl.muted === 'function' && howl.muted()) {
        try { howl.mute(false); } catch {}
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
    this.isWalking = false;

    const howl = this.howls.SFX_STEP_FLIPFLOP;
    if (howl) {
      try { howl.stop(); } catch {}
    }
    const barefoot = this.howls.SFX_STEP_BAREFOOT;
    if (barefoot) {
      try { barefoot.stop(); } catch {}
    }
  }

  onPlayerStep(nowTime) {
    this.startWalking();
  }

  /**
   * Section 4 Trap 1: Invisible Block Mid-Air Collision
   */
  handleTrapInvisibleBlock() {
    this.stopWalking();
    // Keep audio system open; play impact sound
    this.playOneShot('SFX_CLANG_FALL', 0.90);
  }

  /**
   * Section 4 Trap 2: Right Platform Rocket Launch & Crush
   */
  handleTrapRocketPlatform() {
    this.stopWalking();
    // Keep audio system open; play rocket & squash audio
    this.playOneShot('SFX_ROCKET_SPLAT', 0.95);
  }

  /**
   * Section 4 Respawn Hook
   * Ensure audio system remains always open and stems unmuted
   */
  handleRespawn() {
    if (Howler.ctx && Howler.ctx.state === 'suspended' && !this.isMuted) {
      try { Howler.ctx.resume().catch(() => {}); } catch {}
    }
    for (const key of ['STEM_DRONE', 'STEM_JUNGLE', 'STEM_KALIMBA']) {
      const howl = this.howls[key];
      if (howl) {
        howl.mute(false);
      }
    }
    this.fadeStem('STEM_DRONE', 0.18, 600);
    this.fadeStem('STEM_JUNGLE', 0.14, 600);
    this.fadeStem('STEM_KALIMBA', 0.16, 600);
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
      const tid = setTimeout(() => {
        this._pendingTimers?.delete(tid);
        onComplete();
      }, 500);
      this._pendingTimers?.add(tid);
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
    this._syncStemsOnMuteChange();
    return this.isMuted;
  }

  setMuted(muted) {
    this.isMuted = Boolean(muted);
    Howler.mute(this.isMuted);
    this._syncStemsOnMuteChange();
  }

  _syncStemsOnMuteChange() {
    if (Howler.ctx && Howler.ctx.state === 'suspended' && !this.isMuted) {
      try { Howler.ctx.resume().catch(() => {}); } catch {}
    }
    for (const key of ['STEM_DRONE', 'STEM_JUNGLE', 'STEM_KALIMBA']) {
      const howl = this.howls[key];
      if (!howl) continue;
      if (this.isMuted) {
        howl.mute(true);
      } else {
        howl.mute(false);
        const targetVol = this.stemTargetVolumes[key] > 0
          ? this.stemTargetVolumes[key]
          : (this.activeStemLevels?.[key] || 0);
        if (targetVol > 0) {
          howl.volume(this.isDialoguePlaying ? targetVol * this.duckMultiplier : targetVol);
          if (!howl.playing()) {
            howl.play();
          }
        }
      }
    }
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
