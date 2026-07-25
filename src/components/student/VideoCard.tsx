import { Play, Clock, Eye } from 'lucide-react';
import { cn } from '../../lib/cn';

interface VideoCardProps {
  title: string;
  youtubeUrl: string;
  thumbnail?: string;
  duration?: number;
  views?: number;
}

export function VideoCard({ title, youtubeUrl, thumbnail, duration, views }: VideoCardProps) {
  const ytId = getYtId(youtubeUrl);
  const thumb = thumbnail || (ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null);
  const fmtDuration = duration ? `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}` : null;

  return (
    <a href={youtubeUrl} target="_blank" rel="noreferrer" className="group block rounded-2xl bg-white border border-slate-100 overflow-hidden shadow-card hover:shadow-hover transition-all duration-300 hover:-translate-y-0.5">
      <div className="relative aspect-video bg-slate-100">
        {thumb ? <img src={thumb} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><Play className="w-10 h-10" /></div>}
        {fmtDuration && <span className="absolute bottom-2 right-2 px-2 py-0.5 text-[10px] font-medium bg-black/70 text-white rounded-md">{fmtDuration}</span>}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
            <Play className="w-5 h-5 text-slate-900 ml-0.5" fill="currentColor" />
          </div>
        </div>
      </div>
      <div className="p-3 space-y-1">
        <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug group-hover:text-brand-600 transition-colors">{title}</h3>
        {views !== undefined && <p className="text-xs text-slate-400">{views.toLocaleString()} views</p>}
      </div>
    </a>
  );
}

function getYtId(u: string) { const m = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/); return m ? m[1] : null; }
