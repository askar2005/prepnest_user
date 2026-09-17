import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { useToast } from '../../components/common/ToastHost';
import { ShieldAlert, Mail, Key, CheckCircle2, ArrowRight, ArrowLeft, Trash2, Info, HelpCircle, AlertTriangle } from 'lucide-react';

export function DeleteAccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pushToast } = useToast();

  // Logged-in state controls
  const [understood, setUnderstood] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [loggedInDeleting, setLoggedInDeleting] = useState(false);

  // Logged-out state controls
  const [webStep, setWebStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [webLoading, setWebLoading] = useState(false);

  useEffect(() => {
    // SEO Meta Title & Description
    document.title = 'Delete Account - Kathir Academy';
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', 'Delete your Kathir Academy account and associated personal data.');
  }, []);

  // Handle Logged-In User Account Deletion
  const handleLoggedInDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!understood || confirmText !== 'DELETE') {
      pushToast('Please check the confirmation box and type DELETE to continue.', 'error');
      return;
    }

    setLoggedInDeleting(true);
    try {
      await apiClient.delete('/user/delete-account', { data: {} });
      pushToast('Your account and associated data have been removed.', 'success');
      // Clear session/JWT and auth state
      window.localStorage.removeItem('prepnest_token');
      window.localStorage.removeItem('prepnest_user');
      navigate('/account-deleted', { replace: true });
      window.location.reload();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to delete account. Please try again.';
      pushToast(msg, 'error');
      setLoggedInDeleting(false);
    }
  };

  // Handle Logged-Out Web Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      pushToast('Please enter a valid email address.', 'error');
      return;
    }

    setWebLoading(true);
    try {
      const { data } = await apiClient.post('/auth/request-web-delete-account', { email });
      pushToast(data.message || 'Verification code sent to your email.', 'success');
      setWebStep(2);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to request verification code.';
      pushToast(msg, 'error');
    } finally {
      setWebLoading(false);
    }
  };

  // Handle Logged-Out Web Confirm OTP Deletion
  const handleConfirmWebDeletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      pushToast('Please enter the 6-digit verification code.', 'error');
      return;
    }

    setWebLoading(true);
    try {
      const { data } = await apiClient.post('/auth/confirm-web-delete-account', { email, otp });
      pushToast(data.message || 'Account successfully deleted.', 'success');
      navigate('/account-deleted', { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Invalid or expired verification code.';
      pushToast(msg, 'error');
    } finally {
      setWebLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between selection:bg-brand-500 selection:text-white">
      {/* Navbar Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            K
          </div>
          <span className="font-extrabold text-slate-900 text-lg tracking-tight">Kathir Academy</span>
        </Link>
        {user ? (
          <button
            onClick={() => logout()}
            className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-red-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100"
          >
            Logout
          </button>
        ) : (
          <Link
            to="/login"
            className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-brand-600 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100"
          >
            Login / Sign Up <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12 flex-1 w-full space-y-8">
        {/* Banner Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-sm space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-semibold">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" /> Google Play Compliant Account Deletion
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Delete Your Kathir Academy Account
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
            Delete your Kathir Academy account and associated personal data. This action is permanent and cannot be undone.
          </p>
        </div>

        {/* LOGGED IN USER FLOW */}
        {user ? (
          <div className="bg-white rounded-3xl border border-red-200/80 p-6 sm:p-10 shadow-md space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Account Deletion Request</h2>
                <p className="text-xs text-slate-500">Currently logged in as <strong className="text-slate-800">{user.email}</strong></p>
              </div>
            </div>

            <div className="rounded-2xl bg-red-50 border border-red-100 p-5 space-y-3">
              <p className="font-bold text-red-900 text-sm">
                Warning: Deleting your account will permanently remove:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-red-800/90 pl-1">
                <li>Profile information</li>
                <li>Progress & leaderboard records</li>
                <li>Bookmarks</li>
                <li>Downloads history</li>
                <li>Notes activity</li>
                <li>Chat history</li>
                <li>All personal data</li>
              </ul>
              <p className="text-xs font-semibold text-red-700 pt-1">
                This action cannot be undone.
              </p>
            </div>

            <form onSubmit={handleLoggedInDelete} className="space-y-5 pt-2">
              {/* Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={understood}
                  onChange={(e) => setUnderstood(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-xs sm:text-sm font-semibold text-slate-800">
                  I understand this action is permanent
                </span>
              </label>

              {/* Confirmation Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">
                  Type <strong className="text-red-600 font-mono">DELETE</strong> to continue:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  disabled={loggedInDeleting}
                  className="w-full px-4 py-2.5 text-sm font-mono tracking-wider rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                />
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={!understood || confirmText !== 'DELETE' || loggedInDeleting}
                className="w-full py-3 px-6 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm shadow-sm transition-all active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {loggedInDeleting ? 'Deleting Account...' : 'Delete Account'}
              </button>
            </form>
          </div>
        ) : (
          /* LOGGED OUT / PUBLIC WEB REQUEST FLOW */
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-md space-y-6 max-w-xl mx-auto">
            {webStep === 1 && (
              <form onSubmit={handleRequestOtp} className="space-y-5">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-slate-900">Public Account Deletion Request</h2>
                  <p className="text-xs text-slate-500">Enter your registered email address to receive a deletion verification code.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-slate-400" /> Account Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. student@example.com"
                    required
                    className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={webLoading || !email}
                  className="w-full py-3 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-sm transition-all active:scale-98 disabled:opacity-50"
                >
                  {webLoading ? 'Sending Code...' : 'Send Deletion Code'}
                </button>
              </form>
            )}

            {webStep === 2 && (
              <form onSubmit={handleConfirmWebDeletion} className="space-y-5">
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setWebStep(1)}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 mb-2"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to email
                  </button>
                  <h2 className="text-xl font-bold text-slate-900">Enter Verification Code</h2>
                  <p className="text-xs text-slate-500">
                    Enter the 6-digit verification code sent to <strong className="text-slate-800">{email}</strong>.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-slate-400" /> Verification Code (OTP)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit code"
                    required
                    className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={webLoading || otp.length < 6}
                  className="w-full py-3 px-6 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm shadow-sm transition-all active:scale-98 disabled:opacity-50"
                >
                  {webLoading ? 'Deleting Account...' : 'Permanently Delete Account'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* PUBLIC GOOGLE PLAY INFORMATION DISCLOSURES */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-600" /> Data Deleted
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-600">
              <li>• Name & Email Address</li>
              <li>• Profile & Credentials</li>
              <li>• Learning progress & streaks</li>
              <li>• Bookmarks & Download history</li>
              <li>• Chat messages & User comments</li>
            </ul>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-600" /> Retention Details
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              • <strong>Security Logs:</strong> Security audit logs may be retained for up to 30 days.
              <br />
              • <strong>Financial Records:</strong> Transaction logs are retained where legally required.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Deletion Timeline
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              • <strong>Account Removal:</strong> Immediate upon confirmation.
              <br />
              • <strong>Full Cleanup:</strong> Complete server backup cleanup within 30 days.
            </p>
          </div>
        </div>

        {/* Support Footer */}
        <div className="text-center text-xs text-slate-400 flex flex-col items-center gap-1.5 pt-2">
          <p className="flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-slate-400" /> Need assistance with your account deletion?
          </p>
          <p>
            Contact support at <a href="mailto:support@kathiracademy.in" className="text-brand-600 underline font-medium">support@kathiracademy.in</a>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-400">
        <p>© {new Date().getFullYear()} Kathir Academy. All rights reserved.</p>
      </footer>
    </div>
  );
}
