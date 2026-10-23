import { CampaignStore,LocalSave } from './CampaignStore';
export const store=new CampaignStore(new LocalSave(),crypto.randomUUID());
