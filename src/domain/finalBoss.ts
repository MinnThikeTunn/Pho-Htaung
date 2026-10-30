import { C } from '../content/chapter1';
import { F5 } from '../content/chapter5';
import { overlaps, sweep } from './collision';
import type { Body } from './collision';
import type { ArenaInput, ArenaWeapon } from './arena';
import type { Campaign, Player } from './types';

export type FinalPhase = 'GUARD'|'SLAM_WINDUP'|'SLAM'|'RUSH_WINDUP'|'RUSH'|'CART_APPROACH'|'CART_WINDUP'|'RECOVER'|'STUN'|'DOWN';
export interface FinalBoss { x:number; hp:number; facing:-1|1; phase:FinalPhase; left:number; targetX:number; startX:number; hit:boolean; turn:number; phase2:boolean; hitLeft:number; blockLeft:number }
export interface FinalCart { x:number; vx:number; mode:'REST'|'ROLLING'; hitPlayer:boolean }
export interface FinalShot { id:number; x:number; y:number; vx:number; vy:number; age:number; damage:number }
export type FinalEvent = 'shot'|'empty'|'punch'|'block'|'cart_block'|'hit'|'hurt'|'dodge'|'refill'|'crash'|'phase2'|'push'|'down'|'failed'|'complete';
export type FinalHurtSource='SLAM'|'RUSH'|'CART';
export interface FinalAttempt {
  id:string; status:'WAITING'|'ACTIVE'|'FAILED'|'BOSS_DOWN'|'SAFE_EXIT'|'COMPLETE';
  player:Player; hp:number; hasSling:boolean; weapon:ArenaWeapon; ammo:number;
  boss:FinalBoss; cart:FinalCart; shots:FinalShot[]; nextShot:number; shotsFired:number; punchesHit:number; cartStops:number;
  elapsed:number; combatSeconds:number; charge:number; aimFacing:-1|1; wasSling:boolean;
  punchLeft:number; slingLeft:number; dodgeLeft:number; dodgeCooldown:number; dodgeDirection:-1|1;
  hurtLeft:number; staggerLeft:number; refill:number; events:FinalEvent[];
  lastHurt:{source:FinalHurtSource;damage:number;at:number}|null;
  lastBossHit:{damage:number;at:number}|null;
}
export interface FinalResult { attemptId:string; activeSeconds:number; remainingHealth:number; shotsFired:number; punchesHit:number; cartStops:number; goldAtExit:number; debtPaidNow:number; ending:'ESCAPED'|'DEBT_FREE' }
export function createFinalAttempt(id:string,hasSling=false):FinalAttempt {
  return {id,status:'WAITING',hp:F5.health,hasSling,weapon:'FISTS',ammo:hasSling?F5.ammo:0,
    player:{centerX:F5.spawnX,feetY:C.floor,vx:0,vy:0,grounded:true,support:'final_floor',coyote:C.coyote,jumpBuffer:0,control:'FREE',tauntLeft:0,facing:1,pushing:false},
    boss:{x:F5.bossSpawn,hp:F5.bossHealth,facing:-1,phase:'GUARD',left:F5.firstGuard,targetX:F5.spawnX,startX:F5.bossSpawn,hit:false,turn:0,phase2:false,hitLeft:0,blockLeft:0},
    cart:{x:F5.cartSpawn,vx:0,mode:'REST',hitPlayer:false},shots:[],nextShot:0,shotsFired:0,punchesHit:0,cartStops:0,
    elapsed:0,combatSeconds:0,charge:0,aimFacing:1,wasSling:false,punchLeft:0,slingLeft:0,dodgeLeft:0,dodgeCooldown:0,dodgeDirection:-1,hurtLeft:0,staggerLeft:0,refill:0,events:[],lastHurt:null,lastBossHit:null};
}
export function equipFinalWeapon(a:FinalAttempt,weapon:ArenaWeapon):boolean {
  if(a.status==='FAILED'||a.status==='COMPLETE'||(weapon==='SLING'&&!a.hasSling))return false;
  a.weapon=weapon;a.charge=0;a.wasSling=false;return true;
}
export const finalCartBody=(a:FinalAttempt):Body=>({id:'final_cart',x:a.cart.x-F5.cartW/2,y:C.floor-F5.cartH,w:F5.cartW,h:F5.cartH,vx:0,vy:0,kind:'solid'});
export const finalBossBody=(a:FinalAttempt):Body=>({id:'ugyi',x:a.boss.x-F5.bossW/2,y:C.floor-F5.bossH,w:F5.bossW,h:F5.bossH,vx:0,vy:0,kind:'solid'});
export const finalPlayerBody=(a:FinalAttempt):Body=>{
  const isCrouch=a.player.control==='LAYING'||a.dodgeLeft>0;
  const h=isCrouch?Math.round(C.playerH*0.45):C.playerH;
  return {id:'phoe',x:a.player.centerX-C.playerW/2,y:a.player.feetY-h,w:C.playerW,h,vx:0,vy:0,kind:'player'};
};
export const finalSlamArea=(a:FinalAttempt):Body=>({id:'slam',x:a.boss.targetX-F5.slamHalfWidth,y:C.floor-F5.slamHeight,w:F5.slamHalfWidth*2,h:F5.slamHeight,vx:0,vy:0,kind:'solid'});
export function finalGuarded(a:FinalAttempt):boolean { return ['GUARD','SLAM_WINDUP','RUSH_WINDUP','RUSH','CART_APPROACH'].includes(a.boss.phase); }
function hurt(a:FinalAttempt,amount:number,source:FinalHurtSource) {
  if(a.hurtLeft>0||a.dodgeLeft>F5.dodgeTime-F5.dodgeInvulnerable||a.boss.hp<=0)return;
  const before=a.hp;a.hp=Math.max(0,a.hp-amount);a.lastHurt={source,damage:before-a.hp,at:a.elapsed};a.hurtLeft=F5.hurtGrace;a.staggerLeft=F5.hurtStagger;a.charge=0;a.events.push('hurt');
}
function damage(a:FinalAttempt,amount:number,fromDirection:-1|1,punch=false) {
  const b=a.boss;if(b.hp<=0)return;
  if(finalGuarded(a)&&fromDirection===b.facing){b.blockLeft=F5.hitFlash;a.events.push('block');return;}
  const before=b.hp;b.hp=Math.max(0,b.hp-amount);a.lastBossHit={damage:before-b.hp,at:a.elapsed};b.hitLeft=F5.hitFlash;if(punch)a.punchesHit++;a.events.push('hit');
  if(b.hp===0){b.phase='DOWN';b.left=0;a.status='BOSS_DOWN';a.shots=[];a.cart.vx=0;a.cart.mode='REST';a.charge=0;a.player.vx=0;a.events.push('down');return;}
  if(b.hp<=F5.bossHealth/2&&!b.phase2){b.phase2=true;a.events.push('phase2');}
  if(b.phase==='CART_WINDUP'){b.phase='RECOVER';b.left=F5.slamRecover;}
}
function fire(a:FinalAttempt) {
  if(a.weapon!=='SLING'||!a.hasSling||a.ammo<=0){a.events.push('empty');return;}
  const p=a.player,dir=a.aimFacing,x=p.centerX+dir*20,y=p.feetY-42;
  const target=(a.boss.x-p.centerX)*dir>0;
  const dx=target?a.boss.x-x:dir*500,dy=target?C.floor-F5.bossH*.55-y:0,len=Math.max(1,Math.hypot(dx,dy));
  // Store the charge-scaled damage with the shot, not a later weapon state.
  const shot:FinalShot={id:a.nextShot++,x,y,vx:dx/len*F5.shotSpeed,vy:dy/len*F5.shotSpeed,age:0,damage:Math.max(1,Math.round(F5.shotDamage*a.charge/F5.chargeTime))};
  a.shots.push(shot);a.shotsFired++;a.ammo--;a.slingLeft=F5.slingCooldown;a.events.push('shot');
}
function recover(a:FinalAttempt,time:number) {a.boss.phase='RECOVER';a.boss.left=time;}
function stepCart(a:FinalAttempt) {
  const c=a.cart,old=c.x;
  if(c.mode==='ROLLING') {
    c.x=Math.max(F5.cartMin,Math.min(F5.cartMax,c.x+c.vx*C.dt));
    c.vx=Math.sign(c.vx)*Math.max(0,Math.abs(c.vx)-F5.cartFriction*C.dt);
    if(c.x===F5.cartMin||c.x===F5.cartMax||c.vx===0){c.vx=0;c.mode='REST';}
  }
  if(a.player.grounded&&a.player.support==='final_cart')a.player.centerX=Math.max(F5.minX,Math.min(F5.maxX,a.player.centerX+c.x-old));
  if(overlaps(finalPlayerBody(a),finalCartBody(a))&&a.player.feetY>C.floor-F5.cartH+C.epsilon) {
    if(c.mode==='ROLLING'&&!c.hitPlayer&&Math.abs(c.vx)>F5.cartDangerSpeed){hurt(a,F5.cartDamage,'CART');c.hitPlayer=true;}
    const side=a.player.centerX<c.x?-1:1;
    a.player.centerX=c.x+side*(F5.cartW/2+C.playerW/2+C.epsilon);
  }
}
function stepPlayer(a:FinalAttempt,input:ArenaInput) {
  const p=a.player,dx=Number(input.right)-Number(input.left),cart=a.cart;
  if(dx&&!a.charge)p.facing=dx>0?1:-1;
  if(input.dodge&&a.dodgeCooldown<=0&&a.boss.hp>0){a.dodgeLeft=F5.dodgeTime;a.dodgeCooldown=F5.dodgeCooldown;a.dodgeDirection=dx?(dx>0?1:-1):p.facing===1?-1:1;a.charge=0;a.events.push('dodge');}
  const dodge=a.dodgeLeft>0;
  const crawling=Boolean(input.crawl)&&p.grounded&&!dodge&&a.boss.hp>0&&a.charge===0;
  if(crawling)p.control='LAYING';
  else if(p.control==='LAYING')p.control='FREE';
  if(!dodge&&!crawling&&a.boss.hp>0) {
    if(input.sling&&a.weapon==='SLING'&&a.hasSling&&a.slingLeft<=0&&a.staggerLeft<=0){if(!a.charge)a.aimFacing=p.facing;a.charge=Math.min(F5.chargeTime,a.charge+C.dt);}
    if(!input.sling&&a.wasSling){if(a.charge>=F5.minimumCharge&&a.slingLeft<=0)fire(a);a.charge=0;}
    if(input.punch&&a.punchLeft<=0&&!a.charge) {
      a.punchLeft=F5.punchCooldown;a.events.push('punch');
      const punch:Body={id:'fist',x:p.facing>0?p.centerX+8:p.centerX-F5.punchReach,y:p.feetY-60,w:F5.punchReach-8,h:60,vx:0,vy:0,kind:'solid'};
      if(overlaps(punch,finalBossBody(a)))damage(a,F5.punchDamage,p.centerX<a.boss.x?-1:1,true);
    }
  }
  a.wasSling=input.sling&&a.weapon==='SLING';
  p.coyote=p.grounded?C.coyote:Math.max(0,p.coyote-C.dt);p.jumpBuffer=input.jump?C.buffer:Math.max(0,p.jumpBuffer-C.dt);
  if(p.coyote>0&&p.jumpBuffer>0&&!dodge&&!crawling){p.vy=C.jump;p.coyote=0;p.jumpBuffer=0;p.grounded=false;}
  const moveSpeed=crawling?C.speed*0.58:C.speed*(a.charge>0?.5:1);
  p.vx=dodge?a.dodgeDirection*F5.dodgeSpeed:dx*moveSpeed;p.pushing=false;
  const oldX=p.centerX;let nextX=Math.max(F5.minX,Math.min(F5.maxX,oldX+p.vx*C.dt));
  const cb=finalCartBody(a),nextBody={...finalPlayerBody(a),x:nextX-C.playerW/2};
  if(overlaps(nextBody,cb)) {
    const side=oldX<=cart.x?-1:1;
    if(p.grounded&&p.feetY>=C.floor-C.epsilon&&dx===-side&&cart.mode==='REST') {
      const oldCart=cart.x;let newCart=Math.max(F5.cartMin,Math.min(F5.cartMax,cart.x+dx*F5.cartPushSpeed*C.dt));
      if(a.boss.hp>0){const boss=finalBossBody(a);if(dx>0&&cart.x<a.boss.x)newCart=Math.min(newCart,boss.x-F5.cartW/2-C.epsilon);if(dx<0&&cart.x>a.boss.x)newCart=Math.max(newCart,boss.x+boss.w+F5.cartW/2+C.epsilon);}
      cart.x=Math.max(F5.cartMin,Math.min(F5.cartMax,newCart));p.pushing=true;p.vx=(cart.x-oldCart)/C.dt;
    }
    nextX=cart.x+side*(F5.cartW/2+C.playerW/2+C.epsilon);
  }
  p.centerX=Math.max(F5.minX,Math.min(a.status==='SAFE_EXIT'?F5.maxX:F5.exitGateX-C.playerW/2,nextX));
  const oldFeet=p.feetY;p.vy=Math.min(C.terminal,p.vy+C.gravity*C.dt);p.feetY=Math.min(C.floor,p.feetY+p.vy*C.dt);
  const cartBody=finalCartBody(a),horizontal=p.centerX+C.playerW/2>cartBody.x+C.epsilon&&p.centerX-C.playerW/2<cartBody.x+cartBody.w-C.epsilon;
  if(p.vy>=0&&oldFeet<=cartBody.y+C.epsilon&&p.feetY>=cartBody.y&&horizontal){p.feetY=cartBody.y;p.vy=0;p.grounded=true;p.support='final_cart';}
  else {p.grounded=p.feetY>=C.floor;p.support=p.grounded?'final_floor':null;if(p.grounded)p.vy=0;}
  if(a.hasSling&&p.grounded&&!p.vx&&!(input.sling&&a.weapon==='SLING')&&a.ammo<F5.ammo&&F5.refillX.some(x=>Math.abs(x-p.centerX)<=F5.refillReach)) {
    a.refill+=C.dt;if(a.refill+1e-9>=F5.refillTime){a.ammo=F5.ammo;a.refill=0;a.events.push('refill');}
  }else a.refill=0;
}
function stepBoss(a:FinalAttempt) {
  const b=a.boss,p=a.player;if(b.hp<=0)return;
  b.left=Math.max(0,b.left-C.dt);
  if(b.phase==='RECOVER'||b.phase==='STUN'){if(b.left<=0){b.phase='GUARD';b.left=F5.guardTime;}return;}
  if(b.phase==='SLAM_WINDUP'){if(b.left<=0){b.phase='SLAM';b.left=F5.slamStrike;b.hit=false;}else return;}
  if(b.phase==='SLAM'){if(!b.hit){if(overlaps(finalPlayerBody(a),finalSlamArea(a)))hurt(a,F5.slamDamage,'SLAM');b.hit=true;}if(b.left<=0)recover(a,F5.slamRecover);return;}
  if(b.phase==='RUSH_WINDUP'){if(b.left<=0){b.phase='RUSH';b.hit=false;}else return;}
  if(b.phase==='RUSH') {
    const before=b.x,dx=b.facing*F5.rushSpeed*C.dt;
    const moving={...finalBossBody(a),vx:b.facing*F5.rushSpeed};const hit=sweep(moving,finalCartBody(a),C.dt);
    if(overlaps(moving,finalCartBody(a))||hit){b.x=a.cart.x-b.facing*(F5.cartW/2+F5.bossW/2+C.epsilon);b.phase='STUN';b.left=F5.cartStun;a.cartStops++;a.events.push('crash');return;}
    b.x=Math.max(F5.bossMin,Math.min(F5.bossMax,b.x+dx));
    if(!b.hit&&overlaps(finalBossBody(a),finalPlayerBody(a))){hurt(a,F5.rushDamage,'RUSH');b.hit=true;}
    if((b.targetX-before)*b.facing<=Math.abs(dx)||b.x===F5.bossMin||b.x===F5.bossMax)recover(a,F5.rushRecover);
    return;
  }
  if(b.phase==='CART_APPROACH') {
    if(a.cart.mode==='ROLLING'||b.left<=0){b.phase='GUARD';b.left=.2;return;}
    b.facing=a.cart.x>b.x?1:-1;
    if(Math.abs(a.cart.x-b.x)<=F5.cartPushReach){b.phase='CART_WINDUP';b.left=F5.cartWarning;b.targetX=a.cart.x+b.facing*250;return;}
    b.x=Math.max(F5.bossMin,Math.min(F5.bossMax,b.x+b.facing*F5.cartApproachSpeed*C.dt));return;
  }
  if(b.phase==='CART_WINDUP') {
    if(b.left<=0){a.cart.vx=b.facing*F5.cartRollSpeed;a.cart.mode='ROLLING';a.cart.hitPlayer=false;recover(a,F5.cartRecover);a.events.push('push');}return;
  }
  b.facing=p.centerX>=b.x?1:-1;
  if(b.left>0)return;
  b.turn++;
  if(b.phase2&&b.turn%3===0&&a.cart.mode==='REST'&&Math.abs(b.x-a.cart.x)<470){b.phase='CART_APPROACH';b.left=F5.cartApproachTime;return;}
  b.startX=b.x;
  if(Math.abs(p.centerX-b.x)<=F5.slamReach){b.phase='SLAM_WINDUP';b.left=F5.slamWarning;b.targetX=p.centerX;}
  else {b.phase='RUSH_WINDUP';b.left=F5.rushWarning;b.targetX=Math.max(F5.bossMin,Math.min(F5.bossMax,b.x+b.facing*Math.min(F5.rushMaxDistance,Math.abs(p.centerX-b.x)+100)));}
}
export function unlockFinalExit(a:FinalAttempt):boolean {
  if(a.status!=='BOSS_DOWN'||a.boss.hp!==0||a.hp<=0)return false;
  a.status='SAFE_EXIT';a.charge=0;a.wasSling=false;a.player.vx=0;return true;
}
export function stepFinal(a:FinalAttempt,input:ArenaInput) {
  a.events=[];if(a.status==='FAILED'||a.status==='COMPLETE'||a.status==='BOSS_DOWN')return;
  if(a.status==='WAITING'&&!(input.left||input.right||input.jump||input.punch||input.dodge||(input.sling&&a.hasSling&&a.weapon==='SLING')))return;
  if(a.status==='WAITING')a.status='ACTIVE';a.elapsed+=C.dt;if(a.boss.hp>0)a.combatSeconds+=C.dt;
  for(const key of ['punchLeft','slingLeft','dodgeLeft','dodgeCooldown','hurtLeft','staggerLeft'] as const)a[key]=Math.max(0,a[key]-C.dt);
  a.boss.hitLeft=Math.max(0,a.boss.hitLeft-C.dt);a.boss.blockLeft=Math.max(0,a.boss.blockLeft-C.dt);
  stepCart(a);stepPlayer(a,input);if(a.boss.hp>0)stepBoss(a);
  const shots:FinalShot[]=[];
  if(a.boss.hp>0)for(const shot of a.shots) {
    const moving:Body={id:String(shot.id),x:shot.x-F5.shotSize/2,y:shot.y-F5.shotSize/2,w:F5.shotSize,h:F5.shotSize,vx:shot.vx,vy:shot.vy,kind:'rock'};
    const hits=[{type:'cart',body:finalCartBody(a)},{type:'boss',body:finalBossBody(a)}].map(target=>({...target,hit:overlaps(moving,target.body)?{t:0}:sweep(moving,target.body,C.dt)})).filter(t=>t.hit!==null).sort((x,y)=>x.hit!.t-y.hit!.t);
    if(hits[0]){if(hits[0].type==='boss')damage(a,shot.damage,shot.vx>0?-1:1);else a.events.push('cart_block');continue;}
    shot.x+=shot.vx*C.dt;shot.y+=shot.vy*C.dt;shot.age+=C.dt;if(shot.age<3&&shot.x>0&&shot.x<C.width&&shot.y>0&&shot.y<C.floor)shots.push(shot);
  }
  a.shots=a.boss.hp>0?shots:[];
  if(a.hp<=0){a.hp=0;a.status='FAILED';a.charge=0;a.player.vx=0;a.events.push('failed');return;}
  if(a.status==='SAFE_EXIT'&&a.player.grounded&&a.player.feetY===C.floor&&a.player.centerX>=F5.exitX){a.status='COMPLETE';a.player.control='EXITING';a.player.vx=0;a.events.push('complete');}
}
export function settleFinal(c:Campaign,a:FinalAttempt):Campaign {
  const integer=(n:number)=>Number.isSafeInteger(n)&&n>=0;
  if(!c.chapter4Completed||!a.id||a.status!=='COMPLETE'||a.boss.hp!==0||!integer(a.hp)||a.hp<1||a.hp>F5.health||!a.player.grounded||!Number.isFinite(a.player.centerX)||a.player.centerX<F5.exitX||a.player.feetY!==C.floor||!Number.isFinite(a.combatSeconds)||a.combatSeconds<0||![a.shotsFired,a.punchesHit,a.cartStops].every(integer))throw Error('Invalid final completion');
  const receipt=`final:${a.id}`;if(c.completedAttemptIds.includes(receipt))return c;
  const next=structuredClone(c),gold=c.walletCoins,already=(c.debtRepaidGold??0)>=F5.debtTarget;
  const paid=!already&&gold>=F5.debtTarget?F5.debtTarget:0;
  next.walletCoins-=paid;next.debtRepaidGold=(c.debtRepaidGold??0)+paid;next.chapter5Completed=true;next.completedAttemptIds.push(receipt);next.resumeAt='CAMPAIGN_COMPLETE';next.revision++;
  next.lastChapter5Result={attemptId:a.id,activeSeconds:a.combatSeconds,remainingHealth:a.hp,shotsFired:a.shotsFired,punchesHit:a.punchesHit,cartStops:a.cartStops,goldAtExit:gold,debtPaidNow:paid,ending:already||paid>0?'DEBT_FREE':'ESCAPED'};
  return next;
}
