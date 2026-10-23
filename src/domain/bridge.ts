import type { Campaign } from './types';
export interface BridgeExit { alive:boolean;grounded:boolean;x:number;feetY:number;groundY:number;width:number;tunnelOpened:boolean }
export function installBridgePart(inventory:string[],installed:{cog:boolean;lever:boolean},id:string){
  const part=id==='rusty_cog'?'cog':id==='bamboo_pole'?'lever':null;
  if(!part||!inventory.includes(id)||installed[part])return null;
  return {inventory:inventory.filter(item=>item!==id),installed:{...installed,[part]:true}};
}
export function bridgeExit(s:BridgeExit):boolean {
  return s.alive&&s.grounded&&Math.abs(s.feetY-s.groundY)<=1&&((s.x>=s.width*.78)||(s.tunnelOpened&&s.x<=35));
}
export function settleBridge(c:Campaign,id:string,s:BridgeExit):Campaign{
  if(!id||!bridgeExit(s))throw Error('Invalid bridge exit');
  const receipt=`bridge:${id}`;if(c.completedAttemptIds.includes(receipt))return c;
  const next=structuredClone(c);next.completedAttemptIds.push(receipt);next.bridgeCompleted=true;next.revision++;
  if(!c.bridgeCompleted)next.resumeAt='CHAPTER_2';
  // Existing chapter has no gold reward. Do not invent a value or convert its
  // decorative bait/item gold into wallet currency. Action banking is unchanged.
  return next;
}
