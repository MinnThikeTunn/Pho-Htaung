# Feature Suggestions for Coding Agents: Machinarium-Grade Polish for Phoe Htaung

> **Target Project:** `game` (*ဖိုးထောင် - ပုဂံရွှေမြို့တော်ရှာပုံတော်*)  
> **Source Document:** `latest_update.txt`  
> **Aesthetic Benchmark:** Amanita Design (*Machinarium*) $\times$ Upper Myanmar Folklore & Satire  
> **Target Engine:** Phaser 3.88.2 + Web Audio API + Vite  

---

## 🎯 Executive Vision for Agents

This specification translates the high-level design pillars of `latest_update.txt` into actionable, testable technical tasks for AI coding agents. The objective is to transition from clean geometric vector approximations to a living, tactile, atmospheric 2D world that feels physical, grounded, and handcrafted.

---

## 🏗️ Epic 1: Visual Depth, Materiality & Atmospheric Lighting

### Feature 1.1: Weathered Texture Overlays & Canvas Materiality
* **Priority:** `P1 - High`
* **Target Files:**
  - `src/scenes/PreloadScene.js` (Texture baking pipeline)
  - `src/utils/AmbientAtmosphere.js` (Overlay layer manager)
* **Problem:** Flat digital colors make ancient Bagan subterranean ruins look modern and sterile.
* **Agent Implementation Recipe:**
  1. Generate procedural noise and parchment fiber patterns using an offscreen HTML5 canvas (`createNoiseTexture(width, height, factor)`).
  2. Apply HTML5 Canvas `globalCompositeOperation = 'multiply'` or `'overlay'` when baking environment slabs and pagoda structures.
  3. Introduce uneven stone edges and worn terracotta brick grout lines using rough bezier splines instead of perfect geometric rectangles.
* **Acceptance Criteria:**
  - [ ] No large surfaces have 100% uniform solid fill colors.
  - [ ] Walls and platforms display distressed micro-cracks, chipped stone edges, and sun-baked terracotta tones.

---

### Feature 1.2: Multi-Layered Parallax & Volumetric Lighting
* **Priority:** `P0 - Critical`
* **Target Files:**
  - `src/scenes/Chapter1Scene.js` through `Chapter5Scene.js`
  - `src/utils/AmbientAtmosphere.js`
* **Architectural Layering:**
  ```mermaid
  flowchart TD
      FG["Layer 4 (Depth 250): Dark Silhouette Foreground (Archways, Palm fronds, Overhanging rocks)"]
      Motes["Layer 3 (Depth 180): Floating Dust Motes & Golden God Rays"]
      MG["Layer 2 (Depth 20-50): Walkable Midground (Phoe Htaung, Puzzles, Interactive Hotspots)"]
      BG2["Layer 1 (Depth 10): Midground Ruins & Pagoda Silhouettes with Warm Mist"]
      BG1["Layer 0 (Depth 0): Distant Mountain Strata & Dawn Gradient Sky"]
      
      FG --> Motes --> MG --> BG2 --> BG1
  ```
* **Agent Implementation Recipe:**
  1. Add a foreground container (`depth = 250`) containing dark silhouette stone archways and drooping tropical foliage that scroll at `scrollFactor: 1.15`.
  2. Implement warm golden-hour volumetric god rays in `AmbientAtmosphere.js` using semi-transparent polygon gradients (`0xfbbf24` with alpha `0.06 - 0.12`).
  3. Ensure camera movements or screen bounds gently track the player horizontally with slight parallax offset across background and midground.
* **Acceptance Criteria:**
  - [ ] Every chapter exhibits at least 3 distinct visual depth planes.
  - [ ] Golden-hour dust motes float dynamically across the midground without impacting 60 FPS performance.

---

### Feature 1.3: Continuous Idle Micro-Animations for Characters
* **Priority:** `P1 - High`
* **Target Files:**
  - `src/scenes/PreloadScene.js` (Sprite frame generation)
  - `src/scenes/Chapter1Scene.js` (Player idle state loop)
* **Character Behaviors (Phoe Htaung & U Gyi):**
  - **Betel Nut Chewing Cycle:** Cyclic jaw and cheek deformation every 2.5 seconds with red betel drip wobble.
  - **Breathing & Posture Shifts:** Subtle `scaleY` sine oscillation (`1.0 -> 0.97 -> 1.0`) over 3.2 seconds.
  - **Idling Slapstick:** After 4 seconds of player inactivity, trigger random idle gags:
    - Phoe Htaung scratches his unkempt hair.
    - Swats a pesky cavern fly with his slipper.
    - Adjusts his tucked-up longyi knot (*ပုဆိုးခါးတောင်းကျိုက်*).
* **Acceptance Criteria:**
  - [ ] Phoe Htaung never remains completely static when waiting for input.
  - [ ] Idle animations blend seamlessly back into walking frames upon player click.

---

## 🎮 Epic 2: Tactile Mechanics & Physical "Game Feel"

### Feature 2.1: Proximity-Based Interaction & Reach Validation
* **Priority:** `P0 - Critical`
* **Target Files:**
  - `src/scenes/Chapter1Scene.js` to `Chapter5Scene.js`
* **Current Gap:** Clicking hotspots triggers reactions across the room regardless of Phoe Htaung's physical coordinates.
* **Agent Implementation Contract:**
  ```javascript
  // Target Contract for Hotspot Interaction
  function handleHotspotClick(targetObject, interactionCallback) {
    const PROXIMITY_RANGE = 75; // pixels
    const distance = Math.abs(this.player.x - targetObject.x);
    
    if (distance <= PROXIMITY_RANGE) {
      interactionCallback();
    } else {
      // 1. Walk over to target position
      const walkTargetX = targetObject.x > this.player.x ? targetObject.x - 55 : targetObject.x + 55;
      this.moveTo(walkTargetX, () => {
        // 2. Face object and execute
        this.player.setFlipX(targetObject.x < this.player.x);
        interactionCallback();
      });
    }
  }
  ```
* **Failure Feedback:** If an item is out of reach (e.g., high hanging lever), Phoe Htaung stretches his torso, shakes his head in denial, and displays a question-mark thought bubble.
* **Acceptance Criteria:**
  - [ ] Player physically walks to and faces any interactable puzzle or pickup before activating it.

---

### Feature 2.2: Non-Puzzle Ambient Micro-Interactions ("Juice")
* **Priority:** `P2 - Medium`
* **Target Files:**
  - `src/utils/MicroInteractions.js`
  - Chapter Scenes
* **Specifications:**
  - **Sleeping Village Dog / Temple Stray:** Clicking it causes an ear twitch, a lazy grunt sound, and a subtle squash-and-stretch tween (`scaleX: 1.08, scaleY: 0.92`).
  - **Hanging Temple Bell (ခေါင်းလောင်း):** Swaying rotation tween with a resonant metallic chime tone.
  - **Clay Pots (အိုးစုတ်များ):** Clicking wobbles the pot with a hollow ceramic thud.
* **Acceptance Criteria:**
  - [ ] At least 2 purely ambient, clickable "toy" objects per scene that reward player curiosity.

---

### Feature 2.3: Skeuomorphic In-World Puzzle Interfaces
* **Priority:** `P1 - High`
* **Target Files:**
  - `src/scenes/Chapter3Scene.js` (The Scale)
  - `src/scenes/Chapter4Scene.js` (The Safe)
* **Design Guideline:** Replace abstract rectangular modal overlays with close-up physical representations:
  - Chapter 4 Safe: Heavy tarnished brass dial with engraved Myanmar numerals (`၁, ၂, ၃, ...`), physical tumbler lock pins, and audible gear teeth clicks upon rotation.
* **Acceptance Criteria:**
  - [ ] Puzzles render as physical stone/metal apparatuses rather than flat modern web dialogs.

---

## 🎨 Epic 3: Diegetic UI & Visual Storytelling

### Feature 3.1: Auto-Hiding / Bag-Integrated Inventory (Lwe-Ait)
* **Priority:** `P1 - High`
* **Target Files:**
  - `src/ui/InventoryBar.js`
* **Current Behavior:** Inventory bar sits permanently pinned at the top-center.
* **Agent Implementation:**
  1. Default state: Inventory bar slides off-screen (`y: -70`) or collapses into a small Myanmar shoulder bag icon (*လွယ်အိတ်စုတ်*) carried by Phoe Htaung.
  2. Reveal trigger: Moving mouse pointer within top 48px of the viewport smoothly slides the inventory bar down into view (`y: 42`, ease: `'Back.Out'`).
  3. Auto-hide: Moving pointer down returns bar to hidden state unless an item is currently selected for drag-and-drop.
* **Acceptance Criteria:**
  - [ ] Zero screen real estate wasted on static HUD when player is exploring.
  - [ ] Smooth slide transition with zero hover flicker or jitter.

---

### Feature 3.2: Elimination of Explicit Dashed Boxes (Natural Signifiers)
* **Priority:** `P1 - High`
* **Target Files:**
  - `src/utils/AmbientAtmosphere.js`
  - Chapter Scenes
* **Guideline:** Eliminate artificial dashed stroke boxes around interactive areas. Instead, guide player attention via natural signifiers:
  - **Specular Glint:** An occasional glint particle sweeping across a brass key or cog every 4 seconds.
  - **Subtle Physical Jitter:** A loose brick or wobbly tile vibrating 2 pixels every 5 seconds.
  - **Lighting Accent:** A warm shaft of light or lantern glow illuminating important puzzle props.
* **Acceptance Criteria:**
  - [ ] No artificial UI borders exist inside the game canvas. Hotspots are identified through visual language and the interactive cursor.

---

### Feature 3.3: Show, Don't Just Tell (Slapstick Pantomime)
* **Priority:** `P1 - High`
* **Target Files:**
  - `src/ui/ThoughtBubble.js`
  - Chapter Scenes
* **Design Rule:** Minimize verbose text explanations. Communicate puzzle state through visual slapstick:
  - Using wrong item on a machine $\rightarrow$ Machine spits out black soot puff into Phoe Htaung's face; Phoe Htaung blinks with white cartoon eyes and coughs.
  - NPC or mechanism desires $\rightarrow$ Comic thought bubbles showing iconic crossed-out illustrations rather than paragraphs of text.
* **Acceptance Criteria:**
  - [ ] Every invalid item interaction plays a short comedic reaction animation before any narration dialogue triggers.

---

## 🔊 Epic 4: Sound Design Architecture & Foley Immersion

### Feature 4.1: Organic Multi-Layered Ambient Soundscapes
* **Priority:** `P0 - Critical`
* **Target Files:**
  - `src/utils/SoundEngine.js`
* **Layers of Sound:**
  1. **Subterranean Airflow / Wind Drone:** Low-pass filtered pink noise (`120 Hz - 280 Hz`) modulating slowly.
  2. **Biophony / Bagan Atmosphere:** Quiet high-frequency cicada hiss, cave swallow chirps, and distant wind chimes.
  3. **Organic Instruments:** Procedural pentatonic Saung-gauk (Burmese harp) arpeggios, wooden bamboo xylophone (Pattala) thuds, and low temple gong resonances.
* **Acceptance Criteria:**
  - [ ] Silence never occurs. Ambient background layers run continuously and transition smoothly across scenes.

---

### Feature 4.2: Tactile Foley & Mumbled Character Vocalizations
* **Priority:** `P1 - High`
* **Target Files:**
  - `src/utils/SoundEngine.js`
  - Character movement handlers
* **Sound Assets to Implement:**
  - **Footsteps on Stone/Dirt:** Alternating dry clicks and sand scuffs on every walk frame.
  - **Cloth Rustle:** Faint rustle of longyi fabric when jumping or running.
  - **Mumbled Voice Grunts:** Replace generic single-frequency beeps during U Gyi and Phoe Htaung's dialogues with expressive formant-filtered vocal mumblings (reminiscent of Machinarium robot chatter and Burmese colloquial grunts: *"အဟမ်း"*, *"ဟဲ့"*, *"အယ်"*).
* **Acceptance Criteria:**
  - [ ] Footsteps produce synchronized audio events during character walk cycles.
  - [ ] Dialogue typewriter effect uses multi-pitch formant vocal blips.

---

## 📋 Implementation Matrix for Agents

| Phase | Epic / Feature | Estimated Effort | Primary Verification Method |
| :--- | :--- | :--- | :--- |
| **Phase 1** | 2.1 Proximity Walking & Reach Check | 2-3 hours | Click distant hotspot $\rightarrow$ Character walks and faces target before executing. |
| **Phase 2** | 3.1 Auto-Hiding Inventory (Lwe-Ait) | 1-2 hours | Cursor at top edge reveals bar; moving away smoothly hides it. |
| **Phase 3** | 1.1 Weathered Canvas Texture Overlays | 2-3 hours | Visual inspection of ruins, walls, and ground for noise & mortar weathering. |
| **Phase 4** | 4.1 & 4.2 Organic Foley & Footsteps | 2 hours | Auditory verification of step cadence, clicks, and ambient drone transitions. |
| **Phase 5** | 1.3 Idle Animations (Betel & Swatting) | 2 hours | Leave character inactive 5 seconds $\rightarrow$ Observe comedic idle loops. |
