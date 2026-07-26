import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTodayChallenge, submitDailyChallengeAttempt, getDailyChallengeStreak } from '../../api/student';
import { useToast } from '../../components/common/ToastHost';
import { Button } from '../../components/ui/Button';
import { Zap, Flame, CheckCircle, XCircle } from 'lucide-react';

export function DailyChallengePage() {
  const { pushToast } = useToast();
  const qc = useQueryClient();
  const [selectedAnswer, setSelectedAnswer] = useState('');

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

  const submitMutation = useMutation({
    mutationFn: (answer: string) => submitDailyChallengeAttempt(todayData!.challenge.id, answer),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['daily-challenge-today'] });
      qc.invalidateQueries({ queryKey: ['daily-challenge-streak'] });
    },
    onError: (err: any) => pushToast(err?.response?.data?.message || err?.message || 'Submission failed', 'error'),
  });

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  const challenge = todayData?.challenge;
  const attempt = todayData?.attempt;

  if (!challenge) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center gap-2"><Zap className="w-6 h-6 text-amber-500" /><h1 className="text-2xl font-bold text-slate-900">Daily Challenge</h1></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-soft">
          <Zap className="w-16 h-16 text-amber-200 mx-auto mb-4" />
          <p className="text-lg font-semibold text-slate-700">No Challenge Today</p>
          <p className="text-sm text-slate-400 mt-1">Check back tomorrow for a new daily challenge.</p>
        </div>
        {streak && <StreakBadge streak={streak} />}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Zap className="w-6 h-6 text-amber-500" /><h1 className="text-2xl font-bold text-slate-900">Daily Challenge</h1></div>
        {streak && (
          <div className="flex items-center gap-1.5 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-xl text-sm font-medium">
            <Flame className="w-4 h-4" /> {streak.currentStreak} day streak
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-soft overflow-hidden">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-3 border-b border-slate-100">
          <p className="text-sm font-medium text-slate-700">Today's Challenge</p>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-base font-medium text-slate-900">{challenge.question}</p>

          {attempt || (submitMutation.data) ? (
            <div className="space-y-4">
              {['A', 'B', 'C', 'D'].map((opt) => {
                const val = challenge[`option${opt}`];
                const isSelected = (attempt?.selectedAnswer || submitMutation.data?.attempt.selectedAnswer) === opt;
                const isCorrectAnswer = (challenge.correctAnswer) === opt;
                return (
                  <div key={opt} className={`px-4 py-3 rounded-xl border text-sm ${
                    isCorrectAnswer ? 'border-green-300 bg-green-50' : isSelected ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'
                  }`}>
                    <span className="font-semibold mr-2">{opt}.</span> {val}
                    {isCorrectAnswer && <CheckCircle className="w-4 h-4 text-green-600 inline ml-2" />}
                    {isSelected && !isCorrectAnswer && <XCircle className="w-4 h-4 text-red-500 inline ml-2" />}
                  </div>
                );
              })}
              <div className={`rounded-xl p-4 border ${(attempt?.isCorrect ?? submitMutation.data?.attempt.isCorrect) ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <p className="text-sm font-semibold">{(attempt?.isCorrect ?? submitMutation.data?.attempt.isCorrect) ? 'Correct!' : 'Wrong answer'}</p>
                <p className="text-xs text-slate-500 mt-1">Correct answer: {challenge.correctAnswer}. {challenge[`option${challenge.correctAnswer}`]}</p>
              </div>
              {challenge.explanation && (
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                  <p className="text-xs font-semibold text-slate-500 mb-1">EXPLANATION</p>
                  <p className="text-sm text-slate-700">{challenge.explanation}</p>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {['A', 'B', 'C', 'D'].map((opt) => {
                  const val = challenge[`option${opt}`];
                  return (
                    <button key={opt} onClick={() => setSelectedAnswer(opt)}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                        selectedAnswer === opt
                          ? 'border-brand-500 bg-brand-50 text-brand-700 font-medium'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="font-semibold mr-2">{opt}.</span> {val}
                    </button>
                  );
                })}
              </div>
              <Button onClick={() => submitMutation.mutate(selectedAnswer)} disabled={!selectedAnswer || submitMutation.isPending} className="w-full">
                {submitMutation.isPending ? 'Submitting...' : 'Submit Answer'}
              </Button>
            </>
          )}
        </div>
      </div>

      {streak && <StreakBadge streak={streak} />}
    </div>
  );
}

function StreakBadge({ streak }: { streak: { currentStreak: number; longestStreak: number } }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <span className="text-sm text-slate-500">Current Streak:</span>
          <span className="text-xl font-bold text-slate-900">{streak.currentStreak} Days</span>
        </div>
        <div className="w-px h-8 bg-slate-200" />
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Longest:</span>
          <span className="text-lg font-bold text-slate-900">{streak.longestStreak} Days</span>
        </div>
      </div>
    </div>
  );
}
