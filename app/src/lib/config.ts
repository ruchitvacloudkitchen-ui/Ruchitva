const env = import.meta.env;

/** Owner's UPI collect ID, e.g. ruchitva@ybl. Set VITE_UPI_ID in Vercel. */
export const UPI_ID: string = env.VITE_UPI_ID ?? '';
export const UPI_PAYEE: string = env.VITE_UPI_PAYEE_NAME ?? 'Ruchitva Kitchen';

/** Owner's WhatsApp number in international form, no + and no spaces. */
export const OWNER_WHATSAPP: string = (env.VITE_OWNER_WHATSAPP ?? '919392564542').replace(/\D/g, '');

export function upiLink(amountInr: number, note: string): string {
  const params = new URLSearchParams({
    pa: UPI_ID,
    pn: UPI_PAYEE,
    am: String(amountInr),
    cu: 'INR',
    tn: note,
  });
  return `upi://pay?${params.toString()}`;
}

export function waLink(text: string, phone = OWNER_WHATSAPP): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

/** Customer phone numbers are stored as 10 digits; WhatsApp needs the 91. */
export function waNumber(tenDigits: string): string {
  return `91${tenDigits.replace(/\D/g, '').slice(-10)}`;
}

export function rupees(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}
