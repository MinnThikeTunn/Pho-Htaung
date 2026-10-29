# Game Mechanics & Architecture Specification: Phoe Htaung
## (ရွှေမြို့တော်ရှာပုံတော်နှင့် ငကြောင်ဖိုးထောင်)

---

## 1. Executive Vision & Core Gameplay Formula

* **Title:** ရွှေမြို့တော်ရှာပုံတော်နှင့် ငကြောင်ဖိုးထောင် (*Phoe Htaung: Die Again in the Golden City*)
* **Genre:** 2D Point-and-Click / Troll Puzzle-Platformer (*Die Again* $\times$ *Machinarium* $\times$ Upper Myanmar Folklore Satire)
* **Core Philosophy:** **Mild Action Pressure + Creative Tool Problem-Solving + Comedic Troll Traps**.
* **The Gameplay Loop:**
  $$\text{Observe Arena (Single Screen)} \xrightarrow{\text{Plan (Safe Beat)}} \text{Execute under Mild Pressure} \xrightarrow{\text{Hilarious Slapstick Death / Troll Victory}} \text{Instant Respawn / Next Room}$$

---

## 2. Core Control Schema & Ergonomics

To completely eliminate friction between fast-paced platforming and deliberate point-and-click tool selection, inputs are strictly orthogonal, tactile, and unified:

| Verb | Primary Key | Secondary / Mouse | Behavioral Specification |
| :--- | :--- | :--- | :--- |
| **Locomotion** | <kbd>A</kbd> / <kbd>D</kbd> | Left / Right Arrows or Floor Click | 220 px/s horizontal walk with synchronized flip-flop footstep foley. |
| **Jump** | <kbd>Space</kbd> / <kbd>W</kbd> | Up Arrow | -570 px/s vertical impulse. Includes 80ms coyote time and 100ms jump buffering. |
| **Belly-Crawl** | <kbd>S</kbd> / <kbd>↓</kbd> (Hold) | — | Drops Phoe Htaung into a prone belly-crawl (hitbox height reduced by 55%, speed at 40%). Slides under low beams and submerges in mud. |
| **Universal "Mouth Verb"** | <kbd>E</kbd> | Contextual UI prompt | **Unified Agency:**<br>• *Ambient:* Spits red betel nut juice (*"စွပ်"*).<br>• *Machinery:* Acts as emergency lubricant ("ဆေးမြီးတို") for rusty gears.<br>• *Hazards / Machine:* Provokes/taunts machines or enemies with Upper-Burma banter.<br>• *Tool in Hand:* If standing within proximity ($d \le 85\text{px}$) of an active target with an item held, applies the item. |
| **Shoulder Bag Dock Reveal** | Pointer Move ($y < 115\text{px}$) | Click `🎒 လွယ်အိတ်` Tab | Slides the 12-slot auto-hiding inventory dock down from $y=55\text{px}$ to $y=140\text{px}$ with a tactile fabric rustle. |
| **Slot Selection / Held Item** | <kbd>1</kbd>, <kbd>2</kbd>, <kbd>3</kbd> | Left-Click Slot | Instantly equips tool into Phoe Htaung's hand sprite. Clicking the active slot a second time deselects it and clears hands. |
| **In-Bag Tool Crafting** | Left-Click Slot $B$ while holding $A$ | Drag & Drop | Evaluates crafting recipe (e.g. `betel_cutter` + `torn_bottle` $\rightarrow$ `half_bottle`) with dedicated crafting audio. |
| **Contextual Tool Application** | <kbd>E</kbd> or Left-Click Target | Proximity Click ($d \le 85\text{px}$) | Applies held tool to world prop. If no tool is held, triggers tactile bare-handed inspection or narrator hint. |
| **Instant Action Canceling** | <kbd>Space</kbd> / <kbd>A</kbd> / <kbd>D</kbd> | — | **Norman's Law:** Any ongoing item inspection, pickup, or crafting animation is immediately aborted if the player inputs a jump or dodge. |
| **Instant Quick-Reset** | <kbd>R</kbd> (Hold 0.5s) | — | Instantly resets the current room state without reloading the page or losing persistent campaign statistics. |

---

## 3. First-Time User Experience (FTUE) & Onboarding Architecture

### 3.1 The First 30 Seconds: Instant Agency ($T = 0\text{s}$)
* **Zero Input Gating:** Players never sit through 11+ seconds of passive text typing. Phoe Htaung is controllable immediately upon scene entry.
* **Non-Blocking Dialogue:** U Gyi's satirical opening voiceover plays overhead in dynamic speech balloons while Phoe Htaung is already free to run, jump, and test controls.
* **Dialogue Fast-Forward:** Tapping <kbd>Space</kbd> or clicking skips dialogue lines instantly.

### 3.2 The Micro-Tutorial Without Text Walls (Miyamoto World 1-1 Rule)
The opening chamber naturally teaches all game mechanics through spatial geometry:
1. **Rightward Pull (0–3s):** Camera framing with negative space to the right instinctively pulls the player rightward using <kbd>D</kbd>.
2. **Belly-Crawl Discovery (<kbd>S</kbd>) (4–8s):** A low ancient stone archway ($y=590$) harmlessly blocks upright walking (*Thunk!*). Phoe Htaung stoops his neck while U Gyi shouts down-to-earth advice (*"ကုန်းလျှောက်လေ ငကြောင်ရ... ခေါင်းစိုက်ပြီး တွားသွားစမ်း!"*). Pressing <kbd>S</kbd> executes the belly crawl under the beam without artificial visual thought clouds.
3. **Low-Stakes Jump (9–14s):** A small 40px crack in the flagstones (not a death pit). Stepping into it causes a harmless comic stumble; <kbd>Space</kbd> clears it smoothly.
4. **Tactile Bag Feedback & Starting Tool:** Phoe Htaung enters with his signature heirloom tool already in his shoulder bag (*Lwe-Ait*): the **Betel Nut Cutter** (`betel_cutter` ✂️). When collecting chained tools (`bamboo_pole`, `rusty_cog`), Phoe Htaung physically secures them into his bag with a tactile fabric rustle (*Schrrrrt!*), accompanied by slot illumination on the top HUD dock.

### 3.3 The Slapstick Cushion ("First Hit is Cartoon, Not Death")
* When the first ambient ceiling hazard drops, it does **not** increment `deathCount` or kill Phoe Htaung.
* Instead, it triggers an accordion squash animation (`scaleY: 0.4`), spinning dizzy cartoon stars (`💫`), and U Gyi shouting:
  > *"ဟိတ်ကောင်! ခေါင်းပေါ် ကြည့်ပါဦး! ကျောက်တုံးတွေ မခိုင်ဘူးဟေ့... နောက်တစ်ခါ ထပ်ကျရင်တော့ ခေါင်းကွဲပြီသာမှတ်!"*
* The hazard timer only begins after Phoe Htaung has moved at least 150px into the room.

---

## 4. The Diegetic Item & Inventory Architecture (The "Snip, Pry & Lubricate" System)

### 4.1 The Auto-Hiding Shoulder Bag (*Lwe-Ait*) HUD & Ergonomics
To keep the player immersed in the atmospheric ruins without persistent UI clutter, the inventory is implemented as an auto-hiding diegetic container:
* **Off-Screen Docking & Reveal Mechanics:**
  - **Resting State:** Tucked flush against the top edge of the screen at $y = 55\text{px}$, exposing only the rounded leather badge tab (`🎒 လွယ်အိတ်`).
  - **Active Reveal:** Glides downward to $y = 140\text{px}$ with a tactile fabric rustle tween (`Back.Out`, 260ms) when the mouse pointer enters the top screen boundary ($y < 115\text{px}$) or when the player clicks the tab directly.
  - **Auto-Hide:** Smoothly retreats to $y = 55\text{px}$ after 400ms when the pointer leaves the region ($y > 230\text{px}$), provided no tool is actively selected.
* **Slot Matrix & Minimalist Aesthetic:**
  - 12 slots styled with deep ink (`#182720`), moss-slate (`#22352b`), and warm gold brass rims (`#e7bb55`).
  - Active Slot Highlight: The selected slot illuminates with a vibrant gold border and specular glass bevel.
  - Tooltip: Hovering any item displays its authentic Burmese title (e.g. *"ကွမ်းသီးညှပ်"*, *"ဝါးလုံးတုတ်"*, *"ဂီယာခွေဟောင်း"*) styled in high-contrast Noto Sans Myanmar.

### 4.2 The Held-Item Visual State & Direct Selection
* **Direct Selection (<kbd>1</kbd>–<kbd>3</kbd> or Slot Click):**
  - Pressing keyboard numbers <kbd>1</kbd>–<kbd>3</kbd> or clicking a slot equips the item into Phoe Htaung's hand sprite.
  - Clicking the currently equipped slot toggles deselection, returning tools safely to the bag.
* **Held Sprite Visualization:**
  - Phoe Htaung visually carries the equipped tool in hand, providing clear visual confirmation of intent.
  - The HUD tooltip locks to `"ကိုင်ထားသည်: [Item Name]"`.
* **Inspectable Blueprints:**
  - Selecting narrative items like the Ancient Engineer's Blueprint (`engineer_note`) displays a full-screen hand-drawn parchment/chalk architectural diagram illustrating puzzle schematics.

### 4.3 In-Bag Combination Mechanics (Tactile Crafting)
* Players can combine complementary tools directly within the shoulder bag.
* **Interaction:** With item $A$ currently selected in the inventory, clicking slot $B$ checks the combination matrix:
  $$\text{Item } A + \text{Item } B \longrightarrow \text{Crafted Item } C$$
* **Current Combinations:**
  | Ingredient 1 | Ingredient 2 | Result | Foley / Sound | Contextual Result |
  | :--- | :--- | :--- | :--- | :--- |
  | `betel_cutter` (✂️ ကွမ်းသီးညှပ်) | `torn_bottle` (🧴 ရေဗူးစုတ်) | `half_bottle` (ရေဗူးခြမ်း) | `soundEngine.playScissors()` | Snips plastic bottle into a protective nozzle cowl. |

### 4.4 The 4-Beat Environmental Tool Chaining Loop ("Snip, Pry & Lubricate")
Room progression replaces gamey keys and bare pickups with an organic, physical tool-chaining sequence:

```
[ PHOE HTAUNG'S SHOULDER BAG ]
         │
Starts with heirloom tool:
[ ITEM 1: BETEL CUTTER ] ✂️
         │
         │ (1. SNIP) Apply to hemp rope knot on scaffold
         ▼
[ ITEM 2: BAMBOO POLE ] 🎋
         │
         │ (2. PRY) Use as crowbar on fallen rock crevice
         ▼
[ ITEM 3: RUSTY COG ] ⚙️
         │
         │ (3. ASSEMBLE) Slot Cog & Bamboo Pole into Winch ports
         ▼
[ WINCH MECHANISM (JAMMED) ]
         │
         │ (4. LUBRICATE) Press 'E' near winch (Universal Mouth Verb)
         ▼
[ RED BETEL SPIT (*"စွပ်"*) LUBRICATES GEARS ] 🩸
         │
         ▼
🎯 DRAWBRIDGE UNLATCHES & DROPS SAFELY!
```

1. **Beat 1: The Snip (Scissors vs Rope):**
   - **Interactive Target:** Bamboo pole lashed to ancient timber scaffolding with a coiled hemp knot.
   - **Action:** Equipping `betel_cutter` and clicking the knot snips the hemp fibers (`playScissors()`). Severed rope coils drop, and the `bamboo_pole` slides down into Phoe Htaung's shoulder bag.
2. **Beat 2: The Pry (Lever vs Stone):**
   - **Interactive Target:** Heavy fallen step-stone wedged over an ancient bronze cog.
   - **Action:** Equipping `bamboo_pole` and clicking the crevice wedges the pole at $38^\circ$. Phoe Htaung leans with dynamic weight recoil (`scaleY: 0.85`), puffs dust, and heaves the boulder up with a grinding stone scrape (`playStoneGrind()`). The `rusty_cog` launches free in a high parabolic trajectory and clatters into the bag.
3. **Beat 3: The Assembly (Parts into Chassis):**
   - **Interactive Target:** Cliffside Winch chassis missing drive components.
   - **Action:** Inserting the `rusty_cog` and `bamboo_pole` mounts them into the brass axle. The gears engage with a metallic lock, but remain immobilized by decades of orange corrosion (`winchJammed = true`).
4. **Beat 4: The Lubrication (Emergency Folk Remedy):**
   - **Interactive Target:** Jammed winch axle.
   - **Action:** Stepping into proximity ($d \le 85\text{px}$) and pressing the Universal Mouth Verb <kbd>E</kbd> spits a droplet of dark red betel nut juice directly into the gear teeth (`playSpit()`). The spit dissolves the rust, sparking a golden brass gleam (`0xe7bb55`), unjamming the gears (`winchLubricated = true`), and triggering the counterweighted bridge drop.

### 4.5 The Zero-Thought-Bubble Narrative Protocol
* **Strict Ban on Comic Floating Bubbles:** Floating cloud bubbles, rising trail dots, and overhead thought icons are strictly prohibited across all game chapters.
* **Direct Diegetic Narrator Dialogue:**
  - All environmental hints, lore observations, and puzzle roadblocks are delivered directly through the overhead **Narrator Speech Balloon** (**ဦးကြီး** - U Gyi).
  - Speech bubbles appear in an elegant, non-blocking DOM overlay styled with creamy parchment backgrounds (`#fdfbf7`), slate typography, and prominent speaker badges (`<span>ဦးကြီး</span>`).
  - Dialogue never interrupts player locomotion or tool manipulation; tapping <kbd>Space</kbd> or clicking skips dialogue lines instantaneously.

### 4.6 Tactile Micro-Interactions, Denials & Soot Puffs
* **Denial Micro-Interactions (Clicking with Bare Hands / Wrong State):**
  - When clicking a locked or incomplete mechanism bare-handed, the target object executes a violent 4-cycle rattle tween (45ms yoyo).
  - Phoe Htaung shakes his head with an animated sweat drop popping overhead (`💦`).
  - U Gyi delivers immediate, satirical verbal guidance (e.g. *"ကွမ်းသီးညှပ်လေး ဘာလေးနဲ့ ကြိုးကို ဖြတ်ကြည့်ပါလား ငကြောင်ရ!"*).
* **The Soot Puff Reaction (Invalid Tool Experimentation):**
  - Attempting nonsensical item applications (e.g. sticking a betel cutter into a steam nozzle or safe keyhole) triggers an explosive black soot puff (`triggerSootPuff`).
  - Phoe Htaung is covered in comic soot ash while coughing, and U Gyi roasts the player's questionable logic.
* **Natural Signifiers (Affordance Highlighting):**
  - Interactive tools and puzzle nodes emit subtle procedural micro-animations (gentle vertical float tweens, periodic specular gleams) so players intuitively recognize touchable elements without artificial UI halos.

---

## 5. The 4-Beat Discrete Rhythm Clock (Managing Mild Pressure)

To prevent players from entering frantic panic, room hazards run on a **predictable, quantized metronome clock**:

```
[ Beat 1 : 1.0s ] ➔ Visual windup (Machinery ticks, steam hisses, shadows form)
[ Beat 2 : 1.0s ] ➔ Acoustic warning (Gear clicks, dust drops from ceiling)
[ Beat 3 : 1.0s ] ➔ Target Lock (Telegraphed trajectory fixed; safe to inspect clues)
[ Beat 4 : 0.8s ] ➔ HAZARD DISCHARGE (Falling stone, swinging blade, steam burst)
```

* **The Safe Planning Window:** Beats 1 to 3 provide a guaranteed 3.0-second window where the player can think, switch tools, and plan moves.
* **The Execution Window:** Beat 4 demands a simple, single-step reaction (step into a safe shelter, jump, or crawl into mud).
* **Safe Pockets (The Mud Patch / Overhangs):**
  - When Phoe Htaung is inside a safe pocket (e.g. belly-crawling in mud), hazard aggression ceases (bee swarms scatter).
  - Threat music softens with a low-pass filter, and Phoe Htaung relaxes into an idle betel-chewing sneak pose.

---

## 5.1 The Universal Troll Trap & Slapstick Architecture Framework

### 5.1.1 The "Fair-Unfair Paradox": Legendary vs. Cheap Troll Traps
In comedic puzzle-platforming, player retention hinges on the **Attribution Principle**:
* **Cheap Traps (❌ Bad):** Arbitrary, untelegraphed instant death $\rightarrow$ Player blames developer $\rightarrow$ Rage-quit and churn.
* **Legendary Troll Traps (✅ Brilliant):** Telegraphed physical setups that ruthlessly subvert conventional video game tropes (greed, blind dashing) $\rightarrow$ Player laughs at their own ego and carelessness $\rightarrow$ Instant chuckling retry.

$$\text{Troll Quality Index (TQI)} = \frac{\text{Telegraphed Affordance} \times \text{Comedic Punchline} \times \text{Instant Retry (<200ms)}}{\text{Perceived Unfairness}}$$

### 5.1.2 Multi-Sensory Telegraphing Architecture (The "Ear-Before-Eye" Law)
Cognitive psychology confirms auditory stimuli are processed by the human brain in $\sim 140\text{ms}$ versus $\sim 190\text{ms}$ for visual stimuli. Every dynamic trap strictly honors the multi-sensory hierarchy:
1. **Pre-Mortem Material Distress:** Plaster dust motes flutter, ceiling mortar groans, or loose mortar flakes drop 1.0s before hazard tracking begins.
2. **Acoustic Teaser:** Crisp foley (straining wood, rattling chains, angry insect buzzes) cues the player to stop and look up.
3. **Locked Aiming Footprint:** Trajectory reticle snaps and freezes during Beat 3 (Target Lock), granting a guaranteed 1.0s clean evasion window.

### 5.1.3 The Universal Slapstick Cushion Matrix (Non-Fatal First Contact)
The core onboarding rule across all chapters: **The First Hit Must Be Slapstick Education, Never Mortality.**

| Hazard Category | First Contact Reaction (Slapstick Cushion) | Subsequent Contact Reaction |
| :--- | :--- | :--- |
| **Falling Crushers / Bricks** | Accordion squash (`scaleY: 0.4`, `scaleX: 1.4`), bird chirping foley (`sfx_bell_clink`), drunken wobble for 1.2s. `deathCount` is **not** incremented. | Lethal pancake flattening, instant sub-200ms respawn, `deathCount` + 1. |
| **Swarming Wildlife (Bees / Bats)** | Butt-hop jump (+80px), rubber squeak foley, bright red swollen cheeks, longyi slips down. Zero death increment. | Swarm engulfs Phoe Htaung and hurls him off ledges; `deathCount` + 1. |
| **Mechanical Torque / Levers** | Lever slaps face with frying-pan *CLANG!*, spins $720^\circ$, longyi drops to ankles. Lever vibrates on spring tween. | Lever snaps violently, launching Phoe Htaung across room into stone walls. |
| **Thermal / Steam Nozzles** | Hair and face charred pitch-black with comic coughing and blinking white eyes (`triggerSootPuff`). | High-pressure blast hurls Phoe Htaung across screen into spikes. |
| **Invisible Ledge Blocks** | Forehead bumps with hollow coconut thud (*BOK!*), bounces backward onto safe ground; block cracks and turns permanently visible. | Bounces outward into bottomless pit abyss. |

### 5.1.4 Sub-200ms Instant Snapshot Respawn & Comedic Ghost Marks
* **Sub-200ms Reset ($T_{retry} < 200\text{ms}$):** On lethal contact, the camera micro-shakes (120ms) and Phoe Htaung instantly snaps back to the chamber spawn coordinate. No scene reloads or asset re-decodings ($<16\text{ms}$ state restoration).
* **Comedic Ghost Marks:** Whenever Phoe Htaung dies, a faint cartoon chalk outline and red betel spit splatter remain permanently stamped on the flagstone floor (`setDepth(14)`). Repeated deaths transform the room into an organic, humorous visual ledger of failed player experiments.

### 5.1.5 Asynchronous Narrator Audio Bus & Comedic Interruption Engine
* U Gyi’s 3–5 second comedic roasts run on an independent, ducked audio channel.
* Phoe Htaung is **already running on Attempt #2** while U Gyi is still delivering the punchline from Attempt #1.
* **Rapid Death Interruption:** If Phoe Htaung dies again within 1.5 seconds, U Gyi cuts himself off instantly with a sharp comedic interjection (*"အယ်! သေပြန်ပြီလား!"*) rather than restarting the audio clip.

---

## 6. The Tri-Modal Resolution Topology & Chapter Trap Matrix

Every single-screen room is engineered around three distinct resolution pathways:

```
                           ┌──────────────────────────────┐
                           │      ROOM ENTRY (SPAWN)      │
                           └──────────────┬───────────────┘
                                          │
            ┌─────────────────────────────┼─────────────────────────────┐
            ▼                             ▼                             ▼
    [PATH A: THE SUCKER]          [PATH B: THE TROLL]           [PATH C: THE ATHLETE]
  (Standard Video Game Logic)    (Burmese Jungle Logic)        (Frame-Tight Execution)
            │                             │                             │
     Hilarious Slapstick           Secret Creative               Speedrun Micro-Bypass /
      Death Animation                Discovery                   Frame-Perfect Vault
            │                             │                             │
            ▼                             ▼                             ▼
     Death Counter + 1             PROGRESSION TO                SPEEDRUN RECORD
   (U Gyi Laughs at You)             NEXT CHAPTER                (Unlocks Secret Badge)
```

### Chapter-by-Chapter Application & Detailed Trap Matrix:

#### 6.1 Chapter 1: Bridge & Winch Chasm (တံတားချစက်)
* **Path A (The Sucker - The Monastic Fishing-Line Yoink):** A glittering Pyu gold coin floats above the opposite precipice. The greedy player leaps across $\rightarrow$ monofilament line goes taut with a rod *TWANG!* $\rightarrow$ coin yoinks 300px straight up into ceiling rafters $\rightarrow$ Phoe Htaung grabs empty air, hangs in mid-air for 150ms like Wile E. Coyote, and plunges into the abyss while his flip-flop hovers for an extra beat.
  - *Remote Disarm:* Throwing an `ancient_brick` across the pit hits the coin, triggering the yoink safely from afar!
* **Trap: The High-Torque Winch Backfire Catapult:** Assembling the `rusty_cog` and `bamboo_pole` into the winch without lubricant and stubbornly cranking a second time snaps the bamboo lever backward (*KAPOW!*), launching Phoe Htaung 400px across the screen.
* **Trap: The Stupa Hornet Hive & Mud Sanctuary:** Shattering the dropped beehive releases an angry bee swarm (chase speed 140 px/s; spikes to 320 px/s with anger symbols `💢` if struck with a brick). Ducking into the procedural Mud Patch (<kbd>S</kbd> belly-crawl) repels the bees and leaves behind **Beeswax (`beeswax`)** as an alternate lubricant.
* **Trap: The Invisible Sky Block:** Plaster dust motes flutter downward at $(x=567, y=420)$. Bumping it makes a hollow coconut knock (*BOK!*), bouncing Phoe Htaung onto his back on the safe left ledge while the block permanently materializes.
* **Trap: The "Khwa-Khyet" Teeter-Totter Half-Bridge:** Mounting only the cog without the locking pin drops the bridge halfway. Walking past the pivot point tilts it into an $80^\circ$ wooden slide into the abyss.
* **Path B (The Burmese Troll Solution):** Execute the "Snip, Pry & Lubricate" loop:
  1. Snip tied `bamboo_pole` using starting heirloom `betel_cutter`.
  2. Use `bamboo_pole` to heave up fallen boulder and collect `rusty_cog`.
  3. Mount Cog and Pole into winch chassis.
  4. Press Universal Mouth Verb <kbd>E</kbd> near the winch to spit red betel juice (*"စွပ်"*) into gear teeth (or apply harvested `beeswax`) $\rightarrow$ drawbridge slams down safely with heavy bass rumble.
* **Path C (The Athletic Bypass):** Sprint right with `bamboo_pole` and jump at the cliff threshold $\rightarrow$ frame-perfect village pole-vault clearing the entire chasm and invisible block.
* **Secret Bonus (The "အောက်လမ်း"):** Push against the starting left wall for 1.0s $\rightarrow$ hidden dungeon door opens directly into Chapter 2.

---

#### 6.2 Chapter 2: Action Stone-Dropping Machine (ကျောက်တုံးချစက်)
* **Path A (The Sucker):** Try to dash under the tracking crusher along the floor $\rightarrow$ crushed flat into a comic pancake.
* **Trap: The False Gold Shelf Collapse:** An elevated wooden shelf holds tempting bonus gold coins. Jumping onto the shelf without testing causes the rusty iron brackets to snap with a dry splintering crack, dropping Phoe Htaung directly into the crusher's drop zone.
* **Trap: Scalding Steam Nozzle Soot Blast:** Approaching the steam bypass valve bare-handed triggers a high-pressure soot burst, blasting Phoe Htaung's hair back and covering him in black soot ash (`triggerSootPuff`).
* **Path B (The Troll / Emergent Solution):** 
  1. Combine `betel_cutter` + `torn_bottle` in inventory to craft `half_bottle`.
  2. Clamp `half_bottle` over the scalding steam nozzle to redirect the blast.
  3. Stand in front of the fortified iron gate or pressure plate and press Mouth Verb <kbd>E</kbd> to taunt the machine (*"ဟေ့ကောင်! ဒီမှာကွ!"*).
  4. The machine locks onto Phoe Htaung; dodge on Beat 3 $\rightarrow$ falling stone crushes the plate or shatters the gate wide open!
* **Path C (The Athletic Bypass):** Jump off falling boulders mid-air with frame-tight jump buffering to reach the elevated shelf and slide through the exit gap before the gate closes.

---

#### 6.3 Chapter 3: The Scale & Relic Chamber (ချိန်ခွင်ခန်း)
* **Path A (The Sucker - The Self-Righteous Deity Trap):** Calculate weights mathematically ($3 + 7 = 10\text{ viss}$) to achieve perfect balance $\rightarrow$ a giant stone deity relief on the back wall frowns; its carved hand springs forward and slaps Phoe Htaung flat against the screen like a mosquito.
* **Trap: The "Too-Greedy Relic Snatch":** Grabbing the 7-viss golden Buddha relic directly off the pan without latching the mechanism triggers an immediate portcullis guillotine that slams shut across the exit.
* **Path B (The Troll Solution):**
  1. Deface the stone inscription: Use the `betel_cutter` (or white chalk) to scratch the ancient Burmese numeral from $10$ to $0$ ($၁၀ \rightarrow ၀$).
  2. Alternatively, kick the counterweight basket off the pivot entirely ($0 = 0$).
  3. The temple mechanism registers balance, and the exit doors swing wide open.
* **Path C (The Heist Brace):** Insert the heavy iron spike (`pin`) into the gate latch hole to physically wedge the drive gear open. Steal the 7-viss golden relic and stroll through the jammed gate with full loot!

---

#### 6.4 Chapter 4: Safe & Riddle Chamber / Vault Guardian (သော့တိုက်ခန်းနှင့် အစောင့်နတ်ရုပ်)
* **Path A (The Sucker / Sphinx Trap):** Blindly turn the vault dials without inspecting clues $\rightarrow$ concealed mechanical scissor blades snap out from the floor, slicing Phoe Htaung's flip-flops and launching him ceiling-ward.
* **Trap: The False Painted Exit Door:** An obvious exit lever stands beside a heavy wooden door. Pulling the lever causes the "door" (a painted wooden folding screen) to fall forward flat onto Phoe Htaung with a cartoon wooden *FLUMP!*.
* **Trap: The Vault Guardian's Sweeping Club:** The chamber is guarded by a massive mechanical guardian automaton (*နတ်ဘီလူးရုပ်တု*). Running directly at it results in Phoe Htaung getting batted like a cricket ball into the far wall.
* **Path B (The Troll Solution - The "Spicy Sneezing Safe"):**
  1. Stuff fiery dried Burmese chili (`dried_chili`) into the safe's keyhole.
  2. The ancient bronze safe turns glowing cherry-red, shudders violently, sneezes explosively (*"ဟတ်ချိုး!"*), and blows its heavy steel vault door clean off its hinges!
  3. **Puzzle-Action Boss Entrapment:** Taunt the Vault Guardian with <kbd>E</kbd> near the bubbling tree sap / water buffalo mud basin. When the guardian swings its heavy club, dodge under a low stone arch using <kbd>S</kbd> (belly-crawl); the guardian's club wedges permanently into the sticky sap, leaving it helpless as Phoe Htaung slips behind it.
* **Path C (The Codebreaker):** Open the engineer's blueprint diagram (`engineer_note`) $\rightarrow$ decipher the cryptic astrological animal glyph riddle (Tiger, Garuda, Chinthe zodiac alignments) $\rightarrow$ rotate dials safely without waking the guardian.

---

#### 6.5 Chapter 5: The Sunken Treasury & Escape (ရွှေမြို့တော် မြေအောက်လှေဆိပ်)
* **Path A (The Sucker - The Unplugged Gilded Canoe):** Board a lavishly gilded ancient royal canoe without inspecting its hull $\rightarrow$ canoe glides 15 feet into the underground river, pops its missing drain cork, and submarines straight down with comic bubble foley (*bloop bloop bloop*).
* **Trap: The Creditor Shadow / Loan Shark Mirages:** Eerie flickering torches cast ominous moving shadows on the cave walls resembling the village loan sharks (*"ငွေတိုးပေး ဦးမောင်"*). Panicking and running backward triggers a hidden trapdoor slide back into the dungeon.
* **Path B (The Troll Escape - The Runaway Ore Cart):**
  1. Load heavy gold sacks onto an ancient rusted mine cart with broken brakes.
  2. Jump into the cart with U Gyi holding his cheroot in terror.
  3. Barrel down subterranean aqueduct tracks, ducking under low stalactites (<kbd>S</kbd>) and spitting betel juice onto track switches (<kbd>E</kbd>) to steer toward the sunlight.
  4. The cart crashes into a Bagan haystack on the dusty plains at high noon.
* **Path C (The Master Collector):** Recovered all optional chapter relics (Golden Buddha, Ancient Cog, Royal Rubies) $\rightarrow$ unlocks the ultimate viral **Pawnshop Settlement Receipt** with maximum resale value!

---

## 7. Death-to-Retry Architecture & Narrative Decoupling

* **Sub-200ms Death Reset ($T_{retry} < 200\text{ms}$):**
  - When death occurs, camera shakes (150ms) and Phoe Htaung snaps back to the spawn coordinates instantly.
  - The scene is never reloaded from scratch; state snapshot restores in $<16\text{ms}$.
* **Asynchronous Narrator Audio Bus:**
  - U Gyi’s 3–5 second comedic roast plays over a dedicated ducked audio bus.
  - Phoe Htaung is **already moving on attempt #2** while U Gyi is still delivering the punchline.
  - If Phoe Htaung dies again during dialogue, play a fast comedic interruption (*"အယ်!"*, *"သေပြန်ပြီလား!"*) rather than restarting the entire audio clip.
* **Comedic Ghost Marks:**
  - Faint cartoon chalk outlines and red betel spit splatters remain where Phoe Htaung previously died, turning failure into a visible, funny comic strip.

---

## 8. Player Retention & Viral Growth Drivers

1. **Session Length:** Each single-screen room is tuned for **2 to 3 minutes** of active execution once understood.
2. **The "Pawnshop Settlement Receipt" (Viral Sharing):**
   - Upon completing a chapter, render an authentic Adolf Lachman-style weathered pawn receipt:
     > *"Phoe Htaung's Settlement: 19 Deaths, 0 Brain Cells Used, Relics Stolen: 1, Resale Value: 350 Kyats."*
   - Includes a one-click button to copy a screenshot or text summary for TikTok, YouTube, or Discord.
3. **Telemetry & Balance Targets:**
   - **Death Tolerance Quotient (DTQ):** Target of 14–22 deaths per session before victory.
   - **Route Distribution:** 70% of players experience Path A (Sucker Trap) on attempt 1; 60% clear via Path B (Troll Solution); 20% clear via Path C (Athletic Bypass).
   - If player churn exceeds 15% at any room transition, U Gyi's third death roast automatically hints at the solution.
