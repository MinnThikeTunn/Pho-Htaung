import { newCampaign, settle, validateCampaign } from '../domain/settlement';
import type { Attempt, Campaign, ChapterResult, Mode } from '../domain/types';
import { settleBridge } from '../domain/bridge';
import type { BridgeExit } from '../domain/bridge';
import { settleScale } from '../domain/scale';
import type { ScaleAttempt } from '../domain/scale';

export const SAVE_KEY = 'phoe-htaung.adventure.v2';
export const SETTINGS_KEY = 'phoe-htaung.settings.v1';
export interface SaveAdapter { read(): string | null; write(value: string): void }
export class LocalSave implements SaveAdapter {
  read() { return localStorage.getItem(SAVE_KEY); }
  write(value: string) { localStorage.setItem(SAVE_KEY, value); }
}
export class CampaignStore {
  campaign: Campaign;
  unsaved = false;
  loadError: string | null = null;
  conflict = false;
  private persistedRevision: number | null = null;
  private deadAttempts = new Set<string>();
  constructor(private adapter: SaveAdapter, id: string) {
    this.campaign = newCampaign(id);
    try {
      const raw = adapter.read();
      if (raw !== null) {
        const parsed: unknown = JSON.parse(raw);
        if (!validateCampaign(parsed)) throw new Error('Unsupported or invalid save');
        this.campaign = parsed; this.persistedRevision = parsed.revision;
      }
    } catch { this.loadError = 'ရှိပြီးသား save ကို ဖတ်မရပါ။ မူလ save ကို မဖျက်ထားပါ။'; }
  }
  save(replaceExisting = false): boolean {
    if (this.loadError || this.conflict) { this.unsaved = true; return false; }
    try {
      const raw = this.adapter.read();
      if (!replaceExisting && raw !== null) {
        const stored: unknown = JSON.parse(raw);
        if (!validateCampaign(stored) || this.persistedRevision === null || stored.campaignId !== this.campaign.campaignId || stored.revision !== this.persistedRevision) {
          this.conflict = true; this.unsaved = true; return false;
        }
      }
      if (!replaceExisting && raw === null && this.persistedRevision !== null) { this.conflict = true; this.unsaved = true; return false; }
      this.adapter.write(JSON.stringify(this.campaign));
      this.persistedRevision = this.campaign.revision; this.unsaved = false; return true;
    } catch { this.unsaved = true; return false; }
  }
  reset(id: string) {
    this.campaign = newCampaign(id); this.loadError = null; this.conflict = false;
    this.persistedRevision = null; this.deadAttempts.clear(); this.save(true);
  }
  death(attemptId: string) {
    if (this.deadAttempts.has(attemptId)) return;
    this.deadAttempts.add(attemptId); this.campaign.deathCount++; this.campaign.revision++; this.save();
  }
  hint(id: string): boolean {
    if (this.campaign.hintsSeen.includes(id)) return false;
    this.campaign.hintsSeen.push(id); this.campaign.revision++; this.save(); return true;
  }
  complete(a: Attempt, mode: Mode, deaths: number): ChapterResult | null {
    const outcome = settle(this.campaign, a, mode, deaths);
    if (outcome.duplicate) return null;
    this.campaign = outcome.campaign; this.save(); return outcome.result;
  }
  completeBridge(id:string,exit:BridgeExit){const next=settleBridge(this.campaign,id,exit);if(next!==this.campaign){this.campaign=next;this.save();}return !this.unsaved;}
  startScale() {
    if (!this.campaign.chapter2Completed) return false;
    if (!this.campaign.chapter3Completed && this.campaign.resumeAt !== 'CHAPTER_3') {
      this.campaign.resumeAt = 'CHAPTER_3'; this.campaign.revision++; this.save();
    }
    return true;
  }
  completeScale(a: ScaleAttempt) {
    const next = settleScale(this.campaign, a);
    if (next === this.campaign) return null;
    this.campaign = next; this.save();
    return this.campaign.lastChapter3Result ?? null;
  }
}
