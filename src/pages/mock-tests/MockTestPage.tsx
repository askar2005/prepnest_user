import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { fetchMockTestDetail, submitMockTest } from '../../api/student';
import { useToast } from '../../components/common/ToastHost';
import { Button } from '../../components/ui/Button';
import { CheckCircle, Clock, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/cn';

export function MockTestPage() {
  const { id } = useParams<{ id: string }>();
  const { pushToast } = useToast();
  const [test, setTest] = useState<any>(null);
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchMockTestDetail(id).then((d) => {
      setTest(d);
      setTimeLeft(d.durationMinutes * 60);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!started || submitted || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(t);
  }, [started, submitted, timeLeft]);

  useEffect(() => {
    if (started && timeLeft <= 0 && !submitted) handleSubmit();
  }, [timeLeft]);

  const handleSubmit = useCallback(async () => {
    if (submitted) return;
    setSubmitted(true);
    try {
      const res = await submitMockTest(id!, answers);
      setResult(res);
      pushToast('Test submitted!', 'success');
    } catch { pushToast('Submission failed', 'error'); }
  }, [id, answers, submitted, pushToast]);

  const selectAnswer = (questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  if (loading) return <p className="text-sm text-slate-400">Loading test...</p>;
  if (!test) return <p className="text-sm text-slate-500">Test not found.</p>;

  const questions = test.questions || [];
  const answeredCount = Object.keys(answers).length;

  if (!started) {
    return (
      <div className="space-y-4 max-w-lg mx-auto">
        <h1 className="text-2xl font-semibold text-slate-900">{test.title}</h1>
        <div className="rounded-[16px] border border-slate-200 bg-white p-6 shadow-soft space-y-4">
          <p className="text-sm text-slate-600">{test.description}</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-slate-500">Duration:</span><span className="ml-2 font-medium">{test.durationMinutes} min</span></div>
            <div><span className="text-slate-500">Questions:</span><span className="ml-2 font-medium">{questions.length}</span></div>
            <div><span className="text-slate-500">Passing:</span><span className="ml-2 font-medium">{test.passingMarks || 40}%</span></div>
            <div><span className="text-slate-500">Negative:</span><span className="ml-2 font-medium">{test.negativeMarking || 0} marks</span></div>
          </div>
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800 flex items-start gap-2">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>Once started, the timer cannot be paused. Ensure you have a stable connection.</span>
          </div>
          <Button onClick={() => setStarted(true)} className="w-full">Start Test</Button>
        </div>
      </div>
    );
  }

  if (submitted && result) {
    return (
      <div className="space-y-4 max-w-lg mx-auto">
        <h1 className="text-2xl font-semibold text-slate-900">Test Results</h1>
        <div className="rounded-[16px] border border-slate-200 bg-white p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <CheckCircle size={24} className={result.passed ? 'text-green-500' : 'text-red-500'} />
            Score: {result.result.score} / {result.result.total}
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div><p className="text-2xl font-bold text-slate-900">{result.result.score}</p><p className="text-xs text-slate-500">Correct</p></div>
            <div><p className="text-2xl font-bold text-slate-900">{result.result.percentage?.toFixed(0) || 0}%</p><p className="text-xs text-slate-500">Percentage</p></div>
            <div><p className="text-2xl font-bold text-slate-900">{result.result.total}</p><p className="text-xs text-slate-500">Total</p></div>
          </div>
          {result.passed ? (
            <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-sm text-green-800 text-center">Congratulations! You passed.</div>
          ) : (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-800 text-center">Keep practicing! You'll do better next time.</div>
          )}
        </div>
      </div>
    );
  }

  if (!questions.length) return <p className="text-sm text-slate-500">No questions in this test.</p>;
  const q = questions[currentQ];

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="flex gap-4">
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-900">{test.title}</h1>
          <div className="flex items-center gap-2 text-sm">
            <Clock size={16} />
            <span className={`font-mono ${timeLeft < 60 ? 'text-red-600 font-bold' : 'text-slate-700'}`}>{formatTime(timeLeft)}</span>
          </div>
        </div>

        <div className="rounded-[16px] border border-slate-200 bg-white p-6 shadow-soft space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Question {currentQ + 1} of {questions.length}</span>
            <span className="text-xs text-slate-400">{answers[q.id] ? 'Answered' : 'Not answered'}</span>
          </div>

          <p className="text-sm font-medium text-slate-900">{q.question}</p>

          <div className="space-y-2">
            {['A', 'B', 'C', 'D'].map((opt) => {
              const optKey = `option${opt}` as keyof typeof q;
              const val = q[optKey] as string;
              if (!val) return null;
              return (
                <button
                  key={opt}
                  onClick={() => selectAnswer(q.id, opt)}
                  className={cn(
                    'w-full rounded-xl border p-3 text-left text-sm transition text-slate-700',
                    answers[q.id] === opt
                      ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                      : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  <span className="font-medium">{opt}.</span> {val}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Button variant="secondary" onClick={() => setCurrentQ((p) => Math.max(0, p - 1))} disabled={currentQ === 0}>
            <ChevronLeft size={16} className="mr-1" /> Previous
          </Button>
          <span className="text-xs text-slate-400">{answeredCount}/{questions.length} answered</span>
          {currentQ < questions.length - 1 ? (
            <Button onClick={() => setCurrentQ((p) => p + 1)}>Next <ChevronRight size={16} className="ml-1" /></Button>
          ) : (
            <Button onClick={handleSubmit} variant="danger">Submit Test</Button>
          )}
        </div>
      </div>

      <div className="hidden lg:block w-48 shrink-0">
        <div className="rounded-[16px] border border-slate-200 bg-white p-4 shadow-soft sticky top-4 space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase">Questions</p>
          <div className="grid grid-cols-4 gap-1.5">
            {questions.map((_: any, i: number) => (
              <button
                key={i}
                onClick={() => setCurrentQ(i)}
                className={cn(
                  'h-8 w-8 rounded-lg text-xs font-medium transition',
                  currentQ === i && 'ring-2 ring-brand-500',
                  answers[questions[i]?.id]
                    ? 'bg-brand-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="pt-2 border-t border-slate-100">
            <Button onClick={handleSubmit} variant="danger" className="w-full text-xs">Submit</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
