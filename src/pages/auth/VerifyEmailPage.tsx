import { useState } from 'react';
import { useNavigate, useSearchParams, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/common/ToastHost';

export function VerifyEmailPage() {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.trim().length < 6) {
      pushToast('Please enter the 6-digit verification code', 'error');
      return;
    }
    setBusy(true);
    try {
      const { data } = await apiClient.post('/auth/verify-email', { email, otp: otp.trim() });
      pushToast(data?.message || 'Email verified! You can now sign in.', 'success');
      navigate('/login');
    } catch (err: any) {
      pushToast(err?.response?.data?.message || 'Verification failed', 'error');
    } finally { setBusy(false); }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      const { data } = await apiClient.post('/auth/resend-otp', { email });
      pushToast(data?.message || 'A new verification code has been sent.', 'success');
    } catch (err: any) {
      pushToast(err?.response?.data?.message || 'Failed to resend code', 'error');
    } finally { setResending(false); }
  };

  return (
    <div className="flex min-h-[100dvh] py-8 sm:py-12 items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-[16px] border border-slate-200 bg-white p-6 shadow-soft space-y-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Verify your email</h1>
          <p className="mt-1 text-sm text-slate-500">Enter the 6-digit code sent to <strong className="text-slate-800">{email}</strong></p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <Input
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter 6-digit OTP"
            required
            maxLength={6}
            className="text-center font-mono text-lg tracking-widest"
          />
          <Button type="submit" disabled={busy || otp.length < 6} className="w-full">
            {busy ? 'Verifying...' : 'Verify Email'}
          </Button>
        </form>
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="text-brand-600 font-semibold hover:underline disabled:opacity-50"
          >
            {resending ? 'Sending...' : 'Resend Code'}
          </button>
          <Link to="/login" className="text-slate-600 hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}