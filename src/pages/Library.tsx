import { useState, useEffect } from 'react';
import { getCampaigns, deleteCampaign, Campaign } from '../lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Trash2, Copy, Calendar, Library as LibraryIcon, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function Library() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    setCampaigns(getCampaigns());
  }, []);

  const handleDelete = (id: string) => {
    deleteCampaign(id);
    setCampaigns(getCampaigns());
    toast.success('Campaign deleted');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const allSubreddits = campaigns.reduce<string[]>((acc, campaign) => {
    campaign.communities?.forEach((group) => {
      group.subreddits?.forEach((sub) => {
        if (!acc.includes(sub)) {
          acc.push(sub);
        }
      });
    });
    return acc;
  }, []);

  if (campaigns.length === 0) {
    return (
      <div className="p-8 max-w-7xl mx-auto h-full flex flex-col items-center justify-center text-neutral-500">
        <LibraryIcon className="w-16 h-16 mb-4 text-neutral-300" />
        <h2 className="text-xl font-bold text-neutral-700">Your Library is Empty</h2>
        <p className="mt-2">Generate your first campaign to see it here.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Library</h1>
        <p className="text-neutral-500 mt-1">Access and manage your generated Reddit Ads campaigns and assets.</p>
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList className="mb-6">
          <TabsTrigger value="campaigns">Saved Campaigns</TabsTrigger>
          <TabsTrigger value="subreddits">Subreddit Library</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="m-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="flex flex-col">
                <CardHeader className="pb-3 border-b border-neutral-100 bg-neutral-50/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-bold">{campaign.name}</CardTitle>
                      <p className="text-sm text-neutral-500 mt-1">{campaign.brandName}</p>
                    </div>
                    <Badge variant="secondary" className="bg-neutral-200 text-neutral-700">
                      {campaign.vertical}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 flex-1 flex flex-col">
                  <div className="flex items-center text-xs text-neutral-500 mb-4">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(campaign.date).toLocaleDateString()}
                  </div>
                  
                  <div className="space-y-2 text-sm text-neutral-600 flex-1">
                    <div className="flex justify-between">
                      <span>Angles:</span>
                      <span className="font-medium text-neutral-900">{campaign.angles?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Prompts:</span>
                      <span className="font-medium text-neutral-900">{campaign.prompts?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Titles:</span>
                      <span className="font-medium text-neutral-900">{campaign.titles?.length || 0}</span>
                    </div>
                  </div>

                  {campaign.generatedImages && Object.keys(campaign.generatedImages).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-neutral-100">
                      <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-2">Generated Images</span>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {Object.values(campaign.generatedImages).map((img, i) => (
                          <div key={i} className="relative w-12 h-12 rounded-md overflow-hidden border border-neutral-200 flex-shrink-0 group">
                            <img src={img} alt="Generated" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => {
                              const link = document.createElement('a');
                              link.href = img;
                              link.download = `campaign-image-${i}.png`;
                              link.click();
                            }}>
                              <Download className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-6 pt-4 border-t border-neutral-100 flex justify-between items-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyToClipboard(JSON.stringify(campaign, null, 2))}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy JSON
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(campaign.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="subreddits" className="m-0">
          <Card>
            <CardHeader>
              <CardTitle>Saved Subreddits</CardTitle>
              <p className="text-sm text-neutral-500">All unique subreddits generated across your campaigns.</p>
            </CardHeader>
            <CardContent>
              {allSubreddits.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {allSubreddits.map((sub, i) => (
                    <Badge key={i} variant="secondary" className="bg-neutral-100 text-neutral-700 hover:bg-neutral-200 font-normal cursor-pointer" onClick={() => copyToClipboard(sub)}>
                      {sub}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-500">No subreddits saved yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
