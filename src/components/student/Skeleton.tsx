import { cn } from '../../lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-slate-200 rounded-xl', className)} />;
}

export function CardSkeleton() {
  return <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
    <Skeleton className="h-40 w-full rounded-none" />
    <div className="p-4 space-y-3"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-3 w-1/2" /></div>
  </div>;
}

export function TopicCardSkeleton() {
  return <div className="rounded-2xl border border-slate-100 bg-white p-4 space-y-3">
    <Skeleton className="h-5 w-2/3" /><Skeleton className="h-4 w-full" />
    <div className="flex gap-3"><Skeleton className="h-3 w-16" /><Skeleton className="h-3 w-16" /><Skeleton className="h-3 w-16" /></div>
  </div>;
}
