import { useState, useEffect } from 'react';
import { fetchDailyChallenges, submitDailyChallenge } from '../../api/student';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/ToastHost';
import { Button } from '../../components/ui/Button';
import { Zap, Flame, Trophy } from 'lucide-react';

export function DailyChallengePage() {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const [challenges, setChallenges] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<'idle' | 'loading' | 'ready'>('idle');

  useEffect(() => {
    setState('loading');
    fetchDailyChallenges().then((d) => {
      const items = d.items || [];
      setChallenges(items);
      setState(items.length > 0 ? 'ready' : 'idle');
    }).catch(() => setState('idle'));
  }, []);

  const ch = challenges[current];
  if (!ch) return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Zap size={40} className="text-amber-300 mb-3" />
      <p className="text-lg font-medium text-slate-700">No challenge today</p>
      <p className="text-sm text-slate-400 mt-1">Check back tomorrow for a new daily challenge.</p>
    </div>
  );

  const handleSubmit = async () => {
    if (!answer.trim() || busy) return;
    setBusy(true);
    setSubmitted(true);
    try {
      await submitDailyChallenge(ch.id, ch.reward || 10);
      pushToast(`Challenge completed! +${ch.reward || 10} pts`, 'success');
    } catch { pushToast('Submission failed', 'error'); }
    finally { setBusy(false); }
  };

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-2"><Zap size={20} className="text-amber-500" /><h1 className="text-2xl font-semibold text-slate-900">Daily Challenge</h1></div>
      <div className="rounded-[16px] border border-slate-200 bg-white p-6 shadow-soft space-y-4">
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1"><Flame size={14} />Streak: {ch.streak} days</span>
          <span className="flex items-center gap-1"><Trophy size={14} />Reward: {ch.reward} pts</span>
        </div>
        <p className="text-sm font-medium text-slate-900">{ch.question}</p>
        {!submitted ? (
          <>
            <input value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Type your answer..." className="h-11 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-brand-500" />
            <Button onClick={handleSubmit} disabled={!answer.trim() || busy}>Submit Answer</Button>
          </>
        ) : (
          <div className="space-y-3">
            <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-800 flex items-center gap-2"><Trophy size={16} />You earned {ch.reward || 10} points!</div>
            <Button onClick={() => { setSubmitted(false); setAnswer(''); setCurrent((p) => (p + 1) % challenges.length); }}>Next Challenge</Button>
          </div>
        )}
      </div>
    </div>
  );
}
