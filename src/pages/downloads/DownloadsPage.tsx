import { useState, useEffect } from 'react';
import { getDownloadedItems, removeDownloadedItem, clearAllDownloads, DownloadedItem } from '../../lib/downloadHistory';
import { downloadPdf } from '../../lib/downloadPdf';
import { openPdf } from '../../lib/openPdf';
import { useToast } from '../../components/common/ToastHost';
import { Download, FileText, Eye, Trash2, Search, Calendar, HardDrive, RefreshCw } from 'lucide-react';

export function DownloadsPage() {
  const { pushToast } = useToast();
  const [items, setItems] = useState<DownloadedItem[]>([]);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    setItems(getDownloadedItems());
  }, []);

  const handleRemove = (id: string) => {
    const updated = removeDownloadedItem(id);
    setItems(updated);
    pushToast('Removed from downloads history', 'info');
  };

  const handleClearAll = () => {
    clearAllDownloads();
    setItems([]);
    pushToast('Cleared all downloads history', 'info');
  };

  const handleRedownload = async (item: DownloadedItem) => {
    setBusyId(item.id);
    try {
      await downloadPdf(item.fileUrl, item.title.replace(/\s+/g, '_') + '.pdf');
      pushToast('Download started', 'success');
    } catch {
      pushToast('Download failed. Please check your network connection.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const filtered = items.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  const formatSize = (bytes?: number) => {
    if (!bytes) return null;
    return bytes > 1024 * 1024
      ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
      : `${(bytes / 1024).toFixed(0)} KB`;
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Download className="w-6 h-6 text-brand-600" /> Downloads
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Access your previously downloaded study materials, notes, and PYQs.
          </p>
        </div>

        {items.length > 0 && (
          <button
            onClick={handleClearAll}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear History
          </button>
        )}
      </div>

      {/* Search Filter */}
      {items.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search downloaded files..."
            className="w-full h-11 pl-10 pr-4 text-sm bg-white border border-slate-200 rounded-2xl outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100 transition-all"
          />
        </div>
      )}

      {/* Empty State */}
      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-3xl bg-white border border-slate-100 shadow-card">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
            <Download className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">No Downloads Yet</h3>
          <p className="text-sm text-slate-400 max-w-sm mt-1">
            When you download study notes or previous year question papers, they will appear here for quick access.
          </p>
        </div>
      )}

      {/* Grid of Downloaded Items */}
      {items.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const sizeStr = formatSize(item.fileSize);
            const dateStr = formatDate(item.downloadedAt);

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card hover:shadow-hover transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-slate-900 truncate leading-snug" title={item.title}>
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                        {dateStr && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {dateStr}
                          </span>
                        )}
                        {sizeStr && (
                          <span className="flex items-center gap-1">
                            <HardDrive className="w-3 h-3" /> {sizeStr}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => openPdf(item.fileUrl)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> Open
                    </button>
                    <button
                      disabled={busyId === item.id}
                      onClick={() => handleRedownload(item)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${busyId === item.id ? 'animate-spin' : ''}`} />
                      {busyId === item.id ? 'Downloading...' : 'Re-download'}
                    </button>
                  </div>

                  <button
                    onClick={() => handleRemove(item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Remove from history"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
