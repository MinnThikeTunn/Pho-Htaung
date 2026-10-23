import Phaser from 'phaser';
import type { EventKind } from '../domain/types';

/** Original short procedural cues, no third-party recordings or synthesized narrator voice. */
export class AudioController {
  muted = false;
  private scene: Phaser.Scene | null = null;
  attach(scene: Phaser.Scene) { this.scene = scene; }
  unlock() { if (this.scene?.sound.locked) this.scene.sound.unlock(); }
  play(kind: EventKind) {
    if (this.muted || !this.scene || !(this.scene.sound instanceof Phaser.Sound.WebAudioSoundManager)) return;
    const context = this.scene.sound.context;
    if (context.state !== 'running') return;
    const frequencies: Partial<Record<EventKind, number>> = { lock: 540, coin: 940, death: 85, shatter: 130, land: 105, gate: 160, shelf: 180, complete: 700, taunt: 360 };
    const frequency = frequencies[kind]; if (!frequency) return;
    const osc = context.createOscillator(), gain = context.createGain();
    const now = context.currentTime, duration = kind === 'death' ? .18 : .08;
    osc.type = kind === 'coin' || kind === 'complete' ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(frequency, now); osc.frequency.exponentialRampToValueAtTime(frequency * .65, now + duration);
    gain.gain.setValueAtTime(.035, now); gain.gain.exponentialRampToValueAtTime(.001, now + duration);
    osc.connect(gain); gain.connect(context.destination); osc.start(now); osc.stop(now + duration);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  }
}
