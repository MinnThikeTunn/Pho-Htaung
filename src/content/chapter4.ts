import { C } from './chapter1';

export const SLING_TOOL_ID = 'slingshot';

export const A4 = Object.freeze({
  floor: C.floor, spawnX: 160, minX: 32, maxX: 1248, exitX: 1220,
  health: 100, apeHealth: 150, timeLimit: 75,
  chargeTime: .55, minimumCharge: .12, slingCooldown: .48, shotDamage: 30, shotSpeed: 920,
  silverDamageMultiplier: 2.0,
  ammo: 12, refillTime: .8, refillReach: 58, refillX: [100, 1170] as readonly number[],
  punchCooldown: .75, punchDamage: 1, punchReach: 86, punchStun: .75, punchPush: 80,
  dodgeTime: .22, dodgeInvulnerable: .15, dodgeCooldown: .85, dodgeSpeed: 420,
  hurtGrace: .8, hurtStagger: .3, hitFlash: .18, meleeSpawn: 720, meleeSpeed: 180, meleeReach: 108, meleeWindup: .65, meleeStrike: .16,
  meleeRecover: .85, meleeDamage: 24, throwWindup: .85, throwRecover: 1.1,
  throwCooldown: 1.4, throwFirstCooldown: .25, throwSpeed: 430, throwDamage: 18, attackSpacing: 1.05, firstAttack: 1.2,
  friendlyFireHitsToBrawl: 3, friendlyFireHitDamage: 10, brawlDuration: 1.8, brawlStrikeInterval: .45, brawlDamage: 15,
  pillarX: 380, pillarW: 56, pillarH: 46,
  archX: 580, archW: 88, archClearance: 48, archTopH: 112,
  crawlSpeed: 185, obstacleBonkDamage: 10, obstacleBonkStun: .95, obstacleBonkPush: 44,
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
  entry: 'ဟေ့ ဖိုးထောင်... အညိုကောင်က အနီးကပ်ထိုးမယ်၊ မီးခိုးကောင်က အဝေးက ကျောက်ပစ်မယ်! ကျောက်တိုင်ပေါ် ခုန်တက်ပြီး ကျောက်တန်းအောက်က ငုံ့လျှိုရှောင်ကစားစမ်း!',
  empty: 'ကျောက်ခဲကုန်ပြီဟေ့! ဘေးနှစ်ဖက်က ကျောက်ပုံနားမှာ ခဏရပ်ပြီး ပြန်ဖြည့်လိုက်ဦး!',
  nearPile: 'အဲဒီ ကျောက်ပုံနားမှာ ခဏရပ်နေလိုက်... ကျောက်ခဲ ပြန်ဖြည့်ပေးလိမ့်မယ်!',
  lowAmmo: 'ကျောက်ခဲ နည်းနေပြီနော်... ဘေးက ကျောက်ပုံနား ပြေးကပ်ပြီး ပြန်ဖြည့်ထားဦး!',
  idleWithSling: 'လက်ချည်းပဲ ရပ်မနေနဲ့လေ... လွယ်အိတ်ဖွင့်ပြီး လောက်လေးခွ ထုတ်သုံးစမ်းပါ!',
  idleFists: 'ကျောက်တိုင်ကို ခုန်ကျော်၊ ကျောက်တန်းအောက် ငုံ့လျှိုပြီး အညိုကောင်ကို လှည့်စားလိုက်!',
  meleeWindup: 'အညိုကောင် လက်မြှောက်ပြီဟေ့ — ကျောက်တိုင်ပေါ် ခုန်တက် သို့မဟုတ် အမြန်ရှောင်လိုက်!',
  throwWindup: 'မီးခိုးကောင် ကျောက်ခဲချိန်နေပြီ — ခုန်ရှောင် သို့မဟုတ် ကျောက်တန်းအောက် ဝင်ပုန်းစမ်း!',
  apeOpen: 'ဟော... လူဝံ မောပြီး ရပ်သွားပြီ! အခု အမြန် ပစ်ထည့်လိုက်!',
  friendlyFire: 'ဟားဟား... လူဝံချင်း အချင်းချင်း ထိကုန်ပြီဟေ့! နောက်ထပ် ထိအောင် ဆွပေးလိုက်!',
  brawl: 'ဟောဗျာ... လူဝံနှစ်ကောင် စိတ်ဆိုးပြီး အချင်းချင်း ထိုးကုန်ကြပြီဟေ့! အသာလေး ကြည့်နေလိုက်ဦး!',
  obstacleOutplay: 'ဟားဟား... ကျောက်တန်းနဲ့ တိုက်မိပြီး အညိုကောင် မူးသွားပြီဟေ့! အခု အမြန် ပစ်ထည့်လိုက်!',
  obstacleDrop: 'ဟော... အညိုကောင် လမ်းပိတ်ဖို့ အတားအဆီး ချလိုက်ပြီ! ခုန်ကျော် သို့မဟုတ် ငုံ့ရှောင်ပြီး မပိတ်မိအောင် ကစားနော်!',
  nearArch: 'အဲဒီ ကျောက်တန်းအောက်က ငုံ့လျှိုဝင်လိုက်ရင် အညိုကောင် ဝင်ဆောင့်မိလိမ့်မယ်!',
  won: 'လူဝံနှစ်ကောင်လုံး လဲပြီဟေ့! ဟော... မြေပြင်ပေါ်မှာ ရွှေထုပ်တစ်ထုပ် ပေါ်လာပါလား! ညာဘက်ထွက်ပေါက်ဆီ သွားတော့!',
  greedTaunt: '“မင်းက လောဘကြီးတာကိုး လူလေးရဲ့!”',
  health: 'ဖိုးထောင် ဒဏ်ရာများနေပြီ! အချိန်မှန် ရှောင်ပြီး အဝေးကနေပဲ ချောင်းပစ်ပါ!',
  timeout: 'တံခါးပိတ်သွားပြီကွဲ့... လက်သီးသက်သက်နဲ့ အချိန်မလောက်ဘူး၊ လောက်လေးခွကို အသုံးချမှ ရမယ်!',
} as const;


