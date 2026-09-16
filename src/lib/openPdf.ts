/**
 * Open a PDF document in Kathir Academy using an in-app PDF preview modal.
 *
 * Safe, Crash-Proof & Completely Free of Google Docs Viewer / docs.google.com:
 * - Fetches actual PDF bytes (passing JWT Bearer token if required).
 * - Validates PDF magic bytes (%PDF).
 * - Renders PDF inside an in-app viewer modal using Blob ObjectURLs.
 * - Supports clean Android Back button navigation.
 */
import { toAbsoluteUrl } from './pdfUrl';
import { BACKEND_ORIGIN, apiClient } from '../api/client';
import { downloadPdf } from './downloadPdf';
import { showGlobalToast } from '../components/common/ToastHost';

/** Checks if ArrayBuffer begins with %PDF magic bytes (0x25, 0x50, 0x44, 0x46) */
function isPdfMagicBytes(buffer: ArrayBuffer): boolean {
  if (!buffer || buffer.byteLength < 4) return false;
  const bytes = new Uint8Array(buffer.slice(0, 4));
  return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
}

function renderInAppPdfModal(blobObjectUrl: string, originalUrl: string, documentTitle = 'PDF Document') {
  try {
    const existing = document.getElementById('prepnest-pdf-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'prepnest-pdf-modal';
    modal.className = 'fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-md flex flex-col w-full h-full text-white font-sans animate-fade-in';

    modal.innerHTML = `
      <div class="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 shrink-0 select-none">
        <div class="flex items-center gap-2.5 overflow-hidden pr-2">
          <svg class="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
          </svg>
          <span class="text-sm font-semibold truncate text-slate-100">${documentTitle}</span>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button id="pdf-modal-download-btn" class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition active:scale-95 shadow-md">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            Download
          </button>
          <button id="pdf-modal-close-btn" class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition" title="Close">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
      </div>
      <div class="flex-1 w-full h-full bg-slate-900 relative overflow-hidden flex items-center justify-center">
        <object data="${blobObjectUrl}" type="application/pdf" class="w-full h-full border-0 bg-white">
          <embed src="${blobObjectUrl}" type="application/pdf" class="w-full h-full border-0 bg-white" />
          <div class="p-6 text-center text-slate-300 max-w-sm">
            <p class="mb-4 text-sm font-medium">Preview is unavailable directly on this viewer.</p>
            <button id="pdf-modal-fallback-download" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow">
              Download PDF File
            </button>
          </div>
        </object>
      </div>
    `;

    document.body.appendChild(modal);

    let isCleanedUp = false;
    const cleanup = () => {
      if (isCleanedUp) return;
      isCleanedUp = true;
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
      modal.remove();
      window.setTimeout(() => URL.revokeObjectURL(blobObjectUrl), 3000);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cleanup();
    };

    const handlePopState = () => {
      cleanup();
    };

    // Push temporary state so physical Android Back button closes modal smoothly
    try {
      window.history.pushState({ pdfModal: true }, '');
      window.addEventListener('popstate', handlePopState);
    } catch {
      /* ignore history error */
    }

    window.addEventListener('keydown', handleKeyDown);

    document.getElementById('pdf-modal-close-btn')?.addEventListener('click', () => {
      if (window.history.state?.pdfModal) {
        window.history.back();
      } else {
        cleanup();
      }
    });

    const triggerDownload = () => downloadPdf(originalUrl, `${documentTitle}.pdf`);
    document.getElementById('pdf-modal-download-btn')?.addEventListener('click', triggerDownload);
    document.getElementById('pdf-modal-fallback-download')?.addEventListener('click', triggerDownload);
  } catch (err) {
    console.error('[PDF Modal Error]', err);
    showGlobalToast('Unable to display PDF preview.', 'error');
  }
}

export async function openPdf(url: string | null | undefined, title = 'PDF Document'): Promise<void> {
  if (!url || typeof url !== 'string' || !url.trim()) {
    showGlobalToast('PDF document URL is missing.', 'error');
    return;
  }

  const absUrl = toAbsoluteUrl(url, BACKEND_ORIGIN);

  try {
    showGlobalToast('Loading PDF document...', 'info');

    let arrayBuffer: ArrayBuffer;

    // Authenticated backend API URL
    if (absUrl.includes('/api/') || absUrl.startsWith(BACKEND_ORIGIN)) {
      const res = await apiClient.get(absUrl, { responseType: 'arraybuffer' });
      arrayBuffer = res.data;
    } else {
      // Direct Cloudinary or HTTPS URL
      const res = await fetch(absUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      arrayBuffer = await res.arrayBuffer();
    }

    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error('Received empty PDF payload');
    }

    // Validate PDF magic bytes (%PDF)
    if (!isPdfMagicBytes(arrayBuffer)) {
      console.warn('[PDF Open] Response is not a valid PDF document (missing %PDF header)');
      showGlobalToast('The selected file is not a valid PDF document.', 'error');
      return;
    }

    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    const objectUrl = URL.createObjectURL(blob);

    renderInAppPdfModal(objectUrl, absUrl, title);
  } catch (err: any) {
    console.error('[PDF Open] Failed to load PDF:', err);
    showGlobalToast('Unable to load PDF document. Please check your connection.', 'error');
  }
}