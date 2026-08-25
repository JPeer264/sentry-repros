// Run scripts/load.yml against one deployed worker and record the UTC window for cpu.mjs.
//
// usage: node scripts/load.mjs <run-id> [on|off]
// env:   WORKERS_SUBDOMAIN
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { runTarget, root, workerUrl, windowFile } from './lib.mjs';

const { run, worker } = runTarget(process.argv.slice(2));
const base = workerUrl(worker);

// Three consecutive HTTP 200 /health responses: the route of a fresh worker needs a moment to propagate.
let ok = 0;
for (let attempt = 0; attempt < 20 && ok < 3; attempt++) {
  let status = 0;
  try {
    status = (await fetch(`${base}/health`, { signal: AbortSignal.timeout(10_000) })).status;
  } catch {
    // not reachable yet
  }
  ok = status === 200 ? ok + 1 : 0;
  if (ok < 3) await new Promise(resolve => setTimeout(resolve, 3000));
}
if (ok < 3) {
  console.error(`${base}/health never answered three consecutive HTTP 200`);
  process.exit(1);
}

mkdirSync(`${root}/runs`, { recursive: true });
const stamp = () => new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
const from = stamp();

const artillery = spawnSync(
  'npx',
  [
    'artillery',
    'run',
    `${root}/scripts/load.yml`,
    '--target',
    base,
    '--variables',
    JSON.stringify({ run }),
    '--output',
    `${root}/runs/${worker}.artillery.json`,
  ],
  { stdio: 'inherit' },
);

writeFileSync(windowFile(worker), `START ${from}\nEND ${stamp()}\n`);
if (artillery.status !== 0) {
  console.error('load failed: see the Artillery report above (non-200 responses fail the run)');
  process.exit(artillery.status ?? 1);
}
console.log(`sent 100 requests to ${base}`);
