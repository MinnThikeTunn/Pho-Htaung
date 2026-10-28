import { C } from './chapter1';

export const A4 = Object.freeze({
  floor: C.floor, spawnX: 160, minX: 32, maxX: 1248, exitX: 1220,
  health: 100, apeHealth: 150, timeLimit: 75,
  chargeTime: .55, minimumCharge: .12, slingCooldown: .48, shotDamage: 30, shotSpeed: 920,
  ammo: 12, refillTime: .8, refillReach: 58, refillX: [100, 1170] as readonly number[],
  punchCooldown: .75, punchDamage: 1, punchReach: 86, punchStun: .75, punchPush: 80,
  dodgeTime: .22, dodgeInvulnerable: .15, dodgeCooldown: .85, dodgeSpeed: 420,
  hurtGrace: .8, hurtStagger: .3, hitFlash: .18, meleeSpawn: 720, meleeSpeed: 180, meleeReach: 108, meleeWindup: .65, meleeStrike: .16,
  meleeRecover: .85, meleeDamage: 24, throwWindup: .85, throwRecover: 1.1,
  throwCooldown: 1.4, throwFirstCooldown: .25, throwSpeed: 430, throwDamage: 20, attackSpacing: 1.05, firstAttack: 1.2,
});
export const ARENA_ART = {
  background: { key: 'arena_chamber_v1', path: '/assets/chapter4/arena_chamber_v1.png' },
  apes: { key: 'arena_apes_v1', path: '/assets/chapter4/arena_apes_v1.png' },
} as const;
export const APE_FRAMES: Record<string, { x: number; y: number; w: number; h: number; anchor: number }> = {
  brown_idle: { x: 76, y: 49, w: 336, h: 360, anchor: .5 },
  brown_windup: { x: 503, y: 49, w: 329, h: 360, anchor: .4924 },
  brown_strike: { x: 869, y: 52, w: 472, h: 360, anchor: .7436 },
  brown_recover: { x: 1426, y: 52, w: 285, h: 360, anchor: .4877 },
  silver_idle: { x: 95, y: 473, w: 340, h: 360, anchor: .4853 },
  silver_windup: { x: 509, y: 471, w: 356, h: 360, anchor: .5084 },
  silver_strike: { x: 871, y: 472, w: 485, h: 360, anchor: .7608 },
  silver_recover: { x: 1435, y: 473, w: 276, h: 360, anchor: .5072 },
};
export const ARENA_LINES = {
  entry: 'နားနေတဲ့လူဝံကို J နဲ့ခွာထုတ် → K ဆွဲပစ်။ လက်မြှောက် / ပစ်မှတ်ပြလျှင် ခုန် သို့မဟုတ် L နဲ့ရှောင်။',
  empty: 'ကျောက်ခဲကုန်ပြီ။ ဘေးက ကျောက်ပုံနားမှာ ခဏရပ်ပြီး ပြန်ဖြည့်နိုင်သည်။',
  won: 'လူဝံနှစ်ကောင်လုံး လဲပြီ! အချိန်ရပ်ထားပြီ — ညာဘက်ထွက်ပေါက်ဆီ သွားပါ။',
  health: 'ဖိုးထောင် ဒဏ်ရာများသွားပြီ။ အချိန်မှန်ရှောင်ပြီး အကွာအဝေးကနေ ပစ်ပါ။',
  timeout: 'တံခါးပိတ်သွားပြီ။ လက်သီးသက်သက်နဲ့ အချိန်မလောက်ဘူး — လောက်လေးခွကို အသုံးချပါ။',
} as const;
