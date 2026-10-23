import { C } from '../content/chapter1';
import { createAttempt } from '../domain/createAttempt';
import { step } from '../domain/step';
import type { Attempt, Input, Preset } from '../domain/types';

export class Session {
  attempt: Attempt;
  sessionDeaths = 0;
  paused = false;
  deathElapsed = 0;
  generation = 0;
  accumulator = 0;
  droppedBacklog = 0;
  restartTime = 0;
  restartArmed = true;
  constructor(readonly preset: Preset, private id: () => string) { this.attempt = createAttempt(preset, id()); }
  restart() { this.attempt = createAttempt(this.preset, this.id()); this.generation++; this.deathElapsed = 0; this.accumulator = 0; this.restartTime = 0; }
  setPause(value: boolean) { this.paused = value; this.accumulator = 0; this.restartTime = 0; }
  tick(delta: number, input: Input, restartHeld = false): Attempt['events'] {
    if (this.paused) return [];
    const events: Attempt['events'] = [];
    if (!restartHeld) { this.restartTime = 0; this.restartArmed = true; }
    if (this.attempt.status === 'COMPLETE') return events;
    if (this.attempt.status === 'DEAD') {
      this.deathElapsed += delta;
      if (this.deathElapsed + 1e-9 >= C.deathTotal) this.restart();
      return events;
    }
    if (restartHeld && this.restartArmed) {
      this.restartTime += delta;
      if (this.restartTime + 1e-9 >= C.restartHold) { this.restart(); this.restartArmed = false; return events; }
    }
    this.accumulator += delta;
    let count = 0;
    while (this.accumulator + 1e-9 >= C.dt && count < C.maxSteps) {
      step(this.attempt, { ...input, jump: count === 0 && input.jump, taunt: count === 0 && input.taunt });
      events.push(...this.attempt.events);
      this.accumulator -= C.dt; count++;
      const phase = (this.attempt as Attempt).status;
      if (phase === 'DEAD') { this.sessionDeaths++; this.deathElapsed = 0; this.accumulator = 0; break; }
      if (phase === 'COMPLETE') { this.accumulator = 0; break; }
    }
    if (count === C.maxSteps && this.accumulator >= C.dt) { this.droppedBacklog += this.accumulator; this.accumulator = 0; }
    return events;
  }
}
