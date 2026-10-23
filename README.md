# ဖိုးထောင် — ပုဂံရွှေမြို့တော် စွန့်စားခန်း

Two-chapter desktop cartoon prototype: **Chapter1 bridge puzzle → Chapter2 stone-machine action**. One Phaser game, shared approved character concept, controls, Myanmar typography, settings, campaign save, deaths and gold.

## Run

Node24 + npm:

```powershell
npm.cmd ci
npm.cmd run dev
```

Open the printed loopback URL (normally http://127.0.0.1:3000). Do not open index.html as a file. This is a local preview, not a public deployment.

## Play

- A/D or left/right: walk. Space: one jump per press. Esc: pause. Hold R0.5s: retry without adding a death.
- Chapter1: click nearby bamboo/cog pickups, open the bag, select parts, then use the winch. Read the wall clue for an alternate route. Visible pit danger; no hidden-block or rocket-floor surprise death.
- Chapter2: E taunts only when grounded and the machine is READY. Avoid falling stones; use settled stones, plate/lift or broken wood to reach the exit. Gold is optional. Successful replay pays only improvement above your previous banked best; practice pays0.
- Chapter2 exit ends at an honest **Chapter3 not built** panel, not the full-game ending.

Shared save: `phoe-htaung.adventure.v2`. The two original save keys are preserved, **not automatically imported**. New Game confirms before resetting the combined campaign. Bridge inventory/flags reset with its attempt; campaign money and deaths do not.

## Verify

```powershell
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
npm.cmd run test:e2e
```

Current headless evidence: **61 unit/integration tests pass**, including all four original action routes with active machine and new bridge/campaign rule tests. Production build passes. Browser/human acceptance is not verified; browser tool access was blocked in the prior task and no bypass is used. Authored browser tests require an authorized environment/Playwright browser installation; listing them is not execution.

Character currently uses the same three-pose approved concept in both chapters, **not finished walking/jumping animation**. Friend's inherited scenery/audio rights and final visual consistency still need review. [Integration decisions and limitations](docs/integration_spec.md), [coding handoff](docs/README.md), [action asset provenance](public/assets/action_manifest.json), [action credits](public/ACTION_CREDITS.md).

Original furnace, scale, vault and reveal source/assets remain preserved but are **not registered** in this two-chapter runtime. Original project README is retained at [legacy-repo-readme.md](docs/legacy-repo-readme.md). Do not confuse retained source with newly tested playable chapters.
