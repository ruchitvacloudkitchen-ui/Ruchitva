import { useCallback, useState } from 'react';
import { Shell } from '../components/Shell';
import { Button, Card, Field, LinkButton, Notice, Stat, inputClass } from '../components/ui';
import { useLang } from '../lib/i18n';
import { ApiError, callPublic } from '../lib/api';
import { rupees, waLink } from '../lib/config';
import { PLANS, type PlanId } from '../../shared/plans';
import { addDays, formatDate, istToday, nextDeliveryDay } from '../../shared/date';
import type { Status } from '../../shared/subscription';

const PHONE_KEY = 'ruchitva_phone';

interface Lookup {
  name: string;
  phone: string;
  plan: PlanId;
  status: Status;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  daysTotal: number;
  skipsUsed: number;
  deliveringToday: boolean;
  upcomingSkips: string[];
  nextDeliveryDay: string;
  canSkipNextDay: boolean;
  istHour: number;
}

interface SkipResult {
  added: string[];
  rejected: { date: string; reason: string }[];
  endDate: string;
  daysRemaining: number;
}

export function MySubscription() {
  const { lang, t } = useLang();
  const [phone, setPhone] = useState(() => {
    try {
      return localStorage.getItem(PHONE_KEY) ?? '';
    } catch {
      return '';
    }
  });
  const [data, setData] = useState<Lookup | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState('');

  const load = useCallback(
    async (value: string) => {
      setError('');
      setBusy(true);
      try {
        const res = await callPublic<Lookup>('lookup', { phone: value });
        setData(res);
        try {
          localStorage.setItem(PHONE_KEY, value);
        } catch {
          /* ignore */
        }
      } catch (err) {
        setData(null);
        setError(
          err instanceof ApiError && err.status === 404
            ? t('noneFound')
            : err instanceof ApiError
              ? err.message
              : t('noneFound'),
        );
      } finally {
        setBusy(false);
      }
    },
    [t],
  );

  if (!data) {
    return (
      <Shell back title={t('mineTitle')}>
        <div className="grid gap-4">
          <p className="text-sm text-ink-soft">{t('minePrompt')}</p>
          <Field label={t('fPhone')} hint={t('fPhoneHint')}>
            <input
              className={inputClass}
              value={phone}
              inputMode="numeric"
              autoComplete="tel"
              maxLength={13}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>
          {error && <Notice tone="error">{error}</Notice>}
          <Button full onClick={() => load(phone)} disabled={busy || phone.replace(/\D/g, '').length < 10}>
            {busy ? t('loading') : t('mineCheck')}
          </Button>
        </div>
      </Shell>
    );
  }

  const statusLabel =
    data.status === 'active'
      ? t('statusActive')
      : data.status === 'paused'
        ? t('statusPaused')
        : t('statusPending');

  return (
    <Shell back title={t('mineTitle')}>
      <div className="grid gap-4">
        <Card>
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-lg font-bold text-ink">{data.name}</div>
              <div className="text-sm text-ink-soft">{PLANS[data.plan].name[lang]}</div>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                data.status === 'active'
                  ? 'bg-emerald-100 text-emerald-800'
                  : data.status === 'paused'
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-cream-deep text-ink-soft'
              }`}
            >
              {statusLabel}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Stat label={t('daysLeft')} value={data.daysRemaining} big />
            <Stat label={t('endsOn')} value={formatDate(data.endDate, lang)} />
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl bg-cream px-3 py-2">
              <span className="text-ink-soft">{t('skipsUsed')}: </span>
              <span className="font-bold">{data.skipsUsed}</span>
            </div>
            <div className="rounded-xl bg-cream px-3 py-2">
              <span className="font-semibold">
                {data.deliveringToday ? t('todayYes') : t('todayNo')}
              </span>
            </div>
          </div>

          {data.status === 'active' && data.daysRemaining <= 5 && (
            <div className="mt-3">
              <Notice tone="warn">{t('renewSoon')}</Notice>
              <LinkButton
                tone="whatsapp"
                full
                className="mt-2"
                href={waLink(
                  lang === 'te'
                    ? `నమస్తే! ${data.name} (${data.phone}) — నా ప్లాన్ రెన్యువల్ చేయాలి. ${PLANS[data.plan].name.te} ${rupees(PLANS[data.plan].priceInr)}`
                    : `Hello! ${data.name} (${data.phone}) — I want to renew my plan. ${PLANS[data.plan].name.en} ${rupees(PLANS[data.plan].priceInr)}`,
                )}
              >
                {t('ctaWhatsapp')}
              </LinkButton>
            </div>
          )}
        </Card>

        {flash && <Notice tone="success">{flash}</Notice>}

        {data.status === 'active' && (
          <SkipBox data={data} onChanged={(msg) => { setFlash(msg); load(data.phone); }} />
        )}

        {data.upcomingSkips.length > 0 && (
          <Card>
            <h2 className="text-base font-bold text-ink">{t('skippedDays')}</h2>
            <ul className="mt-2 divide-y divide-cream-deep">
              {data.upcomingSkips.map((d) => (
                <li key={d} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-semibold">{formatDate(d, lang)}</span>
                  <UndoSkip
                    phone={data.phone}
                    date={d}
                    onDone={() => { setFlash(''); load(data.phone); }}
                  />
                </li>
              ))}
            </ul>
          </Card>
        )}

        <button
          className="text-sm font-semibold text-ink-soft underline"
          onClick={() => {
            setData(null);
            setFlash('');
          }}
        >
          {lang === 'te' ? 'వేరే నంబర్ చూడండి' : 'Check another number'}
        </button>
      </div>
    </Shell>
  );
}

// ------------------------------------------------------------------- skips

function SkipBox({ data, onChanged }: { data: Lookup; onChanged: (msg: string) => void }) {
  const { lang, t } = useLang();
  const today = istToday();
  // After 8 PM the earliest skippable day moves out by one more day.
  const earliest = nextDeliveryDay(data.istHour >= 20 ? addDays(today, 2) : addDays(today, 1));

  const [from, setFrom] = useState(earliest);
  const [to, setTo] = useState(earliest);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function send(fromDate: string, toDate: string) {
    setError('');
    setBusy(true);
    try {
      const res = await callPublic<SkipResult>('skip', {
        phone: data.phone,
        from: fromDate,
        to: toDate,
      });
      if (!res.added.length) {
        if (res.rejected.some((r) => r.reason === 'cutoff')) setError(t('skipLocked'));
        else if (res.rejected.length) setError(t('skipAlready'));
        else setError(t('skipNoDeliveryDays'));
        return;
      }
      onChanged(
        lang === 'te'
          ? `${res.added.length} రోజులు వదిలేశాము. కొత్త ముగింపు తేదీ: ${formatDate(res.endDate, 'te')}`
          : `${res.added.length} day(s) skipped. New end date: ${formatDate(res.endDate, 'en')}`,
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <h2 className="text-base font-bold text-ink">{t('skipTitle')}</h2>
      <p className="mt-1 text-xs text-ink-soft">{t('skipRule')}</p>

      <Button
        full
        tone="gold"
        className="mt-3"
        disabled={busy || !data.canSkipNextDay}
        onClick={() => send(data.nextDeliveryDay, data.nextDeliveryDay)}
      >
        {t('skipNextDay')} · {formatDate(data.nextDeliveryDay, lang)}
      </Button>
      {!data.canSkipNextDay && (
        <p className="mt-2 text-xs font-semibold text-amber-800">{t('skipLocked')}</p>
      )}

      <div className="mt-4 border-t border-cream-deep pt-4">
        <h3 className="text-sm font-bold text-ink">{t('skipRange')}</h3>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Field label={t('skipFrom')}>
            <input
              type="date"
              className={inputClass}
              value={from}
              min={earliest}
              onChange={(e) => {
                setFrom(e.target.value);
                if (e.target.value > to) setTo(e.target.value);
              }}
            />
          </Field>
          <Field label={t('skipTo')}>
            <input
              type="date"
              className={inputClass}
              value={to}
              min={from}
              onChange={(e) => setTo(e.target.value)}
            />
          </Field>
        </div>
        <Button full className="mt-3" disabled={busy} onClick={() => send(from, to)}>
          {busy ? t('submitting') : t('skipConfirm')}
        </Button>
      </div>

      {error && <div className="mt-3"><Notice tone="error">{error}</Notice></div>}
    </Card>
  );
}

function UndoSkip({
  phone,
  date,
  onDone,
}: {
  phone: string;
  date: string;
  onDone: () => void;
}) {
  const { t } = useLang();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (error) return <span className="text-xs text-ink-soft">{error}</span>;

  return (
    <button
      className="min-h-0 rounded-lg border border-brand/30 px-3 py-1 text-xs font-bold text-brand"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await callPublic('unskip', { phone, date });
          onDone();
        } catch (err) {
          setError(err instanceof ApiError ? err.message : 'Locked');
        } finally {
          setBusy(false);
        }
      }}
    >
      {t('undo')}
    </button>
  );
}
