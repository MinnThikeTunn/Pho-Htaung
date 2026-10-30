// Generated candidate art; source prompts/review status are retained with the PNG originals.
// Tight individual frames, LEFT-facing source; keep ONE uniform scale across all poses.
export const FINAL_ART = {
  background: { key: 'final_hall_v1', path: '/assets/chapter5/final_hall_v1.png' },
  ugyi: { key: 'ugyi_boss_v1', path: '/assets/chapter5/ugyi_boss_v1.png' },
  cart: { key: 'treasure_cart_v1', path: '/assets/chapter5/treasure_cart_v1.png' },
  escape: { key: 'final_escape_v1', path: '/assets/chapter5/final_escape_v1.png' },
} as const;

export const UGYI_FRAMES: Record<string, { x: number; y: number; w: number; h: number; anchor: number }> = {
  guard: { x: 30, y: 80, w: 395, h: 360, anchor: .524 },
  slam_windup: { x: 485, y: 0, w: 363, h: 440, anchor: .466 },
  slam_strike: { x: 873, y: 118, w: 426, h: 322, anchor: .627 },
  rush: { x: 1368, y: 84, w: 395, h: 358, anchor: .486 },
  push: { x: 29, y: 482, w: 377, h: 370, anchor: .549 },
  recover: { x: 503, y: 484, w: 325, h: 366, anchor: .526 },
  hit: { x: 921, y: 456, w: 334, h: 396, anchor: .506 },
  defeated: { x: 1413, y: 461, w: 288, h: 392, anchor: .507 },
};

export const UGYI_SOURCE_SCALE = .26;
// Alpha>=64 body bounds plus edge padding. Registration is metadata, not pixel editing.
export const CART_FRAME = { x: 32, y: 103, w: 1474, h: 819 } as const;
