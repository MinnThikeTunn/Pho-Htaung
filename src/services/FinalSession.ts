import { C } from '../content/chapter1';
import { FINAL_DEBT_FREE, FINAL_DEFEAT, FINAL_ESCAPE, FINAL_INTRO, FINAL_OUTRO } from '../content/chapter5';
import type { FinalLine } from '../content/chapter5';
import { createFinalAttempt, equipFinalWeapon, stepFinal, unlockFinalExit } from '../domain/finalBoss';
import type { FinalAttempt, FinalEvent } from '../domain/finalBoss';
import type { ArenaInput, ArenaWeapon } from '../domain/arena';

export type FinalStoryStage='INTRO'|'COMBAT'|'DEFEAT'|'EXIT'|'OUTRO'|'FINISHED';
export class FinalSession {
  attempt:FinalAttempt;paused=false;accumulator=0;generation=0;droppedBacklog=0;
  stage:FinalStoryStage;storyIndex=0;introSeen=false;ending:'ESCAPED'|'DEBT_FREE'='ESCAPED';
  restartTime=0;restartArmed=true;
  constructor(private id:()=>string,readonly hasSling=false,skipIntro=false){this.attempt=createFinalAttempt(id(),hasSling);this.stage=skipIntro?'COMBAT':'INTRO';this.introSeen=skipIntro;}
  storyLines():readonly FinalLine[]{return this.stage==='INTRO'?FINAL_INTRO:this.stage==='DEFEAT'?FINAL_DEFEAT:this.stage==='OUTRO'?[...FINAL_OUTRO,...(this.ending==='DEBT_FREE'?FINAL_DEBT_FREE:FINAL_ESCAPE)]:[];}
  currentLine():FinalLine|undefined{return this.storyLines()[this.storyIndex];}
  advanceStory(skip=false){
    if(!['INTRO','DEFEAT','OUTRO'].includes(this.stage))return;
    const next=this.storyIndex+1;
    if(!skip&&next<this.storyLines().length){this.storyIndex=next;return;}
    if(this.stage==='INTRO'){this.stage='COMBAT';this.introSeen=true;}
    else if(this.stage==='DEFEAT'){if(!unlockFinalExit(this.attempt))return;this.stage='EXIT';}
    else this.stage='FINISHED';
    this.storyIndex=0;this.clearInput();
  }
  clearInput(){this.accumulator=0;this.restartTime=0;this.attempt.charge=0;this.attempt.wasSling=false;this.attempt.player.jumpBuffer=0;}
  setPause(value:boolean){this.paused=value;this.clearInput();}
  equipWeapon(weapon:ArenaWeapon){if(!equipFinalWeapon(this.attempt,weapon))return false;this.clearInput();return true;}
  restart(){this.attempt=createFinalAttempt(this.id(),this.hasSling);this.stage=this.introSeen?'COMBAT':'INTRO';this.storyIndex=0;this.generation++;this.clearInput();}
  tick(delta:number,input:ArenaInput,restartHeld=false):FinalEvent[]{
    if(this.paused||!['COMBAT','EXIT'].includes(this.stage))return [];
    if(!restartHeld){this.restartTime=0;this.restartArmed=true;}
    if(restartHeld&&this.restartArmed){this.restartTime+=Math.max(0,delta);if(this.restartTime+1e-9>=C.restartHold){this.restart();this.restartArmed=false;return [];}}
    if(this.attempt.status==='FAILED'||this.attempt.status==='COMPLETE')return [];
    this.accumulator+=Math.max(0,delta);let steps=0;const events:FinalEvent[]=[];
    while(this.accumulator+1e-9>=C.dt&&steps<C.maxSteps){
      stepFinal(this.attempt,{...input,jump:steps===0&&input.jump,punch:steps===0&&input.punch,dodge:steps===0&&input.dodge});
      events.push(...this.attempt.events);this.accumulator-=C.dt;steps++;
      // stepFinal mutates status; read it after the domain step, outside TS's pre-step narrowing.
      const status=this.attempt.status as FinalAttempt['status'];
      if(status==='BOSS_DOWN'){this.stage='DEFEAT';this.storyIndex=0;this.clearInput();break;}
      if(status==='COMPLETE'){this.stage='OUTRO';this.storyIndex=0;this.clearInput();break;}
      if(status==='FAILED'){this.accumulator=0;break;}
    }
    if(steps===C.maxSteps&&this.accumulator>=C.dt){this.droppedBacklog+=this.accumulator;this.accumulator=0;}
    return events;
  }
}
