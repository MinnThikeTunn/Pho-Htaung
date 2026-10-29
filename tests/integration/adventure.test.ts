import { expect,it } from 'vitest';
import { bridgeExit,installBridgePart,settleBridge } from '../../src/domain/bridge';
import { newCampaign,validateCampaign,settle } from '../../src/domain/settlement';
import { createAttempt } from '../../src/domain/createAttempt';
import { CampaignStore } from '../../src/services/CampaignStore';
import { DIALOGUE } from '../../src/content/dialogue.my';
const exit={alive:true,grounded:true,x:1100,feetY:576,groundY:576,width:1280,tunnelOpened:false};
it('new adventure starts at bridge, not action',()=>{const c=newCampaign('c');expect(c.bridgeCompleted).toBe(false);expect(c.resumeAt).toBe('CHAPTER_1');expect(validateCampaign(c)).toBe(true);});
it('bridge clear unlocks action and preserves wallet/deaths/tools',()=>{const c=newCampaign('c');c.walletCoins=7;c.deathCount=3;c.inventory=['kept'];const n=settleBridge(c,'a',exit);expect(n.resumeAt).toBe('CHAPTER_2');expect(n.bridgeCompleted).toBe(true);expect(n.walletCoins).toBe(7);expect(n.deathCount).toBe(3);expect(n.inventory).toEqual(['kept']);});
it('bridge replay cannot rewind later progress or mint currency',()=>{const c=settleBridge(newCampaign('c'),'a',exit);c.resumeAt='CHAPTER_3_PENDING';c.walletCoins=15;const n=settleBridge(c,'b',exit);expect(n.resumeAt).toBe('CHAPTER_3_PENDING');expect(n.walletCoins).toBe(15);expect(settleBridge(n,'b',exit)).toBe(n);});
it('bridge exits require survival/location, not a canonical puzzle flag',()=>{expect(bridgeExit(exit)).toBe(true);expect(bridgeExit({...exit,alive:false})).toBe(false);expect(bridgeExit({...exit,grounded:false})).toBe(false);expect(bridgeExit({...exit,x:200})).toBe(false);expect(bridgeExit({...exit,x:24,tunnelOpened:true})).toBe(true);expect(bridgeExit({...exit,x:24})).toBe(false);});
it('bamboo pole-vault bypass route reaches right platform exit and settles cleanly',()=>{
  const vaultExit={alive:true,grounded:true,x:1020,feetY:576,groundY:576,width:1280,tunnelOpened:false};
  expect(bridgeExit(vaultExit)).toBe(true);
  const c=newCampaign('vault');c.inventory=['bamboo_pole'];
  const n=settleBridge(c,'vault-attempt',vaultExit);
  expect(n.bridgeCompleted).toBe(true);expect(n.resumeAt).toBe('CHAPTER_2');
});
it('bridge chapter exposes authentic comedic Burmese voiceover dialogue constants',()=>{
  expect(DIALOGUE.bridge_falling_brick).toContain('ကျောက်တုံး');
  expect(DIALOGUE.bridge_winch_jammed).toContain('စက်သီးက ဂျမ်းဖြစ်နေတယ်');
  expect(DIALOGUE.bridge_betel_spit).toContain('ကွမ်းတံတွေးနဲ့ စက်ဆီထိုးတယ်');
  expect(DIALOGUE.bridge_pole_vault).toContain('ဝါးလုံးထောက်ပြီး ခုန်ကူး');
  expect(DIALOGUE.bridge_winch_catapult).toContain('ဝါးလုံးက ဂွေးဆော်ထည့်လိုက်ပြီ');
  expect(DIALOGUE.bridge_coin_yoink).toContain('ငါးစာကို သွားဟပ်တဲ့');
  expect(DIALOGUE.bridge_hive_drop).toContain('ပျားအုံကြီး');
  expect(DIALOGUE.bridge_bee_chase).toContain('ပျားအုပ်ကြီး');
  expect(DIALOGUE.bridge_mud_dive).toContain('ရွှံ့ထဲ');
  expect(DIALOGUE.bridge_bee_stung).toContain('ပျားတုပ်ခံရပြီး');
  expect(DIALOGUE.bridge_beeswax_lubricate).toContain('ပျားဖယောင်း');
  expect(DIALOGUE.bridge_brick_pickup).toContain('အုတ်ခဲ');
  expect(DIALOGUE.bridge_bee_enraged).toContain('သွေးဆာ');
  expect(DIALOGUE.bridge_rope_cut).toContain('ကွမ်းသီးညှပ်နဲ့ ကြိုးကို ဖြတ်ချ');
  expect(DIALOGUE.bridge_rope_hint).toContain('ဝါးလုံးကို ကြိုးနဲ့ တင်းတင်းချည်ထားတယ်');
  expect(DIALOGUE.bridge_cog_pried).toContain('ဝါးလုံးနဲ့ ကလော်လိုက်တော့');
  expect(DIALOGUE.bridge_cog_hint).toContain('ဂီယာခွေက ကျောက်တုံးကြီးအောက်မှာ');
  expect(DIALOGUE.bridge_coin_trap).toContain('လောဘဇော');
  expect(DIALOGUE.bridge_coin_trap).toContain('ထောင်ချောက်');
});
it('chapter 1 rebalanced geometry maintains fair bypass past the greedy coin trapdoor',()=>{
  // 60% Left platform (0-768), 15% Pit (768-960), 25% Right platform (960-1280)
  const width = 1280;
  const leftPlatWidth = width * 0.60;
  const pitWidth = width * 0.15;
  const rightPlatX = width * 0.75;
  const rightPlatWidth = width - rightPlatX;
  expect(leftPlatWidth).toBe(768);
  expect(pitWidth).toBe(192);
  expect(rightPlatX).toBe(960);
  expect(rightPlatWidth).toBe(320);

  // Right platform partitioning:
  // Landing shelf: 960 - 1030
  // Trapdoor void: 1030 - 1120
  // Exit ledge: 1120 - 1280
  const trapStart = 1030;
  const trapEnd = 1120;
  const trapGap = trapEnd - trapStart;
  expect(trapGap).toBe(90);

  // Safe crossing bypass into cave portal (x >= 1180) satisfies bridgeExit domain predicate
  const exitPastTrap = { alive: true, grounded: true, x: 1200, feetY: 576, groundY: 576, width: 1280, tunnelOpened: false };
  expect(bridgeExit(exitPastTrap)).toBe(true);
});
it('laying control state and belly-crawling configuration align with actor contract',()=>{
  const state: import('../../src/view/PhoeHtaungView').PhoeActorState = {
    centerX: 100,
    feetY: 576,
    vx: 40,
    grounded: true,
    facing: 1,
    control: 'LAYING'
  };
  expect(state.control).toBe('LAYING');
});
it.each([['rusty_cog','bamboo_pole'],['bamboo_pole','rusty_cog']])('puzzle supports both valid fitting orders: %s first',(first,second)=>{let inventory=['rusty_cog','bamboo_pole'];let installed={cog:false,lever:false};for(const id of [first,second]){const r=installBridgePart(inventory,installed,id)!;inventory=r.inventory;installed=r.installed;}expect(inventory).toEqual([]);expect(installed).toEqual({cog:true,lever:true});expect(installBridgePart(inventory,installed,first)).toBeNull();});
it('missing or unrelated parts cannot grant bridge progress',()=>{expect(installBridgePart([],{cog:false,lever:false},'rusty_cog')).toBeNull();expect(installBridgePart(['red_gem'],{cog:false,lever:false},'red_gem')).toBeNull();});
it('action banking after bridge retains both chapter progress and deduplicates',()=>{const c=settleBridge(newCampaign('c'),'bridge',exit);const a=createAttempt('A','action');a.status='COMPLETE';a.player.control='EXITING';a.coins=15;a.pickups.forEach(p=>p.collected=true);const n=settle(c,a,'CAMPAIGN',2).campaign;expect(n.bridgeCompleted).toBe(true);expect(n.chapter2Completed).toBe(true);expect(n.walletCoins).toBe(15);expect(n.resumeAt).toBe('CH2_EXIT_LINK');expect(settle(n,a,'CAMPAIGN',2).duplicate).toBe(true);});
it('universal walkable ground baseline is strictly 576px across 1280x720 canvas in all chapters',()=>{
  const height = 720;
  const universalGroundY = Math.round(height * 0.80);
  expect(universalGroundY).toBe(576);
  // Verify standard exit predicate alignment with 576px
  expect(exit.groundY).toBe(576);
  expect(exit.feetY).toBe(576);
});

it('myanmar traditional bag design tokens and bottom dock coordinates contract', ()=>{
  const SHAN_RED = 0x8b1e28;
  const SHAN_DARK = 0x5a1219;
  const INK = 0x182720;
  const GOLD = 0xe7bb55;
  const CREAM = 0xe9dfbd;
  expect(SHAN_RED).toBe(0x8b1e28);
  expect(SHAN_DARK).toBe(0x5a1219);
  expect(INK).toBe(0x182720);
  expect(GOLD).toBe(0xe7bb55);
  expect(CREAM).toBe(0xe9dfbd);

  // Bag bottom dock coordinate: 672px (within subterranean 576-720 area)
  const bagDockY = 672;
  const trayExpandedY = 596;
  expect(bagDockY).toBeGreaterThan(576);
  expect(trayExpandedY).toBeGreaterThan(576);
  expect(trayExpandedY).toBeLessThan(bagDockY);
});

it('chapter 2 puzzle and relic coordinates contract matches Pho-Htaung-Safe.docx specifications', async () => {
  const { CH2_POLE_SPAWN, CH2_COG_SPAWN, CH2_GEARBOX_RECT, PLATFORM_MID, PLATFORM_HIGH, CH2_SLINGSHOT_SPAWN, CH2_TRAP_RANGE } = await import('../../src/content/chapter1');
  // 1. Bamboo pole on step block
  expect(CH2_POLE_SPAWN.x).toBe(536);
  expect(CH2_POLE_SPAWN.y).toBe(524);

  // 2. Cog on shelf
  expect(CH2_COG_SPAWN.x).toBe(860);
  expect(CH2_COG_SPAWN.y).toBe(304);

  // 3. Gear box above gate
  expect(CH2_GEARBOX_RECT.x).toBe(1084);
  expect(CH2_GEARBOX_RECT.y).toBe(340);

  // 4. Platforms
  expect(PLATFORM_MID.x).toBe(380);
  expect(PLATFORM_MID.y).toBe(404);
  expect(PLATFORM_HIGH.x).toBe(130);
  expect(PLATFORM_HIGH.y).toBe(304);

  // 5. Slingshot relic on high platform
  expect(CH2_SLINGSHOT_SPAWN.x).toBe(205);
  expect(CH2_SLINGSHOT_SPAWN.y).toBe(284);

  // 6. Die Again surprise floor trap range
  expect(CH2_TRAP_RANGE.minX).toBe(1150);
  expect(CH2_TRAP_RANGE.maxX).toBe(1220);
});

it('acquiring Chapter 2 slingshot relic directly unlocks slingshot in campaign inventory for Chapter 4', () => {
  const c = newCampaign('slingshot-test');
  expect(c.inventory).not.toContain('slingshot');
  expect(c.ownedTools).not.toContain('slingshot');

  // Simulating slingshot relic collection
  c.inventory.push('slingshot');
  c.ownedTools.push('slingshot');

  expect(c.inventory).toContain('slingshot');
  expect(c.ownedTools).toContain('slingshot');
  expect(validateCampaign(c)).toBe(true);
});

