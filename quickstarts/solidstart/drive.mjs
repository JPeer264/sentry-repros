// Playwright driver. Usage: node drive.mjs <variant>
// One headless system Chrome per run. Every wait is a condition on the sink or the page, never a
// sleep: the run ends with a sentinel message plus a sentinel span on the client and on the server
// and polls for those (hard deadline 60 s), so everything captured before them is known to have arrived.
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const variant = process.argv[2] ?? 'import-flag';
const app = process.env.APP_URL ?? 'http://localhost:4765';
const sink = process.env.SINK_URL ?? 'http://localhost:4764';
const serverLog = process.env.SERVER_LOG ?? `app-${variant}.log`;
const resultName = `results-${variant}`;

const consoleLines = [];
const pageErrors = [];
const steps = [];

const get = path => fetch(`${sink}${path}`).then(r => r.json());

async function until(label, check, tries = 200, waitMs = 150) {
  for (let i = 0; i < tries; i++) {
    if (await check()) return true;
    await new Promise(r => setTimeout(r, waitMs));
  }
  console.error(`[drive] gave up waiting for ${label}`);
  return false;
}

const hasEvent = (items, pred) => items.some(i => i.type === 'event' && pred(i));
const hasSpan = (items, pred) => items.some(i => i.type === 'span' && (i.raw || []).some(pred));

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

function readServerLog() {
  try {
    return readFileSync(new URL(`./${serverLog}`, import.meta.url), 'utf8').split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

function finish(extra) {
  const out = { variant, ...extra, serverConsole: readServerLog() };
  writeFileSync(new URL(`./${resultName}.json`, import.meta.url), JSON.stringify(out, null, 2));
}

async function probe(path, init) {
  try {
    const res = await fetch(`${app}${path}`, init);
    const text = await res.text();
    return { status: res.status, body: text.slice(0, 300), text };
  } catch (e) {
    return { error: String(e?.cause?.code ?? e?.message ?? e) };
  }
}

const serverUp = await until('server up', async () => !(await probe('/')).error, 40, 250);
if (!serverUp) {
  finish({ serverUp: false, steps: [{ label: 'boot', result: { serverUp: false, home: await probe('/') } }], summary: {}, items: await get('/__items') });
  console.log(`wrote ${resultName}.json (server never listened)`);
  process.exit(0);
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext();
const page = await context.newPage();
page.on('console', m => consoleLines.push(`${m.type()}: ${m.text()}`));
page.on('pageerror', e => pageErrors.push(String(e && e.message ? e.message : e)));

const homeResponse = await page.goto(`${app}/`, { waitUntil: 'load' });
// index.mdx:184 / server/middleware.d.ts: the middleware should add sentry-trace <meta> tags to the page
const homeHtml = (await homeResponse?.text()) ?? '';
const htmlMeta = { sentryTraceMeta: /<meta name="sentry-trace"[^>]*>/.exec(homeHtml)?.[0] ?? null, baggageMeta: /<meta name="baggage"[^>]*>/.exec(homeHtml)?.[0]?.slice(0, 120) ?? null };
const sdkUp = await until('SDK init', () => page.evaluate(() => !!(window.Sentry && window.Sentry.getClient && window.Sentry.getClient())), 60);
const appUp = await until('app rendered', () => page.evaluate(() => document.querySelector('[data-wired="1"]') !== null), 40);
const meta = await page.evaluate(() => (window.__qsMeta ? window.__qsMeta() : { initialized: false }));
steps.push({
  label: 'boot (GET /, entry-client.tsx index.mdx:93-140)',
  result: { status: homeResponse?.status(), htmlMeta, sdkUp, appUp, pageErrorsAtBoot: pageErrors.slice(), feedbackWidget: await page.evaluate(() => !!document.querySelector('#sentry-feedback')), traceMeta: meta.traceMeta },
});

if (appUp) {
  await step('click #btn-throw (index.mdx:423-431, onClick throws "Sentry Test Error")', () => page.click('#btn-throw'));
  await step('click #btn-span (index.mdx:467-487, startSpan + fetch("/sentry-test") + throw if !ok)', async () => {
    await page.click('#btn-span');
    return { direct: await probe('/sentry-test') };
  });
  await step('click #btn-boundary (getting-started-capture-errors/javascript.solidstart.mdx:6-12, withSentryErrorBoundary)', async () => {
    await page.click('#btn-boundary');
    const fallback = await until('boundary fallback', () => page.evaluate(() => document.querySelector('#boundary-fallback') !== null), 40, 100);
    return { fallback, text: await page.evaluate(() => document.querySelector('#boundary-fallback')?.textContent ?? null) };
  });
  await step('click #btn-server-fn ("use server" function that throws)', async () => {
    await page.click('#btn-server-fn');
    const done = await until('server fn result', () => page.evaluate(() => (document.querySelector('#server-fn-result')?.textContent ?? '') !== ''), 60, 100);
    return { done, text: await page.evaluate(() => document.querySelector('#server-fn-result')?.textContent) };
  });
  await step('click #btn-server-fetch (API route doing a server-side fetch to the recorder)', async () => {
    await page.click('#btn-server-fetch');
    const done = await until('server fetch result', () => page.evaluate(() => (document.querySelector('#server-fetch-result')?.textContent ?? '') !== ''), 60, 100);
    return { done, text: await page.evaluate(() => document.querySelector('#server-fetch-result')?.textContent), recorder: await get('/__headers') };
  });
  await step('click #nav-user (client-side navigation to /users/42, index.mdx:250-264 router)', async () => {
    await page.click('#nav-user');
    const navigated = await until('user page', () => page.evaluate(() => document.querySelector('#user-id')?.textContent === '42' && (document.querySelector('#user-name')?.textContent ?? '') !== ''), 60, 100);
    const navSpan = await until('navigation span', async () => hasSpan(await get('/__items'), s => s.op === 'navigation'), 120, 250);
    return { navigated, navSpan, path: await page.evaluate(() => location.pathname), name: await page.evaluate(() => document.querySelector('#user-name')?.textContent) };
  });
  await step('click #nav-home (back to /)', async () => {
    await page.click('#nav-home');
    return { home: await until('home page', () => page.evaluate(() => location.pathname === '/'), 40, 100) };
  });
}

let clientSentinel = false;
if (sdkUp) {
  await page.evaluate(() => window.__qsSentinel('sentinel'));
  clientSentinel = await until('client sentinel', async () => {
    const items = await get('/__items');
    return hasEvent(items, i => i.message === 'sentinel') && hasSpan(items, s => s.name === 'sentinel-span');
  }, 400, 150);
  await page.evaluate(() => window.Sentry.flush(5000));
}

const serverMetaProbe = await probe('/sentinel');
let serverMeta = null;
try {
  serverMeta = JSON.parse(serverMetaProbe.text);
} catch {}
const serverSentinel = await until('server sentinel', async () => {
  const items = await get('/__items');
  return hasEvent(items, i => i.message === 'server-sentinel') && hasSpan(items, s => s.name === 'server-sentinel-span') && hasSpan(items, s => s.is_segment && s.url_path === '/sentinel');
}, 400, 150);

// The pageload segment ends after the browser tracing idle timeout, so it lands after the sentinel.
const pageloadArrived = sdkUp && await until('pageload span', async () => hasSpan(await get('/__items'), s => s.op === 'pageload'), 120, 250);
const secondNavigation = sdkUp && await until('second navigation span', async () => (await get('/__items')).filter(i => i.type === 'span').flatMap(i => i.raw).filter(s => s.op === 'navigation').length >= 2, 60, 250);

await page.evaluate(() => window.Sentry && window.Sentry.flush(5000));
const [items, raw, headers] = await Promise.all([get('/__items'), get('/__items?raw=1'), get('/__headers')]);

const summary = {
  itemTypes: items.map(i => i.type),
  events: items.filter(i => i.type === 'event').map(i => ({ sdk: i.sdk, message: i.message, exception: i.exception, mechanism: i.mechanism, handled: i.handled, transaction: i.transaction, trace_id: i.trace_id, request: i.request?.url, sentryTraceHeader: i.request?.headers?.['sentry-trace'] ?? null })),
  spans: items.filter(i => i.type === 'span').flatMap(i => (i.raw || []).map(s => ({ sdk: i.sdk, op: s.op, name: s.name, is_segment: s.is_segment, segment_name: s.segment_name, source: s.source, origin: s.origin, route: s.route, url_path: s.url_path, status: s.status, trace_id: i.trace_id, status_code: s.status_code }))),
  logs: items.filter(i => i.type === 'log').flatMap(i => i.items),
  sessions: items.filter(i => i.type === 'session').map(i => ({ sdk: i.sdk, status: i.status, errors: i.errors, init: i.init })),
  replay: items.filter(i => i.type === 'replay_event').length,
  headers,
};

await browser.close();
finish({ serverUp, meta, serverMeta, serverMetaProbe: { status: serverMetaProbe.status, error: serverMetaProbe.error }, steps, clientSentinel, serverSentinel, pageloadArrived, secondNavigation, summary, console: consoleLines, pageErrors, items, headers, raw });
console.log(`wrote ${resultName}.json (${items.length} sink items, ${pageErrors.length} page errors, clientSentinel=${clientSentinel}, serverSentinel=${serverSentinel}, pageload=${pageloadArrived})`);
