import { useEffect, useState } from 'react';

export function SplashScreen({ ready = true }: { ready?: boolean }) {
  const [closing, setClosing] = useState(false);
  const [visible, setVisible] = useState(true);
  const [minElapsed, setMinElapsed] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const holdMs = reducedMotion ? 500 : 1200;
    const fadeMs = reducedMotion ? 150 : 260;

    const minTimer = window.setTimeout(() => setMinElapsed(true), holdMs);
    const closeTimer = window.setTimeout(() => {
      if (ready) setClosing(true);
    }, holdMs);
    const hideTimer = window.setTimeout(() => {
      if (ready) setVisible(false);
    }, holdMs + fadeMs);

    return () => {
      window.clearTimeout(minTimer);
      window.clearTimeout(closeTimer);
      window.clearTimeout(hideTimer);
    };
  }, [ready]);

  useEffect(() => {
    if (!visible || !ready || !minElapsed) return;
    setClosing(true);
    const fadeTimer = window.setTimeout(() => setVisible(false), 260);
    return () => window.clearTimeout(fadeTimer);
  }, [minElapsed, ready, visible]);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-white transition-opacity duration-300 ease-out ${
        closing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <img
        src="/kathir-academy-logo.jpeg"
        alt="Kathir Academy"
        draggable={false}
        className={`w-[min(72vw,320px)] max-w-[82vw] select-none object-contain transition-all duration-700 ease-out motion-reduce:transition-none ${
          closing ? 'opacity-0 translate-y-1 scale-[1]' : 'opacity-100 translate-y-0 scale-[0.96]'
        }`}
      />
    </div>
  );
}
