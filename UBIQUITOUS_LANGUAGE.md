# Ubiquitous Language

Domain glossary for **Phoe Htaung (ဖိုးထောင်)**: A 2D Point-and-Click / Troll Puzzle-Platformer game set in the subterranean ruins of ancient Bagan, Myanmar.

---

## Game Structure

| Term | Definition | Aliases to avoid |
| ---- | ----------- | ----------------- |
| **Phoe Htaung** | The wiry, eccentric Burmese village boy protagonist, evading loan sharks through ancient mechanical vaults | Main character, player character, hero |
| **U Gyi** | The cynical, cheroot-smoking Upper-Myanmar satirical narrator who delivers comedic roasts via overhead speech balloons | Narrator, voiceover artist, guide |
| **Chapter** | A single-screen puzzle room with multiple winning conditions and troll traps | Level, room, stage, scene |
| **Troll Trap** | A telegraphed physical setup that ruthlessly subverts conventional video game tropes, delivering slapstick death with comedic punchlines | Trap, death trap, hazard |
| **Sucker Trap** | The obvious, conventional path that punishes greedy or careless players with instant slapstick death | Obvious trap, bait trap, greed trap |
| **Troll Solution** | An unorthodox, lateral-thinking approach that bypasses expected game logic to achieve victory | Secret route, alternate solution, trick |

## Winning Conditions

| Term | Definition | Aliases to avoid |
| ---- | ----------- | ----------------- |
| **Winning Condition** | A distinct, validated path to clear a Chapter, each with unique mechanics and earned badges | Win route, victory path, solution |
| **Canonical Route** | The primary thematic puzzle sequence utilizing tool chaining, crafting, and mechanical assembly (The Engineer's Way) | Main route, intended solution, primary path |
| **Athletic Route** | High-skill platforming, physics exploitation, or momentum conservation that skips major puzzle steps (The Athlete's Way) | Speedrun route, bypass route, skill route |
| **Secret Route** | Lateral thinking, environmental sabotage, or hidden passages subverting expected logic (The Trickster's Way / "အောက်လမ်း") | Hidden route, alternate path, cheat |
| **Heist Route** | Outsmarting greed traps to escape with optional legendary treasures for maximum settlement value (The Thief's Way / Master Thief) | Collector route, treasure route, thief path |
| **Pawnshop Settlement Receipt** | An authentic weathered receipt rendered upon Chapter completion, displaying deaths, brain cells used, relics stolen, and resale value for viral sharing | Settlement screen, victory screen, score summary |

## Tool & Inventory System

| Term | Definition | Aliases to avoid |
| ---- | ----------- | ----------------- |
| **Lwe-Ait** | The permanent bottom-docked Myanmar Traditional Shan shoulder bag, a hand-woven crimson textile with geometric cream/gold diamond chevron bands | Inventory bag, shoulder bag, bag, satchel |
| **Diegetic Grab** | The 3-phase standardized grab interaction: Crouch & Reach → Open Shoulder Bag & Parabolic Arc → Proud Bounce & Bag Spring | Pickup interaction, item collection, grab |
| **Universal Mouth Verb** | The <kbd>E</kbd> key context-sensitive action: spits betel juice, lubricates gears, taunts machines, or applies held tools | E key, interact key, action button |
| **Held Item** | A visually carried tool in Phoe Htaung's hand sprite, anchored at (centerX + facing * 20, 524px) with scale 0.38 | Equipped item, active item, selected tool |
| **In-Bag Crafting** | Combining complementary tools directly within the Lwe-Ait via drag-and-drop or slot selection | Crafting, item combination, recipe |
| **Tool Chaining** | The organic, physical sequence of applying tools to solve puzzles: Snip → Pry → Assemble → Lubricate | Puzzle sequence, item progression, mechanic chain |

## Items & Tools

| Term | Definition | Aliases to avoid |
| ---- | ----------- | ----------------- |
| **Betel Cutter** | Phoe Htaung's heirloom starting tool (ကွမ်းသီးညှပ်), used for snipping ropes and crafting | Scissors, cutter, shears |
| **Bamboo Pole** | A versatile tool (ဝါးလုံးတုတ်) used for prying, vaulting, and assembling mechanisms | Pole, stick, bamboo stick |
| **Rusty Cog** | A heavy bronze gear (ဂီယာခွေဟောင်း) found wedged under boulders, essential for winch mechanisms | Cog, gear, bronze cog |
| **Torn Bottle** | A damaged plastic container (ရေဗူးစုတ်) that can be crafted into a Half Bottle | Bottle, broken bottle |
| **Half Bottle** | Crafted from Betel Cutter + Torn Bottle, used as a protective nozzle cowl (ရေဗူးခြမ်း) | Bottle half, cowl |
| **Dried Chili** | A fiery Burmese chili (ငရုတ်သီး) that causes explosive sneezing when inserted into keyholes | Chili, pepper |
| **Beeswax** | Harvested from beehives, used as an alternative lubricant to betel spit | Wax |
| **Betel Spit** | Red betel nut juice (စွပ်) expelled via Universal Mouth Verb, the primary emergency lubricant | Spit, saliva |

## Game Mechanics

| Term | Definition | Aliases to avoid |
| ---- | ----------- | ----------------- |
| **4-Beat Discrete Rhythm Clock** | The predictable metronome governing hazard cycles: Beat 1 (Visual windup) → Beat 2 (Acoustic warning) → Beat 3 (Target lock) → Beat 4 (Hazard discharge) | Rhythm clock, beat system, timer |
| **Safe Planning Window** | Beats 1-3 of the rhythm clock, providing a guaranteed 3.0-second window for thinking and planning | Planning time, preparation phase |
| **Execution Window** | Beat 4 of the rhythm clock, demanding a simple single-step reaction to avoid hazards | Reaction time, hazard window |
| **Belly-Crawl** | Holding <kbd>S</kbd>/<kbd>Down</kbd> reduces hitbox height by 55% to 25.2px, allowing Phoe Htaung to slide beneath hazards | Crawl, prone, crouch, duck |
| **Norman's Law** | Locomotion inputs instantly cancel any ongoing item inspection, pickup, or crafting animation | Action canceling, interrupt priority |
| **Slapstick Cushion** | First contact with any hazard delivers non-lethal comedic animation instead of death, incrementing no counters | First hit, tutorial death, soft death |
| **Comedic Ghost Marks** | Permanent cartoon chalk outlines and red betel spit splatters marking previous death locations | Death marks, ghost outlines, splatters |

## Hazard & Physics System

| Term | Definition | Aliases to avoid |
| ---- | ----------- | ----------------- |
| **Hazard** | Any environmental threat that can cause slapstick death or comedic reactions | Trap, danger, obstacle |
| **Multi-Sensory Telegraphing** | Auditory and visual cues preceding hazards: material distress → acoustic teaser → locked aiming footprint | Telegraphing, warning system, foreshadowing |
| **Troll Quality Index (TQI)** | Metric for trap quality: (Telegraphed Affordance × Comedic Punchline × Instant Retry) / Perceived Unfairness | Trap score, quality metric |
| **Fair-Unfair Paradox** | The principle that Legendary Troll Traps are telegraphed and subvert tropes, while Cheap Traps are arbitrary and untelegraphed | Trap design principle |
| **Sub-200ms Instant Respawn** | On lethal contact, Phoe Htaung snaps back to spawn coordinates within 200ms with no scene reload | Instant retry, quick respawn, fast reset |

## Spatial & Coordinate System

| Term | Definition | Aliases to avoid |
| ---- | ----------- | ----------------- |
| **Universal Walkable Baseline** | The immutable ground level at y = 576px (0.80 × 720), consistent across all chapters | Ground level, floor, baseline |
| **Domain Physics Box** | Phoe Htaung's collision hitbox: width 36px, standing height 56px, prone height 25.2px (55% reduction) | Hitbox, collision box, bounding box |
| **Visual Center** | Phoe Htaung's visual midpoint at y = 536px, derived from feetY - 40px | Center point, origin, pivot |
| **Hand Level** | The standard position for held items at y = 524px (visualCenter - 12px) | Held position, carry height |
| **Bag Mouth** | The opening of the Lwe-Ait at y = 540px (visualCenter - 4px) where items enter during Diegetic Grab Phase 2 | Bag opening, inventory slot |
| **vy() Transformation** | The coordinate mapping function vy(y) = y - 64, translating domain coordinates to visual coordinates | Domain-to-visual mapping, coordinate bridge |

## Narrative & Audio System

| Term | Definition | Aliases to avoid |
| ---- | ----------- | ----------------- |
| **Phase-Locked Vertical Stem** | The seamless dynamic soundtrack with 3 synchronized ambient stems (Drone, Jungle, Kalimba) | Audio stems, soundtrack, music system |
| **Dialogue Ducking** | Automatic volume reduction of background stems by -60% over 300ms when subtitles appear | Audio ducking, volume fade |
| **Comedic Hard Mute** | Instantaneous zeroing of background stems within 15ms upon trap triggers for slapstick timing | Hard mute, instant mute, slapstick mute |
| **Asynchronous Narrator Audio Bus** | Independent audio channel for U Gyi's 3-5 second comedic roasts that don't block gameplay | Voiceover channel, narrator audio |
| **Typewriter Subtitle** | The elegant non-blocking DOM overlay delivering U Gyi's dialogue with creamy parchment backgrounds | Subtitles, dialogue text, speech bubbles |
| **Betel Chew Foley** | Character-specific sound effect for Phoe Htaung's constant betel nut chewing (sfx_betel_chew) | Chewing sound, betel sound |

## Campaign & Progression

| Term | Definition | Aliases to avoid |
| ---- | ----------- | ----------------- |
| **Death Count** | Persistent campaign statistic tracking total slapstick deaths across all attempts | Deaths, fatalities, failures |
| **Death Tolerance Quotient (DTQ)** | Target metric of 14-22 deaths per session before victory, balancing challenge and retention | Death target, difficulty metric |
| **Gold** | Optional collectible currency (Kyats) found in chapters, contributing to Pawnshop Settlement value | Coins, money, treasure, currency |
| **Relic** | Legendary optional chapter treasures with high resale value: Bronze Cog, Silver Ingot, Golden Buddha, Emerald Diadem | Treasure, artifact, collectible |
| **Campaign Save** | Persistent game state stored in `phoe-htaung.adventure.v2` saving deaths, gold, and unlocked chapters | Save file, save state, progress |
| **Route Distribution** | Target player behavior metric: 70% experience Sucker Trap first, 60% clear via Troll Solution, 20% via Athletic Bypass | Player metrics, completion stats |

---

## Relationships

- A **Chapter** contains exactly one **Sucker Trap** and four **Winning Conditions** (Canonical, Athletic, Secret, Heist)
- A **Winning Condition** belongs to exactly one **Chapter**
- A **Troll Solution** is a specific **Winning Condition** that subverts conventional logic
- A **Lwe-Ait** holds up to 12 **Items** and is permanently docked at (x=52px, y=668px)
- **In-Bag Crafting** transforms two **Items** into one new **Item** via drag-and-drop
- **Tool Chaining** sequences multiple **Items** in a specific order to solve puzzles
- A **Hazard** operates on the **4-Beat Discrete Rhythm Clock**
- **Belly-Crawl** reduces Phoe Htaung's **Domain Physics Box** height by 55%
- **Norman's Law** ensures **Locomotion** inputs override all non-essential animations
- The **Universal Walkable Baseline** is the immutable y=576px reference for all **Domain Physics Box** calculations
- The **vy() Transformation** maps **Domain Coordinates** to **Visual Coordinates** for rendering
- **Phase-Locked Vertical Stem** synchronization ensures all three stems start at identical timestamps
- **Dialogue Ducking** applies to all **Phase-Locked Vertical Stem** components
- **Comedic Ghost Marks** are created at the **Domain Physics Box** feet position upon **Sub-200ms Instant Respawn**
- A **Pawnshop Settlement Receipt** is generated upon completing a **Chapter** via any **Winning Condition**

---

## Example dialogue

> **Dev:** "When Phoe Htaung approaches a **Hazard** operating on the **4-Beat Discrete Rhythm Clock**, can he use **Belly-Crawl** to avoid it during the **Execution Window**?"

> **Domain Expert:** "Only if he's in a **Safe Pocket**. During **Beat 4**, the **Hazard** discharges. If Phoe Htaung activates **Belly-Crawl** and is in mud or under an overhang, **Norman's Law** keeps him safe. But if he's in the open, the **Comedic Ghost Marks** will appear at his **Domain Physics Box** position."

> **Dev:** "What about using the **Canonical Route** in Chapter 2? Does he need **In-Bag Crafting** first?"

> **Domain Expert:** "Yes. He must perform **In-Bag Crafting** combining **Betel Cutter** + **Torn Bottle** to create the **Half Bottle**, then use **Tool Chaining** to redirect the steam. The **Universal Mouth Verb** applies the **Betel Spit** as the final lubrication step."

> **Dev:** "And the **Troll Solution** for Chapter 1?"

> **Domain Expert:** "The **Secret Route**: push against the left wall for 1.0s to open the hidden **Troll Solution** passage. This bypasses the entire **Sucker Trap** and completes the **Chapter** immediately."

---

## Flagged ambiguities

- **"Trap" vs "Hazard"**: The documentation uses both terms. **Hazard** should be the canonical term for environmental threats, while **Trap** should specifically refer to **Sucker Trap** and **Troll Trap** classifications.
- **"Route" vs "Path" vs "Way"**: Multiple terms describe winning approaches. **Winning Condition** is the canonical term, with **Route** as acceptable but **Path** and **Way** to be avoided.
- **"Bag" vs "Inventory"**: The game uses **Lwe-Ait** as the canonical term, but **Inventory** appears in code. **Lwe-Ait** should be used in domain language, **Inventory** reserved for code/implementation.
- **"Scene" vs "Chapter"**: **Scene** is a Phaser technical term, while **Chapter** is the domain concept. Always use **Chapter** in domain discussions.
- **"Death" vs "Slapstick Death"**: All deaths are slapstick/comedic. Use **Death** as shorthand, but **Slapstick Death** when emphasizing the comedic nature.
