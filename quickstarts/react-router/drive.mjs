// Playwright driver. Usage: node drive.mjs <variant>
// One headless system Chrome per run. Every wait is a condition on the sink or the page, never a
// sleep: the run ends with a sentinel message plus a sentinel span on both sides and polls the sink
// for those (hard deadline 60 s), so everything captured before them is known to have arrived.
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const variant = process.argv[2] ?? 'import-flag';
const app = process.env.APP_URL ?? 'http://localhost:4761';
const sink = process.env.SINK_URL ?? 'http://localhost:4760';
const serverLog = process.env.SERVER_LOG;
const DEADLINE = 60_000;

const consoleLines = [];
const pageErrors = [];
const steps = [];

const get = path => fetch(`${sink}${path}`).then(r => r.json());

async function until(label, check, deadlineMs = DEADLINE, waitMs = 150) {
  const t0 = Date.now();
  while (Date.now() - t0 < deadlineMs) {
    if (await check()) return true;
    await new Promise(r => setTimeout(r, waitMs));
  }
  console.error(`[drive] gave up waiting for ${label}`);
  return false;
}

const spansOf = items => items.filter(i => i.type === 'span').flatMap(i => (i.raw || []).map(s => ({ ...s, sdk: i.sdk })));
const hasEvent = (items, pred) => items.some(i => i.type === 'event' && pred(i));
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

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext();
const page = await context.newPage();
page.on('console', m => consoleLines.push(`${m.type()}: ${m.text()}`));
page.on('pageerror', e => pageErrors.push(String(e && e.message ? e.message : e)));

const boundary = () => page.evaluate(() => {
  const el = document.querySelector('#root-error-boundary');
  return el ? { message: el.getAttribute('data-message'), details: el.getAttribute('data-details') } : null;
});

const first = await page.goto(`${app}/`, { waitUntil: 'load' });
const sdkUp = await until('SDK init', () => page.evaluate(() => !!(window.Sentry && window.Sentry.getClient && window.Sentry.getClient())), 15_000);
const appUp = await until('app hydrated', () => page.evaluate(() => document.body.getAttribute('data-wired') === '1'), 15_000);
const meta = await page.evaluate(() => (window.__qsMeta ? window.__qsMeta() : { initialized: false }));
const metaTags = await page.evaluate(() => ({
  'sentry-trace': document.querySelector('meta[name="sentry-trace"]')?.getAttribute('content') ?? null,
  baggage: document.querySelector('meta[name="baggage"]')?.getAttribute('content') ?? null,
}));
steps.push({ label: 'boot GET / (document request)', result: { status: first?.status(), sdkUp, appUp, metaTags, feedbackWidget: await page.evaluate(() => !!document.querySelector('#sentry-feedback')), pageErrorsAtBoot: pageErrors.slice() } });

if (appUp) {
  await step('click #btn-throw (onClick throws "Sentry Test Error")', () => page.click('#btn-throw'));
  await step('click #btn-span (startSpan op:test + setTimeout throw)', () => page.click('#btn-span'));
  await step('click #btn-fetch (relative fetch to /api/recorder, loader fetches the sink recorder)', async () => {
    await page.click('#btn-fetch');
    const ok = await until('fetch echo', () => page.evaluate(() => (document.querySelector('#fetched')?.textContent ?? '').length > 0), 15_000);
    const echoed = ok ? JSON.parse(await page.evaluate(() => document.querySelector('#fetched').textContent)) : null;
    return { serverSawFromBrowser: echoed, sinkRecorder: await get('/__headers') };
  });
  await step('click #nav-user (Link to /users/7, client-side navigation)', async () => {
    await page.click('#nav-user');
    const navigated = await until('user page', () => page.evaluate(() => document.querySelector('#user-id')?.textContent === '7'), 15_000);
    const navSpan = await until('navigation span', async () => hasSpan(await get('/__items'), s => s.op === 'navigation'));
    return { navigated, navSpan, path: await page.evaluate(() => location.pathname), recorder: await page.evaluate(() => document.querySelector('#user-recorder')?.textContent) };
  });
  await step('click #nav-error (Link to /error, loader throws during client-side navigation)', async () => {
    await page.click('#nav-error');
    const shown = await until('error boundary', async () => (await boundary()) !== null, 15_000);
    return { boundary: await boundary(), shown, path: await page.evaluate(() => location.pathname) };
  });
  await step('goto /error-tracing (document request, loader throws inside startSpan)', async () => {
    const res = await page.goto(`${app}/error-tracing`, { waitUntil: 'load' });
    return { status: res?.status(), boundary: await boundary() };
  });
  await step('goto /action-error then click #btn-action (client-side POST, action throws)', async () => {
    const res = await page.goto(`${app}/action-error`, { waitUntil: 'load' });
    await until('hydrated', () => page.evaluate(() => document.body.getAttribute('data-wired') === '1'), 15_000);
    await page.click('#btn-action');
    const shown = await until('error boundary', async () => (await boundary()) !== null, 15_000);
    return { status: res?.status(), shown, boundary: await boundary(), path: await page.evaluate(() => location.pathname) };
  });
  await step('goto / then click #btn-render-error (render throws, route ErrorBoundary + onError)', async () => {
    await page.goto(`${app}/`, { waitUntil: 'load' });
    await until('hydrated', () => page.evaluate(() => document.body.getAttribute('data-wired') === '1'), 15_000);
    await page.click('#btn-render-error');
    const shown = await until('error boundary', async () => (await boundary()) !== null, 15_000);
    return { shown, boundary: await boundary() };
  });
}

// Sentinels on both sides: a client message + span and a server message + span via /api/sentinel.
let sentinel = { client: false, server: false };
if (sdkUp) {
  await page.evaluate(() => window.__qsSentinel('sentinel'));
  await page.evaluate(() => fetch('/api/sentinel?name=sentinel-server').then(r => r.json()));
  const t0 = Date.now();
  const ok = await until('sentinels', async () => {
    const items = await get('/__items');
    sentinel = {
      client: hasEvent(items, i => i.message === 'sentinel') && hasSpan(items, s => s.name === 'sentinel-span'),
      server: hasEvent(items, i => i.message === 'sentinel-server') && hasSpan(items, s => s.name === 'sentinel-server-span'),
    };
    return sentinel.client && sentinel.server;
  });
  sentinel.arrived = ok;
  sentinel.waitedMs = Date.now() - t0;
}
await page.evaluate(() => window.Sentry && window.Sentry.flush(5000)).catch(() => {});
// The pageload segment ends after the browser tracing idle timeout, so it lands after the sentinel.
const pageloadArrived = sdkUp && await until('pageload span', async () => hasSpan(await get('/__items'), s => s.op === 'pageload'));
// Session Replay: the buffered replay is only sent once the session is long enough (minReplayDuration).
const replayArrived = sdkUp && await until('replay envelope', async () => (await get('/__items')).some(i => i.type === 'replay_event'), 20_000, 250);

const [items, raw, headers] = await Promise.all([get('/__items'), get('/__items?raw=1'), get('/__headers')]);
const serverConsole = serverLog ? readFileSync(serverLog, 'utf8').split('\n') : [];
const serverIntegrations = serverConsole.map(l => l.match(/Integration installed: (\S+)/)?.[1]).filter(Boolean);
const sdks = {};
for (const r of raw) {
  const name = r.envHeader?.sdk?.name;
  if (name) sdks[name] = r.envHeader.sdk.version;
}

const summary = {
  itemTypes: items.map(i => i.type),
  sdks,
  clientIntegrations: meta.integrations,
  serverIntegrations,
  events: items.filter(i => i.type === 'event').map(i => ({ sdk: i.sdk, level: i.level, message: i.message, exception: i.exception, mechanism: i.mechanism, handled: i.handled, transaction: i.transaction, request: i.request?.url, trace_id: i.trace_id })),
  spans: spansOf(items).map(s => ({ sdk: s.sdk, op: s.op, name: s.name, is_segment: s.is_segment, segment_name: s.segment_name, source: s.source, origin: s.origin, status: s.status, route: s.route, url_path: s.url_path, trace_id: s.attributes?.['sentry.trace_id'] })),
  logs: items.filter(i => i.type === 'log').flatMap(i => i.items),
  sessions: items.filter(i => i.type === 'session').map(i => ({ status: i.status, errors: i.errors, init: i.init })),
  replay: items.filter(i => i.type === 'replay_event').length,
  recorderHits: headers,
};

const resultName = `results-${variant}`;
writeFileSync(new URL(`./${resultName}.json`, import.meta.url), JSON.stringify({ variant, meta, steps, sentinel, pageloadArrived, replayArrived, summary, console: consoleLines, pageErrors, serverConsole, items, headers, raw }, null, 2));
await browser.close();
console.log(`wrote ${resultName}.json (${items.length} sink items, ${pageErrors.length} page errors, sentinel=${JSON.stringify(sentinel)}, pageload=${pageloadArrived})`);
