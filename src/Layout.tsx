import { Link, Outlet, useLocation } from 'react-router-dom';
import { Library, LayoutTemplate, Zap, KeyRound } from 'lucide-react';
import { cn } from './lib/utils';
import { clearApiKey } from './lib/api-key';
import { toast } from 'sonner';

export default function Layout() {
  const location = useLocation();

  const navItems = [
    { name: 'New Campaign', path: '/', icon: Zap },
    { name: 'Library', path: '/library', icon: Library },
    { name: 'Templates', path: '/templates', icon: LayoutTemplate },
  ];

  const handleResetKey = () => {
    const confirmed = window.confirm(
      'Remove your Gemini API key from this browser? You will need to enter it again to keep using the app.'
    );
    if (!confirmed) return;
    clearApiKey();
    toast.success('API key removed.');
  };

  return (
    <div className="flex h-screen bg-neutral-50 text-neutral-900">
      <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col">
        <div className="p-6 flex items-center space-x-3 border-b border-neutral-100">
          <div className="bg-[#FF4500] p-2 rounded-lg">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-bold text-lg tracking-tight text-neutral-900">
            Reddit Ads<br />
            <span className="text-[#FF4500]">Creative Machine</span>
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  'flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-neutral-100 text-neutral-900'
                    : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
                )}
              >
                <item.icon
                  className={cn('w-5 h-5', isActive ? 'text-[#FF4500]' : 'text-neutral-400')}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-neutral-100 space-y-3">
          <button
            type="button"
            onClick={handleResetKey}
            className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-sm font-medium text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
          >
            <KeyRound className="w-4 h-4 text-neutral-400" />
            <span>Reset API key</span>
          </button>
          <div className="text-xs text-neutral-400 text-center">Internal Tool v1.0</div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
