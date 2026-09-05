import { HttpError } from './db';

// Structural types for the Vercel Node request/response, so the project needs
// no extra dependency. The dev-server shim in dev-api-plugin.ts matches them.
export interface ApiRequest {
  method?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
}

export interface ApiResponse {
  status(code: number): ApiResponse;
  json(data: unknown): void;
}

export function header(req: ApiRequest, name: string): string | undefined {
  const v = req.headers[name] ?? req.headers[name.toLowerCase()];
  return Array.isArray(v) ? v[0] : v;
}

export async function run(
  req: ApiRequest,
  res: ApiResponse,
  work: () => Promise<unknown>,
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Use POST.' });
    return;
  }
  try {
    res.status(200).json(await work());
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
