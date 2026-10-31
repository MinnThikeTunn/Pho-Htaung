# Chapter 4 (Guardian Ape Arena) — Implementation Plan & Specification

**Document Version:** 1.0.0  
**Status:** Approved for Implementation  
**Scene Scope:** [`ArenaChapterScene.ts`](file:///D:/game/src/scenes/ArenaChapterScene.ts), [`arena.ts`](file:///D:/game/src/domain/arena.ts), [`ArenaView.ts`](file:///D:/game/src/view/ArenaView.ts), [`chapter4.ts`](file:///D:/game/src/content/chapter4.ts)

---

## 1. Overview & Architectural Principles

This document specifies the concrete technical implementation of the Chapter 4 enhancements for *Phoe Htaung: Die Again in the Golden City*.

### Core Invariants Maintained
1. **Universal Walkable Baseline:** `groundY = 576px` on $1280 \times 720$ canvas. Subterranean bedrock down to $720\text{px}$.
2. **Preserved Shortcuts:**
   - <kbd>Q</kbd>: Slingshot (hold to charge, release to shoot)
   - <kbd>S</kbd>: Punch / Shove (close-quarters melee attack)
   - <kbd>W</kbd>: Dodge / Roll (quick evasion)
   - <kbd>Space</kbd>: Jump (pillar hurdle)
   - <kbd>C</kbd>: Crawl (duck under stone arch)
   - <kbd>A</kbd> / <kbd>D</kbd>: Locomotion (move left / move right)
   - <kbd>B</kbd> / <kbd>Tab</kbd>: Traditional Shan shoulder bag (*Lwe-Ait*) toggle
   - <kbd>E</kbd>: Universal mouth / ground pickup verb
3. **Pure Diegetic Guidance (Strict):**
   - Zero on-screen shortcut banners or intrusive popups on startup.
   - U Gyi delivers all shortcut guidance, warnings, and combat tips through his overhead speech balloon (`top: 14%`).
4. **Authentic 3-Route Multi-Winning Architecture:**
   - **Route 1:** Canonical Combat (Slingshot + Refills + Defeat both apes).
   - **Route 2:** Athletic Speedrun Bypass (Pillar jump + Arch crawl + Timing slip-past without firing).
   - **Route 3:** Secret Troll / Environmental Collapse Route (3x friendly-fire brawl + Arch keystone cave-in).

---

## 2. File-by-File Technical Blueprint

### A. Content & Dialogue ([`src/content/chapter4.ts`](file:///D:/game/src/content/chapter4.ts))
Expand `ARENA_LINES` with contextual lines where U Gyi teaches shortcuts dynamically during gameplay:

```typescript
export const ARENA_LINES = {
  entry: 'ဟေ့ ဖိုးထောင်... ပြေးဖို့ A/D၊ ခုန်ဖို့ Space သုံး! အနားကပ်လာရင် S နဲ့ လက်သီးထိုး၊ ကျောက်ခဲပစ်ဖို့ Q ကို သုံးစမ်း!',
  empty: 'ကျောက်ခဲကုန်ပြီဟေ့! ဘေးက ကျောက်ပုံနားပြေးပြီး E နဲ့ ပြန်ကောက်စမ်း!',
  nearPile: 'အဲဒီ ကျောက်ပုံနားမှာ E ကို နှိပ်ပြီး ကျောက်ခဲ ပြန်ဖြည့်လိုက်ဦး!',
  lowAmmo: 'ကျောက်ခဲ နည်းနေပြီနော်... ဘေးက ကျောက်ပုံနား ပြေးကပ်ပြီး ပြန်ဖြည့်ထားဦး!',
  idleWithSling: 'ရပ်မနေနဲ့လေ... Q ကို ဖိဆွဲပြီး အဝေးက လှမ်းပစ်ပေတော့!',
  idleFists: 'အညိုကောင် အနားကပ်လာရင် S နဲ့ လက်သီးထိုးပြီး ခွာထုတ်လိုက်!',
  meleeWindup: 'အညိုကောင် လက်မြှောက်ပြီ — W နဲ့ အမြန် ရှောင်တိမ်းလိုက် သို့မဟုတ် ကျောက်တိုင်ပေါ် ခုန်တက်!',
  throwWindup: 'မီးခိုးကောင် ကျောက်ခဲချိန်နေပြီ — C နဲ့ ကျောက်တန်းအောက် ငုံ့လျှိုပုန်းလိုက်!',
  apeOpen: 'ဟော... လူဝံ မောပြီး ရပ်သွားပြီ! အခု Q ကို ဖိဆွဲပြီး အမြန် ပစ်ထည့်လိုက်!',
  friendlyFire: 'ဟားဟား... လူဝံချင်း အချင်းချင်း ထိကုန်ပြီဟေ့! နောက်ထပ် ထိအောင် ဆွပေးလိုက်!',
  brawl: 'ဟောဗျာ... လူဝံနှစ်ကောင် အချင်းချင်း ထိုးကုန်ကြပြီ! ကျောက်တန်းဆီ ပြေးပြီး ထွက်ပေါက်ရှာပေတော့!',
  obstacleOutplay: 'ဟားဟား... ကျောက်တန်းနဲ့ တိုက်မိပြီး အညိုကောင် မူးသွားပြီဟေ့! အခု အမြန် ပစ်ထည့်လိုက်!',
  obstacleDrop: 'ဟော... အညိုကောင် အတားအဆီး ချလိုက်ပြီ! ခုန်ကျော် သို့မဟုတ် C နဲ့ ငုံ့ရှောင်နော်!',
  nearArch: 'အဲဒီ ကျောက်တန်းအောက်က C နဲ့ ငုံ့လျှိုဝင်လိုက်ရင် အညိုကောင် ဝင်ဆောင့်မိလိမ့်မယ်!',
  collapseWon: 'ဟားဟား... ကျောက်ခဲမလိုဘူးဟေ့! ကျောက်တိုင်ကြီး ပြိုကျပြီး လူဝံနှစ်ကောင်လုံး ပိကုန်ပြီ! ညာဘက်ထွက်ပေါက်ဆီ သွားတော့!',
  speedrunWon: 'ဟောဗျာ... တစ်ချက်မှ မပစ်ဘဲ ကျော်ပြေးလာတာ အတော်သွက်ပါလား! ထွက်ပေါက်ဆီ ဆက်သွားတော့!',
  won: 'လူဝံနှစ်ကောင်လုံး လဲပြီဟေ့! ဟော... မြေပြင်ပေါ်မှာ ရွှေထုပ်တစ်ထုပ် ပေါ်လာပါလား! ညာဘက်ထွက်ပေါက်ဆီ သွားတော့!',
  greedTaunt: '“မင်းက လောဘကြီးတာကိုး လူလေးရဲ့!”',
  health: 'ဖိုးထောင် ဒဏ်ရာများနေပြီ! W နဲ့ အချိန်မှန် ရှောင်ပြီး အဝေးကနေပဲ ချောင်းပစ်ပါ!',
  timeout: 'တံခါးပိတ်သွားပြီကွဲ့... လက်သီးသက်သက်နဲ့ အချိန်မလောက်ဘူး၊ လောက်လေးခွ သို့မဟုတ် အောက်လမ်းကို သုံးရမယ်!',
} as const;
```

---

### B. Pure Domain Logic ([`src/domain/arena.ts`](file:///D:/game/src/domain/arena.ts))

#### 1. Route Identification
```typescript
export type ArenaWinRoute = 'CANONICAL' | 'SPEEDRUN_BYPASS' | 'ENVIRONMENTAL_COLLAPSE';

export interface ArenaAttempt {
  // Existing state properties...
  winRoute?: ArenaWinRoute;
  archDurability: number; // starts at 3, decrements on ape headbonks or rock collisions
  archCollapsed: boolean;
}
```

#### 2. Speedrun Bypass Verification
If Phoe Htaung parkours past the fallen pillar ($x=380$) and stone arch ($x=580$) during an ape recovery, stun, or brawl window, and crosses $x \ge A4.exitX$ ($1220\text{px}$):
```typescript
if (!a.combatWon && p.centerX >= A4.exitX && p.grounded) {
  const brown = a.apes.find(e => e.id === 'brown');
  const silver = a.apes.find(e => e.id === 'silver');
  const apesDistracted = (brown?.phase === 'RECOVER' || brown?.phase === 'STUN' || brown?.phase === 'BRAWL' || brown?.hp === 0) &&
                         (silver?.phase === 'RECOVER' || silver?.phase === 'STUN' || silver?.phase === 'BRAWL' || silver?.hp === 0);
  if (apesDistracted) {
    a.combatWon = true;
    a.winRoute = 'SPEEDRUN_BYPASS';
    a.events.push('won');
  }
}
```

#### 3. Environmental Collapse Route
When the arch durability reaches 0 through baiting Brown Ape charges or Silver Ape rock strikes into the central arch:
```typescript
export function triggerArchCollapse(a: ArenaAttempt) {
  a.archCollapsed = true;
  a.combatWon = true;
  a.winRoute = 'ENVIRONMENTAL_COLLAPSE';
  for (const ape of a.apes) {
    ape.hp = 0;
    ape.phase = 'DOWN';
  }
  a.events.push('won');
}
```

#### 4. Settlement Compatibility
Update `settleArena()` so non-slingshot completions for `SPEEDRUN_BYPASS` and `ENVIRONMENTAL_COLLAPSE` settle cleanly into the campaign without throwing exceptions.

---

### C. Visual Layer ([`src/view/ArenaView.ts`](file:///D:/game/src/view/ArenaView.ts))

1. **Silver Ape Retreat & Hop Animation:**
   - Detect retreat motion (`isMoving && e.id === 'silver'`).
   - Procedurally apply knuckle-step bob:
     ```typescript
     const hopFreq = 11;
     const hopPhase = clock * hopFreq;
     offsetY = -Math.abs(Math.sin(hopPhase)) * 4.5;
     multY = 1 + Math.sin(hopPhase * 2) * 0.04;
     ```
   - On `STRIKE` (rock launch), apply a sharp arm-fling squash-and-stretch before returning to `RECOVER`.

2. **Environmental Collapse Rendering:**
   - When `a.archCollapsed` is true, render fallen lintel blocks and persistent dust particle plumes over the central archway, with the apes trapped comically beneath.

---

### D. Audio & Scene Orchestration ([`src/scenes/ArenaChapterScene.ts`](file:///D:/game/src/scenes/ArenaChapterScene.ts))

1. **Audio Integration:**
   - Brown Ape `meleeWindup` $\rightarrow$ `soundEngine.playMadGrunt()`.
   - Silver Ape rock throw $\rightarrow$ `soundEngine.playWoosh()`.
   - Ape collision into stone lintel $\rightarrow$ `soundEngine.playBonk()`.
   - Thrown rock impacts on stone $\rightarrow$ `soundEngine.playBrickRattle()` / `playClang()`.
   - Brawl impacts $\rightarrow$ `soundEngine.playStickWhack()`.
2. **UI Polish:**
   - Remove duplicate top-bar emoji bag button. Keep bottom-docked Shan Bag as sole inventory controller.
   - Suppress startup popup modal; rely exclusively on U Gyi's overhead speech balloon.
   - Format timer and ammo with Burmese numerals while keeping test locator compatibility.
