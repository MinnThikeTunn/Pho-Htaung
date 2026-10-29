import { C } from './chapter1';

export const F5 = Object.freeze({
  floor:C.floor, spawnX:140, exitX:1220, exitGateX:1212, minX:32, maxX:1248,
  health:100, bossHealth:180, bossSpawn:980, bossW:48, bossH:92, bossMin:74, bossMax:1206,
  debtTarget:10, punchDamage:10, punchReach:86, punchCooldown:.75,
  guardTime:.65, firstGuard:1.2, slamReach:150, slamWarning:.8, slamStrike:.12, slamRecover:1.3,
  slamHalfWidth:48, slamHeight:210, slamDamage:24,
  rushWarning:.9, rushSpeed:410, rushMaxDistance:680, rushRecover:1.0, rushDamage:20, cartStun:2,
  cartSpawn:570, cartW:112, cartH:64, cartMin:220, cartMax:1060,
  cartPushSpeed:C.push, cartRollSpeed:300, cartFriction:180, cartDangerSpeed:80, cartDamage:24,
  cartApproachSpeed:160, cartApproachTime:2.5, cartPushReach:105, cartWarning:.9, cartRecover:1.1,
  chargeTime:.55, minimumCharge:.12, slingCooldown:.48, shotDamage:30, shotSpeed:920, shotSize:12,
  ammo:12, refillTime:.8, refillReach:58, refillX:[100,1170] as readonly number[],
  dodgeTime:.22, dodgeInvulnerable:.15, dodgeCooldown:.85, dodgeSpeed:420,
  hurtGrace:.8, hurtStagger:.3, hitFlash:.18, feedbackTime:.7, punchVisualTime:.2,
});
export const FINAL_DAMAGE_LABELS = {SLAM:'တုတ်ရိုက်ချက်',RUSH:'ဒိုင်းတိုးချက်',CART:'လှိမ့်လာသောလှည်း'} as const;
export interface FinalLine { speaker:'ဦးကြီး'|'ဖိုးထောင်'|'အကြွေးရှင်'; text:string; reveal?:boolean }
export const FINAL_INTRO:readonly FinalLine[] = [
  {speaker:'ဦးကြီး',text:'ဖိုးထောင်ရေ… လူဝံနှစ်ကောင်ကိုပါ ကျော်လာနိုင်တယ်ဆိုတော့ မင်း မဆိုးဘူးကွ။'},
  {speaker:'ဖိုးထောင်',text:'လမ်းကောင်းတယ်ဆိုပြီး ခေါ်လာတာနော်။ လမ်းတစ်လျှောက် ကျုပ်ပဲ ရှင်းနေရတာ။'},
  {speaker:'ဦးကြီး',text:'အဲဒါကြောင့် ဆုရှိတာပေါ့ကွာ။ ဟောဒီရွှေတွေကို ကြည့်စမ်း။'},
  {speaker:'ဖိုးထောင်',text:'ဦးကြီး… ရွှေက အခွံကွာလို့ရတာလား?',reveal:true},
  {speaker:'ဦးကြီး',text:'အဲဒါတွေထားလိုက်။ မင်းကောက်လာတဲ့အိတ်ကို ဒီမှာချခဲ့။ အိမ်ပြန်လမ်းကို ငါပြပေးမယ်။'},
  {speaker:'ဖိုးထောင်',text:'ကျုပ်ကို လမ်းရှင်းခိုင်းပြီး အခု အိတ်ပါယူဦးမယ်ပေါ့။'},
  {speaker:'ဦးကြီး',text:'အေးအေးဆေးဆေးပြောနေတုန်း ပေးလိုက်ပါကွာ။'},
  {speaker:'ဖိုးထောင်',text:'ဒီတစ်ခါတော့ ခင်ဗျားနဲ့ စာရင်းရှင်းရမယ်။'},
];
export const FINAL_DEFEAT:readonly FinalLine[] = [
  {speaker:'ဦးကြီး',text:'ကဲပါ၊ ကဲပါ… ရှုံးပါပြီ။ လမ်းပြခ မယူတော့ဘူး။'},
  {speaker:'ဖိုးထောင်',text:'လမ်းကတော့ ကိုယ့်ဟာကိုယ် ဖွင့်ခဲ့ရတာချည်းပဲ။ သော့ပေး။'},
  {speaker:'ဦးကြီး',text:'ဟိုဘက်ကပါဗျာ။ ကျောက်လှေကားအတိုင်း တက်သွားရုံပါ။'},
  {speaker:'ဖိုးထောင်',text:'ဒီတစ်ခါ လမ်းမှားပြရင်တော့ ခင်ဗျားပါ လိုက်ခဲ့။'},
];
export const FINAL_OUTRO:readonly FinalLine[] = [
  {speaker:'ဖိုးထောင်',text:'ရွှေမြို့တော်တော့ တွေ့ခဲ့ပြီ။ အိမ်ပြန်လမ်းက ပိုရှာရခက်သား။'},
];
export const FINAL_ESCAPE:readonly FinalLine[] = [
  {speaker:'ဖိုးထောင်',text:'ဒီတစ်ခါတော့ အသက်ပါလာပြီ။ ကျန်တာ ဖြည်းဖြည်းချင်း ရှင်းတော့မယ်။'},
];
export const FINAL_DEBT_FREE:readonly FinalLine[] = [
  {speaker:'အကြွေးရှင်',text:'ကဲ… အကြွေးကျေပြီ။ နောက်ဘာလုပ်ဦးမလဲ?'},
  {speaker:'ဖိုးထောင်',text:'အိမ်ပြန်မယ်။ ဒီတစ်ခါ လမ်းတော့ ကိုယ့်ဟာကိုယ်ရွေးမယ်။'},
];
export const FINAL_PHASE_LINE:FinalLine = {speaker:'ဦးကြီး',text:'ရပြီ၊ ရပြီ… ငါက စနောက်တာပါကွာ။'};
