# Chapter4 implementation evidence — 2026-10-28

Branch `codex/chapter-4-ape-arena`, based on freshly fetched `main` at `1aecccb`. [Rules and integration boundary](chapter4_spec.md). Local prototype implementation; no public deployment or PR is implied.

## Implemented scope

New `content/chapter4.ts`, `domain/arena.ts`, `services/ArenaSession.ts`, `view/ArenaView.ts`, `scenes/ArenaChapterScene.ts`: two ape types, threeHP bars, J punch, charge/release K sling, L dodge, truthful windup warnings, renewable ammunition,75s deadline, actual safe exit, pause/retry and result/save. Domain/render/input/persistence remain separate.

Updated campaign types/validation/store, menu/scene registration, Chapter3 replay settlement and arena CSS. Legacy Chapter4-pending entry now forwards to the arena. Completed Chapter4 continues to an honest Chapter5-pending panel. No CH1/2 gameplay changes, previous-chapter slingshot pickup, new dependencies, wallet reward or debt/shop system.

New painted background and transparent eight-pose ape atlas are retained with source prompts and metadata. They are integrated candidates awaiting owner art/animation review; reused protagonist poses and static ape movement are prototype limitations.

## Commands and test status

| Check | Status | Evidence |
|---|---|---|
| `npm.cmd run build` | PASS | Includes both strict TypeScript configs and Vite production output. |
| `npm.cmd run test -- --reporter=json --outputFile=reports/chapter4-vitest.json` | PASS |103/103 tests,0 failures; [JSON](../reports/chapter4-vitest.json). |
| `npm.cmd run test:e2e -- --list` | PASS, discovery only |9 authored browser tests across3 files. |
| Standalone automated Playwright execution | NOT_RUN | Manual in-app browser play was used; discovery is not a browser-suite pass. |
| `git diff --check` | PASS | No whitespace errors. |
| Preview teardown | PASS | Final host-side `Get-NetTCPConnection` check found0 listeners on port3000. The earlier preview-session handle was no longer available; no unrelated process was terminated. |

Existing86 tests were retained. Sixteen arena cases cover a true-spawn live-attack route, dormant input, charge/release/damage, missing sling, fist damage bound, isolated punch/dodge/telegraphs/refill/timeout, pause, retry, frame-rate equivalence/backlog, deduplicated settlement/save failure, malformed results and old schema2 compatibility. One additional Chapter3 regression proves replay cannot rewind a completed Chapter4 handoff.

The isolated combat fixtures use repositioned test actors only for those local rules. The route test starts at the real spawn and walks the actual exit with enemies attacking. Its learned stationary firing pattern can win: this is a disclosed balance weakness, not evidence of strong challenge or long replay value. The browser test fixtures seed legal earlier progress and prove only their isolated chapter boundary. The prior CH3 browser continuation assertions were updated for the new real arena endpoint.

## Manual browser play actually performed

Used the existing legitimate Chapter3-complete campaign through normal menu input, wallet5/deaths3. No save grants, teleports, forced enemyHP or win flags. This is Chapter4 evidence, not a fresh Chapters1–4 walkthrough.

1. Continue entered the actual arena at x160, player100HP, enemies150/150,75s and12 stones. Timer waited before input. [Entry screenshot](../reports/chapter4-arena.jpg).
2. Repeated normal K holds/releases and jumps. Paused after brown fell: player100HP, enemies0/150,ammo6,68s.
3. Resumed with the same controls. Both apes fell; player86HP,ammo2, exit message/time frozen. Walked right through the real exit. Result **86HP,12.87 combat seconds,wallet5**. [Clear screenshot](../reports/chapter4-clear.jpg). Time excludes pauses and walking after combat.
4. Replayed from the actual result button, approached, pressed J then L and paused. Player100HP; brown149HP; silver150HP; dodge cooldown0.6s. Confirms actual punch damage and dodge control, not just key-guide labels.

The final numeric validation, repeated-key guard and unreachable legacy-panel cleanup were typechecked/tested after this play. A new post-cleanup browser pass, automated browser-suite execution, complete keyboard R browser verification, Chapter5 reload verification, sound review and owner gameplay acceptance remain **NOT_RUN**. The manual observations above apply to the tested desktop view only. Existing A01–A31/T01–T22 historical acceptance statuses are not promoted by this chapter extension.

## Known limits and next review

- Earlier slingshot ownership is assumed by the receiver default, as explicitly requested. Another developer's canonical equipment/persistence contract still needs connection. No actual pickup is claimed here.
- A learned firing pattern clears quickly. Review attack pressure and fist usefulness through owner play before materially changing gameplay; do not silently rebalance the accepted prototype.
- Dedicated protagonist combat animations, ape locomotion, hit reactions and combat audio are unfinished. Background/poses are candidates, not approved final art or exclusive-rights claims.
- The full-game10–20minute first-play target cannot be inferred from this12.87s successful combat attempt. No human fun/originality/replay-value acceptance is claimed.
- Chapter5 remains pending. Existing unrelated warnings/failures in earlier reports are not fixed by this work.
- Old untracked `reports/pulled-912003a-*` files were preserved and excluded from this change. Original Downloads were untouched.

The owned local Vite preview is stopped at handoff; run `npm run dev -- --strictPort` from this checkout to play again. Review art and fight pacing before requesting a shared-repo push/PR.
