# Cross-Browser & Cross-Platform Compatibility Architecture

A comprehensive compatibility overhaul ensuring seamless execution, audio unlocking, and responsive rendering across modern desktop and mobile browsers—including Apple Safari (macOS & iOS), Mozilla Firefox, Google Chrome, and Microsoft Edge.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following product decisions were confirmed during clarification:
> - **Target Platforms**: Prioritize both modern desktop browsers (Chrome, Safari, Firefox, Edge) and mobile browsers (iOS Safari, Android Chrome).
> - **Audio Autoplay & Web Audio**: Implement a universal user gesture unlock mechanism (`pointerdown`, `touchstart`, `click`, `keydown`) paired with a persistent, non-intrusive visual audio toggle indicator styled in the game's fantasy brass aesthetic.

---

## 1. Overview & Core Concept

- **What It Does**: Hardens the entire Phoe Htaung Phaser 3 & HTML5 game engine against browser-specific quirks, strict Web Audio autoplay constraints, dynamic viewport resizing (mobile address bar shifts), high-DPI canvas scaling, touch event normalization, and Burmese Unicode font rendering anomalies.
- **Target Audience / Persona**: Players accessing the game from desktop computers (Chrome, Safari, Firefox, Edge) and mobile devices (iPhones, iPads, Android smartphones and tablets).
- **Key Value**: The game launches reliably with zero console exceptions, no blocked audio deadlocks, no layout jumping on mobile, crisp canvas graphics on Retina displays, and full touch responsiveness on mobile viewports.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **First Arrival & Audio Policy Awakening**:
   - Player arrives on the game URL in Safari or iOS WebKit.
   - Since browsers block unprompted audio autoplay, the game starts cleanly with a subtle, elegant brass volume toggle badge in the bottom-right corner showing the audio status.
   - The very first interaction anywhere on the screen (tapping "Play", clicking the menu, or pressing any key) activates the universal gesture unlock, silently resuming the Web Audio context (`AudioContext.resume()`) and seamlessly starting background ambiance and sound effects.

2. **Mobile Viewport & Safe-Area Adaptation**:
   - On iOS Safari and Android Chrome, the game container uses dynamic viewport height (`100dvh`) with `env(safe-area-inset-*)` padding.
   - Tapping buttons or moving the hero will never cause iOS rubber-band elastic bouncing, accidental double-tap zoom, or layout shifts when browser URL bars collapse.

3. **High-DPI Retina Crispness**:
   - The central 16:9 canvas rendering pipeline automatically accounts for `window.devicePixelRatio`, ensuring sharp character lines and background watercolor textures without blurriness on Apple Retina and high-density mobile screens.

4. **Diegetic Controls & Input Equivalence**:
   - Desktop: Keyboard shortcuts (W, A, S, D, Space, J, K, L, B, 1-4) and mouse clicks.
   - Mobile / Touch: Direct touch interactions on buttons, inventory tabs, dialog cards, and quiz options, with `touch-action: manipulation` eliminating the 300ms mobile click delay.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Universal Audio Gesture Unlock vs. Blocking Audio Modal
- **Chosen Approach**: Transparent universal gesture unlock attached to window-level pointer, touch, and key events, accompanied by an in-viewport brass volume toggle button.
- **Why**: Many modern browsers penalize or frustrate users when blocked behind intrusive "Click here to enable sound" popups. A seamless first-interaction unlock starts audio smoothly without interrupting the narrative flow.
- **Alternatives Considered**: Mandatory "Click to Enable Audio" splash curtain (rejected as disruptive and unnecessary when the Start Game button already constitutes a valid user gesture).

### Decision 2: Dynamic Viewport Units (`100dvh`) vs. Fixed Height Scripts
- **Chosen Approach**: CSS `height: 100vh; height: 100dvh;` with `overscroll-behavior: none` and `touch-action: manipulation`.
- **Why**: Modern Safari (iOS 15.4+) and Chromium natively support `dvh` (dynamic viewport height), which automatically recalculates when mobile toolbars expand or collapse. Pure CSS provides 60fps performance without JavaScript resize thrashing.
- **Alternatives Considered**: JavaScript `window.innerHeight` resize listener (rejected due to jitter during scrolling).

### Decision 3: Vendor Prefixing & CSS Feature Support
- **Chosen Approach**: Systematic dual declarations for `-webkit-backdrop-filter` / `backdrop-filter`, `-webkit-user-select` / `user-select`, and Firefox `scrollbar-width` / `scrollbar-color`.
- **Why**: Safari still requires `-webkit-backdrop-filter` for glassmorphism blurs on HUD dialogs, while Firefox uses standard scrollbar properties rather than `::-webkit-scrollbar`.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        BROWSER RUNTIME MATRIX                          │
│   Chrome (Blink)  │  Safari (WebKit)  │  Firefox (Gecko)  │  iOS/Android│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     CROSS-BROWSER ENGINE LAYER                         │
├───────────────────────────────────┬────────────────────────────────────┤
│  Audio Policy Subsystem           │  Viewport & Input Subsystem        │
│  - WebkitAudioContext fallback    │  - 100dvh + Safe Area Insets       │
│  - Universal Gesture Unlock       │  - touch-action: manipulation      │
│  - State Synchronization          │  - overscroll-behavior: none       │
├───────────────────────────────────┼────────────────────────────────────┤
│  Canvas & Rendering Subsystem     │  Style & Typography Subsystem      │
│  - devicePixelRatio High-DPI      │  - -webkit-backdrop-filter         │
│  - Phaser autoRound & Scale.FIT   │  - Firefox scrollbar-width         │
│  - Hardware Accel translateZ(0)   │  - Noto Sans Myanmar pre-check     │
└───────────────────────────────────┴────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      PHASER GAME & SCENE ENGINE                        │
│   Chapter 1 (Bridge)  →  Chapter 2 (Machine)  →  Chapter 3 (Scale)     │
│   Chapter 4 (Ape Arena)  →  Chapter 5 (Gauntlet & Final Boss)          │
└────────────────────────────────────────────────────────────────────────┘
```

### Component Action Plan

1. **`index.html` & Viewport Hardening**:
   - Update viewport meta tag: `width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover`.
   - Add preload link for `@fontsource/noto-sans-myanmar` and `Cormorant Upright`.

2. **`src/utils/SoundEngine.js` & `src/services/AudioController.ts`**:
   - Ensure `AudioContext || window.webkitAudioContext` is safely initialized.
   - Implement universal gesture unlock listening to `['click', 'touchstart', 'touchend', 'pointerdown', 'keydown']` with `{ once: true, passive: true }`.
   - Re-check and resume `ctx` when the browser tab gains visibility (`visibilitychange` / `window.focus`).

3. **`src/style.css` & `src/fantasy-theme.css` Cross-Browser Fixes**:
   - Replace any un-prefixed `backdrop-filter` with `-webkit-backdrop-filter` + `backdrop-filter`.
   - Add `-webkit-user-select: none; user-select: none;` on all game buttons and interactive badges to eliminate accidental text selection on rapid clicks.
   - Add Firefox standard scrollbars (`scrollbar-width: thin; scrollbar-color: var(--fui-brass) var(--fui-wood-2);`) for dialogs and journals.
   - Apply `touch-action: manipulation; -webkit-tap-highlight-color: transparent;` globally on buttons and inputs.
   - Add `overscroll-behavior: none;` on `html, body`.

4. **`src/main.ts` Scale and Gesture Integration**:
   - Ensure Phaser game scale config uses `autoRound: true` and crisp scale mode.
   - Mount a permanent, cross-browser audio toggle widget in the interface layer so users across all platforms can inspect and toggle audio states.
   - Ensure clean boot splash disposal on all device formats.

5. **Test & Verification**:
   - Run complete suite (`npm test`) to guarantee zero regressions.
   - Run compilation check (`bun run typecheck && vite build`).

---

## 5. Implementation Status: Completed

- [x] **Phase 1: HTML & Viewport Hardening (`index.html`)**: Added `viewport-fit=cover`, maximum-scale restrictions, and `#volume-control` container.
- [x] **Phase 2: Universal Audio Gesture Unlock (`src/utils/SoundEngine.js` & `src/services/AudioController.ts`)**: Universal gesture unlock attached to `pointerdown`, `touchstart`, `touchend`, `click`, and `keydown`, automatic resumption on visibility change, and safe WebKit AudioContext handling.
- [x] **Phase 3: Cross-Browser CSS (`src/style.css` & `src/fantasy-theme.css`)**: Dual `-webkit-backdrop-filter` declarations, `-webkit-user-select: none`, `touch-action: manipulation`, `-webkit-tap-highlight-color: transparent`, `overscroll-behavior: none`, Firefox `scrollbar-width` and `scrollbar-color`, and Firefox `::-moz-progress-bar` styling.
- [x] **Phase 4: Phaser Configuration & Visual Audio Toggle (`src/main.ts`)**: Configured `autoRound: true` and `roundPixels: true` to eliminate sub-pixel jitter on Safari/Retina screens, and connected the persistent fantasy-themed audio control widget.
- [x] **Phase 5: Verification**: All 176 unit and integration test suites passing in Vitest; TypeScript typecheck and Vite build successfully compile with zero errors.
