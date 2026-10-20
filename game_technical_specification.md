# Technical Specification: Phoe Htaung: Die Again in the Golden City
**(ရွှေမြို့တော်ရှာပုံတော်နှင့် ငကြောင်ဖိုးထောင်)**

---

## 1. Project Overview

* **Title:** ရွှေမြို့တော်ရှာပုံတော်နှင့် ငကြောင်ဖိုးထောင် (*Phoe Htaung: Die Again in the Golden City*)
* **Genre:** 2D Point-and-Click / Troll Puzzle Platform-Adventure (*Die Again* $\times$ *Machinarium* style)
* **Target Platform:** Web (HTML5 Canvas / Phaser 3 / PixiJS / React) or 2D Desktop Engine (Godot 4)
* **Language:** Burmese (Unicode standard - `Noto Sans Myanmar` or `Pyidaungsu` font required)
* **Core Loop:** The narrator (**U Gyi**) gives misleading advice $\rightarrow$ Player follows standard video game logic $\rightarrow$ Player dies gruesomely in a comedic trap $\rightarrow$ U Gyi mocks the player and increments the Death Counter $\rightarrow$ Player discovers the absurd "troll" solution to progress.

---

## 2. Characters & Core Entities

### 2.1 Protagonist: Phoe Htaung (ဖိုးထောင်)
* **Visual Profile:** Village loudmouth fleeing loan sharks. Chews betel nut constantly (idle animation), wears a tucked-up longyi (ပုဆိုးခါးတောင်းကျိုက်), a single flip-flop (ခြေညှပ်ဖိနပ်တစ်ဖက်), and carries a torn traditional shoulder bag (လွယ်အိတ်စုတ်ကြီး).
* **Capabilities:**
  * Walk Left / Right and Jump (used primarily in Chapter 1).
  * Point-and-Click interaction with environment hotspots.
  * Inventory management (Pick up, Combine items, Use item on environment).
  * Multiple comedic death states (head-first fall, flattened on ceiling spikes, crushed toe, steamed alive, smashed by scale, laser-incinerated, legs amputated, crushed by "VICTORY" rock).

### 2.2 Narrator: U Gyi (ဦးကြီး)
* **Visual/Audio Profile:** Upper Myanmar (အညာသံ) YouTube-recap-style voiceover artist and shady broker. Appears physically only in the final reveal scene wearing a short longyi and smoking a cheroot (ဆေးပေါ့လိပ်).
* **System Behavior:** Controls narrative pacing. Dialogue triggers on scene entry, trap execution, and puzzle completion.

---

## 3. Global Architecture & Systems

### 3.1 Global Game State (`GameState`)
Coding agents must maintain a persistent state object across scenes:

```json
{
  "currentScene": "INTRO",
  "deathCount": 0,
  "inventory": ["betel_cutter", "torn_bottle"],
  "flags": {
    "ch1_tunnel_open": false,
    "ch2_bottle_cut": false,
    "ch2_lever_covered": false,
    "ch2_door_open": false,
    "ch3_wall_scratched": false,
    "ch3_weight_kicked": false,
    "ch3_door_open": false,
    "ch4_safe_unlocked": false,
    "ch5_crushed": false
  },
  "isDialoguePlaying": false,
  "isPlayerDead": false
}
```

### 3.2 Inventory System
* **Starting Items (Loaded at Chapter 2 start):**
  1. `betel_cutter` (ကွမ်းသီးညှပ် - Betel Nut Cutter)
  2. `torn_bottle` (ရေဗူးစုတ် - Torn Water Bottle)
* **Collectible Items:**
  * `rusty_spike` (သံမှိုကြီး - 50-Viss Rusty Spike) $\rightarrow$ *Trap Item (causes instant death)*
  * `dried_chili` (ငရုတ်သီးခြောက်တောင့် - Dried Chili) $\rightarrow$ *Required for Chapter 4*
  * `dry_twigs` (သစ်ကိုင်းခြောက်များ - Dry Twigs) $\rightarrow$ *Red Herring / Unused*
  * `half_bottle` (ထက်ခြမ်းခွဲထားသော ရေဗူးစုတ်) $\rightarrow$ *Created by combining `betel_cutter` + `torn_bottle`*
* **Anti-Softlock Rule:** In Chapter 2, the player **must** automatically pick up `dried_chili` either before exiting Chapter 2 or have it auto-added when the secret furnace door opens, ensuring Chapter 4 is always solvable.

### 3.3 HUD & UI Layout
1. **Top-Right Corner:** Death Counter badge (`[Deaths: X]`) with a skull icon. Increments with a screen-shake effect upon each death.
2. **Bottom-Center:** Inventory Bar (displays item icons + Burmese tooltips on hover). Supports Drag-and-Drop onto other inventory slots or world hotspots.
3. **Top-Center / Bottom-Overlay:** Subtitle & Narrator Box displaying U Gyi's dialogue in Burmese with a typewriter text effect and audio playback hook.
4. **Death Overlay:** Brief 1.5-second comedic freeze-frame upon death, playing U Gyi's roast dialogue, followed by an automatic respawn at the current chapter's starting state (preserving `deathCount` and persistent inventory).

---

## 4. Scene-by-Scene Specifications

---

### SCENE 0: `[INTRO]` - အကြွေးရှင်ပြေး သူရဲကောင်း

#### Visual Setup
* Screen starts pitch black (`#000000`) with a glowing sketch of an ancient Golden City.
* Fades into a jungle path. Phoe Htaung is squatting on the side of the road chewing betel nut, wearing one flip-flop and his torn bag.

#### Dialogue Sequence
* **Trigger:** On Scene Load.
* **Narrator (VO):**
  > "တောကြီးမြိုင်လယ်၊ တိမ်တောင်တွေကြားမှာ ကွယ်ဝှက်ထားတဲ့ ပျောက်ဆုံးနေသော ရွှေမြို့တော်ကြီးပေါ့ဗျာ...။ နှစ်ပေါင်း ထောင်နဲ့ချီပြီး ဘယ်သူမှ မရောက်ဖူးတဲ့ ဒီနေရာကို တိုင်းပြည်အသီးသီးက စစ်သူကြီးတွေ၊ စွန့်စားခန်းဖွင့်သူတွေ လာခဲ့ကြဖူးပေမဲ့ အားလုံး အသက်ပျောက်ခဲ့ကြရရှာတယ်။ ဒါပေမဲ့ ဒီကနေ့မှာတော့... ထူးခြားလှတဲ့ သူရဲကောင်းတစ်ယောက် ပေါ်ထွန်းလာခဲ့ပြီဗျို့!
  > ...အယ်! သူရဲကောင်းဆိုလို့ အထင်မကြီးကြပါနဲ့ဦး။ ဒါ ရွာထဲမှာ အလုပ်မရှိ အကိုင်မရှိ လေလုံးပဲ ထွားနေတဲ့ ကွမ်းစားကြူး မောင်ဖိုးထောင်တဲ့ဗျာ! အကြွေးရှင်တွေ လိုက်လို့ ရွှေမြို့တော်ဘက် ခြေဦးတည့်ရာ ထွက်ပြေးလာတာ။ ကဲ... မင်း ရွှေမြို့တော်က ရတနာတွေ ယူပြီး သူဌေးလုပ်ချင်တယ်ပေါ့လေ? ရတယ်လေ... ငါ လမ်းပြပေးပါ့မယ်။ စလိုက်ကြရအောင် မောင်မင်းကြီးသား!"
* **Transition:** Show `[ စတင်မည် / Start Game ]` button $\rightarrow$ Loads `CHAPTER_1`.

---

### SCENE 1: `[CHAPTER_1]` - မမြင်ရသော ကောင်းကင်တုံးနှင့် ဒုံးပျံမြေပြင်

#### Visual Setup & Entities
* **Left Platform:** Phoe Htaung's spawn point. Left boundary has a pushable rock wall (`left_wall_hotspot`).
* **Center:** Deep chasm/pit (`pit_killzone`).
* **Mid-Air (Above Pit):** Invisible collider block (`invisible_block`, `opacity: 0` until hit, then `opacity: 1`).
* **Right Platform:** Contains a shiny giant gold coin (`gold_coin`) and a green checkpoint flag (`checkpoint_flag`). Ceiling above has hidden/recessed spikes (`ceiling_spikes`).

#### Entry Dialogue
> "ဟောဒီမှာ ကြည့်စမ်း... ရွှေမြို့တော် အဝင်တောင်ကြားလမ်းတဲ့။ ရှေ့မှာ တွင်းလေး နည်းနည်းဟနေတယ်။ မောင်ဖိုးထောင်ရေ... မင်း ခြေထောက်သန်ပါတယ်၊ တစ်ချက်လောက် ခုန်ကူးပြလိုက်စမ်းပါ!"

#### Mechanics & Triggers
1. **Trap 1: Invisible Block (`invisible_block`)**
   * **Condition:** Player jumps across the pit along a standard arc ($x \in [\text{pit\_start}, \text{pit\_end}]$).
   * **Action:** Player's head collides with `invisible_block` $\rightarrow$ block becomes visible with a metallic *CLANG* $\rightarrow$ Phoe Htaung flips upside down and falls into `pit_killzone` $\rightarrow$ `deathCount++`.
   * **Narrator (VO):**
     > "ဟားဟားဟား! ကြည့်စမ်း... မြေကြီးကို ကြည့်မလျှောက်ဘဲ ကောင်းကင်ကို ခေါင်းနဲ့ သွားတိုက်တယ်! အပေါ်မှာ မမြင်ရတဲ့ ကျောက်တုံးရှိမှန်း မသိဘူးလားကွဲ့? ဦးနှောက်မပါတာ ကောင်းကင်ကပါ လာဆော်ထည့်တာ တွေ့လား။ ကဲ... ပထမဆုံးအကြိမ် ဇောက်ထိုးသေဆုံးခြင်းပေါ့ဗျာ!"

2. **Trap 2: Rocket Ground (`right_platform`)**
   * **Condition:** Player does a low/late jump to bypass `invisible_block` and lands on `right_platform`.
   * **Action:** `right_platform` launches upward at high velocity ($v_y = -1500\text{ px/s}$) like a rocket $\rightarrow$ crushes Phoe Htaung flat against `ceiling_spikes` $\rightarrow$ `deathCount++`.
   * **Narrator (VO):**
     > "အမလေး... မြေကြီးပေါ် ခြေချတာနဲ့ ကောင်းကင်ဘုံ တန်းပို့ခံရတယ်! ရှေးခေတ်ပညာရှင်တွေက တွင်းထဲ ကျမသေတဲ့ကောင်တွေကို မျက်နှာကျက်နဲ့ ကပ်သတ်ပစ်တာကွဲ့။ မင်းမျက်နှာ အပေါ်က ဆူးတွေနဲ့ ပြားကပ်သွားတာ ငါးပိကောင်လေး ကျနေတာပဲ!"

3. **Troll Solution: Left Screen Edge (`left_wall_hotspot`)**
   * **Condition:** Player walks all the way to the left edge of the screen ($x \le 20$) and pushes against the wall for $1.0\text{ second}$ (or clicks/interacts with the left wall).
   * **Action:** Secret underground tunnel opens at the bottom-left (`ch1_tunnel_open = true`).
   * **Narrator (VO):**
     > "အမယ်လေးတော်... အရှေ့မသွားဘဲ နောက်ပြန်ဆုတ်ပြီး နံရံကို ဇွတ်သွားတိုက်တယ်! ဒါပေမဲ့ ကံကောင်းသွားတယ်ဗျို့၊ မြေအောက်လမ်း ပွင့်သွားပြန်ပြီ။ ကဲ သွား... အောက်လမ်းကပဲ လျှောက်တော့၊ မင်းလိုကောင်မျိုးက အောက်လမ်းနဲ့ပဲ တန်တယ်!"
   * **Transition:** Phoe Htaung enters tunnel $\rightarrow$ Loads `CHAPTER_2`.

---

### SCENE 2: `[CHAPTER_2]` - ရေပိုက်လိုင်းနှင့် ဘီလူးမီးဖိုခန်း

#### Visual Setup & Entities
* **Background:** Sealed stone cave door (`cave_door`), roaring furnace (`furnace`) next to it.
* **Wall:** $3 \times 3$ (9-grid) rotatable steam pipe puzzle (`pipe_grid`), a steam nozzle (`pipe_nozzle`), and a pull lever (`steam_lever`).
* **Floor Items:**
  * `rusty_spike` (သံချေးတက်နေသော သံမှိုကြီး)
  * `dried_chili` (ငရုတ်သီးခြောက်တောင့်)
  * `dry_twigs` (သစ်ကိုင်းခြောက်များ)
* **Starting Inventory:** `betel_cutter` (ကွမ်းသီးညှပ်), `torn_bottle` (ရေဗူးစုတ်).

#### Entry Dialogue
> "ကဲ... ဂူတံခါးကြီး ပိတ်နေပြီ။ ကြမ်းပြင်ပေါ်မှာ ပစ္စည်းတွေ ပြန့်ကျဲနေတာပဲ။ ကောက်စမ်း မောင်ဖိုးထောင်... လွယ်အိတ်ထဲ ထည့်စမ်း!"

#### Mechanics & Triggers
1. **Item Pickup: `dried_chili` & `dry_twigs`**
   * **Condition:** Player clicks on `dried_chili` or `dry_twigs`.
   * **Action:** Added safely to inventory.

2. **Trap 1: The 50-Viss Spike (`rusty_spike`)**
   * **Condition:** Player clicks on `rusty_spike` to pick it up.
   * **Action:** Phoe Htaung puts it in his bag $\rightarrow$ bag strap snaps immediately $\rightarrow$ spike falls directly onto Phoe Htaung's big toe $\rightarrow$ toe explodes in comedic cartoon style $\rightarrow$ Phoe Htaung dies $\rightarrow$ `deathCount++`.
   * **Narrator (VO):**
     > "တွေ့ကရာ အမှိုက်ကောက်တဲ့ကောင်! သံမှိုက ပိဿာ ၅၀ လေးတာကို အိတ်စုတ်ထဲ အတင်းထိုးထည့်တယ်! ခြေမ ကွဲထွက်သွားတာ မြင်ရတာ အတော် မျက်စိအေးတာပဲကွယ်... သေပေါ့!"

3. **Trap 2: The Engineer's Steam Bath (`pipe_grid` + `steam_lever`)**
   * **Condition:** Player aligns the 9-grid pipes (`pipe_grid` solved or unsolved) and pulls `steam_lever` **without** modifying the lever/nozzle with the cut bottle.
   * **Action:** `pipe_nozzle` rotates $180^\circ$ toward Phoe Htaung and blasts boiling steam $\rightarrow$ Phoe Htaung turns bright red like a boiled shrimp and dies $\rightarrow$ `deathCount++`.
   * **Narrator (VO):**
     > "ဟားဟားဟား! ပိုက်လိုင်းဆက်တာတော့ အင်ဂျင်နီယာကြီး ကျနေတာပဲဗျာ! ပိုက်တွေ အကုန်ဆက်ပြီး လီဗာဆွဲချလိုက်တော့... အယ်! ပိုက်ခေါင်းက မင်းဘက် လှည့်နေတာ မမြင်ဘူးလား? မင်းကိုယ်မင်း ရေနွေးဖျောထည့်လိုက်တာ တွေ့လား? တော်တော် ဉာဏ်ကြီးတဲ့ ကောင်လေးဗျာ!"

4. **Troll Solution: Jungle Engineering**
   * **Step A:** In Inventory, drag `betel_cutter` onto `torn_bottle` $\rightarrow$ Replaces `torn_bottle` with `half_bottle` (ထက်ခြမ်းခွဲထားသော ရေဗူး).
   * **Step B:** Drag `half_bottle` onto `steam_lever` / `pipe_nozzle` (`ch2_lever_covered = true`).
   * **Step C:** Click `steam_lever` to pull it.
   * **Action:** Steam is deflected by the plastic bottle into `furnace` $\rightarrow$ Fire extinguishes $\rightarrow$ `cave_door` opens (`ch2_door_open = true`). *(Note: If `dried_chili` is still on the floor, automatically add it to `inventory` now).*
   * **Narrator (VO):**
     > "ကွမ်းသီးညှပ်နဲ့ ရေဗူးကို လှီးတယ်တဲ့ဗျာ! ဘယ်တုန်းကမှ မကြားဖူးတဲ့ တောတွင်းနည်းပညာတွေ သုံးနေပြန်ပြီ။ မီးငြိမ်းသွားပြီး တံခါးပွင့်သွားတယ်... ဟေ့ကောင် ဖိုးထောင်၊ ငါ အံ့ဩလို့ သေတော့မယ်!"
   * **Transition:** Click open door $\rightarrow$ Loads `CHAPTER_3`.

---

### SCENE 3: `[CHAPTER_3]` - နတ်ရုပ်ချိန်ခွင်နှင့် သင်္ချာပဟေဠိ

#### Visual Setup & Entities
* **Center:** Giant blind stone deity statue (`statue`) with empty eye sockets (`statue_eyes`) holding two balance pans:
  * `left_pan`: Contains a removable `weight_10` (၁၀ ပိဿာ အလေးတုံး).
  * `right_pan`: Empty.
* **Wall Inscription (`wall_text`):** Displays `"၁၀ ပိဿာ ညီမျှလျှင် တံခါးပွင့်အံ့"`. The character `"၁"` in `"၁၀"` is an interactive sub-hotspot.
* **Floor Items (Draggable into pans or sockets):**
  * `stone_3` (၃ ပိဿာ ကျောက်ခဲ)
  * `gold_7` (၇ ပိဿာ ရွှေတုံး)
  * `red_gem` (ကျောက်မျက်နီ)

#### Mechanics & Triggers
1. **Trap 1: Correct Math Punishment (`stone_3` + `gold_7` on `right_pan`)**
   * **Condition:** `left_pan` weight $= 10$ AND `right_pan` weight $= 3 + 7 = 10$.
   * **Action:** Scales balance perfectly $\rightarrow$ Statue's eyes snap open in rage $\rightarrow$ Statue swings the heavy scale pan and smashes Phoe Htaung's head $\rightarrow$ `deathCount++`.
   * **Narrator (VO):**
     > "အိုဟိုး... သင်္ချာဂုဏ်ထူးရှင်ကြီး! ၃ ရယ် ၇ ရယ် ပေါင်းရင် ၁၀ ရတယ်ဆိုပြီး ချိန်ခွင်ကို ကွက်တိ ညှိပြသွားတယ်! ဒါပေမဲ့... နတ်ရုပ်ကြီးက သင်္ချာတော်တဲ့ကောင်တွေကို ကြည့်မရဘူးကွဲ့! 'ငါတောင် မပေါင်းတတ်တာ မင်းက လာပေါင်းပြတယ်' ဆိုပြီး ချိန်ခွင်နဲ့ ရိုက်ခွဲလိုက်တာ တွေ့လား? သေဦးပေါ့!"

2. **Trap 2: Giving Sight to the Blind Statue (`red_gem` on `statue_eyes`)**
   * **Condition:** Player drags `red_gem` onto `statue_eyes`.
   * **Action:** Gem slots in and glows red $\rightarrow$ Statue fires twin laser beams at Phoe Htaung $\rightarrow$ Phoe Htaung turns into a pile of ash with eyeballs blinking $\rightarrow$ `deathCount++`.
   * **Narrator (VO):**
     > "မျက်စိကန်းနေတဲ့ နတ်ရုပ်ကို မျက်လုံး သွားတပ်ပေးတယ်... ဟုတ်ပြီ၊ နတ်ရုပ်ကြီး မြင်သွားပြီဗျို့! မြင်မြင်ချင်းပဲ လေဆာနဲ့ ပစ်ခွဲလိုက်တာ ကြည့်စမ်း! မင်း ကျေးဇူးသိတတ်ပုံကတော့ ကမ္ဘာကျော်တယ် နတ်ရုပ်ကြီးရေ!"

3. **Troll Solution: Exam Report Card Forgery**
   * **Step A:** Drag `betel_cutter` from Inventory onto `wall_text` (`"၁၀"`).
   * **Action A:** Phoe Htaung scratches out `"၁"`, changing the inscription to `"၀ ပိဿာ ညီမျှလျှင် တံခါးပွင့်အံ့"` (`ch3_wall_scratched = true`).
   * **Step B:** Click on `weight_10` in `left_pan` (when `right_pan` is empty).
   * **Action B:** Phoe Htaung kicks `weight_10` off the pan (`ch3_weight_kicked = true`). Both pans now equal $0\text{ viss}$. If `ch3_wall_scratched == true`, the temple door opens (`ch3_door_open = true`).
   * **Narrator (VO):**
     > "ကျောက်စာပေါ်က ဂဏန်းကို ကွမ်းသီးညှပ်နဲ့ ခြစ်ဖျက်ပစ်တယ်! ဟာ... စာမေးပွဲ အောင်လက်မှတ်ကို အမှတ်ခိုးပြင်တဲ့ အကျင့်ဟောင်းတွေ ဒီမှာ လာသုံးနေတယ်ဗျာ။ အံမယ်... တံခါးက ပွင့်သွားသေးတယ်! ရှေးခေတ်လူတွေလည်း ဒီကောင့်လောက်တော့ မလည်ဘူးထင်ပါရဲ့!"
   * **Transition:** Click open door $\rightarrow$ Loads `CHAPTER_4`.

---

### SCENE 4: `[CHAPTER_4]` - လျှို့ဝှက်သေတ္တာနှင့် ဂန္ထဝင်စကားထာ

#### Visual Setup & Entities
* **Center:** Giant iron safe (`iron_safe`) featuring:
  * 3-digit rotary dial `[0-9] [0-9] [0-9]` (`safe_dials`) and a `[ ဖွင့်မည် / Submit ]` handle.
  * A prominent keyhole (`safe_keyhole`).
* **Wall Riddle (`riddle_text`):**
  > *"နံနက်တွင် ခြေ ၄ ချောင်း၊ နေ့လယ်တွင် ခြေ ၂ ချောင်း၊ ညနေတွင် ခြေ ၃ ချောင်း ဖြစ်သော သတ္တဝါကား အဘယ်နည်း?"*

#### Mechanics & Triggers
1. **Trap 1: The Sphinx Riddle Hater (Code `4 - 2 - 3`)**
   * **Condition:** Player sets `safe_dials` to `4 - 2 - 3` and activates the handle.
   * **Action:** A spring-loaded pair of giant scissors bursts out from the bottom of the safe and snips off both of Phoe Htaung's legs $\rightarrow$ `deathCount++`.
   * **Narrator (VO):**
     > "နံပါတ် ၄-၂-၃... စကားထာ အဖြေမှန်ပေါ့ဗျာ။ လူ ဆိုတဲ့ သတ္တဝါပေါ့! ကဲ... သေတ္တာ ပွင့်ပြီလား ကြည့်ရအောင်... ဟားဟားဟား! သေတ္တာလုပ်တဲ့ ရှေးလူကြီးက အဲဒီစကားထာကို မုန်းလွန်းလို့ အဲဒီနံပါတ် ရိုက်ထည့်ရင် ခြေထောက်ဖြတ်တဲ့ ကတ်ကြေး ထည့်ထားတာကွဲ့! မင်း အခုတော့ ခြေထောက် မရှိတော့ဘူး... ညနေခင်း ခြေ ၃ ချောင်းတောင် မဖြစ်နိုင်တော့ဘူး!"
   * *(Note: Any other number combination plays a dull buzzer sound and U Gyi says: "မှားတယ်ဟေ့! စာလေးဘာလေး ဖတ်ပါဦးလား!")*

2. **Troll Solution: Chili Pepper Lockpicking**
   * **Condition:** Player drags `dried_chili` (from Inventory) onto `safe_keyhole`.
   * **Action:** Safe turns red, shakes violently, makes coughing sound effects (*အဟွတ်! အဟွတ်!*), and sneezes the lock cylinder right off the door (`ch4_safe_unlocked = true`). Inside is the passageway to the Grand Palace Hall.
   * **Narrator (VO):**
     > "ဟောဗျာ... ငရုတ်သီးခြောက်တောင့်ကို သော့ပေါက်ထဲ သွားထိုးတယ်! သေတ္တာက ငရုတ်သီးစပ်ပြီး ချောင်းတွေဆိုး၊ သော့ကလန့် ပြုတ်ကျသွားတယ်ဗျို့! ဒီကောင့် ဆေးမြီးတို နည်းတွေကတော့ ကမ္ဘာ့အံ့ဖွယ် စာရင်းထဲ သွင်းရတော့မယ်!"
   * **Transition:** Click open safe/passageway $\rightarrow$ Loads `CHAPTER_5`.

---

### SCENE 5: `[CHAPTER_5]` - ရတနာသိုက်နှင့် အဆုံးစွန်သော Troll (Ending)

#### Visual Setup & Entities
* **Environment:** Lavish glittering golden hall.
* **Center:** Massive mountain of gold coins and a glowing treasure chest (`treasure_pile`).

#### Entry Dialogue
> "နောက်ဆုံးတော့... မောင်ဖိုးထောင်တစ်ယောက် ရွှေမြို့တော် ဗဟိုချက်မကို ရောက်လာခဲ့ပြီဗျာ! ဟောဒီမှာ ကြည့်စမ်း... ရွှေတွေ၊ ငွေတွေ၊ စိန်ရတနာတွေ ပုံလိုက်ကြီးပဲ! မင်း ချမ်းသာပြီ ဖိုးထောင်ရေ! ပြေးစမ်း... ပြေးယူလိုက်စမ်း!"

#### Mechanics & Triggers
1. **Final Trap: Victory Sign Bait (`treasure_pile`)**
   * **Condition:** Player clicks on or walks into `treasure_pile`.
   * **Action:**
     1. Triumphant 8-bit/orchestral fanfare plays for $1.5\text{ seconds}$.
     2. A massive 50-ton stone block carved with the word `"VICTORY!"` drops from the top of the screen ($v_y = 2500\text{ px/s}$) and crushes Phoe Htaung flat $\rightarrow$ `deathCount++`.
   * **Narrator (VO):**
     > "ကျွတ်... ကျွတ်... ကျွတ်! သနားစရာ ကောင်းလိုက်တာ ဖိုးထောင်ရယ်။ 'VICTORY' ဆိုတဲ့ စာတန်းကြီးနဲ့ ဖိသတ်ခံရတာ ဇာတ်သိမ်း အရသာ ရှိရဲ့လားကွဲ့?"
   * **Transition:** Instead of respawning, automatically transition after dialogue to `SCENE_6_REVEAL`.

---

### SCENE 6: `[THE_BIG_REVEAL]` & `[GAME_OVER]`

#### Part A: The Cutscene Reveal
* **Visual Action:** Camera performs a slow Zoom Out (scale from $1.0 \rightarrow 0.4$). The glittering "Golden Palace" is revealed to be cardboard cutouts and gold-spray-painted corrugated tin inside a dilapidated cowshed/scrap warehouse (နွားတင်းကုတ်ဟောင်းကြီး).
* **Character Entry:** **U Gyi** walks onto the screen from the right wearing a hiked-up longyi and puffing a cheroot (ဆေးပေါ့လိပ်).
* **Narrator Dialogue:**
  > "ဟဲဟဲဟဲ... မင်း ထင်နေတာက ရွှေမြို့တော်ကို မင်း ပထမဆုံး ရောက်လာတယ်ပေါ့လေ?
  > အမှန်တော့ ဒီနေရာက ငါ အရင်တစ်ခေါက် လာတုန်းက သေသွားတဲ့ကောင်တွေဆီက ပစ္စည်းတွေကို လာစုထားတဲ့ ငါ့ဂိုဒေါင်ဟောင်းကြီးကွဲ့!
  > မင်း ၈ ခါ သေသွားတော့ မင်းဆီက ကျန်ခဲ့တဲ့ ဓားမရယ်၊ လွယ်အိတ်စုတ်ရယ်၊ ဖိနပ်တစ်ဖက်ရယ်ကို ငါ သံတိုသံစဆိုင် သွားရောင်းရင်တောင် ဆေးပေါ့လိပ် ၅ လိပ်ဖိုး ရပြီဗျာ!
  > ကဲ... ဒီဂိမ်းကို ထိုင်ဆော့နေတဲ့ ကစားသမားလေးလည်း ခေါင်းမီးတောက်ပြီး သွေးတက်နေလောက်ပြီ။ သွား... သွား... ရေခဲရေလေး သောက်ပြီး ခေါင်းအေးအောင် သွားလုပ်ပေတော့! ဟားဟားဟား!"
* *(Dynamic Text Note: Replace `၈ ခါ` dynamically with `GameState.deathCount` in Burmese numerals, e.g., `toBurmeseNumeral(deathCount)`).*

#### Part B: Game Over Screen & Evasive Button
* **UI Display:**
  ```text
  =========================================
            [ GAME OVER SCREEN ]
  - Total Deaths: {deathCount}
  - Total IQ Lost: 99.9%
  - [ Play Again / ပြန်ကစားမည် ]
  =========================================
  ```
* **Evasive `[ Play Again ]` Button Specification:**
  * Whenever the mouse cursor $(m_x, m_y)$ approaches within a Euclidean distance $d < 100\text{ px}$ of the button's center $(b_x, b_y)$:
    $$d = \sqrt{(m_x - b_x)^2 + (m_y - b_y)^2}$$
  * Reposition the button to a new random coordinate $(b'_x, b'_y)$ bounded within the safe viewport padding $[50, W - 150] \times [50, H - 80]$ such that the new distance from the cursor is $\ge 200\text{ px}$.
  * Display floating troll text near the button on each dodge (e.g., `"မမိပါဘူးကွာ!"`, `"သွားအိပ်တော့!"`, `"ဟားဟား!"`).
  * **Secret Reset Hook:** Provide a small, subtle keyboard shortcut (`R` key) or allow clicking after $10$ dodges so players/testers can still restart if desired.

---

## 5. Audio & Visual Polish Guidelines for Coding Agents

1. **Procedural Sound Effects (Web Audio API):**
   * If external audio assets are unavailable, synthesize retro/cartoon sound effects using the Web Audio API:
     * **Jump:** Rising sine wave ($150\text{ Hz} \rightarrow 400\text{ Hz}$).
     * **Death / Crush:** Low-frequency noise burst + descending sawtooth wave.
     * **Narrator Voice Blips:** *Animal Crossing* / *Undertale* style rapid pitch-modulated voice blips synced with the Burmese typewriter subtitle rendering.
     * **Victory Bait:** Major triad arpeggio (`C4 - E4 - G4 - C5`) interrupted abruptly by a heavy crash.
2. **Visual Style:**
   * Hand-drawn / rustic cartoon aesthetic inspired by *Machinarium* and *Die Again*, using warm earthy and golden tones contrasted with slapstick red/white impact flashes on death.
3. **Burmese Numeral Helper:**
   * Implement a utility function to convert standard integers into Burmese digits (`0-9` $\rightarrow$ `၀-၉`) for dynamic UI/dialogue strings.

---

## 6. Agent Implementation Roadmap (Step-by-Step)

1. **Step 1: Core Engine & State Setup**
   * Initialize viewport ($1280 \times 720$ aspect ratio), game state manager, Death Counter HUD, Inventory bar, and Subtitle/Narrator system with Burmese font styling.
2. **Step 2: Scene 0 (Intro) & Scene 1 (Platforming Troll)**
   * Build A/D or Arrow-key movement + Spacebar jump for Chapter 1. Implement the invisible block collider, rocket platform trap, and left-wall push detection.
3. **Step 3: Scene 2 (Cave & Steam Puzzle)**
   * Implement item pickup, inventory combination (`betel_cutter` + `torn_bottle` $\rightarrow$ `half_bottle`), 9-grid rotatable pipe UI, heavy spike death, and steam trap death.
4. **Step 4: Scene 3 (Statue Scale Puzzle)**
   * Implement drag-and-drop weights onto scale pans, wall inscription scratching with `betel_cutter`, weight kicking, laser eye death, and scale smash death.
5. **Step 5: Scene 4 (Safe Riddle) & Scene 5 (Treasure Bait)**
   * Implement 3-digit dial UI, `4-2-3` scissor trap, `dried_chili` keyhole interaction, and the falling `"VICTORY!"` stone block in Chapter 5.
6. **Step 6: Big Reveal & Evasive Game Over Screen**
   * Implement camera zoom-out reveal, U Gyi's appearance, dynamic death count dialogue, and the cursor-dodging `[ Play Again ]` button.