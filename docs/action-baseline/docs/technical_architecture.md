# Chapter 1 — Technical architecture and system contracts

Revision: 1.2 · 2026-10-22 · Normative architecture; initial implementation now exists. See [implementation evidence](implementation_report.md) for implemented locations, actual passes and browser/human gaps.

Normative words: MUST = required for this slice; SHOULD = baseline with documented exceptions; DEFERRED = do not implement now. Chapter 1's gameplay file owns its exact constants and layout. This document adds engineering contracts; it does not silently rebalance them.

## 1. Target and stack

Engineering baseline: desktop web, TypeScript strict mode, Phaser **3.x**, Vite, npm lockfile, Vitest for pure tests, Playwright for browser checks. No React, backend, account service, multiplayer, Matter rigid-body simulation or shop framework is required.

The selected components and initial exact dependency targets are now recorded in [tech_stack.md](tech_stack.md). Read that file before bootstrap. This replaces the earlier instruction to choose arbitrary current stable versions at setup; it does not claim installation or integration success.

Phaser handles rendering, textures, sound and scene lifecycle. A small project-owned AABB simulation handles player/stone/platform motion and collision. Do not enable Arcade/Matter bodies on those same actors. Two physics owners will make collision and reset behavior disagree.

This is deliberately a narrow solver: axis-aligned bodies, vertical gravity, horizontal player/push motion, one vertical lift, breakable wood. No rotation, torque, slope, general rigid-body stacking or general-purpose physics engine should be built.

At implementation bootstrap:

1. Inspect existing repository and available Node/npm before adding files.
2. Start from the numeric dependency targets in tech_stack.md, keep Phaser 3.90.0 unless a blocker is documented, and record exact resolved versions in the lockfile/environment notes. Do not use changing latest tags or select beta majors blindly.
3. Use a supported patched Node 24 LTS with its bundled npm; verify actual package engine/peer requirements. The previous 22.12+ floor is historical compatibility context, not the selected Node line.
4. Pin the resolved toolchain; do not add production runtime CDN scripts or hotlink game assets.
5. Define scripts `dev`, `build`, `preview`, `typecheck`, `test`, `test:e2e`. Required one-shot test script: `vitest run`, not watch mode in CI.

These commands are project contracts; package.json now exists. Documentation completion alone is not proof that any command passes. Links: [Phaser](https://docs.phaser.io/phaser/getting-started/what-is-phaser), [Vite](https://vite.dev/guide/), [Vitest](https://vitest.dev/guide/), [Playwright](https://playwright.dev/docs/intro).

## 2. Minimal code organization

Original proposed organization (not an exact inventory). Actual initial scenes remain together in main.ts; see implementation_report.md for locations and deviations:

```text
src/
  main.ts
  game/config.ts
  content/chapter1.ts          # sole runtime source of CH1 constants/layout/presets
  content/dialogue.my.ts       # literal Burmese lines, ids, cooldown metadata
  domain/types.ts
  domain/createAttempt.ts
  domain/step.ts               # sole gameplay mutation entry point
  domain/collision.ts
  domain/player.ts
  domain/machine.ts
  domain/objects.ts            # stones, wood, plate, lift; split only if justified
  domain/settlement.ts
  services/CampaignStore.ts
  services/SaveAdapter.ts
  services/AudioController.ts
  scenes/BootScene.ts
  scenes/MenuScene.ts
  scenes/Chapter1Scene.ts
  scenes/Chapter1ExitLinkScene.ts
  view/WorldView.ts
  view/HudView.ts
  view/AnimationAdapter.ts
public/assets/                # verified runtime assets only
art/source/                   # layered originals, not bundled automatically
tests/unit/
tests/integration/
tests/e2e/
```

Use small plain modules; do not create a generic ECS, plugin architecture, event-sourcing backend or a class per pickup. Keep unrelated existing structure if it satisfies the boundaries.

### Dependency direction

- Content and domain types have no Phaser/DOM dependencies.
- Domain simulation reads content and input, returns state/events; it never reads textures, browser storage or wall time.
- CampaignStore owns persistent campaign changes and settlement. HUD cannot increment wallet.
- Chapter1Scene adapts input/time and renders snapshots/events. Animation cannot open doors or decide a death.
- SaveAdapter handles serialization/errors. AudioController consumes events and can fail silently with respect to gameplay.
- Views may interpolate visuals but never write collision positions back into domain state.

## 3. Units and authoritative configuration

- Coordinates in logical pixels, time in seconds, velocity px/s, acceleration px/s².
- World 1280 × 720, origin upper-left, positive Y downward; floor top 640.
- Player position stored as `centerX`, `feetY`; derive AABB `(centerX-18, feetY-56,36,56)`.
- Static rectangles use top-left `x,y,width,height` as in the chapter spec.
- Stone representation uses center X and bottom Y, size 96 × 96.
- Physics is independent of CSS size, device pixel ratio and sprite transparent margins.
- Numeric collision epsilon engineering default: `1e-4` px. Use chapter-specific tolerances such as plate bottom ±1 px where explicitly required. Snap support contact to its exact surface; do not widen all colliders to hide bugs.
- Fixed step `dt = 1/60`. Use elapsed seconds for 0.08 s coyote and 0.10 s buffer; do not silently round all durations to convenient tenths.

Constants MUST live in `content/chapter1.ts`. Do not duplicate “slightly different” values in view, tests or separate preset code. Tests should compare content with the chapter spec's contract fixture.

Critical constants to validate: player speed 220; gravity 1200; jump -570; **player** downward cap 900; push 90; taunt 0.35; first READY 4.0/subsequent 2.0; TRACK 0.55; LOCKED 0.85; RECOVER 0.80; death 0.25+0.65; R hold 0.50. Do not apply the player terminal-speed cap to stones without a design change.

## 4. Scene and mode lifecycle

Scene keys: `BOOT`, `MENU`, `CHAPTER_1`, `CH1_EXIT_LINK`. `CHAPTER_2` is a future destination ID, not a scene to fabricate now. Phaser scenes provide lifecycle boundaries; see [scene reference](https://docs.phaser.io/phaser/concepts/scenes). Our state ownership is project-specific.

Entry request concept:

```ts
type Chapter1Entry = {
  campaignId: string;
  mode: 'CAMPAIGN' | 'REPLAY' | 'PRACTICE';
  presetId: 'A' | 'B' | 'C';
};
```

- CAMPAIGN uses A. REPLAY A uses the same best-improvement earning rule.
- PRACTICE uses B/C after canonical A clear; it does not rewind campaign progress or award wallet currency.
- Reject an illegal mode/preset combination at entry, rather than letting it award money accidentally.
- Menu Start/Continue: start a campaign if none; otherwise resume current available chapter boundary. New Game needs explicit reset confirmation.
- Do not put long original intro VO before every attempt. For this slice a short optional intro/entry line is sufficient; the chapter spec's nonblocking timing controls.
- Scene shutdown disposes input/visibility listeners, sounds/tweens and view objects. Do not register new global listeners on every restart.
- R/death should rebuild attempt state within the chapter session; do not create a new campaign or reset session deaths.

## 5. State model

Use serializable plain data and discriminated unions. Domain state must not contain Phaser sprites, timers, event emitters, DOM nodes or mutable shared fixture references.

Conceptual campaign schema (TypeScript notation, not a provided implementation):

```ts
type CampaignSave = {
  schemaVersion: 1;
  revision: number;
  campaignId: string;
  walletCoins: number;
  deathCount: number;
  chapter1Completed: boolean;
  chapter1BestBankedCoins: number;  // integer 0..15, unaffected by spending
  completedAttemptIds: string[];  // canonical successful settlements
  bestResultByPresetAndCoinTotal: Record<string, number>; // key A:15, seconds
  hintsSeen: string[];
  inventory: string[];            // opaque legacy compatibility; not active in CH1
  ownedTools: string[];           // empty for new slice; no shop behavior
  resumeAt: 'CHAPTER_1' | 'CH1_EXIT_LINK' | 'CHAPTER_2_PENDING';
  lastChapter1Result: ChapterResult | null;
};
type ChapterResult = {
  attemptId: string;
  mode: 'CAMPAIGN' | 'REPLAY' | 'PRACTICE';
  presetId: 'A' | 'B' | 'C';
  collectedCoins: number;
  creditedCoins: number;
  activeSeconds: number;
  sessionDeaths: number;
};
```

Session: entry mode/preset/campaign, session death count, entry wallet, pause flag and lifecycle transition clock. Attempt: unique ID, generation token, not-started/active/terminal state, player, objects, AI, pickup IDs, attempt coins, active time and event dedupe.

Player control states: FREE, TAUNTING, DEAD, EXITING. Machine states: READY, TRACK, LOCKED, DROP, RECOVER. Stones: FALLING, SETTLED, SUPPORTED with optional support entity ID. Pause is a wrapper, not a replacement AI/player state.

IDs MUST be stable for configured entities/pickups; spawned stone IDs unique within an attempt. Every async view callback carries the attempt generation token and is ignored after reset/shutdown. The simulation must not rely on async callbacks to complete attacks.

New campaign defaults: wallet/deaths/best 0, chapter1Completed false, receipts/records/hints/tools/inventory empty, resumeAt CHAPTER_1, no seeded Chapter 2 items. Preserve supplied legacy inventory when loading a valid compatible save. A future Chapter 2 adapter can seed its own items once, not on every scene create.

## 6. Input and clocks

Input frame: left/right held, jump press edge, taunt press edge, restart held, pause press edge. Key repeat MUST NOT create fresh jump/E edges. Buffer at most one jump according to the chapter window. Opposite horizontal keys cancel. Keyboard listeners affect the game only while its surface is active; do not steal typing from menus/text fields.

There are **three clock responsibilities**:

| Clock | Runs when | Owns |
|---|---|---|
| Simulation active time | Started, alive, not completed/paused/hidden | AI, physics, attempt time, coyote/buffer, taunt |
| Lifecycle time | App visible and not user-paused | 0.25 impact freeze + 0.65 reset, 0.35 exit fade, 2.0 link continuation |
| Input hold time | Visible, focused, eligible active/waiting attempt | R hold 0.50; reset on release/focus loss |

Death freezes simulation, **not its own respawn clock**. Result freezes gameplay, not the visible link continuation clock. Pause/focus loss freezes all three clocks and clears held/edge/buffer state. Clear accumulator on resume so no background catch-up deaths occur. Music/voice should pause or stop consistently; audio completion never advances simulation.

First accepted move/jump/valid E starts the attempt and first READY clock. Menu clicks, Esc, R and rejected input do not start the attack timer. A valid first E starts the attempt and immediately TRACKs, not four seconds later.

Render loop accumulates delta and executes 1/60 steps. Engineering safety cap: process at most 8 steps per render; discard excessive backlog rather than simulating many unseen attacks. Record discarded backlog in dev diagnostics; this protects fairness but is not a claim of identical wall-clock behavior during long stalls. At normal 30/60/144 Hz render schedules the same fixed-step input trace must give the same domain result. Use interpolation only in presentation, and keep gameplay telegraphs aligned with authoritative coordinates.

## 7. Deterministic step order and collision

The chapter event-order contract is mandatory. Recommended implementation:

1. Snapshot valid input; update eligible AI/player clocks and intended velocities.
2. Derive player/stone movement and the lift's constrained movement from the existing plate state. Newly computed plate state becomes the next step's target; document this at-most-one-step response.
3. Compute continuous collision candidates over the step with relative motion. Resolve earliest time of impact, advance to it, apply effects and recompute the remaining portion after a wood break/removal/support change.
4. Recompute support links, grounded state and plate weight from live bodies; publish next lift target.
5. If alive and no terminal latch: collect overlapping pickups once by ID.
6. If alive and no terminal latch: evaluate exit, freeze attempt and request settlement.

A swept solver may use piecewise-linear motion per fixed step; use consistent integration and validate the actual landing routes, not only continuous ballistic formulas. Stable sorting: normalized TOI then event class then stable entity IDs. A genuine player hazard contact tied with pickup/exit wins over them. A stone removed by an earlier collision cannot kill later in the same sweep. If simultaneous hazard/solid contacts remain ambiguous, add a reproducing fixture and resolve the blocking geometry at contact time; do not use callback registration order as a rule.

Additional collision contracts:

- Static solids collide on sides/underside/top; lift is a full solid rectangle, not an assumed one-way platform.
- Grounding requires top contact and at least 8 px horizontal landing overlap. Reset vertical velocity on support; no midair jump from a stale flag.
- A falling stone hitting wood with the required ≥8 horizontal overlap destroys it and keeps the unspent trajectory/velocity.
- A falling stone contacting another live stone shatters both; pushed side contacts do not. Do not stack rocks or destroy a whole push chain because one rock is hit.
- Support changes are immediate; a carried object is not treated as in free fall just because the lift descends. Removing its actual support makes it FALLING.
- Chain push speed 90 regardless count; solve the available displacement of the whole touching settled chain against barriers/world bounds. Do not push through player/static geometry or leave overlapped stones.
- Descending lift stops at an obstructing body's top minus lift height; upward lift is constrained by carried bodies. No crushing death or teleport escape.
- Derive plate pressure each step: grounded stone bottom 640±1 and overlap ≥48; player alone insufficient, pickups zero mass.
- Pouch falling ignores platform/stone physics and settles on floor as specified. Its pickup still requires player overlap; it is not auto-granted through a wall.
- Stone spawn bottom 128 → top 32. Telegraph ray/footprint must match the 96 px body and current target; preview must consider the nearest solid and continuation through wood, not pretend all shots reach the floor.

Assertions in dev/test: finite coordinates, no invalid support IDs, no negative counts, no live-body penetration beyond epsilon, one machine-owned shot unresolved at a time. Detect solver iteration exhaustion with diagnostics/tests; do not silently delete entities or award victory to escape it.

## 8. Events and presentation

Domain emits small data events: AttemptStarted, TargetLocked, StoneSpawned, StoneSettled, StonesShattered, WoodBroken, PlateChanged, CoinCollected, PlayerDied, ChapterCompleted, AttemptReset. Include attemptId and stable event ID/sequence. Death and completion are mutually exclusive terminal events.

AnimationAdapter selects visuals from authoritative states/velocities. It cannot grant immunity, extend taunt, delay respawn or change support. Sprite feet anchor follows player feet. Swept hitboxes never come from texture bounds.

HUD shows unbanked X/15 separately from banked wallet, death count, active time and E availability. All displayed gold values derive from state. Use the selected lightweight HTML/CSS DOM overlay for menus/HUD/subtitles, with world-space labels/effects in Phaser. Keep overlay coordinates responsive and do not let it block the aim footprint.

Use whole-line Burmese subtitles initially. If typewriter is later added, reveal grapheme clusters, not UTF-16 units; wrap after the chosen font loads. Accessibility controls: mute/volume, subtitles, shake off, hint reset. Audio cannot be required to distinguish TRACK from LOCKED.

## 9. Death, restart and cleanup

On death: latch once, increment campaign deathCount/session deaths once, freeze AI/world/attempt time, start lifecycle freeze/reset. Repeated contacts have no effect. Do not collect coins or complete after the latch. Persist the death count opportunistically; a save failure cannot block respawn.

After 0.90 visible/unpaused lifecycle seconds: build a fresh current-preset snapshot, new attemptId/generation, player FREE, coins/time zero, machine dormant READY. Preserve campaign fields, settings, session deaths and hint-seen. Snapshot creation must deep-copy fixtures; prior wood destruction must not mutate presets.

R hold 0.50 triggers the same snapshot restore without death increment. A held R must not trigger an infinite reset every tick; require release before rearming. Ignore it during death/settlement/exit transitions. Cancel stale input edges, sounds, timers and FX on reset.

## 10. Settlement contract

Only CampaignStore may settle a completed attempt. Compute against the **current** campaign snapshot, not stale entryWallet. Validate campaignId, attemptId, legal mode/preset, alive completion, integer coin total within allowed range and generation.

Canonical A:

```text
if receipt already contains attemptId: return a duplicate/no-op response; no mutation
credit = max(0, collected - chapter1BestBankedCoins)
next.walletCoins = current.walletCoins + credit
next.chapter1BestBankedCoins = max(previousBest, collected)
next.chapter1Completed = true
next.completedAttemptIds includes attemptId
```

PRACTICE B/C: creditedCoins=0, no update of chapter1BestBankedCoins, no rewind of campaign resume/progress. Successful records may improve. Key records by preset and collected total; update only if new successful active time is lower. Unsuccessful attempt time and deaths are not added to that time record.

Create one candidate campaign object containing wallet, best, receipt, records, last result and correct resume state; serialize/write it once. Commit the same candidate to memory once. Never write wallet separately and then best/receipt later. Replay lower/equal amounts still records a successful result but gives zero credit.

An old duplicate after a newer completion must not display `lastChapter1Result` as if it belonged to that old attempt. Receipt membership is sufficient for a no-op response; returning the exact historical result would require storing it explicitly, which this minimal schema does not require.

Engineering invariant for this slice (no spending): walletCoins = chapter1BestBankedCoins for a newly created CH1-only campaign. Do not enforce that equality on compatible externally supplied campaign saves containing other legitimate balances. Always keep best-earned separate from wallet for the future shop.

## 11. Local save contract

Storage key engineering baseline: `phoe-htaung.campaign.v1`; settings may use `phoe-htaung.settings.v1`. SaveAdapter interface: load/validate, save candidate, reset after owner confirmation; inject an in-memory adapter for tests. No browser storage in domain tests.

Load validates schema, numeric ranges, enum values, IDs/receipt uniqueness, records and last-result consistency. Unknown future schema or malformed data must not silently become “New Game” and overwrite it. Offer a safe error/recovery choice; do not invent migration from unrelated legacy JSON.

If setItem throws/unavailable: adopt the settlement once in memory including receipt, show an unsaved warning, allow Retry Save or Continue in temporary mode. Fade only after a committed durable candidate or explicit temporary-mode continuation. Reload can lose temporary progress; do not promise otherwise. [Browser storage reference](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).

Autosave at successful settlement, relevant campaign/death/hint updates and settings changes; do not write per physics frame. Persist no midair positions, machine timer or half-complete attempt. Reload during an unfinished attempt restores the chapter's initial preset rather than a partially mutated room.

Only one active writer tab is supported. Handle storage changes from another tab by pausing and requesting reload/choice before further commits; detect stale revision before saving. This is a best-effort guard, not transactional multi-tab/cloud support. No anti-cheat guarantee is made for editable local saves.

Settings survive New Game unless the owner explicitly requests full settings reset. Campaign reset must not delete unrelated browser storage or other files.

## 12. Exit link and future chapter boundary

Canonical completion freezes all damage/AI, settles currency, then runs 0.35 s fade into safe CH1_EXIT_LINK. The link can show stairs, pipes and steam/furnace atmosphere without new gameplay or pickups.

When a real CHAPTER_2 scene exists, Continue or 2.0 visible seconds uses the persisted campaign and result payload. In the **current CH1-only slice**, those triggers show a stable `CHAPTER_2_PENDING` result panel: “ပထမအခန်းပြီးပါပြီ — နောက်အခန်းကို မတည်ဆောက်ရသေးပါ။” Offer Replay A, unlocked Practice B/C and Menu. Do not fake a final campaign ending, crash by loading an absent scene or start an invented Chapter 2.

Practice/replay entry instead returns its result choices and preserves campaign resumeAt. Transition payload: campaignId, walletCoins, deathCount, inventory, ownedTools, chapter1Completed, chapter1BestBankedCoins, lastChapter1Result. The same campaign object/service is shared; scene create must not zero it.

This explicit slice adapter supersedes only the original assumption that Chapter 2 already exists; it does not alter CH1 win geometry or the future story direction.

## 13. Diagnostics and completion evidence

Dev-only diagnostics SHOULD expose current AI/player state, target X, support IDs, plate weighted state, object AABBs, attempt generation and events. Test APIs must be absent/disabled in production builds and must use the same domain step/settlement code, not a second fake game.

Log no credentials, browser sessions or private-source contents. Keep fixtures local. No analytics/network calls are needed. Version-control generated reports deliberately; do not commit node_modules, caches, private raw sources or giant downloaded archives.

Definition of done and tests: [verification plan](verification_plan.md). Successful build ≠ demonstrated route completion ≠ enjoyable game. Report these separately.
