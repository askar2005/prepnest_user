import { Link } from 'react-router-dom';
import { ChevronRight, FileText, HelpCircle, Video, Clock, BookOpen } from 'lucide-react';
import { cn } from '../../lib/cn';

const DIFFICULTY_STYLES: Record<string, string> = {
  Beginner: 'bg-green-50 text-green-700 border-green-200',
  Intermediate: 'bg-amber-50 text-amber-700 border-amber-200',
  Advanced: 'bg-red-50 text-red-700 border-red-200',
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTime(minutes?: number | null) {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

interface TopicCardProps {
  id: string;
  categorySlug: string;
  name: string;
  description?: string;
  thumbnail?: string | null;
  difficulty?: string | null;
  estimatedTime?: number | null;
  featured?: boolean;
  updatedAt?: string;
  stats?: { notes?: number; mcqs?: number; videos?: number };
  progress?: number;
}

export function TopicCard({ id, categorySlug, name, description, thumbnail, difficulty, estimatedTime, updatedAt, stats, progress }: TopicCardProps) {
  return (
    <Link to={`/preparation/${categorySlug}/topics/${id}`} className="group block rounded-2xl bg-white border border-slate-100 shadow-card hover:shadow-hover transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      {/* Cover Image */}
      {thumbnail ? (
        <div className="relative h-36 bg-slate-100">
          <img src={thumbnail} alt={name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      ) : (
        <div className="relative h-16 bg-gradient-to-r from-brand-500 to-brand-700 flex items-center px-5">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
        </div>
      )}

      <div className="p-5 space-y-4">
        {/* Title + Difficulty */}
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-semibold text-slate-900 group-hover:text-brand-600 transition-colors leading-snug">{name}</h3>
            {difficulty && (
              <span className={cn('shrink-0 px-2.5 py-0.5 text-[10px] font-semibold rounded-full border', DIFFICULTY_STYLES[difficulty] || 'bg-slate-50 text-slate-600 border-slate-200')}>
                {difficulty}
              </span>
            )}
          </div>
          {description && <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{description}</p>}
        </div>

        {/* Stats */}
        {stats && (
          <div className="flex items-center gap-4 text-xs text-slate-500">
            {stats.notes !== undefined && <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-slate-400" /><span className="font-semibold text-slate-700">{stats.notes}</span> Notes</span>}
            {stats.mcqs !== undefined && <span className="flex items-center gap-1"><HelpCircle className="w-3.5 h-3.5 text-slate-400" /><span className="font-semibold text-slate-700">{stats.mcqs}</span> MCQs</span>}
            {stats.videos !== undefined && <span className="flex items-center gap-1"><Video className="w-3.5 h-3.5 text-slate-400" /><span className="font-semibold text-slate-700">{stats.videos}</span> Videos</span>}
          </div>
        )}

        {/* Progress bar */}
        {progress !== undefined && progress > 0 && (
          <div className="space-y-1">
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, progress)}%` }} />
            </div>
            <p className="text-[10px] text-slate-400 text-right">{progress}% complete</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            {estimatedTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(estimatedTime)}</span>}
            {updatedAt && <span>Updated {formatDate(updatedAt)}</span>}
          </div>
          <span className="flex items-center gap-1 text-sm font-medium text-brand-600 group-hover:text-brand-700 transition-colors">
            Continue <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </span>
        </div>
      </div>
    </Link>
  );
}
