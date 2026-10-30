import Phaser from 'phaser';

export const INK = 0x182720;
export const CREAM = 0xe9dfbd;
export const GOLD = 0xe7bb55;
export const METAL = 0x839b8b;
export const WOOD = 0x9d7047;
export const STONE = 0x3b4b3d;
export const STEP_STONE = 0x6e7c66;
export const SHAN_RED = 0x8b1e28;
export const SHAN_DARK = 0x5a1219;
export const BETEL_RED = 0x9b111e;
export const BETEL_DARK = 0x5a0808;
export const ROPE = 0xc4a364;
export const ROPE_DARK = 0x8c6d3b;
export const TERRACOTTA = 0x8b3a2b;
export const TERRACOTTA_LIGHT = 0xa44c3b;
export const TEAK = 0x6a482b;
export const TEAK_LIGHT = 0x8c5e35;
export const IRON_STRAP = 0x3e4232;
export const BURLAP = 0xc0aa76;
export const BRONZE = 0x8f723c;
export const BRONZE_DARK = 0x69542a;

/**
 * Chapter 2 Signature Block Drawing Function
 * Renders crisp, hand-inked tactile geometry with CREAM bevels and optional woodgrain.
 */
export function drawBlock(
  g: Phaser.GameObjects.Graphics,
  r: { x: number; y: number; w: number; h: number },
  fill: number,
  wood = false
) {
  g.fillStyle(INK, 1).fillRoundedRect(r.x - 2, r.y - 2, r.w + 4, r.h + 4, 3);
  g.fillStyle(fill).fillRect(r.x, r.y, r.w, r.h);
  g.fillStyle(CREAM, 0.16).fillRect(r.x + 2, r.y + 2, r.w - 4, Math.min(5, r.h - 2));
  g.lineStyle(2, INK, 0.45);
  if (wood) {
    for (let x = r.x + 16; x < r.x + r.w; x += 20) g.lineBetween(x, r.y, x, r.y + r.h);
    if (r.h > 30) {
      g.fillStyle(0x4c4432)
        .fillRect(r.x - 2, r.y + 28, r.w + 4, 8)
        .fillRect(r.x - 2, r.y + r.h - 36, r.w + 4, 8);
      for (const y of [r.y + 32, r.y + r.h - 32]) {
        for (const x of [r.x + 7, r.x + r.w - 7]) {
          g.fillStyle(GOLD).fillCircle(x, y, 2);
        }
      }
    }
  } else if (r.h > 30) {
    g.lineBetween(r.x + r.w * 0.32, r.y + 18, r.x + r.w * 0.6, r.y + 23);
    g.lineBetween(r.x + r.w * 0.6, r.y + 23, r.x + r.w * 0.52, r.y + 38);
  }
}

/**
 * Renders a falling brick / rock hazard using Chapter 2's STEP_STONE / STONE vector styling.
 * Supports arbitrary (x, y, w, h) bounds.
 */
export function drawFallingBrick(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number
) {
  // Base dark ink outline
  g.fillStyle(INK, 1).fillRoundedRect(x - 2, y - 2, w + 4, h + 4, 3);
  // Main stone body
  g.fillStyle(STEP_STONE, 1).fillRect(x, y, w, h);
  // Top bevel highlight in cream
  g.fillStyle(CREAM, 0.25).fillRect(x + 2, y + 2, w - 4, Math.min(4, Math.max(1, h - 2)));
  // Subtle left highlight
  g.fillStyle(CREAM, 0.12).fillRect(x + 2, y + 2, Math.min(3, Math.max(1, w - 4)), Math.max(1, h - 4));
  // Bottom shadow bevel in darker stone
  if (h > 6) {
    g.fillStyle(STONE, 0.55).fillRect(x + 2, y + h - 4, w - 4, 2);
  }
  // Weathered tactile stone cracks & chisels
  g.lineStyle(1.5, INK, 0.55);
  if (w >= 16 && h >= 16) {
    g.lineBetween(x + w * 0.28, y + 5, x + w * 0.52, y + 9);
    g.lineBetween(x + w * 0.52, y + 9, x + w * 0.44, y + Math.min(h - 5, 18));
    if (w >= 32) {
      g.lineBetween(x + w * 0.72, y + h - 12, x + w * 0.84, y + h - 5);
    }
  }
}

/**
 * Draws a rich betel spit droplet with deep red body, dark core, and specular highlight.
 */
export function drawBetelSpit(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radius = 4
) {
  g.fillStyle(INK, 0.9).fillCircle(x, y, radius + 1);
  g.fillStyle(BETEL_RED, 1).fillCircle(x, y, radius);
  g.fillStyle(BETEL_DARK, 0.6).fillCircle(x + radius * 0.2, y + radius * 0.2, radius * 0.6);
  g.fillStyle(CREAM, 0.6).fillCircle(x - radius * 0.35, y - radius * 0.35, Math.max(1, radius * 0.35));
}

/**
 * Draws a subtle monofilament fishing line and curved iron hook.
 */
export function drawFishingLine(
  g: Phaser.GameObjects.Graphics,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  withHook = true
) {
  // Translucent dark shadow line + crisp cream nylon core
  g.lineStyle(1.5, INK, 0.35).lineBetween(startX, startY, endX, endY);
  g.lineStyle(1, CREAM, 0.85).lineBetween(startX, startY, endX, endY);

  if (withHook) {
    // Small curved fishing hook at (endX, endY)
    g.lineStyle(2, METAL, 1);
    // Vertical shank
    g.lineBetween(endX, endY - 8, endX, endY);
    // Curved bend
    g.beginPath();
    g.arc(endX + 3.5, endY, 3.5, Math.PI, 0, true);
    g.stroke();
    // Barb pointing up-left
    g.lineBetween(endX + 7, endY, endX + 4.5, endY - 3.5);
    // Shiny metallic barb highlight
    g.fillStyle(CREAM, 0.9).fillCircle(endX + 4.5, endY - 3.5, 1);
  }
}

/**
 * Creates or ensures the standalone 'ch1_vector_brick' texture exists in the scene cache.
 */
export function createBrickTexture(scene: Phaser.Scene, key = 'ch1_vector_brick', width = 48, height = 32) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 });
  drawFallingBrick(g, 2, 2, width - 4, height - 4);
  g.generateTexture(key, width, height);
  g.destroy();
}

/**
 * Draws a tightly wound hemp rope knot with diagonal fibers and frayed tail.
 */
export function drawRopeKnot(g: Phaser.GameObjects.Graphics, x: number, y: number) {
  // 3 Horizontal bound loops
  for (let i = 0; i < 3; i++) {
    const ly = y + i * 7;
    g.fillStyle(INK, 1).fillRoundedRect(x - 1, ly - 1, 18, 7, 2);
    g.fillStyle(ROPE, 1).fillRoundedRect(x, ly, 16, 5, 2);
    g.fillStyle(CREAM, 0.35).fillRect(x + 2, ly + 1, 12, 1.5);
    // Dark hemp fiber diagonals
    g.lineStyle(1, ROPE_DARK, 0.8);
    g.lineBetween(x + 3, ly + 4, x + 7, ly + 1);
    g.lineBetween(x + 8, ly + 4, x + 12, ly + 1);
  }
  // Hanging frayed tail
  g.lineStyle(2, ROPE, 1).lineBetween(x + 8, y + 21, x + 11, y + 27);
  g.lineStyle(1.5, ROPE_DARK, 0.9).lineBetween(x + 7, y + 21, x + 5, y + 26);
}

/**
 * Draws a heavy angular boulder matching STEP_STONE palette with deep crevice mouth.
 */
export function drawStuckRockCrevice(g: Phaser.GameObjects.Graphics, x: number, y: number) {
  // Heavy angular boulder matching STEP_STONE palette
  drawBlock(g, { x: x + 4, y: y + 4, w: 56, h: 34 }, STEP_STONE, false);
  // Deep dark crevice mouth where cog peeks out
  g.fillStyle(INK, 1).fillRoundedRect(x + 26, y + 24, 28, 12, 2);
  g.fillStyle(0x0c1410, 1).fillRect(x + 28, y + 26, 24, 8);
  // Crack line running up boulder face
  g.lineStyle(1.8, INK, 0.75);
  g.lineBetween(x + 32, y + 24, x + 24, y + 12);
  g.lineBetween(x + 24, y + 12, x + 36, y + 6);
}

/**
 * Generates crisp vector textures matching Chapter 2's procedural style.
 * Updates both dedicated ch1_* keys and global item-* keys so the bag and all UI
 * display the clean vector art style.
 */
export function ensureBridgeTextures(scene: Phaser.Scene, bridgeLength: number = 218) {
  const textures = scene.textures;
  const bridgeH = Math.max(120, Math.round(bridgeLength));

  // Helper to safely register/replace a texture
  const registerTexture = (key: string, width: number, height: number, drawFn: (g: Phaser.GameObjects.Graphics) => void) => {
    if (textures.exists(key)) {
      textures.remove(key);
    }
    const g = scene.make.graphics({ x: 0, y: 0 });
    drawFn(g);
    g.generateTexture(key, width, height);
    g.destroy();
  };

  // 1. Procedural Drawbridge Beam (WOOD block style)
  if (!textures.exists('ch1_vector_bridge')) {
    registerTexture('ch1_vector_bridge', 26, bridgeH, (g) => {
      const bw = 26;
      g.fillStyle(INK, 1).fillRoundedRect(0, 0, bw, bridgeH, 3);
      g.fillStyle(WOOD, 1).fillRect(2, 2, bw - 4, bridgeH - 4);
      g.fillStyle(CREAM, 0.2).fillRect(2, 2, 4, bridgeH - 4);

      // Plank score lines across length
      g.lineStyle(1.5, INK, 0.5);
      for (let y = 14; y < bridgeH - 10; y += 18) {
        g.lineBetween(2, y, bw - 2, y);
      }

      // Heavy iron cross-straps with gold rivet studs
      const strapSpacing = Math.max(45, Math.floor(bridgeH / 4));
      for (let y = 16; y < bridgeH - 12; y += strapSpacing) {
        g.fillStyle(0x4c4432, 1).fillRect(1, y, bw - 2, 7);
        g.fillStyle(GOLD, 1).fillCircle(7, y + 3.5, 2.2).fillCircle(bw - 7, y + 3.5, 2.2);
      }
    });
  }

  // 2. Procedural Rusty Cog (8-tooth brass/iron gear)
  const drawCog = (g: Phaser.GameObjects.Graphics) => {
    const cx = 22, cy = 22;

    // 8 Gear Teeth
    g.fillStyle(GOLD, 1);
    g.lineStyle(2, INK, 1);
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const tx = cx + Math.cos(a) * 15;
      const ty = cy + Math.sin(a) * 15;
      g.fillRoundedRect(tx - 3.5, ty - 3.5, 7, 7, 1.5);
      g.strokeRoundedRect(tx - 3.5, ty - 3.5, 7, 7, 1.5);
    }

    // Outer wheel
    g.fillStyle(METAL, 1).fillCircle(cx, cy, 15);
    g.lineStyle(2, INK, 1).strokeCircle(cx, cy, 15);

    // Inner brass ring
    g.fillStyle(GOLD, 1).fillCircle(cx, cy, 9.5);
    g.lineStyle(1.5, INK, 1).strokeCircle(cx, cy, 9.5);

    // Center square axle socket
    g.fillStyle(INK, 1).fillRoundedRect(cx - 3.5, cy - 3.5, 7, 7, 1.5);
  };

  registerTexture('ch1_vector_cog', 44, 44, drawCog);
  registerTexture('item-cog', 44, 44, drawCog);

  // 3. Procedural Bamboo Lever (Vertical cane for ground/winch)
  const drawBambooVertical = (g: Phaser.GameObjects.Graphics) => {
    const bw = 16, bh = 76;
    g.fillStyle(INK, 1).fillRoundedRect(2, 0, bw - 4, bh, 3);
    g.fillStyle(0xd49b38, 1).fillRect(3, 2, bw - 6, bh - 4);
    g.fillStyle(CREAM, 0.25).fillRect(4, 2, 2.5, bh - 4);

    // 3 Bamboo Ring Joints
    for (const y of [18, 38, 58]) {
      g.fillStyle(0x8a541d, 1).fillRoundedRect(1, y - 2, bw - 2, 5, 2);
      g.lineStyle(1, INK, 0.9).strokeRoundedRect(1, y - 2, bw - 2, 5, 2);
      g.fillStyle(GOLD, 0.8).fillRect(3, y - 1, bw - 6, 2);
    }
  };
  registerTexture('ch1_vector_bamboo', 16, 76, drawBambooVertical);

  // 4. Procedural Diagonal Bamboo Cane (Tailored specifically for square inventory bag slots!)
  const drawBambooDiagonal = (g: Phaser.GameObjects.Graphics) => {
    // Drawn diagonally from bottom-left (8, 36) to top-right (36, 8)
    const x1 = 8, y1 = 36;
    const x2 = 36, y2 = 8;

    // Main shaft thick line
    g.lineStyle(9, INK, 1);
    g.lineBetween(x1, y1, x2, y2);
    g.lineStyle(6, 0xd49b38, 1);
    g.lineBetween(x1, y1, x2, y2);
    g.lineStyle(1.5, CREAM, 0.35);
    g.lineBetween(x1 - 1, y1 - 1, x2 - 1, y2 - 1);

    // 3 Diagonal Ring Nodes across the length
    for (const t of [0.28, 0.52, 0.76]) {
      const nx = x1 + (x2 - x1) * t;
      const ny = y1 + (y2 - y1) * t;
      g.fillStyle(INK, 1).fillCircle(nx, ny, 5.5);
      g.fillStyle(0x8a541d, 1).fillCircle(nx, ny, 4.2);
      g.fillStyle(GOLD, 1).fillCircle(nx, ny, 2.5);
    }
  };

  registerTexture('ch1_vector_bamboo_icon', 44, 44, drawBambooDiagonal);
  registerTexture('item-bamboo-pole', 44, 44, drawBambooDiagonal);
  registerTexture('ch3_vector_bamboo_pole', 44, 44, drawBambooDiagonal);
  registerTexture('ch3_icon_bamboo_pole', 44, 44, drawBambooDiagonal);
  registerTexture('ch3_vector_rusty_cog', 44, 44, drawCog);
  registerTexture('ch3_icon_rusty_cog', 44, 44, drawCog);

  const drawBetelCutter = (g: Phaser.GameObjects.Graphics) => {
    g.lineStyle(5, INK, 1).lineBetween(10, 32, 34, 12).lineBetween(10, 14, 34, 28);
    g.lineStyle(3, METAL, 1).lineBetween(10, 32, 34, 12).lineBetween(10, 14, 34, 28);
    g.fillStyle(GOLD, 1).fillCircle(22, 21, 3.5);
    g.lineStyle(1.5, INK, 1).strokeCircle(22, 21, 3.5);
  };
  registerTexture('ch3_vector_betel_cutter', 44, 44, drawBetelCutter);
  registerTexture('ch3_icon_betel_cutter', 44, 44, drawBetelCutter);

  // Authentic Burmese Lay Khwa (လေးခွ / Slingshot)
  const drawSlingshot = (g: Phaser.GameObjects.Graphics) => {
    const cx = 22, cy = 24;
    g.lineStyle(6, INK, 1).lineBetween(cx, cy + 16, cx, cy);
    g.lineStyle(4, WOOD, 1).lineBetween(cx, cy + 16, cx, cy);
    g.lineStyle(1.5, CREAM, 0.4).lineBetween(cx - 1, cy + 16, cx - 1, cy);
    g.lineStyle(5, INK, 1).lineBetween(cx, cy, cx - 11, cy - 12);
    g.lineStyle(3.5, WOOD, 1).lineBetween(cx, cy, cx - 11, cy - 12);
    g.lineStyle(5, INK, 1).lineBetween(cx, cy, cx + 11, cy - 12);
    g.lineStyle(3.5, WOOD, 1).lineBetween(cx, cy, cx + 11, cy - 12);
    g.lineStyle(2, 0x8b1e28, 1).lineBetween(cx - 11, cy - 12, cx, cy - 4);
    g.lineStyle(2, 0x8b1e28, 1).lineBetween(cx + 11, cy - 12, cx, cy - 4);
    g.fillStyle(INK, 1).fillCircle(cx, cy - 4, 4);
    g.fillStyle(0x6e7c66, 1).fillCircle(cx, cy - 4, 3);
    g.fillStyle(CREAM, 0.6).fillCircle(cx - 1, cy - 5, 1);
  };
  registerTexture('ch2_vector_slingshot', 44, 44, drawSlingshot);
  registerTexture('ch3_vector_slingshot', 44, 44, drawSlingshot);
  registerTexture('ch3_icon_slingshot', 44, 44, drawSlingshot);
  registerTexture('item-slingshot', 44, 44, drawSlingshot);

  // Phoe Htaung Bare Hand / Clenched Fist Icon (လက်ချည်း / FISTS)
  const drawBareHand = (g: Phaser.GameObjects.Graphics) => {
    // Wrist & hemp wrist-wrap
    g.fillStyle(INK, 1).fillRoundedRect(14, 28, 16, 11, 3);
    g.fillStyle(0xc89362, 1).fillRoundedRect(15.5, 29, 13, 9, 2);
    g.fillStyle(SHAN_RED, 1).fillRect(15, 31, 14, 4);
    g.fillStyle(GOLD, 0.85).fillRect(15, 32.5, 14, 1);

    // Main clenched fist block
    g.fillStyle(INK, 1).fillRoundedRect(9, 11, 26, 20, 6);
    g.fillStyle(0xd9a574, 1).fillRoundedRect(10.5, 12.5, 23, 17, 5);
    // Specular cream highlight across top knuckles
    g.fillStyle(CREAM, 0.45).fillRoundedRect(12, 13.5, 20, 4, 2);

    // 4 Knuckle ridge dividers
    g.lineStyle(1.6, INK, 0.8);
    for (const kx of [16, 22, 28]) {
      g.lineBetween(kx, 12.5, kx, 22);
    }

    // Tucked thumb across front of fist
    g.fillStyle(INK, 1).fillRoundedRect(11, 20, 18, 8, 3.5);
    g.fillStyle(0xc89362, 1).fillRoundedRect(12.2, 21.2, 15.6, 5.6, 2.5);
    g.fillStyle(CREAM, 0.35).fillRect(13.5, 22, 12, 1.5);
  };
  registerTexture('ch4_vector_bare_hand', 44, 44, drawBareHand);
  registerTexture('item-fists', 44, 44, drawBareHand);

  // Smooth River Stone Ammo Bundle (ကျောက်ခဲ) for Diegetic Pile Grabbing
  const drawStoneBundle = (g: Phaser.GameObjects.Graphics) => {
    const pebbles: [number, number, number, number][] = [
      [15, 28, 15, 11],
      [29, 28, 15, 11],
      [22, 20, 16, 12],
    ];
    for (const [px, py, pw, ph] of pebbles) {
      g.fillStyle(INK, 1).fillEllipse(px, py, pw + 3, ph + 3);
      g.fillStyle(0x8d8c76, 1).fillEllipse(px, py, pw, ph);
      g.fillStyle(CREAM, 0.45).fillEllipse(px - 2, py - 2, pw * 0.45, ph * 0.38);
    }
  };
  registerTexture('ch4_vector_stone_bundle', 44, 44, drawStoneBundle);

  // 4b. Chapter 3 Scale Puzzle Procedural Icons & World Vector Props
  // Bagan Tile Door / Portcullis Gate (64x380px)
  registerTexture('ch3_vector_gate', 64, 380, (g) => {
    const gw = 64, gh = 380;
    // Outer INK boundary
    g.fillStyle(INK, 1).fillRect(0, 0, gw, gh);

    // 1. Weathered Teak Plank Body
    g.fillStyle(WOOD, 1).fillRect(2, 24, gw - 4, gh - 46);
    // Vertical wood plank join lines
    g.lineStyle(1.5, INK, 0.6);
    g.lineBetween(18, 24, 18, gh - 22);
    g.lineBetween(32, 24, 32, gh - 22);
    g.lineBetween(46, 24, 46, gh - 22);
    // Woodgrain scoring
    g.lineStyle(1, 0x6e4a28, 0.5);
    for (let y = 30; y < gh - 30; y += 16) {
      g.lineBetween(4, y, 16, y + 3);
      g.lineBetween(34, y + 5, 44, y + 2);
    }

    // 2. Terracotta Roof Tile Eaves (အုတ်ကြွပ်အမိုး / ပုဂံအမိုးကြွပ်ပြားစတိုင်)
    // Tiered terracotta eave brackets
    g.fillStyle(0x5c2318, 1).fillRect(1, 2, gw - 2, 22);
    g.fillStyle(0x8b3a2b, 1).fillRect(3, 4, gw - 6, 18);
    g.fillStyle(0xa44c3b, 1).fillRect(5, 5, gw - 10, 8);
    g.fillStyle(CREAM, 0.4).fillRect(5, 5, gw - 10, 2);
    // Eave tile scallops
    for (let x = 6; x < gw - 8; x += 10) {
      g.fillStyle(0x5c2318, 1).fillCircle(x + 5, 22, 5);
      g.fillStyle(0x8b3a2b, 1).fillCircle(x + 5, 21, 4);
      g.fillStyle(CREAM, 0.35).fillCircle(x + 4, 20, 1.5);
    }
    // Heavy wrought iron suspension ring at top center
    g.fillStyle(INK, 1).fillCircle(32, 8, 7);
    g.fillStyle(0x6e786b, 1).fillCircle(32, 8, 5);
    g.fillStyle(INK, 1).fillCircle(32, 8, 2.5);

    // 3. Horizontal Iron Cross-Straps & Diamond-Faceted Golden Rivets
    for (let y = 36; y < gh - 40; y += 28) {
      // Dark iron band
      g.fillStyle(INK, 1).fillRect(1, y, gw - 2, 9);
      g.fillStyle(0x3e4232, 1).fillRect(2, y + 1, gw - 4, 7);
      g.fillStyle(CREAM, 0.22).fillRect(2, y + 1, gw - 4, 1.5);
      // Dual golden brass rivet studs
      g.fillStyle(GOLD, 1).fillCircle(10, y + 4.5, 2.5).fillCircle(gw - 10, y + 4.5, 2.5);
      g.fillStyle(CREAM, 0.8).fillCircle(9.5, y + 4, 1).fillCircle(gw - 10.5, y + 4, 1);
    }

    // 4. Central Decorative Iron Spine with Bagan Geometric Relief
    g.fillStyle(INK, 1).fillRect(28, 24, 8, gh - 46);
    g.fillStyle(0x2d3227, 1).fillRect(29, 24, 6, gh - 46);
    g.fillStyle(CREAM, 0.18).fillRect(29, 24, 2, gh - 46);

    // 5. Bottom Portcullis Wedge Teeth (Iron spikes at threshold)
    for (let x = 2; x < gw - 6; x += 12) {
      g.fillStyle(INK, 1).fillTriangle(x, gh - 22, x + 12, gh - 22, x + 6, gh);
      g.fillStyle(0x566050, 1).fillTriangle(x + 1.5, gh - 22, x + 10.5, gh - 22, x + 6, gh - 2);
      g.fillStyle(CREAM, 0.4).lineStyle(1, CREAM, 0.4).lineBetween(x + 6, gh - 20, x + 6, gh - 4);
    }
  });

  // Pin: Drawn diagonally from (8, 36) to (36, 8) per Core Design System
  const drawPinFn = (g: Phaser.GameObjects.Graphics) => {
    g.lineStyle(7, INK, 1).lineBetween(8, 36, 36, 8);
    g.lineStyle(4.5, METAL, 1).lineBetween(8, 36, 36, 8);
    g.lineStyle(1.8, CREAM, 0.9).lineBetween(9, 35, 35, 9);
    // Brass ring head
    g.fillStyle(INK, 1).fillCircle(36, 8, 5.5);
    g.fillStyle(GOLD, 1).fillCircle(36, 8, 4);
    g.fillStyle(INK, 1).fillCircle(36, 8, 2);
    g.fillStyle(CREAM, 0.8).fillCircle(35, 7, 1);
  };
  registerTexture('ch3_icon_pin', 44, 44, drawPinFn);
  registerTexture('ch3_vector_pin', 44, 44, drawPinFn);
  registerTexture('item-pin', 44, 44, drawPinFn);

  // Stone Weight (3 ပိဿာ)
  const drawStoneFn = (g: Phaser.GameObjects.Graphics, w = 44, h = 38) => {
    drawBlock(g, { x: 3, y: 5, w: w - 6, h: h - 8 }, STEP_STONE);
    // Top cream highlight bevel
    g.fillStyle(CREAM, 0.4).fillRect(5, 7, w - 10, 2.5);

    // Heavy iron mooring ring loop at top
    g.fillStyle(INK, 1).fillCircle(w / 2, 5, 5);
    g.fillStyle(METAL, 1).fillCircle(w / 2, 5, 3.5);
    g.fillStyle(INK, 1).fillCircle(w / 2, 5, 1.8);
    g.fillStyle(CREAM, 0.8).fillCircle(w / 2 - 1, 4, 0.8);

    // Deeply chiseled debossed Burmese numeral (၃) in center
    g.lineStyle(2.5, INK, 0.95);
    g.beginPath();
    g.arc(w / 2, h / 2 - 2, 4.5, -Math.PI / 2, Math.PI / 2, false);
    g.stroke();
    g.beginPath();
    g.arc(w / 2, h / 2 + 6, 5, -Math.PI / 2, Math.PI / 2, false);
    g.stroke();

    g.lineStyle(1.5, GOLD, 0.85);
    g.beginPath();
    g.arc(w / 2 - 0.5, h / 2 - 2.5, 3.5, -Math.PI / 2, Math.PI / 2, false);
    g.stroke();
    g.beginPath();
    g.arc(w / 2 - 0.5, h / 2 + 5.5, 4, -Math.PI / 2, Math.PI / 2, false);
    g.stroke();

    // 3 Debossed weight indicator pips
    g.fillStyle(INK, 1).fillCircle(11, h / 2 + 3, 2).fillCircle(w / 2, h - 8, 2).fillCircle(w - 11, h / 2 + 3, 2);
    g.fillStyle(CREAM, 0.8).fillCircle(11, h / 2 + 2.5, 1).fillCircle(w / 2, h - 8.5, 1).fillCircle(w - 11, h / 2 + 2.5, 1);

    // Weathered fissure crack
    g.lineStyle(1.5, INK, 0.6).lineBetween(8, 10, 14, 17).lineBetween(14, 17, 11, 25);
  };
  registerTexture('ch3_icon_stone', 44, 44, (g) => drawStoneFn(g, 44, 44));
  registerTexture('ch3_vector_stone', 44, 38, (g) => drawStoneFn(g, 44, 38));

  // Timber Crate (4 ပိဿာ)
  const drawCrateFn = (g: Phaser.GameObjects.Graphics, w = 44, h = 40) => {
    drawBlock(g, { x: 3, y: 3, w: w - 6, h: h - 6 }, WOOD);
    // Horizontal teak plank join lines
    g.lineStyle(1.8, INK, 0.65).lineBetween(4, 15, w - 4, 15).lineBetween(4, 26, w - 4, 26);
    g.lineStyle(1, 0x6e4a28, 0.5).lineBetween(6, 9, 22, 9).lineBetween(22, 20, 38, 20).lineBetween(8, 31, 26, 31);

    // Diagonal cross-brace timbers with cream highlight
    g.lineStyle(2.5, INK, 0.7).lineBetween(6, 6, w - 6, h - 6).lineBetween(w - 6, 6, 6, h - 6);
    g.lineStyle(1.5, 0x6e4a28, 1).lineBetween(6, 6, w - 6, h - 6).lineBetween(w - 6, 6, 6, h - 6);
    g.lineStyle(1, CREAM, 0.45).lineBetween(7, 5, w - 5, h - 7);

    // Corner reinforcement iron brackets with gold nail studs
    const corners: [number, number][] = [[6, 6], [w - 6, 6], [6, h - 6], [w - 6, h - 6]];
    for (const [cx, cy] of corners) {
      g.fillStyle(INK, 1).fillCircle(cx, cy, 3.5);
      g.fillStyle(GOLD, 1).fillCircle(cx, cy, 2.2);
      g.fillStyle(CREAM, 0.8).fillCircle(cx - 0.5, cy - 0.5, 0.8);
    }

    // Stamped Burmese weight numeral (၄) in center medallion
    g.fillStyle(INK, 0.7).fillCircle(w / 2, h / 2, 7);
    g.lineStyle(1.8, GOLD, 0.9).strokeCircle(w / 2, h / 2, 4.5);
    g.lineStyle(1.5, GOLD, 0.9).lineBetween(w / 2 + 3, h / 2 - 3, w / 2 + 6, h / 2 - 6);
  };
  registerTexture('ch3_icon_crate', 44, 44, (g) => drawCrateFn(g, 44, 44));
  registerTexture('ch3_vector_crate', 44, 40, (g) => drawCrateFn(g, 44, 40));

  // Sandbag (3 ပိဿာ)
  const drawSandbagFn = (g: Phaser.GameObjects.Graphics, w = 44, h = 40) => {
    // Outer INK boundary
    g.fillStyle(INK, 1).fillRoundedRect(5, 10, w - 10, h - 14, 8);
    // Rich burlap hemp fill
    g.fillStyle(0xc0aa76, 1).fillRoundedRect(6, 11, w - 12, h - 16, 7);
    // Cream highlight on front belly
    g.fillStyle(CREAM, 0.35).fillEllipse(w / 2, h / 2 + 3, w / 3, h / 4);
    // Burlap crosshatch lines
    g.lineStyle(1, 0x937c4d, 0.45);
    for (let y = 14; y < h - 8; y += 6) g.lineBetween(9, y, w - 9, y);
    for (let x = 11; x < w - 9; x += 7) g.lineBetween(x, 14, x, h - 8);

    // Stamped Burmese weight numeral (၃) in center
    g.lineStyle(1.5, 0x6e5730, 0.75);
    g.beginPath();
    g.arc(w / 2, h / 2 + 1, 3.5, -Math.PI / 2, Math.PI / 2, false);
    g.stroke();
    g.beginPath();
    g.arc(w / 2, h / 2 + 7, 4, -Math.PI / 2, Math.PI / 2, false);
    g.stroke();

    // Tied neck & twine knot with hanging tassel
    g.fillStyle(INK, 1).fillEllipse(w / 2, 10, 16, 7);
    g.fillStyle(0x8c6d3b, 1).fillEllipse(w / 2, 10, 13, 5);
    g.fillStyle(GOLD, 1).fillCircle(w / 2, 9, 2.5);
    g.lineStyle(1.8, INK, 0.9).lineBetween(w / 2 - 4, 4, w / 2, 9).lineBetween(w / 2 + 4, 4, w / 2, 9);
    g.lineStyle(1, CREAM, 0.6).lineBetween(w / 2 - 3, 5, w / 2, 8);
    // Hanging frayed hemp twine tassel
    g.lineStyle(1.5, 0x8c6d3b, 0.9).lineBetween(w / 2, 11, w / 2 - 5, 18);
    g.lineStyle(1, 0xc0aa76, 0.9).lineBetween(w / 2, 11, w / 2 - 3, 19);
  };
  registerTexture('ch3_icon_sandbag', 44, 44, (g) => drawSandbagFn(g, 44, 44));
  registerTexture('ch3_vector_sandbag', 44, 40, (g) => drawSandbagFn(g, 44, 40));

  // Golden Statue (ရွှေရုပ် 7 ပိဿာ)
  const drawTreasureFn = (g: Phaser.GameObjects.Graphics, w = 36, h = 52) => {
    const cx = w / 2;
    // 1. Radiant Aureole / Halo (ရောင်ခြည်တော်)
    g.fillStyle(GOLD, 0.22).fillCircle(cx, 16, 16);
    g.fillStyle(GOLD, 0.35).fillCircle(cx, 16, 12);
    // Halo rays
    g.lineStyle(1.5, GOLD, 0.75);
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
      g.lineBetween(cx + Math.cos(a) * 11, 16 + Math.sin(a) * 11, cx + Math.cos(a) * 16, 16 + Math.sin(a) * 16);
    }
    // Specular halo sparkles
    g.fillStyle(CREAM, 0.8).fillCircle(cx - 9, 10, 1.2).fillCircle(cx + 9, 10, 1.2);

    // 2. Head & Ushnisha Crown
    g.fillStyle(INK, 1).fillCircle(cx, 15, 7.5);
    g.fillStyle(GOLD, 1).fillCircle(cx, 15, 6);
    g.fillStyle(CREAM, 0.7).fillCircle(cx - 1.5, 13.5, 2);
    g.fillStyle(GOLD, 1).fillTriangle(cx - 2, 9, cx + 2, 9, cx, 5);
    g.fillStyle(CREAM, 0.8).fillCircle(cx, 4.5, 1);

    // 3. Torso & Robes (Dhyana Mudra Meditation Pose)
    g.fillStyle(INK, 1).fillRoundedRect(cx - 9, 20, 18, 17, 4);
    g.fillStyle(0xd4af37, 1).fillRoundedRect(cx - 8, 21, 16, 15, 3.5);
    g.fillStyle(CREAM, 0.45).fillRect(cx - 7, 22, 4, 12);
    // Golden robe sash (ဧကသီ)
    g.lineStyle(1.5, 0xb8860b, 0.9).lineBetween(cx - 6, 21, cx + 7, 34);

    // 4. Crossed Lotus Legs
    g.fillStyle(INK, 1).fillRoundedRect(cx - 13, 34, 26, 8, 3.5);
    g.fillStyle(GOLD, 1).fillRoundedRect(cx - 12, 35, 24, 6, 2.5);
    g.fillStyle(CREAM, 0.6).fillRect(cx - 10, 35, 20, 2);

    // 5. Tiered Lotus Pedestal (ကြာပလ္လင်)
    g.fillStyle(INK, 1).fillRoundedRect(cx - 16, 41, 32, 10, 3);
    g.fillStyle(0x996515, 1).fillRoundedRect(cx - 15, 42, 30, 8, 2);
    g.fillStyle(GOLD, 1).fillRect(cx - 14, 43, 28, 3);
    g.fillStyle(CREAM, 0.7).fillRect(cx - 14, 43, 28, 1);
    // Lotus petal indentations
    for (let px = cx - 12; px <= cx + 12; px += 6) {
      g.fillStyle(0x5a3d0b, 1).fillCircle(px, 47, 1.8);
      g.fillStyle(GOLD, 0.9).fillCircle(px, 46.5, 1);
    }
  };
  registerTexture('ch3_icon_treasure', 44, 44, (g) => drawTreasureFn(g, 44, 44));
  registerTexture('ch3_vector_treasure', 36, 52, (g) => drawTreasureFn(g, 36, 52));

  // 10-Peittha Cast Bronze Reference Weight (50x40px)
  registerTexture('ch3_vector_reference', 50, 40, (g) => {
    // Bell shape body with stepped pedestal
    g.fillStyle(INK, 1).fillRoundedRect(5, 12, 40, 26, 5);
    g.fillStyle(0x69542a, 1).fillRoundedRect(6, 13, 38, 24, 4);
    g.fillStyle(0x8f723c, 1).fillRoundedRect(8, 15, 34, 12, 3);
    g.fillStyle(CREAM, 0.35).fillRect(9, 15, 32, 2);
    // Carrying handle at top
    g.fillStyle(INK, 1).fillCircle(25, 8, 6);
    g.fillStyle(0x8f723c, 1).fillCircle(25, 8, 4.5);
    g.fillStyle(INK, 1).fillCircle(25, 8, 2);
    // Debossed 10-peittha mark
    g.fillStyle(INK, 0.8).fillCircle(20, 26, 2.5).fillCircle(30, 26, 2.5);
  });

  // 5. Procedural Clue Stele (Dark sandstone with cream chalk diagram)
  if (!textures.exists('ch1_vector_stele')) {
    registerTexture('ch1_vector_stele', 130, 80, (g) => {
      const sw = 130, sh = 80;

      // Stone tablet block
      drawBlock(g, { x: 4, y: 4, w: sw - 8, h: sh - 8 }, 0x22352b);

      // Cream Chalk Etched Schematic Lines
      g.lineStyle(2, CREAM, 0.85);

      // Cog Circle with 6 tick teeth
      const gx = 36, gy = 32;
      g.strokeCircle(gx, gy, 12);
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        g.lineBetween(gx + Math.cos(a) * 12, gy + Math.sin(a) * 16, gx + Math.cos(a) * 16, gy + Math.sin(a) * 16);
      }

      // Lever arm slotted into cog
      g.lineBetween(gx, gy, gx + 22, gy - 16);
      g.fillStyle(GOLD, 1).fillCircle(gx, gy, 3);

      // Clockwise arrow arc around gear
      g.beginPath();
      g.arc(gx, gy, 19, -0.4, 1.2, false);
      g.stroke();
      g.fillStyle(CREAM, 0.85).fillTriangle(gx + 12, gy + 17, gx + 20, gy + 14, gx + 15, gy + 22);

      // Horizontal Bridge representation with downward swing arrow
      g.lineStyle(2.5, CREAM, 0.85);
      g.lineBetween(68, 60, 116, 60); // Lowered bridge
      g.lineStyle(1.5, CREAM, 0.5);
      g.lineBetween(68, 60, 68, 22);  // Upright bridge
      // Arc arrow from upright to flat
      g.beginPath();
      g.arc(68, 60, 28, -Math.PI / 2, 0, false);
      g.stroke();

      // Alternate Wall clue arrow pointing left (<-)
      g.lineStyle(2, GOLD, 0.9);
      g.lineBetween(14, 60, 24, 60);
      g.lineBetween(14, 60, 18, 56);
      g.lineBetween(14, 60, 18, 64);
    });
  }

  // 6. Procedural Trap Block (64x64)
  registerTexture('ch1-trap-block', 64, 64, (g) => {
    drawBlock(g, { x: 2, y: 2, w: 60, h: 60 }, STEP_STONE);
    g.lineStyle(2, INK, 0.6).strokeRect(8, 8, 48, 48);
  });

  // 7. Procedural Shiny Coin Bait (48x48)
  registerTexture('coin-bait', 48, 48, (g) => {
    const cx = 24, cy = 24;
    g.fillStyle(INK, 1).fillCircle(cx, cy, 20);
    g.fillStyle(GOLD, 1).fillCircle(cx, cy, 18);
    g.fillStyle(0xfde047, 1).fillCircle(cx, cy, 14);
    g.lineStyle(2, INK, 0.8).strokeCircle(cx, cy, 14);
    g.fillStyle(CREAM, 0.7).fillCircle(cx - 5, cy - 5, 4);
    // Center diamond symbol
    g.fillStyle(INK, 1).fillTriangle(cx, cy - 7, cx + 7, cy, cx, cy + 7);
    g.fillTriangle(cx, cy - 7, cx - 7, cy, cx, cy + 7);
  });

  // 8. Procedural Falling Brick / Stone Block (48x32)
  const drawBrickTextureFn = (g: Phaser.GameObjects.Graphics) => {
    drawFallingBrick(g, 2, 2, 44, 28);
  };
  registerTexture('ch1_vector_brick', 48, 32, drawBrickTextureFn);
  registerTexture('item-falling-brick', 48, 32, drawBrickTextureFn);

  // 9. Betel Spit Droplet Particle Texture (12x12)
  const drawBetelTextureFn = (g: Phaser.GameObjects.Graphics) => {
    drawBetelSpit(g, 6, 6, 4.5);
  };
  registerTexture('ch1_betel_drop', 12, 12, drawBetelTextureFn);
  registerTexture('betel-spit', 12, 12, drawBetelTextureFn);

  // 10. Fishing Hook Texture (16x24)
  registerTexture('ch1_fishing_hook', 16, 24, (g) => {
    drawFishingLine(g, 4, 0, 4, 16, true);
  });

  // 11. Procedural Ancient Beehive (36x44)
  registerTexture('ch1_vector_beehive', 36, 44, (g) => {
    const cx = 18;
    // Ink outline & shadow
    g.fillStyle(INK, 1).fillEllipse(cx, 22, 17, 21);

    // 5 Organic concentric woven tiers (Golden amber straw)
    const tiers = [
      { y: 8, rx: 8, ry: 5, col: 0xd97706 },
      { y: 14, rx: 12, ry: 6, col: 0xb45309 },
      { y: 21, rx: 15, ry: 7, col: 0xd97706 },
      { y: 28, rx: 13, ry: 6, col: 0xb45309 },
      { y: 35, rx: 9, ry: 5, col: 0x92400e }
    ];

    for (const t of tiers) {
      g.fillStyle(t.col, 1).fillEllipse(cx, t.y, t.rx, t.ry);
      g.fillStyle(CREAM, 0.25).fillEllipse(cx - 2, t.y - 1, t.rx * 0.7, t.ry * 0.4);
      g.lineStyle(1.2, INK, 0.6).strokeEllipse(cx, t.y, t.rx, t.ry);
    }

    // Bee entrance hole (dark hollow)
    g.fillStyle(INK, 1).fillCircle(cx, 27, 4);
    g.fillStyle(0x451a03, 1).fillCircle(cx, 26, 3);

    // Golden honey drip on bottom right
    g.fillStyle(GOLD, 1).fillCircle(cx + 4, 38, 3);
    g.fillStyle(0xfde047, 0.9).fillCircle(cx + 3.5, 37.5, 1.5);
  });

  // 12. Procedural Swarm Bee (16x16)
  registerTexture('ch1_vector_bee', 16, 16, (g) => {
    const cx = 8, cy = 8;
    // Translucent fluttering wings
    g.fillStyle(CREAM, 0.75).fillEllipse(cx - 3, cy - 4, 4, 2.5);
    g.fillStyle(CREAM, 0.75).fillEllipse(cx + 3, cy - 4, 4, 2.5);
    g.lineStyle(0.8, INK, 0.5).strokeEllipse(cx - 3, cy - 4, 4, 2.5);
    g.lineStyle(0.8, INK, 0.5).strokeEllipse(cx + 3, cy - 4, 4, 2.5);

    // Bee abdomen with yellow and black alternating stripes
    g.fillStyle(INK, 1).fillEllipse(cx, cy, 6, 4.5);
    g.fillStyle(GOLD, 1).fillEllipse(cx, cy, 5, 3.5);
    g.fillStyle(INK, 1).fillRect(cx - 2, cy - 3, 1.5, 6);
    g.fillStyle(INK, 1).fillRect(cx + 1, cy - 3, 1.5, 6);

    // Stinger & eyes
    g.fillStyle(INK, 1).fillTriangle(cx - 5, cy, cx - 3, cy - 1.5, cx - 3, cy + 1.5);
    g.fillStyle(INK, 1).fillCircle(cx + 4, cy - 1, 1);
  });

  // 13. Procedural Mud Patch (120x24)
  registerTexture('ch1_vector_mud_patch', 120, 24, (g) => {
    // Deep dark mud base outline
    g.fillStyle(INK, 1).fillRoundedRect(2, 2, 116, 20, 8);
    // Rich wet earth brown
    g.fillStyle(0x3e2723, 1).fillRoundedRect(4, 4, 112, 16, 6);
    // Darker viscous mud center
    g.fillStyle(0x271915, 0.85).fillEllipse(60, 13, 48, 6);
    // Wet highlights and bubble rings
    g.fillStyle(0x5d4037, 0.6).fillEllipse(40, 10, 20, 3.5);
    g.fillStyle(0x5d4037, 0.6).fillEllipse(80, 11, 24, 4);
    g.fillStyle(CREAM, 0.25).fillCircle(38, 9, 2);
    g.fillStyle(CREAM, 0.25).fillCircle(82, 10, 2.5);
    g.fillStyle(CREAM, 0.3).fillCircle(62, 14, 1.5);
  });

  // 14. Procedural Wild Beeswax Item (40x40)
  registerTexture('ch1_vector_beeswax', 40, 40, (g) => {
    const cx = 20, cy = 20;
    // Ink boundary
    g.fillStyle(INK, 1).fillRoundedRect(4, 4, 32, 32, 6);
    // Rich golden amber wax cake
    g.fillStyle(GOLD, 1).fillRoundedRect(6, 6, 28, 28, 4);
    g.fillStyle(0xfde047, 0.4).fillRect(8, 8, 24, 4);

    // Hexagonal honeycomb cell deboss details
    g.lineStyle(1.5, 0xb45309, 0.8);
    const hex = (hx: number, hy: number, r: number) => {
      g.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        const px = hx + Math.cos(a) * r;
        const py = hy + Math.sin(a) * r;
        if (i === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.closePath();
      g.stroke();
    };
    hex(15, 16, 4.5);
    hex(24, 16, 4.5);
    hex(19.5, 24, 4.5);
  });

  // 15. Procedural Tied Hemp Rope Knot (24x28)
  registerTexture('ch1_vector_rope_knot', 24, 28, (g) => {
    drawRopeKnot(g, 4, 1);
  });

  // 16. Procedural Wedged Rock Crevice Prop (64x42)
  registerTexture('ch1_vector_stuck_rock', 64, 42, (g) => {
    drawStuckRockCrevice(g, 0, 0);
  });

  // 17. Procedural Floating Stone Platform (120x24)
  registerTexture('ch1_vector_floating_platform', 120, 24, (g) => {
    drawFloatingPlatform(g, 2, 2, 116, 20);
  });

  // 18. Procedural Collapsible Trap Floor Slab (90x24)
  registerTexture('ch1_vector_trap_floor', 90, 24, (g) => {
    drawTrapFloor(g, 2, 2, 86, 20);
  });

  // 19. Procedural Myanmar Traditional Bag (Lwe-Ait) (64x80)
  registerTexture('myanmar_traditional_bag', 64, 80, (g) => {
    drawMyanmarTraditionalBag(g, 7, 2, 50, 76);
  });
}

/**
 * Draws a collapsible stone trapdoor slab matching STEP_STONE palette with hairline fractures.
 */
export function drawTrapFloor(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number
) {
  // Outer ink border
  g.fillStyle(INK, 1).fillRoundedRect(x - 2, y - 2, w + 4, h + 4, 3);
  // Main stone slab body
  g.fillStyle(STEP_STONE, 1).fillRect(x, y, w, h);
  // Top bevel highlight in cream
  g.fillStyle(CREAM, 0.22).fillRect(x + 2, y + 2, w - 4, Math.min(4, h - 2));
  // Dark bottom shadow bevel
  if (h > 6) {
    g.fillStyle(STONE, 0.55).fillRect(x + 2, y + h - 4, w - 4, 2);
  }
  // Subtle hairline cracks / fissures indicating a weak collapsible mechanism
  g.lineStyle(1.2, INK, 0.55);
  g.lineBetween(x + w * 0.25, y + 3, x + w * 0.32, y + h * 0.6);
  g.lineBetween(x + w * 0.32, y + h * 0.6, x + w * 0.28, y + h - 3);
  g.lineBetween(x + w * 0.65, y + 2, x + w * 0.60, y + h * 0.5);
  g.lineBetween(x + w * 0.60, y + h * 0.5, x + w * 0.72, y + h - 2);
  // Faint separation seams near the edges
  g.lineStyle(1, 0x172820, 0.4);
  g.lineBetween(x + 4, y + 2, x + 4, y + h - 2);
  g.lineBetween(x + w - 4, y + 2, x + w - 4, y + h - 2);
}

/**
 * Draws a floating stone platform aligned with Chapter 2's signature STEP_STONE vector styling.
 */
export function drawFloatingPlatform(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number
) {
  // Outer ink border with rounded corners
  g.fillStyle(INK, 1).fillRoundedRect(x - 2, y - 2, w + 4, h + 4, 4);
  // Main stone slab body
  g.fillStyle(STEP_STONE, 1).fillRoundedRect(x, y, w, h, 3);
  // Top cream bevel highlight
  g.fillStyle(CREAM, 0.28).fillRect(x + 2, y + 2, w - 4, Math.min(4, Math.max(1, h - 2)));
  // Left edge highlight
  g.fillStyle(CREAM, 0.15).fillRect(x + 2, y + 2, Math.min(3, Math.max(1, w - 4)), Math.max(1, h - 4));
  // Dark bottom shadow bevel
  if (h > 6) {
    g.fillStyle(STONE, 0.6).fillRect(x + 2, y + h - 4, w - 4, 2);
  }
  // Subtle Bagan stone fissure lines
  g.lineStyle(1.5, INK, 0.45);
  g.lineBetween(x + w * 0.28, y + 4, x + w * 0.34, y + h - 6);
  g.lineBetween(x + w * 0.68, y + 4, x + w * 0.64, y + h - 5);
  // Subtle ancient Bagan gold glyph / fossil stud
  g.fillStyle(GOLD, 0.65).fillCircle(x + w * 0.5, y + h * 0.5, 2.5);
  g.lineStyle(1, INK, 0.7).strokeCircle(x + w * 0.5, y + h * 0.5, 2.5);
}

/**
 * Draws sharp procedural ceiling spikes across the cavern ceiling.
 */
export function drawCeilingSpikes(g: Phaser.GameObjects.Graphics, width: number) {
  g.clear();
  // Spikes base plate
  drawBlock(g, { x: 0, y: 0, w: width, h: 22 }, STONE);

  // Sharp steel/flint downward spikes
  const spikeWidth = 24;
  const spikeHeight = 32;
  const count = Math.ceil(width / spikeWidth);

  for (let i = 0; i < count; i++) {
    const x = i * spikeWidth;
    g.fillStyle(INK, 1);
    g.fillTriangle(x - 1, 20, x + spikeWidth + 1, 20, x + spikeWidth / 2, 20 + spikeHeight + 2);
    g.fillStyle(METAL, 1);
    g.fillTriangle(x, 22, x + spikeWidth, 22, x + spikeWidth / 2, 20 + spikeHeight);
    g.fillStyle(CREAM, 0.4);
    g.fillTriangle(x + 2, 22, x + spikeWidth / 2, 22, x + spikeWidth / 2, 20 + spikeHeight);
  }
}

/**
 * Draws Chapter 1's terrain and architecture in Chapter 2's exact vector style.
 */
export function drawBridgeTerrain(
  g: Phaser.GameObjects.Graphics,
  leftWidth: number,
  pitWidth: number,
  rightX: number,
  rightWidth: number,
  groundY: number,
  trap?: { startX: number; endX: number }
) {
  g.clear();

  // 1. Left Platform (0 to leftWidth)
  drawBlock(g, { x: 0, y: groundY, w: leftWidth, h: 144 }, STONE);
  g.fillStyle(0x8e9470, 1).fillRect(0, groundY, leftWidth, 7);
  for (let x = 0; x < leftWidth; x += 92) {
    g.lineStyle(1, 0x172820, 0.5).lineBetween(x, groundY + 10, x + 12, groundY + 144);
  }

  // 2. Right Platform (rightX to rightX + rightWidth)
  if (trap && trap.startX > rightX && trap.endX < rightX + rightWidth) {
    // 2a. Landing Shelf: rightX to trap.startX
    const shelfWidth = trap.startX - rightX;
    drawBlock(g, { x: rightX, y: groundY, w: shelfWidth, h: 144 }, STONE);
    g.fillStyle(0x8e9470, 1).fillRect(rightX, groundY, shelfWidth, 7);
    for (let x = rightX; x < trap.startX; x += 92) {
      g.lineStyle(1, 0x172820, 0.5).lineBetween(x, groundY + 10, x + 12, groundY + 144);
    }

    // 2b. Trap Void under trapdoor
    const trapW = trap.endX - trap.startX;
    g.fillStyle(0x0e1713, 0.95).fillRect(trap.startX, groundY, trapW, 144);
    // Beveled inner ledge corners
    g.fillStyle(INK, 1).fillRect(trap.startX - 2, groundY, 3, 144);
    g.fillStyle(INK, 1).fillRect(trap.endX - 1, groundY, 3, 144);

    // 2c. Exit Ledge: trap.endX to rightX + rightWidth
    const exitWidth = rightX + rightWidth - trap.endX;
    drawBlock(g, { x: trap.endX, y: groundY, w: exitWidth, h: 144 }, STONE);
    g.fillStyle(0x8e9470, 1).fillRect(trap.endX, groundY, exitWidth, 7);
    for (let x = trap.endX; x < rightX + rightWidth; x += 92) {
      g.lineStyle(1, 0x172820, 0.5).lineBetween(x, groundY + 10, x + 12, groundY + 144);
    }
  } else {
    // Default continuous platform
    drawBlock(g, { x: rightX, y: groundY, w: rightWidth, h: 144 }, STONE);
    g.fillStyle(0x8e9470, 1).fillRect(rightX, groundY, rightWidth, 7);
    for (let x = rightX; x < rightX + rightWidth; x += 92) {
      g.lineStyle(1, 0x172820, 0.5).lineBetween(x, groundY + 10, x + 12, groundY + 144);
    }

    // Subtle hairline fissure stress cracks along collapsible slab [1030..1120]
    // Organic tell for attentive speedrunners/players
    g.lineStyle(1, 0x182720, 0.55);
    // Left fracture edge at 1030
    g.beginPath();
    g.moveTo(1030, groundY);
    g.lineTo(1032, groundY + 8);
    g.lineTo(1029, groundY + 18);
    g.lineTo(1031, groundY + 32);
    g.strokePath();

    // Center micro-fracture beneath bait coin at 1075
    g.beginPath();
    g.moveTo(1075, groundY);
    g.lineTo(1073, groundY + 6);
    g.lineTo(1076, groundY + 14);
    g.lineTo(1074, groundY + 24);
    g.strokePath();

    // Right fracture edge at 1120
    g.beginPath();
    g.moveTo(1120, groundY);
    g.lineTo(1118, groundY + 10);
    g.lineTo(1121, groundY + 22);
    g.strokePath();

    // Subtle cream highlight bevel accents along fracture edges
    g.lineStyle(1, CREAM, 0.35);
    g.beginPath();
    g.moveTo(1031, groundY + 2);
    g.lineTo(1033, groundY + 9);
    g.moveTo(1076, groundY + 1);
    g.lineTo(1074, groundY + 7);
    g.moveTo(1121, groundY + 2);
    g.lineTo(1119, groundY + 11);
    g.strokePath();
  }

  // 3. Pit Chasm Void (Between leftWidth and rightX)
  // Deep subterranean void fill
  g.fillStyle(0x0e1713, 0.95).fillRect(leftWidth, groundY, pitWidth, 144);
  // Beveled cliff ledge corners
  g.fillStyle(INK, 1).fillRect(leftWidth - 3, groundY, 4, 144);
  g.fillStyle(INK, 1).fillRect(rightX - 1, groundY, 4, 144);

  // 4. Right Cave Exit Gateway (Identical to Chapter 2's exit portal)
  g.fillStyle(0xb8b782, 0.09).fillRoundedRect(1214, groundY - 174, 64, 200, 25);
  for (let i = 0; i < 5; i++) {
    g.fillStyle(i % 2 ? 0xb0b082 : 0x8a9a79, 0.6)
      .fillRect(1220 + i * 9, groundY + 18 - i * 8, 60 - i * 9, 8 + i * 8);
  }
  g.lineStyle(3, GOLD, 0.7)
    .lineBetween(1230, groundY - 60, 1261, groundY - 60)
    .lineBetween(1252, groundY - 69, 1261, groundY - 60)
    .lineBetween(1252, groundY - 51, 1261, groundY - 60);
}

/**
 * Authentic Myanmar / Kachin-Naga Traditional Bag (Lwe-Ait - လွယ်အိတ်)
 * Faithful to reference/images.jpg:
 * - Broad charcoal-black woven strap loop
 * - Deep crimson 3-panel pouch body
 * - Upper multi-color embroidered cross-stitches (green, gold, cyan, magenta)
 * - Golden zigzag wave chevron band with cream tracking lines
 * - 3 rows of polished silver dome conchos (ခလုတ် / ငွေကြယ်သီး) with specular gleams
 * - 5 dangling clusters of metallic silver tube bells / cone pendants (ငွေခေါင်းလောင်းသီးများ)
 * - Black-and-white woven striped lower trim on left & right flanks
 * - Twin bunches of fine black thread tassels (ချည်မြိတ်) hanging from bottom corners
 */
export function drawMyanmarTraditionalBag(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const strapH = Math.round(h * 0.28);
  const bagY = y + strapH;
  const bagH = Math.round(h * 0.52);
  const tasselBottomY = y + h;

  // 1. Broad Charcoal-Black Woven Shoulder Strap Loop
  const strapLeft = x + Math.round(w * 0.08);
  const strapRight = x + w - Math.round(w * 0.08);
  const strapW = Math.round(w * 0.20);
  const strapTopY = y + 2;

  // Outer ink outline for strap
  g.fillStyle(INK, 1);
  g.fillRect(strapLeft - 1.5, strapTopY - 1, strapW + 3, strapH + 4);
  g.fillRect(strapRight - strapW - 1.5, strapTopY - 1, strapW + 3, strapH + 4);
  g.fillRect(strapLeft - 1.5, strapTopY - 1.5, strapRight - strapLeft + 3, 7);

  // Black strap body
  g.fillStyle(0x22201e, 1);
  g.fillRect(strapLeft, strapTopY, strapW, strapH + 2);
  g.fillRect(strapRight - strapW, strapTopY, strapW, strapH + 2);
  g.fillRect(strapLeft, strapTopY, strapRight - strapLeft, 5);

  // Subtle woven weave stitch on strap
  g.fillStyle(CREAM, 0.35);
  for (let sx = strapLeft + 2; sx < strapRight - 2; sx += 4) {
    g.fillRect(sx, strapTopY + 1.5, 2, 1);
  }

  // 2. Main Crimson Pouch Body (3-Column Vertical Construction)
  g.fillStyle(INK, 1).fillRoundedRect(x - 2, bagY - 2, w + 4, bagH + 4, 4);
  g.fillStyle(0xba1e2d, 1).fillRoundedRect(x, bagY, w, bagH, 2);

  // Vertical Panel Divisions (Left Flank, Center Panel, Right Flank)
  const flankW = Math.round(w * 0.28);
  // Left flank subtle shadow
  g.fillStyle(0x5a1219, 0.25).fillRect(x, bagY, flankW, bagH);
  // Right flank subtle shadow
  g.fillStyle(0x5a1219, 0.25).fillRect(x + w - flankW, bagY, flankW, bagH);
  // Seam lines
  g.lineStyle(1.2, INK, 0.7);
  g.lineBetween(x + flankW, bagY, x + flankW, bagY + bagH);
  g.lineBetween(x + w - flankW, bagY, x + w - flankW, bagY + bagH);

  // 3. Traditional Multi-Colored Cross-Stitches at Top
  const stitchY = bagY + 4;
  const stitchColors = [0x228b4c, 0xebb336, 0x2d78c4, 0xdb3d6b];
  const stitchCount = 6;
  const stitchStep = (w - 8) / (stitchCount - 1);
  for (let i = 0; i < stitchCount; i++) {
    const sx = x + 4 + i * stitchStep;
    const col = stitchColors[i % stitchColors.length] ?? GOLD;
    g.lineStyle(1.2, col, 1);
    g.lineBetween(sx - 1.5, stitchY - 1.5, sx + 1.5, stitchY + 1.5);
    g.lineBetween(sx + 1.5, stitchY - 1.5, sx - 1.5, stitchY + 1.5);
  }

  // 4. Golden Zigzag Wave Chevron Band
  const zigzagY = bagY + Math.round(bagH * 0.22);
  g.lineStyle(0.8, CREAM, 0.5);
  g.lineBetween(x + 2, zigzagY - 3, x + w - 2, zigzagY - 3);
  g.lineBetween(x + 2, zigzagY + 3, x + w - 2, zigzagY + 3);

  g.lineStyle(1.6, GOLD, 1);
  g.beginPath();
  const zigSteps = 10;
  const zigStepW = (w - 6) / zigSteps;
  for (let i = 0; i <= zigSteps; i++) {
    const zx = x + 3 + i * zigStepW;
    const zy = i % 2 === 0 ? zigzagY - 2.5 : zigzagY + 2.5;
    if (i === 0) g.moveTo(zx, zy);
    else g.lineTo(zx, zy);
  }
  g.strokePath();

  // Helper to draw shiny silver dome concho button
  const drawConcho = (cx: number, cy: number, r: number) => {
    g.fillStyle(INK, 1).fillCircle(cx, cy, r + 0.8);
    g.fillStyle(0xd5dcde, 1).fillCircle(cx, cy, r);
    g.fillStyle(0x485257, 0.5).fillCircle(cx + 0.4, cy + 0.4, r * 0.65);
    g.fillStyle(0xffffff, 1).fillCircle(cx - r * 0.35, cy - r * 0.35, Math.max(0.6, r * 0.35));
  };

  // Row 1: 3 Conchos (Left, Center, Right)
  drawConcho(x + flankW / 2, bagY + Math.round(bagH * 0.14), 2.8);
  drawConcho(x + w / 2, bagY + Math.round(bagH * 0.14), 2.8);
  drawConcho(x + w - flankW / 2, bagY + Math.round(bagH * 0.14), 2.8);

  // Row 2: 2 Conchos (Mid-Left, Mid-Right)
  drawConcho(x + w * 0.38, bagY + Math.round(bagH * 0.34), 2.6);
  drawConcho(x + w * 0.62, bagY + Math.round(bagH * 0.34), 2.6);

  // Row 3: 5 Conchos + Dangling Silver Bell Pendant Clusters
  const pendantXs = [
    x + flankW * 0.5,
    x + w * 0.38,
    x + w * 0.50,
    x + w * 0.62,
    x + w - flankW * 0.5
  ];
  const pendantYs = [
    bagY + Math.round(bagH * 0.50),
    bagY + Math.round(bagH * 0.62),
    bagY + Math.round(bagH * 0.45),
    bagY + Math.round(bagH * 0.62),
    bagY + Math.round(bagH * 0.50)
  ];

  for (let i = 0; i < 5; i++) {
    const px = pendantXs[i] ?? x;
    const py = pendantYs[i] ?? bagY;
    drawConcho(px, py, 2.5);

    // Suspension link thread
    g.lineStyle(1.0, 0xa0adb2, 1);
    g.lineBetween(px, py + 2.5, px, py + 6);

    // 2-3 Dangling Metallic Silver Bell / Tube Pendants
    const tubeLengths = [9, 12, 8];
    const offsets = [-2.2, 0, 2.2];
    for (let t = 0; t < 3; t++) {
      const tx = px + (offsets[t] ?? 0);
      const ty = py + 6 + (t === 1 ? 1 : 0);
      const tLen = tubeLengths[t] ?? 8;
      // Tube body
      g.fillStyle(INK, 1).fillRect(tx - 1.2, ty, 2.4, tLen + 1);
      g.fillStyle(0xd5dcde, 1).fillRect(tx - 0.8, ty + 0.5, 1.6, tLen);
      // Metallic shine highlight
      g.fillStyle(0xffffff, 0.9).fillRect(tx - 0.4, ty + 1, 0.8, tLen - 2);
    }
  }

  // 5. Lower Hem Borders (Black & White Woven Trims on Left & Right Flanks)
  const hemH = 3;
  const hemY = bagY + bagH - hemH;
  // Left hem
  g.fillStyle(INK, 1).fillRect(x, hemY, flankW, hemH);
  for (let bx = x + 2; bx < x + flankW - 2; bx += 3) {
    g.fillStyle(0xffffff, 1).fillRect(bx, hemY + 0.5, 1.5, hemH - 1);
  }
  // Right hem
  g.fillStyle(INK, 1).fillRect(x + w - flankW, hemY, flankW, hemH);
  for (let bx = x + w - flankW + 2; bx < x + w - 2; bx += 3) {
    g.fillStyle(0xffffff, 1).fillRect(bx, hemY + 0.5, 1.5, hemH - 1);
  }

  // 6. Twin Bunches of Black Fringe Tassels (ချည်မြိတ်)
  const drawTasselBunch = (startX: number, endX: number) => {
    const strands = 6;
    const step = (endX - startX) / (strands - 1);
    for (let s = 0; s < strands; s++) {
      const tx = startX + s * step;
      const sway = (s % 2 === 0 ? 1 : -1) * 1.2;
      g.lineStyle(1.2, 0x141312, 1);
      g.lineBetween(tx, bagY + bagH, tx + sway, tasselBottomY - 1);
      g.fillStyle(0x141312, 1).fillCircle(tx + sway, tasselBottomY - 1, 0.8);
    }
  };

  drawTasselBunch(x + 2, x + flankW - 2);
  drawTasselBunch(x + w - flankW + 2, x + w - 2);
}

/**
 * Draws the Bagan Tile Door (Gate) using the 3-layer inking formula:
 * Terracotta roof tile eaves (အုတ်ကြွပ်အမိုး / 0x8b3a2b, 0xa44c3b), weathered teak timber core (0x6a482b / 0x8c5e35)
 * with vertical mortise plank grooves, horizontal iron cross-straps (0x3e4232) spaced every 28px with dual diamond-faceted
 * golden brass rivet studs (0xe7bb55), central decorative geometric iron spine, and bottom spiked portcullis teeth
 * resting solidly at ground baseline.
 */
export function drawBaganGate(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w = 64,
  h = 380
) {
  const cx = x + w / 2;

  // 1. Top suspension bracket ring
  g.fillStyle(INK, 1).fillCircle(cx, y + 10, 8);
  g.fillStyle(0x4c4432, 1).fillCircle(cx, y + 10, 6);
  g.lineStyle(1.5, CREAM, 0.75).strokeCircle(cx, y + 10, 6);
  g.fillStyle(INK, 1).fillCircle(cx, y + 10, 3);

  // Mounting bracket plate
  g.fillStyle(INK, 1).fillRoundedRect(cx - 16, y + 15, 32, 10, 2);
  g.fillStyle(IRON_STRAP, 1).fillRoundedRect(cx - 15, y + 16, 30, 8, 2);
  g.fillStyle(GOLD, 1).fillCircle(cx - 9, y + 20, 2).fillCircle(cx + 9, y + 20, 2);

  // 2. Terracotta roof tile eaves (အုတ်ကြွပ်အမိုး / 0x8b3a2b, 0xa44c3b) with cream bevels
  // Upper eave tier
  g.fillStyle(INK, 1).fillTriangle(cx - 26, y + 36, cx + 26, y + 36, cx, y + 23);
  g.fillStyle(TERRACOTTA, 1).fillTriangle(cx - 24, y + 35, cx + 24, y + 35, cx, y + 25);
  g.fillStyle(TERRACOTTA_LIGHT, 1).fillTriangle(cx - 20, y + 35, cx + 20, y + 35, cx, y + 26);
  g.lineStyle(1.5, CREAM, 0.85).lineBetween(cx - 25, y + 36, cx, y + 24).lineBetween(cx, y + 24, cx + 25, y + 36);

  // Lower eave tier
  g.fillStyle(INK, 1).fillRoundedRect(x + 1, y + 35, w - 2, 18, 3);
  g.fillStyle(TERRACOTTA, 1).fillRoundedRect(x + 2, y + 36, w - 4, 15, 2);
  g.fillStyle(TERRACOTTA_LIGHT, 1).fillRect(x + 4, y + 38, w - 8, 5);

  // Individual curved roof tile scores
  for (let tx = x + 8; tx < x + w - 6; tx += 8) {
    g.lineStyle(1.5, INK, 0.7).lineBetween(tx, y + 36, tx - 1, y + 50);
    g.lineStyle(1, TERRACOTTA_LIGHT, 0.9).lineBetween(tx + 1, y + 36, tx, y + 50);
  }
  // Bottom eave cream highlight bevel & shadow
  g.fillStyle(CREAM, 0.85).fillRect(x + 3, y + 49, w - 6, 2);
  g.fillStyle(INK, 0.55).fillRect(x + 2, y + 52, w - 4, 4);

  // 3. Weathered teak timber core (0x6a482b / 0x8c5e35)
  const bodyH = 302;
  const bodyY = y + 54;
  g.fillStyle(INK, 1).fillRect(x + 1, bodyY, w - 2, bodyH);
  g.fillStyle(TEAK, 1).fillRect(x + 3, bodyY + 1, w - 6, bodyH - 2);

  // 4 vertical planks with mortise plank grooves
  const plankW = (w - 6) / 4;
  for (let i = 0; i < 4; i++) {
    const px = x + 3 + i * plankW;
    if (i % 2 === 1) {
      g.fillStyle(0x765333, 1).fillRect(px, bodyY + 1, plankW, bodyH - 2);
    }
    // Grain streaks
    g.lineStyle(1, TEAK_LIGHT, 0.35);
    g.lineBetween(px + 4, bodyY + 2, px + 4, bodyY + bodyH - 3);
    g.lineBetween(px + plankW - 4, bodyY + 2, px + plankW - 4, bodyY + bodyH - 3);
    // Bevel highlight on left edge of plank
    g.lineStyle(1, CREAM, 0.16).lineBetween(px + 1, bodyY + 1, px + 1, bodyY + bodyH - 2);
    // Vertical mortise groove seam
    if (i > 0) {
      g.lineStyle(1.8, INK, 0.7).lineBetween(px, bodyY, px, bodyY + bodyH);
    }
  }

  // 4. Central decorative geometric iron spine
  g.fillStyle(INK, 1).fillRect(cx - 4, bodyY, 8, bodyH);
  g.fillStyle(IRON_STRAP, 1).fillRect(cx - 3, bodyY, 6, bodyH);
  g.lineStyle(1.2, CREAM, 0.35).lineBetween(cx, bodyY, cx, bodyY + bodyH);

  // 5. Horizontal iron cross-straps (0x3e4232) spaced every 28px
  for (let sy = y + 68; sy <= y + 344; sy += 28) {
    g.fillStyle(INK, 1).fillRect(x + 1, sy - 1, w - 2, 9);
    g.fillStyle(IRON_STRAP, 1).fillRect(x + 2, sy, w - 4, 7);
    g.fillStyle(CREAM, 0.45).fillRect(x + 3, sy, w - 6, 1.5);
    g.fillStyle(INK, 0.6).fillRect(x + 3, sy + 5.5, w - 6, 1.5);

    // Central decorative geometric iron diamond plate
    g.fillStyle(INK, 1).fillTriangle(cx - 6, sy + 3.5, cx, sy - 3, cx + 6, sy + 3.5);
    g.fillTriangle(cx - 6, sy + 3.5, cx, sy + 10, cx + 6, sy + 3.5);
    g.fillStyle(IRON_STRAP, 1).fillTriangle(cx - 4.5, sy + 3.5, cx, sy - 1.5, cx + 4.5, sy + 3.5);
    g.fillTriangle(cx - 4.5, sy + 3.5, cx, sy + 8.5, cx + 4.5, sy + 3.5);

    // Dual diamond-faceted golden brass rivet studs (0xe7bb55) + center stud
    for (const rx of [x + 10, cx, x + w - 10]) {
      const ry = sy + 3.5;
      g.fillStyle(INK, 1).fillTriangle(rx - 3.2, ry, rx, ry - 3.2, rx + 3.2, ry);
      g.fillTriangle(rx - 3.2, ry, rx, ry + 3.2, rx + 3.2, ry);
      g.fillStyle(GOLD, 1).fillTriangle(rx - 2.2, ry, rx, ry - 2.2, rx + 2.2, ry);
      g.fillTriangle(rx - 2.2, ry, rx, ry + 2.2, rx + 2.2, ry);
      g.fillStyle(CREAM, 0.9).fillTriangle(rx - 1.5, ry, rx, ry - 1.8, rx + 0.5, ry);
    }
  }

  // 6. Bottom spiked portcullis teeth resting solidly at ground baseline
  const teethBaseY = y + 356;
  g.fillStyle(INK, 1).fillRect(x + 1, teethBaseY - 1, w - 2, 9);
  g.fillStyle(IRON_STRAP, 1).fillRect(x + 2, teethBaseY, w - 4, 7);
  g.fillStyle(CREAM, 0.4).fillRect(x + 3, teethBaseY, w - 6, 1.5);

  // 5 spiked teeth pointing downward to y + h (y + 380)
  const teethCount = 5;
  const toothPitch = (w - 12) / (teethCount - 1);
  for (let i = 0; i < teethCount; i++) {
    const tx = x + 6 + i * toothPitch;
    const toothTop = teethBaseY + 7;
    const toothBottom = y + h - 1;
    g.fillStyle(INK, 1).fillTriangle(tx - 5.5, toothTop, tx + 5.5, toothTop, tx, toothBottom);
    g.fillStyle(IRON_STRAP, 1).fillTriangle(tx - 4, toothTop, tx + 4, toothTop, tx, toothBottom - 1);
    g.fillStyle(METAL, 0.75).fillTriangle(tx - 3, toothTop, tx, toothTop, tx, toothBottom - 1);
    g.lineStyle(1.2, CREAM, 0.85).lineBetween(tx - 3.5, toothTop, tx, toothBottom - 1);
  }
}

/**
 * Draws the Golden Buddha Relic (ရွှေရုပ်) with multi-tiered lotus pedestal (ကြာပလ္လင်),
 * meditative seated silhouette in Dhyana mudra, and radiant golden halo/aureole (ရောင်ခြည်တော်).
 */
export function drawGoldenBuddha(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w = 36,
  h = 52,
  icon = false
) {
  const cx = x + w / 2;

  // Golden aureole / halo (ရောင်ခြည်တော်)
  const haloY = y + (icon ? 14 : 14);
  const haloR = icon ? 11 : 13;

  // Soft radiant aura glow
  g.fillStyle(GOLD, 0.25).fillCircle(cx, haloY, haloR + 3);
  g.fillStyle(0xd4af37, 0.55).fillCircle(cx, haloY, haloR);
  g.lineStyle(1.8, GOLD, 0.95).strokeCircle(cx, haloY, haloR);

  // Delicate golden rays
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    g.lineStyle(1.2, CREAM, 0.85).lineBetween(
      cx + Math.cos(a) * (haloR - 1),
      haloY + Math.sin(a) * (haloR - 1),
      cx + Math.cos(a) * (haloR + 3),
      haloY + Math.sin(a) * (haloR + 3)
    );
  }

  // Ushnisha (သျှောင်တော် flame crown)
  const ushY = y + (icon ? 5 : 5);
  g.fillStyle(INK, 1).fillTriangle(cx - 2.5, ushY + 5, cx + 2.5, ushY + 5, cx, ushY);
  g.fillStyle(0xfde047, 1).fillTriangle(cx - 1.8, ushY + 4.5, cx + 1.8, ushY + 4.5, cx, ushY + 0.5);
  g.fillStyle(CREAM, 0.9).fillCircle(cx, ushY + 1, 1);

  // Meditative Head & elongated earlobes
  const headY = haloY;
  g.fillStyle(INK, 1).fillCircle(cx, headY, 5.5);
  g.fillStyle(GOLD, 1).fillCircle(cx, headY, 4.5);
  g.fillStyle(CREAM, 0.65).fillCircle(cx - 1.2, headY - 1.2, 1.8);

  // Elongated earlobes
  g.lineStyle(1.5, INK, 1).lineBetween(cx - 4.5, headY - 1, cx - 4.5, headY + 4.5);
  g.lineStyle(1, GOLD, 1).lineBetween(cx - 4.5, headY - 1, cx - 4.5, headY + 4.5);
  g.lineStyle(1.5, INK, 1).lineBetween(cx + 4.5, headY - 1, cx + 4.5, headY + 4.5);
  g.lineStyle(1, GOLD, 1).lineBetween(cx + 4.5, headY - 1, cx + 4.5, headY + 4.5);

  // Neck
  g.fillStyle(INK, 1).fillRect(cx - 2.5, headY + 4, 5, 3);
  g.fillStyle(GOLD, 1).fillRect(cx - 1.8, headY + 4, 3.6, 2.5);

  // Torso with Monastic Robe (Sanghati)
  const torsoY = headY + 6;
  g.fillStyle(INK, 1).fillRoundedRect(cx - 7, torsoY, 14, 13, 3);
  g.fillStyle(0xd4af37, 1).fillRoundedRect(cx - 6, torsoY + 1, 12, 11, 2.5);
  // Diagonal robe fold
  g.lineStyle(1.4, INK, 0.75).lineBetween(cx - 6, torsoY + 1, cx + 5, torsoY + 11);
  g.lineStyle(1, CREAM, 0.75).lineBetween(cx - 5, torsoY + 1, cx + 6, torsoY + 11);
  g.fillStyle(CREAM, 0.4).fillRect(cx - 5, torsoY + 2, 3, 7);

  // Crossed legs in Padmasana
  const legY = torsoY + 11;
  g.fillStyle(INK, 1).fillRoundedRect(cx - 12, legY, 24, 8, 4);
  g.fillStyle(GOLD, 1).fillRoundedRect(cx - 11, legY + 1, 22, 6, 3);
  g.fillStyle(CREAM, 0.35).fillRect(cx - 9, legY + 1, 18, 2);

  // Hands resting in Dhyana Mudra (palms in lap)
  g.fillStyle(INK, 1).fillRoundedRect(cx - 4.5, legY - 0.5, 9, 3.5, 1.5);
  g.fillStyle(0xfde047, 1).fillRoundedRect(cx - 3.5, legY, 7, 2.5, 1);

  // Multi-tiered lotus pedestal (ကြာပလ္လင်)
  const pedY = legY + 6;
  // Lotus petals tier
  g.fillStyle(INK, 1).fillRoundedRect(cx - 14, pedY, 28, 6, 2);
  g.fillStyle(0xd4af37, 1).fillRoundedRect(cx - 13, pedY + 1, 26, 4.5, 1.5);
  for (let px = cx - 10; px <= cx + 10; px += 5) {
    g.fillStyle(CREAM, 0.85).fillTriangle(px - 1.5, pedY + 5, px + 1.5, pedY + 5, px, pedY + 1);
    g.lineStyle(1, INK, 0.6).strokeTriangle(px - 1.5, pedY + 5, px + 1.5, pedY + 5, px, pedY + 1);
  }
  // Bottom tier
  g.fillStyle(INK, 1).fillRoundedRect(cx - 16, pedY + 5, 32, 6, 2);
  g.fillStyle(GOLD, 1).fillRoundedRect(cx - 15, pedY + 6, 30, 4, 1.5);
  g.fillStyle(CREAM, 0.6).fillRect(cx - 14, pedY + 6, 28, 1.5);
}

/**
 * Draws the ancient carved sandstone counterweight block matching STEP_STONE palette,
 * with CREAM top highlight bevel, debossed Burmese weight mark (၃), and weathered hairline fissures.
 */
export function drawStoneWeight(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w = 44,
  h = 38
) {
  // Outer ink border
  g.fillStyle(INK, 1).fillRoundedRect(x, y, w, h, 4);
  // STEP_STONE base material
  g.fillStyle(STEP_STONE, 1).fillRoundedRect(x + 2, y + 2, w - 4, h - 4, 3);
  // CREAM top highlight bevel
  g.fillStyle(CREAM, 0.35).fillRect(x + 3, y + 2, w - 6, 3.5);
  // CREAM left highlight bevel
  g.fillStyle(CREAM, 0.18).fillRect(x + 2, y + 3, 2.5, h - 6);
  // Bottom shadow bevel in STONE
  g.fillStyle(STONE, 0.65).fillRect(x + 3, y + h - 5, w - 6, 3);

  // Weathered hairline fissures & corner chips
  g.lineStyle(1.4, INK, 0.7);
  g.lineBetween(x + 9, y + 2, x + 13, y + 9).lineBetween(x + 13, y + 9, x + 11, y + 15);
  g.lineBetween(x + w - 10, y + h - 2, x + w - 7, y + h - 9).lineBetween(x + w - 7, y + h - 9, x + w - 11, y + h - 13);
  g.fillStyle(INK, 1).fillTriangle(x + w - 4, y + 2, x + w - 2, y + 2, x + w - 2, y + 5);

  // Debossed Burmese weight mark (၃)
  const cx = x + w / 2;
  const cy = y + h / 2 - 1;

  // Outer dark debossed groove
  g.lineStyle(2.4, INK, 0.9);
  g.beginPath();
  g.arc(cx, cy - 4, 4, -Math.PI * 0.8, Math.PI * 0.4, false);
  g.stroke();
  g.beginPath();
  g.arc(cx, cy + 3.5, 4.5, -Math.PI * 0.5, Math.PI * 0.8, false);
  g.stroke();
  g.lineBetween(cx - 3, cy + 6.5, cx - 5, cy + 3);

  // Specular CREAM bevel on lower-right edge of debossed groove
  g.lineStyle(1.2, CREAM, 0.75);
  g.beginPath();
  g.arc(cx + 0.5, cy - 3.5, 3.6, -Math.PI * 0.3, Math.PI * 0.35, false);
  g.stroke();
  g.beginPath();
  g.arc(cx + 0.5, cy + 4, 4.2, -Math.PI * 0.2, Math.PI * 0.65, false);
  g.stroke();

  // Three carved weight pips
  for (const px of [cx - 8, cx, cx + 8]) {
    g.fillStyle(INK, 1).fillCircle(px, cy + 12, 1.8);
    g.fillStyle(CREAM, 0.8).fillCircle(px + 0.5, cy + 12.5, 0.8);
  }
}

/**
 * Draws the Bagan teak timber chest (0x9d7047) with diagonal cross-braces,
 * forged iron corner angle brackets, and golden brass nail studs (0xe7bb55).
 */
export function drawTeakCrate(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w = 44,
  h = 40
) {
  // Outer ink outline
  g.fillStyle(INK, 1).fillRoundedRect(x, y, w, h, 3);
  // Teak timber body
  g.fillStyle(WOOD, 1).fillRect(x + 2, y + 2, w - 4, h - 4);
  // Horizontal timber plank grooves
  g.lineStyle(1.5, INK, 0.65).lineBetween(x + 2, y + 14, x + w - 2, y + 14);
  g.lineStyle(1.5, INK, 0.65).lineBetween(x + 2, y + 26, x + w - 2, y + 26);
  g.lineStyle(1, CREAM, 0.25).lineBetween(x + 2, y + 3, x + w - 2, y + 3);
  g.lineStyle(1, CREAM, 0.2).lineBetween(x + 2, y + 15, x + w - 2, y + 15);
  g.lineStyle(1, CREAM, 0.2).lineBetween(x + 2, y + 27, x + w - 2, y + 27);

  // Diagonal cross-bracing timbers (X-bracing)
  g.lineStyle(5.5, INK, 1).lineBetween(x + 4, y + 4, x + w - 4, y + h - 4);
  g.lineStyle(5.5, INK, 1).lineBetween(x + w - 4, y + 4, x + 4, y + h - 4);
  g.lineStyle(3.5, 0x825933, 1).lineBetween(x + 4, y + 4, x + w - 4, y + h - 4);
  g.lineStyle(3.5, 0x825933, 1).lineBetween(x + w - 4, y + 4, x + 4, y + h - 4);
  g.lineStyle(1, CREAM, 0.4).lineBetween(x + 5, y + 4, x + w - 4, y + h - 5);

  // Forged iron corner angle brackets
  const bracketSize = 8;
  const corners = [
    { bx: x + 2, by: y + 2, dx: 1, dy: 1 },
    { bx: x + w - 2, by: y + 2, dx: -1, dy: 1 },
    { bx: x + 2, by: y + h - 2, dx: 1, dy: -1 },
    { bx: x + w - 2, by: y + h - 2, dx: -1, dy: -1 },
  ];
  for (const c of corners) {
    g.fillStyle(IRON_STRAP, 1).fillRect(c.dx > 0 ? c.bx : c.bx - bracketSize, c.dy > 0 ? c.by : c.by - 3, bracketSize, 3);
    g.fillStyle(IRON_STRAP, 1).fillRect(c.dx > 0 ? c.bx : c.bx - 3, c.dy > 0 ? c.by : c.by - bracketSize, 3, bracketSize);
  }

  // Golden brass nail studs (0xe7bb55)
  const studs: [number, number][] = [
    [x + 5, y + 5],
    [x + w - 5, y + 5],
    [x + 5, y + h - 5],
    [x + w - 5, y + h - 5],
    [x + w / 2, y + h / 2],
  ];
  for (const [sx, sy] of studs) {
    g.fillStyle(INK, 1).fillCircle(sx, sy, 2.5);
    g.fillStyle(GOLD, 1).fillCircle(sx, sy, 1.8);
    g.fillStyle(CREAM, 0.85).fillCircle(sx - 0.5, sy - 0.5, 0.8);
  }
}

/**
 * Draws the hand-sewn woven burlap sandbag (0xc0aa76) with organic bulging shape,
 * crimped neck tied with hemp twine and gold bead, and fine burlap crosshatch lines.
 */
export function drawSandbag(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w = 44,
  h = 40
) {
  const cx = x + w / 2;

  // Outer ink outline for bulging organic sack shape
  g.fillStyle(INK, 1).fillRoundedRect(cx - 17, y + 13, 34, 25, 10);
  g.fillStyle(INK, 1).fillRoundedRect(cx - 9, y + 4, 18, 9, 3);

  // Burlap sack fill (0xc0aa76)
  g.fillStyle(BURLAP, 1).fillRoundedRect(cx - 15.5, y + 14.5, 31, 22, 9);
  g.fillStyle(BURLAP, 1).fillRoundedRect(cx - 7.5, y + 5.5, 15, 8, 2.5);

  // Bottom shadow & side fold depths
  g.fillStyle(0x9e8555, 0.6).fillRoundedRect(cx - 14, y + 28, 28, 7, 5);
  g.fillStyle(0x9e8555, 0.4).fillRect(cx - 15, y + 18, 4, 14);
  g.fillStyle(0x9e8555, 0.4).fillRect(cx + 11, y + 18, 4, 14);

  // CREAM highlight on center belly bulge
  g.fillStyle(CREAM, 0.35).fillEllipse(cx - 2, y + 23, 16, 12);

  // Fine burlap woven crosshatch lines
  for (let d = -12; d <= 12; d += 6) {
    g.lineStyle(1, 0x6e5b32, 0.22);
    g.lineBetween(cx + d - 8, y + 17, cx + d + 8, y + 33);
    g.lineBetween(cx - d + 8, y + 17, cx - d - 8, y + 33);
  }

  // Crimped neck tied with hemp twine & gold bead
  g.fillStyle(INK, 1).fillRoundedRect(cx - 8, y + 11, 16, 5, 2);
  g.fillStyle(ROPE_DARK, 1).fillRoundedRect(cx - 7, y + 12, 14, 3, 1.5);
  g.fillStyle(ROPE, 1).fillRect(cx - 6, y + 12, 12, 1.5);

  // Gold bead / cinch ring
  g.fillStyle(INK, 1).fillCircle(cx, y + 13.5, 2.8);
  g.fillStyle(GOLD, 1).fillCircle(cx, y + 13.5, 2);
  g.fillStyle(CREAM, 0.9).fillCircle(cx - 0.6, y + 12.8, 0.8);

  // Hemp twine tassels
  g.lineStyle(1.5, INK, 0.9).lineBetween(cx, y + 14, cx - 3, y + 21).lineBetween(cx, y + 14, cx + 4, y + 20);
  g.lineStyle(1, ROPE, 1).lineBetween(cx, y + 14, cx - 3, y + 21).lineBetween(cx, y + 14, cx + 4, y + 20);
}

/**
 * Draws the forged wrought iron security rod (0x839b8b/0x56675e) with rounded brass ring head (0xe7bb55)
 * and sharp metallic specular bevel (0xe9dfbd), drawn diagonally from (8,36) to (36,8).
 */
export function drawIronPin(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w = 44,
  h = 44
) {
  const x1 = x + 8, y1 = y + 36;
  const x2 = x + 34, y2 = y + 10;

  // Wrought iron security rod (0x839b8b/0x56675e) drawn diagonally from (8,36) to (36,8)
  g.lineStyle(7, INK, 1).lineBetween(x1, y1, x2, y2);
  g.lineStyle(4.5, METAL, 1).lineBetween(x1, y1, x2, y2);
  g.lineStyle(1.8, 0x56675e, 1).lineBetween(x1 + 1, y1 + 1, x2 + 1, y2 + 1);
  g.lineStyle(1.4, CREAM, 0.95).lineBetween(x1 - 1, y1 - 1, x2 - 1, y2 - 1);

  // Pointed tip at (x1, y1)
  g.fillStyle(INK, 1).fillTriangle(x1 - 2, y1 + 2, x1 + 2, y1 - 2, x1 - 3, y1 + 3);

  // Rounded brass ring head (0xe7bb55) at (36,8)
  const rx = x + 36, ry = y + 8;
  g.fillStyle(INK, 1).fillCircle(rx, ry, 6);
  g.fillStyle(GOLD, 1).fillCircle(rx, ry, 4.5);
  g.fillStyle(CREAM, 0.85).fillCircle(rx - 1.2, ry - 1.2, 1.8);
  g.fillStyle(INK, 1).fillCircle(rx, ry, 2.2);
}

/**
 * Draws the cast bronze 10-peittha temple/elephant weight (ဟင်္သာတံဆိပ် / ဆင်တံဆိပ် အလေး)
 * with stepped bell body, bronze patina (0x69542a to 0x8f723c), and top carrying loop.
 */
export function drawBronzeWeight(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w = 50,
  h = 40,
  icon = false
) {
  const cx = x + w / 2;

  // Top carrying loop
  const loopY = y + (icon ? 5 : 6);
  g.fillStyle(INK, 1).fillCircle(cx, loopY, 5.5);
  g.fillStyle(BRONZE, 1).fillCircle(cx, loopY, 4);
  g.lineStyle(1.2, CREAM, 0.85).strokeCircle(cx, loopY, 4);
  g.fillStyle(INK, 1).fillCircle(cx, loopY, 2.2);

  // Neck / stepped shoulder
  const neckY = loopY + 3;
  g.fillStyle(INK, 1).fillRoundedRect(cx - 8, neckY, 16, 5, 2);
  g.fillStyle(BRONZE_DARK, 1).fillRoundedRect(cx - 7, neckY + 1, 14, 3.5, 1.5);
  g.fillStyle(CREAM, 0.4).fillRect(cx - 6, neckY + 1, 12, 1);

  // Stepped bell body with bronze patina (0x69542a to 0x8f723c)
  const bellTopY = neckY + 4;
  g.fillStyle(INK, 1).fillTriangle(cx - 15, bellTopY + 10, cx + 15, bellTopY + 10, cx, bellTopY - 2);
  g.fillStyle(0x7c6233, 1).fillTriangle(cx - 13.5, bellTopY + 9.5, cx + 13.5, bellTopY + 9.5, cx, bellTopY - 0.5);

  // Stepped ring ridge
  const ridgeY = bellTopY + 9;
  g.fillStyle(INK, 1).fillRoundedRect(cx - 16, ridgeY, 32, 4.5, 2);
  g.fillStyle(BRONZE, 1).fillRoundedRect(cx - 15, ridgeY + 1, 30, 3, 1.5);
  g.fillStyle(CREAM, 0.6).fillRect(cx - 14, ridgeY + 1, 28, 1);

  // Lower bell body
  const lowerY = ridgeY + 3;
  g.fillStyle(INK, 1).fillRoundedRect(cx - 20, lowerY, 40, 9, 3);
  g.fillStyle(BRONZE_DARK, 1).fillRoundedRect(cx - 19, lowerY + 1, 38, 7, 2);

  // Verdigris patina accent in groove
  g.fillStyle(0x526b58, 0.45).fillRect(cx - 17, lowerY + 2, 34, 1.5);

  // Etched Burmese "၁၀" numeral mark
  g.lineStyle(1.8, INK, 0.85);
  g.strokeCircle(cx - 5, lowerY + 4.5, 2.5);
  g.strokeCircle(cx + 5, lowerY + 4.5, 2.5);
  g.lineStyle(1, CREAM, 0.7);
  g.strokeCircle(cx - 5, lowerY + 4.2, 2.2);
  g.strokeCircle(cx + 5, lowerY + 4.2, 2.2);

  // Flared pedestal base
  const baseY = lowerY + 7;
  g.fillStyle(INK, 1).fillRoundedRect(cx - 23, baseY, 46, 6, 2.5);
  g.fillStyle(BRONZE, 1).fillRoundedRect(cx - 22, baseY + 1, 44, 4.5, 2);
  g.fillStyle(CREAM, 0.6).fillRect(cx - 20, baseY + 1, 40, 1.2);
  g.fillStyle(0x423417, 1).fillRect(cx - 21, baseY + 4, 42, 1.2);
}
