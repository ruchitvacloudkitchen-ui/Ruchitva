// Every date in this app is a plain YYYY-MM-DD string in India time.
// Arithmetic runs in UTC so it never shifts with the server's own timezone.

export const IST = 'Asia/Kolkata';

export type ISODate = string;

function parts(iso: ISODate): [number, number, number] {
  const [y, m, d] = iso.split('-').map(Number);
  return [y, m, d];
}

function toUTC(iso: ISODate): Date {
  const [y, m, d] = parts(iso);
  return new Date(Date.UTC(y, m - 1, d));
}

function fromUTC(dt: Date): ISODate {
  return dt.toISOString().slice(0, 10);
}

/** Today's date in India, whatever timezone this code is running in. */
export function istToday(): ISODate {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: IST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/** Hour of the clock in India, 0-23. Used for the 8 PM skip cutoff. */
export function istHour(): number {
  return Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: IST, hour: '2-digit', hour12: false }).format(
      new Date(),
    ),
  );
}

export function addDays(iso: ISODate, n: number): ISODate {
  const dt = toUTC(iso);
  dt.setUTCDate(dt.getUTCDate() + n);
  return fromUTC(dt);
}

export function daysBetween(from: ISODate, to: ISODate): number {
  return Math.round((toUTC(to).getTime() - toUTC(from).getTime()) / 86_400_000);
}

/** 0 = Sunday … 6 = Saturday */
export function weekday(iso: ISODate): number {
  return toUTC(iso).getUTCDay();
}

/** Ruchitva delivers Monday to Friday only. */
export function isDeliveryDay(iso: ISODate): boolean {
  const d = weekday(iso);
  return d >= 1 && d <= 5;
}

/** The next Monday-to-Friday date on or after `iso`. */
export function nextDeliveryDay(iso: ISODate): ISODate {
  let d = iso;
  for (let i = 0; i < 7; i++) {
    if (isDeliveryDay(d)) return d;
    d = addDays(d, 1);
  }
  return d;
}

export function isValidISODate(value: unknown): value is ISODate {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && fromUTC(toUTC(value)) === value;
}

const DAY_NAMES = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  te: ['ఆదివారం', 'సోమవారం', 'మంగళవారం', 'బుధవారం', 'గురువారం', 'శుక్రవారం', 'శనివారం'],
} as const;

const MONTH_NAMES = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  te: ['జన', 'ఫిబ్ర', 'మార్చి', 'ఏప్రి', 'మే', 'జూన్', 'జులై', 'ఆగ', 'సెప్టెం', 'అక్టో', 'నవం', 'డిసెం'],
} as const;

export function dayName(iso: ISODate, lang: 'en' | 'te' = 'en'): string {
  return DAY_NAMES[lang][weekday(iso)];
}

/** e.g. "Thu 4 Sep" */
export function formatDate(iso: ISODate, lang: 'en' | 'te' = 'en'): string {
  const [, m, d] = parts(iso);
  const short = lang === 'en' ? DAY_NAMES.en[weekday(iso)].slice(0, 3) : DAY_NAMES.te[weekday(iso)];
  return `${short} ${d} ${MONTH_NAMES[lang][m - 1]}`;
}

/** Day name from a 0-6 index, for the fixed Mon-Fri menu grid. */
export function weekdayName(dow: number, lang: 'en' | 'te' = 'en'): string {
  return DAY_NAMES[lang][dow];
}
