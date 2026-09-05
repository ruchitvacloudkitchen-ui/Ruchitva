import { useState } from 'react';
import { Link } from 'react-router-dom';
import { OwnerShell } from './OwnerShell';
import { Button, Card, Field, Notice, inputClass } from '../../components/ui';
import { ApiError, callOwner } from '../../lib/api';
import { rupees } from '../../lib/config';
import { PLAN_IDS, PLANS, type PlanId } from '../../../shared/plans';
import { addDays, formatDate, istToday, nextDeliveryDay } from '../../../shared/date';

/** Most subscribers sign up on WhatsApp, so this is the primary intake. */
export function OwnerAddSubscriber() {
  const today = istToday();
  const empty = {
    name: '',
    phone: '',
    address: '',
    building: '',
    landmark: '',
    plan: 'breakfast' as PlanId,
    start_date: nextDeliveryDay(addDays(today, 1)),
    upi_ref: '',
    notes: '',
  };
  const [form, setForm] = useState(empty);
  const [paid, setPaid] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState('');

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function submit() {
    setError('');
    setSaved('');
    setBusy(true);
    try {
      const res = await callOwner<{ startDate: string }>('add_subscriber', { ...form, paid });
      setSaved(`${form.name} added. Delivery starts ${formatDate(res.startDate)}.`);
      setForm({ ...empty });
      window.scrollTo(0, 0);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <OwnerShell title="Add subscriber">
      <div className="grid gap-4">
        {saved && (
          <Notice tone="success">
            {saved}{' '}
            <Link to="/owner/subscribers" className="underline">
              See all subscribers
            </Link>
          </Notice>
        )}

        <Card className="grid gap-4">
          <Field label="Name">
            <input className={inputClass} value={form.name} onChange={(e) => set('name')(e.target.value)} />
          </Field>

          <Field label="WhatsApp number" hint="10 digits">
            <input
              className={inputClass}
              value={form.phone}
              inputMode="numeric"
              maxLength={13}
              onChange={(e) => set('phone')(e.target.value)}
            />
          </Field>

          <Field label="Full address" hint="Flat number, street, area, pincode">
            <textarea
              className={`${inputClass} min-h-24`}
              rows={3}
              value={form.address}
              onChange={(e) => set('address')(e.target.value)}
            />
          </Field>

          <Field label="Apartment / office name">
            <input className={inputClass} value={form.building} onChange={(e) => set('building')(e.target.value)} />
          </Field>

          <Field label="Landmark">
            <input className={inputClass} value={form.landmark} onChange={(e) => set('landmark')(e.target.value)} />
          </Field>

          <Field label="Plan">
            <div className="grid gap-2">
              {PLAN_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => set('plan')(id)}
                  className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 text-left ${
                    form.plan === id ? 'border-brand bg-white' : 'border-cream-deep bg-white/60'
                  }`}
                >
                  <span className="font-semibold text-ink">{PLANS[id].name.en}</span>
                  <span className="font-bold text-brand">{rupees(PLANS[id].priceInr)}</span>
                </button>
              ))}
            </div>
          </Field>

          <Field label="Start date" hint="A weekend date rolls forward to the Monday">
            <input
              type="date"
              className={inputClass}
              value={form.start_date}
              min={today}
              onChange={(e) => set('start_date')(e.target.value)}
            />
          </Field>

          <label className="flex items-center gap-3 rounded-xl bg-cream px-4 py-3">
            <input
              type="checkbox"
              checked={paid}
              onChange={(e) => setPaid(e.target.checked)}
              className="h-6 w-6 accent-brand"
            />
            <span className="text-sm font-semibold text-ink">
              Payment already received — start immediately
            </span>
          </label>

          <Field label="UPI reference (optional)">
            <input className={inputClass} value={form.upi_ref} onChange={(e) => set('upi_ref')(e.target.value)} />
          </Field>

          <Field label="Notes (optional)" hint="Gate code, no onion, office desk number…">
            <input className={inputClass} value={form.notes} onChange={(e) => set('notes')(e.target.value)} />
          </Field>

          {error && <Notice tone="error">{error}</Notice>}

          <Button full onClick={submit} disabled={busy}>
            {busy ? 'Saving…' : 'Add subscriber'}
          </Button>
        </Card>
      </div>
    </OwnerShell>
  );
}
