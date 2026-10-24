# ဖိုးထောင် - ပုဂံရွှေမြို့တော်ရှာပုံတော်
### *Phoe Htaung: Die Again in the Golden City*

[![Phaser 3](https://img.shields.io/badge/Engine-Phaser%203.88.2-orange.svg)](https://phaser.io/)
[![Vite](https://img.shields.io/badge/Bundler-Vite%206-646CFF.svg)](https://vitejs.dev/)
[![Howler](https://img.shields.io/badge/Audio-Howler.js%202.2.4-blue.svg)](https://howlerjs.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](#license)

An atmospheric 2D Point-and-Click / Troll Puzzle Adventure inspired by **Machinarium** and **Die Again**, set in the subterranean ruins of ancient Bagan, Myanmar. Featuring authentic Upper-Burmese comedic satire, hand-inked watercolor art style (Adolf Lachman aesthetic), and a phase-locked vertical stem audio director.

---

## 📖 Table of Contents

- [Overview & Story](#-overview--story)
- [Key Features](#-key-features)
- [Quick Start](#-quick-start)
- [Game Controls](#-game-controls)
- [Chapter Guide & Solutions](#-chapter-guide--solutions)
- [Audio Architecture](#-audio-architecture)
- [Project Structure](#-project-structure)
- [Technical Stack & Design System](#-technical-stack--design-system)
- [Asset Pipeline](#-asset-pipeline)
- [License & Credits](#-license--credits)

---

## 🎭 Overview & Story

### Narrative Synopsis
Centuries ago, beneath the sacred pagodas and dusty plains of Bagan, an enigmatic civilization constructed mechanical vaults packed with traps and unimaginable treasures. Kings, conquerors, and treasure hunters entered; none returned.

Now enters our unlikely hero: **Phoe Htaung (မောင်ဖိုးထောင်)**. He isn't here for glory—he's desperately evading village loan sharks after a string of bad gambling debts. Guided by the cynical, cheroot-smoking YouTube-recap voiceover artist **U Gyi (ဦးကြီး)**, Phoe Htaung is coaxed directly into hilarious, over-the-top death traps.

```
       [ U Gyi Gives Misleading Advice ]
                       │
                       ▼
       [ Player Follows Conventional Video Game Tropes ]
                       │
                       ▼
       [ Gruesome & Comedic Slapstick Trap Execution ]
                       │
                       ▼
       [ Death Counter Increments (💀 Burmese Numerals) ]
                       │
                       ▼
       [ Absurd Troll / "Jungle Engineering" Solution Discovered ]
```

### Dramatis Personae
* **Phoe Htaung (မောင်ဖိုးထောင်):** Village loudmouth and reluctant hero. Constantly chews betel nut, sports an unruly tuft of hair, wears a tucked-up longyi (*ပုဆိုးခါးတောင်းကျိုက်*), a single worn flip-flop (*ခြေညှပ်ဖိနပ်တစ်ဖက်*), and a torn Shan shoulder bag (*လွယ်အိတ်စုတ်ကြီး*).
* **U Gyi (ဦးကြီး):** Upper-Myanmar satirical narrator, shady broker, and fourth-wall breaker who secretly collects the belongings of dead adventurers to resell at his scrap warehouse.

---

## ✨ Key Features

- **Amanita / Adolf Lachman Visual Aesthetic:** 5-layer depth parallax backgrounds combining ancient Bagan stupas, rusty gears, warm golden-hour lighting, paper-weathered overlays, and hand-inked item sprites.
- **Diegetic UI & Non-Intrusive HUD:** Auto-hiding traditional Shan shoulder bag (*Lwe-Ait*) inventory tray, non-verbal comic thought bubbles, and rounded floating status badges.
- **Interactive Proximity Pathfinding:** Phoe Htaung physically navigates and faces hotspots before interacting, refusing out-of-reach actions with expressive animations.
- **Tactile Micro-Interactions ("Juice"):** Interactive background props (bell wobbles, geckos scuttling, chirping birds, loose bricks, steam puffs) that reward player curiosity.
- **Item Crafting & Combination:** Drag-and-combine inventory system (e.g., cutting a torn bottle with betel shears to make a steam deflector).
- **Phase-Locked Vertical Stem Audio:** Seamless dynamic soundtrack with 3 synchronized ambient stems (Drone, Jungle, Kalimba), automatic dialogue ducking, and instantaneous slapstick mutes.
- **Edge-to-Edge Responsive Canvas:** Dynamic viewport scaling with `Phaser.Scale.RESIZE` ensuring optimal presentation across monitors, laptops, and mobile screens.
- **Burmese Localization:** Full Unicode support (*Noto Sans Myanmar* & *Pyidaungsu*), typewriter subtitle dialogue, and localized numeral conversions (`၀-၉`).

---

## ⚡ Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.0.0 or higher recommended)
- `npm` (included with Node.js)

### 1. Installation
Clone the repository and install project dependencies:
```bash
git clone https://github.com/your-username/game.git
cd game
npm install
```

### 2. Run Local Development Server
Start Vite's fast HMR development server:
```bash
npm run dev
```
Navigate to `http://localhost:3000` (or the URL displayed in your terminal) to play.

### 3. Build for Production
Bundle optimized assets for deployment:
```bash
npm run build
```
Production assets are compiled into the `dist/` directory.

### 4. Preview Production Build
Locally preview the generated production build:
```bash
npm run preview
```

### 5. Convert Audio (Optional Utility)
Convert audio stems and foley files to optimized OGG format:
```bash
npm run convert:audio
```

---

## 🎮 Game Controls

| Action | Controls | Description |
| :--- | :--- | :--- |
| **Walk (Point-and-Click)** | `Left Click` / `Tap` | Click anywhere along the ground to walk Phoe Htaung there |
| **Walk (Keyboard)** | `A` / `D` or `←` / `→` | Conventional horizontal movement |
| **Jump** | `W`, `Space`, or `↑` | Jump over obstacles (primarily Chapter 1) |
| **Open Bag / Inventory** | Move cursor to top edge or click `🎒` | Unfolds the traditional Shan shoulder bag tray |
| **Inspect / Interact** | `Left Click` on Hotspots | Pick up items, pull levers, examine ancient inscriptions |
| **Item Crafting** | Click item $\rightarrow$ Click target item | Combines two compatible inventory items together |
| **Hotspot Hint Pulse** | `H` or `Space` or `💡` button | Pulses glowing golden rings around all interactables |
| **Mute Audio** | `M` or `🔊` button | Toggles all background music and sound effects |
| **Fullscreen** | `F` or `⛶` button | Toggles borderless edge-to-edge fullscreen |
| **Restart (Game Over)** | `R` key | Bypass the evasive cursor-dodging restart button |

---

## 🏛️ Chapter Guide & Solutions

### Chapter 1: The Chasm & Drawbridge (မမြင်ရသော ကောင်းကင်တုံးနှင့် ဒုံးပျံမြေပြင်)
* **Setting:** Canyon chasm with an ancient rusty winch machine and a visible gold coin on the opposite platform.
* 💀 **Trap 1 (Invisible Sky Block):** Jumping across the pit causes Phoe Htaung to strike his head on an invisible ceiling block and plunge upside down.
* 💀 **Trap 2 (Rocket Ground):** Jumping low lands on the right platform, which rockets upward into ceiling spikes.
* 💡 **Troll Solution:** Walk all the way to the far **left edge** of the screen ($x \le 20$) and push against the crumbling wall for 1 second. A secret trapdoor opens to the subterranean sewers.

### Chapter 2: The Furnace & Steam Boiler (ရေနွေးငွေ့ ပိုက်လိုင်းနှင့် မီးဖိုလှိုဏ်ခေါင်း)
* **Setting:** A locked subterranean blast gate beside a roaring furnace with a $3 \times 3$ steam pipe network.
* 💀 **Trap 1 (The 50-Viss Spike):** Attempting to pick up the heavy rusty spike snaps Phoe Htaung's bag strap, crushing his big toe.
* 💀 **Trap 2 (Boiling Steam Bath):** Aligning the pipes and pulling the lever sprays scalding steam backwards, boiling Phoe Htaung into a lobster.
* 💡 **Troll Solution:** 
  1. Pick up the **Dried Chili** (`dried_chili`) and **Dry Twigs** (`dry_twigs`).
  2. Open the inventory bag, select the **Betel Cutter** (`betel_cutter`), and click the **Torn Bottle** (`torn_bottle`) to craft a **Half Bottle** (`half_bottle`).
  3. Drag the `half_bottle` onto the steam nozzle/lever.
  4. Pull the lever: the plastic bottle deflects the steam directly into the furnace, extinguishing the flames and unlocking the cave door.

### Chapter 3: The Scale & Balance Room (ကန်းနေသော နတ်ရုပ်ကြီးနှင့် ၁၀ ပိဿာ ချိန်ခွင်)
* **Setting:** A giant blind deity statue holding balance pans with an inscription stating *"၁၀ ပိဿာ ညီမျှလျှင် တံခါးပွင့်အံ့"* (Door opens when weights equal 10 viss).
* 💀 **Trap 1 (Correct Math Punishment):** Placing the 3-viss stone and 7-viss gold to balance the 10-viss weight enrages the statue for showing off math skills, crushing Phoe Htaung with the scale pan.
* 💀 **Trap 2 (Laser Eyes):** Slotting the red ruby into the statue's eye socket gives it vision, causing it to vaporize Phoe Htaung with twin laser beams.
* 💡 **Troll Solution:**
  1. Select the **Betel Cutter** from inventory and drag it onto the wall inscription (`"၁၀"`). Phoe Htaung scratches out the `"၁"`, altering the text to `"၀ ပိဿာ"` (0 viss).
  2. Click the 10-viss weight on the left pan to kick it off. Both pans now balance at 0 viss, opening the chamber gate.

### Chapter 4: The Vault & Sphinx Safe (စကားထာ သံမဏိသေတ္တာနှင့် ကတ်ကြေးထောင်ချောက်)
* **Setting:** A reinforced iron vault with a 3-digit rotary combination lock and the classic Sphinx riddle inscribed on the stone.
* 💀 **Trap 1 (The Sphinx Riddle Bait):** Entering the correct riddle answer `4 - 2 - 3` triggers a hidden spring blade that amputates Phoe Htaung's legs.
* 💡 **Troll Solution:** Select the **Dried Chili** (`dried_chili`) from the inventory and insert it into the vault keyhole. The vault sneezes violently (*အဟွတ်! အဟွတ်!*), launching its locking cylinder across the room.

### Chapter 5: The Golden Chamber (မဟာရတနာသိုက်နှင့် ၅၀ တန် ကျောက်တုံးကြီး)
* **Setting:** A glistening palace chamber filled with mountains of gold coins and diamond chests.
* 💀 **Trap 1 (Victory Bait):** Walking toward the treasure triggers celebratory fanfare right before a 50-ton granite monolith engraved with `"VICTORY!"` crushes Phoe Htaung flat.

### Scene 6: The Big Reveal & Studio Twist (ဦးကြီး၏ သံတိုသံစ ဂိုဒေါင်)
* **The Twist:** The camera zooms out to reveal that the "Golden City" was merely cardboard cutouts and spray-painted corrugated iron inside U Gyi's scrap warehouse. U Gyi emerges puffing his cheroot to mock the player's total deaths and IQ loss.
* **The Evasive Button:** The `[ Play Again ]` button actively runs away from the player's mouse cursor whenever approached within 100 pixels. Press `R` or trigger 10 dodges to restart.

---

## 🔊 Audio Architecture

The game utilizes a dual-layer audio architecture managed by [`AudioDirector.js`](file:///D:/game/src/audio/AudioDirector.js) combining **Howler.js** multi-channel streaming with a custom **Web Audio API procedural synthesizer** fallback.

```
                   ┌───────────────────────────────────────────────┐
                   │             AudioDirector (Singleton)         │
                   └───────────────────────┬───────────────────────┘
                                           │
                ┌──────────────────────────┴──────────────────────────┐
                ▼                                                     ▼
     [ Howler.js Audio Engine ]                            [ AudioSynth Fallback ]
  - Phase-locked vertical stems                         - Web Audio API procedural osc
  - Exponential & linear gain ramps                     - Dynamic frequency sweeps
  - True format streaming (OGG/MP3)                     - Zero-asset runtime resilience
                │                                                     │
     ┌──────────┴───────────────────────┐                             │
     ▼                                  ▼                             ▼
[ Ambient Stems ]               [ Tactile Foley SFX ]          [ Speech Blips ]
• stem_drone (Warm Moog)        • sfx_betel_chew (Chewing)     • Animal Crossing style
• stem_jungle (Crickets/Wind)   • sfx_step_flipflop (Slap)       pitch-modulated blips
• stem_kalimba (Pluck Melody)   • sfx_step_barefoot (Thud)       synced to typewriter
                                • sfx_clang_fall (Impact)
                                • sfx_puzzle_chime (Chime)
```

### Mixing & Synchronization Principles
1. **Phase-Locked Clock:** All three background stems start at identical hardware timestamps ($t = 0.0\text{s}$). Inactive stems run at `volume: 0.0` rather than pausing, guaranteeing seamless crossfades.
2. **Dialogue Ducking:** Triggering U Gyi's subtitles ducks running musical stems by $-60\%$ over `300ms`, cleanly restoring them once speech concludes.
3. **Comedic Hard Mute:** Upon any trap trigger, background stems instantly zero out within `15ms` to maximize comedic slapstick timing.

---

## 📁 Project Structure

```
game/
├── .agents/                        # AI pair programmer skills & coding rules
│   ├── rules/phaser.md             # Phaser 3 development guidelines
│   └── skills/                     # Specialized agent capabilities
├── notes/                          # Design logs, specifications & change notes
│   ├── FEATURE_SUGGESTIONS_FOR_AGENTS.md
│   ├── RECENT_CHANGES_LOG.md
│   └── ULTIMATE_JUDGE_VERDICT.md
├── public/                         # Static game assets
│   ├── assets/
│   │   ├── audio/                  # Background stems and Foley sound effects
│   │   ├── character/              # Phoe Htaung sliced sprite sheet frames
│   │   ├── cursors/                # Custom hand cursors (SVG)
│   │   ├── icons/                  # Vector icons for UI & puzzles
│   │   ├── items/                  # Hand-drawn inventory items
│   │   ├── parallax/               # 5-layer Bagan & canyon parallax backgrounds
│   │   ├── props/                  # Environmental props (bell, gecko, bird, etc.)
│   │   └── textures/               # Paper and parchment weathered textures
│   ├── favicon.svg                 # Game favicon
│   └── manifest.json               # Web application PWA manifest
├── scripts/                        # Python & PowerShell asset processing scripts
│   ├── convert-to-ogg.ps1          # Audio compression tool
│   ├── process_chapter1_layers.py  # Parallax layer slicer
│   ├── slice_and_polish_items.py   # Item asset enhancer
│   └── slice_character.py          # Character sprite sheet cutter
├── src/                            # Source code
│   ├── audio/
│   │   └── AudioDirector.js        # Howler audio manager & stem synchronization
│   ├── scenes/
│   │   ├── BootScene.js            # Initial engine bootstrap
│   │   ├── PreloadScene.js         # Asset preloader & procedural graphics backup
│   │   ├── IntroScene.js           # Bagan sunrise cinematic & prologue
│   │   ├── MainMenuScene.js        # Title screen & chapter selector
│   │   ├── Chapter1Scene.js        # Chasm & Drawbridge
│   │   ├── Chapter2Scene.js        # Furnace & Steam Boiler
│   │   ├── Chapter3Scene.js        # Statue Scale & Balance Room
│   │   ├── Chapter4Scene.js        # Vault & Sphinx Riddle
│   │   ├── Chapter5Scene.js        # Golden Palace Chamber
│   │   ├── RevealScene.js          # U Gyi Scrap Warehouse Twist & Game Over
│   │   ├── PauseScene.js           # Modal pause menu
│   │   ├── GameOverScene.js        # Slapstick death recap
│   │   └── VictoryScene.js         # Mock victory sequence
│   ├── ui/
│   │   ├── GameHUD.js              # Floating pill HUD (Deaths, Hint, Fullscreen, Mute)
│   │   ├── InventoryBar.js         # Auto-hiding Burmese Shan bag tray
│   │   ├── SettingsModal.js        # Audio & display configuration modal
│   │   ├── SubtitleBox.js          # Typewriter subtitle dialogue box
│   │   └── ThoughtBubble.js        # Non-verbal comic thought bubbles
│   ├── utils/
│   │   ├── AmbientAtmosphere.js    # Cavern dust motes, god rays & weathered overlays
│   │   ├── AudioSynth.js           # Procedural Web Audio API sound generator
│   │   ├── GameState.js            # LocalStorage persistence & Burmese numeral utils
│   │   ├── MicroInteractions.js    # Environmental tactile clickables
│   │   └── ParallaxBackground.js   # Multi-layer smooth scrolling manager
│   └── main.js                     # Phaser game instantiation & scene registration
├── audio_event_timeline_specification.md  # Detailed audio specification
├── game_technical_specification.md        # Complete game design specification
├── index.html                      # HTML5 entry point & typography imports
├── package.json                    # Dependencies & npm scripts
├── vite.config.js                  # Vite server & bundler settings
└── README.md                       # Project documentation
```

---

## 🛠️ Technical Stack & Design System

* **Game Engine:** [Phaser 3.88.2](https://phaser.io/) using Arcade Physics.
* **Build System:** [Vite 6.0](https://vitejs.dev/) with native ES module loading and instant HMR.
* **Audio Engine:** [Howler.js 2.2.4](https://howlerjs.com/) + custom Web Audio API procedural synthesis.
* **Display Mode:** `Phaser.Scale.RESIZE` with edge-to-edge full window support and auto-centering.
* **Typography:** Google Fonts:
  - `Noto Sans Myanmar` (Weights 400, 600, 700, 900)
  - `Plus Jakarta Sans` (Weights 500, 700, 800, 900)
* **Palette:**
  - Background Dark: `#0c0a08`
  - Parchment & Sand: `#e7d7b5` / `#d4be94`
  - Terracotta & Amber: `#d97706` / `#b45309`
  - Muted Charcoal: `#1c1815`
  - Gold Accent: `#f59e0b`

---

## 🎨 Asset Pipeline

All visual and audio assets follow a custom optimization pipeline:
1. **Character Sprites:** 60x84 platformer-scaled PNGs sliced from master sprite sheets using `scripts/slice_character.py`.
2. **Parallax Backgrounds:** 5 distinct depth planes (Sky, Far Stupas, Mid Ruins, Walkable Ground, Foreground Silhouette) processed through `scripts/process_chapter1_layers.py`.
3. **Foley & Music:** 48kHz audio stems converted to lightweight, highly compatible OGG Vorbis tracks via `scripts/convert-to-ogg.ps1`.
4. **Procedural Fallback:** In the event of network asset failure, `PreloadScene.js` and `AudioSynth.js` automatically synthesize vector canvas graphics and Web Audio oscillations so the game remains 100% playable offline or in asset-constrained environments.

---

## 📄 License & Credits

- **Game Design & Code:** Antigravity Team & Community Contributors.
- **Inspirations:**
  - *Machinarium* by [Amanita Design](https://amanita-design.net/)
  - *Die Again* & classic troll platformers
- **Iconography:** Vector icons adapted from [Game-Icons.net](https://game-icons.net/) under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).
- **License:** Distributed under the MIT License. See `LICENSE` for details.
