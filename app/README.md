# Ruchitva — subscription manager

A small web app for one millet breakfast cloud kitchen in Kompally, Hyderabad.
Built for 40–60 subscribers, not for scale: two API endpoints, four tables, six
owner screens, no accounts, no payment gateway.

- **Customer side** (public, no login) — Telugu by default with an EN/తె toggle:
  landing page with the week's menu and both plans, a subscribe form, a UPI QR
  payment step, and a "my subscription" page reached with just a phone number.
- **Owner side** (`/owner`, one shared password) — English: cook count, today's
  delivery run, subscribers, manual intake, renewals due.

## Plans

| Plan | Price | What it is |
|---|---|---|
| Breakfast | ₹2,800 / month | 22 weekday breakfasts |
| Breakfast + lunch | ₹4,800 / month | 22 weekday breakfasts and lunches |

Paid upfront by UPI. Delivered Monday to Friday morning within 5 km of Kompally.

## How the calendar works

Nothing about a subscription's dates is stored twice, so nothing can drift.
Three facts are saved — `start_date`, `days_total`, and one row per skipped day
— and everything else is computed from them (`shared/subscription.ts`):

- **End date** — walk forward from the start date, counting only Mon–Fri and
  stepping over skipped days, until `days_total` meals are counted.
- **Days remaining** — `days_total` minus the qualifying weekdays that have
  already passed. Today's meal counts as remaining until the day is over.
- **A skip therefore extends the end date by exactly one delivery day**, which
  is the promise made to the customer.
- **Renewal** adds another 22 to `days_total` on the same calendar, so the
  end date simply moves out a month.
- **Pause** stops deliveries; on resume, every weekday lost to the pause is
  written back as a skip, so no paid day is lost.
- **Skips lock at 8 PM** the previous night, checked on the server in India
  time so a phone with a wrong clock cannot get past it.

## Setup

### 1. Supabase

Create a project, open the SQL editor, and run [`supabase/schema.sql`](supabase/schema.sql).
It creates the four tables, enables row level security with no policies, and
seeds a starter menu.

The browser never talks to Postgres. Every read and write goes through
`/api/*`, which uses the service-role key server-side — so RLS with no policies
is exactly right: a leaked key exposes nothing.

### 2. Environment variables

Copy `.env.example` to `.env` for local work, and set the same values in Vercel
(Project → Settings → Environment Variables).

| Variable | Where it lives | What it is |
|---|---|---|
| `SUPABASE_URL` | server | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | server | Settings → API → `service_role` |
| `OWNER_PASSWORD` | server | The single shared kitchen password |
| `OWNER_SESSION_SECRET` | server | Optional. Signs owner sessions, so changing the password does not sign the owner out |
| `VITE_UPI_ID` | browser | The UPI ID the QR pays into, e.g. `ruchitva@ybl` |
| `VITE_UPI_PAYEE_NAME` | browser | Name shown in the customer's UPI app |
| `VITE_OWNER_WHATSAPP` | browser | Country code + number, digits only |

`VITE_*` variables are compiled into the page and are public by design. The
password and the service-role key never are.

### 3. Local development

```bash
npm install
npm run dev      # http://localhost:5173 — serves the app and /api together
npm test         # subscription maths and both API handlers
npm run build
```

`npm run dev` runs the same API handlers Vercel will run, through a small Vite
middleware (`dev-api-plugin.ts`), so there is no separate backend to start.

### 4. Deploy to Vercel

This app lives in the `app/` folder of the repository, alongside the existing
marketing site, so point Vercel at it:

1. Import the repository, then set **Root Directory** to `app`.
2. Framework preset: Vite. Build and output settings are detected.
3. Add the environment variables above.
4. Add the custom domain (a subdomain such as `subscribe.ruchitvakitchen.com`
   keeps it separate from the main site).

`api/public.ts` and `api/owner.ts` are deployed as two serverless functions.

## Editing the weekly menu

Open the `weekly_menu` table in the Supabase table editor and edit the rows.
`day_of_week` is 1 (Monday) to 5 (Friday), `meal` is `breakfast` or `lunch`, and
each row carries both the Telugu and English name. The landing page picks up
changes with no redeploy. If the table cannot be read, the page falls back to
the list in `src/lib/menuFallback.ts` rather than showing an empty menu.

## Owner screens

Every screen is one tap from `/owner`. There are no sub-menus.

| Screen | What it does |
|---|---|
| **Cook count** | Giant numbers for the next delivery day's breakfasts and lunches, net of skips, with today's counts underneath. Built to be read at 5 AM. |
| **Today** | The delivery run: name, apartment, address, landmark, phone, plan, a tap-to-call and tap-to-WhatsApp link, and a delivered tick that saves as you go. |
| **Subscribers** | Search by name or phone; mark payment received, renew, pause, resume, cancel. |
| **Add subscriber** | Manual intake, since most people sign up over WhatsApp. Defaults to "payment already received". |
| **Renewals due** | Everything ending within 7 days, soonest first, each with a one-tap WhatsApp reminder that already contains the name, end date, amount and UPI ID. |

## Security notes

- One shared password, checked server-side with a constant-time comparison. A
  successful sign-in returns an HMAC-signed token holding only an expiry, so
  there is no session table to keep.
- The customer's "my subscription" page takes a phone number and no password,
  as specified. It deliberately returns only what that page shows — name, plan,
  days, end date, skips — and never the address.
- Skip timing, prices, plan days and the 8 PM cutoff are all decided on the
  server. The browser cannot talk itself into a different answer.

## Deliberately not built

No customer login, OTP or accounts. No payment gateway. No cart or per-item
ordering. No charts or analytics. No ratings, reviews or chat. No email —
WhatsApp deep links only. No roles beyond the one password. No nested menus. No
native app or PWA.
