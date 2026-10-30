# Chapter 4 Shortcut Customization & Updated Combat Controls

Updates Chapter 4's combat control scheme to match the ergonomic Burmese control specification (`Q` for Slingshot equip & hold-to-fire, `Mouse Left Click` or `S` for Fist Attack, `W` for Dodge/Evade, `Space` / `Up` for Jump, and `C` / `Down` for Crawl) and introduces an interactive **Shortcut Guide & Customization Modal** that opens when Chapter 4 starts (with a **"Go / စကစားမယ်"** action) and remains accessible from the Pause menu.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following control mappings and UX behaviors incorporate your confirmed choices and the Burmese control specification:

- **Confirmed Decision 1 — Pre-Game & Pause Shortcut Modal**: The Shortcut Explanation & Customization UI opens automatically when Chapter 4 starts (pausing combat until **"Go / စကစားမယ်"** is clicked) and can be reopened anytime from the Chapter 4 Pause menu (`Esc` or `Ⅱ`).
- **Confirmed Decision 2 — `Q` Key Slingshot Control**: Pressing and holding `Q` automatically equips the Slingshot (if owned in Phoe Htaung's Lwe-Ait bag) and charges the shot; releasing `Q` fires the stone.
- **Confirmed Decision 3 — Traditional Mouse + Keyboard Fist Attack (`Left Click` / `S`) & Dodge (`W`)**:
  - **Bare-Fist Attack / Shove**: Triggered via **Mouse Left Click** (when clicking outside a stone pickup pile) or keyboard **`S`** (replacing `J`).
  - **Dodge / Evade**: Triggered via keyboard **`W`** (replacing `L`).
  - **Jump & Crawl**: **`Space`** or **`Up Arrow`** jumps over low pillars; **`C`** or **`Down Arrow`** crawls under low stone arches and timber logs.
- **Live Key Rebinding & Persistence**: Every combat action in the Shortcut UI can be clicked and rebound to a custom key, persisted in `localStorage`, or reset to the default ergonomic preset with one click.

---

## 1. Overview & Core Concept

- **What It Does**: Replaces the legacy `J`/`K`/`L` combat keys with a responsive layout centered around the player's left hand (`A`/`D` move, `W` dodge, `S` or `Mouse Left Click` attack, `Q` slingshot, `Space` jump, `C` crawl, `E` grab), paired with an interactive pre-combat Shortcut Customization & Explanation modal.
- **Target Audience / Persona**: Players entering the Chapter 4 Guardian Ape Arena who want either traditional mouse-and-keyboard action controls (`WASD` + Left Click + `Q`) or a comfortable two-handed keyboard setup they can inspect and customize before the 75-second timer begins.
- **Key Value**: Directly improves player control feel and combat responsiveness while ensuring no player starts the arena confused about how to attack, dodge, jump, crawl, or fire the slingshot.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Chapter 4 Entry (Shortcut Modal & "Go")**:
     - When Chapter 4 loads, the arena pauses in its waiting state and presents the **Shortcut Guide & Customization Modal** (`ခလုတ်များ ပြင်ဆင်ရန် နှင့် လမ်းညွှန်`).
     - Each action row displays its Burmese + English label, how it works in combat, and an interactive keycap button (`<kbd>`).
     - Clicking **"Go / စကစားမယ်"** closes the modal, focuses the arena canvas, and lets the player begin combat immediately.
  2. **Rebinding a Shortcut**:
     - Clicking any action's key button switches that row into `"နှိပ်ပါ... (Press any key)"` listening mode with an amber highlight.
     - Pressing any key assigns it to that action (automatically swapping if the key was already used by another action so there are never duplicate conflicts) and saves to `localStorage`.
     - Clicking **"မူလအတိုင်း ပြန်ထားမယ် (Reset Defaults)"** restores the standard `Q` / `S` + `Left Click` / `W` / `Space` / `C` / `E` preset.
  3. **Mid-Game Pause Access**:
     - Opening Pause (`Esc` or `Ⅱ`) includes a **"⌨ ခလုတ်များ ပြင်မယ် (Shortcuts)"** button to reopen the customization modal mid-fight while keeping the arena timer paused.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Ancient Bagan sandstone-and-gold dialog framing (`#172a21` / `#233c2d` deep temple slate, `#cfa861` / `#f59e0b` warm gold trim, `#f5efe6` sand ivory typography).
  - *Typography & Hierarchy*: `Noto Sans Myanmar` + `Plus Jakarta Sans` with high-contrast keycaps, scannable two-column action rows, and a prominent gold primary **"Go / စကစားမယ်"** CTA button (`min-height: 48px`).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1 — Smart Mouse Left-Click Disambiguation (Attack vs. Diegetic Stone Grab)**:
  - *Chosen Approach*: Clicking directly on a stone pile (`x ≈ 100`, `640`, `1170` near ground level) triggers Phoe Htaung's Diegetic Grab (`PICKUP` → `RUMMAGE` → `FREE`), while Left-Clicking anywhere else in the arena triggers a bare-fist punch/shove attack.
  - *Why*: Preserves the tactile click-to-grab stone mechanic from `character.md` while supporting traditional Mouse Left-Click melee combat.
- **Decision 2 — Instant `Q` Slingshot Equip + Charge**:
  - *Chosen Approach*: Holding `Q` automatically switches Phoe Htaung's active weapon to `SLING` (if he owns the slingshot) and begins charging the draw bar immediately; releasing `Q` fires the stone.
  - *Why*: Eliminates the friction of opening the bag before firing in the heat of battle while still allowing manual bag inspection (`B`).

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:
```
┌──────────────────────────────────────────────────────────────────────┐
│                   Shortcut Settings Store (localStorage)             │
│  moveLeft: 'a' | moveRight: 'd' | dodge: 'w' | attack: 's' (+ LMB)   │
│  sling: 'q'    | jump: ' '      | crawl: 'c' | grab: 'e' | bag: 'b'  │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│             Shortcut Customization & Guide Modal (DOM UI)            │
│  • Opens automatically on Chapter 4 start (waiting / paused state)   │
│  • Interactive click-to-rebind key buttons + Conflict auto-swap      │
│  • "မူလအတိုင်း ပြန်ထားမယ် (Reset)" & "Go / စကစားမယ်" primary button  │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                 Chapter 4 Arena Input & Combat Loop                  │
│  • Keyboard listener maps active custom bindings to ArenaInput       │
│  • Pointer listener triggers Fist Attack on Left Click (non-pickup)  │
│  • Holding `sling` key ('Q') auto-equips SLING & charges draw        │
└──────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - `ArenaShortcuts` configuration object persisted in `localStorage` under `phoe-htaung.shortcuts.v1` with defaults:
    - `moveLeft`: `'a'` (plus `ArrowLeft`)
    - `moveRight`: `'d'` (plus `ArrowRight`)
    - `attack`: `'s'` (plus `Mouse Left Click`)
    - `dodge`: `'w'`
    - `sling`: `'q'`
    - `jump`: `' '` (plus `ArrowUp`)
    - `crawl`: `'c'` (plus `ArrowDown`)
    - `grab`: `'e'`
    - `bag`: `'b'`
- **Interactive Component & State Mapping**:
  - When Chapter 4 initializes (`create()`), the Shortcut Guide & Customization Modal opens before the timer starts (`session.paused = true` until **"Go / စကစားမယ်"** is clicked, with a clean bypass when automated Playwright tests click HUD controls directly).
  - Pressing and holding the configured `sling` key (`Q` by default) calls `this.session.equipWeapon('SLING')` if `this.session.hasSling` is true and sets `input.sling = true`.
  - Pressing the configured `attack` key (`S` by default) or Left-Clicking the arena (outside stone pickup piles and UI buttons) sets `edges.punch = true` (and switches to `FISTS` if needed for a quick shove).
  - Pressing the configured `dodge` key (`W` by default) sets `edges.dodge = true`.
