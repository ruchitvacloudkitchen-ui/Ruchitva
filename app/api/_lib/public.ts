import { db, HttpError } from './db';
import { body, date, optionalStr, phone, planId, str } from './validate';
import type { MenuRow, SkipRow, SubscriberRow } from './types';
import { PLANS } from '../../shared/plans';
import {
  addDays,
  isDeliveryDay,
  istHour,
  istToday,
  nextDeliveryDay,
  type ISODate,
} from '../../shared/date';
import { derive, endDate, skipAllowed } from '../../shared/subscription';

const MAX_SKIP_RANGE_DAYS = 45;
const MAX_SKIP_HORIZON_DAYS = 120;

const SUB_FIELDS =
  'select=id,name,phone,plan,price_inr,start_date,days_total,cycles,status,upi_ref,paid_at,created_at';

async function skipsFor(id: string): Promise<ISODate[]> {
  const rows = await db.select<SkipRow>('skips', `subscriber_id=eq.${id}&select=skip_date`);
  return rows.map((r) => r.skip_date);
}

/** The live subscription for a phone number: the newest one not cancelled. */
async function findByPhone(raw: unknown): Promise<SubscriberRow> {
  const p = phone(raw);
  const rows = await db.select<SubscriberRow>(
    'subscribers',
    `phone=eq.${p}&status=neq.cancelled&order=created_at.desc&limit=1&${SUB_FIELDS}`,
  );
  const sub = rows[0];
  if (!sub) throw new HttpError(404, 'No subscription found for this number.');
  return sub;
}

async function menu() {
  const rows = await db.select<MenuRow>(
    'weekly_menu',
    'select=day_of_week,meal,item_te,item_en,sort_order&order=day_of_week.asc,meal.asc,sort_order.asc',
  );
  return {
    days: [1, 2, 3, 4, 5].map((dow) => ({
      dayOfWeek: dow,
      breakfast: rows.filter((r) => r.day_of_week === dow && r.meal === 'breakfast'),
      lunch: rows.filter((r) => r.day_of_week === dow && r.meal === 'lunch'),
    })),
  };
}

async function subscribe(input: Record<string, unknown>) {
  const plan = planId(input.plan);
  const p = phone(input.phone);

  const existing = await db.select<SubscriberRow>(
    'subscribers',
    `phone=eq.${p}&status=in.(pending_payment,active,paused)&select=id,status&limit=1`,
  );
  if (existing[0]) {
    throw new HttpError(
      409,
      existing[0].status === 'pending_payment'
        ? 'This number already has a subscription waiting for payment confirmation.'
        : 'This number already has a running subscription. Open "My subscription" to see it.',
    );
  }

  // Deliveries only happen Mon-Fri, so a weekend start rolls to the Monday.
  const requested = date(input.start_date, 'Start date');
  const today = istToday();
  if (requested > addDays(today, 60)) {
    throw new HttpError(400, 'Start date must be within the next 60 days.');
  }
  const start = nextDeliveryDay(requested < today ? today : requested);

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
    status: 'pending_payment',
    source: 'web',
  });

  const sub = rows[0];
  return {
    id: sub.id,
    name: sub.name,
    phone: sub.phone,
    plan,
    priceInr: sub.price_inr,
    startDate: sub.start_date,
    startDateAdjusted: start !== requested,
  };
}

/** The customer types the UPI reference after paying; the owner confirms it. */
async function paymentRef(input: Record<string, unknown>) {
  const id = str(input.id, 'Subscription', 40);
  const ref = str(input.upi_ref, 'UPI reference number', 40);
  const rows = await db.update<SubscriberRow>(
    'subscribers',
    `id=eq.${id}&status=eq.pending_payment&select=id`,
    { upi_ref: ref },
  );
  if (!rows[0]) throw new HttpError(404, 'This subscription is no longer waiting for payment.');
  return { ok: true };
}

async function lookup(input: Record<string, unknown>) {
  const sub = await findByPhone(input.phone);
  const skips = await skipsFor(sub.id);
  const today = istToday();
  const d = derive(sub, skips, today);
  const hour = istHour();
  const tomorrow = nextDeliveryDay(addDays(today, 1));

  return {
    name: sub.name,
    phone: sub.phone,
    plan: sub.plan,
    status: sub.status,
    startDate: sub.start_date,
    endDate: d.endDate,
    daysRemaining: d.daysRemaining,
    daysTotal: sub.days_total,
    skipsUsed: d.skipsUsed,
    deliveringToday: d.deliveringToday,
    upcomingSkips: skips.filter((s) => s >= today).sort(),
    nextDeliveryDay: tomorrow,
    // The 8 PM lock, resolved on the server so the phone's clock cannot cheat it.
    canSkipNextDay: sub.status === 'active' && skipAllowed(tomorrow, today, hour),
    cutoffHour: 20,
    istHour: hour,
  };
}

function requireActive(sub: SubscriberRow): void {
  if (sub.status === 'pending_payment') {
    throw new HttpError(409, 'Your payment is not confirmed yet, so days cannot be skipped.');
  }
  if (sub.status !== 'active') {
    throw new HttpError(409, 'This subscription is not running right now.');
  }
}

async function skip(input: Record<string, unknown>) {
  const sub = await findByPhone(input.phone);
  requireActive(sub);

  const from = date(input.from, 'From date');
  const to = input.to === undefined || input.to === null ? from : date(input.to, 'To date');
  if (to < from) throw new HttpError(400, 'The end date is before the start date.');

  const today = istToday();
  const hour = istHour();
  const existing = await skipsFor(sub.id);
  const already = new Set(existing);

  const added: ISODate[] = [];
  const rejected: { date: ISODate; reason: 'cutoff' | 'weekend' | 'already' | 'before_start' }[] = [];

  for (let d = from, i = 0; d <= to && i <= MAX_SKIP_RANGE_DAYS; d = addDays(d, 1), i++) {
    if (i === MAX_SKIP_RANGE_DAYS) {
      throw new HttpError(400, `Please skip at most ${MAX_SKIP_RANGE_DAYS} days at a time.`);
    }
    if (d > addDays(today, MAX_SKIP_HORIZON_DAYS)) {
      throw new HttpError(400, 'That date is too far ahead.');
    }
    if (!isDeliveryDay(d)) continue; // weekends need no skip
    if (d < sub.start_date) rejected.push({ date: d, reason: 'before_start' });
    else if (already.has(d)) rejected.push({ date: d, reason: 'already' });
    else if (!skipAllowed(d, today, hour)) rejected.push({ date: d, reason: 'cutoff' });
    else added.push(d);
  }

  if (added.length) {
    await db.insert('skips', added.map((d) => ({ subscriber_id: sub.id, skip_date: d, reason: 'travel' })));
  }

  const skipsNow = [...existing, ...added];
  return {
    added,
    rejected,
    endDate: endDate(sub.start_date, sub.days_total, new Set(skipsNow)),
    daysRemaining: derive(sub, skipsNow, today).daysRemaining,
  };
}

async function unskip(input: Record<string, unknown>) {
  const sub = await findByPhone(input.phone);
  requireActive(sub);
  const d = date(input.date, 'Date');
  // Undoing is only fair while the same 8 PM lock still allows a change.
  if (!skipAllowed(d, istToday(), istHour())) {
    throw new HttpError(409, 'That day is already locked — the kitchen has started cooking.');
  }
  await db.remove('skips', `subscriber_id=eq.${sub.id}&skip_date=eq.${d}`);
  const skips = await skipsFor(sub.id);
  return {
    endDate: endDate(sub.start_date, sub.days_total, new Set(skips)),
    daysRemaining: derive(sub, skips).daysRemaining,
  };
}

export async function handlePublic(input: unknown): Promise<unknown> {
  const data = body(input);
  switch (data.action) {
    case 'menu':
      return menu();
    case 'subscribe':
      return subscribe(data);
    case 'payment_ref':
      return paymentRef(data);
    case 'lookup':
      return lookup(data);
    case 'skip':
      return skip(data);
    case 'unskip':
      return unskip(data);
    default:
      throw new HttpError(400, 'Unknown action.');
  }
}
