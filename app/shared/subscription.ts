import { addDays, isDeliveryDay, istToday, type ISODate } from './date';

export type Status = 'pending_payment' | 'active' | 'paused' | 'cancelled';

export interface SubscriptionCore {
  start_date: ISODate;
  /** Total weekday meal slots paid for, across all renewals. */
  days_total: number;
  status: Status;
}

/**
 * Everything about a subscription's calendar is derived from three things:
 * the start date, the number of days paid for, and the skipped dates.
 * Nothing is stored that can drift out of sync.
 */

const MAX_WALK = 800; // ~3 years of weekdays; a guard, never reached in practice

/**
 * The date of the last meal, counting only Mon-Fri and stepping over skips.
 * A skipped day therefore pushes the end date out by one delivery day.
 */
export function endDate(start: ISODate, daysTotal: number, skips: Set<ISODate>): ISODate {
  let counted = 0;
  let day = start;
  let last = start;
  for (let i = 0; i < MAX_WALK && counted < daysTotal; i++) {
    if (isDeliveryDay(day) && !skips.has(day)) {
      counted++;
      last = day;
    }
    if (counted < daysTotal) day = addDays(day, 1);
  }
  return last;
}

/** Meals already delivered: qualifying weekdays strictly before today. */
export function daysServed(
  start: ISODate,
  daysTotal: number,
  skips: Set<ISODate>,
  today: ISODate = istToday(),
): number {
  let served = 0;
  let day = start;
  for (let i = 0; i < MAX_WALK && day < today && served < daysTotal; i++) {
    if (isDeliveryDay(day) && !skips.has(day)) served++;
    day = addDays(day, 1);
  }
  return served;
}

export interface Derived {
  endDate: ISODate;
  daysServed: number;
  daysRemaining: number;
  skipsUsed: number;
  /** Is a meal going out on `today`? */
  deliveringToday: boolean;
}

export function derive(
  sub: SubscriptionCore,
  skipDates: ISODate[],
  today: ISODate = istToday(),
): Derived {
  const skips = new Set(skipDates);
  const end = endDate(sub.start_date, sub.days_total, skips);
  // Nothing has been delivered until the owner confirms the payment, so an
  // unpaid subscription never burns days while it waits.
  const served =
    sub.status === 'pending_payment'
      ? 0
      : daysServed(sub.start_date, sub.days_total, skips, today);
  return {
    endDate: end,
    daysServed: served,
    daysRemaining: Math.max(0, sub.days_total - served),
    skipsUsed: skipDates.filter((d) => d >= sub.start_date && d <= end).length,
    deliveringToday: isDeliveringOn(sub, skips, today, end),
  };
}

/** Does this subscription get a delivery on `date`? */
export function isDeliveringOn(
  sub: SubscriptionCore,
  skips: Set<ISODate>,
  date: ISODate,
  end?: ISODate,
): boolean {
  if (sub.status !== 'active') return false;
  if (!isDeliveryDay(date)) return false;
  if (date < sub.start_date) return false;
  if (skips.has(date)) return false;
  const last = end ?? endDate(sub.start_date, sub.days_total, skips);
  return date <= last;
}

/**
 * A skip for `date` must be in before 8 PM India time on the previous night.
 * `nowDate`/`nowHour` are India-time values supplied by the caller.
 */
export function skipAllowed(date: ISODate, nowDate: ISODate, nowHour: number): boolean {
  const cutoffDate = nowHour >= 20 ? addDays(nowDate, 2) : addDays(nowDate, 1);
  return date >= cutoffDate;
}
