import { createHmac, timingSafeEqual } from 'node:crypto';
import { HttpError } from './db';

const SESSION_DAYS = 30;

function secret(): string {
  const s = process.env.OWNER_SESSION_SECRET || process.env.OWNER_PASSWORD;
  if (!s) throw new HttpError(500, 'Server is missing OWNER_PASSWORD.');
  return s;
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

function equal(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function checkPassword(password: unknown): void {
  const expected = process.env.OWNER_PASSWORD;
  if (!expected) throw new HttpError(500, 'Server is missing OWNER_PASSWORD.');
  if (typeof password !== 'string' || !equal(password, expected)) {
    throw new HttpError(401, 'Wrong password.');
  }
}

/** Stateless session token: expiry plus an HMAC over it. No session table. */
export function issueToken(): string {
  const exp = String(Date.now() + SESSION_DAYS * 86_400_000);
  return `${exp}.${sign(exp)}`;
}

export function requireOwner(authHeader: string | undefined): void {
  const token = (authHeader ?? '').replace(/^Bearer\s+/i, '');
  const [exp, mac] = token.split('.');
  if (!exp || !mac || !equal(mac, sign(exp))) throw new HttpError(401, 'Please sign in again.');
  if (Number(exp) < Date.now()) throw new HttpError(401, 'Session expired. Please sign in again.');
}
