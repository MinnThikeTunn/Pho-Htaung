import { CampaignStore, LocalSave } from './CampaignStore';

export const store = new CampaignStore(new LocalSave(), crypto.randomUUID());

// Test mode / carry-over: treat as if player acquired slingshot ("lay kwa") in previous chapter
export function ensureSlingshotInCampaign() {
  let changed = false;
  if (!store.campaign.inventory.includes('slingshot')) {
    store.campaign.inventory.push('slingshot');
    changed = true;
  }
  if (!store.campaign.ownedTools.includes('slingshot')) {
    store.campaign.ownedTools.push('slingshot');
    changed = true;
  }
  return changed;
}

ensureSlingshotInCampaign();

const origReset = store.reset.bind(store);
store.reset = function (id: string) {
  origReset(id);
  ensureSlingshotInCampaign();
  store.save(true);
};
