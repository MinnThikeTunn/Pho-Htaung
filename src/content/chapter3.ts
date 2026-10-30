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
  entry: 'ဦးကြီး — ဒီချိန်ခွင်က တံခါးနဲ့ ကြိုးဆက်ထားတာကွ။ ရွှေရုပ်ကိုတော့ မထားခဲ့နဲ့နော်… မင်းအကြွေးရှင်တွေ စောင့်နေတယ်!',
  pan: 'ချိန်ခွင်ညီလျှင် တံခါးတက်မည်။ တင်ထားသောပစ္စည်းကို နှိပ်ပြီး ပြန်ယူနိုင်သည်။',
  fixedReference: 'ဦးကြီး — ဒီရှေးဟောင်းအလေးတုံးက ချိန်ခွင်ဗန်းမှာ သံမှိုနဲ့ အသေတွဲထားတာကွ! ဖြုတ်ယူလို့ မရဘူး။ ချိန်ခွင်ညီအောင် တခြားပစ္စည်းတွေနဲ့ပဲ ညှိရမယ်!',
  wrongPin: 'ဖိုးထောင် — သံချောင်းက အလေးချိန်မပြည့်ဘူး။ တံခါးဘေးက လွတ်နေတဲ့ ထိန်းတံပေါက်နဲ့တော့ အရွယ်တူတယ်။',
  balanced: 'ဦးကြီး — တံခါးပွင့်ပြီဟေ့! ရွှေရုပ်ထားခဲ့မယ်ဆို မင်းအကြွေးကို ဘယ်သူဆပ်မှာလဲ?',
  closing: 'ချိန်ခွင်မညီတော့ပါ။ ကြိုးလျော့နေသည် — တံခါးပြန်ကျတော့မည်။ ပစ္စည်းပြန်တင်နိုင်သည်။',
  braced: 'ဖိုးထောင် — ထိန်းတံပေါက်ထဲ သံချောင်းစိုက်ထားပြီ။ အခုမှ ရွှေရုပ်ပြန်ယူလို့ရတော့မယ်!',
  latchClosed: 'တံခါးကို အပြည့်တင်မှ ထိန်းတံပေါက်ပေါ်လာမည်။ သံချောင်း ရွေးထားရန်လိုသည်။',
  blocked: 'လုံခြုံရေးထိန်းတံက တံခါးကို ခံထားသည်။ လူကို မညှပ်ပါ။ ချိန်ခွင်ပြန်ညှိနိုင်သည်။',
  journal: 'ပြောပြီးသောစကားများ',
  pendulumWarning: 'ဦးကြီး — ဟိတ်ကောင်! ခေါင်းပေါ်က ကြေးစည်ကြီး လာနေပြီ... ခေါင်းငုံ့ပြီး တွားသွားစမ်း!',
  pendulumSlapstick: 'ဦးကြီး — အမယ်လေး... ကြေးစည်နဲ့ မိတ်ဆက်ပေးလိုက်တာပေါ့! နောက်တစ်ခါဆို ခေါင်းကွဲပြီသာမှတ်!',
} as const;
