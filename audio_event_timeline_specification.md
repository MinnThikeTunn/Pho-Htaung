# Audio Implementation Specification: Scene 0 & Scene 1
**Target Project:** ရွှေမြို့တော်ရှာပုံတော်နှင့် ငကြောင်ဖိုးထောင် (*Phoe Htaung: Die Again in the Golden City*)  
**Scope:** `SCENE_0 [INTRO]` and `SCENE_1 [CHAPTER_1]` Audio Director Timeline & State Synchronization  
**Intended Consumers:** Autonomous Coding Agents, Web Audio Engineers, Game Engine Implementers  

---

## 1. Asset Registry & Preload Manifest

All assets must be preloaded prior to entering `SCENE_0`. The audio subsystem must support simultaneous multi-track looping and sample-accurate synchronized playback.

| Key | File Path | Type | Base Vol | Loop | Description / Sound Profile |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `STEM_DRONE` | `/audio/stem_drone.ogg` | Stem | `0.60` | Yes | Warm analog Moog sub-bass / tape hiss drone |
| `STEM_JUNGLE` | `/audio/stem_jungle.ogg` | Stem | `0.00` | Yes | Night jungle ambience, crickets, distant wind |
| `STEM_KALIMBA` | `/audio/stem_kalimba.ogg`| Stem | `0.00` | Yes | Organic kalimba / acoustic pluck melodic loop |
| `SFX_BETEL_CHEW` | `/audio/sfx_betel_chew.ogg`| SFX | `0.25` | Yes | Soft rhythmic squelch/crunch (betel nut chew) |
| `SFX_STEP_FLIPFLOP`| `/audio/sfx_step_flipflop.ogg`| SFX | `0.50` | No | Plastic/rubber flip-flop slap against ground |
| `SFX_STEP_BAREFOOT`| `/audio/sfx_step_barefoot.ogg`| SFX | `0.40` | No | Dull skin/heel tap on dirt surface |
| `SFX_CLANG_FALL` | `/audio/sfx_clang_fall.ogg` | SFX | `0.90` | No | Metallic heavy hollow impact + cartoon drop slide |
| `SFX_ROCKET_SPLAT` | `/audio/sfx_rocket_splat.ogg` | SFX | `0.95` | No | Instant high-velocity whoosh + squishy spike crunch |
| `SFX_RECORD_SCRATCH` | `/audio/sfx_record_scratch.ogg` | SFX | `0.70` | No | Quick 0.25s vinyl record needle slip |
| `SFX_STONE_GRIND` | `/audio/sfx_stone_grind.ogg` | SFX | `0.80` | No | Deep frictional granite displacement sound |
| `SFX_PUZZLE_CHIME` | `/audio/sfx_puzzle_chime.ogg` | SFX | `0.65` | No | Staccato 3-note ascending marimba/kalimba chime |

---

## 2. Global Mixing & Stem Synchronization Rules

1. **Phase-Locked Clock:** `STEM_DRONE`, `STEM_JUNGLE`, and `STEM_KALIMBA` must be initialized and started at the exact same audio context time ($t = 0.0\text{s}$). Stems that are not currently audible must run at `volume: 0.0` rather than being paused, preserving vertical synchrony.
2. **Dialogue Ducking Curve:** Whenever narrator dialogue (`isDialoguePlaying === true`) or typewriter subtitle blips are triggered:
   * Duck all active stems by $-60\%$ of their running volume via linear ramp over `300ms`.
   * Restore stems to nominal levels via linear ramp over `400ms` when dialogue concludes.
3. **Comedic Hard Mute:** Upon any trap trigger, immediately zero out melodic and ambient stems (`gain = 0.0` within `15ms`). Do not use long exponential fade-outs for comedic deaths; slapstick timing relies on sudden musical vacuum.

---

## 3. Scene 0: `[INTRO]` — အကြွေးရှင်ပြေး သူရဲကောင်း

### Timeline Sequence

```
0.0s                      2.0s        2.5s                     Start Click
 |-------------------------|-----------|----------------------------|-----> (To Ch 1)
 Screen: #000000           Fade to     Narrator starts:             Fade Kalimba in
 Start stems (Drone: 0.6)  Jungle      Duck stems                   Preserve stems
 Jungle: 0.0, Kalimba: 0.0 Chew SFX    Trigger record scratch on    Stop Chew SFX
                           fades in    comedic tonal shift ("...အယ်!")
```

### Detailed Event Dispatch Table

| Timestamp / Trigger | Audio State Action | Target Gain / Param | Transition Timing |
| :--- | :--- | :--- | :--- |
| **`T = 0.0s`**<br>(Scene Mount, `#000000` screen) | Start `STEM_DRONE`, `STEM_JUNGLE`, `STEM_KALIMBA` simultaneously. | `STEM_DRONE`: `0.60`<br>`STEM_JUNGLE`: `0.00`<br>`STEM_KALIMBA`: `0.00` | Immediate (`0ms`) |
| **`T = 2.0s`**<br>(Screen fades to Jungle Path) | Fade in jungle ambience.<br>Start looping betel idle SFX. | `STEM_JUNGLE`: `0.50`<br>`SFX_BETEL_CHEW`: `0.25` | Linear ramp over `2000ms`<br>Loop enabled |
| **`T = 2.5s`**<br>(U Gyi VO starts: *"တောကြီးမြိုင်လယ်..."*) | Apply narrator ducking. | `STEM_DRONE`: `0.20`<br>`STEM_JUNGLE`: `0.15` | Ramp over `300ms` |
| **Script Event:**<br>VO reaches *"...အယ်! သူရဲကောင်းဆိုလို့..."* | Comedic needle drop: Cut `STEM_DRONE` for `500ms` or trigger scratch. | Play `SFX_RECORD_SCRATCH`<br>`STEM_DRONE`: `0.00` for `500ms` | Instant (`0ms`), restore to `0.20` at $+500\text{ms}$ |
| **UI Event:**<br>Click `[ စတင်မည် / Start Game ]` | Stop betel loop.<br>Fade in Kalimba stem.<br>**DO NOT** terminate running drone/jungle stems. | `SFX_BETEL_CHEW`: Stop<br>`STEM_KALIMBA`: `0.50` | `STEM_KALIMBA` fades from `0.0` to `0.50` over `1500ms` |

---

## 4. Scene 1: `[CHAPTER_1]` — မမြင်ရသော ကောင်းကင်တုံးနှင့် ဒုံးပျံမြေပြင်

### Movement Audio State Engine

The player alternates footstep sounds on each stride:

```typescript
// Walking Loop Integration
let isFlipFlop = true;
const STEP_INTERVAL_MS = 280;

function onPlayerStep() {
  if (isFlipFlop) {
    audioEngine.playOneShot('SFX_STEP_FLIPFLOP', 0.50);
  } else {
    audioEngine.playOneShot('SFX_STEP_BAREFOOT', 0.40);
  }
  isFlipFlop = !isFlipFlop;
}
```

---

### Trap 1: `invisible_block` Mid-Air Collision

* **Condition:** Player jumps; bounding box strikes invisible block over pit ($x \in [\text{pit\_start}, \text{pit\_end}]$).
* **Execution Flow:**
  1. **Instant Mute:** Immediately set `STEM_KALIMBA.volume = 0` and `STEM_DRONE.volume = 0` ($t \le 15\text{ms}$).
  2. **Impact Playback:** Play `SFX_CLANG_FALL` (`volume: 0.90`) at the exact frame `invisible_block.opacity` shifts to `1.0`.
  3. **Death State:** Increment `deathCount++`, trigger screen shake, freeze player frame for $1.5\text{ seconds}$.
  4. **Narrator Roast:** Play U Gyi VO (*"ဟားဟားဟား! ကြည့်စမ်း... မြေကြီးကို ကြည့်မလျှောက်ဘဲ..."*). Keep stems at `0.0`.
  5. **Respawn Hook:** Upon player respawn at left platform, fade `STEM_DRONE` $\rightarrow 0.60$ and `STEM_KALIMBA` $\rightarrow 0.50$ over `800ms`.

---

### Trap 2: `right_platform` Rocket Launch & Crush

* **Condition:** Player lands on `right_platform` collider.
* **Execution Flow:**
  1. **Instant Mute:** Immediately cut all musical stems to silence.
  2. **Rocket & Squash Audio:** Trigger `SFX_ROCKET_SPLAT` (`volume: 0.95`) simultaneously with velocity application ($v_y = -1500\text{ px/s}$). The sample must contain the high-pitched ascension whoosh followed by the immediate heavy flesh-and-spike collision.
  3. **Death State:** Increment `deathCount++`, trigger freeze frame.
  4. **Narrator Roast:** Play U Gyi VO (*"အမလေး... မြေကြီးပေါ် ခြေချတာနဲ့..."*).
  5. **Respawn Hook:** Fade `STEM_DRONE` $\rightarrow 0.60$ and `STEM_KALIMBA` $\rightarrow 0.50$ over `800ms`.

---

### Troll Solution: `left_wall_hotspot` Push Interaction

* **Condition:** Phoe Htaung pushed against wall ($x \le 20$) continuously for $t \ge 1.0\text{s}$.
* **Execution Flow:**
  1. **Discovery Stinger:** Trigger `SFX_STONE_GRIND` (`volume: 0.80`) layered with `SFX_PUZZLE_CHIME` (`volume: 0.65`).
  2. **Narrator Reaction:** Trigger U Gyi dialogue (*"အမယ်လေးတော်... အရှေ့မသွားဘဲ နောက်ပြန်ဆုတ်ပြီး..."*).
  3. **Scene Exit Crossfade:**
     * Ramp `STEM_DRONE`, `STEM_JUNGLE`, and `STEM_KALIMBA` from current levels down to `0.00` across `2000ms`.
     * Preload and prepare Chapter 2 stems (`stem_furnace_drone.ogg`, `stem_steam_pipes.ogg`).
  4. **Load Next Scene:** Dispatch `SCENE_2` mount event upon complete audio fade-out.

---

## 5. Agent Verification & Acceptance Checklist

- [ ] All three primary stems start on Scene 0 mount with identical audio playback head positions.
- [ ] Jungle crickets fade in smoothly after 2 seconds without audio popping or distortion.
- [ ] Betel chewing SFX loops silently under the narrator VO and unbinds upon Scene 1 start.
- [ ] Flip-flop footstep (`sfx_step_flipflop`) and barefoot footstep (`sfx_step_barefoot`) alternate strictly on successive step events.
- [ ] Hitting the invisible block or landing on the rocket platform halts music stems instantly without gradual trail-off.
- [ ] Player respawn initiates a clean `800ms` fade-in of background music.
- [ ] Pushing the left wall for 1.0s fires both stone grind and puzzle chime SFX, initiating the 2-second stem fade-out into Chapter 2.