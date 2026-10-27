# Chapter 3 implementation evidence — 2026-10-27

Subsequent owner-requested art correction: [ancient-city visual revision](chapter3_art_review.md). The procedural environment described in this original implementation report is historical; current Chapter3 uses painted local environment/props with the same domain rules.

Branch `codex/chapter-3-scale-puzzle`; base `912003a`. Separate branch requested by owner. This report covers the new scale puzzle, not a full-game completion or final artwork review. [Rules and limits](chapter3_spec.md).

## Implemented files

- `src/content/chapter3.ts`: sole chapter constants, objects and Burmese messages.
- `src/domain/scale.ts`: pure object interactions, click-to-walk commands, fixed-step movement/collision, scale/gate, physical exit, settlement.
- `src/services/ScaleSession.ts`: accumulation, pause/backlog, hold-R snapshot reset.
- `src/view/ScaleView.ts`: original procedural room/props; shared character renderer.
- `src/scenes/ScaleChapterScene.ts`: real scene, bag selection, object/label click input, controls, pause/journal, save warnings/result.
- `src/domain/types.ts`, `settlement.ts`, `services/CampaignStore.ts`: additive schema2 fields/validation, old-save compatibility, deduplicated relic result, no wallet payout.
- `src/main.ts`: Chapter2→3 entry, menu/replay/resume and honest Chapter4-pending boundary; read-only development snapshot.
- `src/style.css`: matching interface and viewport-height fit; README/docs updated.
- `tests/integration/scale.test.ts`:22 new pure/integration cases, including5 full true-spawn routes. `tests/e2e/scale.spec.ts`:3 authored isolated-chapter browser cases.

Existing Chapter1/2 gameplay, legacy scene files, asset binaries, lockfile and original Downloads sources are unchanged. Earlier `reports/pulled-912003a-*` artifacts were already untracked and are not part of this change.

## Commands actually run

| Check | Status | Actual result |
|---|---|---|
| `npm.cmd run typecheck` |PASS after repair|Initial strict check caught status narrowing and untyped tuple accesses; repaired. Final build runs both browser and test TS configs successfully.|
| `npm.cmd run build` |PASS|Final Vite production build succeeded,40 modules; tool emitted a plugin timing advisory, not a build error.|
| `npm.cmd run test -- --reporter=json --outputFile=reports/chapter3-vitest.json` |PASS|86/86 passed,0 failures:64 existing cases +22 new cases.|
| `npm.cmd run test:e2e -- --list` |PASS, discovery only|7 browser tests discovered in2 files. This does **not** mean automated Playwright execution passed.|
| Standalone automated `test:e2e` execution |NOT_RUN|Browser UI verification used the supported in-app browser/CUA path; no separate browser driver was launched from shell.|
| `git diff --check` |PASS|No whitespace errors; Git's ordinary LF/CRLF warnings remain.|
| Local HTTP readiness |PASS after restart|The sandbox-started server was inaccessible from the app. Stopped it, restarted loopback Vite with approved host access; approved HTTP check returned200.|

No dependencies were installed or upgraded. The final tests report is [chapter3-vitest.json](../reports/chapter3-vitest.json).

## Production-domain routes — PASS

Each starts at center96/feet640 and advances the actual step with commands/movement/jump. No inventory grants, player teleports, edited gate positions or forced completion flags. Each frame also checks finite player coordinates and no player/gate penetration.

1. Stone3 + treasure7 → escape, treasure left on pan.
2. Same opening → install pin while fully raised → retrieve treasure → escape.
3. Actual shelf jump → exchange treasure for crate4 + bag3 → escape with treasure.
4. Stone3 + bag3 + crate4 → escape without using treasure to open the door.
5. Remove treasure and traverse before descent; stand underneath until gate safely holds; escape. Receipt identifies this as TIMING, not a mandatory weight/brace sequence.

Other passing cases: under/overweight recovery, pin rejection without consumption, truthful closing warning/restoration, closed gate blocking jumps/walking, one distant click, shelf jump, movement cancels click, independent attempt snapshots, pause, R release rearm,30/60/144Hz trace equivalence, capped long stalls, old schema2 loading, repeat/no-farm settlement, recovered relic retained after a lower replay, save failure/retry, locked chapter and malformed fields.

## Browser play actually performed — PASS at tested scope

Used existing legitimately completed Chapter2 campaign, wallet5/deaths3, through normal menu input. This is proof from the real Chapter3 spawn, **not** a fresh Chapter1→2→3 walkthrough. No runtime state mutation, localStorage grants, teleport or win fixture used during the manual browser play. Default desktop browser viewport; no viewport override.

- Normal menu Continue entered the real Chapter3 with all objects in their starting positions.
- Picked stone and treasure through labels, selected bag items, placed them, waited for the visible full-open state and walked through the exit. Result: treasure left,42.22 active seconds, wallet5.
- Reloaded, replayed from true spawn, picked pin/stone/treasure, balanced, used pin at latch, retrieved treasure and walked out. Result: treasure recovered,52.47 active seconds, wallet5.
- Opened dialogue journal at50.48 active seconds, observed prior whole Burmese lines, held D while paused; displayed time did not advance. Resumed and cleared.
- Shelf pickup: an early jump before reaching the shelf did not collect the bag; after reaching the approach point, a second jump with the same queued click collected it. No second pickup click was necessary.
- Held R650ms: bag returned to shelf, empty inventory/time0.00, wallet5/deaths3 unchanged.
- Clicked the actual rendered stone (not its label) and collected it. Then shelf-jumped, used crate4 + stone3 + bag3, collected unused treasure and exited. Result: recovered,38.48 active seconds, wallet5.
- Reached Chapter4 pending via result Continue; reloaded and found Chapter3 replay available, proving durable completed progress.
- Bounded browser log inspection returned no captured warnings/errors (`levels:error,warn`, limit30). This is not a universal no-errors guarantee.

Agent route times include time spent inspecting the interface between actions. They are not uncoached human first-play measurements or evidence that the3–5minute design target is met.

Real captures:

- [Braced gate / retrieved treasure](../reports/chapter3-braced.jpg)
- [Treasure clear result](../reports/chapter3-treasure-clear.jpg)
- [Three substitute weights / recovered treasure](../reports/chapter3-weights.jpg)

## Failures found and smallest fixes

1. Initial shelf approach stopped partly underneath the solid shelf; the jump hit its underside and3 headless route cases failed. Changed only the shelf approach point to outside the shelf and continued horizontal approach once feet clear its top. Route cases then passed.
2. A gate clearance assertion differed from56 by floating-point roundoff; adopted existing collision epsilon in that assertion. The collision check itself continued to enforce no penetration.
3. First browser screenshot cut off the bag on the default short desktop viewport. Common container now fits available viewport height while preserving16:9. New screenshot shows full controls/bag/footer.
4. Adjacent world captions overlapped. Staggered pin/treasure captions, compacted pan return labels and aligned weight display with pan position. No world geometry changed.
5. Full-open HUD originally kept saying the gate was rising after it stopped. It now distinguishes rising/full-open before a latch interaction can succeed.

## Save effects and assets

Normal browser gameplay added Chapter3 completion receipts, recovered=true and Chapter4-pending progress to the existing local campaign. Wallet remains5, deaths remain3. No campaign reset, manual refund, farm payment or old-save deletion occurred.

The temporary Vite server was stopped after testing; host-side port3000 listener count verified0. No publishing or GitHub push was performed for this branch.

New props/environment are procedural prototype graphics authored in this branch; shared character/background/font assets are reused. No new media acquired, generated raster asset, external upload, voice performance or final-art/license clearance. Character pose/animation is the existing renderer, not newly approved final art. Chapter3 uses readable text, no newly recorded audio.

## Remaining limits / next safe step

- Human fun, comprehension, originality and first-play duration: NOT_RUN. The learned timing shortcut and easy3+7 route may dominate; ask for owner play feedback before changing puzzle rules.
- Chapter3 relic coin value: UNDECIDED; recovered status is recorded without minting currency.
- Automated Playwright cases: discovered/authored, NOT_RUN. Browser substitute-swap and timing routes have domain proof; browser proof covered no-treasure, brace and substitute-only routes.
- Actual hidden-tab transition, multi-tab race, quota failure and render-rate stress: domain/store coverage where applicable, no end-to-end browser claim. Mobile, alternate viewport extremes, audio/final-art QA: NOT_RUN.
- Chapter2→3 automatic result transition is wired but was not re-cleared from Chapter2 spawn in this browser pass. Existing64 headless tests pass; prior Chapter1 hidden-block/readability findings remain and were not fixed here. Retained A01–A31/T01–T22 human/browser gaps are not upgraded by this report.
- Chapter4 fight, NPC designs and full-game ending remain unimplemented.

Next: owner plays Chapter3 and judges the escape/relic choices and comic reactions, then decide the smallest necessary puzzle/presentation changes and the relic reward. Review the branch before integrating it into main.
