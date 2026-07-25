import type { SelectHTMLAttributes } from 'react';

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`h-11 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none focus:border-brand-500 ${props.className ?? ''}`.trim()} />;
}