import type { Plugin } from 'vite';

const ROUTES = ['public', 'owner'] as const;

/**
 * Serves the /api functions during `npm run dev` so the app behaves the same
 * locally as it does on Vercel, without needing the Vercel CLI.
 */
export function devApi(): Plugin {
  return {
    name: 'ruchitva-dev-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url ?? '').split('?')[0];
        const route = ROUTES.find((r) => path === `/api/${r}`);
        if (!route) return next();

        const chunks: Buffer[] = [];
        req.on('data', (c: Buffer) => chunks.push(c));
        req.on('end', async () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          let body: unknown = {};
          try {
            body = raw ? JSON.parse(raw) : {};
          } catch {
            body = {};
          }

          const shim = {
            status(code: number) {
              res.statusCode = code;
              return shim;
            },
            json(data: unknown) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            },
          };

          try {
            const mod = await server.ssrLoadModule(`/api/${route}.ts`);
            await mod.default({ method: req.method, body, headers: req.headers }, shim);
          } catch (err) {
            server.config.logger.error(String(err));
            shim.status(500).json({ error: 'Dev API error — see the terminal.' });
          }
        });
      });
    },
  };
}
