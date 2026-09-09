// Driver for one variant. Usage: node drive.mjs <variant>
// run.sh starts the sink (localhost:4752) and the built Nuxt server (localhost:4753) first. The server
// routes are called from Node, then one headless system Chrome walks the pages. Every wait is a
// condition on the sink or the page, never a sleep: the run ends with a sentinel message plus span on
// both sides and polls the sink for those (hard deadline 60 s), so everything captured before them is
// known to have arrived.
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const variant = process.argv[2] ?? 'plain';
const SINK = 'http://localhost:4752';
const APP = 'http://localhost:4753';
const DEADLINE_MS = 60_000;

const steps = [];
const consoleLines = [];
const pageErrors = [];
const sinkGet = path => fetch(`${SINK}${path}`).then(r => r.json());

async function until(label, check, ms = DEADLINE_MS, waitMs = 200) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await check()) return true;
    await new Promise(r => setTimeout(r, waitMs));
  }
  console.error(`[drive] gave up waiting for ${label}`);
  return false;
}
const hasEvent = (items, pred) => items.some(i => i.type === 'event' && pred(i));
const hasSpan = (items, pred) => items.some(i => i.type === 'span' && (i.raw || []).some(pred));

async function serverStep(label, path, opts = {}) {
  const t0 = Date.now();
  let result;
  try {
    const res = await fetch(`${APP}${path}`, { signal: AbortSignal.timeout(10_000), ...opts });
    const text = await res.text();
    result = {
      status: res.status,
      ms: Date.now() - t0,
      server_timing: res.headers.get('server-timing'),
      content_type: res.headers.get('content-type'),
      body: text.slice(0, 300),
    };
  } catch (e) {
    result = { threw: String(e?.message ?? e), ms: Date.now() - t0 };
  }
  steps.push({ side: 'server', label, path, result });
  return result;
}

async function browserStep(label, fn) {
  let result;
  try {
    result = await fn();
  } catch (e) {
    result = { threw: String(e?.message ?? e) };
  }
  steps.push({ side: 'browser', label, result: result ?? null });
  return result;
}

const appAlive = process.env.APP_ALIVE !== '0';

// Server routes first, called from Node like curl would.
if (appAlive) {
  await serverStep('parameterized route (repro-only server/api/users/[id].get.ts)', '/api/users/42');
  await serverStep('docs verify route throws (javascript.nuxt.mdx:447-451)', '/api/sentry-example');
  await serverStep('repro-only throwing route', '/api/error');
  await serverStep('incoming headers echo, no trace headers sent', '/api/echo');
  await serverStep('server-side $fetch to the sink recorder', '/api/outgoing');
  await serverStep('server-side fetch to the sink recorder', '/api/outgoing?via=fetch');
  await serverStep('logs snippet on the server (verify-logs include :13-23)', '/api/logs');
  await serverStep('incoming sentry-trace continued', '/api/echo', {
    headers: { 'sentry-trace': '12345678123456781234567812345678-1234567812345678-1', baggage: 'sentry-trace_id=12345678123456781234567812345678,sentry-environment=qs,sentry-public_key=public,sentry-sample_rate=1,sentry-sampled=true' },
  });
  await serverStep('unmatched route', '/api/nope');
}

// Browser.
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext();
const page = await context.newPage();
page.on('console', m => consoleLines.push(`${m.type()}: ${m.text()}`));
page.on('pageerror', e => pageErrors.push(String(e && e.message ? e.message : e)));

let meta = { initialized: false };
let sdkUp = false;
if (appAlive) {
  await page.goto(`${APP}/`, { waitUntil: 'load' });
  sdkUp = await until('client SDK init', () => page.evaluate(() => !!(window.Sentry && window.Sentry.getClient && window.Sentry.getClient())), 15_000);
  meta = await page.evaluate(() => (window.__qsMeta ? window.__qsMeta() : { initialized: false }));
  steps.push({ side: 'browser', label: 'pageload /', result: { sdkUp, meta, feedbackWidget: await page.evaluate(() => !!document.querySelector('#sentry-feedback')), title: await page.title() } });

  await browserStep('click #btn-echo (same-origin $fetch /api/echo, propagation to the server)', async () => {
    await page.click('#btn-echo');
    await until('echo status', () => page.evaluate(() => document.querySelector('#status')?.textContent?.includes('sentry-trace')), 10_000, 100);
    return { status: await page.evaluate(() => document.querySelector('#status')?.textContent) };
  });
  await browserStep('click #btn-recorder (cross-origin fetch to the sink recorder)', async () => {
    await page.click('#btn-recorder');
    await until('recorder status', () => page.evaluate(() => document.querySelector('#status')?.textContent?.includes('ok')), 10_000, 100);
    return { status: await page.evaluate(() => document.querySelector('#status')?.textContent), headers: await sinkGet('/__headers') };
  });
  await browserStep('click #btn-api-error ($fetch /api/error rejects, caught)', async () => {
    await page.click('#btn-api-error');
    await until('api error status', () => page.evaluate(() => document.querySelector('#status')?.textContent?.includes('api error')), 10_000, 100);
    return { status: await page.evaluate(() => document.querySelector('#status')?.textContent) };
  });
  await browserStep('click #btn-log (verify-logs include :13-23 on the client)', async () => {
    await page.click('#btn-log');
    return { status: await page.evaluate(() => document.querySelector('#status')?.textContent) };
  });

  await browserStep('click #nav-example (client-side navigation to /example-error)', async () => {
    await page.click('#nav-example');
    const arrived = await until('example page', () => page.evaluate(() => !!document.querySelector('#errorBtn')), 10_000, 100);
    return { arrived, path: await page.evaluate(() => location.pathname) };
  });
  await browserStep('click #errorBtn (javascript.nuxt.mdx:486, throws "Nuxt Button Error")', async () => {
    await page.click('#errorBtn');
    const captured = await until('button error event', async () => hasEvent(await sinkGet('/__items'), i => String(i.exception).includes('Nuxt Button Error')), 15_000);
    return { captured };
  });
  await browserStep('click "Throw Server Error" (javascript.nuxt.mdx:472-482, startSpan + $fetch /api/sentry-example)', async () => {
    await page.click('text=Throw Server Error');
    const clientSpan = await until('Example Frontend Span', async () => hasSpan(await sinkGet('/__items'), s => s.name === 'Example Frontend Span'), 15_000);
    return { clientSpan };
  });
  await browserStep('click #nav-user (client-side navigation to /users/42, parameterized route)', async () => {
    await page.click('#nav-user');
    const arrived = await until('user page', () => page.evaluate(() => document.querySelector('#user-id')?.textContent === '42'), 10_000, 100);
    const navSpan = await until('navigation span', async () => hasSpan(await sinkGet('/__items'), s => s.op === 'navigation' && /users/.test(s.name)), 15_000);
    return { arrived, navSpan, path: await page.evaluate(() => location.pathname) };
  });
  await browserStep('click #nav-home (client-side navigation back to /)', async () => {
    await page.click('#nav-home');
    return { arrived: await until('home page', () => page.evaluate(() => location.pathname === '/'), 10_000, 100) };
  });
}

// Sentinels on both sides, then poll.
let sentinel = { client: false, server: false };
if (appAlive) {
  const hasHook = await page.evaluate(() => typeof window.__qsSentinel === 'function');
  if (hasHook) await page.evaluate(() => window.__qsSentinel('sentinel'));
  const server = await serverStep('sentinel (captureMessage + http.server segment)', '/api/sentinel');
  const ok = await until('sentinels', async () => {
    const items = await sinkGet('/__items');
    const client = !hasHook || (hasEvent(items, i => i.message === 'sentinel') && hasSpan(items, s => s.name === 'sentinel-span'));
    const srv = server.status !== 200 || (hasEvent(items, i => i.message === 'sentinel-server') && hasSpan(items, s => s.is_segment && /\/api\/sentinel/.test(String(s.route || s.url_path || s.url || s.name))));
    sentinel = { client, server: srv };
    return client && srv;
  });
  sentinel.all = ok;
  await page.evaluate(() => window.Sentry && window.Sentry.flush(5000)).catch(() => {});
  // The pageload segment ends after the browser tracing idle timeout, so it lands after the sentinel.
  sentinel.pageload = await until('pageload span', async () => hasSpan(await sinkGet('/__items'), s => s.op === 'pageload'), 30_000);
  // Session Replay: the buffered replay is only sent once the session is long enough (minReplayDuration, 5 s).
  await page.evaluate(() => window.Sentry && window.Sentry.captureException(new Error('Error for the replay buffer'))).catch(() => {});
  sentinel.replay = await until('replay envelope', async () => (await sinkGet('/__items')).some(i => i.type === 'replay_event'), 20_000);
  await page.evaluate(() => window.Sentry && window.Sentry.flush(5000)).catch(() => {});
}
await browser.close();

const [items, raw, headers] = await Promise.all([sinkGet('/__items'), sinkGet('/__items?raw=1'), sinkGet('/__headers')]);
const appLog = process.env.APP_LOG ? readFileSync(process.env.APP_LOG, 'utf8').split('\n').filter(Boolean) : [];
const buildLog = process.env.BUILD_LOG ? readFileSync(process.env.BUILD_LOG, 'utf8').split('\n').filter(Boolean) : [];
const integrations = side =>
  (side === 'server' ? appLog : consoleLines)
    .filter(l => l.includes('Integration installed:'))
    .map(l => l.replace(/.*Integration installed:\s*/, '').trim());
const ver = p => JSON.parse(readFileSync(new URL(`./node_modules/${p}/package.json`, import.meta.url), 'utf8')).version;

const bySide = side => items.filter(i => i.side === side);
const spansOf = side => bySide(side).filter(i => i.type === 'span').flatMap(i => i.raw || []);
const eventsOf = side => bySide(side).filter(i => i.type === 'event').map(i => ({ message: i.message, exception: i.exception, mechanism: i.mechanism, handled: i.handled, transaction: i.transaction, trace_id: i.trace_id, request: i.request?.url, contexts: i.contexts }));
const compactSpan = s => ({ op: s.op, name: s.name, is_segment: s.is_segment, segment_name: s.segment_name, source: s.source, origin: s.origin, route: s.route, url_path: s.url_path, status: s.status, status_code: s.status_code, trace_id: undefined, span_id: s.span_id, parent_span_id: s.parent_span_id });
const rawSpanItems = raw.filter(x => x.header.type === 'span').flatMap(x => (x.payload.items || []).map(s => ({ side: x.side, ...s })));
const attrs = s => Object.fromEntries(Object.entries(s.attributes || {}).map(([k, v]) => [k, v?.value]));
const serverSegments = rawSpanItems.filter(s => s.side === 'server' && s.is_segment);
const usersSegment = serverSegments.find(s => attrs(s)['http.route'] === '/api/users/:id' || s.name === 'GET /api/users/:id');
const exampleSegment = serverSegments.find(s => /sentry-example/.test(String(attrs(s)['url.path'] || attrs(s)['http.route'] || s.name)));
const frontendSpan = rawSpanItems.find(s => s.side === 'browser' && s.name === 'Example Frontend Span');

const summary = {
  sdk: {
    client: { ...(meta.sdk || {}), integrations: meta.integrations || integrations('browser') },
    server: {
      name: raw.find(x => x.side === 'server' && x.header.type === 'event')?.payload?.sdk?.name ?? raw.find(x => x.side === 'server')?.envHeader?.sdk?.name,
      version: raw.find(x => x.side === 'server')?.envHeader?.sdk?.version,
      integrations: integrations('server'),
    },
  },
  counts: {
    browser: Object.fromEntries([...new Set(bySide('browser').map(i => i.type))].map(t => [t, bySide('browser').filter(i => i.type === t).length])),
    server: Object.fromEntries([...new Set(bySide('server').map(i => i.type))].map(t => [t, bySide('server').filter(i => i.type === t).length])),
  },
  transaction_items: items.filter(i => i.type === 'transaction').length,
  browser: {
    events: eventsOf('browser'),
    segments: spansOf('browser').filter(s => s.is_segment).map(compactSpan),
    child_spans: [...new Set(spansOf('browser').filter(s => !s.is_segment).map(s => `${s.op ?? ''} ${s.name}`.trim()))],
    logs: bySide('browser').filter(i => i.type === 'log').flatMap(i => i.items),
    sessions: bySide('browser').filter(i => i.type === 'session').map(i => ({ status: i.status, errors: i.errors, init: i.init })),
    replay_events: bySide('browser').filter(i => i.type === 'replay_event').length,
    echo_status: steps.find(s => s.label.startsWith('click #btn-echo'))?.result?.status,
  },
  server: {
    events: eventsOf('server'),
    segments: serverSegments.map(s => ({ name: s.name, op: attrs(s)['sentry.op'], source: attrs(s)['sentry.segment.name.source'] ?? attrs(s)['sentry.source'], origin: attrs(s)['sentry.origin'], route: attrs(s)['http.route'], url_path: attrs(s)['url.path'], status: s.status, status_code: attrs(s)['http.response.status_code'] })),
    users_segment_attributes: usersSegment ? Object.fromEntries(Object.entries(attrs(usersSegment)).filter(([k]) => /^(url\.path\.parameter\.|params\.|http\.route|sentry\.segment\.name|http\.request\.method|url\.path$|sentry\.origin|sentry\.op)/.test(k))) : null,
    child_spans: [...new Set(spansOf('server').filter(s => !s.is_segment).map(s => `${s.op ?? ''} ${s.name}`.trim()))],
    child_origins: [...new Set(spansOf('server').filter(s => !s.is_segment).map(s => s.origin))],
    logs: bySide('server').filter(i => i.type === 'log').flatMap(i => i.items),
    other_types: [...new Set(bySide('server').filter(i => !['event', 'span', 'log'].includes(i.type)).map(i => i.type))],
    outgoing_recorder_headers: headers,
    server_timing: steps.filter(s => s.side === 'server' && s.result?.server_timing).map(s => ({ path: s.path, server_timing: s.result.server_timing })),
  },
  trace_continuation: {
    frontend_span_trace: frontendSpan?.trace_id ?? null,
    example_route_segment_trace: exampleSegment?.trace_id ?? null,
    same_trace: !!(frontendSpan && exampleSegment && frontendSpan.trace_id === exampleSegment.trace_id),
  },
  console: {
    server_notable: appLog.filter(l => /warn|deprecat|error|--import|Bundled|Sentry Logger \[(warn|error)\]|Initializing|registerHooks|no longer/i.test(l) && !l.includes('Integration installed')),
    server_line_count: appLog.length,
    browser_notable: consoleLines.filter(l => /warn|error|deprecat/i.test(l) && !/Integration installed/.test(l)).slice(0, 40),
    browser_line_count: consoleLines.length,
    build_notable: buildLog.filter(l => /sentry|warn|error|deprecat|source ?map/i.test(l)),
  },
};

const checks = {
  app_started: appAlive,
  client_sdk_initialized: sdkUp,
  client_button_error_event: summary.browser.events.some(e => String(e.exception).includes('Nuxt Button Error')),
  client_frontend_span: !!frontendSpan,
  client_pageload_segment: summary.browser.segments.some(s => s.op === 'pageload'),
  client_navigation_segments: summary.browser.segments.filter(s => s.op === 'navigation').map(s => s.name),
  server_example_error_event: summary.server.events.some(e => String(e.exception).includes('Sentry Example API Route Error')),
  server_error_route_event: summary.server.events.some(e => String(e.exception).includes('Server Route Error')),
  server_users_segment: usersSegment ? usersSegment.name : null,
  server_span_envelopes: summary.counts.server.span ?? 0,
  server_outgoing_propagation: headers.filter(h => String(h.url).includes('server')).map(h => ({ url: h.url, has_sentry_trace: !!h['sentry-trace'], has_baggage: !!h.baggage })),
  sentinel,
};
const status = !appAlive ? 'broken' : checks.client_button_error_event && checks.server_example_error_event && checks.server_users_segment && sentinel.all ? 'works' : 'partial';

const result = {
  id: 'QS-nuxt',
  variant,
  command: process.env.SERVER_CMD,
  versions: { nuxt: ver('nuxt'), nitropack: ver('nitropack'), vue: ver('vue'), h3: ver('h3'), '@sentry/nuxt': ver('@sentry/nuxt'), node: process.version },
  steps,
  verdict: { status, checks },
  summary,
  console: { server: appLog, browser: consoleLines, pageErrors, build: buildLog },
  items,
  headers,
  raw,
};
writeFileSync(new URL(`./results-${variant}.json`, import.meta.url), JSON.stringify(result, null, 2));
console.log(`wrote results-${variant}.json (${items.length} sink items, status=${status}, sentinel=${JSON.stringify(sentinel)})`);
