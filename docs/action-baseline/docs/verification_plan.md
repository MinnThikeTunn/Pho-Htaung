# Chapter 1 verification and playtest plan

Revision: 1.1 · 2026-10-22 · This is the required verification contract, not a passing report. Actual52 test results and all A/T statuses are recorded separately in [implementation_report.md](implementation_report.md); browser/human checks remain outstanding.

## 1. Evidence levels

Keep separate: document review; arithmetic check; unit test; integration simulation; browser test; human playtest. Never label a document assertion or fixture teleport as a completed gameplay route. Every report states command, version/configuration, date, result and evidence path.

Required report statuses: NOT_RUN, PASS, FAIL, BLOCKED. BLOCKED needs a concrete reason. Missing art can block final-art sign-off but should not block graybox gameplay tests. Missing browser binaries can block automated browser tests; report it and perform feasible headless/unit checks, not an invented pass.

## 2. Test layers

### Unit: pure domain

Use an injected clock/input trace and in-memory save adapter. No real browser timer, actual WebAudio or Phaser sprite is required. Cover input edges/buffer, FSM transitions, sweep TOI, plate/support, chain displacement, settlement reducer and validation. Use exact integers for money and compare spatial/time floats with stated tolerances.

### Integration: real simulation

Construct A/B/C from the same production content module and run fixed steps. Record deterministic traces and state snapshots. Inject inputs, not outcome flags. Scripted setup fixtures may isolate one rule, but distinguish them from end-to-end route traces starting at the true spawn.

### Browser: user-facing build

Use the actual game bundle with keyboard/menu input. Check boot/load errors, canvas scaling, pause/focus handling, visibility of warnings/HUD, local save, reload and audio fallback. Dev/test inspection API can read state or initialize an isolated fixture; a route-clear proof must not use “win”, teleport-to-exit or currency-grant shortcuts.

### Human: enjoyment and comprehension

Provide no verbal walkthrough for the initial attempts. Ask what caused deaths, what a settled rock can do and what route they want to try next. Record behavior before coaching. Passing automated tests cannot satisfy this layer.

## 3. Canonical acceptance mapping

The detailed expected behavior is defined by Chapter 1 A01–A31. Each ID must have a named test or a clearly recorded manual procedure. Do not silently remove a row to make a milestone pass.

| Chapter ID | Primary verification | Minimum evidence |
|---|---|---|
| A01 | FSM unit + integration | Automatic first attack at first-input+4.0; repeat cycle without E |
| A02 | Input/FSM | Valid first/next E starts TRACK, 0.35 control lock, no fee |
| A03 | Input trace | Held/spammed/busy E does not repeat or queue |
| A04 | FSM trace | TRACK follows, LOCKED X stays fixed |
| A05 | Collision/lifecycle | Falling hit → one death, no same-step pickup/win |
| A06 | Support fixture | Settled rock safe, stand/jump/push valid |
| A07 | Swept wood fixture | Gate breaks, same drop continues |
| A08 | Shelf/pouch fixture | Shelf breaks, pouch falls, value retained |
| A09 | Collision fixture | Two involved rocks shatter; no stack |
| A10 | Long integration + manual | 10+ cycles, supports valid, obstruction recoverable |
| A11 | Plate fixture | Player alone does not raise lift |
| A12 | Plate/push fixture | Rock weights plate; remove → descent |
| A13 | Plate/shatter fixture | Destroy plate rock → derived pressure clears |
| A14 | Lift/player/rock fixtures | Descent stops on either; move obstruction → resumes |
| A15 | Lift support fixture | Lift rock shatters; support recomputed |
| A16 | Four true-spawn input traces | Routes A/B/C/D achievable with active machine |
| A17 | Route trace | Upper route, intact gate → valid win |
| A18 | Isolated integration + route evidence if reachable | Exit permits zero coins; no currency gate |
| A19 | Pickup fixture | Repeated overlap same ID collects once |
| A20 | Death fixture | Collected 15 then die → attempt0, unchanged wallet |
| A21 | Settlement reducer | Clears5→15→15 credits5→10→0 |
| A22 | Synthetic future-spend fixture | Lower wallet + same best replay → no extra credit |
| A23 | Save/reload integration | Duplicate callback/reload cannot double-credit |
| A24 | Snapshot fixture | Changed world restored, no stale shot or callback |
| A25 | Browser + clocks | R/paused/hidden behavior with unchanged wallet/death where required |
| A26 | Preset initialization | B/C exact stones, support/pressure/lift states |
| A27 | Practice settlement | Clear15 in B/C: record allowed, zero wallet credit |
| A28 | Render-schedule simulation | 30/60/144 rendering, same step trace/result; thin solids not tunneled |
| A29 | Browser visual/manual | Burmese intact, muted audio functional, HUD/warnings unobscured |
| A30 | Current link + future adapter | Full state payload preserved; no tunnel flag. CH1-only pending panel verified now; real CH2 entry remains deferred |
| A31 | Reachability fixture + input sequence | Clear fixed-step rock from ground-side aim; no forced stand at target center |

For A18, all five floor coins are directly on the normal path; do not claim a zero-coin route unless demonstrated. A fixture can prove the exit predicate ignores coins without proving a natural zero-coin clear. For A30, testing a pending panel is not a claim that Chapter 2 has been implemented/tested.

## 4. Additional engineering regression cases

| ID | Case | Expected |
|---|---|---|
| T01 | Scene load idle for 20 s | No attack/attempt time until first valid gameplay input |
| T02 | First input is valid E | Immediate TRACK; no duplicated dormant READY delay |
| T03 | Space held across landing/reset | No repeated jump; reset clears stale edges |
| T04 | Hold R for 2 s | One reset at threshold, new reset only after release |
| T05 | Pause/hide during death transition | No frozen-forever respawn or hidden catch-up; 0.90 visible lifecycle seconds total |
| T06 | Pause/hide during link | Continue clock freezes; no missing scene load |
| T07 | Object removal mid-sweep | Earlier shatter removes later hazard candidate |
| T08 | Chain against gate/world/step | Stops without penetration; other rocks not silently deleted |
| T09 | Support moves/disappears | No fake grounded jump, carrying lag or dangling support ID |
| T10 | Manual retry/menu after queued FX | Old-generation callbacks ignored, no late damage/gold |
| T11 | Repeated scene entry 20 times | No duplicate listeners, loops, VO or settlement calls |
| T12 | Storage quota/permission exception | One in-memory settlement, unsaved warning, no false durable-save claim |
| T13 | Malformed/unknown save schema | Safe recovery UI, original data not silently overwritten |
| T14 | Changed campaign in another tab | Stale writer paused/choice required; no promised multi-tab atomicity |
| T15 | Replay/practice after story progress | Campaign resume/unlocks not rewound |
| T16 | Missing optional atlas/audio | Visible readable placeholder or silence, gameplay continues |
| T17 | Swap placeholder to final atlas | Same body geometry/physics trace; feet/pivots visually stable |
| T18 | Corrupt/duplicate pickup or illegal collected amount | Rejected/diagnosed; no currency credit |
| T19 | Duplicate completion after another later clear | No mutation and no stale result treated as new payout |
| T20 | Low-render stall >8 fixed steps | Backlog discarded/diagnosed, no unseen catch-up attack burst |
| T21 | Font load slow/fails | Clear fallback/loading status; no broken/misleading measured text layout |
| T22 | Pause from typed menu field | Game keys do not alter gameplay while typing |

## 5. Geometry and physics checks

Read baseline values from content. Check at least:

- Jump rise theoretical 135.375 > rock96 and step96; actual solver also clears them with side-collision and body width.
- Ground+one rock+jump cannot alone bypass gate280/shelf320.
- Fixed step→raised lift and lift→shelf landings with ≥8 horizontal overlap.
- Lower-lift rock→shelf advanced route; ensure player can actually reach/set up/leave the rock with active attacks.
- Shelf→gate top→ground exit; no invisible ceiling.
- Shelf/gate gap136 > rock96; one vertical footprint cannot break both directly.
- Under-home-lift gap80 > body56; descending lift never intersects actors.
- Lock retreat clears both player's half-width18 and stone half-width48, not just center points.

Continuous ballistic arithmetic does not exactly characterize every capped/discrete path. For example, player terminal speed can affect long downward falls, while stones have no documented player-speed cap. Preserve the actual specified mechanics and rerun real simulation rather than tuning constants to make an approximate table exact.

## 6. Visual/audio inspection checklist

- At 1280×720 logical size plus scaled window: character feet anchor, no jitter, clear push vs walk vs airborne.
- Stone danger state and support state distinguishable; outline remains after music/voice muted.
- Full96 footprint; first-impact preview follows current solids, dotted continuation through wood.
- Pickup hidden behind rock still outlined; no phantom coin after collection.
- No stale intact gate/shelf baked into background after break.
- Burmese signs/subtitles/HUD correct; no cut combining marks, wrapping under controls or clipping at screen edge.
- Audio unlock rejection does not stall Start; warning visual still sufficient.
- VO does not overlap itself or delay .90 retry; loops stop on pause/reset/scene exit.
- Shake off works; normal shake≤4px/.15s and cannot obscure lock.
- Link clearly says next chapter is unbuilt; no deceptive “whole game complete.”

## 7. Human playtest protocol

Initial target: at least three people unfamiliar with the solution if feasible. This is a practical review sample, not statistical proof of originality. If fewer are available, state that limitation; the owner can also test early.

For each person:

1. Show controls, let A be played without giving route instructions. Record active session time, deaths, waits, misunderstandings and help requested.
2. After first clear, offer another attempt without a new reward promise. Record whether they voluntarily try coins, speed or a different route.
3. On up to three attempts, note changes in strategy/control, not just faster memorized key presses.
4. Offer unlocked B/C as optional practice. Observe if they adapt to initial stones instead of blindly replaying A.
5. Ask briefly: “What did you think would happen?”, “Was any death unreadable?”, “What would you try next?”, “Where did you feel you were waiting?”

Targets from the chapter spec: first session incl. retries1–3min; experienced direct8–20s; full coins15–35s. Record measured distribution and context. Do not fail a clever fast clear simply because it beats the target. Do not inflate waits to hit duration.

If players understand but do not want another attempt, investigate route choice, repetition and input friction. New currencies, a shop or more dialogue are not automatic fixes. If one route dominates, record its actual time/risk and compare alternatives before proposing a change.

## 8. Evidence report template

When implementation starts, create a real report (not a prefilled passing report):

```text
Build/commit:
Date and environment:
Exact tool/package versions:
Commands actually run + exit status:
Acceptance ID | status | test/procedure | evidence path | observed result
True-spawn route traces/captures:
Visual/audio checks and screenshots:
Save-failure/reload observations:
Human playtests (anonymous observations, sample size):
Failures and smallest proposed fixes:
Owner decisions needed:
Not tested / deferred scope:
```

Future required commands after bootstrap: `npm run typecheck`, `npm run test`, `npm run build`, `npm run test:e2e`. Verify package scripts exist before invoking. Browser recordings/screenshots need actual artifact paths; do not invent links. No such commands or gameplay tests have been run by this documentation-only pass.

## 9. Gate to Chapter 2

Proceed to detailed Chapter 2 implementation only after Chapter 1 is functionally complete and the owner has reviewed the playtest result. Failed tests require fixes or an explicit documented scope decision. Even a full automated pass does not replace the human fun/replay review. Story/currency extension must preserve D01–D05 and the finite earning contract.
