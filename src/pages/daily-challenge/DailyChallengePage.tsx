import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTodayChallenge, submitDailyChallengeAttempt, getDailyChallengeStreak, getDailyChallengeHistory,
} from '../../api/student';
import { useToast } from '../../components/common/ToastHost';
import { Button } from '../../components/ui/Button';
import { Zap, Flame, CheckCircle, XCircle, ChevronDown, Award, PartyPopper } from 'lucide-react';

export function DailyChallengePage() {
  const { pushToast } = useToast();
  const qc = useQueryClient();
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showExplanation, setShowExplanation] = useState(true);

  const { data: todayData, isLoading } = useQuery({
    queryKey: ['daily-challenge-today'],
    queryFn: () => getTodayChallenge(),
    staleTime: 30000,
  });

  const { data: streak } = useQuery({
    queryKey: ['daily-challenge-streak'],
    queryFn: () => getDailyChallengeStreak(),
    staleTime: 30000,
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['daily-challenge-history'],
    queryFn: () => getDailyChallengeHistory(1, 10),
    staleTime: 60000,
  });

  const submitMutation = useMutation({
    mutationFn: (answer: string) => submitDailyChallengeAttempt(todayData!.challenge.id, answer),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['daily-challenge-today'] });
      qc.invalidateQueries({ queryKey: ['daily-challenge-streak'] });
      qc.invalidateQueries({ queryKey: ['daily-challenge-history'] });
    },
    onError: (err: any) => pushToast(err?.response?.data?.message || err?.message || 'Submission failed', 'error'),
  });

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  const challenge = todayData?.challenge;
  const attempt = todayData?.attempt;
  const answered = Boolean(attempt || submitMutation.data);
  const lastAnswer = attempt?.selectedAnswer || submitMutation.data?.attempt?.selectedAnswer;
  const lastCorrect = attempt?.isCorrect ?? submitMutation.data?.attempt?.isCorrect;
  const streakCount = streak?.currentStreak ?? 0;

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-up">
      <Header streakCount={streakCount} longest={streak?.longestStreak ?? 0} />

      {!challenge ? (
        <>
          <NoChallengeCard />
          <StreakCard streak={streak} />
        </>
      ) : (
        <>
          <ChallengeCard
            challenge={challenge}
            answered={answered}
            selectedAnswer={selectedAnswer}
            setSelectedAnswer={setSelectedAnswer}
            showExplanation={showExplanation}
            setShowExplanation={setShowExplanation}
            isCorrect={lastCorrect}
            lastAnswer={lastAnswer}
            correctAnswer={challenge.correctAnswer}
            explanation={challenge.explanation}
            submitting={submitMutation.isPending}
            onSubmit={() => selectedAnswer && submitMutation.mutate(selectedAnswer)}
          />
          <StreakCard streak={streak} />
        </>
      )}

      <HistoryList items={historyLoading ? [] : history?.items || []} total={history?.total ?? 0} loading={historyLoading} />
    </div>
  );
}

function Header({ streakCount, longest }: { streakCount: number; longest: number }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Zap className="w-6 h-6 text-amber-500 animate-flame--pulse" />
        <h1 className="text-2xl font-bold text-slate-900">Daily Challenge</h1>
      </div>
      <StreakBadge count={streakCount} longest={longest} />
    </div>
  );
}

function StreakBadge({ count, longest }: { count: number; longest: number }) {
  return (
    <div className="relative flex items-center gap-1.5 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-xl text-sm font-medium">
      <Flame className="w-4 h-4 animate-flame--pulse" /> {count} day streak
      {longest > 0 && <span className="text-orange-400 font-normal text-xs">· longest {longest}</span>}
    </div>
  );
}

function NoChallengeCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-soft animate-pop-in">
      <Zap className="w-16 h-16 text-amber-200 mx-auto mb-4" />
      <p className="text-lg font-semibold text-slate-700">No Challenge Today</p>
      <p className="text-sm text-slate-400 mt-1">Check back tomorrow for a new daily challenge.</p>
    </div>
  );
}

function ChallengeCard(props: any) {
  const {
    challenge, answered, selectedAnswer, setSelectedAnswer, showExplanation, setShowExplanation,
    isCorrect, lastAnswer, correctAnswer, explanation, submitting, onSubmit,
  } = props;

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white shadow-soft overflow-hidden animate-pop-in">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <p className="text-sm font-medium text-slate-700">Today's Challenge</p>
          {(challenge.topic || challenge.difficulty) && (
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              {challenge.topic && <span className="px-2 py-0.5 rounded bg-white/70 border border-amber-100">{challenge.topic}</span>}
              {challenge.difficulty && <span className="px-2 py-0.5 rounded bg-white/70 border border-amber-100 uppercase">{challenge.difficulty}</span>}
            </div>
          )}
        </div>

        <div className="p-5 space-y-4">
          {challenge.description && <p className="text-xs text-slate-400">{challenge.description}</p>}
          <p className="text-base font-medium text-slate-900">{challenge.question}</p>

          {answered ? (
            <ResultView options={challenge} lastAnswer={lastAnswer} isCorrect={isCorrect} correctAnswer={correctAnswer} showExplanation={showExplanation} setShowExplanation={setShowExplanation} explanation={explanation} />
          ) : (
            <>
              <div className="space-y-2">
                {['A', 'B', 'C', 'D'].map((opt) => {
                  const val = challenge[`option${opt}`];
                  return (
                    <button key={opt} onClick={() => setSelectedAnswer(opt)}
                      className={`dc-option w-full text-left px-4 py-3 rounded-xl border text-sm ${
                        selectedAnswer === opt
                          ? 'border-brand-500 bg-brand-50 text-brand-700 font-medium shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="font-semibold mr-2">{opt}.</span> {val}
                    </button>
                  );
                })}
              </div>
              <Button onClick={onSubmit} disabled={!selectedAnswer || submitting} className="w-full">
                {submitting ? 'Submitting...' : 'Submit Answer'}
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function ResultView({ options, lastAnswer, isCorrect, correctAnswer, showExplanation, setShowExplanation, explanation }: any) {
  return (
    <div className="space-y-4 animate-pop-in">
      {['A', 'B', 'C', 'D'].map((opt) => {
        const val = options[`option${opt}`];
        const isAnswer = correctAnswer === opt;
        const isWrongPick = !isAnswer && lastAnswer === opt;
        return (
          <div key={opt} className={`dc-option px-4 py-3 rounded-xl border text-sm ${
            isAnswer ? 'border-green-300 bg-green-50' : isWrongPick ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'
          }`}>
            <span className="font-semibold mr-2">{opt}.</span> {val}
            {isAnswer && <CheckCircle className="w-4 h-4 text-green-600 inline ml-2" />}
            {isWrongPick && <XCircle className="w-4 h-4 text-red-500 inline ml-2" />}
          </div>
        );
      })}
      <div className={`rounded-xl p-4 border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} flex items-start gap-2`}>
        {isCorrect ? <PartyPopper className="w-5 h-5 text-green-600 mt-0.5 shrink-0 animate-flame--pulse" /> : <XCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />}
        <div>
          <p className="text-sm font-semibold text-slate-800">{isCorrect ? 'Correct!' : 'Wrong answer'}</p>
          <p className="text-xs text-slate-500 mt-0.5">Correct answer: {correctAnswer}. {options[`option${correctAnswer}`]}</p>
        </div>
      </div>

      {explanation && (
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <button onClick={() => setShowExplanation(!showExplanation)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 text-sm">
            <span className="font-semibold text-slate-600">EXPLANATION</span>
            <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${showExplanation ? 'rotate-180' : ''}`} />
          </button>
          {showExplanation && <p className="text-sm text-slate-700 px-4 py-3 animate-fade-up">{explanation}</p>}
        </div>
      )}
    </div>
  );
}

function StreakCard({ streak }: { streak: any }) {
  if (!streak) return null;
  const target = 7;
  const pct = Math.min(100, Math.round((streak.currentStreak / target) * 100));
  const circ = 2 * Math.PI * 26;
  const offset = circ * (1 - pct / 100);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft animate-pop-in">
      <div className="flex items-center gap-5">
        <div className="relative w-14 h-14 shrink-0">
          <svg viewBox="0 0 60 60" className="w-14 h-14 -rotate-90">
            <circle cx="30" cy="30" r="26" fill="none" stroke="#f1f5f9" strokeWidth="6" />
            <circle
              cx="30" cy="30" r="26" fill="none" stroke={streak.currentStreak > 0 ? '#f97316' : '#94a3b8'} strokeWidth="6" strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={offset} className="animate-ring-draw"
              style={{ ['--ring-circ' as any]: `${circ}px`, ['--ring-off' as any]: `${offset}px` }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Flame className={`w-5 h-5 ${streak.currentStreak > 0 ? 'text-orange-500' : 'text-slate-300'}`} />
          </div>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-3">
          <Stat label="Current Streak" value={`${streak.currentStreak} Days`} />
          <Stat label="Longest" value={`${streak.longestStreak} Days`} />
        </div>
        <Award className="w-8 h-8 text-amber-400 shrink-0" />
      </div>
      <p className="text-[11px] text-slate-400 mt-3">{pct}% of your 7-day goal</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className="text-base font-bold text-slate-900">{value}</p>
    </div>
  );
}

function HistoryList({ items, total, loading }: { items: any[]; total: number; loading: boolean }) {
  if (loading && items.length === 0) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-400 text-sm">Loading history...</div>;
  }
  if (items.length === 0) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft animate-fade-up">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-slate-700">Recent Attempts</p>
        {total > items.length && <span className="text-[11px] text-slate-400">{total} total</span>}
      </div>
      <ul className="space-y-2">
        {items.map((h) => (
          <li key={h.id} className="flex items-center gap-3 text-sm">
            {h.isCorrect ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> : <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
            <span className="flex-1 text-slate-700 truncate">{h.challenge?.question}</span>
            <span className="text-[11px] text-slate-400 shrink-0">
              {new Date(h.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}