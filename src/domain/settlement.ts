import { C, COINS, POUCH } from '../content/chapter1';
import type { Attempt, Campaign, ChapterResult, Mode } from './types';
import { A4 } from '../content/chapter4';
import { F5 } from '../content/chapter5';

export function newCampaign(id: string): Campaign {
  return { schemaVersion: 2, revision: 0, campaignId: id, walletCoins: 0, deathCount: 0, bridgeCompleted: false,
    chapter2Completed: false, chapter2BestBankedCoins: 0, completedAttemptIds: [],
    bestResultByPresetAndCoinTotal: {}, hintsSeen: [], inventory: [], ownedTools: [],
    resumeAt: 'CHAPTER_1', lastChapter2Result: null, chapter3Completed: false,
    chapter3TreasureRecovered: false, lastChapter3Result: null, chapter4Completed: false, lastChapter4Result: null,
    chapter5Completed:false,debtRepaidGold:0,lastChapter5Result:null,tutorialCompleted:false };
}
export function settle(current: Campaign, a: Attempt, mode: Mode, sessionDeaths: number): { campaign: Campaign; result: ChapterResult | null; duplicate: boolean } {
  if (a.status !== 'COMPLETE' || a.player.control !== 'EXITING') throw new Error('Cannot settle an unfinished attempt');
  if (!Number.isInteger(a.coins) || a.coins < 0 || a.coins > C.maxCoins) throw new Error('Invalid coin total');
  if (!a.id || !Number.isFinite(a.elapsed) || a.elapsed < 0 || !Number.isSafeInteger(sessionDeaths) || sessionDeaths < 0) throw new Error('Invalid attempt result');
  const expected = [...COINS, POUCH];
  if (a.pickups.length !== expected.length || !a.pickups.every(p=>expected.some(e=>e.id===p.id&&e.value===p.value))) throw new Error('Unknown pickup ledger');
  const sum = a.pickups.filter(p => p.collected).reduce((total, p) => total + p.value, 0);
  if (sum !== a.coins || new Set(a.pickups.map(p => p.id)).size !== a.pickups.length) throw new Error('Invalid pickup ledger');
  if ((a.preset === 'A') !== (mode !== 'PRACTICE')) throw new Error('Invalid mode/preset');
  if (mode === 'PRACTICE' && !current.chapter2Completed) throw new Error('Practice is locked');
  if (current.completedAttemptIds.includes(a.id)) return { campaign: current, result: null, duplicate: true };
  const next = structuredClone(current);
  const credit = mode === 'PRACTICE' ? 0 : Math.max(0, a.coins - current.chapter2BestBankedCoins);
  const result: ChapterResult = { attemptId: a.id, mode, presetId: a.preset, collectedCoins: a.coins,
    creditedCoins: credit, activeSeconds: a.elapsed, sessionDeaths };
  const key = `${a.preset}:${a.coins}`;
  next.bestResultByPresetAndCoinTotal[key] = Math.min(current.bestResultByPresetAndCoinTotal[key] ?? Infinity, a.elapsed);
  if (mode !== 'PRACTICE') {
    next.walletCoins += credit;
    next.chapter2BestBankedCoins = Math.max(current.chapter2BestBankedCoins, a.coins);
    next.chapter2Completed = true; next.completedAttemptIds.push(a.id);
    if (mode === 'CAMPAIGN') next.resumeAt = 'CH2_EXIT_LINK';
  }
  next.lastChapter2Result = result; next.revision++;
  return { campaign: next, result, duplicate: false };
}

export function validateCampaign(value: unknown): value is Campaign {
  if (!value || typeof value !== 'object') return false;
  const c = value as Partial<Campaign>;
  const nonnegative = (v: unknown) => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
  const strings = (v: unknown): v is string[] => Array.isArray(v) && v.every(s => typeof s === 'string');
  if (c.schemaVersion !== 2 || typeof c.bridgeCompleted !== 'boolean' || !nonnegative(c.revision) || !c.campaignId || typeof c.campaignId !== 'string' ||
    !nonnegative(c.walletCoins) || !nonnegative(c.deathCount) || !nonnegative(c.chapter2BestBankedCoins) || c.chapter2BestBankedCoins! > 15 ||
    typeof c.chapter2Completed !== 'boolean' || !strings(c.completedAttemptIds) || new Set(c.completedAttemptIds).size !== c.completedAttemptIds.length ||
    !strings(c.hintsSeen) || !strings(c.inventory) || !strings(c.ownedTools) ||
    !['CHAPTER_1', 'CHAPTER_2', 'CH2_EXIT_LINK', 'CHAPTER_3_PENDING', 'CHAPTER_3', 'CHAPTER_4_PENDING', 'CHAPTER_4', 'CHAPTER_5_PENDING','CHAPTER_5','CAMPAIGN_COMPLETE'].includes(c.resumeAt ?? '')) return false;
  if(c.chapter5Completed!==undefined&&typeof c.chapter5Completed!=='boolean')return false;
  if(c.tutorialCompleted!==undefined&&typeof c.tutorialCompleted!=='boolean')return false;
  if(c.chapter5Completed&&!c.chapter4Completed)return false;
  if(['CHAPTER_5','CAMPAIGN_COMPLETE'].includes(c.resumeAt!)&&!c.chapter4Completed)return false;
  if(c.resumeAt==='CAMPAIGN_COMPLETE'&&!c.chapter5Completed)return false;
  if(c.debtRepaidGold!==undefined&&(!nonnegative(c.debtRepaidGold)||![0,F5.debtTarget].includes(c.debtRepaidGold)))return false;
  if((c.debtRepaidGold??0)>0&&!c.chapter5Completed)return false;
  if(c.lastChapter5Result!=null){const r=c.lastChapter5Result;
    if(!c.chapter5Completed||!r.attemptId||typeof r.attemptId!=='string'||!Number.isFinite(r.activeSeconds)||r.activeSeconds<0||!nonnegative(r.remainingHealth)||r.remainingHealth<1||r.remainingHealth>F5.health||
      ![r.shotsFired,r.punchesHit,r.cartStops,r.goldAtExit,r.debtPaidNow].every(nonnegative)||![0,F5.debtTarget].includes(r.debtPaidNow)||!['ESCAPED','DEBT_FREE'].includes(r.ending))return false;
    if((r.ending==='DEBT_FREE')!==((c.debtRepaidGold??0)>=F5.debtTarget)||r.debtPaidNow>r.goldAtExit)return false;
  }
  if (c.chapter4Completed !== undefined && typeof c.chapter4Completed !== 'boolean') return false;
  if (c.chapter4Completed && !c.chapter3Completed) return false;
  if (['CHAPTER_4', 'CHAPTER_5_PENDING'].includes(c.resumeAt!) && !c.chapter3Completed) return false;
  if (c.resumeAt === 'CHAPTER_5_PENDING' && !c.chapter4Completed) return false;
  if (c.lastChapter4Result != null) {
    const r = c.lastChapter4Result;
    if (typeof r.attemptId !== 'string' || !r.attemptId || !Number.isFinite(r.activeSeconds) || r.activeSeconds < 0 || r.activeSeconds > A4.timeLimit ||
      !nonnegative(r.remainingHealth) || r.remainingHealth < 1 || r.remainingHealth > A4.health || !nonnegative(r.shotsFired)) return false;
  }
  if (c.chapter3Completed !== undefined && typeof c.chapter3Completed !== 'boolean') return false;
  if (c.chapter3TreasureRecovered !== undefined && typeof c.chapter3TreasureRecovered !== 'boolean') return false;
  if (c.chapter3Completed && !c.chapter2Completed) return false;
  if (['CHAPTER_3', 'CHAPTER_4_PENDING'].includes(c.resumeAt!) && !c.chapter2Completed) return false;
  if (c.resumeAt === 'CHAPTER_4_PENDING' && !c.chapter3Completed) return false;
  if (c.lastChapter3Result != null) {
    const r = c.lastChapter3Result;
    if (!r.attemptId || typeof r.attemptId !== 'string' || !Number.isFinite(r.activeSeconds) || r.activeSeconds < 0 ||
      typeof r.treasureRecovered !== 'boolean' || !['WEIGHTS', 'BRACE', 'TIMING', 'BAMBOO_WEDGE'].includes(r.method)) return false;
  }
  if (!c.bestResultByPresetAndCoinTotal || typeof c.bestResultByPresetAndCoinTotal !== 'object' || Array.isArray(c.bestResultByPresetAndCoinTotal)) return false;
  if (!Object.entries(c.bestResultByPresetAndCoinTotal).every(([k, v]) => /^[ABC]:(?:[0-9]|1[0-5])$/.test(k) && typeof v === 'number' && Number.isFinite(v) && v >= 0)) return false;
  if (c.lastChapter2Result !== null) {
    const r = c.lastChapter2Result;
    if (!r || typeof r.attemptId !== 'string' || !['CAMPAIGN', 'REPLAY', 'PRACTICE'].includes(r.mode) ||
      !['A', 'B', 'C'].includes(r.presetId) || !nonnegative(r.collectedCoins) || r.collectedCoins > 15 ||
      !nonnegative(r.creditedCoins) || r.creditedCoins > r.collectedCoins || !Number.isFinite(r.activeSeconds) || r.activeSeconds < 0 || !nonnegative(r.sessionDeaths)) return false;
    if ((r.presetId === 'A') !== (r.mode !== 'PRACTICE')) return false;
    if (r.mode === 'PRACTICE' && r.creditedCoins !== 0) return false;
  }
  return true;
}
