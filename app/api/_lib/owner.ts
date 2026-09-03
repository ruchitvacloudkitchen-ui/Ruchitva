import { db, HttpError } from './db';
import { checkPassword, issueToken, requireOwner } from './auth';
import { body, date, oneOf, optionalStr, phone, planId, str } from './validate';
import type { DeliveryRow, SkipRow, SubscriberRow } from './types';
import { PLANS } from '../../shared/plans';
import { addDays, isDeliveryDay, istToday, nextDeliveryDay, type ISODate } from '../../shared/date';
import { derive, endDate, isDeliveringOn } from '../../shared/subscription';

interface Loaded {
  subs: SubscriberRow[];
  skips: Map<string, Set<ISODate>>;
}

/** 40-60 subscribers: loading the whole book in two queries is the simple thing. */
async function load(statuses = 'active'): Promise<Loaded> {
  const [subs, skipRows] = await Promise.all([
    db.select<SubscriberRow>(
      'subscribers',
      `status=in.(${statuses})&select=*&order=name.asc`,
    ),
    db.select<SkipRow>('skips', 'select=subscriber_id,skip_date'),
  ]);
  const skips = new Map<string, Set<ISODate>>();
  for (const row of skipRows) {
    const set = skips.get(row.subscriber_id) ?? new Set<ISODate>();
    set.add(row.skip_date);
    skips.set(row.subscriber_id, set);
  }
  return { subs, skips };
}

function skipsOf(loaded: Loaded, id: string): Set<ISODate> {
  return loaded.skips.get(id) ?? new Set<ISODate>();
}

function deliveringOn(loaded: Loaded, day: ISODate): SubscriberRow[] {
  return loaded.subs.filter((s) => isDeliveringOn(s, skipsOf(loaded, s.id), day));
}

function countsFor(loaded: Loaded, day: ISODate) {
  const list = deliveringOn(loaded, day);
  const skipped = loaded.subs.filter(
    (s) => s.status === 'active' && day >= s.start_date && skipsOf(loaded, s.id).has(day),
  ).length;
  return {
    date: day,
    breakfasts: list.length,
    lunches: list.filter((s) => PLANS[s.plan].hasLunch).length,
    skipped,
  };
}

// ------------------------------------------------------------------ screens

async function today() {
  const day = istToday();
  const loaded = await load();
  const list = deliveringOn(loaded, day);
  const marked = list.length
    ? await db.select<DeliveryRow>(
        'deliveries',
        `delivery_date=eq.${day}&select=subscriber_id,delivered`,
      )
    : [];
  const done = new Set(marked.filter((m) => m.delivered).map((m) => m.subscriber_id));

  return {
    date: day,
    rows: list.map((s) => ({
      id: s.id,
      name: s.name,
      phone: s.phone,
      address: s.address,
      landmark: s.landmark,
      building: s.building,
      plan: s.plan,
      hasLunch: PLANS[s.plan].hasLunch,
      delivered: done.has(s.id),
    })),
    counts: countsFor(loaded, day),
  };
}

async function counts() {
  const day = istToday();
  const loaded = await load();
  const next = nextDeliveryDay(addDays(day, 1));
  return { next: countsFor(loaded, next), today: countsFor(loaded, day) };
}

async function markDelivered(input: Record<string, unknown>) {
  const id = str(input.id, 'Subscriber', 40);
  const day = date(input.date, 'Date');
  const delivered = input.delivered !== false;
  await db.upsert('deliveries', { subscriber_id: id, delivery_date: day, delivered }, 'subscriber_id,delivery_date');
  return { ok: true };
}

async function subscribers(input: Record<string, unknown>) {
  const q = optionalStr(input.q, 60);
  const loaded = await load('pending_payment,active,paused,cancelled');
  const day = istToday();

  const term = q?.toLowerCase() ?? '';
  const digits = q?.replace(/\D/g, '') ?? '';
  const matched = loaded.subs.filter((s) => {
    if (!term) return true;
    if (s.name.toLowerCase().includes(term)) return true;
    return digits.length >= 3 && s.phone.includes(digits);
  });

  const rank: Record<string, number> = { active: 0, pending_payment: 1, paused: 2, cancelled: 3 };
  return {
    rows: matched
      .map((s) => {
        const d = derive(s, [...skipsOf(loaded, s.id)], day);
        return {
          id: s.id,
          name: s.name,
          phone: s.phone,
          address: s.address,
          landmark: s.landmark,
          building: s.building,
          plan: s.plan,
          priceInr: s.price_inr,
          status: s.status,
          startDate: s.start_date,
          endDate: d.endDate,
          daysRemaining: d.daysRemaining,
          daysTotal: s.days_total,
          cycles: s.cycles,
          skipsUsed: d.skipsUsed,
          upiRef: s.upi_ref,
          paidAt: s.paid_at,
          source: s.source,
          notes: s.notes,
        };
      })
      .sort((a, b) => rank[a.status] - rank[b.status] || a.name.localeCompare(b.name)),
  };
}

async function addSubscriber(input: Record<string, unknown>) {
  const plan = planId(input.plan);
  const p = phone(input.phone);
  const running = await db.select<SubscriberRow>(
    'subscribers',
    `phone=eq.${p}&status=in.(pending_payment,active,paused)&select=id&limit=1`,
  );
  if (running[0]) throw new HttpError(409, 'This number already has a subscription.');

  const paid = input.paid !== false;
  const start = nextDeliveryDay(date(input.start_date, 'Start date'));
  const rows = await db.insert<SubscriberRow>('subscribers', {
    name: str(input.name, 'Name', 80),
    phone: p,
    address: str(input.address, 'Address', 400),
    landmark: optionalStr(input.landmark, 120),
    building: optionalStr(input.building, 120),
    plan,
    price_inr: PLANS[plan].priceInr,
    start_date: start,
    days_total: PLANS[plan].days,
    status: paid ? 'active' : 'pending_payment',
    paid_at: paid ? new Date().toISOString() : null,
    upi_ref: optionalStr(input.upi_ref, 40),
    notes: optionalStr(input.notes, 300),
    source: 'manual',
  });
  return { id: rows[0].id, startDate: rows[0].start_date };
}

const OPS = ['mark_paid', 'renew', 'pause', 'resume', 'cancel'] as const;

async function updateSubscriber(input: Record<string, unknown>) {
  const id = str(input.id, 'Subscriber', 40);
  const op = oneOf(input.op, OPS, 'Action');

  const rows = await db.select<SubscriberRow>('subscribers', `id=eq.${id}&select=*&limit=1`);
  const sub = rows[0];
  if (!sub) throw new HttpError(404, 'Subscriber not found.');

  const now = new Date().toISOString();
  const day = istToday();

  switch (op) {
    case 'mark_paid': {
      // If the payment lands after the requested start date, the month starts
      // now — the customer should not lose days they waited through.
      await db.update('subscribers', `id=eq.${id}`, {
        status: 'active',
        paid_at: sub.paid_at ?? now,
        start_date: sub.start_date < day ? nextDeliveryDay(day) : sub.start_date,
        upi_ref: optionalStr(input.upi_ref, 40) ?? sub.upi_ref,
      });
      break;
    }
    case 'renew': {
      // A renewal simply buys another 22 weekday slots on the same calendar.
      await db.update('subscribers', `id=eq.${id}`, {
        days_total: sub.days_total + PLANS[sub.plan].days,
        cycles: sub.cycles + 1,
        status: sub.status === 'cancelled' ? 'active' : sub.status === 'pending_payment' ? 'active' : sub.status,
        paid_at: now,
        upi_ref: optionalStr(input.upi_ref, 40) ?? sub.upi_ref,
      });
      break;
    }
    case 'pause': {
      await db.update('subscribers', `id=eq.${id}`, { status: 'paused', paused_on: day });
      break;
    }
    case 'resume': {
      // Days lost to the pause become skips, so the customer keeps what they paid for.
      if (sub.paused_on) {
        const existing = await db.select<SkipRow>('skips', `subscriber_id=eq.${id}&select=skip_date`);
        const have = new Set(existing.map((r) => r.skip_date));
        const from = sub.paused_on > sub.start_date ? sub.paused_on : sub.start_date;
        const missed: { subscriber_id: string; skip_date: string; reason: string }[] = [];
        for (let d = from, i = 0; d < day && i < 400; d = addDays(d, 1), i++) {
          if (isDeliveryDay(d) && !have.has(d)) {
            missed.push({ subscriber_id: id, skip_date: d, reason: 'paused' });
          }
        }
        if (missed.length) await db.insert('skips', missed);
      }
      await db.update('subscribers', `id=eq.${id}`, { status: 'active', paused_on: null });
      break;
    }
    case 'cancel': {
      await db.update('subscribers', `id=eq.${id}`, { status: 'cancelled' });
      break;
    }
  }
  return { ok: true, op };
}

async function renewals() {
  const day = istToday();
  const horizon = addDays(day, 7);
  const loaded = await load('active,paused');
  const rows = loaded.subs
    .map((s) => {
      const skips = [...skipsOf(loaded, s.id)];
      const end = endDate(s.start_date, s.days_total, new Set(skips));
      return {
        id: s.id,
        name: s.name,
        phone: s.phone,
        plan: s.plan,
        priceInr: PLANS[s.plan].priceInr,
        status: s.status,
        endDate: end,
        daysRemaining: derive(s, skips, day).daysRemaining,
      };
    })
    .filter((r) => r.endDate <= horizon)
    .sort((a, b) => a.endDate.localeCompare(b.endDate));
  return { today: day, horizon, rows };
}

export async function handleOwner(input: unknown, authHeader: string | undefined): Promise<unknown> {
  const data = body(input);

  if (data.action === 'login') {
    checkPassword(data.password);
    return { token: issueToken() };
  }

  requireOwner(authHeader);

  switch (data.action) {
    case 'today':
      return today();
    case 'counts':
      return counts();
    case 'mark_delivered':
      return markDelivered(data);
    case 'subscribers':
      return subscribers(data);
    case 'add_subscriber':
      return addSubscriber(data);
    case 'update_subscriber':
      return updateSubscriber(data);
    case 'renewals':
      return renewals();
    default:
      throw new HttpError(400, 'Unknown action.');
  }
}
