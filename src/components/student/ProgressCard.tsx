import { cn } from '../../lib/cn';
import { Flame, Target, TrendingUp } from 'lucide-react';

export function StreakCard({ streak = 0 }: { streak?: number }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 p-5 text-white">
      <div className="flex items-center gap-3">
        <Flame className="w-8 h-8 text-yellow-200" />
        <div>
          <p className="text-3xl font-bold">{streak}</p>
          <p className="text-sm text-white/80">Day Streak</p>
        </div>
      </div>
    </div>
  );
}

export function WeeklyGoalCard({ progress = 0, target = 10 }: { progress?: number; target?: number }) {
  const pct = Math.min(100, Math.round((progress / target) * 100));
  return (
    <div className="rounded-2xl bg-white border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-slate-600"><Target className="w-5 h-5" /><span className="text-sm font-medium">Weekly Goal</span></div>
        <span className="text-sm font-bold text-slate-900">{progress}/{target}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-brand-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function ProgressRing({ pct = 0, label = 'Progress' }: { pct?: number; label?: string }) {
  const r = 36;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#e2e8f0" strokeWidth="6" />
        <circle cx="40" cy="40" r={r} fill="none" stroke="#6366f1" strokeWidth="6" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <span className="text-xs font-semibold text-slate-500">{pct}% {label}</span>
    </div>
  );
}
