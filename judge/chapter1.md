# 🎮 Phoe Htaung Gamer Review Scorecard: Chapter 1 (ပုဂံတံတားယန္တရား)

**Date:** 2026-10-29  
**Target Scene:** `BridgeChapterScene.js` (registered as `Chapter1Scene`)  
**Playtest Suite:** `tests/e2e/gamer-playtest.spec.ts` (Playwright Headless Suite)  
**Overall Verdict:** 9.1 / 10 (Exceptional Mechanics, Multiple Route Affordances & Authentic Burmese Cartoon Humor)

---

## 1. Specialist Archetype Breakdown

### 🏃 Kaung (Speedrunner & Precision Platformer) — **Score: 9.2 / 10**
> *"The coyote time and jump buffering make Phoe feel tight and responsive. But the real high point is the bamboo pole-vault skip: discovering that you can grab the pole, sprint to the pit edge, and vault clean over the chasm without ever touching the winch or prying the cog is absolute speedrunning gold."*

- **Coyote Time (80ms) & Jump Buffer (100ms):** Verified in code and runtime. Jumping on edge takeoff feels forgiving and fluid without feeling floaty.
- **Instant Action Canceling:** Locomotion or jump input instantly cancels pathfinding navigation and pending interactions.
- **Quick Reset Ergonomics:** Holding <kbd>R</kbd> for 500ms cleanly resets the scene in under 0.6s without memory leaks.
- **Speedrun Bypass Route:** Sprinting towards the pit ledge ($x \ge 658$) with `bamboo_pole` in hand and jumping triggers `triggerBambooPoleVault()`—a parabolic 700ms arc landing safely at $x = 813$, bypassing the entire winch/cog puzzle sequence.

---

### 🎒 Nandar (Casual Player & Cultural Lore Enthusiast) — **Score: 8.7 / 10**
> *"U Gyi's voice lines make the game feel like a live Burmese cartoon! The slapstick cushion is brilliant—getting hit by the first falling brick just flattens Phoe with cartoon dizzy stars instead of killing you. Spitting betel juice to lubricate the jammed rusty gear is pure genius Burmese comedy."*

- **First-Time User Experience (FTUE):** The opening 30 seconds immediately afford natural movement. The floating platform and wedged boulder invite spatial curiosity.
- **Slapstick Cushion:** The first falling hazard is non-lethal, squashing Phoe to 40% height with dizzy stars `💫` and U Gyi's comedic scolding. Only repeated hits become fatal.
- **Cultural Verbs:** The <kbd>E</kbd> mouth verb allows Phoe to spit red betel juice onto the rusty winch to unjam it, perfectly localized with authentic sound effects (`playWoosh` + `playPickup`).
- **Shan Traditional Bag (*Lwe-Ait*):** Permanently docked at $(640, 672)$, opening smoothly on click with woven diamond chevron weave and 8 fringe tassels.

---

### 🕵️ QA Glitch Hunter (Adversarial Stress Tester) — **Score: 9.5 / 10**
> *"Solid state isolation and zero game-breaking physics glitches. The 'Die Again' invisible sky block catches impatient players trying to blindly jump the pit, and pushing against the left wall for 1.0s opens the secret 'အောက်လမ်း' tunnel to Chapter 2."*

- **Invisible Sky Block (Die Again):** Positioned at $(848, 441)$ with a dedicated collider, bonking Phoe's head and precipitating a pit fall with custom death dialogue.
- **Secret Troll ("အောက်လမ်း") Route:** Holding <kbd>A</kbd> against the far-left wall for 1.0s opens the hidden subterranean tunnel with stone sliding audio, completing Chapter 1 immediately.
- **Canonical Puzzle Route:** Full multi-step sequence verified: sever rope $\rightarrow$ pry cog $\rightarrow$ pick up cog $\rightarrow$ install cog in winch $\rightarrow$ spit betel juice to lubricate $\rightarrow$ install lever $\rightarrow$ drawbridge lowers with gravity bounce and impact dust.

---

## 2. Gameplay Breakdown Matrix

| Dimension | Score | Verdict |
| :--- | :---: | :--- |
| **Mechanics & Physics** | **9.3 / 10** | Unified baseline `groundY = 576px`. Tight jump physics with 80ms coyote and 100ms jump buffer. |
| **Multi-Route Level Flow** | **9.5 / 10** | Three distinct routes: Canonical Puzzle, Athletic Pole-Vault Skip, and Troll Low-Road. |
| **Diegetic Feedback & Clues** | **9.4 / 10** | Strictly zero world-space stickers/banners; U Gyi delivers all clues via top-center dialogue. |
| **Cultural Authenticity** | **9.7 / 10** | Shan *Lwe-Ait* bag, betel nut spitting verb, ancient Pagan architectural palette. |
| **Micro-UX & Affordances** | **8.2 / 10** | Great visual vector inking, but minor inventory interaction friction remains (detailed below). |

---

## 3. Actionable UX & Refinement Recommendations

### 1. Smart-Use Auto-Equip for Tied Bamboo Pole
- **Current Friction:** When a player clicks the tied bamboo pole bare-handed on the floating platform, U Gyi gives the hint `"ဝါးလုံးကို လျှော်ကြိုးနဲ့ တုပ်ထားတယ်။ တစ်ခုခုနဲ့ ဖြတ်ရမယ်။"`, requiring the player to open the bag, select `betel_cutter`, and click again.
- **Refinement:** In `BridgeChapterScene.js` -> `handleTiedPoleInteraction()`, if `gameState.hasItem('betel_cutter')` is true, auto-select it and slice the rope immediately on click.
```javascript
// Suggested enhancement in BridgeChapterScene.js -> handleTiedPoleInteraction()
if (selected === 'betel_cutter' || gameState.hasItem('betel_cutter')) {
  if (selected !== 'betel_cutter') {
    this.inventoryBar?.setSelected('betel_cutter');
  }
  // Proceed with cutting animation...
}
```

### 2. Diegetic Range Indicator for the Winch Betel Spit Verb
- **Current Friction:** Pressing <kbd>E</kbd> spits betel juice in place. If the player is $> 85\text{px}$ away from the winch, the spit misses and does not lubricate the gear, but there is no feedback explaining why.
- **Refinement:** When the player is within spitting proximity ($|x - x_{winch}| \le 85\text{px}$) and the winch is jammed, add a subtle golden or specular gear glint on `this.winchCogSlot` to diegetically signal that the winch is in spit range without adding floating text labels.

### 3. Hairline Fissure Tell for the Greedy Coin Trap
- **Current Friction:** The golden coin bait at $x = 1075$ has a seductive gold aura, but the collapsible floor slab has zero visual differentiation from solid stone, making the collapse an untelegraphed instant death.
- **Refinement:** In `drawBridgeTerrain()`, render subtle hairline vector fissure cracks along the stone segment from $x = 1030$ to $1120$. Attentive speedrunners can spot the fracture and jump over the trap on their first blind run.

### 4. Spikier Visual Impact on the Invisible "Die Again" Block
- **Current Polish:** When Phoe bonks the invisible sky block at $(848, 441)$, Phoe immediately drops into the pit.
- **Refinement:** Flash a brief 180ms chalk outline and dust puff (`MicroInteractions.spawnFootstepDust`) at the collision point so the comedy of the troll block hits with maximum slapstick impact before the descent.

---

## 4. Test Suite Verification
- **E2E Playtest Suite:** `tests/e2e/gamer-playtest.spec.ts` (7/7 tests passing).
- **Unit & Integration Suite:** 117 tests across 6 suites passing in 2.06s (`vitest run`).
- **Telemetry Health:** `window.__PHOE_TEST__.snapshot().bridge` verified across player coordinates, velocities, puzzle flags, and trap states.
