# Chapter5 experience review — 2026-10-29

Owner asked for a gamer-style play/review and necessary fixes. This follow-up to `751fbc2` changes feedback and layout; it preserves the boss's health, damage, attack selection/timings, collision rules, valid shortcuts, equipment, story and10-gold settlement.

## Actual observation

Used Computer Use/browser input to enter Chapter5 replay from the real menu, walk, jump over the cart, attempt J counters, retry and inspect live screenshots at the normal615×604 side-panel viewport and1280×900 desktop comparison. The carried save had no sling; no equipment or progress was invented in that UI session. A deliberate jump/counter burst reduced boss180→170 while the player took a20-damage rush. An earlier attempt died after tool/model latency left combat running; this is **not** evidence of novice difficulty. Pauses between later observation bursts allowed inspection, so this was not an uninterrupted human-speed playthrough. Full victories use the separate real-input automated routes below.

The cart creating a visible counter window is worth keeping. Fast expert victories alone do not justify increasing boss HP or banning valid rear routes. The immediate problems were readability: a successful J was easy to miss; a hurt explanation could be overwritten by the boss/cart crash message; J cooldown was absent; a fixed cart label became detached from the moving cart; and the narrow-screen CSS made the app604px tall while the actual canvas was326px tall. This misregistered the entire DOM overlay and could crop/scroll the HUD.

## Small fixes

- Keep app/interface at the canvas's16:9 aspect ratio at narrow widths. Compact only Chapter5's narrow HUD, keep dialogs/menu scrollable and clear chapter-specific classes on shutdown.
- A short fist trail, floating actual damage amounts and a brief red damage border make hits readable. These effects use simulation time, freeze with pause and never change hitboxes or hit timing. Retry clears their attempt records.
- Record SLAM/RUSH/CART as the actual damage cause and prioritize its truthful Burmese explanation briefly over other incidental messages. Shield and cart projectile blocks now have distinct messages. Damage numbers report HP actually lost, including the last partial hit.
- Show J recovery alongside L readiness. Disable bag interaction during story scenes. The cart hint follows its position and appears initially/while pushing rather than covering the fight continuously.
- No new art, packages, skills, attacks, currencies or narration recordings were introduced.

## Verification

- `npm.cmd run test -- --reporter=json --outputFile=reports/chapter5-review/vitest.json`: **135/135 PASS**, including new damage-source/actual-loss/retry and cart-versus-shield feedback regressions.
- `npm.cmd run build`: **PASS**, including both strict TypeScript configurations; rerun after the final scene-class/CSS change.
- `npm.cmd run test:e2e -- tests/e2e/final.spec.ts --reporter=line,json`, installed Chrome override: **6/6 PASS**. Includes opening/journal/equipment, no-sling entry, narrow alignment, the real rush-hit→cart-crash message-priority case and both full real-input routes to surrender/physical exit/endings/reload. Prior completion is seeded only at the legal Chapter4 boundary; final actors/health are not teleported or forced.
- After the final compact-HUD/cart-hint adjustment, reran the narrow/real-rush cases: **2/2 PASS**, `reports/chapter5-review/layout-final.json`.
- `git diff --check`: **PASS**.

Evidence is under `reports/chapter5-review/`. Visually inspected the final `narrow-game.png` and `rush-feedback.png`; the latter shows−20 above the player and the matching rush explanation while the boss is stunned against the cart. Other full-route images are retained there. The historical `reports/chapter5/` captures were restored after copying new captures into the review folder.

These checks establish working feedback/reachability, not a guarantee of fun, originality or novice balance. Human difficulty/animation approval remains pending; the existing pose atlas/alpha-fringe limitations are unchanged. No uninterrupted five-chapter playthrough or newly cleared release assets is claimed. Temporary preview/browser cleanup encountered a browser connection timeout after server teardown; no permanent preview or public deployment is part of this change.
