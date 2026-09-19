/**
 * Open a PDF document in Kathir Academy using a full-screen mobile PDF document viewer.
 *
 * Features:
 * - Full-screen PDF document view (clean Google Drive style, no custom application toolbar).
 * - Render actual PDF pages with layout, text, tables, and images preserved using PDF.js.
 * - Multi-page vertical smooth scrolling.
 * - Touch pinch-to-zoom gesture support.
 * - Crisp high-DPI canvas rendering.
 * - Clean Android Hardware Back Button navigation handling.
 * - Safe loading state and error handling.
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
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;
}

/** Checks if ArrayBuffer begins with %PDF magic bytes (0x25, 0x50, 0x44, 0x46) */
function isPdfMagicBytes(buffer: ArrayBuffer): boolean {
  if (!buffer || buffer.byteLength < 4) return false;
  const bytes = new Uint8Array(buffer.slice(0, 4));
  return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
}

function isCapacitorNative(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as any).Capacitor;
  return !!(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());
}

/** Renders full-screen in-app PDF viewer modal without custom toolbars */
function renderInAppPdfModal(arrayBuffer: ArrayBuffer, originalUrl: string, documentTitle = 'PDF Document') {
  try {
    const existing = document.getElementById('prepnest-pdf-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'prepnest-pdf-modal';
    modal.className = 'fixed inset-0 z-[9999] bg-slate-950 flex flex-col w-full h-full text-white font-sans select-none animate-fade-in';

    modal.innerHTML = `
      <!-- Full Screen PDF Canvas Scroll Container -->
      <div id="pdf-scroll-container" class="flex-1 w-full h-full bg-slate-950 overflow-auto p-2 sm:p-4 flex flex-col items-center gap-3 relative" style="touch-action: pan-x pan-y;">
        <div id="pdf-loading-spinner" class="my-auto flex flex-col items-center gap-3 text-slate-400">
          <div class="w-9 h-9 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p class="text-xs font-medium">Loading document...</p>
        </div>

        <div id="pdf-pages-wrapper" class="flex flex-col items-center gap-3 transition-transform duration-100 ease-out origin-top w-full"></div>
      </div>
    `;

    document.body.appendChild(modal);

    let pdfDoc: pdfjsLib.PDFDocumentProxy | null = null;
    let isCleanedUp = false;
    let currentZoom = 1.0;
    let backListenerHandle: any = null;

    const cleanup = () => {
      if (isCleanedUp) return;
      isCleanedUp = true;
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);

      if (backListenerHandle && typeof backListenerHandle.remove === 'function') {
        try { backListenerHandle.remove(); } catch { /* ignore */ }
      }

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

    // Android Hardware Back Button Listener (Capacitor Native)
    if (isCapacitorNative()) {
      try {
        const cap = (window as any).Capacitor;
        const AppPlugin = cap?.Plugins?.App;
        if (AppPlugin && typeof AppPlugin.addListener === 'function') {
          AppPlugin.addListener('backButton', () => {
            cleanup();
          }).then((handle: any) => {
            backListenerHandle = handle;
          });
        }
      } catch (err) {
        console.warn('[PDF Modal] Failed to attach native back button listener:', err);
      }
    }

    // History state fallback for web browser
    try {
      window.history.pushState({ pdfModal: true }, '');
      window.addEventListener('popstate', handlePopState);
    } catch {
      /* ignore history error */
    }

    window.addEventListener('keydown', handleKeyDown);

    const triggerDownload = () => downloadPdf(originalUrl, `${documentTitle}.pdf`);

    // Zooming Logic & Display
    const pagesWrapper = document.getElementById('pdf-pages-wrapper');
    const scrollContainer = document.getElementById('pdf-scroll-container');

    const updateZoomDisplay = () => {
      if (pagesWrapper) {
        pagesWrapper.style.transform = `scale(${currentZoom})`;
      }
    };

    // Touch Pinch-to-Zoom Listener
    let initialPinchDist = 0;
    let initialZoomOnPinch = 1.0;

    if (scrollContainer) {
      scrollContainer.addEventListener('touchstart', (e: TouchEvent) => {
        if (e.touches.length === 2) {
          const t1 = e.touches[0];
          const t2 = e.touches[1];
          initialPinchDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
          initialZoomOnPinch = currentZoom;
        }
      }, { passive: true });

      scrollContainer.addEventListener('touchmove', (e: TouchEvent) => {
        if (e.touches.length === 2 && initialPinchDist > 0) {
          const t1 = e.touches[0];
          const t2 = e.touches[1];
          const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
          const factor = dist / initialPinchDist;
          currentZoom = Math.min(3.5, Math.max(0.6, initialZoomOnPinch * factor));
          updateZoomDisplay();
        }
      }, { passive: true });

      scrollContainer.addEventListener('touchend', (e: TouchEvent) => {
        if (e.touches.length < 2) {
          initialPinchDist = 0;
        }
      }, { passive: true });
    }

    // Asynchronously load & render pages using PDF.js
    (async () => {
      const spinner = document.getElementById('pdf-loading-spinner');

      try {
        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuffer),
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
          cMapPacked: true,
        });

        pdfDoc = await loadingTask.promise;
        const numPages = pdfDoc.numPages;

        if (spinner) spinner.remove();
        if (!pagesWrapper) return;

        const dpr = window.devicePixelRatio || 1;
        const containerWidth = scrollContainer?.clientWidth || window.innerWidth;
        const targetContainerWidth = Math.min(containerWidth, 900);

        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          if (isCleanedUp) break;

          const page = await pdfDoc.getPage(pageNum);
          const unscaledViewport = page.getViewport({ scale: 1.0 });

          // Calculate scale to fit container width smoothly
          const fitScale = Math.max(0.6, targetContainerWidth / unscaledViewport.width);
          const viewport = page.getViewport({ scale: fitScale });

          const pageWrapper = document.createElement('div');
          pageWrapper.className = 'relative flex flex-col items-center bg-white shadow-2xl rounded overflow-hidden shrink-0 my-1';

          const canvas = document.createElement('canvas');
          canvas.className = 'block max-w-full h-auto bg-white';
          
          canvas.width = Math.floor(viewport.width * dpr);
          canvas.height = Math.floor(viewport.height * dpr);
          canvas.style.width = `${Math.floor(viewport.width)}px`;
          canvas.style.height = `${Math.floor(viewport.height)}px`;

          const ctx = canvas.getContext('2d');
          if (!ctx) continue;

          pageWrapper.appendChild(canvas);
          pagesWrapper.appendChild(pageWrapper);

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
        if (pagesWrapper && !isCleanedUp) {
          pagesWrapper.innerHTML = `
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
    showGlobalToast('Opening PDF document...', 'info');

    let arrayBuffer: ArrayBuffer;

    // Authenticated backend API URL vs direct Cloudinary/HTTPS URL
    if (absUrl.includes('/api/') || absUrl.startsWith(BACKEND_ORIGIN)) {
      const res = await apiClient.get(absUrl, { responseType: 'arraybuffer' });
      arrayBuffer = res.data;
    } else {
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