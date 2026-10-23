import LegacyBridge from './Chapter1Scene.js';
import { C } from '../content/chapter1';
import { createPhoe,renderPhoe } from '../view/PhoeHtaungView';
import { gameState } from '../utils/AdventureState.js';
import { store } from '../services/adventure';
import { soundEngine } from '../utils/SoundEngine.js';
import { audioDirector } from '../audio/AudioDirector.js';
import { ITEM_TEXTURE_KEYS } from '../utils/AdventureState.js';
import { installBridgePart } from '../domain/bridge';
let retryMustRelease=false;
/** Keeps the friend's bridge, pickups, winch, clue and alternate wall route.
 * Overrides only unfair traps, player/input/lifecycle and campaign boundary. */
export default class BridgeChapterScene extends LegacyBridge {
  init(data={}){this.replay=Boolean(data.replay);}
  create(){
    this.physics.world.resume();this.time.paused=false;this.input.enabled=true;
    super.create();
    this.sharedPaused=false;this.completing=false;this.deathClock=0;this.activeTime=0;this.restartHeldTime=0;this.jumpHeld=false;this.jumpBuffer=0;this.coyote=0;this.facing=1;
    this.blockCollider?.destroy();this.invisibleBlock?.destroy();this.coin?.destroy();this.flag?.destroy();
    this.rightPlat.body.setVelocity(0,0);this.rightPlat.body.setImmovable(true);
    // The same 36x56 body and 220/-570/1200 constants as action. Legacy sprite
    // is an invisible physics proxy; approved visual follows body feet.
    this.playerBaseScale=1;this.player.setScale(1).setOrigin(.5,1).setVisible(false).setGravityY(C.gravity);
    this.fixBody();this.phoe=createPhoe(this,180);if(!this.phoe)this.player.setVisible(true);
    this.warning=this.add.text(this.leftPlatWidth+this.pitWidth/2,this.groundY+18,'တွင်းနက် — တံတားပြင်ပြီးကူးပါ',{fontFamily:'Noto Sans Myanmar',fontSize:'16px',color:'#ffdf93',backgroundColor:'#33251a',padding:{x:8,y:6}}).setOrigin(.5).setDepth(200);
    this.leftWall.setAlpha(.65);this.add.text(34,this.groundY-130,'နံရံကြောင်း',{fontFamily:'Noto Sans Myanmar',fontSize:'12px',color:'#e7c27a'}).setDepth(180);
    this.rKey=this.input.keyboard.addKey('R');this.game.canvas.tabIndex=0;this.game.canvas.focus();this.jumpPressed=false;
    const down=e=>{if(e.repeat||this.sharedPaused||e.target instanceof HTMLInputElement)return;const k=e.key.toLowerCase();if(k==='r')retryMustRelease=false;if([' ','w','arrowup'].includes(k)){e.preventDefault();this.jumpPressed=true;}};
    const up=e=>{if(e.key.toLowerCase()==='r')retryMustRelease=false;};
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);
    this.events.once('shutdown',()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);audioDirector.stopWalking();audioDirector.hardMuteStems();soundEngine.stopBGM();});
  }
  createCeilingSpikes(){} // No rocket ceiling or hidden lethal block in combined build.
  hitInvisibleBlock(){}
  triggerRocketTrap(){} // The repaired bridge leads to a safe, truthful landing.
  blockRetry(){retryMustRelease=true;this.jumpPressed=false;}
  interactWithProximity(targetX,onReachCallback){if(this.isDead||this.completing)return;const reach=()=>{this.facing=targetX>this.player.x?1:-1;onReachCallback();};if(Math.abs(this.player.x-targetX)<=85)reach();else{this.targetX=targetX>this.player.x?targetX-55:targetX+55;this.pendingAction=reach;}}
  createToolPickups(groundY){
    for(const [field,id,ratio,key,scale] of [['bambooItem','bamboo_pole',.18,'item-bamboo-pole',.58],['cogItem','rusty_cog',.28,'item-cog',.52]]){
      const item=this.add.image(1280*ratio,groundY-10,key).setScale(scale).setDepth(30).setInteractive({useHandCursor:true});this[field]=item;
      item.on('pointerdown',(_p,_x,_y,event)=>{event?.stopPropagation();this.interactWithProximity(item.x,()=>{if(!item.active)return;gameState.addItem(id);item.destroy();this.inventoryBar.refresh();soundEngine.playPickup();this.subtitle.say(id==='rusty_cog'?'ဂီယာခွေ ရပြီ။ လွယ်အိတ်က ရွေးပြီး စက်သီးမှာ တပ်ပါ။':'ဝါးလုံး ရပြီ။ လွယ်အိတ်က ရွေးပြီး လီဗာမောင်းတံအဖြစ် သုံးပါ။');});});
    }
  }
  interactWithWinch(){
    if(this.bridgeLowered||this.isDead||this.isInteracting)return;
    const selected=this.inventoryBar.getSelected();
    const result=installBridgePart(gameState.state.inventory,{cog:this.hasCog,lever:this.hasLever},selected);
    if(!result){this.subtitle.say('တံတားချရန် ဂီယာခွေနဲ့ ဝါးလုံးမောင်းတံ လိုတယ်။ လွယ်အိတ်က ရွေးပြီး စက်သီးမှာ သုံးပါ။');return;}
    gameState.state.inventory=result.inventory;this.hasCog=result.installed.cog;this.hasLever=result.installed.lever;this.winchCogSlot.setVisible(this.hasCog);this.winchLeverSlot.setVisible(this.hasLever);
    this.hideHeldItem();this.inventoryBar.clearSelected();this.inventoryBar.refresh();soundEngine.playGearClick();this.checkWinchReady();
  }
  showHeldItem(id){this.hideHeldItem();if(id&&ITEM_TEXTURE_KEYS[id])this.heldItemSprite=this.add.image(this.player.x+20,this.player.y-15,ITEM_TEXTURE_KEYS[id]).setScale(.4).setDepth(190);}
  setPlayerPose(){if(this.player){this.player.setTexture('ph-idle');this.fixBody();}}
  fixBody(){if(!this.player?.body)return;const f=this.player.frame;this.player.body.setSize(C.playerW,C.playerH,false);this.player.body.setOffset((f.realWidth-C.playerW)/2,f.realHeight-C.playerH);this.player.body.setMaxVelocity(900,C.terminal);}
  update(time,delta){
    if(this.sharedPaused||this.completing)return;const dt=Math.min(delta/1000,.1);this.activeTime+=dt;
    this.parallax?.update(time,delta);this.fixBody();
    if(this.isDead){this.deathClock+=dt;const fade=document.querySelector('#reset-fade');if(fade)fade.style.opacity=String(Math.max(0,(this.deathClock-C.deathFreeze)/C.resetFade));if(this.deathClock>=C.deathTotal)this.scene.restart({replay:this.replay});this.drawPhoe();return;}
    if(this.player.body.y>this.groundY+80){this.fallIntoPit();return;}
    if(this.rKey.isDown&&!retryMustRelease){this.restartHeldTime+=dt;if(this.restartHeldTime>=C.restartHold){retryMustRelease=true;this.input.keyboard.resetKeys();this.scene.restart({replay:this.replay});return;}}else this.restartHeldTime=0;
    const left=this.cursors.left.isDown||this.wasd.A.isDown,right=this.cursors.right.isDown||this.wasd.D.isDown;
    const jump=this.cursors.up.isDown||this.cursors.space.isDown||this.wasd.W.isDown;
    const grounded=this.player.body.blocked.down||this.player.body.touching.down;
    this.coyote=grounded?C.coyote:Math.max(0,this.coyote-dt);this.jumpBuffer=this.jumpPressed?C.buffer:Math.max(0,this.jumpBuffer-dt);this.jumpPressed=false;this.jumpHeld=jump;
    let vx=(Number(right)-Number(left))*C.speed;
    if(left||right)this.targetX=null;
    if(!left&&!right&&this.targetX!==null){const gap=this.targetX-this.player.x;if(Math.abs(gap)>8)vx=Math.sign(gap)*C.speed;else{this.targetX=null;const action=this.pendingAction;this.pendingAction=null;action?.();}}
    if(this.isInteracting)vx=0;
    if(this.player.x<24){this.player.x=24;if(vx<0)vx=0;}if(this.player.x>1262){this.player.x=1262;if(vx>0)vx=0;}
    this.player.setScale(1);this.player.setVelocityX(vx);if(vx)this.facing=Math.sign(vx);
    if(this.heldItemSprite){this.heldItemSprite.x=this.player.body.center.x+this.facing*24;this.heldItemSprite.y=this.player.body.bottom-32;}
    if(this.jumpBuffer>0&&this.coyote>0&&!this.isInteracting){this.player.setVelocityY(C.jump);this.jumpBuffer=0;this.coyote=0;soundEngine.playJump();}
    this.pushTimer=this.player.x<=35&&left?this.pushTimer+delta:0;if(this.pushTimer>=1000&&!this.tunnelOpened)this.openSecretTunnel();
    if((this.player.x>=1280*.78)||(this.tunnelOpened&&this.player.x<=35))this.advanceToChapter2();
    this.drawPhoe();this.hud.updateDeathCount();
  }
  drawPhoe(){const b=this.player.body;if(this.phoe)renderPhoe(this.phoe,{centerX:b.center.x,feetY:b.bottom,vx:b.velocity.x,grounded:b.blocked.down||b.touching.down,facing:this.facing,control:this.isDead?'DEAD':this.isInteracting?'TAUNTING':'FREE',pushing:false},this.activeTime);if(this.playerShadow){this.playerShadow.x=b.center.x;this.playerShadow.y=this.groundY+2;}}
  fallIntoPit(){if(this.isDead)return;this.isDead=true;this.player.setVelocity(0,0);this.physics.world.pause();gameState.addDeath();this.hud.updateDeathCount();this.subtitle.say('တွင်းထဲကျသွားပြီ — တံတားနဲ့ နံရံပုံကြမ်းကို ပြန်ကြည့်စမ်း။');}
  openSecretTunnel(){if(this.tunnelOpened)return;this.tunnelOpened=true;gameState.setFlag('ch1_tunnel_open');this.leftWall.setVisible(false);this.secretTunnelDoor.setVisible(true);this.targetX=25;this.subtitle.say('နံရံကြားက အောက်လမ်းပွင့်ပြီ။ မြေအောက်စက်ခန်းဆီ ဆင်းလို့ရပြီ!');}
  advanceToChapter2(){
    if(this.completing||this.isDead)return;const b=this.player.body;
    const exit={alive:true,grounded:b.blocked.down||b.touching.down,x:b.center.x,feetY:b.bottom,groundY:this.groundY,width:1280,tunnelOpened:this.tunnelOpened};
    if(!exit.grounded||Math.abs(exit.feetY-exit.groundY)>1||!(exit.x>=1280*.78||(exit.tunnelOpened&&exit.x<=35)))return;
    store.completeBridge(gameState.attemptId,exit);this.completing=true;this.player.setVelocity(0,0);this.physics.world.pause();this.scene.start('BRIDGE_EXIT_LINK',{replay:this.replay});
  }
}
