---
name: phaser-game
description: Expert skill for creating, designing, and optimizing 2D HTML5 web games using Phaser 3 and Vite. Use when developing Phaser games, configuring scenes, arcade physics, sprite animations, audio, input handling, and responsive game canvas scaling.
---

# Phaser 3 Web Game Engineering Skill

This skill provides full-lifecycle engineering guidance, patterns, and runbooks for building modern, responsive 2D web games with **Phaser 3** and **Vite**.

## Architecture & Project Layout

```
D:/game/
├── index.html            # Game viewport container & responsive styles
├── package.json          # Phaser & Vite configuration
├── vite.config.js        # Modern build bundler
├── public/               # Static assets (images, spritesheets, audio)
└── src/
    ├── main.js           # Phaser Game configuration & Scene registry
    ├── scenes/
    │   ├── BootScene.js       # Pre-init & essential boot assets
    │   ├── PreloadScene.js    # Asset loader with visual progress bar
    │   ├── MainMenuScene.js   # Title screen, UI buttons, start triggers
    │   ├── GameScene.js       # Core gameplay loop, physics, collisions
    │   ├── GameOverScene.js   # Score presentation, replay loops
    │   └── PauseScene.js      # Modal overlay for pause & settings
    └── ui/
        └── SoundManager.js    # Web Audio sound effects synthesizer
```

---

## Game Configuration Best Practices

1. **Responsive Canvas & Scaling**:
   Always configure `scale` with `Phaser.Scale.FIT` and `Phaser.Scale.CENTER_BOTH`:
   ```javascript
   scale: {
     mode: Phaser.Scale.FIT,
     autoCenter: Phaser.Scale.CENTER_BOTH,
     width: 1024,
     height: 768,
   }
   ```
2. **Physics**:
   Prefer `arcade` physics for 2D platformers, runners, shooters, and top-down games:
   ```javascript
   physics: {
     default: 'arcade',
     arcade: {
       gravity: { y: 600 },
       debug: false,
     }
   }
   ```
3. **Pixel Art Mode**:
   For pixel-art games, set `pixelArt: true` and `roundPixels: true` to prevent blurriness.

---

## Scene Lifecycle Flow

```
BootScene ──> PreloadScene ──> MainMenuScene ──> GameScene <──> PauseScene
                                                     │
                                                     └──> GameOverScene
```

- **`init(data)`**: Receive parameters passed from `scene.start('TargetScene', data)`.
- **`preload()`**: Queue textures, audio, fonts, tilemaps, or generate procedural graphics.
- **`create()`**: Instantiate GameObjects, add physics bodies, register input listeners, and set up timers.
- **`update(time, delta)`**: Frame-by-frame updates (player movement calculations, continuous polling).

---

## Input Handling Patterns

- **Keyboard Cursors**:
  ```javascript
  this.cursors = this.input.keyboard.createCursorKeys();
  this.wasd = this.input.keyboard.addKeys('W,A,S,D,SPACE');
  ```
- **Pointer / Touch Support**:
  Always ensure mobile and mouse compatibility with pointer events:
  ```javascript
  this.input.on('pointerdown', (pointer) => {
    // Pointer down coordinates (pointer.x, pointer.y)
  });
  ```

---

## Audio Management

Phaser supports HTML5 Audio and Web Audio. For projects without binary audio assets, procedural Web Audio tone generators can be created dynamically using the browser's `AudioContext`.

---

## Deployment & Verification Commands

- Development server: `npm run dev`
- Production build: `npm run build`
- Preview build: `npm run preview`
