/**
 * Open a PDF document in Capacitor Android using Chrome Custom Tabs (@capacitor/browser)
 * or in-app preview modal (Web).
 *
 * Resolves relative URLs to absolute HTTPS URLs and handles authenticated backend proxy URLs.
 */
import { getInlinePreviewUrl, toAbsoluteUrl } from './pdfUrl';
import { BACKEND_ORIGIN, apiClient } from '../api/client';
import { downloadPdf } from './downloadPdf';
import { Browser } from '@capacitor/browser';
import { Filesystem, Directory } from '@capacitor/filesystem';

const PROXY_PREFIX = '/api/files/preview?url=';

function isProxyTarget(target: string): boolean {
  return target.includes(PROXY_PREFIX);
}

function isCapacitorNative(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as any).Capacitor;
  return !!(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function renderInAppModal(previewSrc: string, originalUrl: string, blobObjectUrl?: string) {
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
        <button id="pdf-modal-external-btn" class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition" title="Open in External Browser">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
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

  const cleanup = () => {
    modal.remove();
    if (blobObjectUrl) {
      window.setTimeout(() => URL.revokeObjectURL(blobObjectUrl), 5000);
    }
  };

  document.getElementById('pdf-modal-close-btn')?.addEventListener('click', cleanup);

  document.getElementById('pdf-modal-download-btn')?.addEventListener('click', () => {
    downloadPdf(originalUrl);
  });

  document.getElementById('pdf-modal-external-btn')?.addEventListener('click', async () => {
    const absUrl = toAbsoluteUrl(originalUrl, BACKEND_ORIGIN);
    const extUrl = absUrl.includes('cloudinary.com') || absUrl.endsWith('.pdf')
      ? absUrl
      : `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(absUrl)}`;
    
    if (isCapacitorNative()) {
      await Browser.open({ url: extUrl });
    } else {
      window.open(extUrl, '_blank');
    }
  });
}

export async function openPdf(url: string | null | undefined): Promise<void> {
  if (!url) return;
  const absOriginal = toAbsoluteUrl(url, BACKEND_ORIGIN);
  const target = getInlinePreviewUrl(url, BACKEND_ORIGIN) ?? absOriginal;

  // 1. Capacitor Android Native Flow
  if (isCapacitorNative()) {
    // Authenticated Proxy URL
    if (isProxyTarget(target)) {
      try {
        const response = await apiClient.get(target, { responseType: 'arraybuffer' });
        const base64Data = arrayBufferToBase64(response.data);
        const tempName = `preview_${Date.now()}.pdf`;

        const writeResult = await Filesystem.writeFile({
          path: tempName,
          data: base64Data,
          directory: Directory.Cache,
          recursive: true,
        });

        if (writeResult.uri) {
          await Browser.open({ url: writeResult.uri });
          return;
        }
      } catch {
        // Fallback to Google Docs Viewer if proxy arraybuffer fails
        const googleDocsUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(absOriginal)}`;
        await Browser.open({ url: googleDocsUrl });
        return;
      }
    }

    // Direct Cloudinary or HTTPS URL
    const openUrl = target.includes('cloudinary.com') || target.endsWith('.pdf')
      ? target
      : `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(target)}`;
    
    await Browser.open({ url: openUrl });
    return;
  }

  // 2. Web Browser Flow (Desktop / Mobile Web)
  if (!isProxyTarget(target)) {
    let win: Window | null = null;
    try {
      win = window.open(target, '_blank', 'noopener,noreferrer');
    } catch {
      win = null;
    }
    if (win) win.focus();
    else renderInAppModal(target, absOriginal);
    return;
  }

  // Desktop Authenticated Proxy Flow
  try {
    const response = await apiClient.get(target, { responseType: 'blob' });
    const blob = new Blob([response.data as BlobPart], { type: 'application/pdf' });
    const objectUrl = URL.createObjectURL(blob);

    const win = window.open(objectUrl, '_blank');
    if (!win) {
      renderInAppModal(objectUrl, absOriginal, objectUrl);
    }
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
  } catch {
    renderInAppModal(target, absOriginal);
  }
}