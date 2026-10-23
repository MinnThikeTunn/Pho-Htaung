# Phoe Htaung — Chapter 1 ပြန်လည်ရေးသားထားသော Specification

**အခန်းအမည်:** ဦးကြီး၏ ကျောက်တုံးချစက်
**Revision:** 0.3 — technical handoff linked; geometry/timings unchanged; playable validation pending
**နေ့စွဲ:** 2026-10-17
**Source:** `game_technical_specification.md` ၏ `CHAPTER_1` ကို အစားထိုးရန် သီးခြားရေးသားထားခြင်း။ မူလဖိုင်ကို မပြင်ထားပါ။

AI implementation read order: [docs/README.md](docs/README.md)။ Revision 0.3 သည် engineering/asset/test contracts နှင့်ချိတ်ပြီး အခန်း ၂ မရှိသေးသော prototype ၏ရပ်မည့်နေရာကိုရှင်းထားခြင်းသာဖြစ်သည်။ Revision 0.2 ၏ geometry၊ movement၊ attack timings၊ coin values နှင့် A01–A31 ကိုမပြောင်းထားပါ။

## 1. Scope နှင့် အဓိကဆုံးဖြတ်ချက်

ဤစာရွက်သည် ပထမအခန်း၊ ပထမအခန်း၏ retry/practice၊ currency settlement နှင့် `CHAPTER_2` သို့ကူးသည့် interface ကို သတ်မှတ်သည်။ Game code၊ အခန်း ၂–၅ ၏ gameplay၊ shop၊ အကြွေးပမာဏ၊ နောက်ဆုံး ending တို့ကို ဤ revision တွင် မရေးသားပါ။

ပထမအခန်း၏ အဓိကကစားဟန်မှာ **ဦးကြီးချသည့်ကျောက်တုံးကို ရှောင်ပြီး၊ ကျောက်တုံးနှင့် ပြောင်းလဲသွားသောပတ်ဝန်းကျင်ကို အသုံးချကာ လမ်းဖန်တီးခြင်း** ဖြစ်သည်။ ထွက်ပေါက်ရောက်ရန် ဝှက်ထားသော hotspot တစ်ခုကို ရှာတွေ့ရမည့်ပုံစံ မဟုတ်ပါ။

ဤ revision တွင် မူလ Chapter 1 ၏ invisible block၊ rocket ground၊ ceiling spikes၊ left-wall tunnel၊ checkpoint flag တို့ကို ဖယ်ပြီး အောက်ပါသတ်မှတ်ချက်ဖြင့် အစားထိုးသည်။ လမ်းနည်းအသစ်တစ်ခုသည် ဤကမ္ဘာ၏စည်းမျဉ်းများနှင့်ကိုက်ပါက ခွင့်ပြုရမည်။ Canonical walkthrough တစ်ခုအတိုင်းလုပ်ခြင်းကို အောင်မြင်မှု condition မလုပ်ရ။

**Design constraints**

- ဦးကြီးနှင့် ဖိုးထောင်၏ မြန်မာဟာသ၊ အကြွေးရှင်ပြေးဇာတ်ကောင်ပုံစံကို ဆက်ထားရန်။ ဝင်ပူးခြင်း၊ magic command၊ supernatural ability မထည့်ရန်။
- ကစားသူကို မဖြစ်မနေသေခိုင်းသော tutorial မရှိရန်။
- အန္တရာယ်ကို ဖတ်နိုင်ရမည်။ ဦးကြီး၏စကားက လိမ်နိုင်သော်လည်း visual telegraph က မလိမ်ရ။
- ငွေမရှိ၊ ရွှေမယူနိုင်၊ taunt မသုံးလည်း အခန်းကျော်နိုင်ရမည်။
- Currency၊ shop၊ dialogue သည် အခြေခံကစားရမှုအားနည်းခြင်းကို ဖုံးရန် မသုံးရ။
- Unique/fun/replayable ဟူသော အကဲဖြတ်ချက်သည် playtest gate ဖြစ်သည်။ ဤစာရွက်ရေးပြီးခြင်းဖြင့် သက်သေပြပြီးဟု မယူရ။

## 2. ဇာတ်လမ်း၊ ပန်းတိုင်၊ အောင်မြင်မှု

ဖိုးထောင်သည် အကြွေးဆပ်ရန် ရွှေမြို့တော်ရှာဖို့ ဦးကြီးနောက်လိုက်လာသည်။ ဤအခန်းထဲဝင်လာသောအခါ နောက်ပြန်ထွက်တံခါးပိတ်သွားသည်။ ဦးကြီးက လမ်းပြသလိုပြောနေသော်လည်း ကျောက်တုံးချစက်က ဖိုးထောင်ကို ပစ်မှတ်ထားလာသည်။ ကစားသူသည် ဖြစ်ရပ်မှ ဦးကြီးကို သံသယဝင်လာမည်။ ဦးကြီးကိုယ်ခန္ဓာကို ဤအခန်းတွင် မပြသေးပါ။

**Main objective:** အသက်ရှင်လျက် ညာဘက်လှေကားတံခါးသို့ ရောက်ရန်။

**Optional objective:** ပုံမှန်ဒင်္ဂါး ၅ ခုနှင့် အပိုဒင်္ဂါးအိတ် ၁၀ ခု၊ စုစုပေါင်း ၁၅ ခုကိုယူပြီး အောင်မြင်စွာထွက်ရန်။

**Win condition:** Player alive ဖြစ်ပြီး grounded ဖြစ်ရမည်။ Feet Y = 640 ဖြစ်ကာ center X >= 1234 သို့ရောက်လျှင် complete ဖြစ်သည်။ Gate ဖျက်ထားခြင်း၊ plate ဖိထားခြင်း၊ shelf ပျက်ထားခြင်း၊ ငွေအနည်းဆုံးပမာဏတို့ကို ထပ်မတောင်းရ။

ထွက်ပေါက်သည် **အခန်းမှထွက်သောတံခါး** ဖြစ်သည်။ Game တစ်ခုလုံးမှ လွတ်မြောက်ပြီးသည့် ending မဟုတ်ပါ။ Upper route ဖြင့် gate အပေါ်မှကျော်သွားလည်း အောင်မြင်သည်။

## 3. Platform၊ coordinates၊ input

- ပထမ implementation target: desktop web၊ keyboard control။ Reference framework: Phaser 3။ Engine ပြောင်းသော်လည်း အောက်ပါ logical units နှင့် event contracts ကို တူညီစွာလိုက်နာရန်။ Mobile touch controls သည် ဤ revision ၏ scope မဟုတ်ပါ။
- Logical viewport/world: **1280 × 720 px**၊ camera တစ်ခု၊ scrolling မရှိ။
- Origin `(0,0)` သည် အပေါ်ဘယ်ထောင့်။ X သည် ညာဘက်သို့တိုး၊ Y သည် အောက်သို့တိုးသည်။
- Screen ကို aspect ratio ထိန်း၍ scale/letterbox လုပ်ရန်။ Physics coordinates နှင့် timers ကို CSS pixel သို့မဟုတ် monitor refresh rate ဖြင့် မပြောင်းရန်။
- Gameplay simulation: fixed **60 steps/second**။ Hidden tab၊ pause၊ result၊ death freeze တွင် attack/physics/attempt clocks ရပ်ရန်။
- Collision rectangles ကို အောက်တွင် top-left X/Y၊ width/height ဖြင့်ရေးထားသည်။ Player spawn ကို center X/feet Y ဖြင့်ရေးထားသည်။

| Input | Action | စည်းမျဉ်း |
|---|---|---|
| A / Left | ဘယ်ရွေ့ | ခလုတ်ကိုင်ထားချိန်သာရွေ့ |
| D / Right | ညာရွေ့ | ဘယ်နှင့်ညာတစ်ပြိုင်နက်ကိုင်လျှင် horizontal input = 0 |
| Space | ခုန် | Grounded/coyote window အတွင်း တစ်ကြိမ်ခုန်နိုင် |
| E | ဦးကြီးကိုဆွ | Grounded + machine READY + player FREE ဖြစ်မှသာ |
| Esc | Pause/resume | Resume တွင် held inputs ကိုရှင်းရန် |
| R ကို 0.5 s ကိုင် | လက်ရှိအခန်းပြန်စ | Unbanked coins/world reset; wallet မရှင်း၊ death မတိုး |

Chapter 1 တွင် point-and-click hotspot၊ drag-and-drop inventory၊ item combine မရှိပါ။ ကျောက်တုံးတွန်းရန် သီးခြားခလုတ်မလိုပါ။ Grounded ဖြစ်ချိန် settled stone ဆီ ဆက်လျှောက်ခြင်းဖြင့် တွန်းသည်။

## 4. Canonical layout A — တိကျသောနေရာချထားပုံ

### 4.1 Static entities

| ID | X | Y | W | H | Behavior |
|---|---:|---:|---:|---:|---|
| `ground` | 0 | 640 | 1280 | 80 | Indestructible solid floor; pit မရှိ |
| `fixed_step` | 480 | 544 | 112 | 96 | Indestructible solid step; raised lift သို့ကူးရန် |
| `pressure_plate` | 336 | 632 | 128 | 8 | Nonblocking sensor; chain သည် lift နှင့်မြင်သာစွာချိတ်ထား |
| `lift` | 640 | 544 initially | 128 | 16 | Solid moving platform; raised top Y = 424 |
| `gold_shelf` | 824 | 320 | 144 | 16 | Breakable wood; အပိုဒင်္ဂါးအိတ်ကို ထမ်းထား |
| `wood_gate` | 1104 | 360 | 64 | 280 | Breakable wood barrier; top ပေါ်တက်နင်းနိုင် |
| `exit_zone` | 1216 | 576 | 64 | 64 | Win condition ဖြင့်သာ complete |
| `entry_gate_visual` | 0 | 360 | 24 | 280 | နောက်ပြန်ထွက်လမ်းပိတ်ကြောင်းပြသော decoration |

- World left/right boundary သည် မြင်ရသောနံရံဖြစ်သည်။ Actor bodies ကို world အတွင်းထားရန်။
- `fixed_step` သည် lower path ပေါ်၌တည်ရှိ၍ ကစားသူက ခုန်ကျော်ရန်လိုသည်။ Decorative prop မဟုတ်ပါ။
- Gantry/rail သည် Y = 64–128 တွင်မြင်ရမည်။ Player အတွက် hidden ceiling collider မဖြစ်ရ။
- Shelf နှင့် gate ကြား horizontal gap သည် **136 px** ဖြစ်သည်။ ကျောက်တုံးအကျယ် 96 px ထက်ကြီးသောကြောင့် drop တစ်ခုတည်းဖြင့် နှစ်ခုလုံးမထိနိုင်ပါ။ ပိုကောင်းသောနည်းတစ်ခုကို script ဖြင့်တားခြင်းမဟုတ်ဘဲ geometry ဖြင့်ကွာခြားစေခြင်းဖြစ်သည်။

### 4.2 Player နှင့် currency positions

| Entity | Position | Value |
|---|---|---:|
| Player | center X = 96, feet Y = 640 | — |
| `coin_01` | center (160, 616), radius 10 | 1 |
| `coin_02` | center (208, 616), radius 10 | 1 |
| `coin_03` | center (256, 616), radius 10 | 1 |
| `coin_04` | center (304, 616), radius 10 | 1 |
| `coin_05` | center (352, 616), radius 10 | 1 |
| `gold_pouch` | center (896, 308), size 24 × 24 | 10 |

Pickup သည် player body နှင့် pickup area overlap ဖြစ်သောအခါ auto collect ဖြစ်သည်။ Pickup ID တစ်ခုကို attempt တစ်ခုတွင် တစ်ကြိမ်သာရမည်။ Coins သည် pressure plate အလေးမဖြစ်ပါ။

`gold_pouch` သည် shelf intact ဖြစ်နေချိန် shelf နှင့်အတူနေသည်။ Shelf ပျက်လျှင် gravity ဖြင့်အောက်ကျသည်။ Ground တွင် center Y = 628 သို့ရောက်လျှင်ရပ်သည်။ Pouch သည် stone/player/အခြား platform များနှင့် physical collision မဖြစ်ပါ။ ကျောက်တုံးအောက်ရောက်သွားလည်း မပျောက်၊ ငွေမလျော့ပါ။ ကျောက်တုံးဖယ်ပြီး ကောက်နိုင်ရမည်။ Blocked pickup ကို glow/outline ဖြင့်မြင်နိုင်ရမည်။

## 5. Player movement constants

| Parameter | Value |
|---|---:|
| Collision body | 36 × 56 px |
| Ground/air horizontal speed | 220 px/s |
| Gravity | 1200 px/s² |
| Jump launch vertical velocity | -570 px/s |
| Maximum downward speed | 900 px/s |
| Coyote time | 0.08 s |
| Jump input buffer | 0.10 s |
| Grounded push speed | 90 px/s |
| Taunt movement lock | 0.35 s |

- Air steering နှင့် key release ပေါ်မူတည်၍ horizontal velocity ကိုချက်ချင်းပြောင်းနိုင်သည်။ ဤအခန်းတွင် acceleration၊ ice၊ dash၊ double jump၊ variable-height jump မထည့်ရ။
- Jump ကိုကိုင်ထားခြင်းဖြင့် ထပ်ခုန်မနေစေရ။ နောက်တစ်ကြိမ်ခုန်ရန် release/press အသစ်လိုသည်။
- Player control state သည် `FREE / TAUNTING / DEAD / EXITING` လေးမျိုးဖြစ်သည်။ Spawn = FREE; valid E = TAUNTING; 0.35 s ပြီးလျှင် FREE; death latch = DEAD; completion latch = EXITING။ Pause သည် state ပြောင်းခြင်းမဟုတ်ဘဲ simulation ရပ်ခြင်းဖြစ်သည်။
- Grounded contact အတွက် landing surface နှင့် horizontal overlap အနည်းဆုံး 8 px ရှိရမည်။ Horizontal edge ကိုလွန်ပြီးနောက် coyote time ကိုသုံးနိုင်သည်။
- Static solids နှင့် stone များ၏ side collision ကိုအသိအမှတ်ပြုရန်။ Full-speed walking ဖြင့် block အတွင်းမဝင်ရ။
- သစ်သားပျက်ခြင်းကြောင့် လမ်းဖွင့်ပြီးကျန်သော noncolliding dust/debris သည် 0.25 s အတွင်းရှင်းရမည်။ အန္တရာယ်အသစ်တစ်ခု မဖြစ်ရ။

## 6. ဦးကြီး၏ attack cycle နှင့် taunt

### 6.1 States နှင့် အချိန်

| State | Duration / transition | Action |
|---|---|---|
| `READY` | First activation: 4.0 s; subsequent cycles: 2.0 s | အချိန်ပြည့်လျှင် TRACK; valid E ဖြင့်စောစွာ TRACK သို့ကူး |
| `TRACK` | 0.55 s | Player center X ကိုလိုက်သည့် dashed footprint; gantry သည် logical aiming X ကိုလိုက် |
| `LOCKED` | 0.85 s | X ကိုမပြောင်းတော့; footprint က solid outline ဖြစ်ပြီး lock sound တစ်ကြိမ်မြည် |
| `DROP` | Falling rock resolve ဖြစ်သည်အထိ | Rock bottom Y = 128 မှ zero vertical velocity ဖြင့် gravity သုံး၍ချ |
| `RECOVER` | 0.80 s | Winch reloading visual; E ကိုမလက်ခံ; ပြီးလျှင် READY |

- First activation သည် scene load မဟုတ်ဘဲ ပထမ gameplay move/jump/valid taunt input ဖြစ်သည်။ Attempt timer လည်းထိုအချိန်မှစသည်။
- Target center X = player center X ကို **[64, 1168]** အတွင်း clamp လုပ်ထားသောတန်ဖိုး။ LOCKED ဝင်ချိန်၌ snapshot ယူပြီး drop မပြီးမချင်းမပြောင်းရ။
- စက်မှ shot တစ်ခုထက်ပို၍ တစ်ပြိုင်နက်မချရ။ Push ကြောင့် အခြားstone ပြုတ်ကျခြင်းသည် သီးခြား world physics ဖြစ်နိုင်သည်။
- TRACK/LOCKED visual သည် ကျောက်တုံးအကျယ် 96 px ရှိသော footprint နှင့် ပထမဆုံးထိမည့် surface ကိုပြရမည်။ အမှတ်အသားတစ်စက်သေးသေးသာ မပြရ။ Surface ပျက်၍ ဆက်ကျနိုင်ကြောင်း dotted continuation ကိုပြရန်။
- Color တစ်ခုတည်းဖြင့် TRACK/LOCKED မခွဲရ။ Dashed/solid outline နှင့် sound ကိုတွဲသုံးရန်။
- HUD တွင် READY သည် E available ဟုဖော်ပြ၍ အခြားအခြေအနေတွင် inactive ပြရန်။

### 6.2 E — ဆွခြင်း

Valid E ကို press-edge တစ်ကြိမ်အဖြစ်လက်ခံသည်။ Player သည် grounded + FREE၊ machine သည် READY ဖြစ်ရမည်။ လက်ခံလျှင် machine ကို TRACK သို့ချက်ချင်းကူးပြီး ဖိုးထောင်ကို 0.35 s taunt animation ပြသည်။ ထို 0.35 s အတွင်း walking/jump မလုပ်နိုင်သော်လည်း standing platform movement ကိုလိုက်သည်။

Taunt အတွင်းဖြစ်စေ၊ machine အခြားstate အတွင်းဖြစ်စေ နှိပ်သည့် E ကို ignore လုပ်ရန်။ နောက် cycle အတွက် queue မလုပ်ရ။ E ကိုကိုင်ထားခြင်းဖြင့် auto repeat မဖြစ်ရ။

Taunt သည် currency မကုန်၊ ရန်သူအားနည်းသွားခြင်းမရှိ၊ invulnerability မပေး၊ ပစ်မှတ်ကို magic ဖြင့်ရွေးခြင်းမဟုတ်ပါ။ သုံးစရာမလိုဘဲ automatic attack ကို အသုံးချ၍ အခန်းကျော်နိုင်ရမည်။

## 7. Stone၊ wood၊ plate၊ lift စည်းမျဉ်းများ

### 7.1 Stone properties နှင့် recovery

- Stone collision size: **96 × 96 px**။ Mass label: **50 kg**။ Body density ကို engine-specific tuning ဖြင့်မပြောင်းစေဘဲ အောက်ပါ scripted arcade rules ကိုလိုက်နာရန်။
- `FALLING` stone သည် player body ကိုထိလျှင် သေသည်။ `SETTLED` / `SUPPORTED` stone သည် nonlethal solid ဖြစ်၍ တက်နင်း/တွန်းနိုင်သည်။ လှုပ်ရှားပုံနှင့် outline ကနေ state ကိုခွဲသိနိုင်ရမည်။
- Falling stone ထိသော wood ကိုဖျက်ပြီး ဆက်ကျသည်။ Velocity ကိုပြန် zero မလုပ်ရ။ Swept collision အတွင်း ကျန်ရှိသော distance ကို ဆက်စစ်ရန်။
- **Falling stone တစ်တုံးက အခြားstone တစ်တုံးကိုထိလျှင် နှစ်တုံးလုံးကြေကွဲ၍ ဖယ်ရှားသည်။** Stone နှစ်တုံးကို အမြင့်တင်ပြီး stack လုပ်ခွင့်မရှိ။ Side-pushing contact သည် ကြေကွဲခြင်းမဖြစ်ရ။
- ဤကြေကွဲစည်းမျဉ်းက လမ်းပိတ်နေသောကျောက်တုံးကို ဦးကြီး၏နောက် shot ဖြင့်ရှင်းနိုင်စေသည်။ နှစ်တုံးကြေကွဲမည့်ပစ်မှတ်တွင် crack icon ကို telegraph ဖြင့်ပြရန်။ Dust သည် nonlethal/noncolliding ဖြစ်သည်။ ဤ rule အတွက် ကိုယ်ပျောက်ခြင်း၊ timer ဖြင့်အကြောင်းမဲ့ပျောက်ခြင်း မသုံးရ။
- Falling stone တစ်တုံးက metal/ground/lift ပေါ်ကျလျှင် support ရရှိပြီး nonlethal solid ဖြစ်လာသည်။ Moving lift ပေါ်ကျသောstone သည် lift နှင့်အတူရွေ့သည်။
- Support မရှိတော့သောstone သည် FALLING ပြန်ဖြစ်သည်။ Push ဖြင့် edge ကျော်သွားသည့်stone ၏ horizontal velocity ကို 0 သို့ပြောင်းပြီး ဆက်ကျသည်။ မိမိတွန်းချသောတုံးကြောင့်လည်း ထိခိုက်နိုင်သည်။
- Push သည် grounded player က settled stone နှင့် side contact ရှိ၍ အဲဒီဘက်ကိုလျှောက်သောအခါလုပ်သည်။ Touching settled stones များကို chain အဖြစ် တူညီသော 90 px/s ဖြင့်တွန်းနိုင်သည်။ Static barrier တွင်ရပ်၍ penetration မဖြစ်ရ။
- Stone များကို timer/cap ဖြင့် silent delete မလုပ်ရ။ Ground ပေါ်တုံးများကို ခုန်ကျော်၊ တွန်းရွှေ့၊ နောက် shot ဖြင့်ကြေကွဲစေနိုင်ရမည်။ No stacking + jump height > stone height + nonlethal flat floor ဖြင့် ground buildup ကို recover လုပ်နိုင်အောင်သတ်မှတ်ထားသည်။

### 7.2 Wood

`wood_gate` နှင့် `gold_shelf` ကို FALLING stone ၏ swept body က horizontal overlap အနည်းဆုံး 8 px ဖြင့်ထိလျှင် တစ်ချက်တည်းဖျက်သည်။ Walking/pushing settled stone၊ player body၊ jump တို့က wood ကိုမဖျက်ပါ။

Wood destruction သည် current attempt အတွင်း permanent ဖြစ်သည်။ Gate ပျက်ပြီးနောက်လည်း ပစ်မှတ်များလာနိုင်သော်လည်း gate ပြန်မဆောက်ရ။ Shelf ပျက်သောအခါ purse ကိုဖယ်မပစ်ရ။

### 7.3 Pressure plate

- Threshold: **25 kg**။ Player = 10 kg၊ stone = 50 kg၊ coins = 0 kg။ Player တစ်ယောက်တည်းရပ်ခြင်းဖြင့် lift မတက်ရ။
- Ground-supported stone ၏ bottom Y = 640 ± 1 px ဖြစ်ပြီး plate နှင့် horizontal overlap >= 48 px ဖြစ်လျှင် plate ကိုဖိထားသည်ဟုယူသည်။ Flying stone ကိုမရေတွက်ရ။
- Weighted/unweighted condition ကို physics step တိုင်း လက်ရှိbodies မှပြန်တွက်ရန်။ One-time flag မဖြစ်ရ။
- Pressure plate ပေါ်ကstone ကို တွန်းဖယ်/ကြေကွဲလျှင် pressure ချက်ချင်းလွတ်ပြီး lift ပြန်ဆင်းသည်။ မျက်နှာပြင်၏အလေးအမှတ်နှင့် chain movement ကိုမြင်နိုင်ရမည်။

### 7.4 Lift

- Plate weighted: lift top ကို **Y = 424** သို့ **120 px/s** နှုန်းဖြင့်တက်စေသည်။
- Plate unweighted: **Y = 544** သို့ **80 px/s** နှုန်းဖြင့်ဆင်းစေသည်။
- Standing player/stone ကို platform delta နှင့်အတူသယ်သည်။ Jump လုပ်နေသူကို platform နှင့်မကပ်ရ။
- Descending lift အောက်တွင် stone သို့မဟုတ် player body ရှိလျှင် lift ကို obstruction top minus lift height တွင်ရပ်ထားရန်။ Body ကိုဖောက်မဝင်၊ crush death မဖြစ်ရ။ ဖယ်/ရွှေ့လိုက်လျှင် home position ဆီဆက်ဆင်းသည်။
- Lift တက်နေချိန် carried player/stone သည် static solid နှင့်ထိလျှင် lift ရပ်ရမည်။ Actor ကို solid ထဲထိုးမထည့်ရ။ အကြောင်းမဲ့ crush/teleport မလုပ်ရ။
- မြင့်သွားသောlift သို့ `fixed_step` မှခုန်တက်နိုင်ရမည်။ အောက်က grounded player အတွက် home lift bottom Y = 560 နှင့် floor Y = 640 ကြား gap 80 px သည် player height 56 ထက်ကြီး၍ ဖြတ်သွားနိုင်သည်။

## 8. Collision/event ordering

Object coordinates ကို physics timestep တစ်ခုချင်းစီ၌ အောက်ပါအစီအစဉ်ဖြင့် resolve လုပ်ရန်။

1. Input/AI clocks → valid taunt → TRACK/LOCKED/DROP transitions။
2. Player/stone/lift movement နှင့် swept collision candidate များတွက်ရန်။ Frame အဆုံး overlap တစ်ခုတည်းကိုမယုံရ။
3. Falling collision ကို time-of-impact အစောဆုံးမှစစ်ရန်။ Wood hit လျှင်ဖျက်ပြီး ကျန် trajectory ကိုဆက်စစ်၊ stone hit လျှင် နှစ်တုံးဖယ်၊ player hit လျှင် death latch လုပ်သည်။ တူညီ time-of-impact တွင် player hit ကို win/pickup ထက်အရင်လုပ်ရန်။
4. Support changes၊ plate weight၊ lift target update။ Removal events ကို batch လုပ်၍ stale object references မသုံးရ။
5. Player alive ဖြစ်မှ pickup collect။
6. Player alive ဖြစ်မှ exit check / completion latch / settlement။

Death/completion latch ဖြစ်ပြီးနောက် တူညီstep တွင် အသစ်သော input၊ pickup၊ shot၊ settlement ကိုမလက်ခံရ။ Falling stone resolve တစ်ခါပြီးသားကို နောက်frame ထပ်မရေတွက်ရ။

## 9. ပထမကစားချိန်၊ HUD၊ မြန်မာဟာသ

### 9.1 Tutorial နှင့် UI

- Scene စချိန် controls strip ကိုပြ၍ ပထမmove input မှ AI/attempt timer စတင်သည်။ Gameplay ကို voiceover အဆုံးထိစောင့်ခိုင်းခြင်းမရှိ။
- First lock sound တွင် `ပစ်မှတ်ရပ်သွားရင် ရှောင်!` hint ကို 2.0 s ပြ။
- First stone settle တွင် `ရပ်သွားတဲ့တုံးကို တက်နင်း၊ တွန်းလို့ရတယ်` hint ကို 2.0 s ပြ။
- First stone-on-stone predicted hit တွင် `တုံးနှစ်တုံးထိရင် ကြေတယ်` hint ကို 2.0 s ပြ။
- Hints သည် campaign တစ်ခုတွင် တစ်ကြိမ်သာပြသည်။ Settings မှ hints ပြန်ဖွင့်နိုင်သည်။ Preset A first clear မတိုင်မီ replay variants မတင်ရ။
- HUD: current attempt coins `စုထား: X/၁၅`၊ campaign wallet `သိမ်းပြီး: Y`၊ global deaths၊ attempt elapsed time၊ E READY status။ စုထား/သိမ်းပြီး ကိုရောမပြရ။
- Inventory bar ကို Chapter 1 တွင်ဖျောက်ထားရန်။ Persistent inventory ကိုမဖျက်ရ။
- `Noto Sans Myanmar` သို့မဟုတ် `Pyidaungsu` font တစ်ခုကို bundle/load ပြီးမှ layout တိုင်းရန်။ Typewriter သုံးလျှင် combining characters မခွဲစေရန် grapheme segmentation သုံးရန်။ Whole-line subtitle ဖြင့်လည်း implement လုပ်နိုင်သည်။
- Flash/shake သည် aim footprint ကိုဖုံးမသွားရ။ Screen shake max 4 px / 0.15 s; settings မှ off လုပ်နိုင်သည်။

### 9.2 Voice/text lines

| Trigger | Burmese line | Behavior |
|---|---|---|
| First entry | ဒီလမ်းက ရွှေမြို့တော်ကိုရောက်တယ်ကွ! ရှေ့ကိုသာသွား။ | Max subtitle 2.5 s; movement မပိတ် |
| Valid taunt | ဟေ့ ဦးကြီး၊ မထိပါဘူးကွာ! | Player gesture 0.35 s; voice max 0.8 s |
| Gate broken | ဟာ… တံခါးကို ဘာလို့သွားဖျက်တာလဲ! | ဦးကြီးအမှားကို ဟာသလုပ်; once/attempt |
| Plate first weighted | ငါချတဲ့တုံးကို အဲဒီလိုသုံးလို့ရလို့လား! | Once/attempt |
| Shelf broken | အဲဒါ ရွှေထားတဲ့စင်ဟ! | Once/attempt |
| Death | ဒီတစ်ခါတော့ မလွတ်ဘူးကွ! | Max 0.8 s; retry မနှောင့်ယှက် |
| Exit | ရပြီထင်မနေနဲ့ဦး… အောက်မှာတွေ့မယ်! | Max 1.2 s; link movement မပိတ် |

VO တစ်ခုတည်းသာတစ်ချိန်တွင်ပြောရန်။ Repeated taunt/death lines တွင် voice cooldown 3.0 s ထားပြီး gesture/SFX ဆက်လုပ်နိုင်သည်။ Entry line ကို death retry တိုင်းထပ်မပြောရ။ Sound မဖွင့်နိုင်သေးလည်း subtitle/gameplay ဆက်လုပ်ရမည်။ ပထမ user input တွင် audio unlock လုပ်ရန်။

## 10. သေခြင်း၊ retry၊ pause

Death source သည် FALLING stone နှင့် player ထိခြင်းသာဖြစ်သည်။ Spike/pit/hidden instant-death trigger မရှိ။

Death တစ်ကြိမ်တွင် global deathCount နှင့် session deaths ကို တစ်ကြိမ်သာတိုးရန်။ Gameplay/AI ကို 0.25 s impact freeze ပြီး 0.65 s reset transition လုပ်၍ **0.90 s** တွင် control ပြန်ပေးသည်။ Dialogue သည် retry ကိုနောက်ဆွဲခွင့်မရှိ။

Retry တွင် current preset ၏ initial snapshot ကိုအပြည့်ပြန်ထားရန်:

- Player position/velocity/status၊ stones၊ gate/shelf၊ plate/lift၊ pickups၊ pending shot/target/timers၊ attempt coins/time အားလုံး reset။
- Campaign wallet၊ chapter best banked amount၊ global deathCount၊ owned tools၊ completed-attempt receipts၊ hint-seen flags မပြောင်းရ။
- Attempt ID အသစ်ပေးသည်။ Session deaths က chapter session အတွင်းဆက်ရှိသည်။
- Restore ပြီးနောက် ပထမinput မှ attempt clock နှင့် initial READY 4.0 s ကိုစတင်သည်။ Hidden invulnerability နဲ့ရည်ရွယ်ချက်မရှိသော auto attack မရှိ။

Manual R restart သည် အတူတူ restore လုပ်သော်လည်း deathCount မတိုးပါ။ Campaign reset ကို R နှင့်မလုပ်ရ။ Pause/focus loss တွင် pending attack timer အပါအဝင် active time ကိုရပ်ထားရန်။

## 11. Currency၊ records၊ persistent state

### 11.1 One-currency rule

Currency သည် `gold_coin` တစ်မျိုးတည်း။ World တွင်မြင်သောဒင်္ဂါးနှင့် banked wallet တန်ဖိုးတူသည်။ False palace reveal ဖြစ်လာလည်း စုထားသောဒင်္ဂါးကို fake/zero value အဖြစ် မပြောင်းရ။ Game-wide ending ကို သီးခြား specification တွင်ညှိရမည်။

Normal campaign/replay A တွင်သာ currency settlement ရှိသည်။ Practice B/C သည် records သာတင်ပြီး wallet ကိုမတိုးပါ။ ပစ္စည်းဝယ်ခြင်း၊ အသုံးစရိတ်နှင့် price balance ကို Chapter 1 ထဲမထည့်ပါ။ Wallet ကိုနောက်အခန်း/နောက်ပိုင်းဆိုင်က သုံးနိုင်သော interface အဖြစ်ပေးထားသည်။

### 11.2 Banking rule

Campaign တစ်ခုစီတွင် `chapter1BestBankedCoins` = 0 မှစသည်။ Successful A attempt တွင် collected amount သည် previous best ထက်ပိုလျှင် **ပိုလာသောပမာဏသာ** wallet ထဲထည့်သည်။ Best ထက်နည်း/တူလျှင် wallet credit = 0။

ဥပမာ: ပထမclear 5 → +5; နောက်clear 15 → +10; 15 ထပ်clear → +0။ နောက်ပိုင်းငွေသုံး၍ wallet နည်းသွားလည်း banked best ကိုမလျော့ရ။ တူညီငွေကို ပြန်ရယူခွင့်မဖြစ်ရ။

Completion latch ဝင်သောအခါ wallet update၊ chapter best update၊ completed attempt receipt ကို တစ်ခုတည်းသော transaction အဖြစ် persist လုပ်ပြီးမှ fade/link စရမည်။ တူညီ attempt ID ထပ်ရောက်လာလျှင် no-op ဖြစ်ရမည်။ အလယ်တွင် browser reload ဖြစ်လည်း duplicate credit မဖြစ်ရ။

### 11.3 State fields နှင့် ownership

| Field | Ownership | Reset policy |
|---|---|---|
| `campaignId` | Campaign/save | Explicit New Game မှသာအသစ်ဖန်တီး |
| `walletCoins` | Campaign/save | Retry မပြောင်း |
| `chapter1BestBankedCoins` | Campaign/save; 0–15 | Retry/spending မပြောင်း |
| `completedAttemptIds` | Campaign/save | Successful settlement receipts; duplicate commit တား |
| `chapter1Completed` | Campaign/save | First A win တွင် true |
| `deathCount` | Campaign/save | Death တစ်ကြိမ် +1; retry မရှင်း |
| `ownedTools` / original `inventory` | Campaign/save | CH1 တွင်မသုံး၊ မဖျက်; future chapters သို့သယ် |
| `bestResultByPresetAndCoinTotal` | Campaign/save | Successful time records; spending မလျော့ |
| `presetId`, `attemptId`, `attemptCoins`, `collectedPickupIds` | Attempt | Snapshot restore/new attempt တွင်ပြန်စ |
| Entity states၊ plate/lift၊ machine state/target | Attempt | Snapshot restore တွင်အပြည့်ပြန်စ |
| `attemptElapsed` | Attempt | First input မှစ; unsuccessful attempt အချိန် မပေါင်း |
| `sessionDeaths` | Chapter session | Chapter session entry တွင် 0; retry တွင်ဆက်တိုး |
| `entryWallet`, `completionLatched` | Chapter session/attempt | Entry snapshot / each attempt latch |

Result record သည် preset နှင့် coin total အလိုက် best successful time ကိုသီးခြားမှတ်သည်။ `5 coins / 10 s` နှင့် `15 coins / 18 s` ကို အမှတ်တစ်မျိုးတည်းထဲရောပြီးတစ်ခုဖျက်မထားရ။ Result panel တွင် coins၊ credited coins၊ active successful time၊ session deaths ကိုပြသည်။ Currency spending သည် performance records မလျော့စေရ။

## 12. အခန်းကူးခြင်းနှင့် original spec integration

Win latch ဝင်လျှင် attacks အသစ်ရပ်၊ falling rocks/damage callbacks ကို cancel/freeze လုပ်၊ currency transaction commit လုပ်သည်။ `CH1_EXIT_LINK` သို့ 0.35 s fade လုပ်သည်။

`CH1_EXIT_LINK` သည် လုံခြုံသောလှေကားဆင်းလမ်းဖြစ်ပြီး enemies/pickups/shop မရှိ။ Result ကို nonblocking overlay အဖြစ်ပြကာ steam hiss၊ pipes၊ furnace glow ကိုမြင်ရမည်။ Normal first clear တွင် Continue input သို့မဟုတ် 2.0 s auto continuation ဖြင့် `CHAPTER_2` ကို စတင်သည်။ Practice/replay menu မှဝင်ထားသူအတွက် Retry / Practice / Menu ကိုပြပြီး story progression ကိုနောက်ပြန်မရွှေ့ရ။

**Transition payload**

- `fromScene = CHAPTER_1`, `toScene = CHAPTER_2`
- `campaignId`, current `walletCoins`, `deathCount`, original `inventory`, `ownedTools`
- `chapter1Completed = true`, `chapter1BestBankedCoins`, `lastChapter1Result`

Chapter 2 adapter သည် တူညီcampaign state ကိုသုံးရမည်။ Entry scene အသစ်ဖန်တီးတိုင်း wallet/deathCount ကို default 0 ပြန်မထားရ။ Original Chapter 2 ၏ starting items ကိုလိုလျှင် seed-once rule ဖြင့်ထည့်ရန်; inventory ထပ်ပွားမထည့်ရ။

`ch1_tunnel_open` သည် ဤအခန်းအတွက် obsolete ဖြစ်သည်။ Win condition မဖတ်ရ၊ false ဖြစ်နေသော်လည်း transition ဖြစ်ရမည်။ Original 3.3 death overlay/persistent-current-inventory rule ကို CH1 အတွက် ဤစာရွက်၏ snapshot rule ဖြင့် override လုပ်သည်။ အခန်း ၂–၅ ၏ content ကို ဤဖိုင်က အလိုအလျောက်ပြန်ရေးထားခြင်းမဟုတ်ပါ။

## 13. Replay presets — စည်းမျဉ်းမတိုးဘဲ ကစားရမည့်အခြေအနေကွဲစေခြင်း

ပထမ campaign entry သည် A တစ်မျိုးတည်း။ A first clear ပြီးမှ practice B/C ကိုရွေးနိုင်သည်။ Random hidden trap/geometry mutation မရှိ။ Preset name နှင့် initial stones ကိုစချိန်မြင်နိုင်ရမည်။ Physics၊ timings၊ objective၊ coin positions တူညီသည်။

| Preset | Initial differences from A | Banking |
|---|---|---|
| A — ပုံမှန် | Additional stone မရှိ; gate/shelf intact; lift Y = 544 | Campaign best-delta credit |
| B — ရှိပြီးသားတုံးကိုသုံး | Settled stone center X = 256, bottom Y = 640 | No wallet credit |
| C — အသုံးဝင်တာကိုထိန်း၊ ပိတ်တာကိုရှင်း | Stone center X = 400, bottom Y = 640; plate weighted; lift Y = 424. Another supported stone center X = 704, bottom Y = 424, standing on lift | No wallet credit |

B တွင် အဟောင်းတုံးကို plate ဆီတွန်းယူနိုင်သည်၊ သို့မဟုတ်ကြေကွဲစေပြီးအသစ်ချနိုင်သည်။ တုံးအောက်က coin_03 သည်မပျောက်၊ glow ပြပြီး တုံးဖယ်၍ယူနိုင်သည်။

C တွင် plate ကိုဖိထားသောတုံးကို ဆက်ထားပြီး lift ပေါ်ကတုံးကို targeted drop ဖြင့်ရှင်းနိုင်သည်။ Plate တုံးကိုမှားရှင်းမိလည်း lift ပြန်ဆင်းပြီး နောက်တစ်တုံးပြန်တင်နိုင်သည်။ Dead-end မဖြစ်ရ။ Restored snapshot တွင် supported body positions/plate weight/lift height တူညီစွာ initialize လုပ်ရမည်။

ဤ presets သည် replay စစ်ရန်ဖြစ်သည်။ Game တစ်ခုလုံးအတွက် endless novelty အာမခံမဟုတ်ပါ။ Practice ကို chapter progression တွင် မဖြစ်မနေကစားရန် မတောင်းရ။

## 14. Reference playthroughs နှင့် geometry checks

### Route A — မြန်လမ်း / ပုံမှန်ဒင်္ဂါး

1. Floor coins ကိုဖြတ်ယူပြီး fixed_step ကိုခုန်ကျော်။
2. Gate ဘယ်ဘက်နား center X ≈ 1080 တွင် target lock ရစေ။ Stone footprint သည် gate ဘယ်အစွန်းကို >= 8 px overlap ဖြစ်သည်။
3. Lock ပြီးလျှင် ဘယ်ဘက် center X <= 1008 သို့ရှောင်။
4. Gate ပျက်ပြီး settled ဖြစ်လာသောstone ကိုခုန်ကျော်/တွန်းဖယ်ပြီး exit zone သို့ grounded ဝင်။

Expected: coins 0–5 depending pickups; no plate requirement; gate can break before stone settles. ဤနည်းကို taunt မသုံးဘဲ automatic shot ဖြင့်လုပ်နိုင်ရမည်။

### Route B — Plate / raised lift / upper route

1. Plate center X = 400 တွင် target lock ရပြီး ဘယ်ဘက်ရှောင်။ Stone သည် floor ပေါ်ရပ်ပြီး plate weighted ဖြစ်သည်။
2. Lift တက်ပြီးနောက် plate stone/fixed_step ပေါ်တက်။ `fixed_step` မှ raised lift သို့ခုန်။
3. Raised lift မှ gold shelf သို့ခုန်၊ pouch ယူ။
4. Shelf ညာဘက်မှ gate top ပေါ်တက်ကျော်၍ဖြစ်စေ၊ အောက်လမ်းကိုလွှဲဆင်း၍ gate ဖျက်ပြီးဖြစ်စေ exit သို့ရောက်။

Expected: coins 15 achievable; gate intact ဖြင့် upper route ကျော်နိုင်သည်; no flag must require gateBroken.

### Route C — Shelf ဖျက် / pouch အောက်ချယူ

1. Center X ≈ 896 တွင် aim lock ရစေ၊ footprint က shelf ကိုထိမည်။ ရှောင်ထွက်။
2. Shelf ပျက်ပြီး stone နှင့် pouch အောက်ကျမည်။ Stone ဆက်ကျသောအန္တရာယ်ကိုရှောင်။
3. Pouch ကိုဖုံးနေသောstone ကို လုံလောက်စွာတွန်းဖယ်၍ pouch ယူ။ ဥပမာ ညာဘက် 64 px တွန်းခြင်းသည် pouch ကိုဘယ်ဘက်မှယူရန်လုံလောက်သည်။
4. Gate ကိုနောက် shot ဖြင့်ဖျက်ပြီး exit သို့သွား။

Expected: coins 15 achievable; plate/lift သုံးရန်မလို။ Shelf ကိုဖျက်လိုက်၍ ရွှေဆုံးရှုံးခြင်းမရှိ။ Shelf–gate gap 136 > stone width 96 ဖြစ်၍ သီးခြားcolumns လိုသည်။

### Route D — ခွင့်ပြုသော advanced solution

Lower lift ပေါ်ချထားသောsettled stone ကိုစင်အဖြစ်အသုံးချပြီး shelf သို့ခုန်နိုင်သည်။ Plate မသုံးသောကြောင့် မပိတ်ပင်ရ။ Setup/retreat/re-entry လုပ်ရန်လိုပြီး နောက် shot က ထိုတုံးကိုကြေကွဲစေနိုင်သောအန္တရာယ်ရှိသည်။ ဤနည်းကို canonical hint မပေးဘဲ ကစားသူတွေ့နိုင်သောအသုံးအဖြစ်ထားသည်။

### စာရွက်ပေါ် physics arithmetic — စစ်ပြီးသောတန်ဖိုး

Launch speed 570၊ gravity 1200၊ horizontal speed 220 ဖြင့် (side obstruction မရှိသော ballistic envelope):

| Check | Result | အဓိပ္ပာယ် |
|---|---:|---|
| Maximum jump rise | 135.375 px | Stone 96 px ကိုခုန်နိုင် |
| Same-height flight / horizontal travel | 0.95 s / 209 px | Small gaps ကိုခုန်နိုင် |
| Ground + one stone + jump | 231.375 px | Gate top 280 / shelf top 320 ကို ground stone တစ်တုံးတည်းဖြင့် တန်းမမှီ |
| Fixed step → raised lift rise | 120 px | <= 135.375; descending landing time 0.6351 s |
| Launch X = 544 from fixed step | Landing X ≈ 683.72 | Lift X = 640–768 အတွင်း; side approach clearance ကိုရရှိ |
| Raised lift → shelf rise | 104 px | Descending landing time 0.7037 s |
| Launch X = 704 from raised lift | Landing X ≈ 858.81 | Shelf X = 824–968 အတွင်း |
| Lower-lift stone → shelf rise | 128 px | Descending landing time 0.5859 s; horizontal envelope 128.89 px |
| Shelf → floor drop | 320 px lower | Flight envelope 1.3462 s / 296.16 px; gate top ကိုlanding surface အဖြစ်လည်းသုံးနိုင် |
| Drop bottom 128 → shelf 320 | 0.5657 s | LOCKED warning 0.85 s ပြီးမှ stone ကျလာမည် |
| Drop bottom 128 → gate 360 | 0.6218 s | Gate hit timing |
| Drop bottom 128 → ground 640 | 0.9238 s | Ground landing timing |

Arithmetic သည် လမ်းဖြစ်နိုင်ခြေကိုစစ်ခြင်းဖြစ်သည်။ Collision solver၊ player input၊ landed stone obstruction၊ active next attacks ပါဝင်သော playable test ပြီးထားခြင်းမဟုတ်ပါ။ Route အားလုံးကို prototype တွင်စစ်ရန်လိုသည်။

## 15. ကစားချိန်၊ fairness၊ enjoyment validation

သေချာသော timers/movement values သည် အထက်တွင်ပိတ်သတ်မှတ်ထားသည်။ အောက်ပါ durations သည် playtest targets ဖြစ်ပြီး min-duration gates မဟုတ်ပါ။

| Target | Initial target range |
|---|---|
| Experienced direct clear | 8–20 s |
| Experienced full-coin clear | 15–35 s |
| First-time chapter session incl. retries | 1–3 min |
| Death to restored controls | 0.90 s |

အစောပိုင်းဆွေးနွေးခဲ့သော 20–35 / 45–90 s ကို ဤ geometry အတွက် အာမခံမထားပါ။ ကစားချိန်ရှည်စေရန် attack wait/cutscene ကိုအကြောင်းမဲ့မတိုးရ။ Player သည်ပိုမြန်အောင်ရှာတွေ့လျှင် ခွင့်ပြုရမည်။

Record goals: fast exit၊ 15-coin route၊ ကိုယ့်နည်းဖြင့်ပိုမြန်သောroute၊ practice B/C ဖြင့် initial state ကိုလိုက်ပြီးပြောင်းကစားခြင်း။ Currency farm မဖြစ်စေရ။ Leaderboard/network service ကိုဤ revision တွင်မတောင်းပါ။

Playtest တွင် designer မညွှန်ပြဘဲ စစ်ရန်:

- ပစ်မှတ် lock ဖြစ်ခြင်းကို နားလည်ပြီး မဖြစ်မနေသေစရာမလိုဘဲ ရှောင်နိုင်သလား။
- ပထမ clear ပြီးနောက် ရွှေ/တခြားနည်းကို ကိုယ့်ဘာသာစမ်းချင်သလား။
- တူညီ preset ၃ ကြိမ်စမ်းရာတွင် ပိုတိကျ၊ ပိုမြန်၊ သို့မဟုတ်နည်းကွဲကစားမှုရှိသလား။
- B/C တွင် default route ကိုသာမှတ်ပြီးလုပ်နေသလား၊ လက်ရှိပစ္စည်းအခြေအနေကိုကြည့်ပြောင်းကစားသလား။
- Waiting၊ repeated speech၊ slow pushing၊ မမြင်သာသော death cause တို့က ပျော်စရာကိုတားသလား။

ဒီမေးခွန်းများတွင် core loop မခိုင်လျှင် shop/ending/enemy အမျိုးအစားအသစ်ကို ထပ်ပေါင်းမည့်အစား geometry၊ timings၊ input feedback ကိုအရင်ပြင်ရန်။ Fun/uniqueness ကို artificial completion rate တစ်ခုတည်းဖြင့် pass မပေးရ။

## 16. Acceptance scenarios — implementation verification အတွက်

အောက်ပါ cases များသည် **expected outcomes** ဖြစ်သည်။ ဤစာရွက်ရေးချိန်တွင် executable game tests မလုပ်ထားပါ။

| ID | Scenario | Expected outcome |
|---|---|---|
| A01 | E မနှိပ်ဘဲ machine စောင့် | First input + 4.0 s တွင် TRACK စ; automatic cycle ဆက်လုပ် |
| A02 | READY တွင် valid E | TRACK ချက်ချင်း; player lock 0.35 s; no currency charge |
| A03 | E ကိုကိုင်/ spam | One valid press တစ်ကြိမ်သာ; busy machine ကို interrupt/queue မလုပ် |
| A04 | TRACK အတွင်းရွေ့၊ LOCKED ပြီးရွေ့ | Track လိုက်; lock ပြီး X မပြောင်း |
| A05 | Falling stone ထိ | Death count +1 သာ; no pickup/win same step |
| A06 | Ground stone ကိုထိ/တက် | Nonlethal; grounded/jump contact valid |
| A07 | Stone gate ထိ | Gate ပျက်၊ stone ဆက်ကျ; no mandatory dialogue wait |
| A08 | Stone shelf ထိ | Shelf ပျက်၊ pouch ကျ; value 10 မပျောက် |
| A09 | Falling stone hits settled stone | နှစ်တုံးကြေ; stack မဖြစ်; space ပြန်လွတ် |
| A10 | 10+ drop cycles room တွင်ဆက်ကစား | Invalid overlap/penetration မရှိ; blocks ကိုခုန်/တွန်း/ဖျက်ဖြင့်ဆက်ကစားနိုင် |
| A11 | Player တစ်ယောက်တည်း plate ပေါ်ရပ် | Lift မတက် |
| A12 | Stone plate ပေါ်ရပ်၊ နောက်တွန်းဖယ် | Lift တက်၊ pressure လွတ်လျှင်ပြန်ဆင်း |
| A13 | Plate stone ကိုနောက်drop ဖြင့်ဖျက် | Pressure ပြန်တွက်၊ lift ဆင်း; one-time flag မကျန် |
| A14 | Descending lift အောက် stone သို့မဟုတ် player | Stop on obstruction; body ရွှေ့လျှင်ဆက်ဆင်း; no clipping/crush death |
| A15 | Lift ပေါ်ရှိ stone ကိုဖျက် | Both stones ဖယ်၊ lift/actor support ပြန်တွက် |
| A16 | Route A / B / C / D | Geometry ဖြင့်တကယ်လုပ်နိုင်; walkthrough-step flag မလို |
| A17 | Upper route၊ gate intact | Exit condition မှန်လျှင် win |
| A18 | 0 coins ဖြင့် exit | Complete/transition ရ; paywall မရှိ |
| A19 | Coin တစ်ခုကို overlap အကြိမ်များ | Pickup ID တစ်ကြိမ်သာရ |
| A20 | Collect 15 then die before exit | Attempt coins 0 ပြန်စ; wallet မတိုး |
| A21 | A clears 5 → 15 → 15 | Wallet credits +5 → +10 → +0 |
| A22 | Spend wallet externally, A replay same15 | Best banked မလျော့; extra credit 0 |
| A23 | Exit callback နှစ်ကြိမ်/reload after commit | Attempt receipt ဖြင့် duplicate credit မဖြစ် |
| A24 | Death/retry after shelf/gate/plate changes | Current preset snapshot အပြည့်ပြန်ရ; stale AI callbacks မကျန် |
| A25 | Manual R / Esc / hidden tab | R သည် wallet/death မပြောင်း; pause တွင် active clocks မတိုး |
| A26 | Practice B/C first frame | Initial support/plate/lift state မှန်; impossible overlaps မရှိ |
| A27 | Practice B/C clear15 | Time record သာတင်; wallet မတိုး |
| A28 | Gameplay render rate 30/60/144 fps | Fixed physics/timers တူ; fast stone thin collider ကိုမဖောက် |
| A29 | Burmese subtitle + muted audio | Characters မကွဲ၊ UI မဖုံး၊ gameplay မပိတ် |
| A30 | Enter Chapter 2 | Wallet/deaths/inventory/payload မပျောက်; CH1 tunnel flag မလို |
| A31 | Fixed step ပေါ်တုံးတင်၍ တက်မရဖြစ် | ဘေးက grounded position မှ footprint overlap ဖြစ်အောင် aim လုပ်၍တုံးရှင်းနိုင်; အတိအကျအလယ်ကိုတက်ရပ်ရန်မလို |

## 17. Revision boundary

ဤ revision သည် Chapter 1 အတွက် တည်ဆောက်စမ်းသပ်နိုင်သော စည်းမျဉ်းနှင့် geometry baseline ဖြစ်သည်။ Physics-envelope arithmetic နှင့် currency arithmetic ကို စာရွက်ပေါ်စစ်ထားသည်။ Engine implementation၊ input feel၊ attack fairness၊ route dominance၊ enjoyment နှင့် game တစ်ခုလုံး၏ originality ကို စမ်းပြီးသားအဖြစ် မကြေညာပါ။

အသစ်ပြင်ဆင်သည့်အခါ bug/failed acceptance case သို့မဟုတ် playtest observation ကိုအကြောင်းပြ၍ပြင်ရန်။ ဤ baseline ကို စိတ်ကူးအသစ်တစ်ခုရတိုင်း အလုံးစုံပြန်မရွှေ့ရန်။

## 18. AI implementation နှင့် asset integration clarification

- [Technical architecture](docs/technical_architecture.md) သည် scene/state ownership၊ fixed-step simulation၊ collision integration၊ lifecycle clocks၊ save failure နှင့် settlement ကိုအသေးစိတ်သတ်မှတ်သည်။ Physics သည် art/animation ထံမှမလာရ။
- [Assets and character pipeline](docs/assets_and_character_pipeline.md) ကိုလိုက်နာရန်။ Owner က 2D cartoon ကိုအတည်ပြုပြီး၊ final character sheet ကိုမအတည်ပြုရသေးပါ။ Player body36×56 ကိုပုံအရွယ်အစားကြောင့် မပြောင်းရ။
- [Verification plan](docs/verification_plan.md) သည် A01–A31 ကိုစစ်မည့်နည်းနှင့်ထပ်လိုသော engineering tests ကိုသတ်မှတ်သည်။ Expected case ရေးထားခြင်းက test pass မဟုတ်ပါ။
- [Source decisions](docs/source_review_and_decisions.md) အတိုင်း Gemini/source notes သည် reference သာဖြစ်သည်။ Robot abilities၊ invisible traps၊ UI puzzle၊ inventory crafting နှင့် forced-death ending တို့ကို CH1 ထဲပြန်မထည့်ရ။

**CH1-only build endpoint:** Section 12 ၏ `CHAPTER_2` သည် future destination ဖြစ်သည်။ အမှန်တကယ်မရှိသေးသော scene ကိုမဖွင့်ရ။ Safe `CH1_EXIT_LINK` တွင် Continue သို့မဟုတ် 2.0 s ပြည့်လျှင် Chapter 1 prototype ပြီးကြောင်း၊ Chapter 2 မတည်ဆောက်ရသေးကြောင်းပြသော pending panel သို့ကူးရန်။ Replay/Practice/Menu ပေးနိုင်သည်။ Campaign state ကိုသိမ်းပြီး၊ game တစ်ခုလုံးပြီးပြီဟုမပြောရ။ Real Chapter 2 ရှိလာမှ မူလ transition payload ကိုသုံးမည်။

**Clock clarification:** Death freeze တွင် physics/AI/attempt clock ရပ်သော်လည်း 0.25+0.65 s ပြန်စပေးသော lifecycle clock က visible/unpaused အချိန်ဖြင့်ဆက်ရမည်။ Hidden tab/user pause တွင် lifecycle clock ပါရပ်သည်။ Input/old callbacks မကျန်စေရ။

**Persistence clarification:** Successful settlement ၏ wallet/best/receipt ကိုတစ်ခုတည်းသော save candidate ဖြင့်ရေးရန်။ Browser save မရလျှင် save ပြီးဟုမပြောရ။ Unsaved warning နှင့် Retry Save သို့မဟုတ် explicit temporary-mode continuation ကိုပေးရန်။ Attempt receipt ကိုmemory ထဲပါသိမ်း၍ callback နှစ်ခါလာလည်း ငွေထပ်မတိုးစေရ။

ဤ clarification များသည် geometry/difficulty ပြင်ခြင်းမဟုတ်ဘဲ မတည်ဆောက်ရသေးသောအရာနှင့် runtime edge cases ကို AI agent မခန့်မှန်းရအောင်သတ်မှတ်ခြင်းဖြစ်သည်။
