# Chapter5 implementation — actual evidence

2026-10-29. Branch `codex/chapter-5-final-boss`, based on freshly fetched/fast-forwarded `main` `514f2fa` (merged Chapter4 PR). Owner requested implementation of the fighting proposal and its dialogue, then explicitly approved10-gold debt repayment. This is local implementation/verification, not a public deployment or a claim of release readiness.

## Implemented scope

U Gyi shield/staff boss with guarded front, rear/recovery counterplay, locked slam/rush warnings, phase2 physical cart push, an interruptible exposed window and a cart the player can push/stand on. The cart blocks either side's projectiles and stuns a rushing boss. Player/boss HP, red enemy bar, existing fists/slingshot/dodge/bag controls and shared hero art. Chapter5 starts with fists and permits a fists-only victory; Chapter4 rules remain intact.

The literal Burmese intro, fake-cart-gold reveal, phase2 line, surrender dialogue, outdoor lines and ending conversations are presented inside the game. Dialogue freezes combat, has Next/Skip and a visited-line journal. Boss defeat precedes a safe physical exit; the result only settles at that exit. Escape wins without gold. A wallet≥10 repays exactly10 once; an already paid debt never charges on replay. Reload returns to the saved final result. No pickup in an earlier chapter, new reward, relic conversion, shop or voiceover was added.

## Commands and results

- `npm.cmd run build` — **PASS**; includes both strict TypeScript configurations and production Vite build. No new package installation. Standard bundle output includes the existing large Phaser chunk.
- `npm.cmd run test -- --reporter=json --outputFile=reports/chapter5/vitest.json` — **133/133 PASS**, seven files, including18 new final-chapter tests. Tests cover real-spawn routes, truthful attacks, guard/rear hits, solid cart/projectile collisions, riding/pushing/rolling/dodge, frame-rate agreement, pause/retry, settlement validation, debit deduplication, poor-to-better ending, schema2 compatibility, write failure/retry and preserving completion after Chapter4 replay.
- `npm.cmd run test:e2e -- tests/e2e/final.spec.ts --reporter=line,json` with installed Chrome override — **4/4 PASS**. JSON: `reports/chapter5/browser.json`.
- Existing `tests/e2e/arena.spec.ts`, same command/options — **5/5 PASS**. JSON: `reports/chapter5/prior-combat-browser.json`. Prior Chapter4 equipment, pause and truthful no-sling controls still pass.
- `git diff --check` — **PASS** before handoff.
- All four runtime asset SHA256 values match the manifest and their saved originals. No imported stock media or recorded voice was acquired.

Browser runs required host Chrome/local-server access: an initial sandbox run did not start the server and was cancelled. The first host run exposed one test assertion reading status before the next animation frame; changing it to poll the observable status fixed the assertion. The final run passed all four cases. The first screenshots also exposed combat UI clutter and a hidden hero during the outdoor scene; the final layout hides combat HUD, moves dialogue upward and registers the hero's feet on the painted terrace. Both final routes were rerun after that visual correction.

## Route evidence and its limits

Playwright seeds **only legal prior-chapter completion/ownership/gold** in an isolated browser context. It then uses real bag clicks and keyboard input from the actual Chapter5 spawn, with active boss attacks. It reads the existing developer snapshot for reactive control; it does not teleport actors, change boss/player health or force scene completion. Opening/surrender/end dialogues advance by their actual buttons, and the character walks to the real exit. These are expert automated routes, not a first-time human test or an uninterrupted playthrough of Chapters1–5.

| Final host route | Active fight | Player HP | Hits / shots | Cart rush stops | Ending wallet |
|---|---:|---:|---|---:|---:|
| No sling, fists |25.72s|100|18 successful punches,0 shots|1|0 — escaped|
| Owned sling, explicitly selected in bag |12.63s|100|6 shots,0 punches|1|15→5 — paid10|

Times exclude reading/safe exit. Perfect reactive control exploited the available windows and took no damage; this proves routes and does **not** establish novice difficulty, the intended overall10–20minute first-play target, fun or originality. Individual collision/timing tests additionally use isolated fixtures and are not mislabeled as route proof. Both endings survive reload. Repeat repayment/upgrade cases are domain/store tests rather than a second full browser boss replay.

Screenshots visually inspected: `intro.png`, `arena.png`, `outside-true.png`, `ending-true.png` under `reports/chapter5/`, plus both defeated/outside/ending route captures. Normal browser viewport1440×1000. Other screen sizes, mobile/touch play, screen readers, owner art approval and human difficulty/fun acceptance remain unverified. Earlier Chapter1/2 acceptance gaps recorded in historical reports are not silently resolved here.

## Files and assets

Rules/script: `src/content/chapter5.ts`, `src/domain/finalBoss.ts`. Lifecycle: `src/services/FinalSession.ts`. Render/scene: `src/view/FinalView.ts`, `src/scenes/FinalChapterScene.ts`, `src/content/chapter5Art.ts`. Integration: `src/main.ts`, `ArenaChapterScene.ts`, campaign types/validation/store and `style.css`. Tests: `tests/integration/final.test.ts`, `tests/helpers/finalRoute.ts`, `tests/e2e/final.spec.ts`.

Four generated candidates are stored under both `art/source/chapter5/` and `public/assets/chapter5/`: painted hall, eight U Gyi poses, cart and sunny ancient-city exit. Built-in image_gen mode; complete prompts/edit history/provenance in `art/source/chapter5/README.md`, hashes/status in `public/assets/chapter5/manifest.json`. Shared character remains unchanged. Remaining low-alpha fringe, pose-based animation, no layered painting master and pending owner/release review are recorded honestly. Text dialogue uses existing short procedural effects, without narration recordings.

The next safe step is owner play of Chapter5, focusing on shield counterplay, cart readability, fight length and Burmese dialogue pacing. Existing unrelated untracked Chapter4/pull-check reports were preserved and excluded from this change. Test-owned servers stop after their runs; no permanent local server or public hosting was requested.
