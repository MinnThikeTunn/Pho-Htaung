# Cosmic Orbit — Phaser 3 Web Game

A high-performance, responsive 2D HTML5 web game built with **Phaser 3** and bundled with **Vite**.

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:3000` to launch and play the game!

### 3. Build for Production
```bash
npm run build
```
Production assets are generated in `dist/` ready to be hosted on Vercel, Netlify, GitHub Pages, or any static host.

---

## 🎮 Game Controls

- **Movement:** `W`, `A`, `S`, `D` or `Arrow Keys`
- **Shoot / Boost:** `Space` or mouse/touch tap
- **Pause Game:** `P` or `Esc`
- **Mute Audio:** `M`
- **Mobile Support:** Touch anywhere on canvas to steer and fire!

---

## 🤖 Installed Antigravity AI Skills

This repository is equipped with two specialized skills:

1. **`phaser-game`** (`.agents/skills/phaser-game/SKILL.md`):
   - Comprehensive local Phaser 3 architecture guide
   - Scene lifecycle runbooks, arcade physics recipes, responsive scaling, particle systems, procedural Web Audio generation.
2. **`phaser-game-agent`** (`.agents/skills/phaser-game-agent/SKILL.md` & global `~/.gemini/config/skills/`):
   - Official Phaser Game Agent skill connecting to cloud workspaces and MCP tools (`pga_*`).
   - One-time sign-in setup:
     ```bash
     npx @phaserjs/game-agent
     ```

---

## 📁 Project Architecture

```
├── .agents/
│   ├── rules/
│   │   └── phaser.md            # Phaser coding conventions
│   └── skills/
│       ├── phaser-game/         # Phaser 3 engineering runbook
│       └── phaser-game-agent/   # Official cloud agent skill
├── public/                      # Static assets
├── src/
│   ├── main.js                  # Game configuration & Scene registry
│   ├── utils/
│   │   └── AudioSynth.js        # Procedural Web Audio sound effects
│   └── scenes/
│       ├── BootScene.js         # Bootloader
│       ├── PreloadScene.js      # Procedural texture generator & progress bar
│       ├── MainMenuScene.js     # Perplexity-styled menu with high score
│       ├── GameScene.js         # Core gameplay & physics loop
│       ├── GameOverScene.js     # Score presentation & replay handler
│       └── PauseScene.js        # Pause menu modal
├── index.html                   # High-end viewport wrapper
├── package.json
└── vite.config.js
```
