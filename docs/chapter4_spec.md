# Chapter 4 — ape guards

Owner-authorized implementation, 2026-10-28. Latest remote `main` was fetched and local `main` fast-forwarded to `1aecccb` before implementation. Work is on `codex/chapter-4-ape-arena`. This extends the existing three-chapter campaign; earlier CH1-only and CH4-pending endpoints are historical scope.

Current balance revision follows the owner's instruction to fix the [observed stationary-shot exploit](../reports/chapter4-experience/README.md). See [new verification and remaining limits](chapter4_balance_review.md). Earlier implementation evidence records the pre-revision tuning.

The owner's subsequent correction is now the equipment baseline: **start with fists; take a carried sling out of the bag; no sling means fists remain available**. See [equipment revision evidence](chapter4_equipment_revision.md).

## Story and scope

After the scale chamber, Phoe Htaung reaches a roof-broken courtyard guarding the inner ancient city. Two giant apes block progress: a brown melee guard and a silver stone thrower. Defeat both and walk through the right exit. Chapter5 remains an explicitly unfinished continuation, not the game ending.

Keep the same human cartoon protagonist, longyi, Burmese text and warm, weathered ancient-Bagan visual direction. No possession, magic, taunt button, shop, skill tree or new currency. Combat is this chapter's activity; Chapter3 remains an item puzzle.

## Input and combat

`src/content/chapter4.ts` owns tuning and frame metadata. Shared character dimensions and movement remain in `chapter1.ts`; art never owns collision.

| Input | Behaviour |
|---|---|
| A/D or arrows | Move at shared220px/s; half speed while drawing the sling |
| Space | Shared jump; no double jump |
| J press | Punch one nearest enemy in front, within86px;1 damage,0.75s cooldown; an idle/recovering enemy is shoved80px and stunned0.75s |
| B / bag button | Open/close the paused bag; choose fists or take out an owned sling |
| Hold/release K | After taking out the sling: draw up to0.55s, release to fire; minimum0.12s, maximum30 damage,0.48s cooldown |
| L press | Dodge toward held movement, otherwise backward;0.22s at420px/s, first0.15s invulnerable,0.85s cooldown |
| Hold R | Whole-attempt retry after0.5s; release/repress required |
| Escape / pause | Freeze simulation and reset held/buffered input; blur/hidden tab also pause |

Player starts at x160/feet640 with100HP and **FISTS equipped**, including when carrying a sling. Each ape has150HP. Three labelled health bars, a visible75-second combat countdown and dodge readiness are available. Sling owners carry12 stones; missing sling means0 ammo, shown as a dash. Charge bar appears only with the sling equipped. Time/AI wait for effective gameplay input; pressing K with fists cannot auto-equip, fire or start the waiting attempt.

K fixes facing when drawing starts. On release the shot aims at the nearest living ape in that direction; no target means a straight shot. Actual swept projectiles hit the first body along their path. Full charge can defeat each ape in five hits. Minimum-charge taps do less damage. Shots travel at920px/s. Holding K alone does not repeatedly fire.

J creates enough space/stun to draw a full sling shot against an idle or recovering ape, but cannot cancel an attack already winding up or repeatedly restun an already stunned ape. Bare fists cannot beat300 combinedHP within75s: even the generous ideal bound `(ceil(75/0.75)+1)*1 =101` is below300. This is a visible time-pressure rule, not invisible enemy healing or an arbitrary forced death. Actual difficulty/fun requires owner playtesting; damage values are prototype tuning.

A real hit cancels the current sling charge and prevents redrawing for0.3s. An unfired stone is not consumed, and movement, jump and dodge remain available during that draw interruption. Clear flash/message feedback explains the interruption; no hidden charge loss or forced lockout of escape controls.

## Enemies and truthful warnings

Brown starts at720 and approaches at180px/s. Its0.65s windup locks facing and draws the actual low strike area. A hit deals24; its recovery is0.85s. Jump or dodge out of the marked reach.

Silver starts at1100, retreats when close and throws a stone toward the player's position locked at windup start. The0.85s warning draws that locked line/target. The projectile travels at430px/s, deals20 and can be avoided after the throw. Throw recovery is1.1s and cooldown1.4s, with initial cooldown0.25s.

The attack coordinator starts at most one windup/strike at a time, with1.05s spacing and1.2s initial grace. An older flying stone can coexist with a later melee warning; the coordinator does not promise to remove projectiles. Hurt grace0.8s prevents immediate overlapping hits. Apes have no passive contact damage. Player/enemy health and warning duration were not inflated/shortened in this revision.

## Supplies, loss, retry and exit

For sling owners, renewable piles at x100 and1170 refill ammo to12 after standing grounded within58px for0.8s without drawing K. Stowed sling ammo can refill; a missing sling cannot gain ammo or equipment from the pile. No coin cost or consumable source.

HP0 loses and records one death for the unique attempt. Combat timer75s loses without adding a death. Either stops the attempt and shows retry/menu. If death/time and the final enemy hit occur on the same tick, failure takes priority. Retry restores both enemyHP, playerHP, ammo, projectiles, AI, position and timer; starts with fists again and retains original carried-tool ownership. It does not reset campaign gold or completed chapters.

When both apes fall while Phoe Htaung is alive, combat time stops and hostile shots clear. The exit is safe; walk grounded to x1220. Exit walking has no remaining deadline. Chapter completion requires both enemies defeated and the actual exit, not a menu click. Result reports combat time, remainingHP and existing wallet.

## Previous-chapter equipment boundary

The owner explicitly said another developer handles the earlier slingshot pickup. This implementation does **not** add a pickup or mutate earlier inventory. `ArenaChapterScene.init({equipment:{slingshot:boolean}})` accepts that developer's result.

Omitted equipment now reads the existing campaign's `ownedTools` or `inventory` for `slingshot` (`SLING_TOOL_ID` in the content module). An explicit `equipment.slingshot` boolean overrides that lookup for another developer's handoff. There is **no automatic true default or item grant**. The previous-chapter developer must record that tool ID or supply the explicit payload; no Chapter3 pickup is claimed in this branch.

Ownership (`hasSling`) and current selection (`weapon: FISTS | SLING`) are separate. Every entry/retry begins with fists. B opens a real bag panel and freezes simulation/time; selecting the carried sling equips it, selecting fists stows it, and B/Escape/close returns to play. Switching cancels charge/held inputs without spending ammo or resetting combat progress. Selection is attempt-local and never writes campaign inventory or money.

Without a sling, entry is ordinary fists-only play: no forced missing-item modal, no compulsory return to Chapter3, no equip-sling slot and no shooting. Fist damage/deadline are unchanged; allowing this attempt does not make fists capable of winning. J remains usable when either weapon is selected.

## Runtime and persistence

`domain/arena.ts` is the pure60Hz simulation, `ArenaSession` owns accumulation/pause/retry, `ArenaView` renders, and `ArenaChapterScene` owns UI/listeners. No Phaser physics solver runs these actors. Long frames process at most eight ticks and discard excess backlog. Shutdown removes listeners; each retry has a fresh ID/generation. Pause cancels charging without firing on resume.

Existing schema2 saves remain readable. Additive fields are `chapter4Completed` and `lastChapter4Result`; resume states add `CHAPTER_4` and `CHAPTER_5_PENDING`. Legacy `CHAPTER_4_PENDING` forwards to the real arena. Completion deduplicates with `arena:<attemptId>`, validates numeric results and records no new currency or inventory. Save failure retains session progress with a retry-save option. Cross-tab conflict pauses and asks for reload. Replaying Chapter3 preserves completed Chapter4 and its handoff.

## Art and sound production boundary

- `public/assets/chapter4/arena_chamber_v1.png`:1672×941 painted stone courtyard, roof opening, vines, lotus relief, amber daylight, flat readable gameplay floor.
- `public/assets/chapter4/arena_apes_v1.png`:1774×887 transparent candidate atlas, brown/silver × idle/windup/strike/recover. Measured individual rectangles and torso/feet anchors; not equal grid cells.
- Byte-identical originals, full generation/edit prompts and registration notes: [art source](../art/source/chapter4/README.md). Dimensions, hashes and review status: [manifest](../public/assets/chapter4/manifest.json).
- Same existing character renderer/atlas, with procedural sling, cords, stones, shadows, strike/aim warnings and exit arrow. Punch/dodge reuse existing poses; dedicated combat animation is unfinished. Apes switch four poses and slide during movement; no finished walk cycle is claimed.
- Enemy hit flash lasts0.18s with foreground impact rays; projectiles have a contrasting outline. Player hit feedback identifies charge interruption. Compact warning/charge panels and speech that hides after3.5 active seconds reduce persistent obstruction; completion instructions remain visible. Pause freezes these lifetimes too. Red enemy health fill is preserved.
- Assets load on arena entry. A readable procedural fallback remains when optional imagery is missing. No new narrated recording, cloned voice, downloaded music or stock media was acquired. Combat-specific sound work remains outstanding.

The AI-generated art is an integrated candidate; final owner approval and release provenance review remain pending. No layered painting master exists. Neither automated checks nor a successful route proves originality, fun, final animation quality or release readiness.
