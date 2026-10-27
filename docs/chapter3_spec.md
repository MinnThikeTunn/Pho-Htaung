# Chapter 3 — ချိန်ခွင်နှင့် ရွှေရုပ်

Implementation branch: `codex/chapter-3-scale-puzzle`, based on `912003a`.
Owner direction, 2026-10-27: Chapter 3 uses Chapter 1's exploration/item puzzle/troll style; fighting starts in Chapter 4. Owner then requested implementation on a separate branch. This authorizes this prototype, not a final-art or fun sign-off.

## Scope and source reconciliation

Current flow: bridge puzzle → stone-machine action → scale puzzle → Chapter 4 pending. The legacy Chapter3Scene.js and narration remain references, not registered scenes. No correct-math punishment, statue combat/laser eyes or changing inscription digits to magically open a door. The carved statue is scenery around a visible mechanical linkage.

No Chapter 1/2 domain, traps or existing action E behavior is changed here. The owner's rejection of taunting applies to the new Chapter 3 design. Chapter 4 combat remains unimplemented. No packages, media downloads, voice recordings, shop, debt values or full-game ending are added.

## Prototype rules and constants

`src/content/chapter3.ts` is the sole source of local content; shared movement stays in `content/chapter1.ts`.

- Logical world1280×720; floor640; true spawn centerX96/feet640.
- Shared36×56 body;220px/s, gravity1200, jump−570, terminal900, fixed60Hz; coyote0.08, buffer0.10, R hold0.50. Custom AABB/sweep owns the Chapter 3 actor; no Arcade body is attached.
- Shelf: x300/y530/w150/h18, solid on all sides. Shelf bag requires actual jumping. A queued shelf click approaches beside the shelf; it does not walk underneath and trap the jump against its underside.
- Left pan fixed reference10. Right pan sums stable item IDs; exactly10 raises the gate. Under/overweight does not kill. No item is consumed by experimenting.
- Gate: x1040/w64/h380, initial top260; travels210 at140px/s. Removing a necessary weight warns for1.20 active seconds before descent. Restoring balance cancels descent. Gate stops if its proposed rectangle would overlap Phoe Htaung; it does not crush or teleport him.
- Floor exit: grounded, feet640±0.01, centerX≥1220. No currency, treasure, installed-pin or walkthrough flag is required. Gate geometry blocks direct walking/jumping while shut.
- Interaction reach: horizontal88, feet difference64. One distant click walks to the target and performs the same interaction once in reach. A/D cancels that command; jumping preserves it so the shelf pickup works. Changing bag selection cancels an older queued use.
- Item-location states: WORLD/BAG/PAN/LATCH. Items on the pan can be retrieved indefinitely. The pin alone fits the latch and only after the gate is fully raised. No crafting recipe, disposable weight or arbitrary timer deletion.

| ID | Item | Weight (ပိဿာ) | Initial X / feet |
|---|---|---:|---|
| stone | ကျောက်တုံး |3|220 /640|
| treasure | ရွှေရုပ် |7|850 /640|
| crate | သစ်သားသေတ္တာ |4|930 /640|
| sandbag | သဲအိတ် |3|380 /530|
| pin | သံချောင်း |0; latch tool|150 /640|

The large props use the same abstract carry-in-bag convention as the existing puzzle. This is a prototype interaction, not a simulation of realistic lifting capacity.

## Valid routes

1. Stone3 + treasure7 → gate open → leave treasure and escape.
2. Open gate, install pin → retrieve treasure → escape with it.
3. Stone3 + crate4 + shelf bag3 → gate open without treasure → collect treasure optionally and escape.
4. Initially use treasure, then replace it with crate4 + bag3 while retaining stone3.
5. Retrieve treasure and cross before the gate closes. This valid timing shortcut is preserved, including the safe gate stop if standing underneath. Do not add a hidden sequence check to force the longer solutions.

The learned quick route may dominate the longer routes. This is an explicit playtest/balancing question, not proof of replay value; seek owner review before changing warning time or removing a valid route.

## Controls and presentation

A/D/arrows move; Space jumps; mouse clicks visible objects or their labelled buttons to pick/retrieve. Select an owned item in the bag, then click pan/latch (art or label). H toggles item labels/rings; Esc pauses; R hold resets the whole attempt. No E, attack, taunt or combat skill exists in Chapter 3.

Use the same PhoeHtaungView and loaded character atlas as Chapters 1/2. Following the owner's art correction on2026-10-27, the flat room/statue and primitive props were replaced with a painted ancient chamber and six-prop transparent atlas. The existing Chapter1 background is the environment reference; matching mossy stone, worn gold and warm shafts of light preserve continuity. Moving ropes/beam/pans and shelf still use shaded procedural geometry. See [art revision evidence](chapter3_art_review.md), [source/prompts](../art/source/chapter3/README.md) and [manifest](../public/assets/chapter3/manifest.json). Art remains subject to owner review. All colliders are domain data. Optional audio is text-only for this chapter; no recorded narrator voice is claimed.

Whole-line Burmese speech persists until the next action message. The journal (`စာ`) pauses and lists previous lines. Controls/weight/gate state are truthful; U Gyi's greed jokes are narrative. Display full-open status only when the gate actually reaches its upper stop. Label stagger and compact pan-return buttons prevent adjacent prop captions overlapping.

The common game container now fits viewport height as well as width: browser observation at1280×720 previously cut off the bag at the bottom. This CSS change affects presentation across chapters, not world dimensions, physics or hitboxes.

## Session, save and progression

ScaleSession owns fixed-step accumulation, pause, restart arm/generation and dropped-backlog cap8. Pause/blur/hidden clears held input, buffered jump, pending click and accumulator; no background catch-up. R restores all objects, latch, gate, selection and time with a fresh ID, without changing wallet/deaths/campaign.

Continue after Chapter2 now enters CHAPTER_3. Existing schema2 saves at CHAPTER_3_PENDING load and enter the real new chapter. New optional additive fields: chapter3Completed, chapter3TreasureRecovered, lastChapter3Result. Old fields/legacy keys are preserved; no mid-attempt positions are saved. Reload restarts an unfinished chapter at its real spawn. Completed Chapter3 resumes CHAPTER_4_PENDING.

CampaignStore alone settles valid exits using receipt `scale:<attemptId>`. Reward is **relic recovered yes/no**, recorded separately from wallet. Chapter3 gold value has not been owner-defined: no arbitrary payout is minted, and existing Chapter2 best-improvement banking is unchanged. Replay can improve recovered status false→true, never erase it or farm currency. A per-attempt result still truthfully reports what that attempt carried.

Result records active seconds, recovered flag and method WEIGHTS/BRACE/TIMING. Save errors retain the receipt/progress in memory, show an unsaved warning and offer Retry Save or explicit temporary continuation. Another writer's storage event pauses the chapter and requires reload. New Game remains the existing explicitly confirmed reset.

Chapter3 result → voluntary Continue → Chapter4 pending with a shouted warning from people alerted by the door mechanism. No NPC fight is loaded. First-play target including exploration is roughly3–5minutes, unvalidated; learned routes are deliberately shorter and not padded by dialogue/waiting.

## Acceptance and evidence

See [implementation report](chapter3_implementation_report.md). Required evidence separates production-domain traces, browser play, automated Playwright and human fun. Headless true-spawn traces never teleport, grant inventory or force gate/win flags. Browser campaign entry may use existing legitimate completed Chapter2 progress; it is not a fresh three-chapter walkthrough.

Owner review still needed: whether choices/comedy are engaging, whether the timing route dominates, first-play duration, final art/audio, Chapter3 reward amount, Chapter4 fighting design.
