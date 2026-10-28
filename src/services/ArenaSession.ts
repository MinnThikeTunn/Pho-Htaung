import { C } from '../content/chapter1';
import { createArena, stepArena } from '../domain/arena';
import type { ArenaAttempt, ArenaEvent, ArenaInput } from '../domain/arena';

export class ArenaSession {
  attempt: ArenaAttempt; paused = false; accumulator = 0; generation = 0;
  restartTime = 0; restartArmed = true; droppedBacklog = 0;
  constructor(private id: () => string, readonly hasSling = true) { this.attempt = createArena(id(), hasSling); }
  clearInput() { this.accumulator = 0; this.restartTime = 0; this.attempt.charge = 0; this.attempt.wasSling = false; this.attempt.player.jumpBuffer = 0; }
  setPause(value: boolean) { this.paused = value; this.clearInput(); }
  restart() { this.attempt = createArena(this.id(), this.hasSling); this.generation++; this.clearInput(); }
  tick(delta: number, input: ArenaInput, restartHeld = false): ArenaEvent[] {
    if (this.paused || this.attempt.status === 'COMPLETE') return [];
    if (!restartHeld) { this.restartTime = 0; this.restartArmed = true; }
    if (restartHeld && this.restartArmed) {
      this.restartTime += Math.max(0, delta);
      if (this.restartTime + 1e-9 >= C.restartHold) { this.restart(); this.restartArmed = false; return []; }
    }
    if (this.attempt.status === 'FAILED') return [];
    this.accumulator += Math.max(0, delta); let steps = 0; const events: ArenaEvent[] = [];
    while (this.accumulator + 1e-9 >= C.dt && steps < C.maxSteps) {
      stepArena(this.attempt, { ...input, jump: steps === 0 && input.jump, punch: steps === 0 && input.punch, dodge: steps === 0 && input.dodge });
      events.push(...this.attempt.events); this.accumulator -= C.dt; steps++;
      if (this.attempt.status !== 'ACTIVE' && this.attempt.status !== 'WAITING') { this.accumulator = 0; break; }
    }
    if (steps === C.maxSteps && this.accumulator >= C.dt) { this.droppedBacklog += this.accumulator; this.accumulator = 0; }
    return events;
  }
}
