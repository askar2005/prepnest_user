/**
 * Open a PDF document in Kathir Academy using an in-app PDF preview modal.
 *
 * Safe, Crash-Proof & Completely Free of Google Docs Viewer / docs.google.com:
 * - Fetches actual PDF bytes (passing JWT Bearer token if required).
 * - Validates PDF magic bytes (%PDF).
 * - Renders PDF pages onto HTML5 canvas elements using PDF.js.
 * - Supports multi-page vertical scrolling, page count indicator, and high-DPI sharp rendering.
 * - Supports clean Android Back button navigation.
 * - DOES NOT break or alter working Download PDF functionality.
 */
import * as pdfjsLib from 'pdfjs-dist';
import { toAbsoluteUrl } from './pdfUrl';
import { BACKEND_ORIGIN, apiClient } from '../api/client';
import { downloadPdf } from './downloadPdf';
import { showGlobalToast } from '../components/common/ToastHost';

// Configure PDF.js worker for Vite build
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.js',
    import.meta.url
  ).toString();
} catch (e) {
  // Fallback worker URL if module resolution fails in bundle
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;
}

/** Checks if ArrayBuffer begins with %PDF magic bytes (0x25, 0x50, 0x44, 0x46) */
function isPdfMagicBytes(buffer: ArrayBuffer): boolean {
  if (!buffer || buffer.byteLength < 4) return false;
  const bytes = new Uint8Array(buffer.slice(0, 4));
  return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
}

/** Renders in-app PDF viewer modal using canvas elements for every page */
function renderInAppPdfModal(arrayBuffer: ArrayBuffer, originalUrl: string, documentTitle = 'PDF Document') {
  try {
    const existing = document.getElementById('prepnest-pdf-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'prepnest-pdf-modal';
    modal.className = 'fixed inset-0 z-[9999] bg-slate-950 flex flex-col w-full h-full text-white font-sans animate-fade-in';

    modal.innerHTML = `
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 shrink-0 select-none shadow-md">
        <div class="flex items-center gap-2.5 overflow-hidden pr-2 min-w-0">
          <svg class="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
          </svg>
          <span class="text-sm font-semibold truncate text-slate-100">${documentTitle}</span>
          <span id="pdf-page-indicator" class="hidden sm:inline-block text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono"></span>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button id="pdf-modal-download-btn" class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition active:scale-95 shadow-md cursor-pointer">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            Download
          </button>
          <button id="pdf-modal-close-btn" class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer" title="Close">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
      </div>

      <!-- Main Canvas Container -->
      <div id="pdf-scroll-container" class="flex-1 w-full h-full bg-slate-950 overflow-y-auto overflow-x-hidden p-4 sm:p-6 flex flex-col items-center gap-4">
        <div id="pdf-loading-spinner" class="my-auto flex flex-col items-center gap-3 text-slate-400">
          <div class="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p class="text-xs font-medium">Rendering PDF pages...</p>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    let pdfDoc: pdfjsLib.PDFDocumentProxy | null = null;
    let isCleanedUp = false;

    const cleanup = () => {
      if (isCleanedUp) return;
      isCleanedUp = true;
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
      if (pdfDoc) {
        pdfDoc.destroy();
        pdfDoc = null;
      }
      modal.remove();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cleanup();
    };

    const handlePopState = () => {
      cleanup();
    };

    // Support Android hardware back button
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

    // Asynchronously load & render pages using PDF.js
    (async () => {
      const container = document.getElementById('pdf-scroll-container');
      const spinner = document.getElementById('pdf-loading-spinner');
      const indicator = document.getElementById('pdf-page-indicator');

      try {
        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuffer),
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
          cMapPacked: true,
        });

        pdfDoc = await loadingTask.promise;
        const numPages = pdfDoc.numPages;

        if (indicator) {
          indicator.textContent = `${numPages} Page${numPages > 1 ? 's' : ''}`;
        }

        if (spinner) spinner.remove();
        if (!container) return;

        const dpr = window.devicePixelRatio || 1;
        const containerWidth = Math.min(container.clientWidth - 32, 900);

        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          if (isCleanedUp) break;

          const page = await pdfDoc.getPage(pageNum);
          const unscaledViewport = page.getViewport({ scale: 1.0 });

          // Calculate scale to fit container width smoothly
          const fitScale = Math.max(0.6, containerWidth / unscaledViewport.width);
          const viewport = page.getViewport({ scale: fitScale });

          const pageWrapper = document.createElement('div');
          pageWrapper.className = 'relative flex flex-col items-center bg-white shadow-xl rounded-lg overflow-hidden transition-shadow hover:shadow-2xl';

          const canvas = document.createElement('canvas');
          canvas.className = 'block max-w-full h-auto bg-white';
          
          canvas.width = Math.floor(viewport.width * dpr);
          canvas.height = Math.floor(viewport.height * dpr);
          canvas.style.width = `${Math.floor(viewport.width)}px`;
          canvas.style.height = `${Math.floor(viewport.height)}px`;

          const ctx = canvas.getContext('2d');
          if (!ctx) continue;

          pageWrapper.appendChild(canvas);
          container.appendChild(pageWrapper);

          const transform = dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined;

          await page.render({
            canvasContext: ctx,
            viewport,
            transform: transform as any,
          }).promise;
        }
      } catch (renderErr: any) {
        console.error('[PDF Render Error]', renderErr);
        if (spinner) spinner.remove();
        if (container && !isCleanedUp) {
          container.innerHTML = `
            <div class="my-auto p-6 text-center text-slate-300 max-w-sm bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
              <svg class="w-12 h-12 text-amber-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              <p class="mb-2 text-sm font-semibold text-slate-100">Unable to display this PDF</p>
              <p class="mb-4 text-xs text-slate-400">Please try downloading the document to view it on your device.</p>
              <button id="pdf-modal-error-download" class="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow transition active:scale-95">
                Download PDF File
              </button>
            </div>
          `;
          document.getElementById('pdf-modal-error-download')?.addEventListener('click', triggerDownload);
        }
      }
    })();
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

    renderInAppPdfModal(arrayBuffer, absUrl, title);
  } catch (err: any) {
    console.error('[PDF Open] Failed to load PDF:', err);
    showGlobalToast('Unable to load PDF document. Please check your connection.', 'error');
  }
}