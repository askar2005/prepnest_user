import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Bookmark, Menu, X, Home, BookOpen, Target, ClipboardList, Zap, TrendingUp, User, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SearchBar } from './SearchBar';
import { AvatarMenu } from './AvatarMenu';
import { useQuery } from '@tanstack/react-query';
import { fetchUnreadNotificationCount } from '../../api/student';
import { cn } from '../../lib/cn';

const navItems = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/preparation/gate', label: 'GATE', icon: BookOpen },
  { to: '/preparation/aptitude', label: 'Aptitude', icon: Target },
  { to: '/preparation/technical', label: 'Technical', icon: BookOpen },
  { to: '/mock-tests', label: 'Mock Tests', icon: ClipboardList },
  { to: '/daily-challenge', label: 'Daily Challenge', icon: Zap },
  { to: '/leaderboard', label: 'Leaderboard', icon: TrendingUp },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Navbar() {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: unread } = useQuery({
    queryKey: ['notif-unread'],
    queryFn: () => fetchUnreadNotificationCount(),
    staleTime: 15000,
    refetchInterval: 30000,
  });

  const count = unread?.count || 0;
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center gap-4 h-16">
          {/* Mobile hamburger */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 -ml-2 rounded-lg hover:bg-slate-100 text-slate-600 md:hidden">
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="text-lg font-bold text-slate-900 hidden sm:block">PrepNest</span>
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-xl mx-2 md:mx-4">
            <SearchBar />
          </div>

          {/* Right */}
          <div className="flex items-center gap-1">
            <Link to="/notifications" className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors relative">
              <Bell className="w-5 h-5" />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold ring-2 ring-white px-1">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </Link>
            <Link to="/bookmarks" className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors hidden sm:block">
              <Bookmark className="w-5 h-5" />
            </Link>
            <AvatarMenu />
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Mobile navigation drawer */}
      <div className={cn(
        'fixed top-0 left-0 z-40 h-full w-72 bg-white border-r border-slate-200 shadow-lg transform transition-transform duration-300 md:hidden overflow-y-auto',
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="text-lg font-bold text-slate-900">PrepNest</span>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
            <X size={20} />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  isActive(item.to) ? 'bg-brand-50 text-brand-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
                {item.to === '/notifications' && count > 0 && (
                  <span className="ml-auto min-w-[20px] h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1.5">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
