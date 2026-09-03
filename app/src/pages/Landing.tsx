import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shell } from '../components/Shell';
import { Card, LinkButton } from '../components/ui';
import { useLang } from '../lib/i18n';
import { callPublic } from '../lib/api';
import { MENU_FALLBACK, type MenuDay } from '../lib/menuFallback';
import { OWNER_WHATSAPP, rupees, waLink } from '../lib/config';
import { PLAN_IDS, PLANS } from '../../shared/plans';
import { weekdayName } from '../../shared/date';

export function Landing() {
  const { lang, t } = useLang();
  const [menu, setMenu] = useState<MenuDay[]>(MENU_FALLBACK);

  useEffect(() => {
    let live = true;
    callPublic<{ days: MenuDay[] }>('menu')
      .then((res) => {
        // An empty table is not an answer worth showing — keep the fallback.
        const filled = res.days.filter((d) => d.breakfast.length || d.lunch.length);
        if (live && filled.length) setMenu(res.days);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  return (
    <Shell>
      <section className="mb-6">
        <h1 className="font-display text-3xl font-bold leading-tight text-ink">{t('heroTitle')}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{t('heroBody')}</p>
        <div className="mt-5 grid gap-2">
          <Link
            to="/subscribe"
            role="button"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-brand px-5 py-3 text-base font-semibold text-white shadow-sm"
          >
            {t('ctaSubscribe')}
          </Link>
          <Link
            to="/my"
            role="button"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-cream-deep bg-white px-5 py-3 text-base font-semibold text-ink"
          >
            {t('ctaMine')}
          </Link>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-xl font-bold text-ink">{t('plansTitle')}</h2>
        <div className="grid gap-3">
          {PLAN_IDS.map((id) => {
            const plan = PLANS[id];
            return (
              <Card key={id} className={id === 'breakfast' ? 'border-gold' : ''}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-ink">{plan.name[lang]}</h3>
                    <p className="mt-1 text-sm text-ink-soft">{plan.blurb[lang]}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-display text-2xl font-bold text-brand">
                      {rupees(plan.priceInr)}
                    </div>
                    <div className="text-xs text-ink-soft">{t('perMonth')}</div>
                  </div>
                </div>
                <ul className="mt-3 space-y-1 text-sm text-ink-soft">
                  <li>• {t('planDays')}</li>
                  <li>• {t('planUpfront')}</li>
                  <li>• {t('planSkip')}</li>
                </ul>
                <Link
                  to={`/subscribe?plan=${id}`}
                  role="button"
                  className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-brand px-5 py-3 text-base font-semibold text-white"
                >
                  {t('ctaSubscribe')}
                </Link>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-xl font-bold text-ink">{t('menuTitle')}</h2>
        <Card className="divide-y divide-cream-deep p-0">
          {menu.map((day) => (
            <div key={day.dayOfWeek} className="px-4 py-3">
              <div className="text-xs font-bold uppercase tracking-wide text-gold">
                {weekdayName(day.dayOfWeek, lang)}
              </div>
              {day.breakfast.map((item, i) => (
                <div key={`b${i}`} className="mt-1 text-[15px] font-semibold text-ink">
                  {lang === 'te' ? item.item_te : item.item_en}
                </div>
              ))}
              {day.lunch.map((item, i) => (
                <div key={`l${i}`} className="text-sm text-ink-soft">
                  {lang === 'te' ? 'భోజనం: ' : 'Lunch: '}
                  {lang === 'te' ? item.item_te : item.item_en}
                </div>
              ))}
            </div>
          ))}
        </Card>
        <p className="mt-2 text-xs text-ink-soft">{t('menuNote')}</p>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-xl font-bold text-ink">{t('howTitle')}</h2>
        <ol className="grid gap-2">
          {[t('how1'), t('how2'), t('how3')].map((step, i) => (
            <li key={i} className="flex gap-3 rounded-xl bg-white p-3 text-sm text-ink">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold font-bold text-ink">
                {i + 1}
              </span>
              <span className="self-center">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mb-8">
        <Card>
          <h2 className="text-lg font-bold text-ink">{t('areaTitle')}</h2>
          <p className="mt-1 text-sm text-ink-soft">{t('areaBody')}</p>
        </Card>
      </section>

      <LinkButton
        tone="whatsapp"
        full
        href={waLink(
          lang === 'te'
            ? 'నమస్తే రుచిత్వ! సబ్‌స్క్రిప్షన్ గురించి తెలుసుకోవాలి.'
            : 'Hello Ruchitva! I would like to know about the breakfast subscription.',
        )}
      >
        {t('ctaWhatsapp')}
      </LinkButton>
      <p className="mt-4 text-center text-xs text-ink-soft">
        +{OWNER_WHATSAPP} · Kompally, Hyderabad
      </p>
    </Shell>
  );
}
