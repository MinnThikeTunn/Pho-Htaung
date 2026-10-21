# ဖိုးထောင် - ပုဂံရွှေမြို့တော်ရှာပုံတော်
### *Phoe Htaung: Die Again in the Golden City*

An atmospheric 2D Point-and-Click / Troll Puzzle Platform-Adventure inspired by **Machinarium** and **Die Again**, set in the subterranean ruins of Bagan, Myanmar.

Built with **Phaser 3.88.2**, bundled with **Vite 6**, and powered by a 100% procedural Web Audio synthesizer.

---

## 🎭 Story & Narrative

* **Protagonist:** **Phoe Htaung (မောင်ဖိုးထောင်)** — Village loudmouth fleeing loan sharks. Wears a tucked-up longyi (*ပုဆိုးခါးတောင်းကျိုက်*), a single flip-flop (*ခြေညှပ်ဖိနပ်တစ်ဖက်*), an unruly tuft of hair, and an authentic Shan shoulder bag (*လွယ်အိတ်စုတ်ကြီး*).
* **Narrator & Shady Broker:** **U Gyi (ဦးကြီး)** — Upper-Myanmar cynical YouTube-recap voiceover artist who sarcastically advises the player directly into gruesome comedic traps.
* **Core Loop:** U Gyi gives misleading advice $\rightarrow$ Player follows standard video game tropes $\rightarrow$ Comedic trap execution $\rightarrow$ Death counter increments (`💀 [Burmese Numeral]`) $\rightarrow$ Absurd troll solution discovered.

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
Open your browser at `http://localhost:3000` to play!

### 3. Build for Production
```bash
npm run build
```
Production assets are generated in `dist/`.

---

## 🎮 Game Controls & Diegetic Interactions

- **Point-and-Click Movement:** Click anywhere along the ground to walk.
- **Proximity-Based Interaction:** Phoe Htaung physically walks over and faces hotspots before interacting.
- **Keyboard Walk/Jump:** `A` / `D` or `Arrow Keys` to walk; `W`, `Space`, or `Up Arrow` to jump.
- **Diegetic Shoulder Bag (Lwe-Ait):** Move cursor to the top edge (or tap the `🎒 လွယ်အိတ်` tab) to reveal the inventory bar; auto-hides during exploration.
- **Item Crafting & Combination:** Click an item in inventory (e.g. `betel_cutter`), then click another item (`torn_bottle`) to combine them into `half_bottle`.
- **Hotspot Hint Pulse:** Click the `💡` hint button on the top HUD (or press `H` / `Space`) to pulse golden sketch rings around all interactables.
- **Mute / Audio Toggle:** `M` or the `🔊` button on the top HUD.
- **Fullscreen:** `F` or `⛶` button.

---

## 🏛️ Chapter Guide

1. **Chapter 1: The Chasm & Drawbridge (မမြင်ရသော ကောင်းကင်တုံးနှင့် ဒုံးပျံမြေပြင်)**  
   - Puzzles: Missing cog and bamboo lever, wall chalk diagram, rocket platform trap, and secret left-wall escape.
2. **Chapter 2: The Furnace & Steam Boiler (ရေနွေးငွေ့ ပိုက်လိုင်းနှင့် မီးဖိုလှိုဏ်ခေါင်း)**  
   - Puzzles: Betel cutter + torn bottle crafting, 3x3 pipe pressure grid, steam deflection into furnace.
3. **Chapter 3: The Scale & Balance Room (ကန်းနေသော နတ်ရုပ်ကြီးနှင့် ၁၀ ပိဿာ ချိန်ခွင်)**  
   - Puzzles: Stone plaque inscription scratching, weight kicking, ceiling crusher hazard.
4. **Chapter 4: The Vault & Sphinx Safe (စကားထာ သံမဏိသေတ္တာနှင့် ကတ်ကြေးထောင်ချောက်)**  
   - Puzzles: 3-digit rotary dials (Myanmar numerals), engineer's secret blueprint, dried chili sneezing keyhole trick.
5. **Chapter 5: The Golden Chamber (မဟာရတနာသိုက်နှင့် ၅၀ တန် ကျောက်တုံးကြီး)**  
   - Puzzles: Fake victory monolith, 50-ton crushing boulder slapstick.
6. **The Big Reveal (ဦးကြီး၏ သံတိုသံစ ဂိုဒေါင်)**  
   - Meta fourth-wall break revealing U Gyi smoking his cheroot in his prop studio with final death tally statistics.

---

## 📁 Project Architecture

```
├── public/
│   ├── assets/
│   │   ├── cursors/                 # Custom interactive hand cursors
│   │   └── icons/                   # Game-Icons.net vector assets
│   ├── favicon.svg
│   └── manifest.json                # PWA manifest
├── src/
│   ├── main.js                      # Phaser game configuration & scene registry
│   ├── scenes/
│   │   ├── BootScene.js             # Bootloader
│   │   ├── PreloadScene.js          # Procedural texture generator (Phoe Htaung, U Gyi, Traps)
│   │   ├── IntroScene.js            # Bagan dawn silhouette & U Gyi monologue
│   │   ├── Chapter1Scene.js         # The Chasm & Drawbridge
│   │   ├── Chapter2Scene.js         # The Furnace & Steam Boiler
│   │   ├── Chapter3Scene.js         # The Scale & Balance Room
│   │   ├── Chapter4Scene.js         # The Vault & Sphinx Safe
│   │   ├── Chapter5Scene.js         # The Golden Chamber
│   │   └── RevealScene.js           # U Gyi Studio Twist & Game Over
│   ├── ui/
│   │   ├── GameHUD.js               # Rounded-32px floating pill HUD
│   │   ├── InventoryBar.js          # Auto-hiding Burmese shoulder bag tray
│   │   ├── SubtitleBox.js           # Typewriter subtitle overlay with vocal blips
│   │   └── ThoughtBubble.js         # Non-verbal Machinarium thought balloons
│   └── utils/
│       ├── AmbientAtmosphere.js     # Dust motes, cavern drips, god rays, weathered overlays
│       ├── GameState.js             # LocalStorage persistent state & Burmese numerals
│       ├── MicroInteractions.js     # Proximity juice, ambient toys, soot puff reactions
│       └── SoundEngine.js           # Web Audio API procedural synthesizer
├── index.html                       # Viewport wrapper & typography
├── package.json
└── vite.config.js
```
