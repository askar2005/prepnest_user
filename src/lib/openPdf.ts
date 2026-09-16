/**
 * Open a PDF document in Capacitor Android using Chrome Custom Tabs (@capacitor/browser)
 * or in-app preview modal (Web).
 *
 * Safe & Crash-Proof: Never passes file:// URIs to Browser.open() on Android.
 */
import { getInlinePreviewUrl, toAbsoluteUrl } from './pdfUrl';
import { BACKEND_ORIGIN } from '../api/client';
import { downloadPdf } from './downloadPdf';
import { Browser } from '@capacitor/browser';
import { showGlobalToast } from '../components/common/ToastHost';

function isCapacitorNative(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as any).Capacitor;
  return !!(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());
}

function renderInAppModal(previewSrc: string, originalUrl: string) {
  try {
    const existing = document.getElementById('prepnest-pdf-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'prepnest-pdf-modal';
    modal.className = 'fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-md flex flex-col w-full h-full text-white font-sans animate-fade-in';

    modal.innerHTML = `
      <div class="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
        <div class="flex items-center gap-2.5 overflow-hidden pr-2">
          <svg class="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
          </svg>
          <span class="text-sm font-semibold truncate text-slate-100">PDF Document</span>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button id="pdf-modal-download-btn" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition active:scale-95">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            Download
          </button>
          <button id="pdf-modal-close-btn" class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition" title="Close">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
      </div>
      <div class="flex-1 w-full h-full bg-slate-900 relative overflow-hidden flex items-center justify-center">
        <iframe src="${previewSrc}" class="w-full h-full border-0 bg-white" title="PDF Document Viewer"></iframe>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('pdf-modal-close-btn')?.addEventListener('click', () => modal.remove());
    document.getElementById('pdf-modal-download-btn')?.addEventListener('click', () => {
      downloadPdf(originalUrl);
    });
  } catch {
    showGlobalToast('Unable to open PDF preview modal.', 'error');
  }
}

export async function openPdf(url: string | null | undefined): Promise<void> {
  if (!url || typeof url !== 'string' || !url.trim()) {
    showGlobalToast('PDF document URL is missing.', 'error');
    return;
  }

  const absOriginal = toAbsoluteUrl(url, BACKEND_ORIGIN);
  const target = getInlinePreviewUrl(url, BACKEND_ORIGIN) ?? absOriginal;

  // 1. Capacitor Android Native Flow (Chrome Custom Tabs with pure HTTPS URLs)
  if (isCapacitorNative()) {
    try {
      let openUrl: string;

      if (target.startsWith('http://') || target.startsWith('https://')) {
        if (target.includes('cloudinary.com') || target.toLowerCase().includes('.pdf')) {
          openUrl = target;
        } else {
          openUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(target)}`;
        }
      } else {
        const fullHttps = target.startsWith('/') ? `${BACKEND_ORIGIN}${target}` : `${BACKEND_ORIGIN}/${target}`;
        openUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(fullHttps)}`;
      }

      await Browser.open({ url: openUrl });
      return;
    } catch (err) {
      console.error('[PDF Open] Browser.open failed:', err);
      // Fallback cleanly to in-app modal instead of crashing
      renderInAppModal(target, absOriginal);
      return;
    }
  }

  // 2. Web Browser Flow
  try {
    const win = window.open(target, '_blank', 'noopener,noreferrer');
    if (!win) {
      renderInAppModal(target, absOriginal);
    }
  } catch {
    renderInAppModal(target, absOriginal);
  }
}