import { cn } from '../../lib/cn';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'gate', label: 'GATE' },
  { key: 'aptitude', label: 'Aptitude' },
  { key: 'interview', label: 'Interview' },
  { key: 'technical', label: 'Technical' },
  { key: 'mock-tests', label: 'Mock Tests' },
  { key: 'daily', label: 'Daily Challenge' },
  { key: 'recent', label: 'Recently Added' },
  { key: 'popular', label: 'Popular' },
  { key: 'free', label: 'Free Resources' },
];

export function FilterChips({ active, onChange }: { active: string; onChange: (key: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
      {FILTERS.map((f) => (
        <button key={f.key} onClick={() => onChange(f.key)}
          className={cn(
            'whitespace-nowrap px-4 py-1.5 text-sm font-medium rounded-full border transition-colors',
            active === f.key
              ? 'bg-brand-600 text-white border-brand-600'
              : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300 hover:text-brand-600'
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
