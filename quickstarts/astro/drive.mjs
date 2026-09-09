// Driver. Usage: node drive.mjs <variant>
//   base                 headless system Chrome through the verify pages and the parameterized route without the view transitions router
//   view-transitions     headless system Chrome, client-side navigations under `<ClientRouter />`
//   server               no browser: plain fetches against the endpoint that throws, the page that throws, the server-side fetch page
//   *-middleware         the same steps against the `middleware` build (dist-middleware, manual `Sentry.handleRequest()`)
// Every wait is a condition on the sink with a hard 60 s deadline, never a sleep: each side ends with
// a sentinel message plus a sentinel span and the run polls for those, so everything captured before
// them is known to have arrived.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const variant = process.argv[2] ?? 'base';
const mode = variant.replace(/-middleware$/, '');
const app = process.env.APP_URL ?? 'http://127.0.0.1:4757';
const sink = process.env.SINK_URL ?? 'http://127.0.0.1:4756';
const resultName = process.env.RESULT_NAME ?? `results-${variant}`;
const DEADLINE_MS = 60_000;

const consoleLines = [];
const pageErrors = [];
const steps = [];
const waits = [];

const get = path => fetch(`${sink}${path}`).then(r => r.json());

async function until(label, check, deadlineMs = DEADLINE_MS, waitMs = 150) {
  const started = Date.now();
  while (Date.now() - started < deadlineMs) {
    if (await check()) {
      waits.push({ label, ms: Date.now() - started, ok: true });
      return true;
    }
    await new Promise(r => setTimeout(r, waitMs));
  }
  waits.push({ label, ms: Date.now() - started, ok: false });
  console.error(`[drive] gave up waiting for ${label}`);
  return false;
}

const hasEvent = (items, pred) => items.some(i => i.type === 'event' && pred(i));
const spansOf = items => items.filter(i => i.type === 'span').flatMap(i => (i.raw || []).map(s => ({ ...s, via: i.via })));
const hasSpan = (items, pred) => spansOf(items).some(pred);

async function step(label, fn) {
  const before = (await get('/__items')).length;
  let result;
  try {
    result = await fn();
  } catch (e) {
    result = { threw: String(e?.message ?? e) };
  }
  steps.push({ label, result: result ?? null, itemsBefore: before });
}

async function waitEvent(label, pred) {
  return until(label, async () => hasEvent(await get('/__items'), pred));
}

async function waitSpan(label, pred) {
  return until(label, async () => hasSpan(await get('/__items'), pred));
}

function readLog(envName) {
  const file = process.env[envName];
  if (!file || !existsSync(file)) return [];
  return readFileSync(file, 'utf8').split('\n');
}

// --- browser variants ---------------------------------------------------------------------------

async function browserRun() {
  const { chromium } = await import('playwright-core');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('console', m => consoleLines.push(`${m.type()}: ${m.text()}`));
  page.on('pageerror', e => pageErrors.push(String(e && e.message ? e.message : e)));

  const sdkUp = () => until('SDK init', () => page.evaluate(() => !!(window.Sentry && window.Sentry.getClient && window.Sentry.getClient())), 15_000);
  const wired = () => until('page wired', () => page.evaluate(() => document.body.getAttribute('data-wired') === '1'), 15_000);
  const meta = () => page.evaluate(() => (window.__qsMeta ? window.__qsMeta() : { initialized: false }));

  async function sentinel(name) {
    if (!(await page.evaluate(() => typeof window.__qsSentinel === 'function'))) return false;
    await page.evaluate(n => window.__qsSentinel(n), name);
    return until(`sentinel ${name}`, async () => {
      const items = await get('/__items');
      return hasEvent(items, i => i.message === name) && hasSpan(items, s => s.name === `${name}-span`);
    });
  }

  let bootMeta;

  if (mode === 'base') {
    await page.goto(`${app}/test`, { waitUntil: 'load' });
    const up = await sdkUp();
    const w = await wired();
    bootMeta = await meta();
    steps.push({ label: 'boot /test (getting-started-complete/javascript.astro.mdx:454-473)', result: { sdkUp: up, wired: w, meta: bootMeta, feedbackWidget: await page.evaluate(() => !!document.querySelector('#sentry-feedback')) } });

    await step('click #one (throwTestError, :462-464)', async () => {
      await page.click('#one');
      return { eventArrived: await waitEvent('frontend error event', i => String(i.exception).includes('Sentry Example Frontend Error')) };
    });
    await step('click #two (throwApiError -> fetch /api/test-error, :466-468 + :487-491)', async () => {
      await page.click('#two');
      return { serverEventArrived: await waitEvent('api route error event', i => String(i.exception).includes('Sentry Example API Route Error')) };
    });
    await step('pageload span for /test', async () => ({ arrived: await waitSpan('pageload /test', s => s.op === 'pageload' && (s.url_path === '/test' || s.name === '/test')) }));

    await page.goto(`${app}/test-tracing`, { waitUntil: 'load' });
    await sdkUp();
    await wired();
    await step('click #one on /test-tracing (Sentry.startSpan "Example Frontend Span", :510-532)', async () => {
      await page.click('#one');
      const spanArrived = await waitSpan('Example Frontend Span', s => s.name === 'Example Frontend Span');
      const serverEvents = (await get('/__items')).filter(i => i.type === 'event' && String(i.exception).includes('Sentry Example API Route Error')).length;
      return { spanArrived, apiRouteErrorEventsSoFar: serverEvents };
    });
    await step('pageload span for /test-tracing', async () => ({ arrived: await waitSpan('pageload /test-tracing', s => s.op === 'pageload' && (s.url_path === '/test-tracing' || s.name === '/test-tracing')) }));

    await page.goto(`${app}/users/42`, { waitUntil: 'load' });
    await sdkUp();
    await wired();
    await step('load /users/42 (parameterized SSR route, no ClientRouter)', async () => ({
      param: await page.evaluate(() => document.querySelector('#user-id')?.textContent ?? null),
      meta: await meta(),
      pageloadArrived: await waitSpan('pageload /users/42', s => s.op === 'pageload' && (s.url_path === '/users/42' || s.route === '/users/[id]' || s.name === '/users/[id]')),
    }));
    await step('click #nav-next (full document load to /users/43, no ClientRouter)', async () => {
      await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), page.click('#nav-next')]);
      await sdkUp();
      await wired();
      return {
        path: await page.evaluate(() => location.pathname),
        param: await page.evaluate(() => document.querySelector('#user-id')?.textContent ?? null),
        meta: await meta(),
        navigationSpansSoFar: spansOf(await get('/__items')).filter(s => s.op === 'navigation').length,
        secondPageloadArrived: await until('second pageload for /users/*', async () => spansOf(await get('/__items')).filter(s => s.op === 'pageload' && (s.url_path === '/users/43' || s.route === '/users/[id]' || s.name === '/users/[id]')).length >= 2),
      };
    });
  }

  if (mode === 'view-transitions') {
    await page.goto(`${app}/vt/`, { waitUntil: 'load' });
    const up = await sdkUp();
    const w = await wired();
    bootMeta = await meta();
    steps.push({ label: 'boot /vt/ (ClientRouter from astro:transitions)', result: { sdkUp: up, wired: w, meta: bootMeta } });
    await step('pageload span for /vt/', async () => ({ arrived: await waitSpan('pageload /vt/', s => s.op === 'pageload') }));

    await step('click #nav-user (client-side navigation to /vt/users/7)', async () => {
      await page.click('#nav-user');
      const navigated = await until('user page 7', () => page.evaluate(() => document.querySelector('#user-id')?.textContent === '7' && location.pathname === '/vt/users/7'), 15_000);
      const navSpan = await waitSpan('navigation span', s => s.op === 'navigation');
      return { navigated, navSpan, path: await page.evaluate(() => location.pathname), meta: await meta(), sameClient: await page.evaluate(() => !!(window.Sentry && window.Sentry.getClient())) };
    });
    await step('click #nav-next (client-side navigation to /vt/users/8)', async () => {
      await page.click('#nav-next');
      const navigated = await until('user page 8', () => page.evaluate(() => document.querySelector('#user-id')?.textContent === '8'), 15_000);
      const second = await until('second navigation span', async () => spansOf(await get('/__items')).filter(s => s.op === 'navigation').length >= 2);
      return { navigated, second, path: await page.evaluate(() => location.pathname), meta: await meta() };
    });
  }

  const sentinelOk = await sentinel('sentinel');
  await page.evaluate(() => window.Sentry && window.Sentry.flush(5000));

  const [items, raw, headers] = await Promise.all([get('/__items'), get('/__items?raw=1'), get('/__headers')]);
  await browser.close();
  return { bootMeta, sentinelOk, items, raw, headers };
}

// --- server variant -----------------------------------------------------------------------------

async function serverRun() {
  const hit = async (path, init) => {
    const res = await fetch(`${app}${path}`, init);
    const text = await res.text();
    const metas = Object.fromEntries([...text.matchAll(/<meta name="(sentry-[a-z-]+|baggage)" content="([^"]*)"/g)].map(m => [m[1], decodeURIComponent(m[2])]));
    return { status: res.status, contentType: res.headers.get('content-type'), bodyStart: text.slice(0, 120).replace(/\s+/g, ' '), metas };
  };

  await step('GET /users/42 (parameterized SSR page)', async () => {
    const r = await hit('/users/42');
    const spanArrived = await waitSpan('server span for /users/42', s => s.via !== '/tunnel' && s.op === 'http.server' && (String(s.name).includes('/users') || s.url_path === '/users/42'));
    return { ...r, spanArrived };
  });
  await step('GET /api/test-error (:487-491, endpoint throws)', async () => {
    const r = await hit('/api/test-error');
    const eventArrived = await waitEvent('api route error event', i => String(i.exception).includes('Sentry Example API Route Error'));
    return { ...r, eventArrived };
  });
  await step('GET /ssr-throw (page frontmatter throws)', async () => {
    const r = await hit('/ssr-throw');
    const eventArrived = await waitEvent('ssr page error event', i => String(i.exception).includes('Sentry Example SSR Page Error'));
    return { ...r, eventArrived };
  });
  await step('GET /fetch-recorder (server-side fetch to the sink recorder)', async () => {
    const r = await hit('/fetch-recorder');
    const recorded = await until('recorder hit from server', async () => (await get('/__headers')).some(h => String(h.url).includes('from=server')), 15_000);
    return { ...r, recorded, headers: (await get('/__headers')).filter(h => String(h.url).includes('from=server')) };
  });
  await step('GET /users/42 with incoming sentry-trace + baggage (trace continuation)', async () => {
    const traceId = 'a'.repeat(32);
    const r = await hit('/users/42', {
      headers: {
        'sentry-trace': `${traceId}-${'b'.repeat(16)}-1`,
        baggage: `sentry-trace_id=${traceId},sentry-public_key=public,sentry-sampled=true,sentry-sample_rate=1,sentry-environment=qs`,
      },
    });
    const continued = await waitSpan('continued server span', s => s.via !== '/tunnel' && s.op === 'http.server' && s.attributes && String(s.attributes['sentry.trace_id'] ?? '') === traceId);
    const continuedByRaw = await until('continued trace id in raw span envelope', async () => (await get('/__items')).some(i => i.type === 'span' && i.trace_id === traceId));
    return { ...r, continuedByAttribute: continued, continuedByEnvelopeTrace: continuedByRaw };
  });
  await step('GET /api/sentinel (sentinel-server message + span)', async () => {
    const r = await hit('/api/sentinel');
    const ok = await until('server sentinel', async () => {
      const items = await get('/__items');
      return hasEvent(items, i => i.message === 'sentinel-server') && hasSpan(items, s => s.name === 'sentinel-server-span');
    });
    const segmentArrived = await waitSpan('http.server span for /api/sentinel', s => s.op === 'http.server' && String(s.name).includes('sentinel'));
    return { ...r, sentinelOk: ok, segmentArrived };
  });

  const [items, raw, headers] = await Promise.all([get('/__items'), get('/__items?raw=1'), get('/__headers')]);
  return { bootMeta: undefined, sentinelOk: steps.at(-1)?.result?.sentinelOk ?? false, items, raw, headers };
}

const run = mode === 'server' ? await serverRun() : await browserRun();
const { items, raw, headers } = run;

const serverLog = readLog('SERVER_LOG');
const buildLog = readLog('BUILD_LOG');
const serverConsole = serverLog.filter(l => /sentry|integration|warn|error|astro|listening|deprecat/i.test(l)).slice(0, 400);

const summary = {
  itemTypes: items.map(i => `${i.type}@${i.via}`),
  events: items.filter(i => i.type === 'event').map(i => ({ via: i.via, message: i.message, exception: i.exception, mechanism: i.mechanism, handled: i.handled, transaction: i.transaction, trace_id: i.trace_id, sdk: i.sdk, sdk_version: i.sdk_version, integrations: i.integrations?.length, contexts: i.contexts, request: i.request?.url, user: i.user, topFrame: i.topFrame })),
  spans: spansOf(items).map(s => ({ via: s.via, op: s.op, name: s.name, is_segment: s.is_segment, segment_name: s.segment_name, source: s.source, origin: s.origin, url_path: s.url_path, route: s.route, method: s.method, status_code: s.status_code, status: s.status, trace_id: s.attributes?.['sentry.trace_id'] })),
  spanEnvelopes: items.filter(i => i.type === 'span').map(i => ({ via: i.via, sdk: i.sdk, sdk_version: i.sdk_version, trace_id: i.trace_id, count: i.items.length })),
  transactions: items.filter(i => i.type === 'transaction').length,
  logs: items.filter(i => i.type === 'log').flatMap(i => i.items),
  sessions: items.filter(i => i.type === 'session').map(i => ({ via: i.via, status: i.status, errors: i.errors, init: i.init })),
  replay: items.filter(i => i.type === 'replay_event').length,
  clientReports: items.filter(i => i.type === 'client_report').map(i => i.discarded_events),
  headers,
  integrationsFromEvents: Object.fromEntries(items.filter(i => i.type === 'event' && i.integrations).map(i => [i.via, i.integrations])),
  sdkFromEvents: Object.fromEntries(items.filter(i => i.type === 'event' && i.sdk).map(i => [i.via, `${i.sdk} ${i.sdk_version}`])),
};

writeFileSync(
  new URL(`./${resultName}.json`, import.meta.url),
  JSON.stringify({ variant, mode, app, sink, meta: run.bootMeta, steps, waits, sentinelOk: run.sentinelOk, summary, console: { browser: consoleLines, pageErrors, server: serverConsole, serverLogLines: serverLog.length, build: buildLog }, items, headers, raw }, null, 2),
);
console.log(`wrote ${resultName}.json (${items.length} sink items, ${pageErrors.length} page errors, sentinel=${run.sentinelOk}, failedWaits=${waits.filter(w => !w.ok).map(w => w.label).join(',') || 'none'})`);
