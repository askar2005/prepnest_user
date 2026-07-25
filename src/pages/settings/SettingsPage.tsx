import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { useToast } from '../../components/common/ToastHost';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { User, Lock, LogOut, Info, Settings as SettingsIcon } from 'lucide-react';

export function SettingsPage() {
  const { user, logout } = useAuth();
  const { pushToast } = useToast();
  const [tab, setTab] = useState('profile');
  const [name, setName] = useState(user?.name || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const updateProfile = async () => {
    setBusy(true);
    try {
      await apiClient.put('/auth/profile', { name });
      pushToast('Profile updated', 'success');
    } catch (err: any) { pushToast(err?.response?.data?.message || 'Failed', 'error'); }
    finally { setBusy(false); }
  };

  const changePassword = async () => {
    if (newPassword.length < 6) { pushToast('Password must be at least 6 characters', 'error'); return; }
    setBusy(true);
    try {
      await apiClient.put('/auth/change-password', { oldPassword, newPassword });
      pushToast('Password changed', 'success');
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) { pushToast(err?.response?.data?.message || 'Failed', 'error'); }
    finally { setBusy(false); }
  };

  const tabs = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'password', label: 'Password', icon: Lock },
    { key: 'about', label: 'About', icon: Info },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>

      <div className="flex gap-2 pb-2 border-b border-slate-100">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-colors ${tab === t.key ? 'bg-brand-50 text-brand-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          ><t.icon className="w-4 h-4" />{t.label}</button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-card space-y-4 max-w-md">
          <label className="space-y-1.5"><span className="text-xs font-medium text-slate-500">Full name</span><Input value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label className="space-y-1.5"><span className="text-xs font-medium text-slate-500">Email</span><Input value={user?.email || ''} disabled className="opacity-60" /></label>
          <Button onClick={updateProfile} disabled={busy}>{busy ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      )}

      {tab === 'password' && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-card space-y-4 max-w-md">
          <label className="space-y-1.5"><span className="text-xs font-medium text-slate-500">Current password</span><Input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="Enter current password" /></label>
          <label className="space-y-1.5"><span className="text-xs font-medium text-slate-500">New password</span><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" /></label>
          <Button onClick={changePassword} disabled={busy || newPassword.length < 6}>{busy ? 'Changing...' : 'Change Password'}</Button>
        </div>
      )}

      {tab === 'about' && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-card space-y-3 text-sm text-slate-600 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center"><span className="text-white font-bold">P</span></div>
            <div><p className="text-base font-bold text-slate-900">PrepNest</p><p className="text-xs text-slate-400">Student Dashboard</p></div>
          </div>
          <p>Version 1.0.0</p>
          <p>A professional platform for exam preparation with Notes, MCQs, Videos, and Mock Tests.</p>
          <button onClick={logout} className="mt-4 flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
