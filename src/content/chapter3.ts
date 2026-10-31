import { C } from './chapter1';
import type { Rect } from '../domain/types';

// Chapter-local geometry only. Movement, body and fixed timestep remain shared.
export const S3 = Object.freeze({
  spawnX: 96, floor: C.floor, targetWeight: 10, reachX: 88, reachY: 64,
  leftPanX: 500, leftPanFeetY: 640,
  panX: 750, panFeetY: 640,
  rightPanX: 750, rightPanFeetY: 640,
  minBalanceWeight: 1,
  latchX: 1010, latchFeetY: 640,
  gateX: 1040, gateW: 64, gateH: 380, gateTop: 260,
  gateTravel: 210, gateSpeed: 140, closingWarning: 1.2, exitX: 1220,
  shelf: Object.freeze({ id: 'scale_shelf', x: 300, y: 530, w: 150, h: 18 }) satisfies Readonly<Rect>,
  pendulum: Object.freeze({
    pivotX: 580, pivotY: 150, length: 450,
    period: 4.5,
    maxAngle: 0.26, // swing reach: sin(0.26) * 450 ≈ 115px -> x between 465 and 695
    bottomY: 605, // at center swing, domain floor is 640. Standing player is 584-640, laying player is 614.8-640.
    halfWidth: 36, halfHeight: 25,
  }),
});
export const SCALE_ITEMS = {
  stone: { name: 'ကျောက်တုံး', weight: 3, x: 220, feetY: 640, color: 0x8c9b87 },
  treasure: { name: 'ရွှေရုပ်', weight: 7, x: 850, feetY: 640, color: 0xedc675 },
  crate: { name: 'သစ်သားသေတ္တာ', weight: 4, x: 930, feetY: 640, color: 0xa3764d },
  sandbag: { name: 'သဲအိတ်', weight: 3, x: 380, feetY: 530, color: 0xc0aa76 },
  pin: { name: 'သံချောင်း', weight: 0, x: 150, feetY: 640, color: 0xa9b9ad },
  reference: { name: 'ရှေးဟောင်းအလေးတုံး', weight: 10, x: 500, feetY: 640, color: 0x3b4b3d },
  betel_cutter: { name: 'ကွမ်းသီးညှပ်', weight: 1, x: 1150, feetY: 640, color: 0x839b8b },
  bamboo_pole: { name: 'ဝါးလုံး', weight: 2, x: 1100, feetY: 640, color: 0xa3764d },
  rusty_cog: { name: 'သံချေးတက်ဂီယာ', weight: 4, x: 120, feetY: 640, color: 0x5a6c53 },
  slingshot: { name: 'လေးခွ', weight: 2, x: 60, feetY: 640, color: 0xc0aa76 },
} as const;
export type ScaleItemId = keyof typeof SCALE_ITEMS;
export const SCALE_IDS = Object.keys(SCALE_ITEMS) as ScaleItemId[];

/**
 * Curated diverse, solvable weight profiles for Chapter 3.
 * Assigned deterministically per attempt ID, fixed for the entire chapter run.
 * Zero UI measurement labels shown to player.
 */
export const WEIGHT_PROFILES: ReadonlyArray<Record<ScaleItemId, number>> = Object.freeze([
  // Profile 0: Classic balance combinations
  { stone: 3, treasure: 7, crate: 4, sandbag: 3, pin: 0, reference: 10, betel_cutter: 1, bamboo_pole: 2, rusty_cog: 4, slingshot: 2 },
  // Profile 1: Alternate partitionable sets
  { stone: 3, treasure: 7, crate: 4, sandbag: 3, pin: 0, reference: 10, betel_cutter: 2, bamboo_pole: 1, rusty_cog: 5, slingshot: 3 },
  // Profile 2: Dense pairing sets
  { stone: 3, treasure: 7, crate: 4, sandbag: 3, pin: 0, reference: 10, betel_cutter: 3, bamboo_pole: 4, rusty_cog: 1, slingshot: 2 },
  // Profile 3: Double pair sets
  { stone: 3, treasure: 7, crate: 4, sandbag: 3, pin: 0, reference: 10, betel_cutter: 1, bamboo_pole: 3, rusty_cog: 3, slingshot: 4 },
  // Profile 4: Inverted pairs
  { stone: 3, treasure: 7, crate: 4, sandbag: 3, pin: 0, reference: 10, betel_cutter: 2, bamboo_pole: 3, rusty_cog: 4, slingshot: 1 },
  // Profile 5: High-spread sets
  { stone: 3, treasure: 7, crate: 4, sandbag: 3, pin: 0, reference: 10, betel_cutter: 4, bamboo_pole: 1, rusty_cog: 2, slingshot: 3 },
]);
export const SCALE_LINES = {
  entry: 'ဒီချိန်ခွင်က တံခါးနဲ့ ကြိုးဆက်ထားတာကွ! ရွှေရုပ်ကိုတော့ ထားမခဲ့နဲ့နော်… ရွာက မင်းအကြွေးရှင်တွေ ဓားတမိုးမိုးနဲ့ စောင့်နေကြတယ်!',
  pan: 'ဟိုဘက်ဒီဘက် အလေးချိန်ညီမှ တံခါးပွင့်လာမှာဟေ့။ ချိန်ခွင်ဗန်းထဲက ပစ္စည်းကို တို့ထိပြီး ပြန်ယူလို့ရတယ်!',
  fixedReference: 'ဒီရှေးဟောင်းအလေးတုံးကြီးက ချိန်ခွင်ဗန်းမှာ သံမှိုနဲ့ အသေဆွဲရိုက်ထားတာကွဲ့! ဖြုတ်ယူဖို့ အားမထုတ်နဲ့… ချိန်ခွင်ညီအောင် တခြားပစ္စည်းတွေနဲ့ပဲ ဉာဏ်ဆင်ပြီး ညှိစမ်း!',
  wrongPin: 'သံချောင်းက ပေါ့ရွှတ်ရွှတ်နဲ့ ဘယ်ချိန်ခွင်မှ ချိန်မရဘူးဟေ့! ဒါပေမဲ့ တံခါးဘေးက လွတ်နေတဲ့ ထိန်းတံပေါက်နဲ့တော့ အံကိုက်ဖြစ်နေသလိုပဲ!',
  balanced: 'ဟော… တံခါးကြီး ပွင့်သွားပြီဟေ့! ရွှေရုပ်ကို ချိန်ခွင်ပေါ် ဒီအတိုင်း ထားခဲ့မယ်ဆို မင်းအကြွေးကို ဘယ်သူဆပ်ပေးမှာလဲ?',
  closing: 'ချိန်ခွင်မညီတော့ဘူးဟေ့… ကြိုးလျော့သွားပြီ! တံခါးကြီး ပြန်ပိတ်တော့မယ်၊ ချိန်ခွင်ပေါ် ပစ္စည်း အမြန်ပြန်တင်စမ်း!',
  braced: 'ထိန်းတံပေါက်ထဲ သံချောင်းစိုက်လျှိုလိုက်တော့ တံခါးကြီး ငြိမ်ကျသွားပြီဟေ့! အခုမှ ရွှေရုပ်ကို အိတ်ထဲ အေးအေးဆေးဆေး ပြန်ကောက်ထည့်လို့ရတော့မယ်!',
  latchClosed: 'တံခါးကို အပေါ်ဆုံးထိ ဆွဲတင်ထားမှ အောက်ခြေက ထိန်းတံပေါက် ပေါ်လာမှာကွဲ့! သံချောင်းကို အသင့်ကိုင်ထားဦး!',
  blocked: 'သံထိန်းတံက တံခါးကို မကျအောင် ကျားကန်ပေးထားတယ်! မကြောက်နဲ့ လူကို မညှပ်ဘူး… စိတ်အေးလက်အေး ချိန်ခွင်ပြန်ညှိ!',
  journal: 'ပြောပြီးသောစကားများ',
  pendulumWarning: 'ဟိတ်ကောင် ဖိုးထောင်! ခေါင်းပေါ်က ကြေးစည်ကြီး လွှဲလာနေပြီဟေ့… ဝမ်းလျားမှောက်ပြီး ဗိုက်နဲ့တွားသွားစမ်း!',
  pendulumSlapstick: 'အမယ်လေး ဗုဒ္ဓေါ… ကြေးစည်ကြီးနဲ့ မျက်ခွက် မိတ်ဆက်ပေးလိုက်တာပေါ့! နောက်တစ်ခါဆို ဦးနှောက်ပါ ထွက်သွားမယ်သာမှတ်!',
} as const;
