import { Link } from 'react-router-dom';
import { Bell, Bookmark } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SearchBar } from './SearchBar';
import { AvatarMenu } from './AvatarMenu';
import { useQuery } from '@tanstack/react-query';
import { fetchPreparationCategories, fetchUnreadNotificationCount } from '../../api/student';

export function Navbar() {
  const { user } = useAuth();

  const { data: unread } = useQuery({
    queryKey: ['notif-unread'],
    queryFn: () => fetchUnreadNotificationCount(),
    staleTime: 15000,
    refetchInterval: 30000,
  });

  const count = unread?.count || 0;

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center gap-4 h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="text-lg font-bold text-slate-900 hidden sm:block">PrepNest</span>
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-xl mx-4">
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
            <Link to="/bookmarks" className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
              <Bookmark className="w-5 h-5" />
            </Link>
            <AvatarMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
