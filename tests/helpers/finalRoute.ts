import { C } from '../../src/content/chapter1';
import { F5 } from '../../src/content/chapter5';
import type { ArenaInput } from '../../src/domain/arena';
import { finalGuarded } from '../../src/domain/finalBoss';
import type { FinalAttempt } from '../../src/domain/finalBoss';

export function finalRouteInput(a:FinalAttempt,sling:boolean):ArenaInput {
  const p=a.player,b=a.boss,delta=b.x-p.centerX;let move=Math.abs(delta)>58?Math.sign(delta):p.facing!==Math.sign(delta)?Math.sign(delta):0;
  let jump=false,dodge=false;
  const cartBetween=(a.cart.x-p.centerX)*(a.cart.x-b.x)<0;
  if(b.phase==='SLAM_WINDUP'||b.phase==='SLAM'){
    const candidates=[b.targetX-115,b.targetX+115].filter(x=>x>F5.minX+10&&x<F5.maxX-10);
    const clear=candidates.filter(x=>Math.abs(x-a.cart.x)>F5.cartW/2+C.playerW/2+4||p.feetY<=C.floor-F5.cartH);
    const target=(clear.length?clear:candidates).sort((x,y)=>Math.abs(x-p.centerX)-Math.abs(y-p.centerX))[0]!;
    move=Math.abs(p.centerX-b.targetX)<F5.slamHalfWidth+C.playerW/2+7?Math.sign(target-p.centerX):0;
  }
  if(b.phase==='RUSH'&&!cartBetween&&Math.abs(delta)<160){if(a.dodgeCooldown<=0){dodge=true;move=Math.sign(delta);}else if(p.grounded)jump=true;}
  if(move&&Math.abs(p.centerX-a.cart.x)<F5.cartW/2+C.playerW/2+52&&p.feetY>C.floor-F5.cartH&&p.grounded)jump=true;
  if(a.cart.mode==='ROLLING'&&(p.centerX-a.cart.x)*a.cart.vx>0&&Math.abs(p.centerX-a.cart.x)<190&&p.grounded)jump=true;
  const vulnerable=!finalGuarded(a)&&b.phase!=='DOWN',facing=delta>0?1:-1;
  const punch=!sling&&vulnerable&&Math.abs(delta)<F5.punchReach-4&&p.facing===facing&&a.punchLeft<=0;
  const draw=sling&&(a.charge>0?a.charge<F5.chargeTime:vulnerable&&b.left>.7&&!cartBetween)&&a.slingLeft<=0;
  if(sling&&draw&&vulnerable&&!a.charge)move=Math.sign(delta);
  if(sling&&a.charge>0&&vulnerable)move=0;
  return {left:move<0,right:move>0,jump,punch,sling:draw,dodge};
}
