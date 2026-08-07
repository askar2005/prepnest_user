import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMockTestsList } from '../../api/student';
import { Search, Timer, FileQuestion, BarChart3, Play, Trophy, Clock, ClipboardList } from 'lucide-react';
import { cn } from '../../lib/cn';

type MockTestItem = {
  id: string; title: string; description: string; durationMinutes: number; difficulty: string | null;
  negativeMarking: number; publishStatus: string; passingMarks: number; totalMarks: number | null;
  featured: boolean; scheduledAt: string | null; createdAt: string;
  preparationCategory?: { id: string; name: string; slug: string } | null;
  topic?: { id: string; name: string } | null;
  _count?: { questions: number; results: number };
  myAttempts?: number;
  myBestScore?: number | null;
};

const difficultyBadge: Record<string, string> = {
  EASY: 'bg-green-100 text-green-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HARD: 'bg-red-100 text-red-600',
};

export function MockTestsListPage() {
  const navigate = useNavigate();
  const [tests, setTests] = useState<MockTestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMockTestsList({ limit: 100 });
      setTests(data?.items || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load mock tests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tests;
    return tests.filter((t) =>
      (t.title || '').toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q) ||
      (t.preparationCategory?.name || '').toLowerCase().includes(q) ||
      (t.topic?.name || '').toLowerCase().includes(q)
    );
  }, [tests, search]);

  if (loading) return <div className="text-center py-16 text-slate-400 animate-pulse">Loading mock tests...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Mock Tests</h1>
          <p className="text-sm text-slate-500 mt-1">Timed full-length practice tests across all your preparation areas.</p>
        </div>
        <button onClick={() => navigate('/mock-tests/results')}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <Trophy className="w-4 h-4 text-amber-500" /> My Results
        </button>
      </div>

      {error && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{error}</div>}

      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tests, topics..."
          className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-sm outline-none focus:border-brand-500"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No mock tests available yet. Check back soon.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => {
            const pct = t.totalMarks && t.myBestScore != null ? Math.round((t.myBestScore / t.totalMarks) * 100) : null;
            return (
              <div key={t.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-soft overflow-hidden hover:shadow-md transition">
                <div className="p-5 flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-slate-900 leading-snug">{t.title}</p>
                    {t.featured && <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 font-medium whitespace-nowrap">Featured</span>}
                  </div>
                  {t.preparationCategory && (
                    <p className="text-xs text-slate-400">{t.preparationCategory.name}{t.topic?.name ? ` · ${t.topic.name}` : ''}</p>
                  )}
                  {t.description && <p className="text-sm text-slate-500 line-clamp-2">{t.description}</p>}
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100"><Timer className="w-3 h-3" />{t.durationMinutes} min</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100"><FileQuestion className="w-3 h-3" />{t._count?.questions ?? 0} questions</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100"><BarChart3 className="w-3 h-3" />{t.totalMarks ?? 0} marks</span>
                    {t.difficulty && <span className={cn('px-2 py-0.5 rounded-lg font-medium', difficultyBadge[t.difficulty])}>{t.difficulty}</span>}
                  </div>
                  {(t.myAttempts ?? 0) > 0 && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2 text-xs text-emerald-700 flex items-center justify-between">
                      <span>{t.myAttempts} attempt{t.myAttempts! > 1 ? 's' : ''}</span>
                      {pct != null && <span className="font-semibold">Best: {pct}%</span>}
                    </div>
                  )}
                </div>
                <div className="p-4 pt-0">
                  <button
                    onClick={() => navigate(`/mock-tests/${t.id}`)}
                    className="inline-flex w-full h-11 items-center justify-center gap-2 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition">
                    <Play className="w-4 h-4" /> {t.myAttempts ? 'Retake Test' : 'Start Test'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tests.length > 0 && (
        <p className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Timers start when you begin and cannot be paused — answers autosave, so you can refresh safely.</p>
      )}
    </div>
  );
}
