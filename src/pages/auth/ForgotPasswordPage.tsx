import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/common/ToastHost';

export function ForgotPasswordPage() {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await apiClient.post('/auth/forgot-password', { email });
      pushToast('OTP sent to your email', 'success');
      navigate(`/verify-reset-otp?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      pushToast(err?.response?.data?.message || 'Failed', 'error');
    } finally { setBusy(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-[16px] border border-slate-200 bg-white p-6 shadow-soft">
        <h1 className="text-xl font-semibold text-slate-900">Reset password</h1>
        <p className="mt-1 text-sm text-slate-500">Enter your email to receive a reset OTP.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" required />
          <Button type="submit" disabled={busy} className="w-full">{busy ? 'Sending...' : 'Send OTP'}</Button>
        </form>
      </div>
    </div>
  );
}