/**
 * Force-download a PDF document as a blob (Web) or save to Documents folder (Capacitor Android).
 * Supports authenticated backend URLs, Cloudinary URLs, and relative URLs.
 */
import { getDownloadUrl, toAbsoluteUrl } from './pdfUrl';
import { BACKEND_ORIGIN, apiClient } from '../api/client';
import { recordDownload } from './downloadHistory';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Browser } from '@capacitor/browser';

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

export async function downloadPdf(url: string, fileName = 'document.pdf'): Promise<void> {
  if (!url) throw new Error('Invalid file URL');

  // Format valid PDF filename
  let safeName = fileName.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_').trim() || 'document.pdf';
  if (!safeName.toLowerCase().endsWith('.pdf')) {
    safeName += '.pdf';
  }

  // Resolve absolute HTTPS target URL
  const absUrl = toAbsoluteUrl(url, BACKEND_ORIGIN);
  const target = getDownloadUrl(absUrl) ?? absUrl;

  // Record in local download history
  recordDownload({
    title: safeName.replace(/\.pdf$/i, ''),
    fileUrl: absUrl,
    type: 'PDF',
  });

  // 1. Capacitor Android Native Flow
  if (isCapacitorNative()) {
    try {
      // Fetch arraybuffer (handles auth headers if pointing to backend API)
      let arrayBuffer: ArrayBuffer;
      if (target.startsWith(BACKEND_ORIGIN) || target.startsWith('/')) {
        const res = await apiClient.get(target, { responseType: 'arraybuffer' });
        arrayBuffer = res.data;
      } else {
        const res = await fetch(target);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        arrayBuffer = await res.arrayBuffer();
      }

      const base64Data = arrayBufferToBase64(arrayBuffer);

      // Write to Android Documents directory without requiring legacy broad permissions
      const writeResult = await Filesystem.writeFile({
        path: safeName,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true,
      });

      // Try opening the saved file URI or Chrome Custom Tab
      try {
        if (writeResult.uri) {
          await Browser.open({ url: writeResult.uri });
        }
      } catch {
        // If URI opening fails, fallback to Google Docs Viewer / Direct HTTPS
        const openUrl = absUrl.includes('cloudinary.com') || absUrl.endsWith('.pdf')
          ? absUrl
          : `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(absUrl)}`;
        await Browser.open({ url: openUrl });
      }

      return;
    } catch (err: any) {
      // Fallback for Android if filesystem write fails: open external browser
      const openUrl = absUrl.includes('cloudinary.com') || absUrl.endsWith('.pdf')
        ? absUrl
        : `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(absUrl)}`;
      await Browser.open({ url: openUrl });
      return;
    }
  }

  // 2. Web Browser Flow (Desktop / Mobile Web)
  let blob: Blob;
  if (target.startsWith(BACKEND_ORIGIN) || target.startsWith('/')) {
    const res = await apiClient.get(target, { responseType: 'blob' });
    blob = new Blob([res.data], { type: 'application/pdf' });
  } else {
    const response = await fetch(target, { credentials: 'omit' });
    if (!response.ok) throw new Error(`Failed to fetch file (${response.status})`);
    blob = await response.blob();
  }

  const objectUrl = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = safeName;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
}