import { cn } from '../../lib/cn';

const GRADIENTS: Record<string, string> = {
  gate: 'from-violet-600 via-purple-600 to-indigo-700',
  aptitude: 'from-emerald-500 via-teal-500 to-cyan-600',
  interview: 'from-orange-500 via-amber-500 to-yellow-600',
  technical: 'from-blue-600 via-indigo-500 to-violet-600',
  default: 'from-brand-600 via-purple-600 to-pink-500',
};

interface HeroBannerProps {
  slug?: string;
  title: string;
  description: string;
  children?: React.ReactNode;
  className?: string;
}

export function HeroBanner({ slug, title, description, children, className }: HeroBannerProps) {
  const gradient = GRADIENTS[slug || 'default'] || GRADIENTS.default;
  return (
    <div className={cn('relative overflow-hidden rounded-3xl bg-gradient-to-br p-8 md:p-12 text-white', gradient, className)}>
      <div className="relative z-10 max-w-2xl">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{title}</h1>
        <p className="mt-3 text-base md:text-lg text-white/80 leading-relaxed">{description}</p>
        {children && <div className="mt-6">{children}</div>}
      </div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
      <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute -top-8 -left-8 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
    </div>
  );
}
