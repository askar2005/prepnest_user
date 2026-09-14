export interface DownloadedItem {
  id: string;
  title: string;
  fileUrl: string;
  type?: string;
  fileSize?: number;
  downloadedAt: string;
}

const STORAGE_KEY = 'prepnest_downloads_history';

export function getDownloadedItems(): DownloadedItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordDownload(item: { id?: string; title: string; fileUrl: string; type?: string; fileSize?: number }) {
  try {
    const current = getDownloadedItems();
    const id = item.id || `dl_${Date.now()}`;
    const newItem: DownloadedItem = {
      id,
      title: item.title,
      fileUrl: item.fileUrl,
      type: item.type || 'PDF',
      fileSize: item.fileSize,
      downloadedAt: new Date().toISOString(),
    };
    const filtered = current.filter((x) => x.fileUrl !== item.fileUrl && x.id !== id);
    const updated = [newItem, ...filtered];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function removeDownloadedItem(id: string) {
  try {
    const current = getDownloadedItems();
    const updated = current.filter((x) => x.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function clearAllDownloads() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
