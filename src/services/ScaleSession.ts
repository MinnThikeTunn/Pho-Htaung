import { C } from '../content/chapter1';
import { createScaleAttempt, stepScale } from '../domain/scale';
import type { ScaleAttempt, ScaleEvent, ScaleInput } from '../domain/scale';

export class ScaleSession {
  attempt: ScaleAttempt;
  paused = false; accumulator = 0; generation = 0; restartTime = 0; restartArmed = true; droppedBacklog = 0;
  constructor(private id: () => string) { this.attempt = createScaleAttempt(id()); }
  clearInput() { this.accumulator = 0; this.restartTime = 0; this.attempt.command = null; this.attempt.player.jumpBuffer = 0; }
  setPause(value: boolean) { this.paused = value; this.clearInput(); }
  restart() { this.attempt = createScaleAttempt(this.id()); this.generation++; this.clearInput(); }
  tick(delta: number, input: ScaleInput, restartHeld = false): ScaleEvent[] {
    if (this.paused || this.attempt.status === 'COMPLETE') return [];
    if (!restartHeld) { this.restartTime = 0; this.restartArmed = true; }
    if (restartHeld && this.restartArmed) {
      this.restartTime += Math.max(0, delta);
      if (this.restartTime + 1e-9 >= C.restartHold) { this.restart(); this.restartArmed = false; return []; }
    }
    this.accumulator += Math.max(0, delta);
    const events: ScaleEvent[] = []; let steps = 0;
    while (this.accumulator + 1e-9 >= C.dt && steps < C.maxSteps) {
      stepScale(this.attempt, { ...input, jump: steps === 0 && input.jump });
      events.push(...this.attempt.events); this.accumulator -= C.dt; steps++;
      if ((this.attempt as ScaleAttempt).status === 'COMPLETE') { this.accumulator = 0; break; }
    }
    if (steps === C.maxSteps && this.accumulator >= C.dt) { this.droppedBacklog += this.accumulator; this.accumulator = 0; }
    return events;
  }
}
