// A very small stand-in for the PostgREST endpoint: just the filters, ordering
// and inserts that api/_lib/*.ts actually use. It lets the handlers run end to
// end in a test without a live Supabase project.

type Row = Record<string, unknown>;

const DEFAULTS: Record<string, Row> = {
  subscribers: {
    days_total: 22,
    cycles: 1,
    status: 'pending_payment',
    source: 'web',
    landmark: null,
    building: null,
    upi_ref: null,
    paid_at: null,
    paused_on: null,
    notes: null,
  },
  skips: { reason: null },
  deliveries: { delivered: true },
  weekly_menu: { sort_order: 0 },
};

export class FakeSupabase {
  tables: Record<string, Row[]> = {
    subscribers: [],
    skips: [],
    deliveries: [],
    weekly_menu: [],
  };
  private seq = 0;

  install(): void {
    process.env.SUPABASE_URL = 'https://fake.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'fake-service-role-key';
    globalThis.fetch = ((url: string, init: RequestInit = {}) =>
      Promise.resolve(this.request(url, init))) as unknown as typeof fetch;
  }

  seed(table: string, rows: Row[]): void {
    for (const row of rows) this.insertOne(table, row);
  }

  private insertOne(table: string, row: Row): Row {
    const full = { id: `id-${++this.seq}`, created_at: new Date(this.seq).toISOString(), ...DEFAULTS[table], ...row };
    this.tables[table].push(full);
    return full;
  }

  /** Public so a local demo server can reuse the same emulator. */
  request(url: string, init: RequestInit): Response {
    const { pathname, searchParams } = new URL(url);
    const table = pathname.replace('/rest/v1/', '');
    if (!this.tables[table]) return json(404, { message: `no table ${table}` });

    const method = (init.method ?? 'GET').toUpperCase();
    const body = init.body ? JSON.parse(String(init.body)) : undefined;

    if (method === 'POST') {
      const rows: Row[] = Array.isArray(body) ? body : [body];
      const onConflict = searchParams.get('on_conflict');
      const out = rows.map((row) => {
        if (onConflict) {
          const keys = onConflict.split(',');
          const existing = this.tables[table].find((r) => keys.every((k) => r[k] === row[k]));
          if (existing) return Object.assign(existing, row);
        }
        const keys = uniqueKeys(table);
        if (keys && this.tables[table].some((r) => keys.every((k) => r[k] === row[k]))) {
          return json(409, { message: 'duplicate key value violates unique constraint' }) as never;
        }
        return this.insertOne(table, row);
      });
      if (out.some((r) => r instanceof Response)) {
        return json(409, { message: 'duplicate key value violates unique constraint' });
      }
      return json(200, out);
    }

    const matched = this.query(table, searchParams);

    if (method === 'PATCH') {
      for (const row of matched) Object.assign(row, body);
      return json(200, matched);
    }
    if (method === 'DELETE') {
      this.tables[table] = this.tables[table].filter((r) => !matched.includes(r));
      return new Response(null, { status: 204 });
    }
    return json(200, matched);
  }

  private query(table: string, params: URLSearchParams): Row[] {
    let rows = [...this.tables[table]];

    for (const [key, raw] of params.entries()) {
      if (['select', 'order', 'limit', 'on_conflict'].includes(key)) continue;
      const [op, ...rest] = raw.split('.');
      const value = rest.join('.');
      rows = rows.filter((row) => {
        const cell = row[key];
        if (op === 'eq') return String(cell) === value;
        if (op === 'neq') return String(cell) !== value;
        if (op === 'in') {
          const list = value.replace(/^\(|\)$/g, '').split(',');
          return list.includes(String(cell));
        }
        throw new Error(`fake supabase: unsupported operator "${op}"`);
      });
    }

    const order = params.get('order');
    if (order) {
      for (const clause of order.split(',').reverse()) {
        const [field, dir] = clause.split('.');
        rows.sort((a, b) => {
          const cmp = String(a[field] ?? '').localeCompare(String(b[field] ?? ''));
          return dir === 'desc' ? -cmp : cmp;
        });
      }
    }

    const limit = params.get('limit');
    return limit ? rows.slice(0, Number(limit)) : rows;
  }
}

function uniqueKeys(table: string): string[] | null {
  if (table === 'skips') return ['subscriber_id', 'skip_date'];
  if (table === 'deliveries') return ['subscriber_id', 'delivery_date'];
  return null;
}

function json(status: number, data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
