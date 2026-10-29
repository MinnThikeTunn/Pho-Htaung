---
description: Core stable mechanics, diegetic rules, and design system standards for Phoe Htaung
trigger: always_on
---

# Phoe Htaung Core Design System & Stable Mechanics Standards

1. **Diegetic Guidance & Clue Directives (Strict)**:
   - **U Gyi is the Sole Hint & Clue System**:
     - Never create world-space text stickers, labels, or floating tags (e.g. `နံရံကြောင်း`, `🚩 CHECKPOINT`, etc.).
     - Never create hint boxes, hint buttons, or floating hint modals.
     - All narrative guidance, puzzle hints, and warnings are delivered strictly through U Gyi's overhead speech balloon (`top: 14%`).
   - **Zero On-Screen Keyboard Shortcut Displays**:
     - Never render keyboard shortcut strips or banners on screen (e.g. `<kbd>A</kbd><kbd>D</kbd>`, `<kbd>SPACE</kbd>`, `<kbd>H</kbd>`, `<kbd>R</kbd>`).
     - Mechanics must be discovered naturally through spatial affordances and U Gyi's coaching.

2. **Spatial Geometry & Ground Baseline**:
   - Universal Walkable Baseline: `groundY = height * 0.80 = 576px` on $1280 \times 720$ canvas. This $y$-coordinate is immutable and strictly unified across **every chapter and room without exception** (Chapter 1, Chapter 2, Chapter 3, Chapter 4, Chapter 5, and Intro).
   - Fixed Camera: Static $1280 \times 720$ viewport with zero mouse-parallax drift and zero breathing motion.

3. **Aesthetic & Vector Inking**:
   - Follow high-end minimalist Perplexity aesthetic: font-black headings (`font-weight: 900`), generous negative space, rounded-[32px] containers, and subtle micro-animations.
   - 3-Layer procedural vector inking formula: Outer `INK` outline (`0x182720`) $\rightarrow$ base material fill (`STEP_STONE`, `WOOD`, `STONE`) $\rightarrow$ top `CREAM` highlight bevel (`0xe9dfbd`) $\rightarrow$ bottom shadow bevel.

4. **Myanmar Traditional Bag (*Lwe-Ait*) & Bottom Inventory Dock**:
   - Permanent Bottom-Docked Visibility: The Myanmar traditional bag (*Lwe-Ait*) is permanently visible at the bottom of the game viewport ($x = 640\text{px}$, $y = 672\text{px}$), resting elegantly in the subterranean base.
   - Authentic Visual Motif: Procedural Shan/Burmese hand-woven textile design with deep crimson weave (`0x8b1e28`), geometric cream/gold diamond chevron bands (`0xe9dfbd`/`0xe7bb55`), woven shoulder strap loop, and 8 hanging fringe tassels (ချည်မြိတ်) along the bottom edge.
   - Interaction & Toggling: Clicking the bag or hitting shortcut key (<kbd>B</kbd> or <kbd>Tab</kbd>) smoothly expands the 12-slot inventory tray upward ($y = 596\text{px}$) with dedicated fabric rustle audio. Clicking again or pressing <kbd>B</kbd>/<kbd>Escape</kbd> collapses the tray back into the bag.
   - Universal Consistency: Sourced from Chapter 1 as the single authoritative `InventoryBar` component across all chapters.
   - All item icons rendered at $44 \times 44\text{px}$; elongated items drawn diagonally from $(8,36)$ to $(36,8)$.
   - Active ground pickups: idle floating bob $y(t) = (\text{groundY} - 14) + \sin(3t) \times 2$.

5. **Controls & Multi-Winning Conditions**:
   - Horizontal walk $220\text{ px/s}$, jump $-570\text{ px/s}$, prone belly-crawl ($55\%$ height reduction, $40\%$ speed), universal mouth verb <kbd>E</kbd> ($85\text{px}$ radius).
   - Instant action canceling: Jump or locomotion immediately aborts pathfinding and pending interactions.
   - Every chapter must feature multiple winning conditions: Canonical Puzzle Route, Athletic Speedrun Bypass, and Secret Troll / "အောက်လမ်း" Route.
