import { OwnerShell, ErrorBox } from './OwnerShell';
import { Button, Loading } from '../../components/ui';
import { useOwnerData } from '../../lib/useOwner';
import { addDays, dayName, formatDate, istToday } from '../../../shared/date';

interface Count {
  date: string;
  breakfasts: number;
  lunches: number;
  skipped: number;
}

interface Counts {
  next: Count;
  today: Count;
}

/** The 5 AM screen. Nothing on it needs reading glasses. */
export function OwnerCook() {
  const { data, error, loading, reload } = useOwnerData<Counts>('counts');

  if (loading && !data) return <OwnerShell title="Cook count"><Loading label="Loading…" /></OwnerShell>;
  if (error && !data) return <OwnerShell title="Cook count"><ErrorBox error={error} onRetry={reload} /></OwnerShell>;
  if (!data) return null;

  const today = istToday();
  const nextLabel =
    data.next.date === addDays(today, 1) ? 'Tomorrow' : dayName(data.next.date);

  return (
    <OwnerShell title="Cook count">
      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <div className="text-sm font-bold uppercase tracking-widest text-gold">
          {nextLabel} · {formatDate(data.next.date)}
        </div>

        <div className="mt-4 grid gap-4">
          <BigNumber label="Breakfasts" value={data.next.breakfasts} />
          <BigNumber label="Lunches" value={data.next.lunches} muted />
        </div>

        {data.next.skipped > 0 && (
          <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-base font-semibold text-amber-900">
            {data.next.skipped} subscriber{data.next.skipped === 1 ? '' : 's'} skipped this day
          </p>
        )}
      </section>

      <section className="mt-4 rounded-2xl border border-cream-deep bg-white p-4">
        <div className="text-xs font-bold uppercase tracking-widest text-ink-soft">
          Today · {formatDate(data.today.date)}
        </div>
        <div className="mt-2 flex items-end gap-8">
          <div>
            <div className="text-4xl font-bold leading-none text-ink">{data.today.breakfasts}</div>
            <div className="text-sm text-ink-soft">breakfasts</div>
          </div>
          <div>
            <div className="text-4xl font-bold leading-none text-ink">{data.today.lunches}</div>
            <div className="text-sm text-ink-soft">lunches</div>
          </div>
        </div>
      </section>

      <Button tone="plain" full className="mt-4" onClick={reload} disabled={loading}>
        {loading ? 'Refreshing…' : 'Refresh'}
      </Button>
    </OwnerShell>
  );
}

function BigNumber({ label, value, muted }: { label: string; value: number; muted?: boolean }) {
  return (
    <div className={`rounded-2xl px-5 py-4 ${muted ? 'bg-cream' : 'bg-brand text-white'}`}>
      <div
        className={`text-xs font-bold uppercase tracking-widest ${muted ? 'text-ink-soft' : 'text-white/70'}`}
      >
        {label}
      </div>
      <div className="text-7xl font-bold leading-none tabular-nums">{value}</div>
    </div>
  );
}
