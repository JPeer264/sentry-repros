// Playwright driver. Usage: node drive.mjs <variant>
// One headless system Chrome per run. Every wait is a condition on the sink or the page, never a sleep:
// the run ends with a sentinel message plus a sentinel span on both sides and polls the sink for those
// (hard deadline 60 s), so everything captured before them is known to have arrived.
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const variant = process.argv[2] ?? 'remix-serve';
const base = process.env.BASE_URL ?? 'http://localhost:4759';
const sink = process.env.SINK_URL ?? 'http://localhost:4758';
const serverLog = process.env.SERVER_LOG;
const resultName = process.env.RESULT_NAME ?? `results-${variant}`;

const consoleLines = [];
const pageErrors = [];
const responses = [];
const steps = [];

const get = path => fetch(`${sink}${path}`).then(r => r.json());

async function until(label, check, deadlineMs = 15000, waitMs = 150) {
  const end = Date.now() + deadlineMs;
  while (Date.now() < end) {
    if (await check()) return true;
    await new Promise(r => setTimeout(r, waitMs));
  }
  console.error(`[drive] gave up waiting for ${label}`);
  return false;
}

const isClient = i => i.via === '/tunnel';
const isServer = i => i.via !== '/tunnel';
const hasEvent = (items, pred) => items.some(i => i.type === 'event' && pred(i));
const hasSpan = (items, pred) => items.some(i => i.type === 'span' && (i.raw || []).some(s => pred(s, i)));

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

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext();
const page = await context.newPage();
page.on('console', m => consoleLines.push(`${m.type()}: ${m.text()}`));
page.on('pageerror', e => pageErrors.push(String(e && e.message ? e.message : e)));
page.on('response', r => {
  if (r.url().startsWith(base)) responses.push(`${r.request().method()} ${r.url().slice(base.length)} -> ${r.status()}`);
});

const first = await page.goto(`${base}/`, { waitUntil: 'load' });
const sdkUp = await until('SDK init', () => page.evaluate(() => !!(window.Sentry && window.Sentry.getClient && window.Sentry.getClient())), 15000);
const appUp = await until('verify page', () => page.evaluate(() => document.querySelector('#verify-page') !== null), 10000);

const meta = await page.evaluate(() => (window.__qsMeta ? window.__qsMeta() : { initialized: false }));
steps.push({
  label: 'boot (document request GET /)',
  result: {
    status: first?.status(),
    sdkUp,
    appUp,
    pageErrorsAtBoot: pageErrors.slice(),
    sentryTraceMeta: await page.evaluate(() => document.querySelector('meta[name="sentry-trace"]')?.getAttribute('content') ?? null),
    baggageMeta: await page.evaluate(() => document.querySelector('meta[name="baggage"]')?.getAttribute('content') ?? null),
    rootLoaderData: await page.evaluate(() => {
      const root = window.__remixContext?.state?.loaderData?.root;
      return root ? { keys: Object.keys(root), sentryTrace: root.sentryTrace ?? null, sentryBaggage: root.sentryBaggage ?? null } : null;
    }),
    hydrated: await page.evaluate(() => typeof window.__remixContext === 'object'),
  },
});

if (appUp) {
  await step('click #btn-throw (javascript.remix.mdx:443-452, onClick throws "Sentry Example Frontend Error")', async () => {
    await page.click('#btn-throw');
    const captured = await until('frontend error event', async () => hasEvent(await get('/__items'), i => isClient(i) && String(i.exception).includes('Sentry Example Frontend Error')));
    return { captured };
  });
  await step('click #btn-span (javascript.remix.mdx:473-493, startSpan + fetch("/api/sentry-example-api") + throw)', async () => {
    await page.click('#btn-span');
    const span = await until('Example Frontend Span', async () => hasSpan(await get('/__items'), s => s.name === 'Example Frontend Span'));
    const events = (await get('/__items')).filter(i => i.type === 'event' && isClient(i) && String(i.exception).includes('Sentry Example Frontend Error')).length;
    return { span, frontendErrorEvents: events };
  });
  await step('click #btn-fetch (client fetch to the sink recorder, tracePropagationTargets: ["localhost", ...])', async () => {
    await page.click('#btn-fetch');
    const hit = await until('recorder hit from=client', async () => (await get('/__headers')).some(h => h.url.includes('from=client')));
    return { hit, headers: (await get('/__headers')).filter(h => h.url.includes('from=client')) };
  });
  await step('click #nav-user (Link to /users/7, loader fetches the recorder server-side)', async () => {
    await page.click('#nav-user');
    const navigated = await until('user page', () => page.evaluate(() => document.querySelector('#user-id')?.textContent === '7'), 10000);
    const serverHit = await until('recorder hit from=server-loader', async () => (await get('/__headers')).some(h => h.url.includes('from=server-loader')), 10000);
    const navSpan = await until('client navigation span', async () => hasSpan(await get('/__items'), (s, i) => isClient(i) && s.op === 'navigation'), 20000, 250);
    return { navigated, serverHit, navSpan, path: await page.evaluate(() => location.pathname), serverHeaders: (await get('/__headers')).filter(h => h.url.includes('from=server-loader')) };
  });
  await step('click #nav-home (Link to /)', async () => {
    await page.click('#nav-home');
    return { home: await until('verify page again', () => page.evaluate(() => document.querySelector('#verify-page') !== null), 10000) };
  });
  await step('click #nav-loader-throw (client-side navigation to /loader-throws, loader throws)', async () => {
    await page.click('#nav-loader-throw');
    const boundary = await until('root ErrorBoundary', () => page.evaluate(() => document.querySelector('#root-error-boundary') !== null), 10000);
    const serverEvent = await until('server loader error event', async () => hasEvent(await get('/__items'), i => isServer(i) && String(i.exception).includes('Sentry Example Loader Error')));
    const clientEvent = await until('client boundary event', async () => hasEvent(await get('/__items'), i => isClient(i) && String(i.exception).includes('Sentry Example Loader Error')), 10000);
    return { boundary, boundaryText: await page.evaluate(() => document.querySelector('#root-error-boundary')?.textContent ?? null), serverEvent, clientEvent, path: await page.evaluate(() => location.pathname) };
  });
  await step('goto /action-throws, click #btn-action (Form POST, action throws; fields key_x, key_y, password, unlisted)', async () => {
    await page.goto(`${base}/action-throws`, { waitUntil: 'load' });
    await until('action page', () => page.evaluate(() => document.querySelector('#action-page') !== null), 10000);
    await until('hydrated', () => page.evaluate(() => typeof window.__remixContext === 'object' && !!window.Sentry?.getClient()), 10000);
    await page.click('#btn-action');
    const boundary = await until('root ErrorBoundary after action', () => page.evaluate(() => document.querySelector('#root-error-boundary') !== null), 10000);
    const serverEvent = await until('server action error event', async () => hasEvent(await get('/__items'), i => isServer(i) && String(i.exception).includes('Sentry Example Action Error')));
    return { boundary, serverEvent, boundaryText: await page.evaluate(() => document.querySelector('#root-error-boundary')?.textContent ?? null) };
  });
  await step('goto /loader-throws (document request, loader throws during SSR)', async () => {
    const res = await page.goto(`${base}/loader-throws`, { waitUntil: 'load' });
    return { status: res?.status(), boundaryText: await page.evaluate(() => document.querySelector('#root-error-boundary')?.textContent ?? null) };
  });
  await page.goto(`${base}/`, { waitUntil: 'load' });
  await until('SDK init again', () => page.evaluate(() => !!window.Sentry?.getClient()), 15000);
}

// Sentinels on both sides, then poll for all four with one hard deadline.
const serverSentinel = await fetch(`${base}/sentinel?name=sentinel-server`).then(r => r.json()).catch(e => ({ threw: String(e) }));
if (sdkUp) await page.evaluate(() => window.__qsSentinel('sentinel'));
const sentinelStart = Date.now();
const sentinel = await until('sentinels', async () => {
  const items = await get('/__items');
  const client = !sdkUp || (hasEvent(items, i => isClient(i) && i.message === 'sentinel') && hasSpan(items, (s, i) => isClient(i) && s.name === 'sentinel-span'));
  const server = hasEvent(items, i => isServer(i) && i.message === 'sentinel-server') && hasSpan(items, (s, i) => isServer(i) && s.name === 'sentinel-server-span');
  return client && server;
}, 60000, 250);
const sentinelMs = Date.now() - sentinelStart;
if (sdkUp) await page.evaluate(() => window.Sentry.flush(5000));

// The pageload segment ends after the browser tracing idle timeout, so it can land after the sentinel.
const pageloadArrived = sdkUp && (await until('pageload span', async () => hasSpan(await get('/__items'), (s, i) => isClient(i) && s.op === 'pageload'), 30000, 250));
if (sdkUp) await page.evaluate(() => window.Sentry.flush(5000));

const [items, raw, headers] = await Promise.all([get('/__items'), get('/__items?raw=1'), get('/__headers')]);
const spanRows = items.filter(i => i.type === 'span').flatMap(i => (i.raw || []).map(s => ({ side: isClient(i) ? 'client' : 'server', op: s.op, name: s.name, is_segment: s.is_segment, segment_name: s.segment_name, source: s.source, origin: s.origin, status: s.status, url_path: s.url_path, route: s.route, method: s.method, status_code: s.status_code, trace_id: i.trace_id })));

const summary = {
  itemTypes: items.map(i => `${isClient(i) ? 'client' : 'server'}:${i.type}`),
  events: items.filter(i => i.type === 'event').map(i => ({ side: isClient(i) ? 'client' : 'server', platform: i.platform, level: i.level, message: i.message, exception: i.exception, mechanism: i.mechanism, handled: i.handled, transaction: i.transaction, sdk: i.sdk, sdk_version: i.sdk_version, integrations: i.integrations?.length, request: i.request ? { url: i.request.url, method: i.request.method } : undefined, trace_id: i.trace_id })),
  segments: spanRows.filter(s => s.is_segment),
  spans: spanRows,
  logs: items.filter(i => i.type === 'log').flatMap(i => i.items),
  sessions: items.filter(i => i.type === 'session').map(i => ({ side: isClient(i) ? 'client' : 'server', status: i.status, errors: i.errors, init: i.init })),
  replay: items.filter(i => i.type === 'replay_event').length,
  headers,
  serverIntegrations: items.find(i => i.type === 'event' && isServer(i))?.integrations ?? null,
  clientIntegrations: meta.integrations ?? null,
};

writeFileSync(
  new URL(`./${resultName}.json`, import.meta.url),
  JSON.stringify(
    {
      variant,
      base,
      meta,
      serverSentinel,
      steps,
      sentinel,
      sentinelMs,
      pageloadArrived,
      summary,
      responses,
      console: { browser: consoleLines, server: serverLog ? readFileSync(serverLog, 'utf8').split('\n') : null },
      pageErrors,
      items,
      headers,
      raw,
    },
    null,
    2,
  ),
);

await browser.close();
console.log(`wrote ${resultName}.json (${items.length} sink items, ${pageErrors.length} page errors, sentinel=${sentinel} in ${sentinelMs}ms, pageload=${pageloadArrived})`);
