import { useState, useEffect } from 'react';
import { fetchUserBookmarks, toggleBookmark } from '../../api/student';
import { useToast } from '../../components/common/ToastHost';
import { Bookmark, FileText, ExternalLink, HelpCircle, ClipboardList, Trash2, Loader2 } from 'lucide-react';

export function BookmarksPage() {
  const { pushToast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserBookmarks().then((d) => setItems(d.items || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const remove = async (b: any) => {
    const resource = b.studyMaterial?.id ? 'studyMaterial' : b.mcqQuestion?.id ? 'mcqQuestion' : b.mockTest?.id ? 'mockTest' : 'topic';
    const resourceId = b.studyMaterial?.id || b.mcqQuestion?.id || b.mockTest?.id || b.topic?.id;
    if (!resourceId) return;
    try {
      await toggleBookmark(resource, resourceId);
      setItems((prev) => prev.filter((x) => x.id !== b.id));
      pushToast('Removed bookmark', 'info');
    } catch { pushToast('Failed to remove', 'error'); }
  };

  const icon = (b: any) => {
    if (b.studyMaterial) return <FileText className="w-5 h-5 text-brand-600" />;
    if (b.mcqQuestion) return <HelpCircle className="w-5 h-5 text-emerald-500" />;
    if (b.mockTest) return <ClipboardList className="w-5 h-5 text-amber-500" />;
    return <Bookmark className="w-5 h-5 text-slate-400" />;
  };

  const title = (b: any) => {
    if (b.studyMaterial) return b.studyMaterial.title;
    if (b.mcqQuestion) return (b.mcqQuestion.question || '').slice(0, 80);
    if (b.mockTest) return b.mockTest.title;
    return 'Saved item';
  };

  const subtitle = (b: any) => {
    if (b.studyMaterial) return b.studyMaterial.type;
    if (b.mcqQuestion) return 'MCQ Question';
    if (b.mockTest) return 'Mock Test';
    return '';
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Bookmarks</h1>
      {loading && <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>}
      {!loading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4"><Bookmark className="w-8 h-8 text-slate-300" /></div>
          <p className="text-lg font-semibold text-slate-700">No bookmarks yet</p>
          <p className="text-sm text-slate-400 mt-1">Save notes, questions, and tests for quick access.</p>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((b) => (
          <div key={b.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card hover:shadow-hover transition-all flex items-start justify-between group">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">{icon(b)}</div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-slate-900 truncate">{title(b)}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{subtitle(b)}</p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {b.studyMaterial?.externalUrl && <a href={b.studyMaterial.externalUrl} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"><ExternalLink className="w-4 h-4" /></a>}
              <button onClick={() => remove(b)} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
