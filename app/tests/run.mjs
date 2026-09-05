// Bundles each test file with esbuild (TypeScript, no test framework) and runs
// it in this process. `npm test`.
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SUITES = ['logic', 'api'];
const dir = await mkdtemp(join(tmpdir(), 'ruchitva-tests-'));
let failed = false;

for (const name of SUITES) {
  const outfile = join(dir, `${name}.mjs`);
  await build({
    entryPoints: [`tests/${name}.ts`],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile,
    logLevel: 'error',
  });
  console.log(`\n──────── ${name} ────────`);
  process.exitCode = 0;
  try {
    await import(pathToFileURL(outfile).href);
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  }
  if (process.exitCode !== 0) failed = true;
}

await rm(dir, { recursive: true, force: true });
process.exitCode = failed ? 1 : 0;
console.log(failed ? '\nSOME SUITES FAILED' : '\nEVERYTHING PASSED');
