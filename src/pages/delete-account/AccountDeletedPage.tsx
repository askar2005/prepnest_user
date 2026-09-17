import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Home, ArrowRight } from 'lucide-react';

export function AccountDeletedPage() {
  useEffect(() => {
    document.title = 'Account Deleted - Kathir Academy';
  }, []);

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
          Login / Sign Up <ArrowRight className="w-4 h-4" />
        </Link>
      </header>

      {/* Main Content Card */}
      <main className="max-w-xl mx-auto px-4 py-16 flex-1 w-full flex items-center justify-center">
        <div className="w-full bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 shadow-md text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce-short">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Account Successfully Deleted
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-md mx-auto">
              Your Kathir Academy account and associated data have been removed.
            </p>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
            Thank you for being part of Kathir Academy. If you ever wish to return, you can create a new account at any time.
          </p>

          <div className="pt-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-sm transition-all active:scale-95"
            >
              <Home className="w-4 h-4" /> Return Home
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-400">
        <p>© {new Date().getFullYear()} Kathir Academy. All rights reserved.</p>
      </footer>
    </div>
  );
}
