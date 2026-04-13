import { v4 as uuidv4 } from 'uuid';
import type { CreativeAngle, ImagePrompt, CommunityGroup } from './gemini';

const STORAGE_KEY = 'reddit_ads_campaigns';

export interface Campaign {
  id: string;
  name: string;
  brandName: string;
  vertical: string;
  date: string;
  angles: CreativeAngle[];
  prompts: ImagePrompt[];
  titles: string[];
  posts: string[];
  communities: CommunityGroup[];
  generatedImages?: Record<number, string>;
}

function readAll(): Campaign[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? (parsed as Campaign[]) : [];
  } catch (error) {
    console.error('Failed to read campaigns from storage:', error);
    return [];
  }
}

function writeAll(campaigns: Campaign[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
  } catch (error) {
    console.error('Failed to save campaigns to storage:', error);
  }
}

export const getCampaigns = (): Campaign[] => readAll();

export const saveCampaign = (campaign: Omit<Campaign, 'id' | 'date'>): Campaign => {
  const campaigns = readAll();
  const newCampaign: Campaign = {
    ...campaign,
    id: uuidv4(),
    date: new Date().toISOString(),
  };
  campaigns.push(newCampaign);
  writeAll(campaigns);
  return newCampaign;
};

export const updateCampaign = (
  id: string,
  updates: Partial<Campaign>
): Campaign | null => {
  const campaigns = readAll();
  const index = campaigns.findIndex((c) => c.id === id);
  if (index === -1) return null;
  campaigns[index] = { ...campaigns[index], ...updates };
  writeAll(campaigns);
  return campaigns[index];
};

export const deleteCampaign = (id: string): void => {
  const campaigns = readAll();
  writeAll(campaigns.filter((c) => c.id !== id));
};

export const getCampaign = (id: string): Campaign | undefined => {
  return readAll().find((c) => c.id === id);
};
