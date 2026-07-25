import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Bookmark, BarChart3, Download, Award, Settings, LogOut, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/cn';

export function AvatarMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const items = [
    { label: 'My Profile', icon: User, action: () => navigate('/profile') },
    { label: 'Progress', icon: BarChart3, action: () => navigate('/leaderboard') },
    { label: 'Bookmarks', icon: Bookmark, action: () => navigate('/bookmarks') },
    { label: 'Downloads', icon: Download, action: () => {} },
    { label: 'Certificates', icon: Award, action: () => {} },
    { label: 'Settings', icon: Settings, action: () => navigate('/settings') },
  ];

  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-100 transition-colors">
        <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-semibold">{initials}</div>
        <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-lg py-2 z-50">
          <div className="px-4 py-2 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-900 truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email || ''}</p>
          </div>
          {items.map((item) => (
            <button key={item.label} onClick={() => { setOpen(false); item.action(); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
              <item.icon className="w-4 h-4 text-slate-400" />
              {item.label}
            </button>
          ))}
          <div className="border-t border-slate-100 pt-1 mt-1">
            <button onClick={() => { setOpen(false); logout(); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
