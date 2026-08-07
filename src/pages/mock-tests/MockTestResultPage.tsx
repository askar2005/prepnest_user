import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchMockTestResult } from '../../api/student';
import { Button } from '../../components/ui/Button';
import {
  CheckCircle, XCircle, MinusCircle, ChevronLeft, Trophy, Timer, BarChart3, BookOpen, Flag,
} from 'lucide-react';
import { cn } from '../../lib/cn';

const TYPE_LABEL: Record<string, string> = {
  MCQ: 'Single Choice', MULTIPLE_SELECT: 'Multiple Select', TRUE_FALSE: 'True / False', SHORT_ANSWER: 'Short Answer',
  NUMERICAL: 'Numerical', FILL_BLANK: 'Fill in the Blank', PARAGRAPH: 'Paragraph', CODING: 'Coding',
};

function fmtDuration(s: number | null | undefined) {
  if (s == null) return '—';
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

export function MockTestResultPage() {
  const { resultId } = useParams<{ resultId: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    if (!resultId) return;
    setLoading(true);
    try {
      const data = await fetchMockTestResult(resultId);
      setResult(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load result');
    } finally {
      setLoading(false);
    }
  }, [resultId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div className="text-center py-16 text-slate-400 animate-pulse">Loading result...</div>;
  if (error || !result) return <div className="text-center py-16 text-red-500 text-sm">{error || 'Result not found.'}</div>;

  const r = result;
  const answers: Array<{ id: string; selectedOption: string | null; selectedOptions: string[]; textAnswer: string | null; booleanAnswer: boolean | null; isCorrect: boolean; marksAwarded: number; question: any }> = r.answers || [];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <button onClick={() => navigate('/mock-tests/results')} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ChevronLeft className="w-4 h-4" /> My Results
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-soft space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{r.mockTest?.title}</h1>
            <p className="text-xs text-slate-400 mt-0.5">{new Date(r.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900">{r.score} <span className="text-sm font-normal text-slate-400">/ {r.total}</span></p>
            <span className={cn('inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-0.5', r.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600')}>
              {r.passed ? 'PASSED' : 'NOT PASSED'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat icon={<CheckCircle className="w-4 h-4 text-emerald-600" />} label="Correct" value={r.correctCount} />
          <Stat icon={<XCircle className="w-4 h-4 text-red-500" />} label="Wrong" value={r.wrongCount} />
          <Stat icon={<MinusCircle className="w-4 h-4 text-slate-400" />} label="Skipped" value={r.skippedCount} />
          <Stat icon={<Flag className="w-4 h-4 text-purple-500" />} label="Pending review" value={r.pendingReview ?? 0} />
          <Stat icon={<BarChart3 className="w-4 h-4 text-brand-500" />} label="Percentage" value={`${r.percentage}%`} />
          <Stat icon={<Trophy className="w-4 h-4 text-amber-500" />} label="Rank" value={r.rank ? `#${r.rank}` : '—'} />
          <Stat icon={<BarChart3 className="w-4 h-4 text-slate-500" />} label="Percentile" value={r.percentile != null ? `${r.percentile}%` : '—'} />
          <Stat icon={<Timer className="w-4 h-4 text-slate-500" />} label="Time taken" value={fmtDuration(r.timeSpent)} />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Question Review</h2>
        {answers.map((a, idx) => (
          <ReviewCard key={a.id} idx={idx} answer={a} />
        ))}
      </div>

      <Button variant="secondary" onClick={() => navigate('/mock-tests')}>Back to Tests</Button>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-lg font-bold text-slate-900 mt-0.5">{value}</p>
    </div>
  );
}

function ReviewCard({ idx, answer }: { idx: number; answer: any }) {
  const q = answer.question;
  const type = q.questionType;
  const isParagraph = type === 'PARAGRAPH';
  const skipped = answer.selectedOption == null && (answer.selectedOptions?.length ?? 0) === 0 && answer.textAnswer == null && answer.booleanAnswer == null;

  const userAnswerDisplay = (): string => {
    if (isParagraph) return answer.textAnswer || '—';
    if (type === 'MCQ') return answer.selectedOption || '—';
    if (type === 'MULTIPLE_SELECT') return (answer.selectedOptions || []).sort().join(', ') || '—';
    if (type === 'TRUE_FALSE') return answer.booleanAnswer == null ? '—' : answer.booleanAnswer ? 'True' : 'False';
    return answer.textAnswer || '—';
  };

  const correctAnswerDisplay = (): string => {
    if (isParagraph) return 'Manual review';
    if (type === 'MCQ') return q.correctOption || '—';
    if (type === 'MULTIPLE_SELECT') return (q.correctOptions || []).sort().join(', ') || '—';
    if (type === 'TRUE_FALSE') return q.correctBoolean == null ? '—' : q.correctBoolean ? 'True' : 'False';
    if (type === 'SHORT_ANSWER' || type === 'FILL_BLANK' || type === 'NUMERICAL') {
      const alts = q.alternatives ? ` / ${q.alternatives}` : '';
      return q.answerText ? `${q.answerText}${alts}` : q.keywords ? `Keywords: ${q.keywords}` : '—';
    }
    return q.answerText || '—';
  };

  return (
    <div className={cn(
      'rounded-2xl border bg-white p-4 sm:p-5 shadow-soft',
      isParagraph ? 'border-purple-200' : answer.isCorrect ? 'border-emerald-200' : skipped ? 'border-slate-200' : 'border-red-200'
    )}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-900 flex-1">
          <span className="text-slate-400 mr-1">Q{idx + 1}.</span>
          {q.question}
        </p>
        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-500 whitespace-nowrap">{TYPE_LABEL[type] || type}</span>
      </div>

      {(type === 'MCQ' || type === 'MULTIPLE_SELECT') && (
        <div className="mt-3 space-y-1.5">
          {(['A', 'B', 'C', 'D'] as const).map((opt) => {
            const val = q[`option${opt}`];
            if (!val) return null;
            const isCorrect = type === 'MCQ' ? q.correctOption === opt : (q.correctOptions || []).includes(opt);
            const chosen = type === 'MCQ' ? answer.selectedOption === opt : (answer.selectedOptions || []).includes(opt);
            return (
              <div key={opt} className={cn(
                'px-3 py-2 rounded-lg border text-sm flex items-center gap-2',
                isCorrect ? 'border-emerald-300 bg-emerald-50' : chosen ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'
              )}>
                <span className={cn('font-semibold', isCorrect ? 'text-emerald-700' : chosen ? 'text-red-500' : 'text-slate-500')}>{opt}.</span>
                <span className="text-slate-800">{val}</span>
                {isCorrect && <CheckCircle className="w-4 h-4 text-emerald-600 ml-auto" />}
                {chosen && !isCorrect && <XCircle className="w-4 h-4 text-red-500 ml-auto" />}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-3 grid sm:grid-cols-2 gap-2 text-sm">
        <div className={cn('rounded-lg border px-3 py-2', skipped ? 'border-slate-200 bg-slate-50' : isParagraph ? 'border-purple-200 bg-purple-50' : answer.isCorrect ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50')}>
          <p className="text-[10px] font-semibold text-slate-400 uppercase">Your answer</p>
          <p className="text-slate-800 mt-0.5">{isParagraph && skipped ? 'No answer' : userAnswerDisplay()}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
          <p className="text-[10px] font-semibold text-slate-400 uppercase">Correct answer</p>
          <p className={cn('mt-0.5', isParagraph ? 'text-purple-600' : 'text-emerald-700')}>{correctAnswerDisplay()}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span>Marks: <b className={cn('text-sm', answer.marksAwarded > 0 ? 'text-emerald-600' : answer.marksAwarded < 0 ? 'text-red-500' : 'text-slate-600')}>{answer.marksAwarded > 0 ? `+${answer.marksAwarded}` : answer.marksAwarded}</b> / {q.marks}</span>
        {isParagraph && <span className="text-purple-500">Awaiting manual review</span>}
        {q.explanation && (
          <span className="flex-1 min-w-[200px] text-slate-500 bg-slate-50 rounded-lg px-3 py-1.5">
            <b>Explanation:</b> {q.explanation}
          </span>
        )}
      </div>
    </div>
  );
}
