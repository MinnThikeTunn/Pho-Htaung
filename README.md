# ဖိုးထောင် — ပုဂံရွှေမြို့တော် စွန့်စားခန်း (Phoe Htaung Adventure)

A Burmese cartoon puzzle and action adventure set in the subterranean ruins of ancient Bagan, Myanmar. Rewritten as a modern React application with Vite, TypeScript, and Phaser 3 game scenes.

## 🌟 Highlights & Architecture

- **React Application Shell**: Built with React 19, modular components (`App`, `TopBar`, `VolumeControl`, `MechanicsModal`, `BootSplash`, `Flanks`), and strict TypeScript typing.
- **5-Chapter Adventure**:
  - **Chapter 1 (Bridge Puzzle)**: Machinarium-style environmental puzzle with winch machine, bamboo lever, and secret passageways.
  - **Chapter 2 (Underground Action)**: Platforming challenge with falling stones, pressure plate lift, and gold collection.
  - **Chapter 3 (Balance Scale Chamber)**: Precision item weight puzzle with counterweights and diegetic inventory.
  - **Chapter 4 (Guardian Ape Arena)**: Real-time action combat with fists, slingshot charge shots, and dodge rolls.
  - **Chapter 5 (Final Hall & Trivia Escape)**: Confrontation with U Gyi, cart sprint escape, and 80-question Burmese trivia challenge.
- **Burmese Localization**: Authentic Upper-Burmese dialogue, typography (*Noto Sans Myanmar*), and localized numerals (`၀-၉`).
- **Dynamic Audio Architecture**: Procedural Web Audio API sound synthesis and vertical stems managed with Howler.js.
- **Diegetic UI & Responsive Design**: Seamless 16:9 canvas scaling (`Phaser.Scale.FIT`), authentic Shan bag inventory, and fantasy-themed overlay dialogs.

## 🎮 Game Controls

| Action | Key / Input | Notes |
| :--- | :--- | :--- |
| **Move** | `A` / `D` or `←` / `→` | Horizontal navigation |
| **Jump** | `W`, `Space`, or `↑` | Jump onto platforms |
| **Interact / Pick up** | `E` / Click | Pick up items, pull levers, use mechanisms |
| **Punch / Attack** | `J` | Basic attack in Chapters 4 & 5 |
| **Slingshot / Stone Throw** | `K` (Hold & Release) | Requires slingshot equipped from bag |
| **Dodge / Roll** | `L` | Dodge incoming attacks |
| **Open Bag / Inventory** | `B` or `🎒` button | Open traditional Shan shoulder bag |
| **Pause / Menu** | `Esc` | Pause game and access settings |
| **Test Chapter 5** | `5` | Instant development shortcut to Chapter 5 |

## 🛠️ Development & Commands

```bash
# Install dependencies
npm install

# Start Vite dev server on port 3000
npm run dev

# Run Vitest test suite
npm test

# Type check TypeScript files
npm run typecheck

# Build optimized production bundle
npm run build
```

## 📜 License & Credits

Distributed under the MIT License.
Character and world inspired by traditional Burmese humor and classic point-and-click adventure games.
