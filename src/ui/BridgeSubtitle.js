/** Same whole-line Myanmar subtitle presentation as the action chapter. */
export default class BridgeSubtitle {
  constructor(scene){this.scene=scene;this.element=document.createElement('div');this.element.className='speech';this.element.style.top='14%';this.element.setAttribute('aria-live','polite');this.element.style.cursor='pointer';this.element.onclick=()=>this.hide();document.querySelector('#interface').append(this.element);scene.events.once('shutdown',()=>{this.timer?.remove();this.element.remove();});}
  say(text,onComplete){this.timer?.remove();this.element.replaceChildren();const name=document.createElement('span');name.textContent='ဦးကြီး';const body=document.createElement('p');body.textContent=text;this.element.append(name,body);this.element.classList.add('visible');this.timer=this.scene.time.delayedCall(3000,()=>{this.hide();onComplete?.();});}
  hide(){this.element.classList.remove('visible');}
  handleSkip(){this.hide();}
}
