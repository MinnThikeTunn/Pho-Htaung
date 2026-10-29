# FTUE & Cognitive Onboarding Evaluation: Phoe Htaung: Die Again in the Golden City
**Player Experience Psychology & Usability Audit (Don Norman & James Bach Hybrid)**

---

## 1. Executive Summary & Diagnostic Matrix

The core concept of *Phoe Htaung: Die Again in the Golden City* is brilliant: marrying the handcrafted, atmospheric rust-and-gold visual storytelling of Amanita Design (*Machinarium*) with the comedic slapstick subversions of troll games (*Die Again*, *Cat Mario*, *There Is No Game*) rooted in authentic Upper-Burmese folklore and satire.

However, an evaluation of the current implementation reveals critical **cognitive onboarding traps**, **input mapping conflicts**, and **genre-shift whiplash** that threaten player retention within the first 120 seconds of gameplay.

### Usability & Cognitive Friction Matrix

| Severity | Issue Area | Symptom | Cognitive Root Cause (Norman/Bach) | Churn Risk |
| :--- | :--- | :--- | :--- | :--- |
| **P0 - Critical** | **Key Mapping Inconsistency** | `<kbd>E</kbd>` is Spit in Ch1, Taunt in Ch2, and Unbound in Ch3. | **Violated Conceptual Model**: The primary contextual verb changes meaning entirely across chapters without explicit signifiers. | **Extreme** (Input paralysis & mis-execution) |
| **P0 - Critical** | **Lethal Ambient Hazard in FTUE** | 4.5s ceiling brick drops on the player while they are still reading Ch1 dialogue. | **Gulf of Evaluation Failure**: The player is killed while exploring controls, penalizing discovery before rules are established. | **Extreme** (Instant rage-quit / churn in <15s) |
| **P1 - High** | **Signifier Dissonance** | The mud patch is a safe camouflage hideout; the left crumbling wall is a door. | **False Mental Model**: In 95% of 2D games, bubbling dark mud is toxic sludge. Players flee rather than submerging. | **High** (Hidden solutions feel unfair) |
| **P1 - High** | **Genre Shift Whiplash** | Ch1 (Adventure/Puzzle) $\rightarrow$ Ch2 (Kinetic Swept-AABB Stone Action) $\rightarrow$ Ch3 (Math/Balance). | **Expectation Mismatch**: Transitioning from slow point-and-click to high-speed action without mechanical foreshadowing. | **High** (Bouncing at Chapter 2 entry) |
| **P2 - Medium** | **Hidden Verbs (<kbd>S</kbd> Belly Crawl)** | Crawling mechanics exist in code but are never telegraphed in the UI or level geometry. | **Invisible Affordance**: Players cannot execute what they cannot perceive. | **Moderate** (Over-reliance on external guides) |

---

## 2. Epic 1: First-Time User Experience (FTUE) & Cognitive Onboarding

### 2.1 The "Micro-Tutorial without Tutorials" (Miyamoto / Norman Heuristic)

#### The Problem: Banner Blindness & Cognitive Overload
Currently, control instructions are delivered either via a static bottom banner (`<kbd>A</kbd><kbd>D</kbd> ရွေ့ <kbd>SPACE</kbd> ခုန်...`) or buried in long Burmese typewriter narration. Cognitive psychology research shows that under interactive stress, players develop **banner blindness**—they ignore HUD text bars and immediately press directional keys.

#### The Verb Taxonomy
Phoe Htaung possesses 5 distinct action verbs:
1. **Horizontal Locomotion** (`A` / `D` or Point-and-Click)
2. **Vertical Propulsion** (`Space` / `W` jump)
3. **Low-Profile Stealth** (`S` / `Down` belly-crawl)
4. **Contextual Action** (`E` betel spit in Ch1 / taunt in Ch2)
5. **Inventory / Tool Interaction** (Shoulder bag click / item selection)

#### The Actionable Solution: 3-Stage Environmental Level Geometry (World 1-1 Rule)
Do not show text popups. Design the opening screen geometry to physically demand each verb in a low-stakes, zero-fatality sequence:

```
[Spawn: Ledge] ──(1. Walk Right)──> [Low Archway: Forces Crawl 'S'] ──> [Small 40px Gap: Forces Jump 'Space'] ──> [Safe Cavern]
                                          │                                       │
                                    Signifier:                             Signifier:
                              Low hanging temple stalactite         Fallen stepping stone
                              Phoe Htaung stoops his neck           Golden rim highlight
```

1. **Step 1: Locomotion Initiation (0–3 seconds)**
   - Spawn Phoe Htaung on the far left. The camera framing places open space to the right. Natural reading flow (left-to-right) triggers `<kbd>D</kbd>` instinctively.
2. **Step 2: Natural Crawl Discovery (4–8 seconds)**
   - Place a low ancient archway or broken wooden beam at eye level ($y = 590$). Phoe Htaung's head bumps with a harmless cartoon wooden bonk (*Thunk!*).
   - Phoe Htaung automatically drops into a comical crouch with a small floating thought bubble displaying a downward arrow icon ($\downarrow$).
   - Pressing `<kbd>S</kbd>` allows him to belly-crawl underneath. **The verb is permanently learned with zero text.**
3. **Step 3: Low-Stakes Jump (9–14 seconds)**
   - A tiny 40px crack in the flagstones (not a death chasm). Walking into it merely trips Phoe Htaung, causing a stumble animation. Pressing `<kbd>Space</kbd>` clears it smoothly.
4. **Step 4: Tool / Inventory Introduction**
   - Phoe Htaung's Shan bag (*Lwe-Ait*) sits visually on his shoulder. When a pickup (e.g. `bamboo_pole` or `rusty_cog`) is clicked, it does not magically vanish into a digital HUD; Phoe Htaung physically grabs it, turns, and unzips his bag with a rich fabric rustle (*Schrrrrt!*). The inventory tray briefly bounces open to demonstrate storage.

---

### 2.2 Resolving the <kbd>E</kbd> Key Identity Crisis

#### The Cognitive Flaw
- **Chapter 1**: `<kbd>E</kbd>` is betel spitting (lubricates winch).
- **Chapter 2**: `<kbd>E</kbd>` is machine taunting (provokes stone drop).
- **Chapter 3**: `<kbd>E</kbd>` is completely dead/unbound.

When a button changes identity arbitrarily between levels, it creates severe **negative transfer**. In Chapter 2, a player in danger may hit `<kbd>E</kbd>` expecting to spit betel juice to disable a gear, only to taunt the machine into crushing them.

#### The Unified Mental Model: "<kbd>E</kbd> is Phoe Htaung's Slapstick Mouth"
Unify `<kbd>E</kbd>` under a single overarching concept: **The Agonistic Mouth Verb (Chew / Spit / Taunt)**.
- **In Neutral Stance**: Phoe Htaung spits betel juice (`sfx_spit_wet`).
- **Targeting Machinery (Ch1 Winch / Ch3 Gears)**: Spitting red betel juice acts as crude red lubricant ("ဆေးမြီးတို").
- **Facing Enemies / Automated Traps (Ch2 Machine)**: Phoe Htaung blows a raspberry and yells Upper-Burmese slang (*"ဟေ့ကောင်! လာစမ်းပါ!"*), provoking the machine to track his location.
- **In Chapter 3**: Pressing `<kbd>E</kbd>` spits at the blind statue or pans with an audible comedic *ping!* (giving feedback that it hit, but doesn't balance the weight), rather than remaining dead input!

---

### 2.3 Affordances & Signifiers in the Opening Screen

#### The Mud Patch Signifier Trap
- **Current Observation**: In `BridgeChapterScene.js`, a mud patch sits at $x=150$. If bees chase Phoe Htaung, lying in the mud hides him and scatters the bees.
- **Cognitive Reality (Don Norman)**: To 99% of players, dark bubbling terrain with sound effects means **hazard/quicksand**. Players avoid it at all costs, run right, and get stung to death.
- **Correction**: Diegetic Signifiers!
  - Add a friendly temple stray dog or a pig wallowing happily in the mud patch in the background. Seeing another living creature cool off safely in the mud immediately communicates: *"Mud is a safe shelter, not toxic acid."*
  - When bees spawn, show a comic thought bubble above Phoe Htaung: a picture of Phoe Htaung covered in mud with a smiling face and crossed-out bees.

#### The Left Wall Secret Tunnel Trap
- **Current Observation**: Pushing against the extreme left wall ($x \le 35$) for 1.0 second opens a secret passage to bypass the pit.
- **Cognitive Reality**: In modern platformers, running into a boundary wall is an invisible collision box. Without a signifier, this is "moon logic."
- **Correction**:
  - Distressed masonry: The left wall must feature visible cracked mortar, faint shafts of cool green sewer air blowing through, and small dust motes drifting inward.
  - Subtitle signifier on first wall collision: U Gyi mutters: *"နံရံက အက်နေပါလား... မင်းလို ခေါင်းမာတဲ့ကောင် ဝင်တိုက်ရင်တောင် ပြိုကျမယ့်ပုံပဲ!"* ("That wall is cracked... even a stubborn skull like yours could break it down!").

---

### 2.4 Emotional Resilience: Churn Prevention & Slapstick Pacing

#### The 4.5-Second Falling Brick Hazard Trap
- **Forensic Diagnosis**: In `BridgeChapterScene.js`, `nextBrickTimer = 4.5s`. If a player stops to read U Gyi’s opening narration or inspect their inventory, a ceiling brick falls. If it hits, it causes **instant death** (`deathCount++`).
- **UX Violation (James Bach Heuristic)**: **Punishing the user for cognitive processing**. A player who takes 5 seconds to orient themselves in a new game must never be killed by an environmental timer.
- **The "First Hit is Comedy" Rule**:
  - The first time a falling brick hits Phoe Htaung in a session, **it must not kill him**.
  - Instead, play an accordion squash tween (`scaleY: 0.4`, `scaleX: 1.6`), dizzy cartoon stars (`💫`), and have U Gyi shout:
    > *"ဟိတ်ကောင်! ခေါင်းပေါ် ကြည့်ပါဦး! ကျောက်တုံးတွေ မခိုင်ဘူးဟေ့... နောက်တစ်ခါ ထပ်ကျရင်တော့ ခေါင်းကွဲပြီသာမှတ်!"*
  - The player's longyi knot unties comically and he pulls it back up.
  - **Result**: The player learns the hazard, laughs at the slapstick animation, and is primed to dodge future falling bricks without experiencing early death churn.

#### Instant Respawn Ergonomics
- When a death does occur, the cycle time to respawn must be strictly **$\le 1.2$ seconds**.
- Never lock the player into an unskippable 4-second dialogue sequence after repeated deaths.
- The `<kbd>R</kbd>` key reset must feel crisp, instantaneous, and preserve the emotional desire to "get back in and beat it."

---

## 3. Epic 2: Retention, Engagement & Comedy-Troll Psychology

### 3.1 The Frustration vs. Amusement Threshold (Troll Game Psychology)

Troll games walk a razor's edge between two emotional states:

```
[ Unfair Death ] ───> If Player Blames Game (Arbitrary / Invisible) ───> RAGE & CHURN
               └───> If Player Blames Themselves + Laughs ────────────> DELIGHT & RETENTION
```

#### Benchmarks Comparison
- **Cat Mario / I Wanna Be The Guy**: Punishes muscle memory via invisible blocks, but respawn takes 100 milliseconds and traps are slapstick gags designed for streaming reactions.
- **There Is No Game**: Uses narrator friction as the core comedic engine. The narrator forbids the player from touching things, which directly invites the player to touch them.
- **Phoe Htaung's Ideal Formula**: **The Narrator as an Ironic Anti-Guide**.
  - When U Gyi says: *"ဟောဒီမှာ ရွှေဒင်္ဂါးပြားကြီး... သွားကောက်လိုက်စမ်း!"* (There's a gold coin... go pick it up!), the seasoned player knows it's bait.
  - When the coin gets yanked up on a fishing line (*"မင်းကို ငါးမျှားသလို မျှားတာလေ ကလေးလေးရ!"*), it creates **amusement**, not frustration, because the player was baited by their own greed.

---

### 3.2 "Aha!" Moment Pacing: Balancing Wit vs. Moon Logic

A puzzle is satisfying when the solution feels **inevitable in retrospect**.

```
[ Perception of Problem ] ──> [ Slapstick Experimentation ] ──> [ The "Aha!" Insight ] ──> [ Empowerment ]
```

#### Evaluation Across the Three Chapters

| Room / Chapter | Current Puzzle Arc | Norman/Bach Fairness Assessment | Recommended Enhancement |
| :--- | :--- | :--- | :--- |
| **Ch 1: The Bridge** | Fit cog + bamboo pole to winch $\rightarrow$ winch jams $\rightarrow$ spit betel juice (or use beeswax) $\rightarrow$ lower drawbridge. | **9/10**: Highly fair. The jammed winch has gears that visibly spark. Betel nut is established as sticky/fluid in character idle animation. | Make the jammed cog emit red squeak particles so players associate mouth/fluid with lubrication. |
| **Ch 2: Stone Machine** | Bait stone drops to smash gate, weigh pressure plate, or stack stones as steps to reach exit. | **8/10**: Excellent physical sandbox. Kinetic swept AABB collision creates genuine systemic problem-solving. | Ensure stone drop shadows are 100% truthful to AABB widths to prevent collision disputes. |
| **Ch 3: The Scale** | 10-viss balance $\rightarrow$ Gate opens $\rightarrow$ Brace with iron pin $\rightarrow$ Retrieve 7-viss gold relic $\rightarrow$ Escape. | **9.5/10**: Superb Machinarium-grade skeuomorphic puzzle. Multiple valid routes (weights, brace, or speed escape). | Give the iron pin slot a clear golden latch symbol on the stone pillar so its purpose is immediately signposted. |

---

### 3.3 Bridging the Chapter Transitions: Solving Genre Whiplash

The most critical architectural UX risk in the current three-chapter runtime is **genre whiplash**:
- **Chapter 1**: Atmospheric Point-and-Click / Troll Adventure (Inventory, exploration, dialogue).
- **Chapter 2**: High-Stakes Kinetic Action Domain (Dodging 96px boulders, swept AABB physics, timed taunts).
- **Chapter 3**: Analytical Logic & Weight Math (Pans, bracing, item swaps).

#### Why Players Bounce at Chapter 2
If a player enters Chapter 2 expecting another casual point-and-click environment, they are instantly overwhelmed when an automated machine targets their coordinates and begins dropping boulders!

#### The 3-Step Psychological Transition Bridge
1. **Thematic Mechanical Seeding in Chapter 1**:
   - In Chapter 1, introduce a small, non-lethal rolling stone or dropping counterweight during the drawbridge lowering animation. This primes the player's brain: *"Ancient machinery in this city drops heavy stone."*
2. **Diegetic Entrance Staging in Chapter 2 (`BRIDGE_EXIT_LINK`)**:
   - Do not drop the player directly into an active attack state.
   - The scene opens with Phoe Htaung stepping into the cavern. The stone machine above is **dormant / sleeping**.
   - U Gyi delivers a 2-second comedic warning:
     > *"ဟော... ရှေးခေတ် ကျောက်တုံးချစက်ကြီးတဲ့ဗျာ။ မင်း အသံကြားတာနဲ့ အပေါ်ကနေ ကျောက်တုံးတွေ တဒုန်းဒုန်း ပစ်ချတော့မှာ။ သတိထားလျှောက်!"*
   - The machine only activates **after the player's first voluntary movement key press** (`status === 'WAITING'`). This guarantees the player has full cognitive control over when the action starts.
3. **Decompression Breather into Chapter 3 (`CH2_EXIT_LINK`)**:
   - After surviving Chapter 2's adrenaline rush, allow Phoe Htaung to slide down a dusty chute into the serene, sun-dappled ancient balance chamber of Chapter 3.
   - Dynamic audio cue: Instant hard-cut of stone machinery noise $\rightarrow$ warm acousticSaung-gauk harp and tranquil cave water drips. The nervous system relaxes; the cognitive state shifts naturally from fight-or-flight to analytical contemplation.

---

## 4. Actionable UX Implementation Backlog

### Phase 1: High-Priority Ergonomics & FTUE Safety (Immediate)
- [ ] **Decouple Initial Hazard Timer**: Ensure `nextBrickTimer` in Chapter 1 does not begin counting down until the player has made their first interaction or walked $\ge 150\text{px}$.
- [ ] **First Death Slapstick Grace**: Replace the first fatal falling brick collision with a non-lethal accordion squash and comedic audio blip.
- [ ] **Unify the <kbd>E</kbd> Key Mapping**: Wire `<kbd>E</kbd>` in Chapter 3 to play an idle spit animation against props rather than being completely unresponsive.
- [ ] **Mud Patch Diegetic Signifier**: Add visual context (e.g., a muddy turtle or wallowing animal silhouette) to signal that mud is a shelter from flying hazards.

### Phase 2: Signifier & Affordance Refinements
- [ ] **Left Wall Secret Distress**: Render procedural cracks and outward-drifting dust motes along the left screen boundary ($x \le 35$).
- [ ] **Hotspot Specular Glint**: Add a 4-second looping glint particle to the `rusty_cog` and `bamboo_pole` to eliminate pixel-hunting.
- [ ] **Inventory Open Juice**: Add a tactile fabric rustle and slight bounce when items are placed into or selected from the Shan shoulder bag.

### Phase 3: Transition & Narrative Polish
- [ ] **Pacing Buffer on Chapter 2 Entry**: Reinforce the `WAITING` state indicator with a clear visual signifier: *"ရွေ့လိုက်တာနဲ့ စမယ် / Move to Start"*.
- [ ] **Audio Stem Cross-Fading**: Ensure the dynamic vertical stem audio smoothly cross-fades the Kalimba melody into ambient drones during scene transitions, avoiding sudden audio pops.

---
*Evaluation conducted by Player Experience Psychology & QA Edge-Case Assessment.*
