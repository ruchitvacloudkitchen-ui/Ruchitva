import { useState } from 'react';
import { OwnerShell, ErrorBox } from './OwnerShell';
import { Button, Loading, Notice } from '../../components/ui';
import { useOwnerData } from '../../lib/useOwner';
import { ApiError, callOwner } from '../../lib/api';
import { UPI_ID, rupees, waLink, waNumber } from '../../lib/config';
import { PLANS, type PlanId } from '../../../shared/plans';
import { formatDate, istToday } from '../../../shared/date';
import type { Status } from '../../../shared/subscription';

interface Row {
  id: string;
  name: string;
  phone: string;
  plan: PlanId;
  priceInr: number;
  status: Status;
  endDate: string;
  daysRemaining: number;
}

function reminder(row: Row): string {
  const plan = PLANS[row.plan];
  const upi = UPI_ID ? `\nUPI: ${UPI_ID}` : '';
  return [
    `నమస్తే ${row.name} 🙏`,
    `మీ రుచిత్వ ${plan.name.te} ${formatDate(row.endDate, 'te')} తో ముగుస్తుంది (${row.daysRemaining} రోజులు మిగిలాయి).`,
    `కొనసాగించాలంటే ${rupees(row.priceInr)} UPI ద్వారా చెల్లించి రిఫరెన్స్ నంబర్ పంపండి.${upi}`,
    '',
    `Your Ruchitva ${plan.name.en} ends on ${formatDate(row.endDate)} (${row.daysRemaining} days left). To continue, pay ${rupees(row.priceInr)} by UPI and send the reference number.`,
    '— Ruchitva Kitchen, Kompally',
  ].join('\n');
}

export function OwnerRenewals() {
  const { data, error, loading, reload } = useOwnerData<{ rows: Row[] }>('renewals');
  const [busyId, setBusyId] = useState('');
  const [actionError, setActionError] = useState('');
  const today = istToday();

  async function markRenewed(row: Row) {
    if (!window.confirm(`Add another ${PLANS[row.plan].days} days for ${row.name}?`)) return;
    setBusyId(row.id);
    setActionError('');
    try {
      await callOwner('update_subscriber', { id: row.id, op: 'renew' });
      await reload();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not save.');
    } finally {
      setBusyId('');
    }
  }

  if (loading && !data) return <OwnerShell title="Renewals due"><Loading label="Loading…" /></OwnerShell>;
  if (error && !data) return <OwnerShell title="Renewals due"><ErrorBox error={error} onRetry={reload} /></OwnerShell>;
  if (!data) return null;

  return (
    <OwnerShell title="Renewals due">
      <p className="mb-3 text-sm text-ink-soft">Ending in the next 7 days, soonest first.</p>
      {actionError && <div className="mb-3"><Notice tone="error">{actionError}</Notice></div>}

      {data.rows.length === 0 ? (
        <Notice tone="success">Nothing due in the next 7 days.</Notice>
      ) : (
        <ul className="grid gap-3">
          {data.rows.map((row) => {
            const overdue = row.endDate < today;
            return (
              <li
                key={row.id}
                className={`rounded-2xl border bg-white p-4 shadow-sm ${
                  overdue ? 'border-red-300' : 'border-cream-deep'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-lg font-bold text-ink">{row.name}</div>
                    <div className="font-mono text-sm text-ink">{row.phone}</div>
                    <div className="text-sm text-ink-soft">
                      {PLANS[row.plan].name.en} · {rupees(row.priceInr)}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className={`text-2xl font-bold ${overdue ? 'text-red-700' : 'text-brand'}`}>
                      {row.daysRemaining}
                    </div>
                    <div className="text-xs text-ink-soft">days left</div>
                  </div>
                </div>

                <div className="mt-2 text-sm font-semibold text-ink">
                  {overdue ? 'Ended ' : 'Ends '}
                  {formatDate(row.endDate)}
                  {row.status === 'paused' && ' · paused'}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <a
                    href={waLink(reminder(row), waNumber(row.phone))}
                    role="button"
                    className="inline-flex min-h-12 items-center justify-center rounded-xl bg-whatsapp px-4 py-2 text-sm font-bold text-white"
                  >
                    Send reminder
                  </a>
                  <Button
                    tone="gold"
                    className="min-h-12 text-sm"
                    disabled={busyId === row.id}
                    onClick={() => markRenewed(row)}
                  >
                    Mark renewed
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </OwnerShell>
  );
}
