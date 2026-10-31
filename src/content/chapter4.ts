import { C } from './chapter1';

export const SLING_TOOL_ID = 'slingshot';

export const A4 = Object.freeze({
  floor: C.floor, spawnX: 160, minX: 32, maxX: 1248, exitX: 1220,
  health: 3, apeHealth: 150, timeLimit: 75,
  chargeTime: .55, minimumCharge: .12, slingCooldown: .48, shotDamage: 30, shotSpeed: 920,
  silverDamageMultiplier: 2.0,
  ammo: 12, refillTime: .8, refillReach: 58, refillX: [100, 1170] as readonly number[],
  punchCooldown: .75, punchDamage: 1, punchReach: 86, punchStun: .75, punchPush: 80,
  dodgeTime: .22, dodgeInvulnerable: .15, dodgeCooldown: .85, dodgeSpeed: 420,
  hurtGrace: .8, hurtStagger: .3, hitFlash: .18, meleeSpawn: 720, meleeSpeed: 180, meleeReach: 108, meleeWindup: .65, meleeStrike: .16,
  meleeRecover: .85, meleeDamage: 1, throwWindup: .85, throwRecover: 1.1,
  throwCooldown: 1.4, throwFirstCooldown: .25, throwSpeed: 430, throwDamage: 1, attackSpacing: 1.05, firstAttack: 1.2,
  friendlyFireHitsToBrawl: 3, friendlyFireHitDamage: 10, brawlDuration: 1.8, brawlStrikeInterval: .45, brawlDamage: 15,
  pillarX: 380, pillarW: 56, pillarH: 46,
  archX: 580, archW: 88, archClearance: 48, archTopH: 112,
  crawlSpeed: 185, obstacleBonkDamage: 1, obstacleBonkStun: .95, obstacleBonkPush: 44,
  obstacleFirstDelay: 3.2, obstacleIntervalMin: 3.6, obstacleIntervalMax: 5.8, obstacleTtl: 14, maxDroppedObstacles: 3,
  droppedPillarW: 48, droppedPillarH: 44,
  droppedLogW: 62, droppedLogClearance: 46, droppedLogTopH: 92,
  goldTrapX: 980,
});
export const ARENA_ART = {
  background: { key: 'arena_chamber_v1', path: '/assets/chapter4/arena_chamber_v1.png' },
  apes: { key: 'arena_apes_v1', path: '/assets/chapter4/arena_apes_v1.png' },
  brownApeSheet: { key: 'brown_ape_sheet', path: '/assets/chapter4/brown_ape_spritesheet.png', frameWidth: 720, frameHeight: 380 },
  brownApeWalk: { key: 'brown_ape_walk', path: '/assets/chapter4/brown_ape_walk_spritesheet.png', frameWidth: 720, frameHeight: 380 },
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
  entry: 'ဟေ့ ဖိုးထောင်... ခြေကုန်သုတ်ပြေးပြီး ခုန်ရှောင်ကွဲ့! အနားကပ်လာရင် မျက်ခွက်ကို တည့်တည့်ဆော်၊ လောက်လေးခွနဲ့ ခဲကို အားကုန်ဆွဲပစ်ပေတော့!',
  empty: 'လောက်စာခဲ ကုန်ပြီဟေ့! နံရံဘေးက ကျောက်ပုံဆီ အမြန်ပြေးပြီး ကျောက်ခဲတွေ ကောက်ထည့်ဦး!',
  nearPile: 'အဲဒီ ကျောက်ပုံနားမှာ အိတ်ထဲ ကျောက်ခဲတွေ အပြည့်ကောက်ထည့်လိုက်ဦး ငထုံရ!',
  lowAmmo: 'ခဲက နည်းနေပြီဟေ့... လောက်စာကုန်ရင် မင်းကို လူဝံက ဆွဲဆုပ်နယ်ပစ်မှာ! ဘေးက ကျောက်ပုံဆီ ပြေးကပ်ပြီး ဖြည့်ထားဦး!',
  idleWithSling: 'ငေးကြောင်ပြီး ရပ်မနေနဲ့လေ... ဝေးဝေးကနေ လောက်လေးကို အားကုန်ဆွဲပြီး မျက်ခွက်ဆီ လှမ်းလွှတ်ပေတော့!',
  idleFists: 'အညိုကောင် အနားကပ်လာရင် ဝမ်းဗိုက်ကို လက်သီးနဲ့ မညှာတမ်းထိုးပြီး ခွာထုတ်လိုက်စမ်း!',
  meleeWindup: 'အညိုကောင် လက်သီးမြှောက်လိုက်ပြီဟေ့... အမြန် လှိမ့်ရှောင်လိုက် သို့မဟုတ် ကျောက်တိုင်ပေါ် ခုန်တက်!',
  throwWindup: 'မီးခိုးကောင် ကျောက်ခဲချိန်နေပြီ... ကျောက်တန်းအောက် အမြန်ငုံ့လျှိုပြီး ဝမ်းလျားမှောက် ပုန်းလိုက်စမ်း!',
  apeOpen: 'ဟော... လူဝံ အမောဖောက်ပြီး မူးရပ်သွားပြီ! အခု လောက်လေးကို အားကုန်ဆွဲပြီး အမြန် လှမ်းထည့်လိုက်တော့!',
  friendlyFire: 'ဟားဟား... လူဝံချင်း အချင်းချင်း ကျောက်ခဲမှန်ကုန်ပြီဟေ့! ပိုကိုက်အောင် ကြားထဲကနေ ဆွပေးလိုက်!',
  brawl: 'ဟောဗျာ... လူဝံနှစ်ကောင် အချင်းချင်း သတ်ပုတ်နေကြပြီဟေ့! သူတို့ မအားတုန်း ကျောက်တန်းဆီ အသာလေး ခြေသံလုံပြေးပြီး ထွက်ပေါက်ရှာပေတော့!',
  obstacleOutplay: 'ဟားဟားဟား... ကျောက်တန်းကြီးနဲ့ ခေါင်းဆောင့်မိပြီး အညိုကောင် မျက်စိပြာသွားပြီဟေ့! အခု အားကုန်ဆွဲပစ်လိုက်!',
  obstacleDrop: 'ဟော... အညိုကောင် သစ်တုံးကြီး ချလိုက်ပြီ! ခုန်ကျော် သို့မဟုတ် အောက်ကနေ ကုန်းလျှိုရှောင်နော်!',
  nearArch: 'အဲဒီ ကျောက်တန်းအောက်ကနေ ဝမ်းလျားမှောက် ဝင်ပုန်းလိုက်စမ်း! လူဝံတွေ ခဲပစ်ရင် အကာအကွယ်ရတယ်!',
  speedrunWon: 'ဟောဗျာ... တစ်ချက်မှတောင် မပစ်ဘဲ ခုန်ပေါက်ပြေးထွက်လာတာ အတော်သွက်ပါလား ငကြောင်ရ! ထွက်ပေါက်ဆီသာ ဆက်ပြေးပေတော့!',
  won: 'လူဝံနှစ်ကောင်လုံး ပက်လက်လန်သွားပြီဟေ့! ဟော... မြေကြီးပေါ်မှာ ရွှေထုပ်ကြီး ပေါ်လာပါလား! ညာဘက်ထွက်ပေါက်ဆီ ကမန်းကတန်း သွားတော့!',
  greedTaunt: 'မင်းက ရွှေမြင်ရင် မျက်စိကန်းတတ်တဲ့ လောဘအိုးကြီးကိုး လူလေးရ... ဗုံးထုပ်ကို ရွှေထင်ပြီး ပွေ့ဖက်သေရတာ အတော်ဟုတ်နေပြီ!',
  health: 'ဖိုးထောင်... သွေးသံရဲရဲနဲ့ ဖူးရောင်နေပြီဟေ့! အချိန်မီ လှိမ့်ရှောင်ပြီး အဝေးကနေပဲ ချောင်းဆော်စမ်း!',
  timeout: 'တံခါးပိတ်သွားပြီကွဲ့... ရိုးရိုးလက်သီးနဲ့ ထိုးနေရင် အချိန်မမီဘူး၊ လောက်လေးခွကို သွက်သွက်သုံး သို့မဟုတ် အောက်လမ်းနည်းနဲ့ လူဝံချင်း ကျောက်ခဲမှန်အောင် ဆွပေးရမယ်!',
} as const;
