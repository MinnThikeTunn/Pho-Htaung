import Phaser from 'phaser';
import type { Player } from '../domain/types';
/** One approved concept and one import/pivot contract in both chapters.
 * Runtime regions only: no redraw, raster modification or collider inference. */
export function createPhoe(scene:Phaser.Scene,depth=20):Phaser.GameObjects.Image|null {
  if(!scene.textures.exists('phoe'))return null;
  const tex=scene.textures.get('phoe');
  if(!tex.has('neutral')){tex.add('neutral',0,75,10,380,850);tex.add('taunt',0,550,35,520,825);tex.add('push',0,1060,135,690,725);}
  return scene.add.image(96,640,'phoe','neutral').setDepth(depth);
}
export function renderPhoe(actor:Phaser.GameObjects.Image,p:Pick<Player,'control'|'pushing'|'facing'|'grounded'|'vx'|'centerX'|'feetY'>,clock:number){
  const pose=p.control==='TAUNTING'?'taunt':p.pushing?'push':'neutral';
  actor.setFrame(pose).setOrigin(pose==='neutral'?.5:pose==='taunt'?.39:.38,.99);
  actor.setScale(80/(pose==='neutral'?850:pose==='taunt'?825:725));
  actor.setFlipX(p.facing<0).setPosition(p.centerX,p.feetY+(p.grounded&&p.vx!==0?Math.sin(clock*17):0));
  actor.setAngle(p.control==='DEAD'?-75*p.facing:p.grounded?0:-5*p.facing).setAlpha(p.control==='DEAD'?.6:1);
}
