# Two-chapter integration — 2026-10-23

Base: MinnThikeTunn/Pho-Htaung main334a1d7811fa7c00708c10cadede70d3eb52e404. Changes prepared on `codex/unify-two-chapter-adventure` in a separate checkout; the owner's original action project remains untouched.

## Owner choices and scope

1. Friend's Bagan bridge puzzle first, owner's stone machine action second.
2. Keep bridge repair puzzle but make dangers readable instead of hidden-block/rocket-floor troll deaths.
3. Previously approved cartoon protagonist remains the common design. Current art is still a three-pose concept, not a finished animation atlas.

No later chapter, shop, debt target or ending is authored. Preserve all legacy scenes/assets/source files for the friend, but do not register their old Chapter2–5/reveal chain in this build. Original README retained as `legacy-repo-readme.md`.

## Integrated runtime

Single Phaser3.90.0 game,1280x720 aspect-preserving FIT; shared warm gold/green UI, local Noto Sans Myanmar, keyboard A/D/Space/Esc/R, shared settings/campaign service and one character crop/pivot adapter.

Flow: BOOT → inherited asset preload → MENU → Chapter1Scene (BridgeChapterScene adapter) → BRIDGE_EXIT_LINK → CHAPTER_2 → CH2_EXIT_LINK → CHAPTER_3_PENDING panel. Replay does not rewind later story progress. B/C practice unlock after action clear and pays0.

Bridge keeps the friend's scene composition, parallax, clue diagram, cog/bamboo pickup/fit puzzle, winch/bridge animation and clued alternate wall route. Its hidden collision block and rocket effect are disabled; pit edge is visible and labelled, repaired bridge has safe footing. A valid physical alternate exit is not forbidden to enforce puzzle sequence. Decorative bait coin/checkpoint removed rather than inventing a wallet payout. Bridge reward currently0 because no bankable currency existed there; action maximum15 is unchanged.

Action retains the original fixed-step AABB domain and four valid routes. Chapter1-named internal source baseline is retained as provenance, but campaign fields/scenes identify action as Chapter2. No invisible traps or inventory are introduced into action.

Bridge retains its existing Arcade solver with fixed60Hz and the common36x56 body,220 movement,-570 jump,1200 gravity/900 downward cap. This is an explicit integration exception to the action-only custom-solver architecture: **different scene actors have different sole solvers**, never two solvers on the same actor. Scene boundary resets velocities/held input. Replacing the bridge puzzle with the action solver is not attempted without a requirement.

Bridge interactions use immediate item state changes rather than applying legacy actor-scale tweens to the physics proxy. The invisible proxy owns collision; `PhoeHtaungView` renders the same approved image above its feet. No art is redrawn and no raster bounds become hitboxes. Both chapters use whole-line subtitles, not splitting Myanmar combining marks. Character walk/jump is temporary stance/bob/lean, NOT a newly finished sprite atlas.

## Campaign contract

One CampaignStore writes one JSON under `phoe-htaung.adventure.v2` (schema2), containing bridgeCompleted, chapter2Completed, chapter2BestBankedCoins, walletCoins, deathCount, receipts, records, inventory/tools, hints and resumeAt. Bridge tools/flags are attempt-local and reset on retry; they are not auto-restocked into durable inventory on load. Successful bridge exit preserves money/deaths/tools and unlocks action without paying coins. Bridge replay preserves later resume. Action credits max(0,collected-best), practice0. Receipt checks prevent duplicate settlement after reload.

The original `phoe_htaung_save` and `phoe-htaung.campaign.v1` are never overwritten/deleted by this build. Menu explicitly states that the new combined campaign is separate; **automatic legacy-save import is not implemented**. New Game confirms and resets only the new campaign. Save failures retain in-memory progress and are labelled unsaved; bridge/action link requires explicit temporary continuation if persistence fails.

## Actual verification

- `npm.cmd install`:47 packages audited,0 reported vulnerabilities at installation; numeric direct versions pinned, lockfile updated. Added no new backend/cloud/runtime service. Kept existing Howler2.2.4 dependency.
- `npm.cmd run build`: typechecks both browser TS and tests/tool config then builds Vite8.3.5. Initial failure from legacy Vite6 object-style manualChunks was repaired with the accepted function form. Engine/application split is preserved.
- `npm.cmd run test -- --reporter=json --outputFile=reports/adventure-vitest.json`: **61 passed,0 failed**,4 files. Includes52 retained action/domain tests and9 new combined campaign/puzzle tests.
- Four actual action routes still start at true spawn with active attacks. No modified coordinates/win flags in those route proofs. The additional bridge tests prove production puzzle-part/exit/settlement rules, **not a rendered full bridge route**.
- Browser E2E/human fun tests: **NOT_RUN / browser-policy restriction inherited from the prior task**. No alternate browser-control bypass or screenshot is claimed. Authored browser tests may be run in an authorized environment. Build success does not prove UI playability, mouse hotspot alignment, parallax footing, pose pivots, pause/link behavior or enjoyment.

### Acceptance tracking

Retained original A01–A31/T01–T22 evidence remains in `action-baseline/docs/implementation_report.md`, with Chapter1 references interpreted as current action Chapter2. Headless PASS scope remains; A03/A25/A29/A30 and T03/T05/T06/T11/T16/T21/T22 remain browser-unverified. A10 still lacks long human review; T17 final atlas still absent. A30 now has a real preceding bridge boundary plus a pending Chapter3 endpoint, but rendered transitions remain NOT_RUN.

New checks: new campaign starts bridge; bridge exit preserves wallet/deaths/inventory; replay no rewind or reward; grounded/alive location exit; two fitting orders; invalid/missing/duplicate parts; action-after-bridge settlement; combined save reload. Evidence is the generated JSON report.

## Assets / known limits

`public/assets/action_manifest.json`, `public/ACTION_CREDITS.md`, original generated source copies and local licenses retain action provenance. Friend assets/audio remain in place; **their specific author/license/redistribution status is not cleared by this integration**. Private repository collaboration is not a public release sign-off. No Machinarium assets were newly acquired or copied by this task; existing art described by the friend as style references still needs provenance review before release.

No human play observations, final animation, full-game ending, new coin reward, legacy save import, mobile QA, audio-level QA or complete bridge-route recording is claimed. The alternate wall exit can bypass the bridge puzzle; preserve this existing valid route and review dominance with humans instead of silently gating it.

Next safe review: run `npm.cmd run dev` here, play bridge with mouse tools and keyboard, try the clued wall exit, verify transition with the same death/wallet values, then play action and replay without new full credit. Capture browser errors and only then call the two-chapter slice visually/functionally approved. Later chapters require separate design/review.
