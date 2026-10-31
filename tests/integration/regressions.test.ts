import { expect,it } from 'vitest';
import { C } from '../../src/content/chapter1';
import { createAttempt } from '../../src/domain/createAttempt';
import { NO_INPUT } from '../../src/domain/types';
import type { Attempt,Input } from '../../src/domain/types';
import { step,playerRect,stoneRect } from '../../src/domain/step';
import { overlaps } from '../../src/domain/collision';
import { Session } from '../../src/services/Session';
import { CampaignStore } from '../../src/services/CampaignStore';
import { newCampaign } from '../../src/domain/settlement';

const advance=(a:Attempt,n:number,input:Partial<Input>={})=>{for(let i=0;i<n;i++)step(a,{...NO_INPUT,...input});};
it('A10: ten active drop cycles remain recoverable with input-only dodges',()=>{
  const a=createAttempt('A','long');let drops=0,shatters=0;
  const tick=(input:Partial<Input>={})=>{step(a,{...NO_INPUT,...input});drops+=a.events.filter(e=>e.kind==='drop').length;shatters+=a.events.filter(e=>e.kind==='shatter').length;expect(a.status).not.toBe('DEAD');for(const s of a.stones)expect(overlaps(playerRect(a.player),stoneRect(s))).toBe(false);};
  const until=(predicate:()=>boolean,input:Partial<Input>={})=>{let n=0;while(!predicate()&&n++<600)tick(input);expect(predicate()).toBe(true);};
  for(let pair=0;pair<5;pair++){
    if(pair)until(()=>a.player.centerX<=97,{left:true});
    tick({taunt:true});until(()=>a.machine.state==='LOCKED');until(()=>a.player.centerX>=188,{right:true});until(()=>a.machine.state==='READY');
    tick({taunt:true});until(()=>a.machine.state==='LOCKED');until(()=>a.player.centerX>=275,{right:true});until(()=>a.machine.state==='READY');
  }
  expect(drops).toBe(10);expect(shatters).toBe(5);expect(a.stones).toHaveLength(0);
});
it('A14: lift stops on an airborne player at its underside, then resumes as they fall away',()=>{
  const a=createAttempt('A','lift');a.status='ACTIVE';a.liftY=500;a.player.centerX=704;a.player.feetY=572;
  advance(a,1);expect(a.liftY).toBe(500);expect(a.player.feetY).toBeGreaterThan(572);
  advance(a,60);expect(a.liftY).toBe(544);expect(a.status).toBe('ACTIVE');
});
it('A14: descending lift also stops on a floor-supported stone',()=>{
  const a=createAttempt('A','lift');a.status='ACTIVE';a.liftY=424;
  a.stones.push({id:'floor',centerX:704,bottomY:640,vy:0,state:'SETTLED',support:'ground'});
  advance(a,120);expect(a.liftY).toBe(528);expect(a.stones[0]!.bottomY).toBe(640);
});
it('A31: actual grounded-side input lock clears the step obstruction',()=>{
  const a=createAttempt('A','side');a.player.centerX=450;
  a.stones.push({id:'step-block',centerX:528,bottomY:544,vy:0,state:'SUPPORTED',support:'fixed_step'});
  step(a,{...NO_INPUT,taunt:true});advance(a,32);expect(a.machine.state).toBe('LOCKED');
  advance(a,27,{left:true});advance(a,100);
  expect(a.status).toBe('ACTIVE');expect(a.stones).toHaveLength(0);
});
it('A28: 30/60/144 Hz rendering yields identical production fixed-step traces',()=>{
  const snapshots=[30,60,144].map(rate=>{const s=new Session('A',()=> 'same');s.attempt.pickups.find(p=>p.id==='coin_04')!.disarmed=true;for(let i=0;i<rate*2;i++)s.tick(1/rate,{...NO_INPUT,right:true});return s.attempt;});
  expect(snapshots[0]).toEqual(snapshots[1]);expect(snapshots[1]).toEqual(snapshots[2]);
});
it('A03: busy E presses neither queue nor interrupt machine',()=>{
  const a=createAttempt('A','spam');step(a,{...NO_INPUT,taunt:true});
  let taunts=0;for(let i=0;i<60;i++){step(a,{...NO_INPUT,taunt:true});taunts+=a.events.filter(e=>e.kind==='taunt').length;}
  expect(taunts).toBe(0);expect(a.machine.state).toBe('LOCKED');
});
it('T14: newly opened unsaved campaign cannot overwrite another first writer',()=>{
  let raw:string|null=null;const adapter={read:()=>raw,write:(s:string)=>{raw=s;}};
  const first=new CampaignStore(adapter,'a'),second=new CampaignStore(adapter,'b');
  expect(first.save()).toBe(true);expect(second.save()).toBe(false);expect(second.conflict).toBe(true);expect(JSON.parse(raw!).campaignId).toBe('a');
});
it('T14: externally corrupted save is preserved until an explicit reset',()=>{
  let raw=JSON.stringify(newCampaign('a'));const store=new CampaignStore({read:()=>raw,write:(s:string)=>{raw=s;}},'a');
  raw='{broken';expect(store.save()).toBe(false);expect(raw).toBe('{broken');store.reset('new');expect(JSON.parse(raw).campaignId).toBe('new');
});
it('T08: pushed plate rock cannot penetrate fixed step',()=>{
  const a=createAttempt('A','push');a.status='ACTIVE';a.player.centerX=334;
  a.stones.push({id:'plate',centerX:400,bottomY:640,vy:0,state:'SETTLED',support:'ground'});
  advance(a,180,{right:true});expect(a.stones[0]!.centerX).toBe(432);expect(a.plateWeighted).toBe(true);
  // The fixed step stops this chain at x432. Pulling is intentionally unavailable;
  // a later falling shot is the tested non-magical way to clear it (A13).
  expect(a.player.centerX).toBeLessThanOrEqual(366+C.epsilon);
});
it('A12: pushing a plate rock left clears derived pressure and lowers lift',()=>{
  const a=createAttempt('A','release');a.status='ACTIVE';a.liftY=424;a.plateWeighted=true;a.player.centerX=446;
  a.stones.push({id:'plate',centerX:380,bottomY:640,vy:0,state:'SETTLED',support:'ground'});
  advance(a,50,{left:true});expect(a.plateWeighted).toBe(false);expect(a.liftY).toBeGreaterThan(424);
});
it('T08: three touching grounded stones move as one chain and stop at step',()=>{
  const a=createAttempt('A','chain');a.status='ACTIVE';
  a.stones=[162,258,354].map((x,i)=>({id:`r${i}`,centerX:x,bottomY:640,vy:0,state:'SETTLED',support:'ground'}));
  advance(a,120,{right:true});expect(a.stones.map(s=>s.centerX)).toEqual([240,336,432]);expect(a.player.centerX).toBe(174);
});
it('T07: an earlier rock shatter removes a later player hazard in the same sweep',()=>{
  const a=createAttempt('A','order');a.status='ACTIVE';a.player.centerX=162;
  a.stones=[{id:'base',centerX:96,bottomY:640,vy:0,state:'SETTLED',support:'ground'},{id:'fall',centerX:144,bottomY:530,vy:6000,state:'FALLING',support:null}];
  advance(a,1);expect(a.status).toBe('ACTIVE');expect(a.stones).toHaveLength(0);
});
it.each(['gate','world'])('T08: touching chain stops against %s without deletion',(wall)=>{
  const a=createAttempt('A','bound');a.status='ACTIVE';a.gateIntact=wall==='gate';a.player.centerX=wall==='gate'?784:960;
  const starts=wall==='gate'?[850,946,1042]:[1026,1122,1218];
  a.stones=starts.map((centerX,i)=>({id:`r${i}`,centerX,bottomY:640,vy:0,state:'SETTLED',support:'ground'}));
  advance(a,120,{right:true});if(wall==='gate')expect(a.gateIntact).toBe(false);expect(a.stones).toHaveLength(3);
});
it.each(['player','stone'])('T09: lift carries supported %s without a dangling support',(body)=>{
  const a=createAttempt('A','carry');a.status='ACTIVE';a.liftY=500;a.plateWeighted=true;
  a.stones.push({id:'plate',centerX:400,bottomY:640,vy:0,state:'SETTLED',support:'ground'});
  if(body==='player'){a.player.centerX=704;a.player.feetY=500;}
  else a.stones.push({id:'rider',centerX:704,bottomY:500,vy:0,state:'SUPPORTED',support:'lift'});
  advance(a,10);
  expect(a.liftY).toBe(480);
  if(body==='player'){expect(a.player.feetY).toBe(480);expect(a.player.support).toBe('lift');}
  else{expect(a.stones[1]!.bottomY).toBe(480);expect(a.stones[1]!.support).toBe('lift');}
});
