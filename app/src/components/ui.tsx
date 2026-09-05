import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Tone = 'primary' | 'gold' | 'whatsapp' | 'plain' | 'danger';

const TONES: Record<Tone, string> = {
  primary: 'bg-brand text-white active:bg-brand-dark',
  gold: 'bg-gold text-ink active:brightness-95',
  whatsapp: 'bg-whatsapp text-white active:brightness-95',
  plain: 'bg-white text-ink border border-cream-deep active:bg-cream',
  danger: 'bg-white text-red-700 border border-red-300 active:bg-red-50',
};

export function Button({
  tone = 'primary',
  full,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone; full?: boolean }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-base font-semibold shadow-sm transition disabled:opacity-50 ${TONES[tone]} ${full ? 'w-full' : ''} ${className}`}
    />
  );
}

export function LinkButton({
  tone = 'primary',
  full,
  className = '',
  children,
  href,
}: {
  tone?: Tone;
  full?: boolean;
  className?: string;
  children: ReactNode;
  href: string;
}) {
  return (
    <a
      href={href}
      role="button"
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-base font-semibold shadow-sm ${TONES[tone]} ${full ? 'w-full' : ''} ${className}`}
    >
      {children}
    </a>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-cream-deep bg-white p-4 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-ink">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-semibold text-red-700">{error}</span>}
    </label>
  );
}

export const inputClass =
  'w-full rounded-xl border border-cream-deep bg-white px-3 py-3 text-base text-ink outline-none focus:border-brand focus:ring-2 focus:ring-gold-soft';

export function Notice({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'error' | 'success' | 'warn';
  children: ReactNode;
}) {
  const styles = {
    info: 'bg-cream-deep text-ink',
    error: 'bg-red-50 text-red-800 border border-red-200',
    success: 'bg-emerald-50 text-emerald-900 border border-emerald-200',
    warn: 'bg-amber-50 text-amber-900 border border-amber-200',
  }[tone];
  return <div className={`rounded-xl px-4 py-3 text-sm font-medium ${styles}`}>{children}</div>;
}

export function Loading({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-ink-soft">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-cream-deep border-t-brand" />
      {label}
    </div>
  );
}

export function Stat({ label, value, big }: { label: string; value: ReactNode; big?: boolean }) {
  return (
    <div className="rounded-2xl bg-cream px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</div>
      <div className={`${big ? 'text-4xl' : 'text-2xl'} font-bold leading-tight text-brand`}>
        {value}
      </div>
    </div>
  );
}
