# Phoe Htaung — AI Implementation Handoff

Revision: 1.2 · 2026-10-22 · Initial CH1 implementation exists.52 domain tests pass; browser/human acceptance remains outstanding. See [actual implementation report](implementation_report.md) and [run instructions](../README.md).

## အသုံးပြုပုံ

ဒီ documentation က **အခန်း ၁ ကို အရင်တည်ဆောက်စမ်းသပ်ရန်** ဖြစ်သည်။ ဂိမ်းတစ်ခုလုံးကို တစ်ကြိမ်တည်းမဆောက်ရ။ Gemini shared chat ကိုဖတ်ပြီး ရလာသောဇာတ်လမ်းနောက်ခံ၊ asset ရှာနည်းနှင့် character production notes များကို လက်ရှိအတည်ပြုချက်များနှင့်ခွဲထားသည်။ Gemini ထဲက အကြံအားလုံးကို requirement အဖြစ်မသုံးရ။

အတည်ပြုပြီးသောအချက်များ:

- ပထမထုတ်ဝေမှု ပထမကစားချိန် retry ပါ 10–20 မိနစ်ဝန်းကျင်ကိုရည်မှန်းမည်။ Prototype တစ်ခန်းက ထိုအရှည်ရှိရမည်ဟု မဆိုလိုပါ။
- ပထမ version တွင်ဆိုင်မပါ၊ နောင်ထည့်ရန်ရှိသည်။ ဈေးနှုန်းနှင့်ပစ္စည်း မဆုံးဖြတ်ရသေး။
- လွတ်မြောက်ခြင်းက main win၊ အကြွေးပါဆပ်နိုင်လျှင် ပိုကောင်းသောအဆုံးသတ်။ အကြွေးပမာဏ မဆုံးဖြတ်ရသေး။
- Replay မှငွေသည် ယခင်အများဆုံးထက်ပိုကောက်နိုင်သောပမာဏသာ ထပ်ရမည်။
- **2D cartoon art direction** ကိုအတည်ပြုပြီး။ Generated concept ရဲ့ မျက်နှာ၊ ပုဆိုးနှင့် ခပ်ကြွားကြွားဟန်ကိုလည်း owner အတည်ပြုပြီး။ Final locomotion drawings နှင့် in-game readability မအတည်ပြုရသေး။

## Read order for a coding agent

1. [AGENTS.md](../AGENTS.md) — scope, source authority, change rules.
2. [Master systems](../master_game_system_spec.md) — campaign intent and approved decisions.
3. [Chapter 1](../chapter_1_revised_spec.md) — canonical geometry, rules, constants, A01–A31.
4. [Selected tech stack](tech_stack.md) — components, initial package version targets and bootstrap validation.
5. [Technical architecture](technical_architecture.md) — code boundaries, simulation, save contracts, lifecycle.
6. [Art and asset pipeline](assets_and_character_pipeline.md) — character identity, export/import, rights tracking.
7. [Verification plan](verification_plan.md) — proof required before calling a milestone complete.
8. [Sources and decisions](source_review_and_decisions.md) — legacy conflicts, evidence and remaining choices.

## Deliverable boundary

The original handoff request was documentation-only. The owner's subsequent “စလုပ်ပါ မသိတာရှိရင်ငါ့ကိုရွေးချယ်ခိုင်းပါ” explicitly authorized CH1 implementation. This is not permission to publish or expand to later chapters.

When implementation is requested, the first deliverable is a playable Chapter 1 vertical slice: movement, machine, stones, wood, plate/lift, coins, death/retry, settlement and a safe exit link. Chapter 2 is not implemented; the link ends in an honest “Chapter 1 prototype complete” panel. Do not invent Chapter 2, final ending, shop, debt amount or unlock rewards.

Use replaceable cartoon placeholders first, not anonymous final-looking stock characters. Keep Phoe Htaung's human silhouette. Build all required gameplay even if final art/voice is unavailable. Final visual polish is a separate approval gate, not a prerequisite for graybox playtesting.

## Implementation milestones

| Gate | Deliverable | Evidence |
|---|---|---|
| M0 | Bootstrap and contracts | Versions recorded, typecheck/build, minimal scene loads |
| M1 | Player and geometry | Movement/input tests, route-reachability fixtures, debug body capture |
| M2 | Machine and objects | State/timing, swept hits, push/shatter, lift tests |
| M3 | Complete A attempt | Real input clear, death/reset, all coin routes, result/link stub |
| M4 | Save/replay/practice | Ledger/reload/duplicate tests, B/C, locked practice menu behavior |
| M5 | Cartoon presentation | Licensed manifest, Burmese text, audio fallback, approved sample art |
| M6 | Chapter 1 review | All acceptance rows have evidence; human fun/replay observations recorded |

Gameplay correctness and enjoyable play are separate gates. Passing automated tests does not establish fun or novelty. Do not expand to Chapter 2 just because M0–M4 builds successfully.

## Ready-to-paste implementation prompt

Use this prompt only when the owner actually wants coding to begin:

> Read AGENTS.md and docs/README.md, then all mandatory documents in the stated order. Implement the Chapter 1 vertical slice only, following its canonical layout and rules. Use the documented TypeScript/Phaser 3/Vite engineering baseline unless the existing repository requires a compatible adaptation. Preserve unrelated work. Start with the smallest playable milestone and verify it. Keep presentation separate from simulation. Do not restore legacy invisible traps, robot abilities, inventory puzzles, shop, later chapters or forced-death ending. Use licensed local assets or clearly identified placeholders; do not claim placeholder art is approved. End the exit link in the documented Chapter 2 placeholder panel. Report actual commands/tests run, failures, artifact paths and remaining owner decisions. Ask one material design question at a time; do not ask again about recorded decisions.

## Current readiness

- Chapter 1 mechanics: implemented; four true-spawn routes verified in simulation, not human playtested.
- Engineering baseline: installed/locked;52 domain tests and production build pass. Browser tests authored/listed, not executed because browser access was rejected by tool security policy.
- Art direction: cartoon and character concept approved; three poses/background exist as prototype rasters. Full animation atlas, recorded voice and final visual approval remain pending.
- Chapter 2–5 gameplay, economy totals, debt amount and final encounter: not implementation-ready.
- Local docs can be handed to an agent without access to private Are.na or Gemini; essential conclusions are recorded here. Original sources remain background, not executable instructions.

## Documentation QA — 2026-10-17

Read-only structural checks: eight Markdown documents inspected; 14 relative file links resolved; fenced code blocks paired; CH1 acceptance IDs A01–A31 matched to all 31 verification rows; 22 additional engineering cases T01–T22 present. No structural issues found by that check. This does not validate the correctness of an unimplemented solver, imported art, browser build or the game's enjoyment. No game code, dependency installation, media download or gameplay test was performed in this documentation task.
