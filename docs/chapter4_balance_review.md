# Chapter4 combat revision — 2026-10-28

Owner requested the fixes following the [gameplay review](../reports/chapter4-experience/README.md). Branch `codex/chapter-4-ape-arena`; pre-change build `1457096`. Scope: make defence matter, give J a useful spacing role, improve readability. No extra buttons, enemies, chapters, currency, guard system or assets were introduced.

## Changes and reason

- Brown starts at720 instead of820 and approaches at180 instead of130px/s. First coordinated attack opportunity is1.2s instead of1.8; the **0.65s melee and0.85s throw warnings stay unchanged**. Silver's throw cooldown is1.4s instead of2.4. Damage is24 melee/20 stone instead of18/14. Player100HP and each ape150HP remain unchanged. Existing0.8s hurt grace, single windup coordinator and locked attack aim remain.
- Damage cancels an active draw and delays redrawing0.3s, with a visible flash/message. No unfired stone is spent; jump, movement and dodge remain available. This makes absorbing hits while charging costly in both health and firing opportunity.
- J deals1 damage as before, with0.75s cooldown. Against idle/recovering enemies it pushes80px and stuns0.75s, creating enough time for a full draw. It cannot interrupt a committed windup or repeatedly restun an already stunned enemy. Fist-only perfect damage bound is101, below300 requiredHP.
- Enemy hit flashes/foreground impact rays, contrasting projectile outlines and a player foot marker improve visibility without changing collision. Speech hides after3.5 active seconds; compact panels reveal more of the room. Critical completion text stays. Red enemy health bars are preserved; charge interruption and J/L readiness are labelled.

Runtime changes: `content/chapter4.ts`, `domain/arena.ts`, `scenes/ArenaChapterScene.ts`, `view/ArenaView.ts`, `style.css`. Pure integration tests and the spec were updated. Session/persistence/earlier chapter rules and asset binaries were not changed. Existing protagonist and ape poses remain provisional; these flashes are not a replacement for completed combat animation/audio.

## Verification actually completed

| Check | Result |
|---|---|
| `npm.cmd run build` | PASS: strict app/test TypeScript and Vite46 modules |
| `npm.cmd run test -- --reporter=json --outputFile=reports/chapter4-balance-vitest.json` | **110/110 PASS**,0 failures; [JSON](../reports/chapter4-balance-vitest.json) |
| `node --check scripts/playtest-chapter4.mjs` | PASS |
| `git diff --check` and staged whitespace check | PASS |
| Standalone nine-test Playwright suite | NOT_RUN; browser probes below are separate |

The23 arena integration cases include five different stationary firing cadences that fail, a real-spawn reactive input route with live attacks and actual exit, useful shove→full shot, uncancellable committed windup, draw interruption/no ammo loss, available dodge after damage, timing/pause/retry, replenishment and save compatibility. Reaction inputs use current warning/projectile geometry, not future state or mutations.

An early tuning candidate passed pure route tests but still allowed a real-browser stationary win at26HP. That observation prevented handoff; final damage tuning and actual browser comparisons below supersede that candidate. Test passes alone were not accepted as proof that the exploit was fixed.

## Browser evidence

Used installed Chrome with Playwright, disposable Chapter3-complete save fixtures and real keyboard events. No player/enemy positions, health, clocks, projectiles or win flags were changed. Normal user saves were untouched. This is automated browser gameplay, not human fun acceptance or a fresh Chapters1–4 walkthrough. The Computer Use native pipe was unavailable in the preceding review; the supported local test dependency provided the browser fallback.

| Final run | Observed outcome |
|---|---|
| Original K610ms/release520ms, no defence | **Lost**, player0HP, brown0HP/silver30HP; clock64s,ammo2. Previously this route won at58HP/about12s. [Evidence](../reports/chapter4-balance-final/results.json), [screenshot](../reports/chapter4-balance-final/stationary-result.png). |
| Original blind jump/L timing | Lost, player0HP, brown0HP/silver90HP; clock61s. Pressing defensive buttons at arbitrary intervals is not a reliable reaction route. |
| React to current warning/projectile geometry, draw/release K | **Won**,100HP,13.65 combat seconds, actual right exit reached, wallet5. [Evidence](../reports/chapter4-reactive/results.json), [screenshot](../reports/chapter4-reactive/reactive-result.png). |
| Read brown windup→jump→step inside J reach during recovery→J→full K | Shove message observed; brown150→149→119HP,ammo11; player80HP after silver hit. [Evidence](../reports/chapter4-shove/results.json), [screenshot](../reports/chapter4-shove/shove-opening.png). |
| Pause/retry | Charge cancelled on pause without firing on resume; R restored100/150/150HP,12 ammo,75s. |

The reactive browser controller reads the existing **read-only development snapshot** for current visible enemy phases/projectile coordinates, then sends actual keys. It has precise timing and is not a novice human benchmark. It proves a playable route after stronger pressure, not that every human can achieve100HP or that all stationary timing variants are impossible. No unrestricted game object API is used to alter simulation state.

Two early shove probe attempts timed out: a short held K did not reliably start the attempt during first-frame loading, then a J press was outside its86px reach versus the ape's108px melee reach. The final probe starts with an edge-buffered jump and steps in after recovery. These were corrected test inputs; no hidden range expansion or teleport was added. The original fists-only approach now overshoots the closer ape and misses, so that run is not used as a measure of J's effectiveness.

Captured page-error arrays were empty in the successful probes. This is not a full console/network-error audit. [Updated room layout](../reports/chapter4-balance-final/entry-red-health.png) was visually inspected: red health fill, compact panels, same character/background.

Reproduce with the local preview running:

```
node scripts/playtest-chapter4.mjs
node scripts/playtest-chapter4.mjs reactive
node scripts/playtest-chapter4.mjs shove-opening
```

`PHOE_PLAYTEST_OUTPUT` selects a separate local evidence directory; baseline evidence was preserved. Default probes use DOM labels only; the separately selected reactive probe uses the read-only snapshot as stated above.

## Remaining review

The accepted stationary exploit is now a losing tested strategy and J has a demonstrated opening. The fight still has a short successful route and familiar attack/dodge mechanics. This revision does not establish uniqueness, long-term replay value or human difficulty acceptance. Dedicated animations, combat sound, first-time-player testing and the other developer's previous-chapter sling contract remain outstanding. Shop/debt/global balancing and Chapter5 stay outside scope.

Owned preview is stopped at handoff; local port3000 has no listener. Changes are committed locally on the existing feature branch; no push/PR was requested in this turn.
