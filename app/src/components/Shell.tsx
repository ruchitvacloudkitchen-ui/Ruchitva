import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../lib/i18n';

/** Customer shell: brand, the EN/తె toggle, and one optional back link. */
export function Shell({
  children,
  back,
  title,
}: {
  children: ReactNode;
  back?: boolean;
  title?: string;
}) {
  const { lang, setLang, t } = useLang();

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b border-cream-deep bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold text-brand">{t('brand')}</span>
            <span className="text-xs text-ink-soft">{t('tagline')}</span>
          </Link>
          <div
            className="flex shrink-0 overflow-hidden rounded-full border border-brand/30"
            role="group"
            aria-label="Language"
          >
            {(['te', 'en'] as const).map((code) => (
              <button
                key={code}
                onClick={() => setLang(code)}
                aria-pressed={lang === code}
                className={`min-h-0 px-3 py-1.5 text-sm font-bold ${
                  lang === code ? 'bg-brand text-white' : 'bg-transparent text-brand'
                }`}
              >
                {code === 'te' ? 'తె' : 'EN'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pb-16 pt-4">
        {back && (
          <Link to="/" className="mb-3 inline-block text-sm font-semibold text-brand">
            ← {t('back')}
          </Link>
        )}
        {title && <h1 className="mb-4 text-2xl font-bold text-ink">{title}</h1>}
        {children}
      </main>
    </div>
  );
}
