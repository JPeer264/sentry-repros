// Check in Sentry that every request of load.sh delivered exactly what it should. Polls until it
// passes (ingestion lag), or gives up after two identical results or ~6 minutes.
//
// usage: node scripts/validate.mjs <run-id> [on|off]
// env:   SENTRY_TARGET=<org>/<project>; the `sentry` CLI must be logged in to that org.
import { execFileSync } from 'node:child_process';
import { runTarget } from './lib.mjs';

const target = process.env.SENTRY_TARGET;
if (!target) {
  console.error('set SENTRY_TARGET=<org>/<project>');
  process.exit(2);
}

const { run, cache, environment } = runTarget(process.argv.slice(2));
const ids = kind => Array.from({ length: kind === 'burst' ? 50 : 25 }, (_, i) => `${run}-${kind}-${String(i + 1).padStart(3, '0')}`);

function explore({ dataset, fields, query = '', metric }) {
  const args = ['explore', target, '--dataset', dataset];
  if (metric) args.push('--metric', metric);
  for (const field of fields) args.push('--field', field);
  args.push('--query', `environment:${environment}${query ? ` AND ${query}` : ''}`);
  args.push('--period', '3h', '--limit', '1000', '--fresh', '--json');
  try {
    return JSON.parse(execFileSync('sentry', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })).data ?? [];
  } catch {
    // A metric that was never emitted makes the CLI exit non-zero instead of returning no rows.
    return [];
  }
}

function countByTrace(rows, field = 'count()') {
  const counts = new Map();
  for (const row of rows) {
    if (row.trace) counts.set(row.trace, (counts.get(row.trace) ?? 0) + Number(row[field] ?? 0));
  }
  return counts;
}

function validate() {
  const failures = [];
  const expect = (condition, message) => condition || failures.push(message);
  const expectCounts = (label, rows, traces, expected, field) => {
    const counts = countByTrace(rows, field);
    for (const trace of traces) {
      const actual = counts.get(trace) ?? 0;
      expect(actual === expected, `${label}: ${trace} expected ${expected}, got ${actual}`);
    }
  };

  // One grouping query per kind keeps each result below 100 rows; larger grouped results can
  // rotate a row at the page boundary and look like one missing plus one duplicate request.
  const roots = new Map();
  for (const kind of ['burst', 'checkout', 'detached']) {
    const rows = explore({
      dataset: 'spans',
      fields: ['repro.request_id', 'trace', 'span.name', 'count()'],
      query: `span.op:http.server AND repro.request_id:${run}-${kind}-*`,
    });
    for (const row of rows) {
      const id = row['repro.request_id'];
      expect(!roots.has(id), `${id}: more than one root span`);
      expect(row['span.name'] === `GET /${kind}`, `${id}: expected GET /${kind}, got ${row['span.name']}`);
      roots.set(id, row.trace);
    }
    for (const id of ids(kind)) expect(roots.has(id), `missing root: ${id}`);
  }
  expect(new Set(roots.values()).size === roots.size, 'trace ids are not unique');

  const traces = kind => ids(kind).map(id => roots.get(id)).filter(Boolean);
  const burst = traces('burst');
  const checkout = traces('checkout');
  const detached = traces('detached');
  const spans = name => explore({ dataset: 'spans', fields: ['trace', 'count()'], query: `span.name:"${name}"` });

  // RPC spans of the DO land in the caller's trace.
  expectCounts('echo', spans('echo'), burst, 20);
  expectCounts('echo', spans('echo'), [...checkout, ...detached], 0);
  expectCounts('recordCheckout', spans('recordCheckout'), checkout, 1);
  expectCounts('do.audit-flush', spans('do.audit-flush'), checkout, 1);
  expectCounts('durable_object_storage_put', spans('durable_object_storage_put'), checkout, 2);
  expectCounts('startDetachedWork', spans('startDetachedWork'), detached, 1);

  // Worker waitUntil work after the response.
  expectCounts('checkout.post-response', spans('checkout.post-response'), checkout, 1);
  expectCounts('checkout.notify-webhook', spans('checkout.notify-webhook'), checkout, 1);
  const logs = explore({ dataset: 'logs', fields: ['trace', 'count()'] });
  expectCounts('checkout log', logs, checkout, 1);
  expectCounts('log', logs, burst, 0);
  const checkoutMetric = explore({ dataset: 'metrics', metric: 'checkout.processed', fields: ['trace', 'sum(value)'] });
  expectCounts('checkout metric', checkoutMetric, checkout, 1, 'sum(value,checkout.processed,counter,none)');
  const errors = explore({ dataset: 'errors', fields: ['trace', 'count()'] });
  expectCounts('checkout events', errors, checkout, 3);
  expectCounts('events', errors, burst, 0);

  // Detached DO work: delivered with a cached client, dropped by a disposed per-invocation client.
  const detachedExpected = cache ? 1 : 0;
  expectCounts('do.detached-task', spans('do.detached-task'), detached, detachedExpected);
  expectCounts('detached log', logs, detached, detachedExpected);
  const detachedMetric = explore({ dataset: 'metrics', metric: 'do.detached', fields: ['trace', 'sum(value)'] });
  expectCounts('detached metric', detachedMetric, detached, detachedExpected, 'sum(value,do.detached,counter,none)');
  expectCounts('detached error', errors, detached, detachedExpected);

  return { environment, cacheClient: cache, requests: roots.size, passed: failures.length === 0, failures };
}

let previous;
for (let attempt = 1; attempt <= 8; attempt++) {
  const result = validate();
  const key = JSON.stringify(result);
  if (result.passed || key === previous || attempt === 8) {
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.passed ? 0 : 1;
    break;
  }
  previous = key;
  console.error(`attempt ${attempt}: ${result.failures.length} failures, waiting for ingestion...`);
  await new Promise(resolve => setTimeout(resolve, 45_000));
}
