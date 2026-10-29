# Combined adventure — coding handoff

## Current extension — 2026-10-29

Owner authorized Chapter5 final-boss implementation with the proposed Burmese dialogue inside the game, then explicitly selected **10 gold** for debt repayment. Read [Chapter5 contract](chapter5_spec.md) and [actual checks](chapter5_implementation_report.md). Current endpoint is the real campaign ending after U Gyi's boss fight and a safe physical exit; Chapter5-pending descriptions below are historical. No-gold escape wins;10 gold is debited once for the better ending, never again on replay. Chapter4's starts-with-fists/bag contract carries into Chapter5. No new pickup, shop or currency reward was added.

## Current extension — 2026-10-28

Latest owner correction: Chapter4 starts with fists and requires B/bag selection to equip a carried sling; missing sling permits immediate fists-only play. [Current equipment contract and checks](chapter4_equipment_revision.md) supersede the earlier default-owned entry assumption. Earlier pickup implementation remains another developer's responsibility.

Current Chapter4 tuning includes the owner-requested [combat revision](chapter4_balance_review.md): damage interrupts sling draw, stronger readable attack pressure, usable J shove, clearer hit feedback and compact UI. Read that revision alongside the current spec; the original implementation report retains pre-revision evidence.

Owner authorized Chapter4 action after Chapter3: two ape guards, health bars, slingshot/punch/dodge, renewable stones and a visible deadline. Latest `main` was fetched and fast-forwarded to `1aecccb` first; implementation branch is `codex/chapter-4-ape-arena`. Read [Chapter4 spec](chapter4_spec.md) and [actual checks/limits](chapter4_implementation_report.md). Current flow is bridge → stone machine → scale puzzle → ape fight → honest Chapter5-pending panel. Prior chapter endpoints below are historical. The previous-chapter slingshot pickup is another developer's assumed responsibility; this branch supplies the receiver contract, not that pickup.

## Current extension — 2026-10-27

Owner authorized a separate branch implementing Chapter3 as an item puzzle, with fighting starting in Chapter4. Current branch adds `CHAPTER_3` (scale/treasure puzzle) and ends at honest `CHAPTER_4_PENDING`. Read [Chapter3 spec](chapter3_spec.md) and [actual evidence](chapter3_implementation_report.md) first for this extension. The two-chapter description below is historical baseline, not a command to remove authorized Chapter3 work. Chapter1/2 gameplay rules remain in place; their source caveats and known failures are not silently fixed by this extension.

Current runtime: **Chapter1 bridge puzzle → Chapter2 stone-machine action**. Owner approved this order and replacing unreadable bridge traps with readable danger on2026-10-23. The already-approved cartoon concept is the shared protagonist. See [integration spec/evidence](integration_spec.md) before changes.

The original repo's furnace/scale/vault/reveal scene files remain preserved but are not registered in this two-chapter build. Do not accidentally restore their old scene chain. End after Chapter2 at the honest Chapter3-pending panel.

Read the retained original action contracts under `action-baseline/`: `master_game_system_spec.md`, `chapter_1_revised_spec.md`, then `docs/technical_architecture.md`, `docs/assets_and_character_pipeline.md`, `docs/verification_plan.md`, `docs/source_review_and_decisions.md`. Those files are historical provenance: their “Chapter1” stone-machine refers to **current Chapter2**. Their CH1-only endpoint/order is superseded only by the owner's current integration request, not all of their gameplay rules.

Domain constants/routes/gold rules remain unchanged for action. Preserve escape without currency gates, best-improvement-only replay, full attempt retry, truthful warnings, no possession/magic/shop/debt values. Art never changes hitboxes. One actor has one physics owner.

Shared save is `phoe-htaung.adventure.v2`. Both old keys are preserved, not silently imported or reset. No public publishing or final asset licensing clearance is implied by a GitHub merge. Strict checks cover TypeScript/domain/tool code; retained legacy JS uses allowJs with checkJs=false. Browser and human acceptance must be reported separately from headless tests.
