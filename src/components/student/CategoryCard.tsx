import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight, FileText, HelpCircle, BarChart3, Brain, Laptop, Database, Terminal, Code, Globe, Calculator, Microscope, Cloud, Cpu, Server, Network, Shield, Lock, Key, Award, Star, Heart, Zap } from 'lucide-react';
import { cn } from '../../lib/cn';

const DEFAULT_GRADIENT = 'from-brand-500 to-brand-700';
const ICON_MAP: Record<string, any> = { Brain, Laptop: Laptop, Book: BookOpen, Database, Terminal, Code, Globe, Calculator, Microscope, Cloud, Cpu, Server, Network, Shield, Lock, Key, Award, Star, Heart, Zap };

interface CategoryCardProps {
  slug: string;
  name: string;
  description: string;
  coverImage?: string | null;
  gradientColor?: string | null;
  icon?: string | null;
  stats?: { notes?: number; mcqs?: number; videos?: number; mockTests?: number };
  difficulty?: string;
  progress?: number;
}

export function CategoryCard({ slug, name, description, coverImage, gradientColor, icon, stats, difficulty, progress }: CategoryCardProps) {
  const gradient = gradientColor || DEFAULT_GRADIENT;
  const IconComponent = icon ? ICON_MAP[icon] : null;
  const statItems = [
    { label: 'Notes', value: stats?.notes || 0, icon: FileText },
    { label: 'MCQs', value: stats?.mcqs || 0, icon: HelpCircle },
    { label: 'Videos', value: stats?.videos || 0, icon: BookOpen },
    { label: 'Tests', value: stats?.mockTests || 0, icon: BarChart3 },
  ];

  return (
    <Link to={`/preparation/${slug}`} className="group block rounded-3xl bg-white border border-slate-100 overflow-hidden shadow-card hover:shadow-hover transition-all duration-300 hover:-translate-y-1">
      {/* Cover */}
      <div
        className={cn('relative h-40 p-5 flex flex-col justify-end', !coverImage && `bg-gradient-to-br ${gradient}`)}
        style={coverImage ? { backgroundImage: `url(${coverImage.startsWith('http') ? coverImage : coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
      >
        {coverImage && <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />}
        <div className="relative z-10 flex items-center gap-2">
          {IconComponent && <IconComponent className="w-6 h-6 text-white" />}
          <h3 className="text-xl font-bold text-white">{name}</h3>
        </div>
        {difficulty && (
          <span className="relative z-10 inline-block mt-1.5 px-2.5 py-0.5 text-[10px] font-semibold bg-white/20 text-white rounded-full backdrop-blur-sm w-fit">
            {difficulty}
          </span>
        )}
        {!coverImage && <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />}
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{description}</p>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {statItems.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-xs font-bold text-slate-900">{s.value > 999 ? `${(s.value / 1000).toFixed(1)}k` : s.value}</p>
              <p className="text-[10px] text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {progress !== undefined && (
          <div className="space-y-1">
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, progress)}%` }} />
            </div>
            <p className="text-[10px] text-slate-400 text-right">{progress}% complete</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="text-sm font-medium text-brand-600 group-hover:text-brand-700 transition-colors">Continue</span>
          <ChevronRight className="w-4 h-4 text-brand-600 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}
