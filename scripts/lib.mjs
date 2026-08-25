import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Same naming as scripts/lib.sh: worker and Sentry environment are `repro-<run>-cache-<on|off>`.
export function runTarget([run, cache = 'on']) {
  if (!run || !['on', 'off'].includes(cache)) {
    console.error('usage: <script> <run-id> [on|off]');
    process.exit(2);
  }
  const worker = `repro-${run}-cache-${cache}`;
  return { run, cache: cache === 'on', worker, environment: worker, get window() { return readWindow(worker); } };
}

export function workerUrl(worker) {
  if (process.env.WORKER_URL) {
    return process.env.WORKER_URL.replace(/\/$/, '');
  }
  const subdomain = process.env.WORKERS_SUBDOMAIN;
  if (!subdomain) {
    console.error('set WORKERS_SUBDOMAIN (https://<worker>.<subdomain>.workers.dev)');
    process.exit(2);
  }
  return `https://${worker}.${subdomain}.workers.dev`;
}

export function windowFile(worker) {
  return join(root, 'runs', `${worker}.window`);
}

function readWindow(worker) {
  const file = windowFile(worker);
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    console.error(`no ${file}: run scripts/load.mjs first`);
    process.exit(2);
  }
  const from = /^START (\S+)/m.exec(text)?.[1];
  const to = /^END (\S+)/m.exec(text)?.[1];
  if (!from || !to) {
    console.error(`${file} has no START/END lines`);
    process.exit(2);
  }
  return { from, to };
}
