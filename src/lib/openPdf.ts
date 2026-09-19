/**
 * Open a PDF document in Kathir Academy using Google Drive PDF Viewer.
 *
 * - On Capacitor Android: Launches Google Drive PDF Viewer (or default Android PDF reader app) via native Android Intent.
 * - On Web Browser: Opens PDF document via Google Drive / Google Docs Web Viewer.
 * - Validates PDF bytes (%PDF header) and handles authenticated API endpoints cleanly.
 */
import { toAbsoluteUrl } from './pdfUrl';
import { BACKEND_ORIGIN, apiClient } from '../api/client';
import { registerPlugin } from '@capacitor/core';
import { showGlobalToast } from '../components/common/ToastHost';

interface MediaDownloaderPluginInterface {
  saveToPublicDownloads(options: {
    base64Data: string;
    fileName: string;
    mimeType?: string;
  }): Promise<{ success: boolean; path: string; fileName: string }>;
  openInDrive(options: {
    base64Data: string;
    fileName: string;
  }): Promise<{ success: boolean }>;
}

const MediaDownloader = registerPlugin<MediaDownloaderPluginInterface>('MediaDownloader');

function isCapacitorNative(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as any).Capacitor;
  return !!(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());
}

function isPdfMagicBytes(buffer: ArrayBuffer): boolean {
  if (!buffer || buffer.byteLength < 4) return false;
  const bytes = new Uint8Array(buffer.slice(0, 4));
  return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
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

export async function openPdf(url: string | null | undefined, title = 'PDF Document'): Promise<void> {
  if (!url || typeof url !== 'string' || !url.trim()) {
    showGlobalToast('PDF document URL is missing.', 'error');
    return;
  }

  const absUrl = toAbsoluteUrl(url, BACKEND_ORIGIN);

  // Clean filename
  let safeName = title.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_').trim() || 'document.pdf';
  if (!safeName.toLowerCase().endsWith('.pdf')) {
    safeName += '.pdf';
  }

  try {
    showGlobalToast('Opening PDF in Drive...', 'info');

    let arrayBuffer: ArrayBuffer;

    // Fetch arraybuffer from target URL
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

    // 1. Android Capacitor Native Flow: Open in Google Drive PDF Viewer App
    if (isCapacitorNative()) {
      const base64Data = arrayBufferToBase64(arrayBuffer);

      try {
        await MediaDownloader.openInDrive({
          base64Data,
          fileName: safeName,
        });
        return;
      } catch (nativeErr: any) {
        console.warn('[PDF Drive Open Failed, falling back to Web Viewer]', nativeErr);
      }
    }

    // 2. Web Browser / Fallback Flow: Open via Google Drive Web Viewer
    const gdriveViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(absUrl)}&embedded=true`;
    window.open(gdriveViewerUrl, '_blank', 'noopener,noreferrer');
  } catch (err: any) {
    console.error('[PDF Open] Failed to load PDF:', err);
    showGlobalToast('Unable to open PDF in Drive. Please check your network connection.', 'error');
  }
}