import { expect,test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { newCampaign } from '../../src/domain/settlement';
import type { FinalAttempt } from '../../src/domain/finalBoss';
import { finalRouteInput } from '../helpers/finalRoute';

// Only seed the legal previous-chapter boundary. All Chapter5 progress uses real UI/keys.
async function enter(page:Page,sling=true,gold=15){
  const c=newCampaign('final-browser');c.bridgeCompleted=c.chapter2Completed=c.chapter3Completed=c.chapter4Completed=true;
  c.resumeAt='CHAPTER_5_PENDING';c.walletCoins=gold;c.chapter2BestBankedCoins=gold;c.ownedTools=sling?['slingshot']:[];
  await page.addInitScript(value=>{if(!localStorage.getItem('phoe-htaung.adventure.v2'))localStorage.setItem('phoe-htaung.adventure.v2',JSON.stringify(value));},c);
  await page.goto('/');await page.locator('#start').click();await expect(page.locator('#final-story')).toBeVisible();
}
async function snapshot(page:Page){return page.evaluate(()=> (window.__PHOE_TEST__!.snapshot() as {final:{attempt:FinalAttempt;stage:string;paused:boolean;generation:number}}).final);}

test('all opening dialogue, gold reveal, frozen journal, initial hands and actual bag equipment',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await enter(page);
  await page.screenshot({path:'reports/chapter5/intro.png'});
  await page.keyboard.press('d');expect((await snapshot(page)).attempt.elapsed).toBe(0);
  for(let i=0;i<3;i++)await page.locator('#final-next').click();await expect(page.locator('#final-reveal')).toBeVisible();
  await expect(page.locator('#final-dialogue')).toContainText('အခွံကွာ');
  await page.locator('#final-journal').click();await expect(page.locator('.final-journal li')).toHaveCount(4);await page.locator('#final-close-journal').click();
  for(let i=0;i<5;i++)await page.locator('#final-next').click();await expect(page.locator('#final-story')).toBeHidden();
  expect((await snapshot(page)).attempt.weapon).toBe('FISTS');await page.keyboard.press('k');expect((await snapshot(page)).attempt.elapsed).toBe(0);
  await page.keyboard.press('b');await expect(page.locator('#final-fists')).toHaveAttribute('aria-pressed','true');await page.locator('#final-sling').click();
  await page.keyboard.down('k');await expect.poll(async()=> (await snapshot(page)).attempt.charge).toBeGreaterThan(.2);
  await page.keyboard.press('b');await page.keyboard.up('k');const before=(await snapshot(page)).attempt.elapsed;
  await page.waitForTimeout(300);expect((await snapshot(page)).attempt.elapsed).toBe(before);await page.locator('#final-close-bag').click();
  expect((await snapshot(page)).attempt.shotsFired).toBe(0);await page.screenshot({path:'reports/chapter5/arena.png'});expect(errors).toEqual([]);
});

test('no sling: honest bag and direct fists, no invented equipment',async({page})=>{
  await enter(page,false,0);await page.locator('#final-skip').click();await page.keyboard.press('b');
  await expect(page.locator('#final-empty-bag')).toBeVisible();await expect(page.locator('#final-sling')).toHaveCount(0);
  await page.locator('#final-fists').click();await page.keyboard.press('j');await expect.poll(async()=>(await snapshot(page)).attempt.status).toBe('ACTIVE');
});

for(const sling of [false,true])test(`live input route to surrender, exit, ending and reload; sling=${sling}`,async({page},info)=>{
  test.setTimeout(240000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await enter(page,sling,sling?15:0);await page.locator('#final-skip').click();
  if(sling){await page.keyboard.press('b');await page.locator('#final-sling').click();}
  const held=new Set<string>(),until=Date.now()+180000;let phase2=false,cartStops=0;
  while(Date.now()<until){
    const s=await snapshot(page),a=s.attempt;if(s.stage==='DEFEAT')break;
    expect(a.status,JSON.stringify({hp:a.hp,boss:a.boss,x:a.player.centerX})).not.toBe('FAILED');
    const input=finalRouteInput(a,sling&&a.ammo>0),want=new Set<string>();
    if(input.left)want.add('a');if(input.right)want.add('d');if(input.sling)want.add('k');
    for(const key of held)if(!want.has(key)){await page.keyboard.up(key);held.delete(key);}
    for(const key of want)if(!held.has(key)){await page.keyboard.down(key);held.add(key);}
    if(input.jump)await page.keyboard.press('Space');if(input.punch)await page.keyboard.press('j');if(input.dodge)await page.keyboard.press('l');
    phase2 ||= a.boss.phase2;cartStops=Math.max(cartStops,a.cartStops);await page.waitForTimeout(16);
  }
  for(const key of held)await page.keyboard.up(key);
  expect((await snapshot(page)).stage).toBe('DEFEAT');expect(phase2).toBe(true);expect(cartStops).toBeGreaterThan(0);
  const fight=(await snapshot(page)).attempt;await page.screenshot({path:`reports/chapter5/defeated-${sling}.png`});
  const frozen=fight.elapsed;await page.waitForTimeout(200);expect((await snapshot(page)).attempt.elapsed).toBe(frozen);
  for(let i=0;i<4;i++)await page.locator('#final-next').click();expect((await snapshot(page)).stage).toBe('EXIT');
  await page.keyboard.down('d');const exitUntil=Date.now()+12000;
  while(Date.now()<exitUntil){const s=await snapshot(page);if(s.stage==='OUTRO')break;const a=s.attempt;if(a.player.grounded&&a.player.centerX<a.cart.x&&a.cart.x-a.player.centerX<135)await page.keyboard.press('Space');await page.waitForTimeout(30);}
  await page.keyboard.up('d');expect((await snapshot(page)).stage).toBe('OUTRO');await page.screenshot({path:`reports/chapter5/outside-${sling}.png`});
  await page.locator('#final-skip').click();await expect(page.locator('.final-ending')).toBeVisible();
  await expect(page.locator('.final-ending h1')).toHaveText(sling?'အကြွေးကျေပြီ။':'လွတ်မြောက်လာပြီ။');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('phoe-htaung.adventure.v2')!));
  expect(saved.walletCoins).toBe(sling?5:0);expect(saved.debtRepaidGold).toBe(sling?10:0);expect(saved.resumeAt).toBe('CAMPAIGN_COMPLETE');
  await page.screenshot({path:`reports/chapter5/ending-${sling}.png`});await page.reload();await page.locator('#start').click();await expect(page.locator('.final-ending')).toBeVisible();
  const reload=await page.evaluate(()=>JSON.parse(localStorage.getItem('phoe-htaung.adventure.v2')!));expect(reload.walletCoins).toBe(saved.walletCoins);expect(errors).toEqual([]);
  await info.attach('route-result',{body:JSON.stringify({sling,hp:fight.hp,seconds:fight.combatSeconds,shots:fight.shotsFired,punches:fight.punchesHit,cartStops:fight.cartStops,wallet:saved.walletCoins}),contentType:'application/json'});
});
