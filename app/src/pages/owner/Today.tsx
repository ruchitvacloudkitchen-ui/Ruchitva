import { useState } from 'react';
import { OwnerShell, ErrorBox } from './OwnerShell';
import { Loading, Notice } from '../../components/ui';
import { useOwnerData } from '../../lib/useOwner';
import { callOwner } from '../../lib/api';
import { waLink, waNumber } from '../../lib/config';
import { formatDate } from '../../../shared/date';
import type { PlanId } from '../../../shared/plans';

interface Row {
  id: string;
  name: string;
  phone: string;
  address: string;
  landmark: string | null;
  building: string | null;
  plan: PlanId;
  hasLunch: boolean;
  delivered: boolean;
}

interface Today {
  date: string;
  rows: Row[];
  counts: { breakfasts: number; lunches: number; skipped: number };
}

const ON_THE_WAY =
  'రుచిత్వ · Your Ruchitva breakfast is on the way. / మీ రుచిత్వ టిఫిన్ బయలుదేరింది.';

export function OwnerToday() {
  const { data, error, loading, reload, setData } = useOwnerData<Today>('today');
  const [failed, setFailed] = useState('');

  async function toggle(row: Row) {
    if (!data) return;
    const next = !row.delivered;
    setFailed('');
    setData({
      ...data,
      rows: data.rows.map((r) => (r.id === row.id ? { ...r, delivered: next } : r)),
    });
    try {
      await callOwner('mark_delivered', { id: row.id, date: data.date, delivered: next });
    } catch {
      setFailed('Could not save that tick. Check your connection and try again.');
      setData({
        ...data,
        rows: data.rows.map((r) => (r.id === row.id ? { ...r, delivered: row.delivered } : r)),
      });
    }
  }

  if (loading && !data) return <OwnerShell title="Today"><Loading label="Loading…" /></OwnerShell>;
  if (error && !data) return <OwnerShell title="Today"><ErrorBox error={error} onRetry={reload} /></OwnerShell>;
  if (!data) return null;

  const done = data.rows.filter((r) => r.delivered).length;

  return (
    <OwnerShell title={`Today · ${formatDate(data.date)}`}>
      <div className="mb-3 flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
        <div className="text-lg font-bold text-ink">
          {done} of {data.rows.length} delivered
        </div>
        <div className="text-sm text-ink-soft">
          {data.counts.breakfasts} B · {data.counts.lunches} L
        </div>
      </div>

      {failed && <div className="mb-3"><Notice tone="error">{failed}</Notice></div>}

      {data.rows.length === 0 ? (
        <Notice>No deliveries today.</Notice>
      ) : (
        <ul className="grid gap-3">
          {data.rows.map((row) => (
            <li
              key={row.id}
              className={`rounded-2xl border bg-white p-4 shadow-sm ${
                row.delivered ? 'border-emerald-300 bg-emerald-50/60' : 'border-cream-deep'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-lg font-bold text-ink">{row.name}</span>
                    <span className="shrink-0 rounded-full bg-cream-deep px-2 py-0.5 text-xs font-bold text-ink">
                      {row.hasLunch ? 'B + L' : 'B'}
                    </span>
                  </div>
                  {row.building && (
                    <div className="text-sm font-semibold text-ink">{row.building}</div>
                  )}
                  <div className="text-sm text-ink-soft">{row.address}</div>
                  {row.landmark && (
                    <div className="text-sm text-ink-soft">Landmark: {row.landmark}</div>
                  )}
                  <div className="mt-1 font-mono text-sm text-ink">{row.phone}</div>
                </div>

                <label className="flex shrink-0 cursor-pointer flex-col items-center gap-1">
                  <input
                    type="checkbox"
                    checked={row.delivered}
                    onChange={() => toggle(row)}
                    className="h-9 w-9 accent-emerald-600"
                  />
                  <span className="text-[11px] font-bold uppercase text-ink-soft">Done</span>
                </label>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <a
                  href={`tel:+91${row.phone}`}
                  role="button"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white"
                >
                  Call
                </a>
                <a
                  href={waLink(ON_THE_WAY, waNumber(row.phone))}
                  role="button"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-whatsapp px-4 py-2 text-sm font-bold text-white"
                >
                  WhatsApp
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </OwnerShell>
  );
}
