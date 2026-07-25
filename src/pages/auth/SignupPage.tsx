import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/common/ToastHost';

export function SignupPage() {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await apiClient.post('/auth/signup', { fullName, email, password });
      pushToast('Check your email for the OTP', 'success');
      navigate(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      pushToast(err?.response?.data?.message || 'Signup failed', 'error');
    } finally { setBusy(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-[16px] border border-slate-200 bg-white p-6 shadow-soft">
        <h1 className="text-xl font-semibold text-slate-900">Create your account</h1>
        <p className="mt-1 text-sm text-slate-500">Join PrepNest and start preparing.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" required />
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" required />
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 8 characters)" required minLength={8} />
          <Button type="submit" disabled={busy} className="w-full">{busy ? 'Creating...' : 'Create account'}</Button>
        </form>
        <p className="mt-4 text-center text-xs text-slate-500">Already have an account? <Link to="/login" className="text-brand-600 hover:underline">Sign in</Link></p>
      </div>
    </div>
  );
}