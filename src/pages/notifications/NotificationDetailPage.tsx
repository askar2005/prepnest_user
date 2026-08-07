import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchNotificationDetail, fetchNotifications } from '../../api/student';
import { openPdf } from '../../lib/openPdf';
import { Skeleton } from '../../components/student/Skeleton';
import { cn } from '../../lib/cn';
import { ArrowLeft, Calendar, Clock, Paperclip, ExternalLink, Share2, Bookmark, Bell, ChevronRight, Megaphone } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  PLACEMENT_DRIVES: 'Placement', INTERNSHIPS: 'Internships', HACKATHONS: 'Hackathons',
  WORKSHOP: 'Workshop', EXAM_UPDATES: 'Exams', SCHOLARSHIPS: 'Scholarships',
  COLLEGE_ANNOUNCEMENTS: 'College', COMPANY_HIRING: 'Hiring', GENERAL: 'General',
};

const PRIORITY_STYLES: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-600', MEDIUM: 'bg-blue-50 text-blue-700',
  HIGH: 'bg-amber-50 text-amber-700', URGENT: 'bg-red-50 text-red-700',
};

export default function NotificationDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: notification, isLoading } = useQuery({
    queryKey: ['notification', id],
    queryFn: () => fetchNotificationDetail(id!),
    staleTime: 30000,
  });

  const { data: related } = useQuery({
    queryKey: ['notifications-related'],
    queryFn: () => fetchNotifications({ limit: 4 }),
    staleTime: 60000,
    enabled: !!notification,
  });

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-64 w-full rounded-3xl" /><Skeleton className="h-32 w-3/4" /><Skeleton className="h-48 w-full" /></div>;
  }

  if (!notification) {
    return <div className="flex flex-col items-center justify-center py-20 text-center">
      <Bell className="w-12 h-12 text-slate-300 mb-4" />
      <p className="text-lg font-semibold text-slate-600">Notification not found</p>
      <Link to="/notifications" className="text-sm text-brand-600 mt-2 hover:underline">View all notifications</Link>
    </div>;
  }

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const relatedItems = (related?.items || []).filter((n: any) => n.id !== id).slice(0, 3);
  const previewUrl = (url: string) => url.startsWith('http') ? url : url;

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Back */}
      <Link to="/notifications" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Notifications
      </Link>

      {/* Banner */}
      {notification.bannerUrl ? (
        <div className="rounded-3xl overflow-hidden h-64 bg-slate-100">
          <img src={previewUrl(notification.bannerUrl)} alt="" className="w-full h-full object-cover" />
        </div>
      ) : notification.thumbnailUrl ? (
        <div className="rounded-3xl overflow-hidden h-48 bg-slate-100">
          <img src={previewUrl(notification.thumbnailUrl)} alt="" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 h-40 flex items-center px-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Megaphone className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{notification.title}</h1>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="space-y-6">
        {/* Title + Meta (if not in banner) */}
        {notification.bannerUrl && <h1 className="text-2xl font-bold text-slate-900">{notification.title}</h1>}

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs px-3 py-1 rounded-full font-medium bg-brand-50 text-brand-700">{CATEGORY_LABELS[notification.category] || notification.category}</span>
          {notification.priority && <span className={cn('text-xs px-3 py-1 rounded-full font-medium', PRIORITY_STYLES[notification.priority])}>{notification.priority}</span>}
          {notification.publishDate && (
            <span className="flex items-center gap-1.5 text-xs text-slate-500"><Calendar className="w-3.5 h-3.5" />{fmtDate(notification.publishDate)}</span>
          )}
        </div>

        {/* Summary */}
        {notification.summary && (
          <p className="text-sm text-slate-500 italic border-l-2 border-brand-200 pl-4">{notification.summary}</p>
        )}

        {/* Description (Rich Text) */}
        {notification.description && (
          <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: notification.description }} />
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-2">
          {notification.attachmentUrl && (
            <>
              <button onClick={() => openPdf(notification.attachmentUrl)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                <Paperclip className="w-4 h-4" /> View Attachment
              </button>
            </>
          )}
          {notification.externalLink && (
            <a href={notification.externalLink} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-sm font-medium text-white hover:bg-brand-700 transition-colors">
              <ExternalLink className="w-4 h-4" /> Visit Link
            </a>
          )}
        </div>
      </div>

      {/* Related */}
      {relatedItems.length > 0 && (
        <section className="pt-6 border-t border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Related Notifications</h2>
          <div className="space-y-3">
            {relatedItems.map((n: any) => (
              <Link key={n.id} to={`/notifications/${n.id}`} className="group flex items-start gap-3 rounded-2xl bg-white border border-slate-100 p-4 shadow-card hover:shadow-hover transition-all">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5 text-brand-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">{n.title}</p>
                  {n.summary && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{n.summary}</p>}
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                    <span>{CATEGORY_LABELS[n.category] || n.category}</span>
                    {n.publishDate && <><span>·</span><span>{new Date(n.publishDate).toLocaleDateString()}</span></>}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
