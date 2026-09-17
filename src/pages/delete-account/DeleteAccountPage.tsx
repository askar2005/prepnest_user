import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { useToast } from '../../components/common/ToastHost';
import { ShieldAlert, Mail, Key, CheckCircle2, ArrowRight, ArrowLeft, Trash2, Info, HelpCircle } from 'lucide-react';

export function DeleteAccountPage() {
  const { pushToast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      pushToast('Please enter a valid email address.', 'error');
      return;
    }

    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/request-web-delete-account', { email });
      pushToast(data.message || 'Verification code sent to your email.', 'success');
      setStep(2);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to request verification code. Please try again.';
      pushToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDeletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      pushToast('Please enter the 6-digit verification code.', 'error');
      return;
    }

    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/confirm-web-delete-account', { email, otp });
      pushToast(data.message || 'Account successfully deleted.', 'success');
      setStep(3);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Invalid or expired verification code.';
      pushToast(msg, 'error');
    } finally {
      setLoading(false);
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
        <Link
          to="/login"
          className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-brand-600 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100"
        >
          Back to Login <ArrowRight className="w-4 h-4" />
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12 flex-1 w-full space-y-8">
        {/* Banner Section */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-sm space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-semibold">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" /> Account & Data Management
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Delete Your Kathir Academy Account
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
            Use this page to request the permanent deletion of your Kathir Academy account and associated personal data. This process works directly in your web browser without requiring the mobile application.
          </p>
        </div>

        {/* Policy Disclosures & Details Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" /> Data That Will Be Deleted
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                <span><strong>Profile & Login Credentials:</strong> Name, email address, password hash, and auth tokens.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                <span><strong>Learning Metrics & Progress:</strong> Completed tests, score history, accuracy records, and streak logs.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                <span><strong>Mock Test Attempts:</strong> Saved answer records, timestamps, and detailed performance breakdown.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                <span><strong>Activity Markers:</strong> Read notifications, daily challenge attempts, and personal bookmarks.</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Info className="w-5 h-5 text-indigo-600" /> Retention Policy & Support
            </h3>
            <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
              <p>
                <strong>Educational Materials:</strong> Notes, PDFs, MCQs, and Mock Tests published by Kathir Academy are shared educational resources and will remain available to active students.
              </p>
              <p>
                <strong>Security Audit Logs:</strong> Anonymized server logs may be retained temporarily for legal and security compliance in accordance with regulatory requirements.
              </p>
              <p>
                <strong>Processing Time:</strong> Account deletion requests confirmed via verification code are processed <strong>immediately</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Deletion Form */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-md space-y-6 max-w-xl mx-auto">
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-900">Step 1: Enter Account Email</h2>
                <p className="text-xs text-slate-500">We will send a 6-digit deletion verification code to your registered email address.</p>
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
                disabled={loading || !email}
                className="w-full py-3 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-sm transition-all active:scale-98 disabled:opacity-50"
              >
                {loading ? 'Sending Code...' : 'Send Deletion Code'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleConfirmDeletion} className="space-y-5">
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 mb-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to email
                </button>
                <h2 className="text-xl font-bold text-slate-900">Step 2: Enter Verification Code</h2>
                <p className="text-xs text-slate-500">
                  Enter the 6-digit code sent to <strong className="text-slate-800">{email}</strong>.
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

              <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-xs text-red-800">
                ⚠️ Warning: Clicking "Permanently Delete My Account" will immediately erase all your account data. This action cannot be reversed.
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full py-3 px-6 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm shadow-sm transition-all active:scale-98 disabled:opacity-50"
              >
                {loading ? 'Deleting Account...' : 'Permanently Delete My Account'}
              </button>
            </form>
          )}

          {step === 3 && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Account Deleted</h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Your Kathir Academy account and associated personal data have been permanently deleted from our system.
              </p>
              <div className="pt-4">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
                >
                  Return to Home Page
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Contact Support Footer */}
        <div className="text-center text-xs text-slate-400 flex flex-col items-center gap-2 pt-4">
          <p className="flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-slate-400" /> Have questions or need assistance?
          </p>
          <p>
            Contact our privacy team at <a href="mailto:support@kathiracademy.in" className="text-brand-600 underline font-medium">support@kathiracademy.in</a>
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
