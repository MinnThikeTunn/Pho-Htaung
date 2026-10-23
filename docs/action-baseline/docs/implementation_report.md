# Chapter 1 implementation evidence — 2026-10-22

Build: local version0.1.0, uncommitted workspace (initial documentation was also untracked). This report supersedes the earlier **status** that no implementation exists; it does not replace Chapter 1 gameplay rules.

## Scope and actual state

Implemented the CH1 domain, Phaser presentation and DOM menu/HUD, campaign/save adapter, replay/practice settlement, original cartoon concept/background, local Myanmar font and short original procedural sound cues. CH1 exit ends at a safe CH2-pending panel. No CH2 scene, debt amount, shop, backend or publishing was added. Original Downloads documents were not edited.

The owner approved the concept's face, longyi and boastful posture in the conversation: “ဒီပုံစံအတိုင်း ဆက်သွားမယ်”. This is **concept approval**, not final locomotion, in-game readability or complete art approval. Imagegen supplied original prototype raster assets with prompts and unmodified copies retained; Sites workflow was used for local implementation/preview, not publication.

## Environment and commands actually run

Windows / PowerShell; Node24.19.0, npm11.17.0. Exact direct versions locked in package-lock.json:

| Dependency | Version |
|---|---|
| phaser | 3.90.0 |
| @fontsource/noto-sans-myanmar | 5.3.0 |
| typescript | 7.0.2 |
| vite | 8.3.5 |
| vitest | 5.0.5 |
| @playwright/test | 1.64.1 |
| @types/node | 24.19.2 |

- `npm.cmd install` and subsequent exact font/type additions: successful. Latest install audited46 packages and reported0 vulnerabilities. This is the installation-time registry audit, not a future security guarantee.
- `npm.cmd run typecheck`: successful; browser and Node test/tool declarations checked separately with strict checking and skipLibCheck=false.
- `npm.cmd run test`: successful; final `npm.cmd run test -- --reporter=json --outputFile=reports/vitest.json` reports **52 passed,0 failed** in3 files. The JSON is actual generated evidence.
- `npm.cmd run build`: successful; Vite production output generated. A bundle-size warning remains: engine-containing JS around1.24MB uncompressed /333KB gzip. Not a build failure; no performance benchmark was run.
- `npm.cmd run test:e2e -- --list`: successful,4 cases discovered. This **does not run Chromium or constitute browser passes**.
- `npm.cmd run dev`: started a loopback-only retained server; an authorized loopback HTTP check returned200. Server is stopped at handoff; root README explains restarting it.
- Full `npm.cmd run test:e2e`: **BLOCKED / not run**. The browser tool first timed out against the sandbox server and then rejected access under its URL security policy after loopback connectivity was corrected. No alternate browser/CDP bypass was attempted. Browser revision is unverified; no screenshot or UI pass is claimed.

Initial failures repaired: Phaser3 declarations reference removed IE ActiveXObject; a narrowly documented ambient type supplies that unused declaration without disabling checks. Adding browser tests exposed missing Node/Disposable declarations; pinned Node24 types and a separate test tsconfig fixed it. New first-writer/corrupt-save regressions led to stricter save conflict handling. Early scripted route attempts failed from insufficient dodging/overshooting platforms; **inputs were corrected, not geometry/timers**. An early lift test incorrectly expected a floor-standing player to obstruct a home lift whose gap is80px; corrected to the valid touching-underside fixture. No gameplay rebalance was made to manufacture passes.

## True-spawn route evidence

`tests/integration/routes.test.ts` uses production createAttempt('A'), fixed steps and input only. It never teleports, grants gold, changes the world or sets win flags. Machine attacks remain active. Tests contain bounded failure diagnostics and observed timing snapshots.

| Route | Observed active time | Coins | Proof |
|---|---:|---:|---|
| A: gate shot, E allowed | 11.27s | 5 | Gate breaks; settled rock crossed; grounded exit |
| A: automatic attacks only | <20s asserted | 5 | Same true-spawn route with no E inputs |
| B: plate, raised lift, shelf, gate top | 9.25s | 15 | Gate remains intact; grounded exit still wins |
| C: shelf break, push rock, floor pouch, gate shot | 16.28s | 15 | Pouch retained and collected after shelf destruction |
| D: home-lift rock used as step | 9.43s | 15 | Lift stays544, gate intact, no plate/path flags |

These are deterministic scripted simulation times, **not measured human play times or browser recordings**. B/D already beat the15–35s initial full-coin target. This is a route-dominance/playtest observation, not permission to close shortcuts, add waits or change physics. Need human review of setup difficulty, danger and repeat interest before a balancing proposal.

`tests/integration/regressions.test.ts` also drives10 real drop cycles with input-only dodges, asserting no player/rock overlap, ten drops and five shatters. Ground-side step-clear proof starts from a labelled isolated obstructed-world fixture, not a true-spawn route. Zero-coin exit is an isolated predicate fixture; **no natural zero-coin route is claimed**.

## A01–A31 status

PASS below applies only to the stated evidence scope. BLOCKED means a concrete browser-policy restriction; NOT_RUN means work remains, not an invented pass. U=`tests/unit/domain.test.ts`; R=`tests/integration/routes.test.ts`; I=`tests/integration/regressions.test.ts`. Actual individual names/results are in `../reports/vitest.json`.

| ID | Status | Evidence / remaining scope |
|---|---|---|
| A01 | PASS | U automatic4s, R automatic-only clear and continued cycles |
| A02 | PASS | U first E immediate TRACK and0.35 control lock; no fee |
| A03 | BLOCKED | I busy presses cannot interrupt/queue; physical held-key edge/browser spam still unverified |
| A04 | PASS | U follow then frozen target |
| A05 | PASS | U falling hit before pickup; death-store dedup and full-reset fixture |
| A06 | PASS | U safe push; R rock-assisted land/jump routes |
| A07 | PASS | U high-speed gate sweep; R A/C break and continue |
| A08 | PASS | U falling pouch retains value; R C collects15 |
| A09 | PASS | U only contacting pair removed; I mid-sweep removal |
| A10 | NOT_RUN | I ten-cycle simulation passes; long human recoverability/room review not run |
| A11 | PASS | U player alone cannot weight plate |
| A12 | PASS | U raise; I push pressure release and descent |
| A13 | PASS | U shatter plate stone clears derived pressure |
| A14 | PASS | I lift stops on touching player/ground stone; resumes as player falls away |
| A15 | PASS | U C lift-supported stone pair shatters and support refreshes |
| A16 | PASS | R four input-only true-spawn routes, active machine |
| A17 | PASS | R B/D clear with intact gate |
| A18 | PASS | U zero-coin exit predicate only; natural zero-coin route NOT_RUN |
| A19 | PASS | U repeated same-ID overlap once |
| A20 | PASS | U collect15/death/full C reset, wallet remains previously banked5 |
| A21 | PASS | U5→15→15 credits5→10→0 |
| A22 | PASS | U synthetic future-spend fixture preserves best |
| A23 | PASS | U adapter reload preserves receipt; old callback after later clear no-op. Actual browser reload remains untested |
| A24 | PASS | U distinct fresh snapshots plus altered C death reset |
| A25 | BLOCKED | U R/death/pause clocks pass; DOM visibility and input release need browser |
| A26 | PASS | U exact B state; C fresh snapshot/support/pressure; mutable separation |
| A27 | PASS | U practice record allowed, credit0, story resume preserved |
| A28 | PASS | I identical30/60/144 schedule state on motion trace; U thin high-speed sweep. Not an FPS benchmark |
| A29 | BLOCKED | Local font, HUD and mute implemented; actual Burmese layout/audio review not performed |
| A30 | BLOCKED | Result/link/pending/resume code compiles; browser transition not verified; real CH2 deferred |
| A31 | PASS | U footprint preview and I grounded-side input shot clears obstruction; isolated fixture explicitly labelled |

## T01–T22 status

| ID | Status | Evidence / remaining scope |
|---|---|---|
| T01 | PASS | U idle20s dormant |
| T02 | PASS | U first E immediate |
| T03 | BLOCKED | DOM held Space/landing/reset behavior not browser-tested |
| T04 | PASS | U one reset per hold, release rearms; browser case authored only |
| T05 | BLOCKED | U paused death clock passes; real hide/resume still needs browser |
| T06 | BLOCKED | Link suspends on hidden/blur, no catch-up first frame; browser unverified |
| T07 | PASS | I earlier pair shatter eliminates later player candidate |
| T08 | PASS | I three-rock chains stop at step, gate and world without deletion |
| T09 | PASS | I lift carries player/stone with stable supports; U removal refresh |
| T10 | NOT_RUN | Input/accumulator reset and shutdown cleanup implemented; queued FX/manual lifecycle review pending |
| T11 | BLOCKED |20 repeated browser scene entries not run |
| T12 | PASS | U write exception retains one memory receipt, retry succeeds. Warning/temporary-mode UI not browser-reviewed |
| T13 | PASS | U corrupt save preserved; browser recovery case authored not executed |
| T14 | PASS | U/I stale revision, first writer and corrupted external raw protected; storage-event UI not reviewed |
| T15 | PASS | U practice preserves campaign resume/banked money |
| T16 | BLOCKED | Optional texture fallback and silent audio fallback implemented, not browser-exercised |
| T17 | NOT_RUN | No final animation atlas exists to swap |
| T18 | PASS | U corrupt coin ledger rejected; reducer also rejects unknown IDs/values and invalid result times/counts |
| T19 | PASS | U stale old completion after later clear/reload no-op |
| T20 | PASS | U maximum8 steps then diagnosed dropped backlog |
| T21 | BLOCKED | Local font and fallback present; slow/failed font layout not browser-tested |
| T22 | BLOCKED | Input/textarea and paused settings guard implemented; no browser typing test |

## Assets and release status

See `../public/assets/manifest.json` and `../public/CREDITS.md`. Two actual image files and unchanged originals exist, SHA256 recorded. Source artwork is generated raster, not layered hand-authored masters. Character renderer selects neutral/taunt/push regions with independent pivots; walk is a temporary stance/bob and jump/death are temporary view transforms. No full animation atlas, U Gyi body/portrait, music or recorded voice exists. Animation consistency is NOT signed off.

Noto package LICENSE and metadata were read; unmodified400/700 fonts are bundled locally under OFL1.1 with full notice. Phaser and EventEmitter MIT notices copied locally into public/licenses and production output. No specific external stock asset licensing is claimed. AI-generated art remains prototype/release-review-pending; do not label whole-game media rights cleared.

## Files and engineering deviations

- Root: package/lock, index.html, two tsconfigs, Vitest/Playwright configs, .gitignore and run README.
- `src/content`: single runtime CH1 constants and Burmese dialogue.
- `src/domain`: typed attempts, relative swept AABB, fixed-step rules, pure settlement/validation. No Phaser physics body is enabled.
- `src/services`: Session lifecycle, CampaignStore/local adapter and procedural AudioController.
- `src/view/WorldView.ts`: renderer only. Actor crops are import metadata, not body sizes.
- `src/main.ts`, `src/style.css`: boot/menu/chapter/link scene adapters and DOM presentation. The initial four scenes stay in one entry file rather than empty scene/view wrapper files; domain and settlement boundaries remain separate.
- `src/legacy-phaser.d.ts`: unused IE declaration compatibility only.
- `tests` / `reports`:52 executed domain tests and4 authored browser cases. No fake browser fixtures or win buttons are shipped; dev-only snapshot API is read-only and omitted by production condition.
- `art/source`, `public/assets`, `public/licenses`, `public/CREDITS.md`: actual assets, provenance, local notices.
- Documentation status/readiness updated, no gameplay constants changed.

## Remaining gate / next safe work

Current milestone is an **implemented, headless-verified CH1 prototype, not a browser-verified or fun-approved vertical slice**. Browser security restriction prevents finishing acceptance here. No human participant observations were collected. Final screenshot, sound levels, pose readability, warning occlusion, pause/link/save UI, menu20-cycle regression and natural input feel remain unverified.

Owner can run `npm.cmd run dev` locally and play in their normal browser. Observe first attempts without a route walkthrough: unreadable deaths, waiting, difficulty discovering safe stones and whether another route is voluntarily attempted. Resolve browser checks in an authorized environment; do not bypass tool security. Then review final locomotion frames. Do not implement CH2 or rebalance B/D without that evidence and owner review.
