import { C } from './chapter1';

export const F5 = Object.freeze({
  floor: C.floor,
  spawnX: 240,
  exitX: 1220,
  exitGateX: 1212,
  minX: 32,
  maxX: 1248,
  health: 100,
  bossHealth: 180,
  bossSpawn: 980,
  bossW: 48,
  bossH: 92,
  bossMin: 74,
  bossMax: 1206,
  debtTarget: 10,
  punchDamage: 10,
  punchReach: 86,
  punchCooldown: 0.75,
  guardTime: 0.65,
  firstGuard: 1.2,
  slamReach: 150,
  slamWarning: 0.8,
  slamStrike: 0.12,
  slamRecover: 1.3,
  slamHalfWidth: 48,
  slamHeight: 210,
  slamDamage: 24,
  rushWarning: 0.9,
  rushSpeed: 410,
  rushMaxDistance: 680,
  rushRecover: 1.0,
  rushDamage: 20,
  cartStun: 2,
  cartSpawn: 570,
  cartW: 112,
  cartH: 64,
  cartMin: 220,
  cartMax: 1060,
  cartPushSpeed: C.push,
  cartRollSpeed: 300,
  cartFriction: 180,
  cartDangerSpeed: 80,
  cartDamage: 24,
  cartApproachSpeed: 160,
  cartApproachTime: 2.5,
  cartPushReach: 105,
  cartWarning: 0.9,
  cartRecover: 1.1,
  chargeTime: 0.55,
  minimumCharge: 0.12,
  slingCooldown: 0.48,
  shotDamage: 30,
  shotSpeed: 920,
  shotSize: 12,
  ammo: 12,
  refillTime: 0.8,
  refillReach: 58,
  refillX: [100, 1170] as readonly number[],
  dodgeTime: 0.22,
  dodgeInvulnerable: 0.15,
  dodgeCooldown: 0.85,
  dodgeSpeed: 420,
  hurtGrace: 0.8,
  hurtStagger: 0.3,
  hitFlash: 0.18,
  feedbackTime: 0.7,
  punchVisualTime: 0.2,

  // New Chapter 5: Quest to a Million Myanmar & Twist Ambush
  bossSpawnX: 840,
  treasureX: 1060,
  chestOpenX: 930,
  escortGap: 120,
  maxHealth: 3,
  totalQuestions: 20,
});

export const FINAL_DAMAGE_LABELS = {
  SLAM: 'တုတ်ရိုက်ချက်',
  RUSH: 'ဒိုင်းတိုးချက်',
  CART: 'လှိမ့်လာသောလှည်း',
} as const;

export interface FinalLine {
  speaker: 'ဦးကြီး' | 'ဖိုးထောင်' | 'အကြွေးရှင်';
  text: string;
  reveal?: boolean;
}

export const FINAL_INTRO: readonly FinalLine[] = [
  { speaker: 'ဦးကြီး', text: 'ဖိုးထောင်ရေ… လူဝံနှစ်ကောင်ကိုပါ ကျော်လာနိုင်တယ်ဆိုတော့ မင်း မဆိုးဘူးကွ။' },
  { speaker: 'ဖိုးထောင်', text: 'လမ်းကောင်းတယ်ဆိုပြီး ခေါ်လာတာနော်။ လမ်းတစ်လျှောက် ကျုပ်ပဲ ရှင်းနေရတာ။' },
  { speaker: 'ဦးကြီး', text: 'အဲဒါကြောင့် ဆုရှိတာပေါ့ကွာ။ ဟောဒီရွှေတွေကို ကြည့်စမ်း။' },
  { speaker: 'ဖိုးထောင်', text: 'ဦးကြီး… ရွှေက အခွံကွာလို့ရတာလား?', reveal: true },
  { speaker: 'ဦးကြီး', text: 'အဲဒါတွေထားလိုက်။ မင်းကောက်လာတဲ့အိတ်ကို ဒီမှာချခဲ့။ အိမ်ပြန်လမ်းကို ငါပြပေးမယ်။' },
  { speaker: 'ဖိုးထောင်', text: 'ကျုပ်ကို လမ်းရှင်းခိုင်းပြီး အခု အိတ်ပါယူဦးမယ်ပေါ့။' },
  { speaker: 'ဦးကြီး', text: 'အေးအေးဆေးဆေးပြောနေတုန်း ပေးလိုက်ပါကွာ။' },
  { speaker: 'ဖိုးထောင်', text: 'ဒီတစ်ခါတော့ ခင်ဗျားနဲ့ စာရင်းရှင်းရမယ်။' },
];

export const FINAL_DEFEAT: readonly FinalLine[] = [
  { speaker: 'ဦးကြီး', text: 'ကဲပါ၊ ကဲပါ… ရှုံးပါပြီ။ လမ်းပြခ မယူတော့ဘူး။' },
  { speaker: 'ဖိုးထောင်', text: 'လမ်းကတော့ ကိုယ့်ဟာကိုယ် ဖွင့်ခဲ့ရတာချည်းပဲ။ သော့ပေး။' },
  { speaker: 'ဦးကြီး', text: 'ဟိုဘက်ကပါဗျာ။ ကျောက်လှေကားအတိုင်း တက်သွားရုံပါ။' },
  { speaker: 'ဖိုးထောင်', text: 'ဒီတစ်ခါ လမ်းမှားပြရင်တော့ ခင်ဗျားပါ လိုက်ခဲ့။' },
];

export const FINAL_OUTRO: readonly FinalLine[] = [
  { speaker: 'ဖိုးထောင်', text: 'ရွှေမြို့တော်တော့ တွေ့ခဲ့ပြီ။ အိမ်ပြန်လမ်းက ပိုရှာရခက်သား။' },
];

export const FINAL_ESCAPE: readonly FinalLine[] = [
  { speaker: 'ဖိုးထောင်', text: 'ဒီတစ်ခါတော့ အသက်ပါလာပြီ။ ကျန်တာ ဖြည်းဖြည်းချင်း ရှင်းတော့မယ်။' },
];

export const FINAL_DEBT_FREE: readonly FinalLine[] = [
  { speaker: 'အကြွေးရှင်', text: 'ကဲ… အကြွေးကျေပြီ။ နောက်ဘာလုပ်ဦးမလဲ?' },
  { speaker: 'ဖိုးထောင်', text: 'အိမ်ပြန်မယ်။ ဒီတစ်ခါ လမ်းတော့ ကိုယ့်ဟာကိုယ်ရွေးမယ်။' },
];

export const FINAL_PHASE_LINE: FinalLine = { speaker: 'ဦးကြီး', text: 'ရပြီ၊ ရပြီ… ငါက စနောက်တာပါကွာ။' };

export const UGYI_OPENING_MONOLOGUE: readonly string[] = [
  'ဟားဟားဟား! တော်လိုက်တာ ငါ့တူ မောင်ဖိုးထောင်ရယ်… လူဝံနှစ်ကောင်ကိုပါ ကျော်ဖြတ်ပြီး ဒီအတွင်းခန်းထဲအထိ ခြေတံလက်တံဆန့်ပြီး ရောက်လာနိုင်ခဲ့တယ်ပေါ့!',
  'ဒါပေမဲ့ ရွှေမြို့တော်တံခါးက ဒီအတိုင်း အလကားတော့ ဘယ်ဖွင့်ပေးမလဲကွ။ ငါ ဦးကြီးက မင်းကို "ဉာဏ်စမ်းမေးခွန်း ၂၀" မေးမယ်!',
  'မေးခွန်းတစ်ခုစီမှာ ရွေးစရာ အဖြေ ၄ ခု ပါမယ်။ ငါ ဦးကြီးက မင်းအတွက် အနီးစပ်ဆုံး အကြံဉာဏ်တွေ ပေးပြီး ကူညီမယ်နော်… (ငါ့စကားကို ယုံမလား မယုံဘူးလားတော့ မင်းအပိုင်းပေါ့ကွာ၊ ဟားဟား!)',
  'မှတ်ထားရမှာက… မင်း အမှား ၃ ကြိမ်ပဲ ခံနိုင်မယ်! အမှားတစ်ခု ဖြေမိတိုင်း ငါ့ရဲ့ တုတ်ရိုက်ချက်ကို ဇက်ပိုးလန်အောင် မြည်းစမ်းရမယ်!',
  'မေးခွန်း ၂၀ စလုံးကို ဖြတ်ကျော်နိုင်မှ ရွှေမြို့တော်တံခါးဖွင့် ရွှေသော့ကို ရပြီး ဟောဒီ ရွှေတောင်ကြီးကို ပိုင်ဆိုင်ရမယ်! ကဲ… စကြရအောင် ငကြောင်ရေ့!',
];

export const TWIST_STRINGS = {
  ugyiVictoryPrize: 'တော်တယ်ဟေ့ မောင်ဖိုးထောင်! မင်းက ငါ့မေးခွန်း ၂၀ စလုံးကို ဉာဏ်နီဉာဏ်နက်နဲ့ ကျော်ဖြတ်နိုင်ခဲ့ပြီ။ ရော့... ဒါက မြို့တော်တံခါးဖွင့် ရွှေသော့ပဲ။ ဟိုမှာ ရွှေသေတ္တာကြီး... သွားဖွင့်ကြည့်ပေတော့!',
  ugyiEscortLine: 'ဟီးဟီး... လာလေ ဖိုးထောင်ရေ။ ငါ ဦးကြီးက မင်းကို ရွှေသေတ္တာကြီး လက်တွေ့ ဖွင့်ပြမယ်။ နှေးနှေးပဲ လာခဲ့။',
  ugyiChestLine: 'ဖွင့်လိုက်... ဖွင့်လိုက်... အဖိုးတန် ရွှေတွေ အကုန်လုံး မင်းအတွက်ပဲ ဖိုးထောင်ရေ!',
  ugyiStrikeLine: 'ဟားဟားဟား! ငါ့စကားကို တကယ်ယုံလိုက်တာလား ဖိုးထောင်ရေ!',
  typewriterReveal: 'တကယ်တော့ ဒါက ရွှေမြို့တော် မဟုတ်ဘူးဟေ့... ရွှေမြို့တော်က အဝေးကြီး ထပ်သွားရဦးမှာ! ငါက မင်းကို သက်သက် လှည့်စားပြီး စတာကွ...',
  laughCue: 'ဟား ဟား ဟား ဟား!',
  endCardTitle: 'To Be Continued in Chapter 6',
  endCardSub: 'ဟား ဟား ဟား ဟား',
} as const;
