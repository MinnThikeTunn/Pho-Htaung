import { C } from './chapter1';
import type { Rect } from '../domain/types';

// Chapter-local geometry only. Movement, body and fixed timestep remain shared.
export const S3 = Object.freeze({
  spawnX: 96, floor: C.floor, targetWeight: 10, reachX: 88, reachY: 64,
  panX: 750, panFeetY: 640, latchX: 1010, latchFeetY: 640,
  gateX: 1040, gateW: 64, gateH: 380, gateTop: 260,
  gateTravel: 210, gateSpeed: 140, closingWarning: 1.2, exitX: 1220,
  shelf: Object.freeze({ id: 'scale_shelf', x: 300, y: 530, w: 150, h: 18 }) satisfies Readonly<Rect>,
});
export const SCALE_ITEMS = {
  stone: { name: 'ကျောက်တုံး', weight: 3, x: 220, feetY: 640, color: 0x8c9b87 },
  treasure: { name: 'ရွှေရုပ်', weight: 7, x: 850, feetY: 640, color: 0xedc675 },
  crate: { name: 'သစ်သားသေတ္တာ', weight: 4, x: 930, feetY: 640, color: 0xa3764d },
  sandbag: { name: 'သဲအိတ်', weight: 3, x: 380, feetY: 530, color: 0xc0aa76 },
  pin: { name: 'သံချောင်း', weight: 0, x: 150, feetY: 640, color: 0xa9b9ad },
} as const;
export type ScaleItemId = keyof typeof SCALE_ITEMS;
export const SCALE_IDS = Object.keys(SCALE_ITEMS) as ScaleItemId[];
export const SCALE_LINES = {
  entry: 'ဦးကြီး — ဒီချိန်ခွင်က တံခါးနဲ့ ကြိုးဆက်ထားတာကွ။ ရွှေရုပ်ကိုတော့ မထားခဲ့နဲ့နော်… မင်းအကြွေးရှင်တွေ စောင့်နေတယ်!',
  pan: 'ချိန်ခွင်ညီလျှင် တံခါးတက်မည်။ တင်ထားသောပစ္စည်းကို နှိပ်ပြီး ပြန်ယူနိုင်သည်။',
  wrongPin: 'ဖိုးထောင် — သံချောင်းက အလေးချိန်မပြည့်ဘူး။ တံခါးဘေးက လွတ်နေတဲ့ ထိန်းတံပေါက်နဲ့တော့ အရွယ်တူတယ်။',
  balanced: 'ဦးကြီး — တံခါးပွင့်ပြီဟေ့! ရွှေရုပ်ထားခဲ့မယ်ဆို မင်းအကြွေးကို ဘယ်သူဆပ်မှာလဲ?',
  closing: 'ချိန်ခွင်မညီတော့ပါ။ ကြိုးလျော့နေသည် — တံခါးပြန်ကျတော့မည်။ ပစ္စည်းပြန်တင်နိုင်သည်။',
  braced: 'ဖိုးထောင် — ထိန်းတံပေါက်ထဲ သံချောင်းစိုက်ထားပြီ။ အခုမှ ရွှေရုပ်ပြန်ယူလို့ရတော့မယ်!',
  latchClosed: 'တံခါးကို အပြည့်တင်မှ ထိန်းတံပေါက်ပေါ်လာမည်။ သံချောင်း ရွေးထားရန်လိုသည်။',
  blocked: 'လုံခြုံရေးထိန်းတံက တံခါးကို ခံထားသည်။ လူကို မညှပ်ပါ။ ချိန်ခွင်ပြန်ညှိနိုင်သည်။',
  journal: 'ပြောပြီးသောစကားများ',
} as const;
