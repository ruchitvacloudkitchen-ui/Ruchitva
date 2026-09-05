import { addDays, formatDate, isDeliveryDay, nextDeliveryDay, weekday } from '../shared/date';
import { derive, endDate, skipAllowed } from '../shared/subscription';

let fails = 0;
function eq(label: string, got: unknown, want: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}: got ${JSON.stringify(got)}${ok ? '' : ` want ${JSON.stringify(want)}`}`);
}

// 2026-09-07 is a Monday.
eq('Mon is a delivery day', isDeliveryDay('2026-09-07'), true);
eq('Sat is not', isDeliveryDay('2026-09-12'), false);
eq('Sun is not', isDeliveryDay('2026-09-13'), false);
eq('weekday(Mon)', weekday('2026-09-07'), 1);
eq('Sat rolls to Mon', nextDeliveryDay('2026-09-12'), '2026-09-14');

// 22 weekday meals from Mon 7 Sep, no skips: 22 weekdays = 4 weeks + 2 days
// Week1 7-11, W2 14-18, W3 21-25, W4 28-2 Oct, then 5 & 6 Oct.
eq('end date, no skips', endDate('2026-09-07', 22, new Set()), '2026-10-06');

// One skip pushes the end out by exactly one delivery day.
eq('one skip extends by a day', endDate('2026-09-07', 22, new Set(['2026-09-09'])), '2026-10-07');

// A skip on a weekend is irrelevant.
eq('weekend skip is inert', endDate('2026-09-07', 22, new Set(['2026-09-12'])), '2026-10-06');

// Five skips (a week of travel) push it out by a full week.
eq(
  'a travel week extends by a week',
  endDate('2026-09-07', 22, new Set(['2026-09-21','2026-09-22','2026-09-23','2026-09-24','2026-09-25'])),
  '2026-10-13',
);

// Renewal: days_total grows to 44, same start.
eq('renewal doubles the run', endDate('2026-09-07', 44, new Set()), '2026-11-05');

// Days served / remaining, viewed on Wed 9 Sep: Mon+Tue done, today not counted.
const sub = { start_date: '2026-09-07', days_total: 22, status: 'active' as const };
const d = derive(sub, [], '2026-09-09');
eq('served by Wed', d.daysServed, 2);
eq('remaining on Wed', d.daysRemaining, 20);
eq('delivering today', d.deliveringToday, true);

// Skipping today means no delivery today.
eq('skipped today = no delivery', derive(sub, ['2026-09-09'], '2026-09-09').deliveringToday, false);
// A skipped day is not consumed.
eq('skipped day not served', derive(sub, ['2026-09-08'], '2026-09-09').daysServed, 1);
// Start in the future: nothing served, no delivery.
eq('future start', derive(sub, [], '2026-09-01').daysServed, 0);
eq('future start, no delivery', derive(sub, [], '2026-09-01').deliveringToday, false);
// Paused/pending subscriptions never appear on a delivery run.
eq('paused = no delivery', derive({ ...sub, status: 'paused' }, [], '2026-09-09').deliveringToday, false);
eq('pending = no delivery', derive({ ...sub, status: 'pending_payment' }, [], '2026-09-09').deliveringToday, false);
// Past the end date, nothing goes out.
eq('after end, no delivery', derive(sub, [], '2026-10-07').deliveringToday, false);
eq('after end, zero remaining', derive(sub, [], '2026-10-07').daysRemaining, 0);

// The 8 PM lock. "Today" = Wed 9 Sep.
eq('7 PM: tomorrow is skippable', skipAllowed('2026-09-10', '2026-09-09', 19), true);
eq('8 PM: tomorrow is locked',   skipAllowed('2026-09-10', '2026-09-09', 20), false);
eq('9 PM: tomorrow is locked',   skipAllowed('2026-09-10', '2026-09-09', 21), false);
eq('8 PM: day after is open',    skipAllowed('2026-09-11', '2026-09-09', 20), true);
eq('7 AM: today is never skippable', skipAllowed('2026-09-09', '2026-09-09', 7), false);
eq('midnight: tomorrow is open', skipAllowed('2026-09-10', '2026-09-09', 0), true);

// Skips beyond the current end date still extend it (long holiday booked ahead).
eq(
  'far skip inside the extended run',
  endDate('2026-09-07', 22, new Set(['2026-10-05'])),
  '2026-10-07',
);

eq('addDays across a month', addDays('2026-09-30', 1), '2026-10-01');
eq('addDays across a year', addDays('2026-12-31', 1), '2027-01-01');
eq('formatDate', formatDate('2026-09-07', 'en'), 'Mon 7 Sep');

console.log(fails === 0 ? 'ALL PASS' : `${fails} FAILED`);
if (fails > 0) process.exitCode = 1;
