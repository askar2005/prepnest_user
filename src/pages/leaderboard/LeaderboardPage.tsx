import { useState, useEffect } from 'react';
import { fetchLeaderboard } from '../../api/student';
import { Trophy, Medal, TrendingUp } from 'lucide-react';

const CATEGORIES = [
  { slug: 'gate', label: 'GATE' },
  { slug: 'aptitude', label: 'Aptitude' },
  { slug: 'interview', label: 'Interview' },
  { slug: 'technical', label: 'Technical' },
];

export function LeaderboardPage() {
  const [data, setData] = useState<any>(null);
  const [cat, setCat] = useState('gate');

  useEffect(() => {
    fetchLeaderboard(cat).then(setData).catch(() => {});
  }, [cat]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">Leaderboard</h1>

      <div className="flex flex-wrap gap-1 border-b border-slate-200 pb-2">
        {CATEGORIES.map((c) => (
          <button key={c.slug} onClick={() => setCat(c.slug)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${cat === c.slug ? 'bg-brand-50 text-brand-600 font-medium' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >{c.label}</button>
        ))}
      </div>

      {!data && <p className="text-sm text-slate-400">Loading...</p>}
      {data && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[16px] border border-slate-200 bg-white p-5 shadow-soft"><Trophy size={20} className="text-amber-500 mb-2" /><p className="text-lg font-bold text-slate-900">{data.totalAttempts || 0}</p><p className="text-xs text-slate-500">Total Attempts</p></div>
            <div className="rounded-[16px] border border-slate-200 bg-white p-5 shadow-soft"><TrendingUp size={20} className="text-green-500 mb-2" /><p className="text-lg font-bold text-slate-900">{data.averageScore?.toFixed(1) || '0'}</p><p className="text-xs text-slate-500">Average Score</p></div>
            <div className="rounded-[16px] border border-slate-200 bg-white p-5 shadow-soft"><Medal size={20} className="text-blue-500 mb-2" /><p className="text-lg font-bold text-slate-900">{data.highestScore || 0}</p><p className="text-xs text-slate-500">Highest Score</p></div>
          </div>
          {data.mostAttemptedTest && <div className="rounded-[16px] border border-slate-200 bg-white p-5 shadow-soft"><p className="text-sm font-semibold text-slate-700">Most Attempted Test</p><p className="text-lg font-bold text-slate-900 mt-1">{data.mostAttemptedTest.title}</p><p className="text-xs text-slate-400">{data.mostAttemptedTest._count?.results || 0} attempts</p></div>}
        </div>
      )}
    </div>
  );
}
