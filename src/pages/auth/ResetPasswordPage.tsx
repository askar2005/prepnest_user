import { useState } from 'react';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/common/ToastHost';

export function ResetPasswordPage() {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const otp = searchParams.get('otp') || '';
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await apiClient.post('/auth/reset-password', { email, otp, newPassword: password });
      pushToast('Password reset successfully', 'success');
      navigate('/login');
    } catch (err: any) {
      pushToast(err?.response?.data?.message || 'Failed', 'error');
    } finally { setBusy(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-[16px] border border-slate-200 bg-white p-6 shadow-soft">
        <h1 className="text-xl font-semibold text-slate-900">Set new password</h1>
        <p className="mt-1 text-sm text-slate-500">Choose a strong password.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" required minLength={6} />
          <Button type="submit" disabled={busy} className="w-full">{busy ? 'Resetting...' : 'Reset password'}</Button>
        </form>
      </div>
    </div>
  );
}