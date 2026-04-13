import puter from '@heyputer/puter.js';

export const TEXT_MODEL = 'google/gemini-2.5-flash';
export const IMAGE_MODEL = 'google/imagen-4.0-fast';

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

const JSON_SCHEMA_HINT = `
Respond with ONLY valid JSON (no markdown fences, no commentary) matching this exact shape:
{
  "angles": [{ "name": string, "explanation": string, "emotionalTrigger": string }],
  "prompts": [{
    "angleName": string, "prompt": string, "layoutInstructions": string,
    "exactText": string, "visualComposition": string, "subjectDescription": string,
    "background": string, "mood": string, "typographyDirection": string,
    "colorDirection": string, "logoPlacement": string
  }],
  "titles": string[],
  "posts": string[],
  "communities": [{ "groupName": string, "subreddits": string[], "note": string }],
  "naming": {
    "campaignNameIdeas": string[],
    "adGroupNaming": string,
    "adNamingStructure": string
  }
}`.trim();

function buildCampaignPrompt(params: GenerateCampaignParams): string {
  return `
You are an elite Reddit Ads media buyer and creative strategist.
Generate a comprehensive Reddit Ads campaign package based on the inputs below.
Focus on high CTR, Reddit-native tone (curiosity, tension, relatability, NOT corporate).

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

Generate:
1. Creative Angles (exactly ${params.numCreatives})
2. Nano Banana Image Prompts (1 per angle, highly detailed, 1:1 square)
3. Reddit Titles (15-25)
4. Post Text (5-10 options)
5. Community Targeting (subreddits grouped by intent, NO "r/" prefix)
6. Campaign Naming Convention (ideas, ad group naming, ad naming structure)

${JSON_SCHEMA_HINT}
`.trim();
}

function extractJsonString(raw: string): string {
  let s = raw.trim();
  if (s.startsWith('```')) {
    s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  }
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    s = s.slice(first, last + 1);
  }
  return s;
}

function extractChatText(response: unknown): string {
  if (typeof response === 'string') return response;
  if (response && typeof response === 'object') {
    const r = response as {
      message?: { content?: unknown };
      text?: unknown;
      toString?: () => string;
    };
    const content = r.message?.content;
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      return content
        .map((c) => (typeof c === 'string' ? c : typeof c === 'object' && c && 'text' in c ? String((c as { text: unknown }).text ?? '') : ''))
        .join('');
    }
    if (typeof r.text === 'string') return r.text;
    if (typeof r.toString === 'function') return r.toString();
  }
  return '';
}

export const generateCampaign = async (
  params: GenerateCampaignParams
): Promise<GeneratedCampaign> => {
  const prompt = buildCampaignPrompt(params);
  const hasImages = params.inspirationImages && params.inspirationImages.length > 0;

  const response = hasImages
    ? await puter.ai.chat(prompt, params.inspirationImages, { model: TEXT_MODEL })
    : await puter.ai.chat(prompt, { model: TEXT_MODEL });

  const raw = extractChatText(response);
  if (!raw) {
    throw new Error('Puter returned an empty response for the campaign.');
  }

  const jsonText = extractJsonString(raw);
  try {
    return JSON.parse(jsonText) as GeneratedCampaign;
  } catch (err) {
    console.error('Failed to parse campaign JSON. Raw response:', raw);
    throw new Error(
      `Puter returned a response that was not valid JSON. ${err instanceof Error ? err.message : ''}`
    );
  }
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
