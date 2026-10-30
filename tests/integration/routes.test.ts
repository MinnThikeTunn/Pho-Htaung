import { expect, it } from 'vitest';
import { createAttempt } from '../../src/domain/createAttempt';
import { step } from '../../src/domain/step';
import { NO_INPUT } from '../../src/domain/types';
import type { Attempt, Input } from '../../src/domain/types';

/** Production input only, from actual spawn. No edits to world/outcome state. */
export function driver(preset: 'A'|'B'|'C'='A') {
  const a = createAttempt(preset,'route');
  const trace: { tick:number; input:Partial<Input>; x:number;y:number; events:string[] }[]=[];
  let tick=0;
  const press=(input:Partial<Input>={})=>{step(a,{...NO_INPUT,...input});tick++;if(a.events.length)trace.push({tick,input,x:a.player.centerX,y:a.player.feetY,events:a.events.map(e=>e.kind)});};
  const until=(predicate:(a:Attempt)=>boolean,input:Partial<Input>={},limit=600)=>{
    for(let n=0;n<limit&&!predicate(a)&&a.status!=='DEAD'&&a.status!=='COMPLETE';n++)press(input);
    if(!predicate(a))throw Error(JSON.stringify({message:'route condition failed',x:a.player.centerX,y:a.player.feetY,state:a.status,m:a.machine,stones:a.stones,trace},null,2));
  };
  return {a,press,until,trace};
}

it.each([true,false])('A16 route A: actual spawn → active gate shot → exit, use E=%s',(useTaunt)=>{
  const d=driver(),{a,press,until}=d;
  until(a=>a.player.centerX>=240,{right:true}); press({taunt:true});
  until(a=>a.player.centerX>=438,{right:true});
  press({right:true,jump:true});
  until(a=>a.player.centerX>=1080,{right:true});
  until(a=>a.machine.state==='READY');
  if(useTaunt)press({taunt:true});
  until(a=>a.machine.state==='LOCKED');
  until(a=>a.player.centerX<=990,{left:true});
  until(a=>!a.gateIntact&&a.machine.state==='RECOVER');
  press({jump:true,right:true});
  until(a=>a.player.grounded&&a.player.feetY<640,{right:true});
  press({jump:true,right:true});
  until(a=>a.status==='COMPLETE',{right:true});
  expect(a.coins).toBe(5); expect(a.elapsed).toBeLessThan(20);
  if(useTaunt)expect({seconds:Number(a.elapsed.toFixed(2)),coins:a.coins}).toMatchInlineSnapshot(`
    {
      "coins": 5,
      "seconds": 11.27,
    }
  `);
});

it('A16/A17 route B: actual A spawn → plate → raised lift → intact gate top',()=>{
  const {a,press,until}=driver();
  until(a=>a.player.centerX>=240,{right:true}); press({taunt:true});
  until(a=>a.player.centerX>=398,{right:true}); press({taunt:true});
  until(a=>a.machine.state==='LOCKED');
  until(a=>a.player.centerX<=320,{left:true});
  until(a=>a.stones.some(s=>s.state==='SETTLED'));
  press({right:true,jump:true});
  until(a=>a.player.grounded&&a.player.feetY===544,{right:true});
  press({right:true,jump:true});
  until(a=>a.player.centerX>=540,{right:true});
  until(a=>a.player.grounded&&a.player.support==='fixed_step');
  until(a=>a.player.centerX>=570,{right:true}); press({right:true,jump:true});
  until(a=>a.player.grounded&&a.player.support==='lift',{right:true});
  until(a=>a.player.centerX>=742,{right:true}); press({right:true,jump:true});
  until(a=>a.player.grounded&&a.player.support==='gold_shelf',{right:true});
  until(a=>a.player.centerX>=940,{right:true}); press({right:true,jump:true});
  until(a=>a.player.centerX>=1120,{right:true});
  until(a=>a.player.grounded&&a.player.support==='wood_gate');
  until(a=>a.status==='COMPLETE',{right:true});
  expect(a.gateIntact).toBe(true); expect(a.coins).toBe(15);
  expect(a.elapsed).toBeLessThan(20);
  expect({seconds:Number(a.elapsed.toFixed(2)),coins:a.coins}).toMatchInlineSnapshot(`
    {
      "coins": 15,
      "seconds": 9.27,
    }
  `);
});

it('A16 route C: actual A spawn → break shelf → retrieve fallen pouch → exit',()=>{
  const {a,press,until}=driver();
  until(a=>a.player.centerX>=240,{right:true}); press({taunt:true});
  until(a=>a.player.centerX>=438,{right:true}); press({right:true,jump:true});
  until(a=>a.player.centerX>=896,{right:true});
  if(a.machine.state==='READY')press({taunt:true});
  until(a=>a.machine.state==='LOCKED');
  until(a=>a.player.centerX<=810,{left:true});
  until(a=>a.machine.state==='RECOVER');
  until(a=>a.coins===15,{right:true});
  until(a=>a.player.centerX>=1080,{right:true});
  until(a=>a.machine.state==='READY'); press({taunt:true});
  until(a=>a.machine.state==='LOCKED');
  until(a=>a.player.centerX<=990,{left:true});
  until(a=>!a.gateIntact&&a.machine.state==='RECOVER');
  press({right:true,jump:true});
  until(a=>a.player.grounded&&a.player.feetY<640,{right:true});
  press({right:true,jump:true}); until(a=>a.status==='COMPLETE',{right:true});
  expect(a.coins).toBe(15); expect(a.shelfIntact).toBe(false);
  expect({seconds:Number(a.elapsed.toFixed(2)),coins:a.coins}).toMatchInlineSnapshot(`
    {
      "coins": 15,
      "seconds": 16.28,
    }
  `);
});

it('A16 route D: actual A spawn → home-lift rock → shelf (no raised-lift flag)',()=>{
  const {a,press,until}=driver();
  until(a=>a.player.centerX>=240,{right:true}); press({taunt:true});
  until(a=>a.player.centerX>=438,{right:true}); press({right:true,jump:true});
  until(a=>a.player.centerX>=540,{right:true}); until(a=>a.player.grounded);
  until(a=>a.player.centerX>=570,{right:true}); press({right:true,jump:true});
  until(a=>a.player.centerX>=704,{right:true}); until(a=>a.player.grounded);
  press({taunt:true}); until(a=>a.machine.state==='LOCKED');
  press({left:true,jump:true}); until(a=>a.player.centerX<=540,{left:true}); until(a=>a.player.grounded);
  until(a=>a.machine.state==='RECOVER');
  until(a=>a.player.centerX>=570,{right:true}); press({right:true,jump:true});
  until(a=>a.player.grounded&&a.player.feetY===448,{right:true});
  press({right:true,jump:true}); until(a=>a.player.grounded&&a.player.support==='gold_shelf',{right:true});
  until(a=>a.player.centerX>=940,{right:true}); press({right:true,jump:true});
  until(a=>a.player.centerX>=1120,{right:true}); until(a=>a.player.grounded);
  until(a=>a.status==='COMPLETE',{right:true});
  expect(a.liftY).toBe(544);expect(a.gateIntact).toBe(true);expect(a.coins).toBe(15);
  expect({seconds:Number(a.elapsed.toFixed(2)),coins:a.coins}).toMatchInlineSnapshot(`
    {
      "coins": 15,
      "seconds": 9.45,
    }
  `);
});
