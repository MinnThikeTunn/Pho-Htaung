import Phaser from 'phaser';
import { C } from '../content/chapter1';
import { F5 } from '../content/chapter5';
import { CART_FRAME, FINAL_ART, UGYI_FRAMES, UGYI_SOURCE_SCALE } from '../content/chapter5Art';
import { finalGuarded, finalSlamArea } from '../domain/finalBoss';
import type { FinalAttempt } from '../domain/finalBoss';
import { createPhoe, renderPhoe } from './PhoeHtaungView';

export class FinalView {
  private background:Phaser.GameObjects.Image|null=null;
  private g:Phaser.GameObjects.Graphics;private fx:Phaser.GameObjects.Graphics;
  private hero:ReturnType<typeof createPhoe>;private boss:Phaser.GameObjects.Image|null=null;private cart:Phaser.GameObjects.Image|null=null;
  constructor(scene:Phaser.Scene){
    const bg=scene.textures.exists(FINAL_ART.background.key)?FINAL_ART.background.key:scene.textures.exists(FINAL_ART.escape.key)?FINAL_ART.escape.key:'arena_chamber_v1';
    if(scene.textures.exists(bg))this.background=scene.add.image(640,360,bg).setDisplaySize(C.width,C.height);
    else scene.add.rectangle(640,360,C.width,C.height,0x33362a);
    this.g=scene.add.graphics().setDepth(12);this.fx=scene.add.graphics().setDepth(30);this.hero=createPhoe(scene,22);
    if(scene.textures.exists(FINAL_ART.ugyi.key)){
      const tex=scene.textures.get(FINAL_ART.ugyi.key);for(const [name,f]of Object.entries(UGYI_FRAMES))if(!tex.has(name))tex.add(name,0,f.x,f.y,f.w,f.h);
      if(tex.has('guard'))this.boss=scene.add.image(F5.bossSpawn,C.floor,FINAL_ART.ugyi.key,'guard').setOrigin(.5,1).setDepth(20);
    }
    if(scene.textures.exists(FINAL_ART.cart.key)){
      const tex=scene.textures.get(FINAL_ART.cart.key);if(!tex.has('body'))tex.add('body',0,CART_FRAME.x,CART_FRAME.y,CART_FRAME.w,CART_FRAME.h);
      this.cart=scene.add.image(F5.cartSpawn,C.floor,FINAL_ART.cart.key,'body').setOrigin(.5,1).setDisplaySize(F5.cartW,F5.cartH).setDepth(19);
    }
  }
  render(a:FinalAttempt,options:{bag?:boolean;reveal?:boolean;outside?:boolean}={}){
    const g=this.g,fx=this.fx,p=a.player,b=a.boss;g.clear();fx.clear();
    const outside=Boolean(options.outside);
    if(this.background&&this.background.scene.textures.exists(outside?FINAL_ART.escape.key:FINAL_ART.background.key))this.background.setTexture(outside?FINAL_ART.escape.key:FINAL_ART.background.key).setDisplaySize(C.width,C.height);
    this.boss?.setVisible(!outside);this.cart?.setVisible(!outside);
    // Outdoor still has a different painted terrace; this is cosmetic, never collision geometry.
    if(outside){if(this.hero)renderPhoe(this.hero,{...p,centerX:1060,feetY:594,vx:0,grounded:true,control:'FREE',holding:false,facing:1},a.elapsed);return;}
    g.lineStyle(2,0x8b7651,.45).lineBetween(0,C.floor,C.width,C.floor);
    for(const x of F5.refillX){g.fillStyle(0xaaa18b);for(let i=0;i<5;i++)g.fillEllipse(x-22+i*11,C.floor-4-i%2*5,16,10);}
    g.fillStyle(0x181b10,.45).fillEllipse(a.cart.x,C.floor+3,F5.cartW+10,12);
    if(this.cart)this.cart.setPosition(a.cart.x,C.floor);else{g.fillStyle(0x735134).fillRect(a.cart.x-F5.cartW/2,C.floor-F5.cartH,F5.cartW,F5.cartH-12);g.fillStyle(0x25271e).fillCircle(a.cart.x-35,C.floor-8,10).fillCircle(a.cart.x+35,C.floor-8,10);}
    if(options.reveal){g.fillStyle(0x716d5d).fillEllipse(a.cart.x+10,C.floor-F5.cartH+7,27,12);g.lineStyle(2,0xd6ad58).strokeEllipse(a.cart.x+10,C.floor-F5.cartH+7,27,12);}
    const pose=b.phase==='DOWN'?'defeated':b.hitLeft>0?'hit':b.phase==='SLAM_WINDUP'?'slam_windup':b.phase==='SLAM'?'slam_strike':b.phase==='RUSH'||b.phase==='RUSH_WINDUP'?'rush':b.phase==='CART_WINDUP'?'push':b.phase==='RECOVER'||b.phase==='STUN'?'recover':'guard';
    if(this.boss){const frame=UGYI_FRAMES[pose]??UGYI_FRAMES.guard!;const offset=(.5-frame.anchor)*frame.w*UGYI_SOURCE_SCALE*(b.facing<0?1:-1);
      this.boss.setTexture(FINAL_ART.ugyi.key,pose).setPosition(b.x+offset,C.floor).setScale(UGYI_SOURCE_SCALE).setFlipX(b.facing>0);
      if(b.hitLeft>0)this.boss.setTintFill(0xffe4a3);else if(b.blockLeft>0)this.boss.setTint(0xe5d2a0);else this.boss.clearTint();
    }else{g.fillStyle(0xb28a4a).fillRoundedRect(b.x-26,C.floor-100,52,100,8);g.fillStyle(0xcbae7a).fillCircle(b.x,C.floor-108,17);}
    if(this.hero){renderPhoe(this.hero,{...p,holding:a.weapon==='SLING',control:options.bag?'RUMMAGE':a.status==='FAILED'?'DEAD':a.dodgeLeft>0?'LAYING':p.control,pushing:p.pushing||a.punchLeft>F5.punchCooldown-.12},a.elapsed);if(a.staggerLeft>0)this.hero.setTintFill(0xffb9a3);else this.hero.clearTint();}
    g.fillStyle(0x152014,.4).fillEllipse(p.centerX,p.feetY+1,38,9);g.lineStyle(2,0xeacb8d,.7).strokeEllipse(p.centerX,p.feetY+1,40,10);
    if(a.weapon==='SLING'&&!options.bag&&a.dodgeLeft<=0){const dir=a.charge>0?a.aimFacing:p.facing,x=p.centerX+dir*25,y=p.feetY-47,pull=a.charge/F5.chargeTime*22;
      fx.lineStyle(5,0x513a23).lineBetween(x,y+13,x,y-2).lineBetween(x,y-2,x-9,y-15).lineBetween(x,y-2,x+9,y-15);
      fx.lineStyle(2,0xe5c080).lineBetween(x-9,y-15,x-dir*pull,y-7).lineBetween(x+9,y-15,x-dir*pull,y-7);}
    for(const s of a.shots){fx.lineStyle(3,0xefc77f,.7).lineBetween(s.x,s.y,s.x-s.vx*.025,s.y-s.vy*.025);fx.fillStyle(0x716f5f).fillCircle(s.x,s.y,5);fx.lineStyle(2,0xffe4a0).strokeCircle(s.x,s.y,6);}
    if(finalGuarded(a)&&b.hp>0){const x=b.x+b.facing*30;fx.lineStyle(4,b.blockLeft>0?0xffffff:0xe4c178,.85).lineBetween(x,C.floor-F5.bossH,x,C.floor-12);}
    if(b.phase==='SLAM_WINDUP'||b.phase==='SLAM'){const r=finalSlamArea(a);g.fillStyle(0xe7a34c,b.phase==='SLAM'?.45:.16).fillRect(r.x,r.y,r.w,r.h);g.lineStyle(3,0xffc773).strokeRect(r.x,r.y,r.w,r.h);}
    if(b.phase==='RUSH_WINDUP'){const left=Math.min(b.startX,b.targetX),width=Math.abs(b.targetX-b.startX);g.fillStyle(0xe6b16b,.15).fillRect(left,C.floor-F5.bossH,width,F5.bossH);g.lineStyle(3,0xffd08a).lineBetween(b.x,C.floor-20,b.targetX,C.floor-20);}
    if(b.phase==='CART_WINDUP'||a.cart.mode==='ROLLING'){const dir=b.phase==='CART_WINDUP'?b.facing:Math.sign(a.cart.vx),x=a.cart.x+dir*90;g.lineStyle(4,0xffb76e,.9).lineBetween(a.cart.x,C.floor-20,x,C.floor-20).lineBetween(x-dir*14,C.floor-30,x,C.floor-20).lineBetween(x-dir*14,C.floor-10,x,C.floor-20);}
    if(b.hitLeft>0){const r=26+(1-b.hitLeft/F5.hitFlash)*22;fx.lineStyle(3,0xffdf98,b.hitLeft/F5.hitFlash);for(let i=0;i<6;i++){const t=i*Math.PI/3;fx.lineBetween(b.x+Math.cos(t)*r,C.floor-50+Math.sin(t)*r,b.x+Math.cos(t)*(r+12),C.floor-50+Math.sin(t)*(r+12));}}
    if(a.status!=='SAFE_EXIT'&&a.status!=='COMPLETE'){g.fillStyle(0x28241a,.85).fillRect(F5.exitGateX,360,C.width-F5.exitGateX,280);g.lineStyle(5,0xb29963).lineBetween(F5.exitGateX+4,435,1276,435).lineBetween(F5.exitGateX+4,558,1276,558);}
    else {g.fillStyle(0xf4d382,.15).fillRect(F5.exitGateX,360,68,280);fx.lineStyle(4,0xffe0a0).lineBetween(1218,555,1265,555).lineBetween(1250,542,1265,555).lineBetween(1250,568,1265,555);}
  }
}
