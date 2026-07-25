import { cn } from '../../lib/cn';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ContentSectionProps {
  title: string;
  icon?: React.ReactNode;
  viewAllLink?: string;
  children: React.ReactNode;
  className?: string;
}

export function ContentSection({ title, icon, viewAllLink, children, className }: ContentSectionProps) {
  return (
    <section className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className="text-brand-600">{icon}</span>}
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        </div>
        {viewAllLink && (
          <Link to={viewAllLink} className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors">
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
