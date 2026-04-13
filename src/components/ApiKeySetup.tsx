import { useState, type FormEvent } from 'react';
import { Zap, KeyRound, ExternalLink, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { setApiKey } from '../lib/api-key';
import { toast } from 'sonner';

interface ApiKeySetupProps {
  initialKey?: string;
  onSaved?: () => void;
}

export default function ApiKeySetup({ initialKey = '', onSaved }: ApiKeySetupProps) {
  const [value, setValue] = useState(initialKey);
  const [show, setShow] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      toast.error('Please paste a Gemini API key.');
      return;
    }
    setApiKey(trimmed);
    toast.success('API key saved to your browser.');
    onSaved?.();
  };

  return (
    <div className="min-h-screen w-full bg-neutral-50 flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="bg-[#FF4500] p-6 text-white flex items-center gap-4">
          <div className="bg-white/15 rounded-lg p-2">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Reddit Ads Creative Machine</h1>
            <p className="text-sm text-white/85">Set up your Gemini API key to get started</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2 text-sm text-neutral-600 leading-relaxed">
            <p>
              This tool uses Google&apos;s Gemini API to generate your campaigns. You bring your
              own key — it&apos;s free from Google AI Studio and takes about 30 seconds to get.
            </p>
            <div className="flex items-start gap-2 bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-xs text-neutral-600">
              <ShieldCheck className="w-4 h-4 text-[#FF4500] shrink-0 mt-0.5" />
              <span>
                Your key is stored only in this browser&apos;s local storage and sent directly to
                Google&apos;s API. It never touches any server we control.
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api-key" className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-neutral-500" />
              Gemini API key
            </Label>
            <div className="relative">
              <Input
                id="api-key"
                type={show ? 'text' : 'password'}
                autoComplete="off"
                spellCheck={false}
                placeholder="AIza..."
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="pr-10 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-neutral-400 hover:text-neutral-600"
                aria-label={show ? 'Hide API key' : 'Show API key'}
              >
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[#FF4500] hover:underline"
            >
              Get a free key at Google AI Studio
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <Button
            type="submit"
            className="w-full bg-[#FF4500] hover:bg-[#E03D00] text-white font-bold h-11"
          >
            Save & Continue
          </Button>
        </form>
      </div>
    </div>
  );
}
