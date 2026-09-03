const TOKEN_KEY = 'ruchitva_owner_token';

/** Fired when the owner session is rejected, so the shell can show the login. */
export const OWNER_SIGNED_OUT = 'ruchitva:owner-signed-out';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function post<T>(route: 'public' | 'owner', payload: object, token?: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/${route}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new ApiError(0, 'No internet connection. Please try again.');
  }

  const data = (await res.json().catch(() => null)) as { error?: string } | null;
  if (!res.ok) {
    throw new ApiError(res.status, data?.error ?? 'Something went wrong. Please try again.');
  }
  return data as T;
}

export function callPublic<T>(action: string, payload: object = {}): Promise<T> {
  return post<T>('public', { action, ...payload });
}

export const ownerToken = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* ignore */
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

export async function callOwner<T>(action: string, payload: object = {}): Promise<T> {
  const token = ownerToken.get() ?? undefined;
  try {
    return await post<T>('owner', { action, ...payload }, token);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      ownerToken.clear();
      window.dispatchEvent(new Event(OWNER_SIGNED_OUT));
    }
    throw err;
  }
}
