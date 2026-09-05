import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Shell } from '../components/Shell';
import { Button, Card, Field, LinkButton, Notice, inputClass } from '../components/ui';
import { useLang } from '../lib/i18n';
import { ApiError, callPublic } from '../lib/api';
import { OWNER_WHATSAPP, UPI_ID, rupees, upiLink, waLink } from '../lib/config';
import { PLAN_IDS, PLANS, type PlanId } from '../../shared/plans';
import { addDays, formatDate, istToday, nextDeliveryDay } from '../../shared/date';

interface Created {
  id: string;
  name: string;
  phone: string;
  plan: PlanId;
  priceInr: number;
  startDate: string;
  startDateAdjusted: boolean;
}

export function Subscribe() {
  const { lang, t } = useLang();
  const [params] = useSearchParams();
  const requested = params.get('plan');

  const today = istToday();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    building: '',
    landmark: '',
    plan: (requested === 'breakfast_lunch' ? 'breakfast_lunch' : 'breakfast') as PlanId,
    start_date: nextDeliveryDay(addDays(today, 1)),
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<Created | null>(null);
  const [refDone, setRefDone] = useState(false);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function submit() {
    setError('');
    setBusy(true);
    try {
      setCreated(await callPublic<Created>('subscribe', form));
      window.scrollTo(0, 0);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (created && refDone) return <Done created={created} />;
  if (created) return <Pay created={created} onDone={() => setRefDone(true)} />;

  return (
    <Shell back title={t('formTitle')}>
      <div className="grid gap-4">
        <Field label={t('fName')}>
          <input
            className={inputClass}
            value={form.name}
            autoComplete="name"
            onChange={(e) => set('name')(e.target.value)}
          />
        </Field>

        <Field label={t('fPhone')} hint={t('fPhoneHint')}>
          <input
            className={inputClass}
            value={form.phone}
            inputMode="numeric"
            autoComplete="tel"
            maxLength={13}
            onChange={(e) => set('phone')(e.target.value)}
          />
        </Field>

        <Field label={t('fAddress')} hint={t('fAddressHint')}>
          <textarea
            className={`${inputClass} min-h-24`}
            value={form.address}
            rows={3}
            autoComplete="street-address"
            onChange={(e) => set('address')(e.target.value)}
          />
        </Field>

        <Field label={t('fBuilding')}>
          <input
            className={inputClass}
            value={form.building}
            onChange={(e) => set('building')(e.target.value)}
          />
        </Field>

        <Field label={t('fLandmark')}>
          <input
            className={inputClass}
            value={form.landmark}
            onChange={(e) => set('landmark')(e.target.value)}
          />
        </Field>

        <Field label={t('fPlan')}>
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
                <span className="text-[15px] font-semibold text-ink">{PLANS[id].name[lang]}</span>
                <span className="font-bold text-brand">{rupees(PLANS[id].priceInr)}</span>
              </button>
            ))}
          </div>
        </Field>

        <Field label={t('fStart')} hint={t('fStartHint')}>
          <input
            type="date"
            className={inputClass}
            value={form.start_date}
            min={today}
            max={addDays(today, 60)}
            onChange={(e) => set('start_date')(e.target.value)}
          />
        </Field>

        {error && <Notice tone="error">{error}</Notice>}

        <Button full onClick={submit} disabled={busy}>
          {busy ? t('submitting') : `${t('submit')} · ${rupees(PLANS[form.plan].priceInr)}`}
        </Button>
      </div>
    </Shell>
  );
}

// ------------------------------------------------------------------ payment

function Pay({ created, onDone }: { created: Created; onDone: () => void }) {
  const { lang, t } = useLang();
  const [qr, setQr] = useState('');
  const [ref, setRef] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const note = useMemo(
    () => `Ruchitva ${PLANS[created.plan].name.en} ${created.phone}`,
    [created.phone, created.plan],
  );
  const link = upiLink(created.priceInr, note);

  useEffect(() => {
    if (!UPI_ID) return;
    let live = true;
    // Loaded only on this screen so the landing page stays light on 4G.
    import('qrcode')
      .then((mod) => {
        const toDataURL =
          mod.toDataURL ?? (mod as unknown as { default: typeof mod }).default.toDataURL;
        return toDataURL(link, { width: 320, margin: 1 });
      })
      .then((url) => {
        if (live) setQr(url);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [link]);

  async function submitRef() {
    setError('');
    setBusy(true);
    try {
      await callPublic('payment_ref', { id: created.id, upi_ref: ref });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell title={t('payTitle')}>
      <div className="grid gap-4">
        {created.startDateAdjusted && (
          <Notice tone="warn">
            {lang === 'te'
              ? `డెలివరీ ${formatDate(created.startDate, 'te')} నుంచి మొదలవుతుంది.`
              : `Delivery starts ${formatDate(created.startDate, 'en')}.`}
          </Notice>
        )}

        <Card className="text-center">
          <div className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
            {t('payAmount')}
          </div>
          <div className="font-display text-4xl font-bold text-brand">
            {rupees(created.priceInr)}
          </div>
          <div className="mt-1 text-sm text-ink-soft">{PLANS[created.plan].name[lang]}</div>

          {UPI_ID ? (
            <>
              {qr && (
                <img
                  src={qr}
                  alt="UPI QR"
                  width={240}
                  height={240}
                  className="mx-auto mt-4 h-60 w-60 rounded-xl border border-cream-deep bg-white p-2"
                />
              )}
              <p className="mt-2 text-sm font-semibold text-ink">{t('payScan')}</p>

              <div className="mt-4 rounded-xl bg-cream px-3 py-3">
                <div className="text-xs text-ink-soft">{t('payOr')}</div>
                <div className="mt-1 flex items-center justify-center gap-2">
                  <span className="select-all break-all font-mono text-base font-bold text-ink">
                    {UPI_ID}
                  </span>
                  <button
                    className="min-h-0 shrink-0 whitespace-nowrap rounded-lg border border-brand/30 px-2 py-1 text-xs font-bold text-brand"
                    onClick={() => {
                      navigator.clipboard?.writeText(UPI_ID).catch(() => undefined);
                      setCopied(true);
                    }}
                  >
                    {copied ? t('payCopied') : t('payCopy')}
                  </button>
                </div>
              </div>

              <LinkButton tone="gold" full className="mt-3" href={link}>
                {t('payOpenApp')}
              </LinkButton>
            </>
          ) : (
            <Notice tone="warn">
              UPI ID is not configured yet. Please send the payment details over WhatsApp.
            </Notice>
          )}
        </Card>

        <Card>
          <Field label={t('payRefLabel')} hint={t('payRefHint')} error={error || undefined}>
            <input
              className={inputClass}
              value={ref}
              inputMode="numeric"
              onChange={(e) => setRef(e.target.value)}
            />
          </Field>
          <Button full className="mt-3" onClick={submitRef} disabled={busy || ref.trim().length < 4}>
            {busy ? t('submitting') : t('payRefSubmit')}
          </Button>
          <button
            className="mt-2 w-full text-sm font-semibold text-ink-soft underline"
            onClick={onDone}
          >
            {t('paySkipRef')}
          </button>
        </Card>
      </div>
    </Shell>
  );
}

// --------------------------------------------------------------------- done

function Done({ created }: { created: Created }) {
  const { lang, t } = useLang();
  const message =
    lang === 'te'
      ? `నమస్తే రుచిత్వ! నా సబ్‌స్క్రిప్షన్:\nపేరు: ${created.name}\nఫోన్: ${created.phone}\nప్లాన్: ${PLANS[created.plan].name.te} (${rupees(created.priceInr)})\nప్రారంభం: ${formatDate(created.startDate, 'te')}\nUPI చెల్లింపు చేశాను.`
      : `Hello Ruchitva! My subscription:\nName: ${created.name}\nPhone: ${created.phone}\nPlan: ${PLANS[created.plan].name.en} (${rupees(created.priceInr)})\nStarts: ${formatDate(created.startDate, 'en')}\nI have paid by UPI.`;

  return (
    <Shell title={t('doneTitle')}>
      <div className="grid gap-4">
        <Notice tone="success">{t('donePending')}</Notice>
        <Card>
          <p className="text-sm text-ink-soft">{t('doneBody')}</p>
          <dl className="mt-3 grid gap-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-soft">{t('fName')}</dt>
              <dd className="font-semibold">{created.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">{t('fPlan')}</dt>
              <dd className="font-semibold">{PLANS[created.plan].name[lang]}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">{t('fStart')}</dt>
              <dd className="font-semibold">{formatDate(created.startDate, lang)}</dd>
            </div>
          </dl>
        </Card>
        <LinkButton tone="whatsapp" full href={waLink(message)}>
          {t('doneWhatsapp')}
        </LinkButton>
        <Link to="/my" className="text-center text-sm font-semibold text-brand underline">
          {t('ctaMine')}
        </Link>
        <p className="text-center text-xs text-ink-soft">+{OWNER_WHATSAPP}</p>
      </div>
    </Shell>
  );
}
