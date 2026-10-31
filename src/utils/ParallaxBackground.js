// ParallaxBackground.js
// 5-Layer Machinarium-Grade Parallax System for Phoe Htaung: Die Again in the Golden City
// Layers: 0: Sky Gradient, 1: Far Palace Towers, 2: Midground Ruins, 3: Walkable Ground, 4: Foreground Vignette

import Phaser from 'phaser';

export class ParallaxBackground {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.options = {
      enableMouseParallax: options.enableMouseParallax !== false,
      enableBreathing: options.enableBreathing !== false,
      depthBase: options.depthBase || 0,
      darkness: options.darkness !== undefined ? options.darkness : 0.32, // Calibrated moodier/darker tone
      ...options
    };

    this.layers = [];
    this.shadowOverlay = null;

    this.targetOffsets = [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 }
    ];
    this.currentOffsets = [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 }
    ];

    // Sensitivity factors for mouse parallax
    // Layer 3 (where the character stands) is 100% anchored (0, 0) to prevent items and character drifting
    this.parallaxFactors = this.options.parallaxFactors || [
      { x: 0.000, y: 0.000 },  // Layer 0: Sky
      { x: 0.024, y: 0.012 },  // Layer 1: Far Palace Towers / Machinery (gentle depth)
      { x: 0.048, y: 0.024 },  // Layer 2: Midground Cliffs / Ruins (smooth midground depth)
      { x: 0.000, y: 0.000 },  // Layer 3: Walkable Ground Stone Slab (STATIONARY ANCHOR! ZERO DRIFT)
      { x: 0.035, y: 0.018 }   // Layer 4: Foreground Vignette Frame (subtle, non-dizzy framing)
    ];

    this.create();
  }

  create() {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;

    const layerKeys = this.options.layerKeys || [
      'bg-layer-0-sky',
      'bg-layer-1-pagodas',
      'bg-layer-2-ruins',
      'bg-layer-3-ground',
      'bg-layer-4-foreground'
    ];

    const depths = [
      this.options.depthBase + 0,    // Sky (deepest)
      this.options.depthBase + 5,    // Far Palace Towers
      this.options.depthBase + 10,   // Midground Ruins
      this.options.depthBase + 20,   // Walkable Ground
      this.options.depthBase + 120   // Foreground Silhouette (in front of characters)
    ];

    const scrollFactors = [
      { x: 0.00, y: 0.00 },
      { x: 0.18, y: 0.08 },
      { x: 0.45, y: 0.20 },
      { x: 1.00, y: 1.00 },
      { x: 1.30, y: 1.15 }
    ];

    // Native resolution of the asset layers is 1376 x 768
    this.nativeWidth = 1376;
    this.nativeHeight = 768;

    this.layers = [];

    layerKeys.forEach((key, index) => {
      const img = this.scene.add.image(width / 2, height / 2, key);
      img.setOrigin(0.5, 0.5);
      img.setDepth(depths[index]);
      img.setScrollFactor(scrollFactors[index].x, scrollFactors[index].y);

      this.layers.push({
        image: img,
        baseX: width / 2,
        baseY: height / 2,
        index
      });
    });

    // Atmospheric shadow overlay at depth 22 (behind foreground arch & characters, darkening the ruins & sky)
    this.shadowOverlay = this.scene.add.graphics();
    this.shadowOverlay.setDepth(this.options.depthBase + 22);

    this.applyDarkness();
    this.updateLayerScaling(width, height);

    // Mouse movement listener for 2.5D gyroscopic depth
    if (this.options.enableMouseParallax) {
      this.scene.input.on('pointermove', (pointer) => {
        const dx = pointer.x - width / 2;
        const dy = pointer.y - height / 2;

        for (let i = 0; i < this.parallaxFactors.length; i++) {
          this.targetOffsets[i].x = dx * this.parallaxFactors[i].x;
          this.targetOffsets[i].y = dy * this.parallaxFactors[i].y;
        }
      });
    }
  }

  applyDarkness() {
    const darkness = Phaser.Math.Clamp(this.options.darkness, 0, 0.95);
    const brightnessMult = 1.0 - darkness; // e.g., 0.68 for 32% darkness

    // Calibrated layer-specific color curves:
    // Deeper amber & twilight for sky & palace towers, rich terracotta for ruins
    const layerMultipliers = [
      { r: 0.88, g: 0.84, b: 0.82 }, // Layer 0 Sky
      { r: 0.90, g: 0.86, b: 0.84 }, // Layer 1 Palace Towers
      { r: 0.95, g: 0.92, b: 0.90 }, // Layer 2 Ruins
      { r: 1.00, g: 0.98, b: 0.95 }, // Layer 3 Ground
      { r: 0.75, g: 0.70, b: 0.68 }  // Layer 4 Foreground Silhouette
    ];

    this.layers.forEach((layer, idx) => {
      const mult = layerMultipliers[idx] || { r: 1, g: 1, b: 1 };
      const r = Math.round(255 * brightnessMult * mult.r);
      const g = Math.round(255 * brightnessMult * mult.g);
      const b = Math.round(255 * brightnessMult * mult.b);
      const tint = Phaser.Display.Color.GetColor(r, g, b);
      layer.image.setTint(tint);
    });

    // Redraw shadow overlay
    if (this.shadowOverlay) {
      const width = this.scene.scale.width;
      const height = this.scene.scale.height;
      this.shadowOverlay.clear();
      // Subtle gradient vignette: softer in center, moodier at top & bottom
      this.shadowOverlay.fillStyle(0x0a0806, darkness * 0.65);
      this.shadowOverlay.fillRect(0, 0, width, height);
    }
  }

  setDarkness(darkness) {
    this.options.darkness = darkness;
    this.applyDarkness();
  }

  updateLayerScaling(width, height) {
    const marginRatio = 1.15;
    const scaleX = (width / this.nativeWidth) * marginRatio;
    const scaleY = (height / this.nativeHeight) * marginRatio;
    const scale = Math.max(scaleX, scaleY);

    this.currentScale = scale;

    // Platform walking surface positioned at configurable targetSurfaceY (default height * 0.80)
    const targetSurfaceY = this.options.targetSurfaceY !== undefined ? this.options.targetSurfaceY : height * 0.80;
    const surfaceNativeY = this.options.surfaceNativeY !== undefined ? this.options.surfaceNativeY : 491;
    // Center relative to surface: (384 - surfaceNativeY) * scale
    const platformBaseY = targetSurfaceY - (surfaceNativeY - 384) * scale;

    this.layers.forEach((layer) => {
      layer.baseX = width / 2;

      if (layer.index === 0) {
        // Layer 0: Sky fills the entire viewport cleanly
        layer.image.setDisplaySize(width * 1.15, height * 1.15);
        layer.baseY = height / 2;
        layer.image.setPosition(layer.baseX, layer.baseY);
      } else if (layer.index === 4) {
        // Layer 4: Foreground Vignette Frame fits the viewport boundaries
        const fgScale = Math.max(width / this.nativeWidth, height / this.nativeHeight) * 1.08;
        layer.image.setScale(fgScale);
        layer.baseY = height / 2;
        layer.image.setPosition(layer.baseX, layer.baseY);
      } else if (layer.index === 1) {
        // Layer 1: Far Palace Towers sit slightly behind and above the midground ruins
        layer.image.setScale(scale);
        layer.baseY = platformBaseY - 20 * scale;
        layer.image.setPosition(layer.baseX, layer.baseY);
      } else {
        // Layer 2 (Ruins) & Layer 3 (Ground Platform)
        layer.image.setScale(scale);
        layer.baseY = platformBaseY;
        layer.image.setPosition(layer.baseX, layer.baseY);
      }
    });

    if (this.shadowOverlay) {
      this.shadowOverlay.clear();
      const darkness = Phaser.Math.Clamp(this.options.darkness, 0, 0.95);
      this.shadowOverlay.fillStyle(0x0a0806, darkness * 0.65);
      this.shadowOverlay.fillRect(0, 0, width, height);
    }
  }

  getWalkableGroundY() {
    const height = this.scene.scale.height;
    return this.options.targetSurfaceY !== undefined ? this.options.targetSurfaceY : height * 0.80;
  }

  update(time, delta) {
    if (!this.layers || this.layers.length === 0) return;

    const lerpSpeed = 0.065;
    for (let i = 0; i < this.layers.length; i++) {
      const cur = this.currentOffsets[i];
      const tgt = this.targetOffsets[i];

      cur.x = Phaser.Math.Linear(cur.x, tgt.x, lerpSpeed);
      cur.y = Phaser.Math.Linear(cur.y, tgt.y, lerpSpeed);

      let driftY = 0;
      if (this.options.enableBreathing && i === 1) {
        driftY = Math.sin(time * 0.0012) * 2.5;
      }

      const layer = this.layers[i];
      layer.image.x = layer.baseX + cur.x;
      layer.image.y = layer.baseY + cur.y + driftY;
    }
  }

  resize(width, height) {
    this.updateLayerScaling(width, height);
  }

  destroy() {
    this.layers.forEach((layer) => {
      if (layer.image && layer.image.destroy) {
        layer.image.destroy();
      }
    });
    this.layers = [];
    if (this.shadowOverlay) {
      this.shadowOverlay.destroy();
      this.shadowOverlay = null;
    }
  }
}
