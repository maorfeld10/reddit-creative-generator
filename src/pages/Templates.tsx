import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { LayoutTemplate, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CampaignTemplate {
  id: string;
  name: string;
  vertical: string;
  description: string;
  tags: string[];
  angles: string[];
}

const TEMPLATES: CampaignTemplate[] = [
  {
    id: 'internet-providers',
    name: 'Internet Providers',
    vertical: 'ISP',
    description: 'High-intent templates for ISPs focusing on speed, price, and switching pain points.',
    tags: ['curiosity', 'aggressive'],
    angles: ['Overpay', 'Speed Comparison', 'Moving'],
  },
  {
    id: 'weight-loss',
    name: 'Weight Loss',
    vertical: 'Health & Wellness',
    description: 'Relatable, non-corporate angles focusing on realistic journeys and science-backed methods.',
    tags: ['reddit-style', 'clean'],
    angles: ['Frustration', 'Science', 'Community'],
  },
  {
    id: 'travel-insurance',
    name: 'Travel Insurance',
    vertical: 'Insurance',
    description: 'Fear-of-loss and peace-of-mind angles for frequent travelers and digital nomads.',
    tags: ['curiosity', 'clean'],
    angles: ['Horror Story', 'Peace of Mind', 'Cost Comparison'],
  },
  {
    id: 'fintech',
    name: 'Fintech',
    vertical: 'Finance',
    description: 'Trust-building and feature-highlighting templates for modern banking and investing apps.',
    tags: ['futuristic', 'clean', 'aggressive'],
    angles: ['Hidden Fees', 'Future of Money', 'Simplicity'],
  },
  {
    id: 'telehealth',
    name: 'Telehealth',
    vertical: 'Healthcare',
    description: 'Convenience and privacy-focused templates for online medical services.',
    tags: ['clean', 'reddit-style'],
    angles: ['Waiting Rooms', 'Privacy', 'Instant Access'],
  },
];

export default function Templates() {
  const navigate = useNavigate();

  const handleUseTemplate = (template: CampaignTemplate) => {
    navigate('/', { state: { template } });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Campaign Templates</h1>
        <p className="text-neutral-500 mt-1">Start fast with pre-built vertical structures.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TEMPLATES.map((template) => (
          <Card key={template.id} className="flex flex-col hover:border-[#FF4500] transition-colors group cursor-pointer" onClick={() => handleUseTemplate(template)}>
            <CardHeader className="pb-3 border-b border-neutral-100 bg-neutral-50/50 group-hover:bg-[#FF4500]/5 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg font-bold">{template.name}</CardTitle>
                  <p className="text-sm text-neutral-500 mt-1">{template.vertical}</p>
                </div>
                <LayoutTemplate className="w-5 h-5 text-neutral-400 group-hover:text-[#FF4500]" />
              </div>
            </CardHeader>
            <CardContent className="pt-4 flex-1 flex flex-col">
              <p className="text-sm text-neutral-600 mb-4 flex-1">
                {template.description}
              </p>
              
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-2">Pre-loaded Angles</span>
                  <div className="flex flex-wrap gap-1">
                    {template.angles.map(angle => (
                      <Badge key={angle} variant="outline" className="bg-white text-xs font-normal">
                        {angle}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-2">Tone</span>
                  <div className="flex flex-wrap gap-1">
                    {template.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="bg-neutral-100 text-neutral-600 text-xs font-normal">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-100">
                <Button 
                  className="w-full bg-white text-[#FF4500] border border-[#FF4500] hover:bg-[#FF4500] hover:text-white transition-colors"
                >
                  Use Template
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
