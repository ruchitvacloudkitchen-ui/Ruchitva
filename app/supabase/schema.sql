-- Ruchitva subscriptions — full schema. Paste into the Supabase SQL editor and run.
-- Small by design: 40-60 subscribers, three tables plus the weekly menu.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- subscribers
create table if not exists subscribers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  phone         text not null,                       -- 10 digits, no +91
  address       text not null,
  landmark      text,
  building      text,                                -- apartment / office name
  plan          text not null check (plan in ('breakfast','breakfast_lunch')),
  price_inr     integer not null,
  start_date    date not null,
  days_total    integer not null default 22,         -- grows by 22 on each renewal
  cycles        integer not null default 1,
  status        text not null default 'pending_payment'
                check (status in ('pending_payment','active','paused','cancelled')),
  upi_ref       text,
  paid_at       timestamptz,
  paused_on     date,                                -- set while status = 'paused'
  source        text not null default 'web' check (source in ('web','manual')),
  notes         text,
  created_at    timestamptz not null default now()
);

create index if not exists subscribers_phone_idx  on subscribers (phone);
create index if not exists subscribers_status_idx on subscribers (status);

-- ---------------------------------------------------------------------- skips
-- One row per skipped delivery day. Skips push the end date out; the end date
-- itself is always computed from start_date + days_total + these rows.
create table if not exists skips (
  id            uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references subscribers (id) on delete cascade,
  skip_date     date not null,
  reason        text,                                -- 'travel' | 'paused' | null
  created_at    timestamptz not null default now(),
  unique (subscriber_id, skip_date)
);

create index if not exists skips_subscriber_idx on skips (subscriber_id);
create index if not exists skips_date_idx       on skips (skip_date);

-- ----------------------------------------------------------------- deliveries
-- Only written when the owner ticks "delivered" on the day's list.
create table if not exists deliveries (
  id            uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references subscribers (id) on delete cascade,
  delivery_date date not null,
  delivered     boolean not null default true,
  marked_at     timestamptz not null default now(),
  unique (subscriber_id, delivery_date)
);

create index if not exists deliveries_date_idx on deliveries (delivery_date);

-- ---------------------------------------------------------------- weekly menu
-- Edit these rows straight in the Supabase table editor; the site picks them up
-- with no redeploy. day_of_week: 1 = Monday … 5 = Friday.
create table if not exists weekly_menu (
  id            uuid primary key default gen_random_uuid(),
  day_of_week   integer not null check (day_of_week between 1 and 5),
  meal          text not null check (meal in ('breakfast','lunch')),
  item_te       text not null,
  item_en       text not null,
  sort_order    integer not null default 0
);

-- --------------------------------------------------------------------- access
-- The browser never talks to Postgres directly. Every read and write goes
-- through /api/*, which uses the service-role key on the server. RLS on with no
-- policies means a leaked anon key still exposes nothing.
alter table subscribers enable row level security;
alter table skips       enable row level security;
alter table deliveries  enable row level security;
alter table weekly_menu enable row level security;

-- ----------------------------------------------------------------- menu seed
insert into weekly_menu (day_of_week, meal, item_te, item_en, sort_order)
select * from (values
  (1, 'breakfast', 'రాగి దోశ + అల్లం చట్నీ',        'Ragi dosa + ginger chutney',      1),
  (2, 'breakfast', 'కొర్ర ఇడ్లీ + సాంబార్',          'Foxtail millet idli + sambar',    1),
  (3, 'breakfast', 'సజ్జ ఉప్మా + కొబ్బరి చట్నీ',      'Bajra upma + coconut chutney',    1),
  (4, 'breakfast', 'అరికెల పొంగల్ + గోంగూర పచ్చడి',  'Barnyard pongal + gongura pickle',1),
  (5, 'breakfast', 'జొన్న రొట్టె + వేరుశనగ చట్నీ',    'Jowar rotte + peanut chutney',    1),
  (1, 'lunch',     'చిరుధాన్యాల అన్నం + పప్పు + కూర', 'Millet rice + dal + curry',       1),
  (2, 'lunch',     'కొర్ర పులిహోర + మజ్జిగ',          'Foxtail lemon rice + buttermilk', 1),
  (3, 'lunch',     'రాగి సంకటి + నాటుకోడి చారు',      'Ragi sankati + country charu',    1),
  (4, 'lunch',     'చిరుధాన్యాల అన్నం + సాంబార్ + వేపుడు','Millet rice + sambar + fry',   1),
  (5, 'lunch',     'సజ్జ ఖిచిడీ + పెరుగు',            'Bajra khichdi + curd',            1)
) as seed
where not exists (select 1 from weekly_menu);
