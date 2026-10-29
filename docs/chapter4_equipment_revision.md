# Chapter4 equipment correction — 2026-10-28

Owner correction after testing: start with bare hands, take a carried slingshot out of the bag, and allow fists-only combat when no slingshot was carried. This supersedes earlier automatic-equipped/default-owned behaviour. Base commit `5eb7da8`, same `codex/chapter-4-ape-arena` branch.

## Implemented behaviour

Every entry, replay and whole-attempt retry starts with `weapon=FISTS`. Ownership and selection are separate. B or the bag button opens a paused bag panel. A carried sling appears as a selectable item; clicking it equips the sling and resumes play. Selecting fists stows it. Closing with B/Escape/close preserves the current selection. Bag selection clears held input/charge, costs no ammo, and does not reset HP, enemies, timer, wallet or inventory.

K with fists shows a truthful bag/absence hint. It cannot draw, shoot, auto-equip or start the waiting attempt. J remains usable. The view shows no held sling or charge bar until equipped, and reuses the existing rummage pose while the bag is open. Guide/menu/pause/failure messages explain the current weapon accurately.

Without a carried sling, entry has no blocking pickup panel or forced Chapter3 return. The bag has a fists choice and an absence message, with no sling slot. Ammo is0 (HUD dash); piles cannot create missing equipment/ammo. Existing fist damage/deadline remain unchanged, so this is a permitted attempt, not a new fist-only win route.

## Handoff contract

The previous-chapter pickup is still another developer's responsibility. `arenaHasSlingshot` reads `slingshot` from existing `ownedTools` or `inventory`; `SLING_TOOL_ID` is declared in `content/chapter4.ts`. An explicit `equipment.slingshot` boolean from that developer overrides saved lookup. Absence defaults false; no item is granted and no save migration is performed. This branch does not claim a real Chapter3 pickup exists.

Selection is per-attempt, not a persisted campaign field. Retry keeps ownership but returns to fists. Existing schema2 saves/money/progress stay compatible. External payload ownership is carried through the result's replay button. No new asset, package, shop, enemy or combat balancing change was added.

## Actual verification

| Check | Result |
|---|---|
| `npm.cmd run test -- --reporter=json --outputFile=reports/chapter4-equipment-vitest.json` |115/115 PASS,0 failures; [JSON](../reports/chapter4-equipment-vitest.json) |
| `npm.cmd run build` |PASS: both strict TS configurations and46-module Vite production build |
| Focused `test:e2e` for `tests/e2e/arena.spec.ts` |5/5 PASS in installed Chrome, disposable contexts; [JSON](../reports/chapter4-equipment-e2e.json) |
| `node --check scripts/playtest-chapter4.mjs` / whitespace check |PASS |

The first sandboxed Vitest start was blocked by `spawn EPERM` before tests ran; the host-access rerun above passed. No dependency/browser download was needed. `PHOE_BROWSER_PATH` is an optional Playwright executable override; unset retains its normal bundled-browser behaviour.

New domain cases cover fists at entry with/without ownership, no implicit equip on K, saved/payload ownership resolution, missing-tool punch/refill behaviour, and no phantom shot or combat reset during bag selection. Existing combat routes explicitly choose the owned sling through the production equip command before shooting. Retry now also checks return to fists while retaining ownership.

Five browser cases verify the threeHP bars, normal pause/charge cancellation after actual bag equip, owned-but-stowed K rejection→bag choice→real shot→stow, bag pause/held-charge cancellation→retry, and missing-sling entry→J combat→empty bag without a blocking modal. Tests seed prior completed chapters only, never Chapter4 actor health/positions/win flags. This is isolated Chapter4 UI evidence, not a full Chapter1–4 walkthrough or human fun acceptance. Other chapter browser tests were not rerun in this focused change.

The reusable playtest helper now seeds an explicit owned tool in disposable fixtures and selects it through the bag before its shooting cases. Its fists case leaves the item stowed. Historical balance screenshots/results remain historical evidence rather than silently rerun claims for this equipment flow.

## Handoff

Changed runtime: `content/chapter4.ts`, `domain/arena.ts`, `main.ts`, `ArenaChapterScene.ts`, `ArenaSession.ts`, `ArenaView.ts`. Tests, Playwright local executable override, helper and current spec/handoff docs were updated. Original assets, Chapter1–3 gameplay and old untracked reports were preserved.

User play was stopped. Focused browser tests used their own preview and contexts, which were torn down after completion; port3000 has no listener at handoff. No browser was reopened for the user and no push/PR was requested. Dedicated combat animation/audio and previous pickup integration remain separate outstanding work.
