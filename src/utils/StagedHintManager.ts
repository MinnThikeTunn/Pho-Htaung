import type { StagedHint } from '../content/progressiveHints';
import { PROGRESSIVE_HINTS, CHAPTER5_THINKING_PHRASES } from '../content/progressiveHints';

export interface HotspotRecord {
  count: number;
  firstTime: number;
  lastTime: number;
}

export class StagedHintManager {
  private hotspots: Map<string, HotspotRecord> = new Map();

  /**
   * Returns current stage (1, 2, or 3) for the given hotspot ID.
   * If not yet interacted, returns 1.
   * Stage 2: 2nd interaction or >= 10s since first interaction.
   * Stage 3: 3rd+ interaction or >= 20s since first interaction.
   */
  public getStage(id: string): 1 | 2 | 3 {
    const record = this.hotspots.get(id);
    if (!record) return 1;
    const elapsed = (Date.now() - record.firstTime) / 1000;
    if (record.count >= 3 || elapsed >= 20) return 3;
    if (record.count >= 2 || elapsed >= 10) return 2;
    return 1;
  }

  /**
   * Records interaction, determines stage (1 on first interaction, 2 on 2nd interaction
   * or >= 10s since first, 3 on 3rd+ interaction or >= 20s), and returns the corresponding hint text.
   */
  public triggerHint(id: string, staged: StagedHint): string {
    const now = Date.now();
    let record = this.hotspots.get(id);

    if (!record) {
      record = { count: 1, firstTime: now, lastTime: now };
      this.hotspots.set(id, record);
      return staged.stage1;
    }

    record.count += 1;
    record.lastTime = now;
    const elapsed = (now - record.firstTime) / 1000;

    if (record.count >= 3 || elapsed >= 20) {
      return staged.stage3;
    }
    if (record.count >= 2 || elapsed >= 10) {
      return staged.stage2;
    }
    return staged.stage1;
  }

  /**
   * Resets stage counts and timestamps for a specific hotspot ID or all hotspots.
   */
  public reset(id?: string): void {
    if (id) {
      this.hotspots.delete(id);
    } else {
      this.hotspots.clear();
    }
  }
}

export { PROGRESSIVE_HINTS, CHAPTER5_THINKING_PHRASES };
export type { StagedHint };
export default StagedHintManager;
