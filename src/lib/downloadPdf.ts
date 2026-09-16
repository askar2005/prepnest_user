/**
 * Force-download a PDF document as a blob (Web) or save to Documents folder (Capacitor Android).
 * Safe & Crash-Proof: Validates PDF bytes (%PDF header) and handles authenticated endpoints cleanly.
 * Zero dependency on Google Docs Viewer / docs.google.com.
 */
import { getDownloadUrl, toAbsoluteUrl } from './pdfUrl';
import { BACKEND_ORIGIN, apiClient } from '../api/client';
import { recordDownload } from './downloadHistory';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { showGlobalToast } from '../components/common/ToastHost';

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

export async function downloadPdf(url: string | null | undefined, fileName = 'document.pdf'): Promise<void> {
  if (!url || typeof url !== 'string' || !url.trim()) {
    showGlobalToast('Invalid PDF document link', 'error');
    return;
  }

  // Format valid PDF filename
  let safeName = fileName.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_').trim() || 'document.pdf';
  if (!safeName.toLowerCase().endsWith('.pdf')) {
    safeName += '.pdf';
  }

  // Resolve absolute HTTPS target URL
  const absUrl = toAbsoluteUrl(url, BACKEND_ORIGIN);
  const target = getDownloadUrl(absUrl) ?? absUrl;

  // Record in local download history
  try {
    recordDownload({
      title: safeName.replace(/\.pdf$/i, ''),
      fileUrl: absUrl,
      type: 'PDF',
    });
  } catch {
    /* ignore history logging error */
  }

  try {
    showGlobalToast(`Downloading ${safeName}...`, 'info');

    // Fetch arraybuffer
    let arrayBuffer: ArrayBuffer;
    if (target.includes('/api/') || target.startsWith(BACKEND_ORIGIN)) {
      const res = await apiClient.get(target, { responseType: 'arraybuffer' });
      arrayBuffer = res.data;
    } else {
      const res = await fetch(target);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      arrayBuffer = await res.arrayBuffer();
    }

    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error('Received empty file payload');
    }

    // Validate PDF magic bytes (%PDF)
    if (!isPdfMagicBytes(arrayBuffer)) {
      console.warn('[PDF Download] Response is not a valid PDF file');
      showGlobalToast('Unable to download: File is not a valid PDF document.', 'error');
      return;
    }

    // 1. Capacitor Android Native Storage Flow
    if (isCapacitorNative()) {
      const base64Data = arrayBufferToBase64(arrayBuffer);

      await Filesystem.writeFile({
        path: safeName,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true,
      });

      showGlobalToast(`Downloaded to Documents: ${safeName}`, 'success');
      return;
    }

    // 2. Web Browser Flow (Desktop / Mobile Web)
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = safeName;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 3000);
    showGlobalToast(`Downloaded ${safeName}`, 'success');
  } catch (err: any) {
    console.error('[PDF Download] Download failed:', err);
    showGlobalToast('Download failed. Please check your network connection.', 'error');
  }
}