import { useEffect, useState } from 'react';

export function SplashScreen() {
  const [closing, setClosing] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const holdMs = reducedMotion ? 650 : 1700;
    const fadeMs = reducedMotion ? 150 : 260;

    const closeTimer = window.setTimeout(() => setClosing(true), holdMs);
    const hideTimer = window.setTimeout(() => setVisible(false), holdMs + fadeMs);

    return () => {
      window.clearTimeout(closeTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

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
