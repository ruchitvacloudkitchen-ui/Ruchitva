import { HttpError } from './db';
import { isValidISODate, type ISODate } from '../../shared/date';
import { isPlanId, type PlanId } from '../../shared/plans';

export function body(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new HttpError(400, 'Expected a JSON object.');
  }
  return input as Record<string, unknown>;
}

export function str(v: unknown, field: string, max = 500): string {
  const s = typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : '';
  if (!s) throw new HttpError(400, `${field} is required.`);
  if (s.length > max) throw new HttpError(400, `${field} is too long.`);
  return s;
}

export function optionalStr(v: unknown, max = 500): string | null {
  const s = typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : '';
  return s ? s.slice(0, max) : null;
}

/** Accepts 9876543210, +91 98765 43210, 09876543210 — stores 10 digits. */
export function phone(v: unknown): string {
  let digits = (typeof v === 'string' ? v : '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  if (!/^[6-9]\d{9}$/.test(digits)) {
    throw new HttpError(400, 'Enter a valid 10-digit Indian mobile number.');
  }
  return digits;
}

export function date(v: unknown, field: string): ISODate {
  if (!isValidISODate(v)) throw new HttpError(400, `${field} must be a valid date.`);
  return v;
}

export function planId(v: unknown): PlanId {
  if (!isPlanId(v)) throw new HttpError(400, 'Choose a plan.');
  return v;
}

export function oneOf<T extends string>(v: unknown, allowed: readonly T[], field: string): T {
  if (typeof v !== 'string' || !allowed.includes(v as T)) {
    throw new HttpError(400, `${field} is not valid.`);
  }
  return v as T;
}
