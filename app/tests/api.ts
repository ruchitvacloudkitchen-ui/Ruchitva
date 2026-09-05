// End-to-end exercise of the two API handlers against the fake PostgREST.
// Dates are derived from the real clock so the run is not brittle on a weekend.

import { FakeSupabase } from './fake-supabase';
import { addDays, isDeliveryDay, istToday, nextDeliveryDay } from '../shared/date';

process.env.OWNER_PASSWORD = 'test-password';

const fake = new FakeSupabase();
fake.install();

const { handlePublic } = await import('../api/_lib/public');
const { handleOwner } = await import('../api/_lib/owner');

let fails = 0;
function check(label: string, ok: boolean, detail?: unknown) {
  if (!ok) fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${ok || detail === undefined ? '' : ` — ${JSON.stringify(detail)}`}`);
}
function eq(label: string, got: unknown, want: unknown) {
  check(label, JSON.stringify(got) === JSON.stringify(want), { got, want });
}
async function fails_with(label: string, status: number, run: () => Promise<unknown>) {
  try {
    await run();
    check(label, false, 'no error thrown');
  } catch (err) {
    const got = (err as { status?: number }).status;
    check(label, got === status, { got, want: status });
  }
}

const today = istToday();
const start = nextDeliveryDay(today);
const anyPublic = (payload: object) => handlePublic(payload) as Promise<any>;
const owner = (payload: object, token = TOKEN) => handleOwner(payload, `Bearer ${token}`) as Promise<any>;
let TOKEN = '';

// ------------------------------------------------------------------- menu
fake.seed('weekly_menu', [
  { day_of_week: 1, meal: 'breakfast', item_te: 'రాగి దోశ', item_en: 'Ragi dosa' },
  { day_of_week: 1, meal: 'lunch', item_te: 'అన్నం', item_en: 'Millet rice' },
]);
const menu = await anyPublic({ action: 'menu' });
eq('menu returns five weekdays', menu.days.length, 5);
eq('monday breakfast is present', menu.days[0].breakfast[0].item_en, 'Ragi dosa');

// -------------------------------------------------------------- subscribe
const created = await anyPublic({
  action: 'subscribe',
  name: 'Lakshmi Devi',
  phone: '+91 98765 43210',
  address: 'Flat 302, Sai Enclave, Kompally 500014',
  building: 'Sai Enclave',
  landmark: 'Near Vasavi School',
  plan: 'breakfast',
  start_date: today,
});
eq('phone is normalised to ten digits', created.phone, '9876543210');
eq('price comes from the plan table', created.priceInr, 2800);
eq('start date snaps to a delivery day', created.startDate, start);

const stored = fake.tables.subscribers[0];
eq('stored as pending payment', stored.status, 'pending_payment');
eq('cycles defaults to one', stored.cycles, 1);
eq('days_total is 22', stored.days_total, 22);

await fails_with('a second subscription on one number is refused', 409, () =>
  anyPublic({ action: 'subscribe', name: 'X', phone: '9876543210', address: 'a', plan: 'breakfast', start_date: today }),
);
await fails_with('a bad phone number is refused', 400, () =>
  anyPublic({ action: 'subscribe', name: 'X', phone: '12345', address: 'a', plan: 'breakfast', start_date: today }),
);
await fails_with('an unknown plan is refused', 400, () =>
  anyPublic({ action: 'subscribe', name: 'X', phone: '9000000001', address: 'a', plan: 'dinner', start_date: today }),
);

// ------------------------------------------------------------------ lookup
let mine = await anyPublic({ action: 'lookup', phone: '9876543210' });
eq('lookup finds the subscription', mine.name, 'Lakshmi Devi');
eq('pending subscriptions show 22 days', mine.daysRemaining, 22);
eq('lookup hides the address', 'address' in mine, false);
await fails_with('an unknown number returns not-found', 404, () =>
  anyPublic({ action: 'lookup', phone: '9000000009' }),
);

// ------------------------------------------------------------- payment ref
await anyPublic({ action: 'payment_ref', id: created.id, upi_ref: '412345678901' });
eq('the UPI reference is stored', fake.tables.subscribers[0].upi_ref, '412345678901');

await fails_with('skips are blocked before payment is confirmed', 409, () =>
  anyPublic({ action: 'skip', phone: '9876543210', from: addDays(today, 10) }),
);

// -------------------------------------------------------------- owner auth
await fails_with('the wrong password is rejected', 401, () =>
  handleOwner({ action: 'login', password: 'guess' }, undefined),
);
await fails_with('owner data needs a token', 401, () => handleOwner({ action: 'today' }, undefined));
await fails_with('a forged token is rejected', 401, () =>
  handleOwner({ action: 'today' }, 'Bearer 99999999999999.deadbeef'),
);
TOKEN = (await handleOwner({ action: 'login', password: 'test-password' }, undefined) as any).token;
check('the right password issues a token', TOKEN.includes('.'));

// ------------------------------------------------------------- mark paid
await owner({ action: 'update_subscriber', id: created.id, op: 'mark_paid' });
eq('marking paid activates the subscription', fake.tables.subscribers[0].status, 'active');
check('paid_at is recorded', Boolean(fake.tables.subscribers[0].paid_at));

// ------------------------------------------------------ today and counts
const expectToday = isDeliveryDay(today) ? 1 : 0;
let day = await owner({ action: 'today' });
eq("today's list matches the calendar", day.rows.length, expectToday);
eq('breakfast count agrees with the list', day.counts.breakfasts, expectToday);
eq('a breakfast-only plan cooks no lunch', day.counts.lunches, 0);
if (expectToday) {
  eq('the delivery row carries the address', day.rows[0].address, 'Flat 302, Sai Enclave, Kompally 500014');
  eq('the delivery row carries the landmark', day.rows[0].landmark, 'Near Vasavi School');
  eq('nothing is ticked yet', day.rows[0].delivered, false);

  await owner({ action: 'mark_delivered', id: created.id, date: today, delivered: true });
  day = await owner({ action: 'today' });
  eq('the tick sticks', day.rows[0].delivered, true);

  await owner({ action: 'mark_delivered', id: created.id, date: today, delivered: false });
  day = await owner({ action: 'today' });
  eq('un-ticking sticks too', day.rows[0].delivered, false);
  eq('un-ticking does not duplicate the row', fake.tables.deliveries.length, 1);
}

const counts = await owner({ action: 'counts' });
eq('the cook screen looks at the next delivery day', counts.next.date, nextDeliveryDay(addDays(today, 1)));
eq('one active breakfast subscriber', counts.next.breakfasts, 1);

// ---------------------------------------------------------------- skipping
const target = nextDeliveryDay(addDays(today, 10));
const before = (await anyPublic({ action: 'lookup', phone: '9876543210' })).endDate;
const skipped = await anyPublic({ action: 'skip', phone: '9876543210', from: target });
eq('one day is skipped', skipped.added, [target]);
eq('the end date moves out by one delivery day', skipped.endDate, nextDeliveryDay(addDays(before, 1)));
eq('the skip is stored once', fake.tables.skips.length, 1);

const again = await anyPublic({ action: 'skip', phone: '9876543210', from: target });
eq('skipping the same day twice adds nothing', again.added, []);
eq('and says why', again.rejected[0].reason, 'already');

const range = await anyPublic({
  action: 'skip',
  phone: '9876543210',
  from: addDays(target, 1),
  to: addDays(target, 6),
});
check('a range skips only weekdays', range.added.every((d: string) => isDeliveryDay(d)), range.added);
await fails_with('a backwards range is refused', 400, () =>
  anyPublic({ action: 'skip', phone: '9876543210', from: addDays(today, 20), to: addDays(today, 10) }),
);
await fails_with('a far-future skip is refused', 400, () =>
  anyPublic({ action: 'skip', phone: '9876543210', from: addDays(today, 200) }),
);

mine = await anyPublic({ action: 'lookup', phone: '9876543210' });
eq('skipped days are listed back', mine.upcomingSkips.includes(target), true);
eq('skips do not consume paid days', mine.daysRemaining, 22);

await anyPublic({ action: 'unskip', phone: '9876543210', date: target });
eq('undo removes the skip', fake.tables.skips.some((s) => s.skip_date === target), false);

// --------------------------------------------------------- manual intake
const manual = await owner({
  action: 'add_subscriber',
  name: 'Ravi Kumar',
  phone: '9000000002',
  address: 'Office 4, Tech Park, Kompally',
  plan: 'breakfast_lunch',
  start_date: today,
  paid: true,
  notes: 'Gate code 1234',
});
const ravi = fake.tables.subscribers.find((s) => s.phone === '9000000002')!;
eq('a manual subscriber starts active', ravi.status, 'active');
eq('the manual source is recorded', ravi.source, 'manual');
eq('the lunch plan price applies', ravi.price_inr, 4800);
await fails_with('a duplicate number is refused at intake too', 409, () =>
  owner({ action: 'add_subscriber', name: 'Dup', phone: '9000000002', address: 'a', plan: 'breakfast', start_date: today }),
);

const withLunch = await owner({ action: 'counts' });
eq('breakfast count now covers both plans', withLunch.next.breakfasts, 2);
eq('only the combo plan adds a lunch', withLunch.next.lunches, 1);

// ------------------------------------------------------------ search list
let list = await owner({ action: 'subscribers' });
eq('both subscribers are listed', list.rows.length, 2);
list = await owner({ action: 'subscribers', q: 'ravi' });
eq('search by name works', list.rows.length, 1);
list = await owner({ action: 'subscribers', q: '43210' });
eq('search by phone fragment works', list.rows[0].name, 'Lakshmi Devi');
list = await owner({ action: 'subscribers', q: 'zzz' });
eq('a search with no match returns nothing', list.rows.length, 0);

// --------------------------------------------------------- pause / resume
await owner({ action: 'update_subscriber', id: manual.id, op: 'pause' });
eq('pausing stops the deliveries', (await owner({ action: 'counts' })).next.breakfasts, 1);

// Backdate the pause so resuming has days to credit back.
const pausedFrom = addDays(today, -9);
ravi.paused_on = pausedFrom;
ravi.start_date = addDays(today, -20);
await owner({ action: 'update_subscriber', id: manual.id, op: 'resume' });
eq('resuming reactivates', ravi.status, 'active');
eq('the pause is cleared', ravi.paused_on, null);
const credited = fake.tables.skips.filter((s) => s.subscriber_id === manual.id);
check('paused days are credited back as skips', credited.length > 0, credited.length);
check(
  'only weekdays are credited',
  credited.every((s) => isDeliveryDay(String(s.skip_date))),
);
check(
  'nothing before the pause is credited',
  credited.every((s) => String(s.skip_date) >= pausedFrom),
);

// ---------------------------------------------------------------- renewal
const daysBefore = Number(fake.tables.subscribers[0].days_total);
await owner({ action: 'update_subscriber', id: created.id, op: 'renew' });
eq('a renewal buys another 22 days', fake.tables.subscribers[0].days_total, daysBefore + 22);
eq('and counts as the second month', fake.tables.subscribers[0].cycles, 2);

// --------------------------------------------------------------- renewals
const soon = await owner({ action: 'renewals' });
check('the renewal list only looks 7 days out', soon.rows.every((r: any) => r.endDate <= soon.horizon), soon.rows);

// Force one subscription to end inside the window.
fake.tables.subscribers[0].days_total = 1;
fake.tables.subscribers[0].start_date = today;
const due = await owner({ action: 'renewals' });
check('a subscription ending this week shows up', due.rows.some((r: any) => r.id === created.id), due.rows);

// ------------------------------------------------------------------ cancel
await owner({ action: 'update_subscriber', id: created.id, op: 'cancel' });
eq('cancelling stops deliveries', (await owner({ action: 'today' })).rows.every((r: any) => r.id !== created.id), true);
await fails_with('a cancelled number has no live subscription', 404, () =>
  anyPublic({ action: 'lookup', phone: '9876543210' }),
);

// ------------------------------------------------- a late payment confirmation
fake.seed('subscribers', [{
  name: 'Late Payer', phone: '9000000003', address: 'Plot 9, Kompally',
  plan: 'breakfast', price_inr: 2800,
  start_date: addDays(today, -10), days_total: 22, status: 'pending_payment',
}]);
const late = fake.tables.subscribers.find((s) => s.phone === '9000000003')!;
eq(
  'an unpaid subscription burns no days while it waits',
  (await anyPublic({ action: 'lookup', phone: '9000000003' })).daysRemaining,
  22,
);
await owner({ action: 'update_subscriber', id: late.id, op: 'mark_paid' });
eq('confirming a late payment moves the start date up', late.start_date, nextDeliveryDay(today));
eq(
  'so the customer still gets a full month',
  (await anyPublic({ action: 'lookup', phone: '9000000003' })).daysRemaining,
  22,
);

await fails_with('an unknown action is refused', 400, () => anyPublic({ action: 'nonsense' }));
await fails_with('an unknown owner action is refused', 400, () => owner({ action: 'nonsense' }));

console.log(fails === 0 ? 'ALL PASS' : `${fails} FAILED`);
if (fails > 0) process.exitCode = 1;
