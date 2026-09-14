import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchNotifications, markAllNotificationsAsRead } from '../../api/student';
import { Skeleton } from '../../components/student/Skeleton';
import { cn } from '../../lib/cn';
import { Bell, Search, ChevronRight, Calendar, Pin, Paperclip, ExternalLink, AlertCircle, CheckCheck, Share2, Filter } from 'lucide-react';
import { useToast } from '../../components/common/ToastHost';

const CATEGORY_LABELS: Record<string, string> = {
  PLACEMENT_DRIVES: 'Placement', INTERNSHIPS: 'Internships', HACKATHONS: 'Hackathons',
  WORKSHOP: 'Workshop', EXAM_UPDATES: 'Exams', SCHOLARSHIPS: 'Scholarships',
  COLLEGE_ANNOUNCEMENTS: 'College', COMPANY_HIRING: 'Hiring', GENERAL: 'General',
};

const PRIORITY_STYLES: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-600', MEDIUM: 'bg-blue-50 text-blue-700',
  HIGH: 'bg-amber-50 text-amber-700', URGENT: 'bg-red-50 text-red-700',
};

const CATEGORY_FILTERS = ['', 'PLACEMENT_DRIVES', 'INTERNSHIPS', 'HACKATHONS', 'WORKSHOP', 'EXAM_UPDATES', 'SCHOLARSHIPS', 'COLLEGE_ANNOUNCEMENTS', 'GENERAL'];

export default function NotificationsListPage() {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications', page, category],
    queryFn: () => fetchNotifications({ page, limit: 20, ...(category ? { category } : {}) }),
    staleTime: 15000,
    retry: false,
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: async () => {
      pushToast('All notifications marked as read', 'success');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['notif-unread'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
        queryClient.invalidateQueries({ queryKey: ['recent-notifications'] }),
        refetch(),
      ]);
    },
    onError: (err: any) => pushToast(err?.response?.data?.message || 'Failed to mark notifications as read', 'error'),
  });

  const filtered = search
    ? (data?.items || []).filter(n => n.title?.toLowerCase().includes(search.toLowerCase()) || n.summary?.toLowerCase().includes(search.toLowerCase()))
    : (data?.items || []);

  const pinned = filtered.filter(n => n.isPinned);
  const regular = filtered.filter(n => !n.isPinned);
  const unreadCount = useMemo(() => (data?.items || []).filter((n) => !n.isRead).length, [data]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
        <h1 className="text-2xl font-bold text-slate-900">Important Notifications</h1>
        <p className="text-sm text-slate-500 mt-1">Latest announcements from Kathir Academy.</p>
      </div>
        <button
          onClick={() => markAllMutation.mutate()}
          disabled={unreadCount === 0 || markAllMutation.isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCheck className="w-4 h-4" />
          {markAllMutation.isPending ? 'Updating...' : 'Mark all as read'}
        </button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notifications..." className="w-full h-11 pl-10 pr-4 text-sm bg-white border border-slate-200 rounded-2xl outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100" />
        </div>
        <button onClick={() => setShowFilters((v) => !v)} className="sm:hidden inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 bg-white">
          <Filter className="w-4 h-4" /> Filters
        </button>
        <div className={`${showFilters ? 'flex' : 'hidden'} sm:flex gap-2 overflow-x-auto pb-1`}>
          {CATEGORY_FILTERS.map(c => (
            <button key={c || 'all'} onClick={() => { setCategory(c); setPage(1); }}
              className={cn(
                'whitespace-nowrap px-4 py-1.5 text-sm font-medium rounded-full border transition-colors',
                category === c ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'
              )}
            >{c ? CATEGORY_LABELS[c] || c : 'All'}</button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}</div>
      ) : (data?.items || []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <Bell className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-lg font-semibold text-slate-600">No notifications yet</p>
          <p className="text-sm text-slate-400 mt-1">Check back later for new announcements.</p>
        </div>
      ) : (
        <>
          {/* Pinned */}
          {pinned.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Pin className="w-4 h-4 text-brand-500" />
                <h2 className="text-sm font-semibold text-slate-700">Pinned</h2>
              </div>
              <div className="space-y-3">
                {pinned.map(n => <NotificationCard key={n.id} n={n} />)}
              </div>
            </section>
          )}

          {/* All */}
          <section>
            <h2 className="text-sm font-semibold text-slate-700 mb-4">{pinned.length > 0 ? 'Recent' : 'All Notifications'}</h2>
            <div className="space-y-3">
              {regular.length > 0 ? regular.map(n => <NotificationCard key={n.id} n={n} />) : !pinned.length && (
                <div className="text-center py-12 text-sm text-slate-400">No notifications match your filters.</div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function NotificationCard({ n }: { n: any }) {
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <Link to={`/notifications/${n.id}`} className={cn(
      'group block rounded-2xl border p-5 shadow-card hover:shadow-hover transition-all hover:-translate-y-0.5',
      n.isRead ? 'bg-white border-slate-100' : 'bg-brand-50/40 border-brand-100'
    )}>
      <div className="flex items-start gap-4">
        {/* Thumbnail */}
        {n.thumbnailUrl ? (
          <img src={n.thumbnailUrl} alt="" className="w-14 h-14 rounded-xl object-cover bg-slate-100 shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center shrink-0">
            <Bell className="w-6 h-6 text-brand-500" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {!n.isRead && <span className="h-2.5 w-2.5 rounded-full bg-red-500" />}
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-brand-50 text-brand-700">{CATEGORY_LABELS[n.category] || n.category}</span>
            {n.priority && <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', PRIORITY_STYLES[n.priority])}>{n.priority}</span>}
            {n.attachmentUrl && <Paperclip className="w-3 h-3 text-slate-400" />}
            {n.externalLink && <ExternalLink className="w-3 h-3 text-slate-400" />}
          </div>

          <h3 className={cn('text-sm group-hover:text-brand-600 transition-colors', n.isRead ? 'font-medium text-slate-800' : 'font-semibold text-slate-900')}>{n.title}</h3>
          {n.summary && <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{n.summary}</p>}

          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{n.publishDate ? fmtDate(n.publishDate) : 'Draft'}</span>
            <span className="text-slate-200">·</span>
            <span>{n.views} views</span>
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all shrink-0 mt-2" />
      </div>
    </Link>
  );
}
