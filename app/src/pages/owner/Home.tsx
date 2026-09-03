import { Link } from 'react-router-dom';
import { OwnerShell } from './OwnerShell';
import { useOwnerData } from '../../lib/useOwner';
import { formatDate } from '../../../shared/date';

interface Counts {
  next: { date: string; breakfasts: number; lunches: number; skipped: number };
  today: { date: string; breakfasts: number; lunches: number; skipped: number };
}

const TILES = [
  { to: '/owner/cook', label: 'Cook count', hint: 'How much to prepare' },
  { to: '/owner/today', label: "Today's deliveries", hint: 'Route list, call & WhatsApp' },
  { to: '/owner/subscribers', label: 'Subscribers', hint: 'Search, payments, pause' },
  { to: '/owner/add', label: 'Add subscriber', hint: 'Signed up over WhatsApp' },
  { to: '/owner/renewals', label: 'Renewals due', hint: 'Next 7 days' },
];

export function OwnerHome() {
  const { data } = useOwnerData<Counts>('counts');

  return (
    <OwnerShell home title="Kitchen">
      <Link
        to="/owner/cook"
        className="mb-4 block rounded-2xl bg-brand p-5 text-white shadow-sm"
      >
        <div className="text-xs font-semibold uppercase tracking-widest text-white/70">
          Next delivery {data ? `· ${formatDate(data.next.date)}` : ''}
        </div>
        <div className="mt-2 flex items-end gap-6">
          <div>
            <div className="text-5xl font-bold leading-none">{data?.next.breakfasts ?? '—'}</div>
            <div className="mt-1 text-sm text-white/80">breakfasts</div>
          </div>
          <div>
            <div className="text-5xl font-bold leading-none">{data?.next.lunches ?? '—'}</div>
            <div className="mt-1 text-sm text-white/80">lunches</div>
          </div>
        </div>
      </Link>

      <nav className="grid gap-3">
        {TILES.map((tile) => (
          <Link
            key={tile.to}
            to={tile.to}
            className="flex items-center justify-between rounded-2xl border border-cream-deep bg-white px-5 py-4 shadow-sm"
          >
            <span>
              <span className="block text-lg font-bold text-ink">{tile.label}</span>
              <span className="block text-sm text-ink-soft">{tile.hint}</span>
            </span>
            <span className="text-2xl text-brand">›</span>
          </Link>
        ))}
      </nav>
    </OwnerShell>
  );
}
