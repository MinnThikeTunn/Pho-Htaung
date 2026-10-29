# Chapter5 — final boss and campaign ending

Current implementation contract, 2026-10-29. Owner requested implementation of the detailed U Gyi fighting proposal, including its spoken lines as **in-game story text**. Owner separately approved **10 gold** to repay debt. This chapter supersedes the Chapter5-pending endpoint; historical Chapter1-only/two-chapter milestones do not limit this authorized extension.

## Flow and story

Chapter4 result → Chapter5 treasure hall → eight manually advanced opening lines → boss fight → four surrender lines → safe physical exit → outdoor dialogue → persistent campaign result. Continue after completion opens the result. Chapter5 replay is available after Chapter4 completion; old `CHAPTER_5_PENDING` saves enter the real chapter.

U Gyi is a human opponent carrying a gold-painted scrap shield and wooden staff. The hall is part of the real ancient city. Paint peels from the **cart's stones**; previously collected gold and the Chapter3 relic remain real. No possession, magic, active taunt, false warning, mandatory death or currency-gated escape.

Literal Burmese script and local constants live in `src/content/chapter5.ts`: `FINAL_INTRO`, `FINAL_DEFEAT`, `FINAL_PHASE_LINE`, `FINAL_OUTRO`, `FINAL_ESCAPE`, `FINAL_DEBT_FREE`. Intro/surrender/outro freeze gameplay and advance only by Next/Skip. A journal records lines actually reached. The phase2 apology is a short caption while combat continues; it neither heals nor grants invulnerability. Retry skips an intro already seen in that attempt session; a fresh chapter replay offers it again. Dialogue is text, without synthesized/recorded narration.

## Controls and equipment

Shared A/D or arrows move; Space jumps; J punches; K holds/releases sling draw; L dodges; B opens the bag; hold R for0.5s retries; Escape pauses. Bag selection is required even if a sling is owned: entry/retry starts with **fists**. No carried sling means fists-only, with an honest empty-bag message. Ownership uses the existing prior-chapter receiver contract; this work does not add that developer's pickup. No new combat skill buttons.

Player36×56,220px/s, shared gravity/jump/coyote/buffer, fixed60Hz AABB simulation. Rendering never owns movement/collision. Player100HP, boss180HP; boss bar is **red**. Unlike Chapter4, this fight has no failure deadline. Combat time is recorded separately from story and safe-exit time. Fists can kill this boss: J10 damage with0.75s cooldown. Chapter4 remains unchanged.

K has0.55s full draw,0.12s minimum,0.48s cooldown, charge-scaled damage up to30. Twelve stones; either floor-edge pile refills after0.8s standing still. No money cost. Damage interrupts draw and staggers for0.3s. Dodge0.22s, first0.15s invulnerable,0.85s cooldown. These values, including bounds/timings below, are authoritative in `F5`, not duplicated in view code.

## Boss and cart

- Guard tracks the player's side. Frontal guard blocks J/K with visible feedback; rear hits and recovery windows work. Guard is not global invulnerability.
- Close range:0.8s warning locks player x; a96×210px rectangle shows the actual staff-slam area. Move sideways/dodge; jumping inside the marked column remains dangerous. Slam24 damage,1.3s recovery.
- Far range:0.9s warning locks rush direction/destination;410px/s shield rush,20 damage. Jump/dodge or put the physical cart between you. Rush hitting the cart causes2s stun, without automatic boss damage.
- At90HP or less, phase2 starts once. Every third eligible selection can approach the stationary cart physically, then warn0.9s and push it. Push direction locks toward the cart. Exposed preparation can be interrupted by J/K. No remote cart teleport or instant retarget.
- Cart112×64, initially x570, bounded220–1060. A/D side contact pushes a resting cart90px/s; jump onto it to cross/stand on it. It cannot be pushed through the live boss. Projectiles collide with the cart before a boss behind it, including the player's own shots.
- Boss-pushed cart starts300px/s, friction180px/s². Side collision over80px/s deals24 once per roll, respects dodge, and physically pushes the player. A rider moves with the cart without this side hit. It stops at a boundary or by friction and remains usable.

Boss0HP cancels projectiles/cart motion and opens surrender dialogue; exit unlocks only after it. No attacks during the safe exit. Actual completion requires a living grounded player at x≥1220 on the floor, with boss0HP. Invalid/duplicate completions cannot settle. Retry restores boss/player/cart/ammo/weapon/timers with a new attempt ID; it does not reset campaign money.

## Economy and save

Escape remains the main win at any gold amount. At the **physical exit**, a wallet of at least10 gold pays exactly10 once, tracked by durable `debtRepaidGold`; the result is `DEBT_FREE`. Less than10 yields `ESCAPED` without a partial debit. A15-gold wallet leaves5. No Chapter5 coin reward, relic conversion, shop or extra currency was invented.

Completed attempts use `final:<attemptId>` receipts. Replaying after repayment never charges again and retains the better ending even with fewer than10 remaining. A previous poor ending can improve when a later valid final exit has enough gold. Chapter4 replay preserves completed-campaign progress. New optional schema2 fields preserve old saves; corrupt saves and other-tab conflicts follow the existing non-destructive policy. Failed writes keep completion in memory and visibly offer a save retry.

## Assets and boundaries

`src/content/chapter5Art.ts` registers the original generated hall, eight U Gyi poses, cart and outdoor still under `public/assets/chapter5/`. Layered painting masters and finished animation are not claimed. Runtime copies and originals match; prompts, hashes, generation/edit history and remaining alpha fringes are recorded in `art/source/chapter5/README.md` and the asset manifest. Generated candidates use the built-in image tool; owner visual approval and release review remain pending. Existing Phoe Htaung character stays shared.

`FinalSession` owns fixed-step/input/story lifecycle. `finalBoss.ts` owns pure rules/settlement. `FinalView` only renders. `FinalChapterScene` owns DOM, actual equipment selection, script presentation and disposable listeners; `CampaignEndingScene` owns the result. Optional missing images have readable visual fallbacks. Procedural existing audio cues are reused, without voice imitation or downloaded media.

See `chapter5_implementation_report.md` for actual evidence and limits. Automated expert routes prove reachability, not first-player difficulty, enjoyment or originality. Earlier chapters were not all manually replayed as one uninterrupted campaign in this task.
