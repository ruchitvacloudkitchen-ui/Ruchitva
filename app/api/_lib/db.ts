// Thin wrapper over the Supabase REST (PostgREST) endpoint.
// Runs server-side only, with the service-role key. No client library needed.

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function config(): { url: string; key: string } {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new HttpError(500, 'Server is missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  }
  return { url: url.replace(/\/$/, ''), key };
}

async function rest<T>(path: string, init: RequestInit & { prefer?: string } = {}): Promise<T> {
  const { url, key } = config();
  const { prefer, ...rest } = init;
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...rest,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {}),
      ...(rest.headers as Record<string, string> | undefined),
    },
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new HttpError(res.status === 404 ? 500 : res.status, `Database error: ${detail.slice(0, 300)}`);
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const db = {
  /** `query` is a PostgREST query string, e.g. "status=eq.active&order=name". */
  select<T>(table: string, query = 'select=*'): Promise<T[]> {
    return rest<T[]>(`${table}?${query}`);
  },

  insert<T>(table: string, rows: unknown): Promise<T[]> {
    return rest<T[]>(table, {
      method: 'POST',
      body: JSON.stringify(rows),
      prefer: 'return=representation',
    });
  },

  upsert<T>(table: string, rows: unknown, onConflict: string): Promise<T[]> {
    return rest<T[]>(`${table}?on_conflict=${onConflict}`, {
      method: 'POST',
      body: JSON.stringify(rows),
      prefer: 'return=representation,resolution=merge-duplicates',
    });
  },

  update<T>(table: string, query: string, patch: unknown): Promise<T[]> {
    return rest<T[]>(`${table}?${query}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
      prefer: 'return=representation',
    });
  },

  remove(table: string, query: string): Promise<void> {
    return rest<void>(`${table}?${query}`, { method: 'DELETE' });
  },
};
