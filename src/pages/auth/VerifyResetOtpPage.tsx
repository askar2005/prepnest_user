import { useState } from 'react';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/common/ToastHost';

export function VerifyResetOtpPage() {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await apiClient.post('/auth/verify-reset-otp', { email, otp });
      pushToast('OTP verified', 'success');
      navigate(`/reset-password?email=${encodeURIComponent(email)}&otp=${otp}`);
    } catch (err: any) {
      pushToast(err?.response?.data?.message || 'Verification failed', 'error');
    } finally { setBusy(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-[16px] border border-slate-200 bg-white p-6 shadow-soft">
        <h1 className="text-xl font-semibold text-slate-900">Verify OTP</h1>
        <p className="mt-1 text-sm text-slate-500">Enter the OTP sent to {email}</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP" required maxLength={6} />
          <Button type="submit" disabled={busy} className="w-full">{busy ? 'Verifying...' : 'Verify'}</Button>
        </form>
      </div>
    </div>
  );
}