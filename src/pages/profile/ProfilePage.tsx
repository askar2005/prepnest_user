import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { getDailyChallengeStreak } from '../../api/student';
import { User, Mail, Calendar, TrendingUp, LogOut, Flame, Trophy, CheckCircle, Star } from 'lucide-react';

export function ProfilePage() {
  const { user, logout } = useAuth();

  const { data: streak } = useQuery({
    queryKey: ['daily-challenge-streak'],
    queryFn: () => getDailyChallengeStreak(),
    staleTime: 30000,
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Profile</h1>

      <div className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-6 shadow-card">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-2xl font-bold shadow-lg shrink-0">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-bold text-slate-900">{user?.name || 'User'}</h2>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <span className="inline-block mt-1.5 px-3 py-0.5 text-xs font-medium bg-brand-50 text-brand-600 rounded-full capitalize">{user?.role?.toLowerCase()}</span>
          </div>
        </div>
      </div>

      {streak && (
        <div className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-orange-500" />
            <h3 className="text-sm font-semibold text-slate-700">Daily Streak</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 p-5 text-white">
              <Flame className="w-8 h-8 mx-auto mb-2" />
              <p className="text-3xl font-bold">{streak.currentStreak}</p>
              <p className="text-xs text-white/80">Current Streak</p>
            </div>
            <div className="text-center rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 p-5 text-white">
              <Trophy className="w-8 h-8 mx-auto mb-2" />
              <p className="text-3xl font-bold">{streak.longestStreak}</p>
              <p className="text-xs text-white/80">Longest Streak</p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-6 shadow-card">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Account Details</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { icon: User, label: 'Name', value: user?.name },
            { icon: Mail, label: 'Email', value: user?.email },
            { icon: Calendar, label: 'Account Type', value: 'Student' },
            { icon: TrendingUp, label: 'Role', value: user?.role },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 text-sm">
              <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0"><item.icon className="w-4 h-4 text-slate-400" /></div>
              <div className="min-w-0">
                <p className="text-xs text-slate-400">{item.label}</p>
                <p className="text-sm font-medium text-slate-800 truncate">{item.value || '—'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={logout} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
        <LogOut className="w-4 h-4" /> Sign out
      </button>
    </div>
  );
}
