// `npm run demo` — the whole app with sample data and no Supabase account.
// Starts an in-memory stand-in for the database, then Vite in demo mode.
import { build } from 'esbuild';
import { spawn } from 'node:child_process';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const dir = await mkdtemp(join(tmpdir(), 'ruchitva-demo-'));
const outfile = join(dir, 'demo-data.mjs');
await build({
  entryPoints: ['scripts/demo-data.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile,
  logLevel: 'error',
});
await import(pathToFileURL(outfile).href);

console.log('\n  Sign in at /owner with the password: demo');
console.log('  Look up a subscription with: 9876543210\n');

spawn('npx', ['vite', '--mode', 'demo'], { stdio: 'inherit', shell: false }).on('exit', (code) =>
  process.exit(code ?? 0),
);
