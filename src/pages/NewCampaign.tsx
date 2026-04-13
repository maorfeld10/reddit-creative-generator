import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { useLocation } from 'react-router-dom';
import {
  generateCampaign,
  generateImageFromPrompt,
  type GeneratedCampaign,
  type ImagePrompt,
  type CreativeAngle,
  type CommunityGroup,
} from '../lib/gemini';
import { saveCampaign, updateCampaign } from '../lib/store';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Loader2, Copy, Check, UploadCloud, Image as ImageIcon, X, Zap, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const TONE_STYLES = ['aggressive', 'curiosity', 'funny', 'clean', 'futuristic', 'reddit-style'];
const GOALS = ['CTR', 'conversion', 'balanced'];
const MAX_INSPIRATION_IMAGES = 3;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

interface CampaignFormValues {
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
}

export default function NewCampaign() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedCampaign | null>(null);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [inspirationImages, setInspirationImages] = useState<string[]>([]);
  const [generatedImages, setGeneratedImages] = useState<Record<number, string>>({});
  const [isGeneratingImage, setIsGeneratingImage] = useState<Record<number, boolean>>({});
  const [currentCampaignId, setCurrentCampaignId] = useState<string | null>(null);

  const location = useLocation();

  const handleGenerateImage = async (promptText: string, index: number) => {
    setIsGeneratingImage((prev) => ({ ...prev, [index]: true }));
    try {
      const imageUrl = await generateImageFromPrompt(promptText);

      setGeneratedImages((prev) => {
        const newImages = { ...prev, [index]: imageUrl };
        if (currentCampaignId) {
          updateCampaign(currentCampaignId, { generatedImages: newImages });
        }
        return newImages;
      });

      toast.success('Image generated successfully!');
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate image.');
    } finally {
      setIsGeneratingImage((prev) => ({ ...prev, [index]: false }));
    }
  };

  const { register, handleSubmit, setValue, watch } = useForm<CampaignFormValues>({
    defaultValues: {
      campaignName: '',
      brandName: '',
      vertical: '',
      landingPageUrl: '',
      offerSummary: '',
      cta: '',
      brandVisible: true,
      includeLogo: true,
      toneStyle: ['curiosity', 'reddit-style'],
      goal: 'CTR',
      numCreatives: 5,
      inspirationNotes: '',
    },
  });

  useEffect(() => {
    const template = (location.state as { template?: { name: string; vertical: string; tags: string[]; angles: string[] } } | null)?.template;
    if (template) {
      setValue('campaignName', `${template.name} Campaign`);
      setValue('vertical', template.vertical);
      setValue('toneStyle', template.tags);
      setValue('inspirationNotes', `Focus on angles: ${template.angles.join(', ')}`);
    }
  }, [location.state, setValue]);

  const toneStyle = watch('toneStyle');
  const goal = watch('goal');

  const handleToggleTone = (tone: string) => {
    const current = toneStyle || [];
    if (current.includes(tone)) {
      setValue(
        'toneStyle',
        current.filter((t) => t !== tone)
      );
    } else {
      setValue('toneStyle', [...current, tone]);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const remainingSlots = MAX_INSPIRATION_IMAGES - inspirationImages.length;
    if (remainingSlots <= 0) return;

    const files = Array.from(e.target.files).slice(0, remainingSlots);
    files.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image.`);
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        toast.error(`${file.name} is larger than 5 MB.`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result !== 'string') return;
        setInspirationImages((prev) => [...prev, reader.result as string].slice(0, MAX_INSPIRATION_IMAGES));
      };
      reader.onerror = () => toast.error(`Failed to read ${file.name}.`);
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setInspirationImages((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit: SubmitHandler<CampaignFormValues> = async (data) => {
    if (!data.toneStyle || data.toneStyle.length === 0) {
      toast.error('Pick at least one tone style.');
      return;
    }
    setIsGenerating(true);
    setResult(null);
    setGeneratedImages({});
    setIsGeneratingImage({});
    try {
      const generated = await generateCampaign({
        ...data,
        inspirationImages,
      });
      setResult(generated);

      const saved = saveCampaign({
        name: data.campaignName,
        brandName: data.brandName,
        vertical: data.vertical,
        angles: generated.angles,
        prompts: generated.prompts,
        titles: generated.titles,
        posts: generated.posts,
        communities: generated.communities,
      });
      setCurrentCampaignId(saved.id);

      toast.success('Campaign generated and saved to Library!');
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Failed to generate campaign.';
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [key]: true }));
    toast.success('Copied to clipboard');
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [key]: false }));
    }, 2000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaign Builder</h1>
          <p className="text-neutral-500 mt-1">Generate high-CTR Reddit Ads creatives instantly.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Form */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-neutral-200 shadow-sm">
            <CardHeader className="bg-neutral-50/50 border-b border-neutral-100 pb-4">
              <CardTitle className="text-lg">Campaign Context</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <form id="campaign-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                
                <div className="space-y-2">
                  <Label htmlFor="campaignName">Campaign Name</Label>
                  <Input id="campaignName" placeholder="e.g. Q3 Internet Bundle" {...register('campaignName', { required: true })} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brandName">Brand Name</Label>
                    <Input id="brandName" placeholder="e.g. Xfinity" {...register('brandName', { required: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vertical">Vertical</Label>
                    <Input id="vertical" placeholder="e.g. ISP, Fintech" {...register('vertical', { required: true })} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="offerSummary">Offer Summary</Label>
                  <Textarea 
                    id="offerSummary" 
                    placeholder="e.g. $35/mo for 500Mbps, no contract, free equipment" 
                    className="h-20 resize-none"
                    {...register('offerSummary', { required: true })} 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="landingPageUrl">Landing Page URL</Label>
                  <Input
                    id="landingPageUrl"
                    type="url"
                    placeholder="https://example.com/offer"
                    {...register('landingPageUrl', {
                      required: true,
                      pattern: /^https?:\/\/.+/i,
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cta">Call to Action (CTA)</Label>
                  <Input id="cta" placeholder="e.g. Check availability near you" {...register('cta', { required: true })} />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="brandVisible" 
                      checked={watch('brandVisible')}
                      onCheckedChange={(c) => setValue('brandVisible', c as boolean)}
                    />
                    <Label htmlFor="brandVisible" className="font-normal cursor-pointer">Brand Visible</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="includeLogo" 
                      checked={watch('includeLogo')}
                      onCheckedChange={(c) => setValue('includeLogo', c as boolean)}
                    />
                    <Label htmlFor="includeLogo" className="font-normal cursor-pointer">Include Logo</Label>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <Label>Tone Style (Select multiple)</Label>
                  <div className="flex flex-wrap gap-2">
                    {TONE_STYLES.map(tone => (
                      <Badge 
                        key={tone}
                        variant={toneStyle.includes(tone) ? "default" : "outline"}
                        className="cursor-pointer capitalize"
                        onClick={() => handleToggleTone(tone)}
                      >
                        {tone}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label>Goal</Label>
                    <Select value={goal} onValueChange={(v) => v && setValue('goal', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select goal" />
                      </SelectTrigger>
                      <SelectContent>
                        {GOALS.map(g => (
                          <SelectItem key={g} value={g} className="capitalize">{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label># of Creatives</Label>
                    <Input type="number" min="1" max="15" {...register('numCreatives', { valueAsNumber: true })} />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-neutral-100">
                  <Label className="flex items-center space-x-2">
                    <ImageIcon className="w-4 h-4 text-neutral-500" />
                    <span>Inspiration (Optional)</span>
                  </Label>
                  
                  <div className="border-2 border-dashed border-neutral-200 rounded-lg p-4 text-center hover:bg-neutral-50 transition-colors cursor-pointer relative">
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleImageUpload}
                      disabled={inspirationImages.length >= 3}
                    />
                    <div className="flex flex-col items-center justify-center space-y-2 text-neutral-500">
                      <UploadCloud className="w-6 h-6" />
                      <span className="text-sm font-medium">Upload up to 3 images</span>
                    </div>
                  </div>

                  {inspirationImages.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {inspirationImages.map((img, idx) => (
                        <div key={idx} className="relative w-16 h-16 rounded-md overflow-hidden border border-neutral-200">
                          <img src={img} alt="inspiration" className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 hover:bg-black/70"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <Textarea 
                    placeholder="Add notes about style, layout, or visual direction..." 
                    className="h-20 resize-none text-sm"
                    {...register('inspirationNotes')} 
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-[#FF4500] hover:bg-[#E03D00] text-white font-bold h-12 text-lg mt-4"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating campaign…
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-5 w-5" />
                      Generate Campaign
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Output Section */}
        <div className="lg:col-span-8">
          {isGenerating ? (
            <div className="h-full min-h-[600px] border border-neutral-200 rounded-xl flex flex-col items-center justify-center bg-white shadow-sm">
              <Loader2 className="w-10 h-10 text-[#FF4500] animate-spin mb-4" />
              <h3 className="text-xl font-bold text-neutral-800">Building your campaign…</h3>
              <p className="text-neutral-500 mt-2">Analyzing angles, writing prompts, and targeting communities.</p>
              <div className="w-64 h-2 bg-neutral-100 rounded-full mt-6 overflow-hidden">
                <div className="h-full bg-[#FF4500] animate-pulse rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
          ) : !result ? (
            <div className="h-full min-h-[600px] border-2 border-dashed border-neutral-200 rounded-xl flex flex-col items-center justify-center text-neutral-400 bg-neutral-50/50">
              <Zap className="w-12 h-12 mb-4 text-neutral-300" />
              <h3 className="text-lg font-medium text-neutral-600">Awaiting Input</h3>
              <p className="text-sm text-center max-w-sm mt-2">Fill out the campaign context and click Generate to build your Reddit Ads package.</p>
            </div>
          ) : (
            <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
              <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-lg">Campaign Package: {watch('campaignName')}</h2>
                  <p className="text-xs text-neutral-500 mt-1">
                    {result.naming?.adNamingStructure}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard(JSON.stringify(result, null, 2), 'all')}
                >
                  {copiedStates['all'] ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  Copy Full JSON
                </Button>
              </div>

              <Tabs defaultValue="prompts" className="flex-1 flex flex-col">
                <div className="px-4 pt-4 border-b border-neutral-100">
                  <TabsList className="grid w-full grid-cols-5 bg-neutral-100">
                    <TabsTrigger value="prompts">Prompts</TabsTrigger>
                    <TabsTrigger value="angles">Angles</TabsTrigger>
                    <TabsTrigger value="titles">Titles</TabsTrigger>
                    <TabsTrigger value="posts">Posts</TabsTrigger>
                    <TabsTrigger value="communities">Communities</TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-auto p-6 bg-neutral-50/30">
                  
                  {/* PROMPTS TAB */}
                  <TabsContent value="prompts" className="m-0 space-y-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold">Nano Banana Prompts</h3>
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => {
                          if (!result) return;
                          const text = result.prompts
                            .map(
                              (p) =>
                                `[${p.angleName}]\nPrompt: ${p.prompt}\nLayout: ${p.layoutInstructions}\nText: ${p.exactText}\nComposition: ${p.visualComposition}\nSubject: ${p.subjectDescription}\nBackground: ${p.background}\nMood: ${p.mood}\nTypography: ${p.typographyDirection}\nColor: ${p.colorDirection}\nLogo: ${p.logoPlacement}`
                            )
                            .join('\n\n---\n\n');
                          copyToClipboard(text, 'prompts');
                        }}
                      >
                        {copiedStates['prompts'] ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                        Copy All Prompts
                      </Button>
                    </div>
                    
                    {result.prompts.map((prompt: ImagePrompt, i: number) => (
                      <Card key={i} className="border-neutral-200">
                        <CardHeader className="bg-neutral-50/80 border-b border-neutral-100 py-3 px-4 flex flex-row items-center justify-between">
                          <CardTitle className="text-base font-bold text-[#FF4500]">{prompt.angleName}</CardTitle>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => {
                              const text = `Prompt: ${prompt.prompt}\nLayout: ${prompt.layoutInstructions}\nText: ${prompt.exactText}\nComposition: ${prompt.visualComposition}\nSubject: ${prompt.subjectDescription}\nBackground: ${prompt.background}\nMood: ${prompt.mood}\nTypography: ${prompt.typographyDirection}\nColor: ${prompt.colorDirection}\nLogo: ${prompt.logoPlacement}`;
                              copyToClipboard(text, `prompt-${i}`);
                            }}
                          >
                            {copiedStates[`prompt-${i}`] ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-neutral-400" />}
                          </Button>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                          <div className="bg-neutral-900 text-neutral-100 p-4 rounded-md font-mono text-sm leading-relaxed">
                            {prompt.prompt}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                            <div>
                              <span className="font-semibold text-neutral-700 block mb-1">Exact Text</span>
                              <div className="bg-white border border-neutral-200 p-2 rounded text-neutral-800 font-medium">
                                "{prompt.exactText}"
                              </div>
                            </div>
                            <div>
                              <span className="font-semibold text-neutral-700 block mb-1">Layout</span>
                              <p className="text-neutral-600">{prompt.layoutInstructions}</p>
                            </div>
                            <div>
                              <span className="font-semibold text-neutral-700 block mb-1">Subject</span>
                              <p className="text-neutral-600">{prompt.subjectDescription}</p>
                            </div>
                            <div>
                              <span className="font-semibold text-neutral-700 block mb-1">Background & Mood</span>
                              <p className="text-neutral-600">{prompt.background} • {prompt.mood}</p>
                            </div>
                            <div>
                              <span className="font-semibold text-neutral-700 block mb-1">Typography</span>
                              <p className="text-neutral-600">{prompt.typographyDirection}</p>
                            </div>
                            <div>
                              <span className="font-semibold text-neutral-700 block mb-1">Color & Logo</span>
                              <p className="text-neutral-600">{prompt.colorDirection} • {prompt.logoPlacement}</p>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-neutral-100 flex flex-col items-center">
                            {generatedImages[i] ? (
                              <div className="space-y-4 w-full flex flex-col items-center">
                                <img src={generatedImages[i]} alt="Generated creative" className="w-64 h-64 object-cover rounded-md border border-neutral-200 shadow-sm" />
                                <div className="flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = generatedImages[i];
                                      link.download = `creative-${i}.png`;
                                      link.click();
                                    }}
                                  >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download Image
                                  </Button>
                                  <Button 
                                    variant="secondary" 
                                    onClick={() => handleGenerateImage(prompt.prompt, i)}
                                    disabled={isGeneratingImage[i]}
                                  >
                                    {isGeneratingImage[i] ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                                    Regenerate
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button 
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                                onClick={() => handleGenerateImage(prompt.prompt, i)}
                                disabled={isGeneratingImage[i]}
                              >
                                {isGeneratingImage[i] ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Generating with Nano Banana...
                                  </>
                                ) : (
                                  <>
                                    <ImageIcon className="w-4 h-4 mr-2" />
                                    Generate Image with Nano Banana
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>

                  {/* ANGLES TAB */}
                  <TabsContent value="angles" className="m-0 space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold">Creative Angles</h3>
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => {
                          if (!result) return;
                          const text = result.angles
                            .map((a) => `${a.name}\nTrigger: ${a.emotionalTrigger}\nExplanation: ${a.explanation}`)
                            .join('\n\n');
                          copyToClipboard(text, 'angles');
                        }}
                      >
                        {copiedStates['angles'] ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                        Copy Angles
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {result.angles.map((angle: CreativeAngle, i: number) => (
                        <Card key={i} className="border-neutral-200">
                          <CardHeader className="py-3 px-4 border-b border-neutral-100 bg-neutral-50/50">
                            <CardTitle className="text-base flex justify-between items-center">
                              {angle.name}
                              <Badge variant="outline" className="text-xs font-normal bg-white">
                                {angle.emotionalTrigger}
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 text-sm text-neutral-600">
                            {angle.explanation}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  {/* TITLES TAB */}
                  <TabsContent value="titles" className="m-0 space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold">Reddit Titles</h3>
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => {
                          copyToClipboard(result.titles.join('\n'), 'titles');
                        }}
                      >
                        {copiedStates['titles'] ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                        Copy All Titles
                      </Button>
                    </div>
                    
                    <div className="bg-white border border-neutral-200 rounded-lg divide-y divide-neutral-100">
                      {result.titles.map((title: string, i: number) => (
                        <div key={i} className="p-3 hover:bg-neutral-50 flex justify-between items-center group">
                          <span className="text-sm font-medium text-neutral-800">{title}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => copyToClipboard(title, `title-${i}`)}
                          >
                            {copiedStates[`title-${i}`] ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-neutral-400" />}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  {/* POSTS TAB */}
                  <TabsContent value="posts" className="m-0 space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold">Post Text Options</h3>
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => {
                          copyToClipboard(result.posts.join('\n\n---\n\n'), 'posts');
                        }}
                      >
                        {copiedStates['posts'] ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                        Copy All Posts
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      {result.posts.map((post: string, i: number) => (
                        <Card key={i} className="border-neutral-200">
                          <CardContent className="p-4 relative group">
                            <p className="text-sm text-neutral-700 whitespace-pre-wrap pr-10">{post}</p>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => copyToClipboard(post, `post-${i}`)}
                            >
                              {copiedStates[`post-${i}`] ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-neutral-400" />}
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  {/* COMMUNITIES TAB */}
                  <TabsContent value="communities" className="m-0 space-y-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold">Community Targeting</h3>
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => {
                          if (!result) return;
                          const text = result.communities
                            .map((c) => `${c.groupName} (${c.note})\n${c.subreddits.join(', ')}`)
                            .join('\n\n');
                          copyToClipboard(text, 'communities');
                        }}
                      >
                        {copiedStates['communities'] ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                        Copy All Communities
                      </Button>
                    </div>
                    
                    {result.communities.map((group: CommunityGroup, i: number) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-baseline space-x-2">
                          <h4 className="font-bold text-neutral-800">{group.groupName}</h4>
                          <span className="text-xs text-neutral-500 italic">{group.note}</span>
                        </div>
                        <div className="bg-white border border-neutral-200 rounded-lg p-4">
                          <div className="flex flex-wrap gap-2">
                            {group.subreddits.map((sub: string, j: number) => (
                              <Badge key={j} variant="secondary" className="bg-neutral-100 text-neutral-700 hover:bg-neutral-200 font-normal">
                                {sub}
                              </Badge>
                            ))}
                          </div>
                          <div className="mt-4 pt-3 border-t border-neutral-100 flex justify-end">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 text-xs text-neutral-500"
                              onClick={() => copyToClipboard(group.subreddits.join(', '), `sub-${i}`)}
                            >
                              {copiedStates[`sub-${i}`] ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                              Copy List
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </TabsContent>

                </div>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
