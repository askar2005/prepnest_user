import { useState, useRef } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/common/ToastHost';

export function LoginPage() {
  const { login, user } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const submittingRef = useRef(false);
  const expired = window.sessionStorage.getItem('prepnest_session_expired');

  if (user) return <Navigate to="/" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[STUDENT-LOGIN] submit called');
    if (submittingRef.current) {
      console.log('[STUDENT-LOGIN] DUPLICATE SUBMIT BLOCKED');
      return;
    }
    setBusy(true);
    submittingRef.current = true;
    try {
      console.log('[STUDENT-LOGIN] calling AuthContext.login — email:', email);
      await login(email, password);
      console.log('[STUDENT-LOGIN] === LOGIN SUCCESS === redirecting');
      window.sessionStorage.removeItem('prepnest_session_expired');
      pushToast('Welcome back!', 'success');
      navigate('/');
    } catch (err: any) {
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.message;
      const detailErr = err?.response?.data?.details;
      console.log('[STUDENT-LOGIN] === LOGIN FAILED === status:', status, 'message:', serverMsg, 'details:', detailErr);
      console.log('[STUDENT-LOGIN] error object:', err);
      pushToast(serverMsg || 'Login failed', 'error');
    } finally {
      setBusy(false);
      submittingRef.current = false;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        {expired && <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Session expired. Please log in again.</div>}
        <div className="rounded-[16px] border border-slate-200 bg-white p-6 shadow-soft">
          <h1 className="text-xl font-semibold text-slate-900">Sign in to PrepNest</h1>
          <p className="mt-1 text-sm text-slate-500">Continue your learning journey.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" required />
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
            <div className="flex justify-end"><Link to="/forgot-password" className="text-xs text-brand-600 hover:underline">Forgot password?</Link></div>
            <Button type="submit" disabled={busy} className="w-full">{busy ? 'Signing in...' : 'Sign in'}</Button>
          </form>
          <p className="mt-4 text-center text-xs text-slate-500">Don't have an account? <Link to="/signup" className="text-brand-600 hover:underline">Create one</Link></p>
        </div>
      </div>
    </div>
  );
}