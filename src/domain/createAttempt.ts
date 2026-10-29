import { C, COINS, POUCH } from '../content/chapter1';
import type { Attempt, Preset, Stone } from './types';

export function createAttempt(preset: Preset, id: string): Attempt {
  const stone = (id: string, centerX: number, bottomY: number, support: string): Stone =>
    ({ id, centerX, bottomY, vy: 0, support, state: support === 'ground' ? 'SETTLED' : 'SUPPORTED' });
  return {
    id, preset, status: 'WAITING', elapsed: 0, coins: 0, nextStone: 0, events: [],
    player: { centerX: 96, feetY: C.floor, vx: 0, vy: 0, grounded: true, support: 'ground', coyote: C.coyote,
      jumpBuffer: 0, control: 'FREE', tauntLeft: 0, facing: 1, pushing: false },
    machine: { state: 'READY', elapsed: 0, readyDuration: C.firstReady, targetX: 96, shotId: null },
    gateIntact: true, shelfIntact: true, plateWeighted: preset === 'C',
    liftY: preset === 'C' ? C.liftRaised : C.liftHome,
    stones: preset === 'B' ? [stone('initial_1', 256, 640, 'ground')] : preset === 'C'
      ? [stone('initial_1', 400, 640, 'ground'), stone('initial_2', 704, 424, 'lift')] : [],
    pickups: [...COINS, POUCH].map(v => ({ ...v, collected: false, vy: 0 })),
    hasCog: false,
    hasPole: false,
    gearBoxActive: false,
    platformsRevealed: false,
    hasSlingshot: false,
    beehiveTriggered: false,
    beehiveX: 0,
    beehiveY: 0,
    trapFloorOpen: false,
  };
}
