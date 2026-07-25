import type { TextareaHTMLAttributes } from 'react';

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500 ${props.className ?? ''}`.trim()} />;
}