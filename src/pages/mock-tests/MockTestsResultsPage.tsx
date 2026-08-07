import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMyMockTestResults } from '../../api/student';
import { Trophy, ChevronRight, ClipboardList, Timer } from 'lucide-react';
import { cn } from '../../lib/cn';

type ResultItem = {
  id: string; score: number; total: number; percentage: number; accuracy: number;
  correctCount: number; wrongCount: number; skippedCount: number; rank: number | null;
  percentile: number | null; timeSpent: number | null; status: string; createdAt: string;
  mockTest: { id: string; title: string; description: string; durationMinutes: number; passingMarks: number; totalMarks: number | null; preparationCategory: { name: string } | null };
};

function fmtDate(d: string) {
  return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function fmtDuration(s: number | null | undefined) {
  if (s == null) return '—';
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

export function MockTestsResultsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMyMockTestResults();
      setItems(data?.items || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">My Results</h1>
          <p className="text-sm text-slate-500 mt-1">Every attempt you've made across mock tests.</p>
        </div>
        <button onClick={() => navigate('/mock-tests')}
          className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Browse Tests
        </button>
      </div>

      {error && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{error}</div>}

      {loading ? (
        <div className="text-center py-16 text-slate-400 animate-pulse">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No attempts yet. Take your first mock test!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((r) => {
            const passed = r.score >= (r.mockTest.passingMarks || 0);
            return (
              <button
                key={r.id}
                onClick={() => navigate(`/mock-tests/results/${r.id}`)}
                className="w-full text-left rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-soft hover:shadow-md transition flex flex-wrap items-center gap-4"
              >
                <div className="flex-1 min-w-[200px] space-y-1">
                  <p className="font-semibold text-slate-900">{r.mockTest.title}</p>
                  <p className="text-xs text-slate-400">{r.mockTest.preparationCategory?.name || ''} · {fmtDate(r.createdAt)}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                    <span>Correct <b className="text-emerald-600">{r.correctCount}</b></span>
                    <span>Wrong <b className="text-red-500">{r.wrongCount}</b></span>
                    <span>Skipped <b className="text-slate-600">{r.skippedCount}</b></span>
                    <span className="inline-flex items-center gap-1"><Timer className="w-3 h-3" />{fmtDuration(r.timeSpent)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xl font-bold text-slate-900">{r.score}<span className="text-sm font-normal text-slate-400">/{r.total}</span></p>
                    <span className={cn('inline-block text-[11px] px-2 py-0.5 rounded-full font-medium mt-0.5', passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600')}>
                      {passed ? 'PASSED' : 'NOT PASSED'}
                    </span>
                  </div>
                  <div className="text-right w-14">
                    <p className="text-lg font-bold text-slate-900">{r.percentage}%</p>
                    <p className="text-[11px] text-slate-400">{r.rank ? `#${r.rank} rank` : '—'}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {items.length > 0 && (
        <p className="text-xs text-slate-400 flex items-center gap-1"><Trophy className="w-3 h-3" /> Click any attempt to review every question with the correct answers.</p>
      )}
    </div>
  );
}
