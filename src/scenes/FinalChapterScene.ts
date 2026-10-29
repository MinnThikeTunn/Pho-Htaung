import Phaser from 'phaser';
import { C } from '../content/chapter1';
import { F5, FINAL_PHASE_LINE, FINAL_DAMAGE_LABELS } from '../content/chapter5';
import { FINAL_ART } from '../content/chapter5Art';
import { arenaHasSlingshot } from '../domain/arena';
import type { ArenaWeapon } from '../domain/arena';
import { createFinalAttempt, finalGuarded } from '../domain/finalBoss';
import type { FinalEvent } from '../domain/finalBoss';
import { FinalSession } from '../services/FinalSession';
import { store } from '../services/adventure';
import { SAVE_KEY, SETTINGS_KEY } from '../services/CampaignStore';
import { AudioController } from '../services/AudioController';
import { FinalView } from '../view/FinalView';

const ui=()=>document.querySelector<HTMLDivElement>('#interface')!;
const button=(id:string,label:string,primary=false)=>`<button type="button" id="${id}" class="${primary?'primary':'secondary'}">${label}</button>`;
const escape=(s:string)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export default class FinalChapterScene extends Phaser.Scene {
  private session!:FinalSession;private view!:FinalView;private audio=new AudioController();
  private held=new Set<string>();private edges={jump:false,punch:false,dodge:false};
  private bagOpen=false;private failureShown=false;private messageUntil=0;private storyKey='';private history:string[]=[];
  constructor(){super('CHAPTER_5');}
  preload(){for(const item of Object.values(FINAL_ART))if(!this.textures.exists(item.key))this.load.image(item.key,item.path);}
  init(data:{equipment?:{slingshot:boolean};skipIntro?:boolean}={}){
    if(!store.campaign.chapter4Completed)throw Error('Chapter5 is locked');
    this.session=new FinalSession(()=>crypto.randomUUID(),arenaHasSlingshot(store.campaign,data.equipment),data.skipIntro??false);
    this.held.clear();this.edges={jump:false,punch:false,dodge:false};this.bagOpen=false;this.failureShown=false;this.messageUntil=0;this.storyKey='';this.history=[];store.startFinal();
  }
  snapshot(){return {attempt:structuredClone(this.session.attempt),stage:this.session.stage,storyIndex:this.session.storyIndex,paused:this.session.paused,bagOpen:this.bagOpen,generation:this.session.generation};}
  private bind(id:string,fn:()=>void){ui().querySelector(`#${id}`)?.addEventListener('click',()=>{this.audio.unlock();fn();});}
  private focusGame(){this.game.canvas.tabIndex=0;this.game.canvas.focus({preventScroll:true});}
  private clear(){this.held.clear();this.edges={jump:false,punch:false,dodge:false};this.session.clearInput();}
  private speak(text:string,seconds=3.5,priority=0){const a=this.session.attempt;if(priority<2&&a.lastHurt&&a.elapsed-a.lastHurt.at<1.2)return;const el=ui().querySelector<HTMLElement>('#final-message');if(el){el.textContent=text;el.hidden=false;}this.messageUntil=a.elapsed+seconds;}
  create(){
    ui().classList.remove('final-outro');ui().classList.add('final-chapter');
    this.view=new FinalView(this);this.audio.attach(this);try{this.audio.muted=Boolean(JSON.parse(localStorage.getItem(SETTINGS_KEY)??'{}').muted);}catch{/* Existing setting defaults. */}
    ui().innerHTML=`<div class="hud"><div class="stage-title"><span class="eyebrow">အခန်း ၅ / FINAL BOSS</span><strong>ဦးကြီးရဲ့ နောက်ဆုံးအကွက်</strong></div><div class="ledger"><div><span>သိမ်းပြီးရွှေ</span><b id="final-wallet"></b></div><div><span>သေဆုံး</span><b id="final-deaths"></b></div><div><span>ကစားချိန်</span><b id="final-time">0.00 s</b></div></div><button id="final-journal" class="icon-button" aria-label="စကားပြောမှတ်တမ်း">စာ</button><button id="final-pause" class="icon-button" aria-label="Pause">Ⅱ</button></div>
      <div class="arena-player-health final-player-health"><span>ဖိုးထောင် <b id="final-hp-label">100 / 100</b></span><progress id="final-hp" max="${F5.health}" value="${F5.health}" aria-label="ဖိုးထောင် သွေးတန်း"></progress></div>
      <div class="final-enemy"><span>ဦးကြီး <b id="final-boss-hp-label">180 / 180</b></span><progress id="final-boss-hp" max="${F5.bossHealth}" value="${F5.bossHealth}" aria-label="ဦးကြီး သွေးတန်း"></progress><small id="final-boss-state"></small></div>
      <p class="final-message" id="final-message" aria-live="polite" hidden></p><div class="final-weapon"><div class="final-equipment-row"><span>ကျောက်ခဲ <b id="final-ammo">—</b></span><button id="final-bag" class="icon-button" aria-label="အိတ်ဖွင့် (B)">အိတ် · B</button></div><span id="final-weapon-label"></span><progress id="final-charge" max="1" value="0" aria-label="လောက်လေးခွ ဆွဲအား" hidden></progress><small id="final-punch"></small><small id="final-dodge"></small></div>
      <div class="final-cart-label">လှည်း · A / D နဲ့ကပ်တွန်း၊ ခုန်တက်နိုင်သည်</div><div class="final-controls"><kbd>A</kbd><kbd>D</kbd> ရွေ့ / တွန်း <kbd>SPACE</kbd> ခုန် <kbd>J</kbd> ချ <kbd>B</kbd> အိတ် <kbd>K</kbd> လေးခွဆွဲပစ် <kbd>L</kbd> ရှောင် <kbd>R</kbd> ဖိပြန်စ <kbd>ESC</kbd> နား</div>
      <div class="final-story" id="final-story" role="dialog" aria-labelledby="final-speaker"><span id="final-story-step" class="eyebrow"></span><h2 id="final-speaker"></h2><p id="final-dialogue"></p><small id="final-reveal" hidden>ရွှေဆေးကွာနေသော ကျောက်တုံးများ — ကိုယ်ကောက်လာသောရွှေက တန်ဖိုးရှိနေဆဲပါ။</small><div class="actions">${button('final-next','ဆက်မယ်',true)}${button('final-skip','ဒီစကားပြောခန်းကို ကျော်မယ်')}</div></div>
      <p class="unsaved-status" id="final-unsaved" hidden>Save မသိမ်းရသေးပါ — ယာယီကစားနေသည်။</p><div class="modal" id="final-modal" hidden></div>`;
    this.bind('final-next',()=>this.nextStory(false));this.bind('final-skip',()=>this.nextStory(true));this.bind('final-bag',()=>this.openBag());this.bind('final-pause',()=>this.pause(!this.session.paused));this.bind('final-journal',()=>this.journal());
    const down=(e:KeyboardEvent)=>{
      if(e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement)return;
      const key=e.key.toLowerCase();this.audio.unlock();
      if(key==='escape'&&!e.repeat){e.preventDefault();if(!this.failureShown)this.pause(!this.session.paused);return;}
      if(key==='b'&&!e.repeat&&['COMBAT','EXIT'].includes(this.session.stage)&&!this.failureShown){e.preventDefault();if(this.bagOpen)this.pause(false);else this.openBag();return;}
      if(this.session.paused||!['COMBAT','EXIT'].includes(this.session.stage)||!['a','d','arrowleft','arrowright',' ','j','k','l','r'].includes(key))return;
      e.preventDefault();if(e.repeat)return;
      if(key==='k'&&this.session.attempt.weapon!=='SLING'){this.speak(this.session.hasSling?'လောက်လေးခွက အိတ်ထဲမှာပါ — B နှိပ်ပြီး ထုတ်ပါ။':'လောက်လေးခွမပါလည်း J နဲ့ နားချိန်မှာ တိုက်နိုင်သည်။');return;}
      if(key===' ')this.edges.jump=true;if(key==='j')this.edges.punch=true;if(key==='l')this.edges.dodge=true;this.held.add(key);
    };
    const up=(e:KeyboardEvent)=>this.held.delete(e.key.toLowerCase());
    const blur=()=>{if(!this.failureShown&&this.session.stage!=='FINISHED')this.pause(true);};const visibility=()=>{if(document.hidden)blur();};
    const storage=(e:StorageEvent)=>{if(e.key!==SAVE_KEY)return;store.conflict=true;this.pause(true);const el=ui().querySelector<HTMLElement>('#final-modal')!;el.innerHTML=`<section class="dialog"><h2>အခြား tab မှ save ပြောင်းသွားသည်</h2>${button('final-reload','Reload',true)}</section>`;this.bind('final-reload',()=>location.reload());};
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);document.addEventListener('visibilitychange',visibility);window.addEventListener('storage',storage);
    this.events.once('shutdown',()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('storage',storage);ui().classList.remove('final-outro','final-chapter');this.clear();});
    this.sync();this.focusGame();
  }
  private nextStory(skip:boolean){this.session.advanceStory(skip);this.clear();if(this.session.stage==='FINISHED'){this.scene.start('CAMPAIGN_END');return;}this.sync();this.focusGame();}
  private pause(value:boolean){
    if(store.conflict&&!value)return;this.bagOpen=false;this.session.setPause(value);this.clear();const el=ui().querySelector<HTMLElement>('#final-modal');if(!el)return;el.hidden=!value;
    if(value){el.innerHTML=`<section class="dialog"><h2>ခဏနားမယ်</h2><p>တုတ်မြှောက်လျှင် ဘေးရှောင်ပါ။ ဒိုင်းတိုးလာလျှင် ခုန် / L နဲ့ရှောင်ပါ။ နားချိန်နှင့် ဒိုင်းမကာသောဘက်ကို တိုက်ပါ။ လှည်းက ကိုယ့်ကျောက်ခဲကိုပါ ပိတ်နိုင်သည်။</p><div class="actions">${button('final-resume','ဆက်ကစားမယ်',true)}${button('final-menu','ပင်မစာမျက်နှာ')}</div></section>`;this.bind('final-resume',()=>this.pause(false));this.bind('final-menu',()=>this.scene.start('MENU'));}
    else{el.innerHTML='';this.focusGame();}this.sync();
  }
  private openBag(){
    if(store.conflict||this.failureShown||!['COMBAT','EXIT'].includes(this.session.stage))return;
    this.pause(true);this.bagOpen=true;const a=this.session.attempt,el=ui().querySelector<HTMLElement>('#final-modal')!;
    el.innerHTML=`<section class="dialog" role="dialog" aria-labelledby="final-bag-title"><h2 id="final-bag-title">လွယ်အိတ်</h2><p>အိတ်ဖွင့်ထားချိန် တိုက်ပွဲရပ်ထားသည်။</p><div class="actions"><button id="final-fists" class="secondary" aria-pressed="${a.weapon==='FISTS'}">လက်ချည်းသုံးမယ်</button>${a.hasSling?`<button id="final-sling" class="primary" aria-pressed="${a.weapon==='SLING'}">လောက်လေးခွ ထုတ်သုံးမယ်</button>`:''}</div>${a.hasSling?'':'<p id="final-empty-bag">လောက်လေးခွမပါလာပါ။ လက်သီးနဲ့ ဦးကြီးကိုနိုင်နိုင်သည်။</p>'}<div class="actions">${button('final-close-bag','အိတ်ပိတ်မယ်')}</div></section>`;
    const equip=(weapon:ArenaWeapon)=>{if(this.session.equipWeapon(weapon)){this.pause(false);this.sync();}};
    this.bind('final-fists',()=>equip('FISTS'));this.bind('final-sling',()=>equip('SLING'));this.bind('final-close-bag',()=>this.pause(false));this.sync();el.querySelector<HTMLButtonElement>('#final-fists')?.focus({preventScroll:true});
  }
  private journal(){
    if(this.failureShown||store.conflict)return;this.pause(true);const el=ui().querySelector<HTMLElement>('#final-modal')!;
    el.innerHTML=`<section class="dialog final-journal"><h2>စကားပြောမှတ်တမ်း</h2><ol>${this.history.map(line=>`<li>${escape(line)}</li>`).join('')}</ol><div class="actions">${button('final-close-journal','ပြန်သွားမယ်',true)}</div></section>`;this.bind('final-close-journal',()=>this.pause(false));
  }
  private retry(){if(store.conflict)return;this.session.restart();this.session.setPause(false);this.failureShown=false;this.bagOpen=false;this.clear();const el=ui().querySelector<HTMLElement>('#final-modal')!;el.hidden=true;el.innerHTML='';this.speak('ဒိုင်းဖွင့်ချိန်ကိုကြည့်ပြီး ပြန်တိုက်ပါ။');this.sync();this.focusGame();}
  private event(kind:FinalEvent){
    const sound:Partial<Record<FinalEvent,'lock'|'gate'|'land'|'death'|'shatter'|'complete'|'coin'>>={shot:'lock',block:'gate',cart_block:'gate',hit:'land',hurt:'death',crash:'shatter',down:'complete',refill:'coin'};
    if(sound[kind])this.audio.play(sound[kind]!);
    if(kind==='block')this.speak('ဒိုင်းကာထားလို့ မထိပါ — နားချိန် သို့မဟုတ် ဒိုင်းနောက်ဘက်က တိုက်ပါ။',2);
    if(kind==='cart_block')this.speak('ကိုယ့်ကျောက်ခဲ လှည်းကိုထိသွားပြီ — လှည်းကျော်ပြီးမှ ပစ်ပါ။',2);
    if(kind==='hurt'){const h=this.session.attempt.lastHurt;if(h)this.speak(`${FINAL_DAMAGE_LABELS[h.source]} ထိသည် · −${h.damage} သွေး။ ${h.source==='SLAM'?'အဝါရောင်ဧရိယာကနေ ဘေးရှောင်ပါ။':h.source==='CART'?'လှည်းပေါ် ခုန်တက် / ကျော်ပါ။':'ဒိုင်းတိုးလာချိန် ခုန် / L နဲ့ရှောင်ပါ။'}`,2,2);}
    if(kind==='empty')this.speak('ကျောက်ခဲကုန်ပြီ။ ဘေးကျောက်ပုံနား ရပ်ပြီး ဖြည့်နိုင်သည်။',3);
    if(kind==='refill')this.speak('ကျောက်ခဲ ပြန်ဖြည့်ပြီးပြီ။',2);
    if(kind==='crash')this.speak('လှည်းနဲ့တိုက်မိပြီ — ဒိုင်းဖွင့်နေတုန်း ပြန်ချနိုင်ပြီ။',2);
    if(kind==='phase2'){const line=`${FINAL_PHASE_LINE.speaker} — ${FINAL_PHASE_LINE.text}`;this.history.push(line);this.speak(line,4);}
    if(kind==='failed'){store.death(`final:${this.session.attempt.id}`);this.failureShown=true;this.clear();const el=ui().querySelector<HTMLElement>('#final-modal')!;el.hidden=false;el.innerHTML=`<section class="dialog"><h2>ဒီတစ်ခါ ရှုံးသွားပြီ</h2><p>ဒိုင်းကာထားချိန်ရှေ့ကမချဘဲ လွဲသွားချိန်နှင့် နားချိန်ကိုရွေးပါ။</p><div class="actions">${button('final-retry','ပြန်စမ်းမယ်',true)}${button('final-menu','ပင်မစာမျက်နှာ')}</div></section>`;this.bind('final-retry',()=>this.retry());this.bind('final-menu',()=>this.scene.start('MENU'));}
    if(kind==='complete'){store.completeFinal(this.session.attempt);this.session.ending=store.campaign.lastChapter5Result?.ending??'ESCAPED';this.clear();}
  }
  private sync(){
    if(this.session.stage==='FINISHED')return;
    const a=this.session.attempt,b=a.boss;const text=(id:string,value:string)=>{const el=ui().querySelector(`#${id}`);if(el&&el.textContent!==value)el.textContent=value;};
    ui().classList.toggle('final-outro',this.session.stage==='OUTRO');
    (ui().querySelector('#final-hp') as HTMLProgressElement).value=a.hp;text('final-hp-label',`${a.hp} / ${F5.health}`);
    (ui().querySelector('#final-boss-hp') as HTMLProgressElement).value=b.hp;text('final-boss-hp-label',`${b.hp} / ${F5.bossHealth}`);
    text('final-boss-state',b.phase==='DOWN'?'ဦးကြီး လက်နက်ချပြီ':b.phase==='SLAM_WINDUP'?'တုတ်ကျတော့မည် — ဘေးရှောင်!':b.phase==='RUSH_WINDUP'?'ဒိုင်းတိုးတော့မည် — ခုန် / ရှောင်!':b.phase==='CART_WINDUP'?'လှည်းတွန်းတော့မည် — တား / ခုန်!':b.phase==='RECOVER'||b.phase==='STUN'?'ဒိုင်းဖွင့်နေပြီ — ပြန်တိုက်နိုင်သည်':finalGuarded(a)?'ရှေ့ဒိုင်း ကာထားသည်':'');
    text('final-wallet',String(store.campaign.walletCoins));text('final-deaths',String(store.campaign.deathCount));text('final-time',`${a.combatSeconds.toFixed(2)} s`);text('final-ammo',a.hasSling?String(a.ammo):'—');text('final-weapon-label',a.weapon==='SLING'?a.staggerLeft>0?'ဒဏ်ထိ၍ ဆွဲအားပျက်ပြီ':a.charge>=F5.chargeTime?'အားပြည့်ပြီ — K လွှတ်ပစ်':'K ဖိဆွဲ → လွှတ်ပစ်':a.hasSling?'လက်ချည်း · B အိတ်မှလေးခွထုတ်နိုင်သည်':'လက်ချည်း · J နဲ့တိုက်နိုင်သည်');
    text('final-punch',a.punchLeft>0?`J ပြန်အဆင်သင့် ${a.punchLeft.toFixed(1)} s`:'J · အနားကပ်ပြီး ချနိုင်ပြီ');
    (ui().querySelector('#final-bag') as HTMLButtonElement).disabled=!['COMBAT','EXIT'].includes(this.session.stage);
    const cartLabel=ui().querySelector<HTMLElement>('.final-cart-label')!;cartLabel.style.left=`${a.cart.x/C.width*100}%`;cartLabel.hidden=a.status!=='WAITING'&&!a.player.pushing;
    const charge=ui().querySelector('#final-charge') as HTMLProgressElement;charge.value=a.charge/F5.chargeTime;charge.hidden=a.weapon!=='SLING';text('final-dodge',a.dodgeCooldown>0?`L ပြန်အဆင်သင့် ${a.dodgeCooldown.toFixed(1)} s`:'L · ရှောင်နိုင်ပြီ');
    ui().querySelector<HTMLElement>('#final-message')!.hidden=a.elapsed>=this.messageUntil;ui().querySelector<HTMLElement>('#final-unsaved')!.hidden=!store.unsaved;
    const line=this.session.currentLine(),story=ui().querySelector<HTMLElement>('#final-story')!;story.hidden=!line;
    if(line){const key=`${this.session.generation}:${this.session.stage}:${this.session.storyIndex}`;if(key!==this.storyKey){this.storyKey=key;this.history.push(`${line.speaker} — ${line.text}`);}text('final-speaker',line.speaker);text('final-dialogue',line.text);text('final-story-step',`${this.session.stage==='INTRO'?'ရွှေခန်း':this.session.stage==='DEFEAT'?'ဦးကြီး လက်နက်ချပြီ':'အိမ်ပြန်လမ်း'} · ${this.session.storyIndex+1} / ${this.session.storyLines().length}`);ui().querySelector<HTMLElement>('#final-reveal')!.hidden=!line.reveal;}
    this.view.render(a,{bag:this.bagOpen,reveal:this.session.introSeen||this.session.storyIndex>=3,outside:this.session.stage==='OUTRO'});
    if(this.session.stage==='EXIT')this.speakExit();
  }
  private speakExit(){const el=ui().querySelector<HTMLElement>('#final-message')!;el.hidden=false;el.textContent='အန္တရာယ်ကင်းပြီ — ညာဘက်တံခါးကနေ အပြင်ထွက်ပါ။';}
  update(_time:number,ms:number){
    const generation=this.session.generation,stepped=this.session.accumulator+ms/1000>=C.dt;
    const events=this.session.tick(ms/1000,{left:this.held.has('a')||this.held.has('arrowleft'),right:this.held.has('d')||this.held.has('arrowright'),sling:this.held.has('k'),...this.edges},this.held.has('r'));
    if(stepped)this.edges={jump:false,punch:false,dodge:false};if(generation!==this.session.generation){this.failureShown=false;this.clear();const el=ui().querySelector<HTMLElement>('#final-modal');if(el){el.hidden=true;el.innerHTML='';}}
    for(const event of events)this.event(event);this.sync();
  }
}

export class CampaignEndingScene extends Phaser.Scene {
  constructor(){super('CAMPAIGN_END');}
  preload(){if(!this.textures.exists(FINAL_ART.escape.key))this.load.image(FINAL_ART.escape.key,FINAL_ART.escape.path);}
  create(){
    const c=store.campaign,r=c.lastChapter5Result;if(!c.chapter5Completed||!r){this.scene.start('MENU');return;}
    const view=new FinalView(this);view.render(createFinalAttempt('ending'),{outside:true});
    ui().innerHTML=`<section class="result-panel final-ending"><span class="eyebrow">ဖိုးထောင် · ဇာတ်သိမ်း</span><h1>${r.ending==='DEBT_FREE'?'အကြွေးကျေပြီ။':'လွတ်မြောက်လာပြီ။'}</h1><p class="intro">${r.ending==='DEBT_FREE'?'အကြွေးရှင်းပြီး အိမ်ပြန်နိုင်ပြီ။':'ဦးကြီးရဲ့လိမ်လည်မှုကို ဖော်ထုတ်ပြီး အသက်ရှင်ထွက်လာနိုင်ပြီ။ ရှိသမျှရွှေက တန်ဖိုးရှိနေဆဲပါ။'}</p><div class="result-stats"><div><span>ထွက်လာချိန်ရှိရွှေ</span><b>${r.goldAtExit}</b></div><div><span>အကြွေးဆပ်ပြီး</span><b>${c.debtRepaidGold??0}<small> / ${F5.debtTarget}</small></b></div><div><span>ကျန်ရွှေ</span><b>${c.walletCoins}</b></div><div><span>ကျန်သွေး / တိုက်ပွဲချိန်</span><b>${r.remainingHealth}<small> · ${r.activeSeconds.toFixed(2)} s</small></b></div></div><p class="result-note">ရွှေရုပ် ${c.chapter3TreasureRecovered?'ယူထွက်ခဲ့နိုင်သည်။':'မယူထွက်ခဲ့ပါ။'} ကစားပေးလို့ ကျေးဇူးတင်ပါတယ်။</p><p class="final-credits">ဖိုးထောင် — ပုဂံရွှေမြို့တော် စွန့်စားခန်း<br>ဇာတ်လမ်း၊ ပဟေဠိနှင့်တိုက်ပွဲ အခန်း ၅ ခန်း ပြီးဆုံးပါပြီ။</p>${store.unsaved?'<p class="warning">Save မသိမ်းရသေးပါ။ Reload မလုပ်မီ ထပ်သိမ်းနိုင်သည်။</p>':''}<div class="actions">${button('ending-replay','အခန်း ၅ ပြန်စမ်း',true)}${button('ending-menu','အခန်းရွေးမယ်')}${store.unsaved?button('ending-save','ထပ်သိမ်းမယ်'):''}</div></section>`;
    ui().querySelector('#ending-replay')?.addEventListener('click',()=>this.scene.start('CHAPTER_5',{skipIntro:false}));ui().querySelector('#ending-menu')?.addEventListener('click',()=>this.scene.start('MENU'));ui().querySelector('#ending-save')?.addEventListener('click',()=>{if(store.save())this.scene.restart();});
  }
}
