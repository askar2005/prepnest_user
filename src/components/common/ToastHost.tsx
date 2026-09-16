import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type Toast = { id: string; message: string; tone: 'success' | 'error' | 'info' };

type ToastContextValue = {
  pushToast: (message: string, tone?: Toast['tone']) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function showGlobalToast(message: string, tone: Toast['tone'] = 'info') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('prepnest-toast', { detail: { message, tone } }));
  }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = (message: string, tone: Toast['tone'] = 'success') => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 3000);
  };

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.message) {
        pushToast(detail.message, detail.tone);
      }
    };
    window.addEventListener('prepnest-toast', handler);
    return () => window.removeEventListener('prepnest-toast', handler);
  }, []);

  const value = useMemo(() => ({ pushToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed left-4 right-4 top-4 z-50 space-y-2 md:left-auto md:right-4 md:w-auto">
        {toasts.map((toast) => (
          <div key={toast.id} className={`rounded-xl px-4 py-3 text-sm shadow-soft ${toast.tone === 'success' ? 'bg-emerald-600 text-white' : toast.tone === 'error' ? 'bg-red-600 text-white' : 'bg-slate-700 text-white'}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
