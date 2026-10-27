// Render-only source-frame metadata. Domain geometry remains in chapter3.ts.
export const SCALE_ART = {
  background: { key: 'scale_chamber_v1', path: '/assets/chapter3/scale_chamber_v1.png' },
  props: { key: 'scale_props_v1', path: '/assets/chapter3/scale_props_v1.png' },
} as const;
// Tight source bounds measured from the original atlas alpha, without resampling pixels.
export const SCALE_PROP_FRAMES: Record<string, { x: number; y: number; w: number; h: number }> = {
  stone: { x: 47, y: 111, w: 449, h: 341 },
  sandbag: { x: 587, y: 42, w: 395, h: 415 },
  crate: { x: 1083, y: 70, w: 390, h: 379 },
  treasure: { x: 141, y: 498, w: 255, h: 476 },
  gate: { x: 677, y: 490, w: 186, h: 478 },
  reference: { x: 1063, y: 636, w: 424, h: 331 },
};
