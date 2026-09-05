import { useMemo, useState } from 'react';
import { OwnerShell, ErrorBox } from './OwnerShell';
import { Button, Loading, Notice, inputClass } from '../../components/ui';
import { useOwnerData } from '../../lib/useOwner';
import { ApiError, callOwner } from '../../lib/api';
import { rupees, waLink, waNumber } from '../../lib/config';
import { PLANS, type PlanId } from '../../../shared/plans';
import { formatDate } from '../../../shared/date';
import type { Status } from '../../../shared/subscription';

interface Row {
  id: string;
  name: string;
  phone: string;
  address: string;
  landmark: string | null;
  building: string | null;
  plan: PlanId;
  priceInr: number;
  status: Status;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  daysTotal: number;
  cycles: number;
  skipsUsed: number;
  upiRef: string | null;
  source: 'web' | 'manual';
  notes: string | null;
}

const BADGE: Record<Status, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  pending_payment: 'bg-amber-100 text-amber-900',
  paused: 'bg-sky-100 text-sky-900',
  cancelled: 'bg-cream-deep text-ink-soft',
};

const LABEL: Record<Status, string> = {
  active: 'Active',
  pending_payment: 'Payment pending',
  paused: 'Paused',
  cancelled: 'Cancelled',
};

export function OwnerSubscribers() {
  const { data, error, loading, reload } = useOwnerData<{ rows: Row[] }>('subscribers');
  const [q, setQ] = useState('');
  const [busyId, setBusyId] = useState('');
  const [actionError, setActionError] = useState('');

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const digits = q.replace(/\D/g, '');
    if (!term) return data?.rows ?? [];
    return (data?.rows ?? []).filter(
      (r) =>
        r.name.toLowerCase().includes(term) || (digits.length >= 3 && r.phone.includes(digits)),
    );
  }, [data, q]);

  async function act(row: Row, op: string, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusyId(row.id);
    setActionError('');
    try {
      await callOwner('update_subscriber', { id: row.id, op });
      await reload();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not save.');
    } finally {
      setBusyId('');
    }
  }

  if (loading && !data)
    return <OwnerShell title="Subscribers"><Loading label="Loading…" /></OwnerShell>;
  if (error && !data)
    return <OwnerShell title="Subscribers"><ErrorBox error={error} onRetry={reload} /></OwnerShell>;

  return (
    <OwnerShell title="Subscribers">
      <input
        className={`${inputClass} mb-3`}
        placeholder="Search name or phone"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {actionError && <div className="mb-3"><Notice tone="error">{actionError}</Notice></div>}

      <p className="mb-3 text-sm text-ink-soft">{rows.length} shown</p>

      <ul className="grid gap-3">
        {rows.map((row) => (
          <li key={row.id} className="rounded-2xl border border-cream-deep bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-lg font-bold text-ink">{row.name}</div>
                <div className="font-mono text-sm text-ink">{row.phone}</div>
                <div className="text-sm text-ink-soft">
                  {PLANS[row.plan].name.en} · {rupees(row.priceInr)}
                </div>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${BADGE[row.status]}`}>
                {LABEL[row.status]}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <Cell label="Days left" value={row.daysRemaining} />
              <Cell label="Ends" value={formatDate(row.endDate)} />
              <Cell label="Skips" value={row.skipsUsed} />
            </div>

            <div className="mt-2 text-xs text-ink-soft">
              {row.building ? `${row.building} · ` : ''}
              {row.address}
              {row.landmark ? ` · ${row.landmark}` : ''}
            </div>
            <div className="mt-1 text-xs text-ink-soft">
              Started {formatDate(row.startDate)} · month {row.cycles} · {row.source}
              {row.upiRef ? ` · UPI ref ${row.upiRef}` : ''}
            </div>
            {row.notes && <div className="mt-1 text-xs italic text-ink-soft">{row.notes}</div>}

            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={`tel:+91${row.phone}`}
                role="button"
                className="inline-flex min-h-11 items-center rounded-xl border border-cream-deep px-3 py-2 text-sm font-bold text-ink"
              >
                Call
              </a>
              <a
                href={waLink(`Ruchitva · ${row.name}`, waNumber(row.phone))}
                role="button"
                className="inline-flex min-h-11 items-center rounded-xl bg-whatsapp px-3 py-2 text-sm font-bold text-white"
              >
                WhatsApp
              </a>

              {row.status === 'pending_payment' && (
                <Button
                  tone="gold"
                  className="min-h-11 px-3 py-2 text-sm"
                  disabled={busyId === row.id}
                  onClick={() => act(row, 'mark_paid')}
                >
                  Payment received
                </Button>
              )}

              {row.status !== 'cancelled' && (
                <Button
                  className="min-h-11 px-3 py-2 text-sm"
                  disabled={busyId === row.id}
                  onClick={() =>
                    act(
                      row,
                      'renew',
                      `Add another ${PLANS[row.plan].days} days for ${row.name}? Only do this once payment is received.`,
                    )
                  }
                >
                  Renew +{PLANS[row.plan].days}
                </Button>
              )}

              {row.status === 'active' && (
                <Button
                  tone="plain"
                  className="min-h-11 px-3 py-2 text-sm"
                  disabled={busyId === row.id}
                  onClick={() => act(row, 'pause')}
                >
                  Pause
                </Button>
              )}

              {row.status === 'paused' && (
                <Button
                  tone="plain"
                  className="min-h-11 px-3 py-2 text-sm"
                  disabled={busyId === row.id}
                  onClick={() => act(row, 'resume')}
                >
                  Resume
                </Button>
              )}

              {row.status !== 'cancelled' && (
                <Button
                  tone="danger"
                  className="min-h-11 px-3 py-2 text-sm"
                  disabled={busyId === row.id}
                  onClick={() => act(row, 'cancel', `Cancel ${row.name}'s subscription?`)}
                >
                  Cancel
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {rows.length === 0 && <Notice>No subscribers match that search.</Notice>}
    </OwnerShell>
  );
}

function Cell({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-cream px-2 py-2">
      <div className="text-[11px] font-bold uppercase tracking-wide text-ink-soft">{label}</div>
      <div className="text-sm font-bold text-ink">{value}</div>
    </div>
  );
}
