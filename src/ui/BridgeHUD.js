import { store } from '../services/adventure';
import { soundEngine } from '../utils/SoundEngine.js';
import { audioDirector } from '../audio/AudioDirector.js';
export default class BridgeHUD {
  constructor(scene){
    this.scene=scene;this.ui=document.querySelector('#interface');
    this.ui.innerHTML=`<div class="hud"><div class="stage-title"><span class="eyebrow">အခန်း ၁ / PUZZLE</span><strong>နန်းတော်တံတားယန္တရား</strong></div><div class="ledger"><div><span>သိမ်းပြီးရွှေ</span><b id="bridge-wallet"></b></div><div><span>သေဆုံး</span><b id="bridge-deaths"></b></div></div><button id="bag" class="icon-button bag-icon-btn" aria-label="လွယ်အိတ်">🎒</button><button id="pause" class="icon-button" aria-label="Pause">Ⅱ</button></div><div class="game-bottom"></div><div id="pause-panel" class="modal" hidden></div><div id="bridge-unsaved" class="unsaved-status" hidden>ယာယီ session · save မသိမ်းရသေးပါ</div><div id="reset-fade" class="reset-fade"></div>`;
    this.ui.querySelector('#pause').onclick=()=>this.pause(!scene.sharedPaused);
    this.ui.querySelector('#bag').onclick=()=>scene.inventoryBar?.toggleReveal();
    this.key=e=>{if(e.key==='Escape'&&!e.repeat){e.preventDefault();this.pause(!scene.sharedPaused);}};
    this.blur=()=>this.pause(true);this.visibility=()=>{if(document.hidden)this.pause(true);};
    this.storage=e=>{if(e.key==='phoe-htaung.adventure.v2'){store.conflict=true;this.pause(true);const panel=this.ui.querySelector('#pause-panel');panel.innerHTML='<section class="dialog"><h2>အခြား tab မှ save ပြောင်းသွားသည်</h2><button id="reload" class="primary">Reload</button></section>';panel.querySelector('button').onclick=()=>location.reload();}};
    window.addEventListener('keydown',this.key);window.addEventListener('blur',this.blur);window.addEventListener('storage',this.storage);document.addEventListener('visibilitychange',this.visibility);
    scene.events.once('shutdown',()=>{window.removeEventListener('keydown',this.key);window.removeEventListener('blur',this.blur);window.removeEventListener('storage',this.storage);document.removeEventListener('visibilitychange',this.visibility);this.ui.innerHTML='';});
    this.applyAudio();this.updateDeathCount();
  }
  applyAudio(){let prefs={};try{prefs=JSON.parse(localStorage.getItem('phoe-htaung.settings.v1')||'{}');}catch{}soundEngine.muted=Boolean(prefs.muted);audioDirector.setMuted(soundEngine.muted);}
  pause(value){
    const s=this.scene;if(s.completing)return;s.sharedPaused=value;s.blockRetry?.();s.input.keyboard.resetKeys();s.jumpHeld=false;s.jumpBuffer=0;s.restartHeldTime=0;s.player?.setVelocityX(0);s.input.enabled=!value;s.time.paused=value;
    if(value){s.physics.world.pause();s.tweens.pauseAll();audioDirector.stopWalking();soundEngine.stopBGM();}else{s.physics.world.resume();s.tweens.resumeAll();}
    const panel=this.ui.querySelector('#pause-panel');panel.hidden=!value;
    if(value){panel.innerHTML=`<section class="dialog"><span class="eyebrow">ခဏနားမယ်</span><h2>ရပ်ထားပါတယ်</h2><div class="actions"><button id="resume" class="primary">ဆက်ကစားမယ်</button><button id="menu" class="secondary">ပင်မစာမျက်နှာ</button></div><div class="settings"><label><input id="mute-setting" type="checkbox" ${soundEngine.muted?'checked':''}>အသံပိတ်</label></div></section>`;panel.querySelector('#resume').onclick=()=>this.pause(false);panel.querySelector('#menu').onclick=()=>{s.time.paused=false;s.scene.start('MENU');};panel.querySelector('#mute-setting').onchange=e=>{let prefs={};try{prefs=JSON.parse(localStorage.getItem('phoe-htaung.settings.v1')||'{}');}catch{}prefs.muted=e.target.checked;try{localStorage.setItem('phoe-htaung.settings.v1',JSON.stringify(prefs));}catch{}this.applyAudio();};}
    else s.game.canvas.focus();
  }
  updateDeathCount(){this.ui.querySelector('#bridge-wallet').textContent=String(store.campaign.walletCoins);this.ui.querySelector('#bridge-deaths').textContent=String(store.campaign.deathCount);this.ui.querySelector('#bridge-unsaved').hidden=!store.unsaved;}
}
