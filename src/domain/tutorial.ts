export enum TutorialStep {
  ENTRY = 'ENTRY',
  WALK = 'WALK',
  CROUCH = 'CROUCH',
  PICKUP = 'PICKUP',
  SPIT = 'SPIT',
  JUMP = 'JUMP',
  TRAP = 'TRAP',
  ROAST = 'ROAST',
  FINISHED = 'FINISHED'
}

export interface TutorialProgress {
  step: TutorialStep;
  walkDistance: number;
  crouchDuration: number;
  hasPickedBetelNut: boolean;
  hasSpitBetel: boolean;
  trapTriggered: boolean;
}

export function createInitialTutorialProgress(): TutorialProgress {
  return {
    step: TutorialStep.ENTRY,
    walkDistance: 0,
    crouchDuration: 0,
    hasPickedBetelNut: false,
    hasSpitBetel: false,
    trapTriggered: false
  };
}
