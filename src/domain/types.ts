export type Preset = 'A' | 'B' | 'C';
export type Mode = 'CAMPAIGN' | 'REPLAY' | 'PRACTICE';
export interface Rect { id: string; x: number; y: number; w: number; h: number }
export interface Player {
  centerX: number; feetY: number; vx: number; vy: number;
  grounded: boolean; support: string | null; coyote: number; jumpBuffer: number;
  control: 'FREE' | 'TAUNTING' | 'DEAD' | 'EXITING' | 'LAYING' | 'PICKUP' | 'RUMMAGE'; tauntLeft: number;
  facing: -1 | 1; pushing: boolean;
}
export interface Stone {
  id: string; centerX: number; bottomY: number; vy: number;
  state: 'FALLING' | 'SETTLED' | 'SUPPORTED'; support: string | null;
}
export interface Pickup { id: string; x: number; y: number; value: number; size: number; collected: boolean; vy: number; isBomb?: boolean; disarmed?: boolean }
export interface Machine {
  state: 'READY' | 'TRACK' | 'LOCKED' | 'DROP' | 'RECOVER';
  elapsed: number; readyDuration: number; targetX: number; shotId: string | null;
}
export type EventKind = 'start' | 'lock' | 'drop' | 'land' | 'shatter' | 'gate' | 'shelf' | 'plate' | 'coin' | 'death' | 'complete' | 'taunt' | 'puzzle_item' | 'gear_box' | 'platforms' | 'beehive' | 'trap' | 'door_top_trap' | 'slingshot' | 'bomb' | 'bomb_disarm' | 'gear_slapstick' | 'gear_lube' | 'gear_lever' | 'gear_crank' | 'gear_too_high' | 'steam_nozzle_attach' | 'brick_collect' | 'gear_jam';
export type GearboxState = 'EMPTY' | 'COG_MOUNTED' | 'LUBRICATED' | 'ARMED' | 'ACTIVE';
export interface GameEvent { kind: EventKind; x?: number; y?: number; value?: number }
export interface Attempt {
  id: string; preset: Preset; status: 'WAITING' | 'ACTIVE' | 'DEAD' | 'COMPLETE';
  player: Player; machine: Machine; stones: Stone[]; pickups: Pickup[];
  gateIntact: boolean; shelfIntact: boolean; plateWeighted: boolean; liftY: number;
  elapsed: number; coins: number; nextStone: number; events: GameEvent[];
  hasCog: boolean;
  hasPole: boolean;
  gearBoxActive: boolean;
  gearboxState: GearboxState;
  gearboxSlapped?: boolean;
  platformsRevealed: boolean;
  hasSlingshot: boolean;
  beehiveTriggered: boolean;
  beehiveX: number;
  beehiveY: number;
  trapFloorOpen: boolean;
  bombDetonated: boolean;
  bombX: number;
  // WC5: Steam Lift Hydraulics
  hasSteamNozzleRedirector: boolean;
  steamNozzleRedirectorAttached: boolean;
  steamPressureBuilding: boolean;
  steamPressureTimer: number;
  gateLiftedBySteam: boolean;
  // WC8: Gear Jam Sabotage
  ancientBrickCollected: boolean;
  ancientBrickX: number;
  ancientBrickY: number;
  ancientBrickDropping: boolean;
  crusherGearJammed: boolean;
  gearJammedPermanently: boolean;
  doorTopTrapTriggered?: boolean;
}
export interface Input { left: boolean; right: boolean; jump: boolean; taunt: boolean; down?: boolean }
export const NO_INPUT: Readonly<Input> = { left: false, right: false, jump: false, taunt: false, down: false };
export interface ChapterResult {
  attemptId: string; mode: Mode; presetId: Preset; collectedCoins: number;
  creditedCoins: number; activeSeconds: number; sessionDeaths: number;
}
export interface Campaign {
  schemaVersion: 2; revision: number; campaignId: string; walletCoins: number; bridgeCompleted: boolean;
  deathCount: number; chapter2Completed: boolean; chapter2BestBankedCoins: number;
  completedAttemptIds: string[]; bestResultByPresetAndCoinTotal: Record<string, number>;
  hintsSeen: string[]; inventory: string[]; ownedTools: string[];
  resumeAt: 'CHAPTER_1' | 'CHAPTER_2' | 'CH2_EXIT_LINK' | 'CHAPTER_3_PENDING' | 'CHAPTER_3' | 'CHAPTER_4_PENDING' | 'CHAPTER_4' | 'CHAPTER_5_PENDING' | 'CHAPTER_5' | 'CAMPAIGN_COMPLETE';
  lastChapter2Result: ChapterResult | null;
  // Optional additive fields let existing schema-2 adventures load losslessly.
  tutorialCompleted?: boolean;
  chapter3Completed?: boolean;
  chapter3TreasureRecovered?: boolean;
  lastChapter3Result?: import('./scale').ScaleResult | null;
  chapter4Completed?: boolean;
  lastChapter4Result?: import('./arena').ArenaResult | null;
  chapter5Completed?: boolean;
  debtRepaidGold?: number;
  lastChapter5Result?: import('./finalBoss').FinalResult | null;
}
