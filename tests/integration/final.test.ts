import { finalRouteInput } from '../helpers/finalRoute';
import { expect,it } from 'vitest';
import { C } from '../../src/content/chapter1';
import { F5,FINAL_INTRO,FINAL_DEFEAT } from '../../src/content/chapter5';
import { ARENA_IDLE,createArena,settleArena } from '../../src/domain/arena';
import type { ArenaInput } from '../../src/domain/arena';
import { createFinalAttempt,equipFinalWeapon,finalCartBody,finalGuarded,finalPlayerBody,settleFinal,stepFinal,unlockFinalExit } from '../../src/domain/finalBoss';
import type { FinalAttempt } from '../../src/domain/finalBoss';
import { overlaps } from '../../src/domain/collision';
import { newCampaign,validateCampaign } from '../../src/domain/settlement';
import { FinalSession } from '../../src/services/FinalSession';
import { CampaignStore } from '../../src/services/CampaignStore';

function tick(a:FinalAttempt,input:ArenaInput=ARENA_IDLE,count=1){for(let i=0;i<count;i++){stepFinal(a,input);expect(Number.isFinite(a.player.centerX)&&Number.isFinite(a.player.feetY)).toBe(true);expect(a.hp).toBeGreaterThanOrEqual(0);expect(a.ammo).toBeGreaterThanOrEqual(0);expect(a.boss.hp).toBeGreaterThanOrEqual(0);expect(overlaps(finalPlayerBody(a),finalCartBody(a)),`player/cart overlap at ${a.player.centerX},${a.player.feetY}; cart ${a.cart.x}`).toBe(false);}}
function campaign(gold=0){const c=newCampaign('final-campaign');c.bridgeCompleted=c.chapter2Completed=c.chapter3Completed=c.chapter4Completed=true;c.walletCoins=gold;c.chapter2BestBankedCoins=gold;return c;}
function route(id:string,sling:boolean){const a=createFinalAttempt(id,sling);if(sling)equipFinalWeapon(a,'SLING');
  for(let i=0;i<18000&&a.status!=='FAILED'&&a.status!=='BOSS_DOWN';i++)tick(a,finalRouteInput(a,sling));
  expect(a.status,`route(${sling}) hp=${a.hp};boss=${a.boss.hp},${a.boss.phase},x=${a.boss.x};p=${a.player.centerX},${a.player.feetY};time=${a.combatSeconds};ammo=${a.ammo}`).toBe('BOSS_DOWN');
  expect(unlockFinalExit(a)).toBe(true);const combat=a.combatSeconds;
  for(let i=0;i<1000&&a.status!=='COMPLETE';i++){const obstacle=a.player.centerX<a.cart.x&&a.cart.x-a.player.centerX<135;tick(a,{...ARENA_IDLE,right:true,jump:obstacle&&a.player.grounded});}
  expect(a.status).toBe('COMPLETE');expect(a.combatSeconds).toBe(combat);return a;}

it.each([false,true])('real-spawn final route wins with live attacks and actual exit, sling=%s',sling=>{const a=route(`route-${sling}`,sling);expect(a.hp).toBeGreaterThan(0);expect(a.boss.phase2).toBe(true);expect(a.cartStops).toBeGreaterThan(0);if(sling)expect(a.shotsFired).toBeGreaterThan(0);else expect(a.punchesHit).toBe(18);});
it('starts with hands, no clock/AI before effective input and no K auto-equip',()=>{const a=createFinalAttempt('wait',true);tick(a,{...ARENA_IDLE,sling:true},90);expect(a.elapsed).toBe(0);expect(a.weapon).toBe('FISTS');expect(a.boss.x).toBe(F5.bossSpawn);expect(a.shots).toEqual([]);});
it('feedback records actual health lost, source and timing, and retry clears it',()=>{
  const a=createFinalAttempt('feedback');a.status='ACTIVE';a.player.centerX=a.boss.x-70;a.hp=7;a.boss.phase='SLAM';a.boss.left=.1;a.boss.targetX=a.player.centerX;tick(a);
  expect(a.lastHurt).toEqual({source:'SLAM',damage:7,at:a.elapsed});expect(a.status).toBe('FAILED');
  const s=new FinalSession(()=>'retry-feedback',false,true);s.attempt=a;s.restart();expect(s.attempt.lastHurt).toBeNull();expect(s.attempt.lastBossHit).toBeNull();
  const b=createFinalAttempt('boss-feedback');b.player.centerX=b.boss.x-55;tick(b,{...ARENA_IDLE,punch:true});expect(b.lastBossHit).toBeNull();
  b.boss.phase='RECOVER';b.boss.left=2;b.boss.hp=6;b.punchLeft=0;tick(b,{...ARENA_IDLE,punch:true});expect(b.lastBossHit).toEqual({damage:6,at:b.elapsed});
});
it('a projectile stopped by the cart reports cover rather than a shield block',()=>{
  const a=createFinalAttempt('cover-feedback',true);a.status='ACTIVE';a.boss.left=100;a.shots.push({id:0,x:a.cart.x-85,y:C.floor-40,vx:F5.shotSpeed,vy:0,age:0,damage:30});
  const events:string[]=[];for(let i=0;i<6;i++){tick(a);events.push(...a.events);}expect(events).toContain('cart_block');expect(events).not.toContain('block');expect(a.lastBossHit).toBeNull();
});
it('front guard blocks J and K with feedback; rear/recovery hits work',()=>{
  const a=createFinalAttempt('guard',true);a.player.centerX=a.boss.x-55;tick(a,{...ARENA_IDLE,punch:true});expect(a.boss.hp).toBe(F5.bossHealth);expect(a.events).toContain('block');
  a.boss.phase='RECOVER';a.boss.left=2;a.punchLeft=0;tick(a,{...ARENA_IDLE,punch:true});expect(a.boss.hp).toBe(170);
  const b=createFinalAttempt('rear');b.boss.phase='SLAM_WINDUP';b.boss.left=.8;b.player.centerX=b.boss.x+55;b.player.facing=-1;tick(b,{...ARENA_IDLE,punch:true});expect(b.boss.hp).toBe(170);expect(b.boss.phase).toBe('SLAM_WINDUP');
});
it('cart blocks projectiles before a boss',()=>{
  const a=createFinalAttempt('cover',true);equipFinalWeapon(a,'SLING');a.boss.phase='RECOVER';a.boss.left=3;tick(a,{...ARENA_IDLE,sling:true},34);tick(a);tick(a,ARENA_IDLE,80);expect(a.boss.hp).toBe(180);expect(a.shots).toEqual([]);
});
it('cart can be pushed and stood on',()=>{
  const a=createFinalAttempt('cart');a.player.centerX=a.cart.x-F5.cartW/2-C.playerW/2;const start=a.cart.x;tick(a,{...ARENA_IDLE,right:true},10);expect(a.cart.x).toBeGreaterThan(start);expect(a.player.pushing).toBe(true);
  a.boss.left=100;tick(a,{...ARENA_IDLE,right:true,jump:true});for(let i=0;i<60;i++)tick(a,{...ARENA_IDLE,right:i<12});expect(a.player.support).toBe('final_cart');
});
it('a resting cart cannot be pushed through the boss',()=>{
  const a=createFinalAttempt('blocked-cart');a.status='ACTIVE';a.boss.left=100;a.cart.x=a.boss.x-F5.bossW/2-F5.cartW/2-C.epsilon;
  a.player.centerX=a.cart.x-F5.cartW/2-C.playerW/2-C.epsilon;const x=a.cart.x;tick(a,{...ARENA_IDLE,right:true},30);expect(a.cart.x).toBeCloseTo(x);
});
it('a rolling cart hurts once, respects dodge, and carries a top rider',()=>{
  const setup=()=>{const a=createFinalAttempt('rolling');a.status='ACTIVE';a.boss.left=100;a.player.centerX=a.cart.x-90;a.cart.mode='ROLLING';a.cart.vx=-F5.cartRollSpeed;return a;};
  const hit=setup();tick(hit,ARENA_IDLE,40);expect(hit.hp).toBe(76);
  const dodge=setup();tick(dodge,{...ARENA_IDLE,left:true,dodge:true},1);tick(dodge,ARENA_IDLE,6);expect(dodge.hp).toBe(100);
  const top=setup();top.player.centerX=top.cart.x;top.player.feetY=C.floor-F5.cartH;top.player.support='final_cart';const x=top.player.centerX;tick(top,ARENA_IDLE,10);expect(top.hp).toBe(100);expect(top.player.centerX).toBeLessThan(x);expect(top.player.support).toBe('final_cart');
});
it('same held inputs agree at 30/60/144Hz; stalls cap and terminal damage cannot pay out',()=>{
  const states=[30,60,144].map(hz=>{const s=new FinalSession(()=>'same',true,true);s.equipWeapon('SLING');for(let i=0;i<hz*2;i++)s.tick(1/hz,{...ARENA_IDLE,sling:true});return s.attempt;});expect(states[1]).toEqual(states[0]);expect(states[2]).toEqual(states[0]);
  const s=new FinalSession(()=>'stall',false,true);s.tick(20,{...ARENA_IDLE,right:true});expect(s.attempt.elapsed).toBeCloseTo(C.dt*C.maxSteps);expect(s.droppedBacklog).toBeGreaterThan(19);
  const a=createFinalAttempt('dead');a.status='ACTIVE';a.hp=24;a.player.centerX=a.boss.x-70;a.boss.phase='SLAM';a.boss.left=.1;a.boss.targetX=a.player.centerX;tick(a);expect(a.status).toBe('FAILED');expect(unlockFinalExit(a)).toBe(false);expect(()=>settleFinal(campaign(),a)).toThrow();
});
it('Chapter4 replay preserves an already finished campaign and debt settlement',()=>{
  const c=settleFinal(campaign(10),route('finished',false)),a=createArena('c4-replay',true);a.status='COMPLETE';a.combatWon=true;a.apes.forEach(b=>b.hp=0);a.player.centerX=1220;a.player.feetY=C.floor;a.player.grounded=true;a.player.control='EXITING';
  const next=settleArena(c,a);expect(next.resumeAt).toBe('CAMPAIGN_COMPLETE');expect(next.walletCoins).toBe(0);expect(next.debtRepaidGold).toBe(10);expect(validateCampaign(next)).toBe(true);
});
it('renewable edge stones cost no gold and Chapter5 has no Chapter4 deadline',()=>{
  for(const x of F5.refillX){const a=createFinalAttempt('refill',true);a.status='ACTIVE';a.player.centerX=x;a.ammo=0;a.boss.left=100;tick(a,ARENA_IDLE,49);expect(a.ammo).toBe(12);}
  const a=createFinalAttempt('no-deadline');a.status='ACTIVE';a.combatSeconds=76;a.boss.left=100;tick(a);expect(a.status).toBe('ACTIVE');
});
it('invalid final results cannot debit gold or unlock an ending',()=>{
  const valid=route('invalid',false),c=campaign(15);
  for(const invalid of [{...valid,hp:NaN},{...valid,combatSeconds:Infinity},{...valid,shotsFired:-1},{...valid,player:{...valid.player,centerX:NaN}},{...valid,boss:{...valid.boss,hp:1}}])expect(()=>settleFinal(c,invalid)).toThrow('Invalid final completion');
  const good=settleFinal(c,valid);expect(validateCampaign({...good,debtRepaidGold:9})).toBe(false);expect(validateCampaign({...good,lastChapter5Result:{...good.lastChapter5Result!,ending:'ESCAPED'}})).toBe(false);expect(c.walletCoins).toBe(15);
});
it('slam locks a truthful target and includes a jumping player in its vertical area',()=>{
  const a=createFinalAttempt('slam');a.player.centerX=a.boss.x-80;a.boss.left=0;tick(a,{...ARENA_IDLE,punch:true});expect(a.boss.phase).toBe('SLAM_WINDUP');const target=a.boss.targetX;
  tick(a,{...ARENA_IDLE,jump:true});tick(a,ARENA_IDLE,48);expect(a.boss.targetX).toBe(target);expect(a.hp).toBeLessThan(100);
});
it('rush locks direction, collides with the actual cart and opens a longer counter window',()=>{
  const a=createFinalAttempt('rush');tick(a,{...ARENA_IDLE,punch:true});for(let i=0;i<200&&a.cartStops===0;i++)tick(a);expect(a.cartStops).toBe(1);expect(a.boss.phase).toBe('STUN');expect(a.boss.hp).toBe(180);
});
it('phase2 push is physical, locks its warning direction and can be interrupted while exposed',()=>{
  const a=createFinalAttempt('push');a.status='ACTIVE';a.boss.phase2=true;a.boss.hp=90;a.boss.x=a.cart.x+100;a.boss.phase='CART_APPROACH';a.boss.left=2;tick(a);expect(a.boss.phase).toBe('CART_WINDUP');const direction=a.boss.facing;
  a.player.centerX=a.boss.x+55;a.player.facing=-1;tick(a,{...ARENA_IDLE,punch:true});expect(a.boss.hp).toBe(80);expect(a.boss.phase).toBe('RECOVER');expect(a.cart.mode).toBe('REST');
  const b=createFinalAttempt('push-lock');b.boss.x=b.cart.x+100;b.boss.phase='CART_APPROACH';b.boss.left=2;tick(b,{...ARENA_IDLE,punch:true});b.player.centerX=1100;tick(b,ARENA_IDLE,55);expect(Math.sign(b.cart.vx)).toBe(direction);
});
it('story lines, skip, defeat confirmation and pause are independent of simulation time',()=>{
  const s=new FinalSession(()=>'story');s.tick(20,{...ARENA_IDLE,right:true});expect(s.attempt.elapsed).toBe(0);expect(s.currentLine()).toEqual(FINAL_INTRO[0]);
  for(let i=0;i<FINAL_INTRO.length;i++)s.advanceStory();expect(s.stage).toBe('COMBAT');s.setPause(true);const before=structuredClone(s.attempt);s.tick(10,{...ARENA_IDLE,right:true});expect(s.attempt).toEqual(before);s.setPause(false);s.restart();expect(s.stage).toBe('COMBAT');expect(s.attempt.weapon).toBe('FISTS');expect(FINAL_DEFEAT.length).toBe(4);
});
it('two endings debit exactly10 once, preserve zero-gold completion and replay can improve ending',()=>{
  const a=route('settle',false),poor=settleFinal(campaign(),a);expect(poor.lastChapter5Result?.ending).toBe('ESCAPED');expect(poor.walletCoins).toBe(0);expect(validateCampaign(poor)).toBe(true);
  const rich=settleFinal(campaign(15),a);expect(rich.lastChapter5Result?.ending).toBe('DEBT_FREE');expect(rich.walletCoins).toBe(5);expect(rich.debtRepaidGold).toBe(10);expect(settleFinal(rich,a)).toBe(rich);expect(validateCampaign(rich)).toBe(true);
  const replay=structuredClone(a);replay.id='other';const again=settleFinal(rich,replay);expect(again.walletCoins).toBe(5);expect(again.lastChapter5Result?.debtPaidNow).toBe(0);expect(again.lastChapter5Result?.ending).toBe('DEBT_FREE');
  const improved={...poor,walletCoins:10};const upgrade=settleFinal(improved,replay);expect(upgrade.walletCoins).toBe(0);expect(upgrade.lastChapter5Result?.ending).toBe('DEBT_FREE');
});
it('final save survives a storage failure/retry and old schema2 saves remain valid',()=>{
  let raw=JSON.stringify(campaign(10)),fail=true;const store=new CampaignStore({read:()=>raw,write:v=>{if(fail)throw Error('quota');raw=v;}},'x');const a=route('save',false);store.completeFinal(a);expect(store.unsaved).toBe(true);expect(store.campaign.walletCoins).toBe(0);fail=false;expect(store.save()).toBe(true);const reload=new CampaignStore({read:()=>raw,write:()=>{}},'x');expect(reload.loadError).toBeNull();expect(reload.campaign.resumeAt).toBe('CAMPAIGN_COMPLETE');
  const old=campaign();delete old.chapter5Completed;delete old.debtRepaidGold;delete old.lastChapter5Result;old.resumeAt='CHAPTER_5_PENDING';expect(validateCampaign(old)).toBe(true);expect(validateCampaign({...old,resumeAt:'CAMPAIGN_COMPLETE'})).toBe(false);
});
