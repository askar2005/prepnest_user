import { useState, useEffect } from 'react';
import { ShieldCheck, FileText } from 'lucide-react';
import { apiClient } from '../../api/client';

interface PolicyData {
  title: string;
  effectiveDate: string;
  lastUpdated: string;
  content: string;
}

export function PrivacyPolicyTab() {
  const [policy, setPolicy] = useState<PolicyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    apiClient
      .get('/privacy-policy')
      .then(({ data }) => {
        if (isMounted && data?.data) {
          setPolicy({
            title: data.data.title || 'Privacy Policy for Kathir Academy (PrepNest)',
            effectiveDate: data.data.effectiveDate || 'September 14, 2026',
            lastUpdated: data.data.lastUpdated || 'September 14, 2026',
            content: data.data.content || '',
          });
        }
      })
      .catch(() => {
        // Fallback default
        if (isMounted) {
          setPolicy({
            title: 'Privacy Policy for Kathir Academy (PrepNest)',
            effectiveDate: 'September 14, 2026',
            lastUpdated: 'September 14, 2026',
            content: 'We are committed to protecting the privacy and personal data of our users.',
          });
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-card space-y-6 max-w-3xl animate-pulse">
        <div className="h-6 bg-slate-100 rounded w-1/3"></div>
        <div className="h-8 bg-slate-100 rounded w-2/3"></div>
        <div className="h-24 bg-slate-100 rounded-2xl w-full"></div>
        <div className="space-y-3">
          <div className="h-4 bg-slate-100 rounded w-full"></div>
          <div className="h-4 bg-slate-100 rounded w-5/6"></div>
          <div className="h-4 bg-slate-100 rounded w-4/6"></div>
        </div>
      </div>
    );
  }

  const title = policy?.title || 'Privacy Policy for Kathir Academy (PrepNest)';
  const effectiveDate = policy?.effectiveDate || 'September 14, 2026';
  const lastUpdated = policy?.lastUpdated || 'September 14, 2026';
  const rawContent = policy?.content || '';

  return (
    <div className="w-full rounded-2xl sm:rounded-3xl border border-slate-100 bg-white p-4 sm:p-6 md:p-8 shadow-card space-y-6 sm:space-y-8 text-slate-700 max-w-4xl leading-relaxed">
      {/* Header Badge */}
      <div className="border-b border-slate-100 pb-4 sm:pb-6 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0" /> Data Protection & Transparency
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">{title}</h2>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 pt-1">
          <span>Effective Date: {effectiveDate}</span>
          <span>•</span>
          <span className="text-brand-600 font-medium">Last Updated: {lastUpdated}</span>
        </div>
      </div>

      {/* Render Dynamic Content */}
      <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed space-y-5 sm:space-y-6">
        {rawContent.split('\n\n').map((paragraph, index) => {
          const trimmed = paragraph.trim();

          // Section Title (### Header)
          if (trimmed.startsWith('### ')) {
            return (
              <h3 key={index} className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2 pt-2 border-t border-slate-100">
                <FileText className="w-4 h-4 text-brand-600 shrink-0" />
                {trimmed.replace(/^###\s+/, '')}
              </h3>
            );
          }

          // Subsection Title (#### Header)
          if (trimmed.startsWith('#### ')) {
            return (
              <h4 key={index} className="font-semibold text-slate-900 text-xs sm:text-sm pt-1">
                {trimmed.replace(/^####\s+/, '')}
              </h4>
            );
          }

          // Horizontal divider
          if (trimmed === '---') {
            return <hr key={index} className="border-slate-100 my-3 sm:my-4" />;
          }

          // Bullet List
          if (trimmed.includes('\n- ') || trimmed.startsWith('- ')) {
            const items = trimmed.split('\n').filter((l) => l.trim().startsWith('- '));
            return (
              <ul key={index} className="list-disc list-inside space-y-1.5 pl-1 sm:pl-2 text-xs sm:text-sm text-slate-600">
                {items.map((item, itemIdx) => {
                  const cleanText = item.replace(/^-\s+/, '');
                  // Simple bold parser for **bold** text
                  const parts = cleanText.split(/(\*\*.*?\*\*)/g);
                  return (
                    <li key={itemIdx}>
                      {parts.map((part, pIdx) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                          return <strong key={pIdx} className="text-slate-900 font-semibold">{part.slice(2, -2)}</strong>;
                        }
                        return part;
                      })}
                    </li>
                  );
                })}
              </ul>
            );
          }

          // Regular Paragraph with inline bolding (**text**)
          const parts = trimmed.split(/(\*\*.*?\*\*)/g);
          return (
            <p key={index} className="text-slate-600 text-xs sm:text-sm whitespace-pre-line leading-relaxed">
              {parts.map((part, pIdx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return <strong key={pIdx} className="text-slate-900 font-semibold">{part.slice(2, -2)}</strong>;
                }
                return part;
              })}
            </p>
          );
        })}
      </div>
    </div>
  );
}
