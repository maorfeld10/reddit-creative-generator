import { GoogleGenAI, Type } from '@google/genai';
import puter from '@heyputer/puter.js';
import { getApiKey, MissingApiKeyError } from './api-key';

export const TEXT_MODEL = 'gemini-3.1-pro-preview';
export const IMAGE_MODEL = 'google/imagen-4.0-fast';

function getClient(): GoogleGenAI {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new MissingApiKeyError();
  }
  return new GoogleGenAI({ apiKey });
}

export interface GenerateCampaignParams {
  campaignName: string;
  brandName: string;
  vertical: string;
  landingPageUrl: string;
  offerSummary: string;
  cta: string;
  brandVisible: boolean;
  includeLogo: boolean;
  toneStyle: string[];
  goal: string;
  numCreatives: number;
  inspirationNotes: string;
  inspirationImages: string[];
}

export interface CreativeAngle {
  name: string;
  explanation: string;
  emotionalTrigger: string;
}

export interface ImagePrompt {
  angleName: string;
  prompt: string;
  layoutInstructions: string;
  exactText: string;
  visualComposition: string;
  subjectDescription: string;
  background: string;
  mood: string;
  typographyDirection: string;
  colorDirection: string;
  logoPlacement: string;
}

export interface CommunityGroup {
  groupName: string;
  subreddits: string[];
  note: string;
}

export interface CampaignNaming {
  campaignNameIdeas: string[];
  adGroupNaming: string;
  adNamingStructure: string;
}

export interface GeneratedCampaign {
  angles: CreativeAngle[];
  prompts: ImagePrompt[];
  titles: string[];
  posts: string[];
  communities: CommunityGroup[];
  naming: CampaignNaming;
}

type PromptPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

export const generateCampaign = async (
  params: GenerateCampaignParams
): Promise<GeneratedCampaign> => {
  const ai = getClient();

  const prompt = `
You are an elite Reddit Ads media buyer and creative strategist.
Your goal is to generate a comprehensive Reddit Ads campaign package based on the following inputs.
Focus on high CTR, Reddit-native tone (curiosity, tension, relatability, NOT corporate), and practical outputs.

Campaign Context:
- Campaign Name: ${params.campaignName}
- Brand Name: ${params.brandName}
- Vertical: ${params.vertical}
- Landing Page URL: ${params.landingPageUrl}
- Offer Summary: ${params.offerSummary}
- CTA: ${params.cta}
- Brand Visible: ${params.brandVisible ? 'Yes' : 'No'}
- Include Logo in Prompts: ${params.includeLogo ? 'Yes' : 'No'}
- Tone Style: ${params.toneStyle.join(', ')}
- Goal: ${params.goal}
- Number of Creatives: ${params.numCreatives}
- Inspiration Notes: ${params.inspirationNotes || 'None'}

Generate the following:
1. Creative Angles (${params.numCreatives} angles)
2. Nano Banana Image Prompts (1 for each angle, highly detailed, 1:1 square)
3. Reddit Titles (15-25 titles)
4. Post Text (5-10 options)
5. Community Targeting (Subreddits grouped by intent, NO "r/" prefix)
6. Campaign Naming Convention
`;

  const parts: PromptPart[] = [{ text: prompt }];

  if (params.inspirationImages && params.inspirationImages.length > 0) {
    for (const image of params.inspirationImages) {
      const [header, base64] = image.split(',');
      if (!header || !base64) continue;
      const mimeMatch = header.split(':')[1]?.split(';')[0];
      if (!mimeMatch) continue;
      parts.push({
        inlineData: {
          mimeType: mimeMatch,
          data: base64,
        },
      });
    }
  }

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: { parts },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          angles: {
            type: Type.ARRAY,
            description: 'Creative angles for the campaign',
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                explanation: { type: Type.STRING },
                emotionalTrigger: { type: Type.STRING },
              },
              required: ['name', 'explanation', 'emotionalTrigger'],
            },
          },
          prompts: {
            type: Type.ARRAY,
            description: 'Nano Banana image prompts for each angle',
            items: {
              type: Type.OBJECT,
              properties: {
                angleName: { type: Type.STRING },
                prompt: { type: Type.STRING, description: 'Very detailed image prompt' },
                layoutInstructions: { type: Type.STRING },
                exactText: { type: Type.STRING },
                visualComposition: { type: Type.STRING },
                subjectDescription: { type: Type.STRING },
                background: { type: Type.STRING },
                mood: { type: Type.STRING },
                typographyDirection: { type: Type.STRING },
                colorDirection: { type: Type.STRING },
                logoPlacement: { type: Type.STRING },
              },
              required: [
                'angleName',
                'prompt',
                'layoutInstructions',
                'exactText',
                'visualComposition',
                'subjectDescription',
                'background',
                'mood',
                'typographyDirection',
                'colorDirection',
                'logoPlacement',
              ],
            },
          },
          titles: {
            type: Type.ARRAY,
            description: 'Reddit Ad titles',
            items: { type: Type.STRING },
          },
          posts: {
            type: Type.ARRAY,
            description: 'Reddit post text options',
            items: { type: Type.STRING },
          },
          communities: {
            type: Type.ARRAY,
            description: 'Subreddit targeting lists',
            items: {
              type: Type.OBJECT,
              properties: {
                groupName: {
                  type: Type.STRING,
                  description:
                    'e.g., High intent, Money saving, Pain/frustration, Brand/competitors, General/discovery',
                },
                subreddits: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'List of subreddits without r/ prefix',
                },
                note: {
                  type: Type.STRING,
                  description: 'Note on CTR vs conversion for this group',
                },
              },
              required: ['groupName', 'subreddits', 'note'],
            },
          },
          naming: {
            type: Type.OBJECT,
            properties: {
              campaignNameIdeas: { type: Type.ARRAY, items: { type: Type.STRING } },
              adGroupNaming: { type: Type.STRING },
              adNamingStructure: { type: Type.STRING },
            },
            required: ['campaignNameIdeas', 'adGroupNaming', 'adNamingStructure'],
          },
        },
        required: ['angles', 'prompts', 'titles', 'posts', 'communities', 'naming'],
      },
    },
  });

  return JSON.parse(response.text || '{}') as GeneratedCampaign;
};

export const generateImageFromPrompt = async (prompt: string): Promise<string> => {
  const image = await puter.ai.txt2img(prompt, {
    model: IMAGE_MODEL,
    aspect_ratio: '1:1',
  });

  const src = (image as { src?: string })?.src;
  if (!src) {
    throw new Error('Puter returned no image URL.');
  }
  return src;
};
