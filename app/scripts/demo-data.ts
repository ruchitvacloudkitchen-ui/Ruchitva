// Sample data for `npm run demo`: a throwaway stand-in for Supabase so the
// whole app can be clicked through without creating an account.
// It reuses the same PostgREST test double the test suite runs against.

import { createServer } from 'node:http';
import { FakeSupabase } from '../tests/fake-supabase';
import { addDays, istToday, nextDeliveryDay } from '../shared/date';

const PORT = 5401;
const fake = new FakeSupabase();
const today = istToday();

fake.seed('weekly_menu', [
  { day_of_week: 1, meal: 'breakfast', item_te: 'రాగి దోశ + అల్లం చట్నీ', item_en: 'Ragi dosa + ginger chutney' },
  { day_of_week: 2, meal: 'breakfast', item_te: 'కొర్ర ఇడ్లీ + సాంబార్', item_en: 'Foxtail millet idli + sambar' },
  { day_of_week: 3, meal: 'breakfast', item_te: 'సజ్జ ఉప్మా + కొబ్బరి చట్నీ', item_en: 'Bajra upma + coconut chutney' },
  { day_of_week: 4, meal: 'breakfast', item_te: 'అరికెల పొంగల్ + గోంగూర పచ్చడి', item_en: 'Barnyard pongal + gongura pickle' },
  { day_of_week: 5, meal: 'breakfast', item_te: 'జొన్న రొట్టె + వేరుశనగ చట్నీ', item_en: 'Jowar rotte + peanut chutney' },
  { day_of_week: 1, meal: 'lunch', item_te: 'చిరుధాన్యాల అన్నం + పప్పు + కూర', item_en: 'Millet rice + dal + curry' },
  { day_of_week: 3, meal: 'lunch', item_te: 'రాగి సంకటి + నాటుకోడి చారు', item_en: 'Ragi sankati + country charu' },
  { day_of_week: 5, meal: 'lunch', item_te: 'సజ్జ ఖిచిడీ + పెరుగు', item_en: 'Bajra khichdi + curd' },
]);

const start = nextDeliveryDay(addDays(today, -14));

fake.seed('subscribers', [
  {
    name: 'Lakshmi Devi', phone: '9876543210',
    address: 'Flat 302, Sai Enclave, Kompally 500014',
    building: 'Sai Enclave', landmark: 'Near Vasavi School',
    plan: 'breakfast', price_inr: 2800,
    start_date: start, days_total: 22, status: 'active', paid_at: new Date().toISOString(),
  },
  {
    name: 'Ravi Kumar', phone: '9812345670',
    address: 'Office 4, 2nd floor, Tech Park, Kompally',
    building: 'Tech Park', landmark: 'Opposite Bharat petrol pump',
    plan: 'breakfast_lunch', price_inr: 4800,
    start_date: start, days_total: 22, status: 'active', paid_at: new Date().toISOString(),
    notes: 'Gate code 1234, leave at reception',
  },
  {
    name: 'Srinivas Reddy', phone: '9701122334',
    address: 'H.No 8-4-21, Vivekananda Colony, Kompally',
    landmark: 'Beside water tank',
    plan: 'breakfast', price_inr: 2800,
    start_date: start, days_total: 22, status: 'active', source: 'manual',
    paid_at: new Date().toISOString(),
  },
  {
    // Waiting on the owner to confirm a UPI payment.
    name: 'Padma Jyothi', phone: '9640055123',
    address: 'Flat B-104, Aparna Cyber Life, Kompally',
    building: 'Aparna Cyber Life', landmark: 'Gate 2',
    plan: 'breakfast', price_inr: 2800,
    start_date: nextDeliveryDay(today), days_total: 22,
    status: 'pending_payment', upi_ref: '412345678901',
  },
  {
    // Nearly out of days, so the renewals screen has something in it.
    name: 'Anil Varma', phone: '9553311220',
    address: 'Plot 44, Suchitra Circle, Kompally',
    landmark: 'Near Suchitra X roads',
    plan: 'breakfast_lunch', price_inr: 4800,
    start_date: nextDeliveryDay(addDays(today, -20)), days_total: 15,
    status: 'active', paid_at: new Date().toISOString(),
  },
]);

// Lakshmi is travelling for two days next week; Srinivas is skipping tomorrow,
// so the cook count and the delivery list disagree in an instructive way.
const lakshmi = fake.tables.subscribers[0];
const skip1 = nextDeliveryDay(addDays(today, 3));
fake.seed('skips', [
  { subscriber_id: lakshmi.id, skip_date: skip1, reason: 'travel' },
  { subscriber_id: lakshmi.id, skip_date: nextDeliveryDay(addDays(skip1, 1)), reason: 'travel' },
  {
    subscriber_id: fake.tables.subscribers[2].id,
    skip_date: nextDeliveryDay(addDays(today, 1)),
    reason: 'travel',
  },
]);

createServer(async (req, res) => {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  const raw = Buffer.concat(chunks).toString('utf8');
  const out = fake.request(`http://demo${req.url}`, { method: req.method, body: raw || undefined });
  res.statusCode = out.status;
  res.setHeader('Content-Type', 'application/json');
  res.end(await out.text());
}).listen(PORT, () => console.log(`  demo data (in memory, not saved) on :${PORT}`));
