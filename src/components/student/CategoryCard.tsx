import { Link } from 'react-router-dom';
import { resolveImageUrl } from '../../api/client';

interface CategoryCardProps {
  slug: string;
  name: string;
  coverImage?: string | null;
  stats?: { notes?: number; mcqs?: number; videos?: number; mockTests?: number };
  progress?: number;
}

const DEFAULT_PLACEHOLDER = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"><rect fill="#e2e8f0" width="400" height="200"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="14">No Cover Image</text></svg>'
);

export function CategoryCard({ slug, name, coverImage, stats, progress }: CategoryCardProps) {
  const imgSrc = coverImage ? (resolveImageUrl(coverImage) || DEFAULT_PLACEHOLDER) : DEFAULT_PLACEHOLDER;
  const statItems = [
    { label: 'Notes', value: stats?.notes || 0 },
    { label: 'MCQs', value: stats?.mcqs || 0 },
    { label: 'Videos', value: stats?.videos || 0 },
    { label: 'Tests', value: stats?.mockTests || 0 },
  ];

  return (
    <Link to={`/preparation/${slug}`} className="group block rounded-3xl bg-white border border-slate-100 overflow-hidden shadow-card hover:shadow-hover transition-all duration-300 hover:-translate-y-1">
      <div className="relative h-40 overflow-hidden bg-slate-100">
        <img src={imgSrc} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <h3 className="absolute bottom-3 left-4 text-xl font-bold text-white">{name}</h3>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-4 gap-2">
          {statItems.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-xs font-bold text-slate-900">{s.value > 999 ? `${(s.value / 1000).toFixed(1)}k` : s.value}</p>
              <p className="text-[10px] text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
        {progress !== undefined && (
          <div className="space-y-1">
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, progress)}%` }} />
            </div>
            <p className="text-[10px] text-slate-400 text-right">{progress}% complete</p>
          </div>
        )}
      </div>
    </Link>
  );
}
