import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchMockTestDetail, submitMockTest } from '../../api/student';
import { useToast } from '../../components/common/ToastHost';
import { Button } from '../../components/ui/Button';
import {
  CheckCircle, XCircle, Clock, AlertTriangle, ChevronLeft, ChevronRight, Flag,
  Trophy, Timer, BarChart3, BookOpenCheck, RotateCcw,
} from 'lucide-react';
import { cn } from '../../lib/cn';

type Q = {
  id: string; question: string; questionType: string;
  optionA?: string | null; optionB?: string | null; optionC?: string | null; optionD?: string | null;
  marks: number; negativeMarks: number; orderIndex: number;
};

type Session = {
  answers: Record<string, string | string[]>;
  visited: string[];
  review: string[];
  endTime: number;
  startedAt: number;
};

const TYPE_LABEL: Record<string, string> = {
  MCQ: 'Single Choice', MULTIPLE_SELECT: 'Multiple Select', TRUE_FALSE: 'True / False', SHORT_ANSWER: 'Short Answer',
  NUMERICAL: 'Numerical', FILL_BLANK: 'Fill in the Blank', PARAGRAPH: 'Paragraph', CODING: 'Coding',
};

const sessionKey = (id: string) => `mt_session_${id}`;

function loadSession(id: string): Session | null {
  try {
    const raw = localStorage.getItem(sessionKey(id));
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    if (!s || typeof s.endTime !== 'number') return null;
    return s;
  } catch { return null; }
}

export function MockTestPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { pushToast } = useToast();

  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [phase, setPhase] = useState<'intro' | 'exam' | 'submitted'>('intro');

  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [review, setReview] = useState<Set<string>>(new Set());
  const [endTime, setEndTime] = useState(0);
  const [currentQ, setCurrentQ] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const questionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetchMockTestDetail(id)
      .then((d) => {
        if (cancelled) return;
        setTest(d);
        const session = loadSession(id);
        if (session && session.endTime > Date.now()) {
          setAnswers(session.answers || {});
          setVisited(new Set(session.visited || []));
          setReview(new Set(session.review || []));
          setEndTime(session.endTime);
          setPhase('exam');
        } else if (session && session.endTime <= Date.now()) {
          setAnswers(session.answers || {});
          setVisited(new Set(session.visited || []));
          setReview(new Set(session.review || []));
          setEndTime(session.endTime);
          setPhase('exam');
        }
      })
      .catch((err: any) => setLoadError(err?.response?.data?.message || 'Failed to load test'))
      .finally(() => setLoading(false));
    return () => { cancelled = true; };
  }, [id]);

  const questions: Q[] = useMemo(() => (test?.questions || []).sort((a: Q, b: Q) => a.orderIndex - b.orderIndex), [test]);

  const persist = useCallback((answersMap: Record<string, string | string[]>, visitedSet: Set<string>, reviewSet: Set<string>, end: number) => {
    if (!id) return;
    const session: Session = { answers: answersMap, visited: [...visitedSet], review: [...reviewSet], endTime: end, startedAt: Date.now() };
    localStorage.setItem(sessionKey(id), JSON.stringify(session));
  }, [id]);

  const start = () => {
    const end = Date.now() + (test.durationMinutes || 60) * 60 * 1000;
    const visitedSet = new Set<string>();
    if (questions[0]) visitedSet.add(questions[0].id);
    setAnswers({});
    setVisited(visitedSet);
    setReview(new Set());
    setEndTime(end);
    setCurrentQ(0);
    persist({}, visitedSet, new Set(), end);
    setPhase('exam');
  };

  const save = useCallback((nextAnswers: Record<string, string | string[]>) => {
    setAnswers(nextAnswers);
    persist(nextAnswers, visited, review, endTime);
  }, [persist, visited, review, endTime]);

  const goToQuestion = (i: number) => {
    if (i < 0 || i >= questions.length) return;
    setCurrentQ(i);
    setVisited((prev) => {
      const next = new Set(prev);
      next.add(questions[i].id);
      persist(answers, next, review, endTime);
      return next;
    });
    questionRef.current?.focus();
  };

  const toggleReview = () => {
    const q = questions[currentQ];
    if (!q) return;
    setReview((prev) => {
      const next = new Set(prev);
      if (next.has(q.id)) next.delete(q.id); else next.add(q.id);
      persist(answers, visited, next, endTime);
      return next;
    });
  };

  const handleSubmit = useCallback(async () => {
    if (!id || submitting) return;
    setSubmitting(true);
    try {
      const timeSpent = Math.max(0, Math.round(((test?.durationMinutes || 60) * 60 * 1000 - (endTime - Date.now())) / 1000));
      const res = await submitMockTest(id, answers, timeSpent);
      localStorage.removeItem(sessionKey(id));
      setResult(res);
      setPhase('submitted');
      pushToast('Test submitted!', 'success');
    } catch (err: any) {
      pushToast(err?.response?.data?.message || 'Submission failed. Your answers are saved.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [id, submitting, answers, endTime, test, pushToast]);

  const onExpire = useCallback(() => {
    if (!submitting) {
      pushToast('Time is up! Submitting your answers.', 'info');
      handleSubmit();
    }
  }, [handleSubmit, submitting, pushToast]);

  const answeredCount = Object.keys(answers).length;

  if (loading) return <div className="text-center py-16 text-slate-400 animate-pulse">Loading test...</div>;
  if (loadError || !test) return <div className="text-center py-16 text-red-500 text-sm">{loadError || 'Test not found.'}</div>;

  if (phase === 'intro') {
    return (
      <div className="space-y-4 max-w-lg mx-auto">
        <h1 className="text-2xl font-semibold text-slate-900">{test.title}</h1>
        <div className="rounded-[16px] border border-slate-200 bg-white p-6 shadow-soft space-y-4">
          <p className="text-sm text-slate-600">{test.description}</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-slate-500">Duration:</span><span className="ml-2 font-medium">{test.durationMinutes} min</span></div>
            <div><span className="text-slate-500">Questions:</span><span className="ml-2 font-medium">{questions.length}</span></div>
            <div><span className="text-slate-500">Total marks:</span><span className="ml-2 font-medium">{test.totalMarks ?? 0}</span></div>
            <div><span className="text-slate-500">Passing marks:</span><span className="ml-2 font-medium">{test.passingMarks ?? 0}</span></div>
            <div><span className="text-slate-500">Negative:</span><span className="ml-2 font-medium">{test.negativeMarking || 0} per wrong question</span></div>
            <div><span className="text-slate-500">Category:</span><span className="ml-2 font-medium">{test.preparationCategory?.name || '—'}</span></div>
          </div>
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800 flex items-start gap-2">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>Once started, the timer cannot be paused. Answers are autosaved, so refreshing the page is safe. The test auto-submits when time runs out.</span>
          </div>
          {questions.length === 0 ? (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">This test has no questions yet. Please try another test.</div>
          ) : (
            <Button onClick={start} className="w-full">Start Test</Button>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'submitted' && result) {
    const r = result.result;
    const pct = r?.percentage ?? (r?.total ? (r.score / r.total) * 100 : 0);
    const passed = result.passed;
    return (
      <div className="space-y-4 max-w-xl mx-auto">
        <h1 className="text-2xl font-semibold text-slate-900 text-center">Test Results</h1>
        <div className="rounded-[16px] border border-slate-200 bg-white p-6 shadow-soft space-y-5">
          <div className="flex items-center justify-center gap-3">
            {passed ? <CheckCircle size={32} className="text-green-500" /> : <XCircle size={32} className="text-red-500" />}
            <div>
              <p className="text-xl font-bold text-slate-900">{r.score} / {r.total} marks</p>
              <p className="text-sm text-slate-500">{pct}% · {passed ? 'Passed' : 'Not passed'}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
              <p className="text-2xl font-bold text-emerald-700">{r.correctCount}</p>
              <p className="text-xs text-emerald-600">Correct</p>
            </div>
            <div className="rounded-xl bg-red-50 border border-red-100 p-3">
              <p className="text-2xl font-bold text-red-600">{r.wrongCount}</p>
              <p className="text-xs text-red-500">Wrong</p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
              <p className="text-2xl font-bold text-slate-600">{r.skippedCount}</p>
              <p className="text-xs text-slate-500">Skipped</p>
            </div>
          </div>

          {r.pendingReview > 0 && (
            <div className="rounded-xl bg-purple-50 border border-purple-100 p-3 text-sm text-purple-700 text-center">
              {r.pendingReview} paragraph question{r.pendingReview > 1 ? 's' : ''} marked for manual review.
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-slate-200 p-3 flex items-center justify-between">
              <span className="text-slate-500 inline-flex items-center gap-1"><Trophy className="w-4 h-4 text-amber-500" />Rank</span>
              <span className="font-semibold text-slate-900">#{r.rank}</span>
            </div>
            <div className="rounded-xl border border-slate-200 p-3 flex items-center justify-between">
              <span className="text-slate-500 inline-flex items-center gap-1"><BarChart3 className="w-4 h-4 text-brand-500" />Percentile</span>
              <span className="font-semibold text-slate-900">{r.percentile != null ? `${r.percentile}%` : '—'}</span>
            </div>
            <div className="rounded-xl border border-slate-200 p-3 flex items-center justify-between">
              <span className="text-slate-500 inline-flex items-center gap-1"><Timer className="w-4 h-4 text-slate-400" />Time taken</span>
              <span className="font-semibold text-slate-900">{fmtDuration(r.timeSpent)}</span>
            </div>
            <div className="rounded-xl border border-slate-200 p-3 flex items-center justify-between">
              <span className="text-slate-500 inline-flex items-center gap-1"><Clock className="w-4 h-4 text-slate-400" />Accuracy</span>
              <span className="font-semibold text-slate-900">{r.accuracy != null ? `${Math.round(r.accuracy)}%` : '—'}</span>
            </div>
          </div>

          {passed ? (
            <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-sm text-green-800 text-center">Congratulations! You passed this test.</div>
          ) : (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-800 text-center">Keep practicing — you'll do better next time.</div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button className="flex-1" onClick={() => navigate(`/mock-tests/results/${result.result.id}`)}>
              <BookOpenCheck className="w-4 h-4 mr-1" /> View Detailed Review
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => navigate('/mock-tests')}>
              Back to Tests
            </Button>
            <Button variant="secondary" onClick={() => { localStorage.removeItem(sessionKey(id!)); setResult(null); setPhase('intro'); }}>
              <RotateCcw className="w-4 h-4 mr-1" /> Retake
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) return <div className="text-center py-16 text-slate-500">No questions in this test.</div>;

  const q = questions[currentQ];

  return (
    <div className="flex gap-4">
      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-slate-900 truncate">{test.title}</h1>
            <p className="text-xs text-slate-400">{answeredCount}/{questions.length} answered · {review.size} marked for review</p>
          </div>
          <TimerBadge endTime={endTime} onExpire={onExpire} />
        </div>

        <div className="rounded-[16px] border border-slate-200 bg-white p-4 sm:p-6 shadow-soft" ref={questionRef} tabIndex={-1}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <span className="text-xs font-medium text-slate-400">Question {currentQ + 1} of {questions.length}</span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-500">{TYPE_LABEL[q.questionType] || q.questionType}</span>
              <button
                onClick={toggleReview}
                className={cn(
                  'inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg border transition',
                  review.has(q.id)
                    ? 'bg-amber-100 border-amber-300 text-amber-700'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                )}
              >
                <Flag className="w-3.5 h-3.5" /> {review.has(q.id) ? 'Marked for review' : 'Mark for review'}
              </button>
            </div>
          </div>

          <p className="text-sm font-medium text-slate-900 leading-relaxed">{q.question}</p>

          <div className="mt-5">
            <QuestionInput q={q} answer={answers[q.id]} onAnswer={(v) => save({ ...answers, [q.id]: v })} />
          </div>

          <div className="flex gap-3 text-[11px] text-slate-400 mt-5">
            <span>Marks: <b className="text-slate-600">{q.marks}</b></span>
            {Number(q.negativeMarks) > 0 && <span>Negative: <b className="text-red-500">{q.negativeMarks}</b></span>}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <Button variant="secondary" onClick={() => goToQuestion(currentQ - 1)} disabled={currentQ === 0}>
            <ChevronLeft size={16} className="mr-1" /> Previous
          </Button>
          {currentQ < questions.length - 1 ? (
            <Button onClick={() => goToQuestion(currentQ + 1)}>Next <ChevronRight size={16} className="ml-1" /></Button>
          ) : (
            <Button variant="danger" onClick={() => setConfirmOpen(true)} disabled={submitting}>Submit Test</Button>
          )}
        </div>
      </div>

      <aside className="hidden lg:block w-56 shrink-0">
        <div className="rounded-[16px] border border-slate-200 bg-white p-4 shadow-soft sticky top-4 space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase">Questions</p>
          <div className="grid grid-cols-5 gap-1.5">
            {questions.map((question, i) => {
              const isCurrent = i === currentQ;
              const isAnswered = answers[question.id] !== undefined && String(answers[question.id] ?? '').trim() !== '';
              const isVisited = visited.has(question.id);
              const isReview = review.has(question.id);
              return (
                <button
                  key={question.id}
                  onClick={() => goToQuestion(i)}
                  aria-label={`Question ${i + 1}`}
                  className={cn(
                    'h-8 w-8 rounded-lg text-xs font-medium transition',
                    isCurrent
                      ? 'bg-purple-600 text-white ring-2 ring-purple-300'
                      : isAnswered
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : isReview
                          ? 'bg-amber-400 text-white hover:bg-amber-500'
                          : isVisited
                            ? 'bg-sky-200 text-sky-900 hover:bg-sky-300'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                    isCurrent && isReview && 'ring-2 ring-amber-400',
                    isCurrent && isAnswered && 'ring-2 ring-emerald-300'
                  )}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500">
            <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded bg-emerald-500" /> Answered</div>
            <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded bg-sky-300" /> Visited</div>
            <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded bg-purple-600" /> Current</div>
            <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded bg-amber-400" /> Marked for review</div>
            <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded bg-slate-200" /> Not visited</div>
          </div>
          <Button variant="danger" onClick={() => setConfirmOpen(true)} disabled={submitting} className="w-full text-xs">
            {submitting ? 'Submitting...' : 'Submit Test'}
          </Button>
        </div>
      </aside>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40" onClick={() => setConfirmOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <p className="font-semibold text-slate-900">Submit test?</p>
            <p className="text-sm text-slate-500">
              {answeredCount}/{questions.length} answered{review.size > 0 && `, ${review.size} marked for review`}. You can still review questions before submitting.
            </p>
            <div className="flex gap-2">
              <Button variant="danger" className="flex-1" onClick={() => { setConfirmOpen(false); handleSubmit(); }} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Now'}
              </Button>
              <Button variant="secondary" onClick={() => setConfirmOpen(false)}>Keep Solving</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function fmtDuration(s: number | null | undefined) {
  if (s == null) return '—';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${sec}s`;
}

function TimerBadge({ endTime, onExpire }: { endTime: number; onExpire: () => void }) {
  const [now, setNow] = useState(Date.now());
  const expiredRef = useRef(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const left = Math.max(0, Math.floor((endTime - now) / 1000));
  useEffect(() => {
    if (left <= 0 && !expiredRef.current) {
      expiredRef.current = true;
      onExpire();
    }
  }, [left, onExpire]);

  const mm = Math.floor(left / 60).toString().padStart(2, '0');
  const ss = (left % 60).toString().padStart(2, '0');
  return (
    <div className={cn(
      'inline-flex items-center gap-2 rounded-xl border px-3 py-2 font-mono text-sm',
      left <= 60 ? 'border-red-200 bg-red-50 text-red-600 font-bold animate-pulse' : 'border-slate-200 bg-white text-slate-700'
    )}>
      <Clock size={16} /> {mm}:{ss}
    </div>
  );
}

const OPTION_KEYS = ['A', 'B', 'C', 'D'] as const;

function OptionRow({ name, label, value, checked, type, onChange }: { name?: string; label: string; value: string; checked: boolean; type: 'radio' | 'checkbox'; onChange: () => void }) {
  return (
    <label className={cn(
      'flex items-center gap-3 rounded-xl border px-4 py-3 text-sm cursor-pointer transition',
      checked ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-slate-200 bg-white hover:border-slate-300'
    )}>
      <input type={type} name={name} checked={checked} onChange={onChange} className="accent-brand-500 h-4 w-4" />
      <span className="font-semibold text-slate-600">{label}.</span>
      <span className="text-slate-800">{value}</span>
    </label>
  );
}

function QuestionInput({ q, answer, onAnswer }: { q: Q; answer: string | string[] | undefined; onAnswer: (v: string | string[]) => void }) {
  const type = q.questionType;

  if (type === 'MCQ' || type === 'TRUE_FALSE') {
    const values = type === 'MCQ'
      ? OPTION_KEYS.filter((k) => (q as any)[`option${k}`]).map((k) => ({ label: k, value: (q as any)[`option${k}`] }))
      : [{ label: 'True', value: 'TRUE' }, { label: 'False', value: 'FALSE' }];
    if (values.length === 0) return <p className="text-sm text-slate-400">This question has no options.</p>;
    return (
      <fieldset>
        <legend className="sr-only">{q.question}</legend>
        <div className="space-y-2">
          {values.map((o) => (
            <OptionRow key={o.label} name={q.id} label={o.label} value={o.value} type="radio" checked={answer === o.label} onChange={() => onAnswer(o.label)} />
          ))}
        </div>
      </fieldset>
    );
  }

  if (type === 'MULTIPLE_SELECT') {
    const values = OPTION_KEYS.filter((k) => (q as any)[`option${k}`]).map((k) => ({ label: k, value: (q as any)[`option${k}`] }));
    const selected = Array.isArray(answer) ? answer : [];
    return (
      <fieldset>
        <legend className="sr-only">{q.question}</legend>
        <div className="space-y-2">
          {values.map((o) => {
            const checked = selected.includes(o.label);
            return (
              <OptionRow
                key={o.label} label={o.label} value={o.value} type="checkbox" checked={checked}
                onChange={() => onAnswer(checked ? selected.filter((x) => x !== o.label) : [...selected, o.label])}
              />
            );
          })}
        </div>
        <p className="text-xs text-slate-400 mt-2">Select all that apply.</p>
      </fieldset>
    );
  }

  if (type === 'SHORT_ANSWER' || type === 'FILL_BLANK') {
    return (
      <input
        value={typeof answer === 'string' ? answer : ''}
        onChange={(e) => onAnswer(e.target.value)}
        placeholder="Type your answer..."
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-brand-500"
      />
    );
  }

  if (type === 'NUMERICAL') {
    return (
      <input
        type="text" inputMode="decimal"
        value={typeof answer === 'string' ? answer : ''}
        onChange={(e) => onAnswer(e.target.value)}
        placeholder="Type a number..."
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-brand-500"
      />
    );
  }

  if (type === 'PARAGRAPH' || type === 'CODING') {
    return (
      <textarea
        value={typeof answer === 'string' ? answer : ''}
        onChange={(e) => onAnswer(e.target.value)}
        placeholder={type === 'PARAGRAPH' ? 'Write your answer here...' : 'Write your solution here...'}
        className={cn(
          'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500',
          type === 'CODING' ? 'min-h-[160px] font-mono text-xs' : 'min-h-[120px]'
        )}
      />
    );
  }

  return <p className="text-sm text-slate-400">{TYPE_LABEL[type] || 'Question type'} questions are not supported in this view.</p>;
}
