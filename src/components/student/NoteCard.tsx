import { FileText, Download, Eye } from 'lucide-react';
import { cn } from '../../lib/cn';
import { fetchAndOpenFile, fetchAndDownloadFile } from '../../api/student';
import { useState } from 'react';

interface NoteCardProps {
  title: string;
  description?: string;
  fileUrl?: string;
  fileSize?: number;
  downloads?: number;
  pages?: number;
  tags?: string;
}

export function NoteCard({ title, description, fileUrl, fileSize, downloads, pages, tags }: NoteCardProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const fmtSize = fileSize ? fileSize > 1024 * 1024 ? `${(fileSize / (1024 * 1024)).toFixed(1)} MB` : `${(fileSize / 1024).toFixed(0)} KB` : null;

  return (
    <div className="rounded-2xl bg-white border border-slate-100 overflow-hidden shadow-card hover:shadow-hover transition-all duration-300">
      <div className="h-32 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center relative overflow-hidden">
        <FileText className="w-12 h-12 text-slate-400" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200">
          <div className="h-full bg-brand-500 rounded-r-full" style={{ width: '60%' }} />
        </div>
      </div>
      <div className="p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug">{title}</h3>
        {description && <p className="text-xs text-slate-500 line-clamp-2">{description}</p>}
        {tags && <div className="flex gap-1 flex-wrap">{tags.split(',').filter(Boolean).map((t, i) => <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">{t.trim()}</span>)}</div>}
        <div className="flex items-center gap-3 text-[10px] text-slate-400">
          {fmtSize && <span>{fmtSize}</span>}
          {pages && <span>{pages} pages</span>}
          {downloads !== undefined && <span>{downloads} downloads</span>}
        </div>
        {fileUrl && (
          <div className="flex gap-2 pt-1">
            <button disabled={busy === 'open'} onClick={async () => { setBusy('open'); try { await fetchAndOpenFile(fileUrl); } catch {} finally { setBusy(null); }}} className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors">
              <Eye className="w-3.5 h-3.5" />{busy === 'open' ? 'Opening...' : 'Open PDF'}
            </button>
            <button disabled={busy === 'dl'} onClick={async () => { setBusy('dl'); try { await fetchAndDownloadFile(fileUrl, title.replace(/\s+/g, '_') + '.pdf'); } catch {} finally { setBusy(null); }}} className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors">
              <Download className="w-3.5 h-3.5" />{busy === 'dl' ? 'Loading...' : 'Download'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
