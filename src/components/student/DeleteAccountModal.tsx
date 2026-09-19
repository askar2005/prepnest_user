import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { useToast } from '../common/ToastHost';
import { AlertTriangle, Trash2, X, Lock, ShieldAlert } from 'lucide-react';
import { useModalBackHandler } from '../../lib/backButtonManager';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ isOpen, onClose }) => {
  useModalBackHandler(isOpen, onClose);

  const { logout } = useAuth();
  const { pushToast } = useToast();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      pushToast('Please enter your password to confirm deletion.', 'error');
      return;
    }

    setLoading(true);
    try {
      await apiClient.delete('/auth/account', { data: { password } });
      pushToast('Your account and associated data have been deleted.', 'success');
      onClose();
      // Clear auth tokens & redirect to login
      logout();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to delete account. Please try again.';
      pushToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-5 sm:p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[90dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Delete your account?</h2>
              <p className="text-xs text-slate-500">This action is permanent and cannot be undone.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Body */}
        <div className="space-y-4 text-xs sm:text-sm text-slate-600">
          <p className="font-medium text-slate-800">
            Deleting your Kathir Academy account will permanently erase your personal data from our servers.
          </p>

          <div className="rounded-2xl bg-red-50/70 border border-red-100 p-4 space-y-2">
            <p className="font-semibold text-red-900 flex items-center gap-1.5 text-xs">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
              The following data will be permanently deleted:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs text-red-800/90 pl-1">
              <li>Profile & login credentials</li>
              <li>Learning progress, test accuracy & metrics</li>
              <li>Mock test attempt histories & answers</li>
              <li>Daily challenge streak data & completions</li>
              <li>Personalized notifications & read markers</li>
              <li>Direct account linkages to discussion comments</li>
            </ul>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Note: Shared educational materials (Notes, PDFs, MCQs, Mock Tests) remain on the platform for other students. Security audit logs may be retained temporarily where required by applicable laws.
          </p>
        </div>

        {/* Confirmation Form */}
        <form onSubmit={handleDelete} className="space-y-4 pt-2 border-t border-slate-100">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" /> Confirm with your password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your current password"
              required
              disabled={loading}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !password}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              {loading ? 'Deleting...' : 'Delete My Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
