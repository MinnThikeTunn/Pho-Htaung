---
description: Coding guidelines and conventions for Phaser 3 web game development in this repository
trigger: always_on
---

# Phaser Web Game Development Guidelines

1. **Architecture**:
   - Organize code into dedicated Scenes under `src/scenes/`.
   - Never place game logic inside global scope. Always encapsulate game state inside Scene instances.
   - Separate UI/HUD elements into an overlay scene or distinct GameObjects to prevent camera scrolling from moving UI components.

2. **Performance & Memory**:
   - Reuse sprites using `Phaser.GameObjects.Group` with object pooling where applicable (bullets, particles, hazards).
   - Destroy unused GameObjects, timers, and custom event listeners during `scene.events.once('shutdown')` to prevent memory leaks.

3. **Responsive Scaling & Aesthetic**:
   - Ensure the canvas automatically scales responsively to the window using `Phaser.Scale.FIT` and centers with `Phaser.Scale.CENTER_BOTH`.
   - Adhere to clean, font-black modern styling and sleek rounded controls for UI/HUD containers and overlays.
