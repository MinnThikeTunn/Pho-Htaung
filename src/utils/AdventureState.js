import { store } from '../services/adventure';
export { BURMESE_DIGITS,toBurmeseNumeral,ITEM_NAMES_MY,ITEM_TEXTURE_KEYS } from './GameState.js';
import { toBurmeseNumeral } from './GameState.js';
/** Legacy puzzle UI facade. Only the shared CampaignStore writes durable data.
 * Parts/flags are attempt-local, not replenished while loading a save. */
class AdventureState {
  constructor(){this.resetAttempt();}
  resetAttempt(){this.attemptId=crypto.randomUUID();this.state={currentScene:'Chapter1Scene',inventory:[],flags:{ch1_tunnel_open:false},isPlayerDead:false,isDialoguePlaying:false,alwaysShowHints:false,fastDialogue:false};}
  setCurrentScene(){this.resetAttempt();}
  saveToStorage(){return store.save();}
  hasSavedGame(){return store.campaign.bridgeCompleted;}
  reset(){if(confirm('Campaign အသစ်စမယ်။ လက်ရှိ progress နဲ့ သိမ်းပြီးရွှေ ပျောက်မယ်။ သေချာလား?')){store.reset(crypto.randomUUID());this.resetAttempt();return true;}return false;}
  addDeath(){store.death(this.attemptId);return store.campaign.deathCount;}
  getDeathCount(){return store.campaign.deathCount;}
  getDeathCountBurmese(){return toBurmeseNumeral(this.getDeathCount());}
  hasItem(id){return this.state.inventory.includes(id);}
  addItem(id){if(!this.hasItem(id))this.state.inventory.push(id);}
  removeItem(id){this.state.inventory=this.state.inventory.filter(item=>item!==id);}
  setFlag(id,value=true){this.state.flags[id]=value;}
  getFlag(id){return Boolean(this.state.flags[id]);}
}
export const gameState=new AdventureState();
