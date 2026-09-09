// Playwright driver. Usage: node drive.mjs <variant>
// One headless system Chrome per run. Every wait is a condition on the sink or the page, never a sleep:
// the run ends with a sentinel message plus a sentinel span on both sides and polls for those (60s
// hard deadline each), so everything captured before them is known to have arrived.
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const variant = process.argv[2] ?? 'app-router';
const app = process.env.APP_URL ?? 'http://localhost:4751';
const sink = process.env.SINK_URL ?? 'http://localhost:4750';
const resultName = process.env.RESULT_NAME ?? `results-${variant}`;

const consoleLines = [];
const pageErrors = [];
const blockedRequests = [];
const tunnelResponses = [];
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
const eventWith = async text => hasEvent(await get('/__items'), i => String(i.exception ?? i.message ?? '').includes(text));

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

async function clientSentinel(page, name) {
  if (!(await page.evaluate(() => typeof window.__qsSentinel === 'function'))) return false;
  await page.evaluate(n => window.__qsSentinel(n), name);
  return until(`client sentinel ${name}`, async () => {
    const items = await get('/__items');
    return hasEvent(items, i => i.message === name) && hasSpan(items, s => s.name === `${name}-span`);
  }, 400, 150);
}

async function serverSentinel(name) {
  const res = await fetch(`${app}/api/sentinel?name=${name}`).then(r => r.json()).catch(e => ({ threw: String(e) }));
  const ok = await until(`server sentinel ${name}`, async () => {
    const items = await get('/__items');
    return hasEvent(items, i => i.message === name) && hasSpan(items, s => s.name === `${name}-span`);
  }, 400, 150);
  return { ok, res };
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext();
// Nothing may leave the machine: abort and record any request to sentry.io.
await context.route(/sentry\.io/, route => {
  blockedRequests.push(route.request().url());
  route.abort();
});
const page = await context.newPage();
page.on('console', m => consoleLines.push(`${m.type()}: ${m.text()}`));
page.on('pageerror', e => pageErrors.push(String(e && e.message ? e.message : e)));
page.on('response', r => {
  if (r.url().includes('/sentry-tunnel') || r.url().includes('/envelope/') || r.url().includes('/tunnel')) tunnelResponses.push({ url: r.url(), status: r.status() });
});

await page.goto(`${app}/`, { waitUntil: 'load' });
const sdkUp = await until('client SDK init', () => page.evaluate(() => !!(window.Sentry && window.Sentry.getClient && window.Sentry.getClient())), 60);
const meta = await page.evaluate(() => (window.__qsMeta ? window.__qsMeta() : { initialized: false }));
const homeHtml = await fetch(`${app}/`).then(r => r.text());
const traceMeta = {
  sentryTraceMeta: await page.evaluate(() => document.querySelector('meta[name="sentry-trace"]')?.getAttribute('content') ?? null),
  baggageMeta: await page.evaluate(() => document.querySelector('meta[name="baggage"]')?.getAttribute('content') ?? null),
  homeHtmlHasSentryTraceMeta: homeHtml.includes('name="sentry-trace"'),
  feedbackWidget: await page.evaluate(() => !!document.querySelector('#sentry-feedback')),
};
steps.push({ label: 'boot /', result: { sdkUp, ...traceMeta, pageErrorsAtBoot: pageErrors.slice() } });

if (sdkUp) {
  await step('click "Break the world" (index.mdx:383-392)', async () => {
    await page.click('text=Break the world');
    return { eventArrived: await until('Sentry Test Error event', () => eventWith('Sentry Test Error'), 100, 100) };
  });
  await step('click #btn-span (index.mdx:467-477, startSpan expensive-operation around fetch /api/hello)', async () => {
    await page.click('#btn-span');
    await until('span result', () => page.evaluate(() => document.querySelector('#span-result')?.textContent !== ''), 60, 100);
    return { spanResult: await page.evaluate(() => document.querySelector('#span-result')?.textContent) };
  });
  await step('click #btn-log (index.mdx:504-516, Sentry.logger.*)', () => page.click('#btn-log'));
  await step('click #btn-fetch (/api/fetch-recorder does a server fetch to the recorder, then a cross-origin fetch to it)', async () => {
    await page.click('#btn-fetch');
    const ok = await until('recorder hits', async () => (await get('/__headers')).length >= 2, 60, 100);
    return { recorderHits: ok, fetchResult: await page.evaluate(() => document.querySelector('#fetch-result')?.textContent), headers: await get('/__headers') };
  });
  await step('submit server action form (index.mdx:264-284, withServerActionInstrumentation)', async () => {
    await page.click('#btn-action');
    const ok = await until('action result', () => page.evaluate(() => document.querySelector('#action-result')?.textContent !== ''), 60, 100);
    return { ok, actionResult: await page.evaluate(() => document.querySelector('#action-result')?.textContent) };
  });
}

const sentinel1 = sdkUp ? await clientSentinel(page, 'sentinel') : false;
const pageloadArrived = sdkUp && await until('pageload span', async () => hasSpan(await get('/__items'), s => s.op === 'pageload'), 120, 250);

if (sdkUp) {
  await step('click #nav-user (Link to /users/42, client-side navigation)', async () => {
    await page.click('#nav-user');
    const navigated = await until('user page', () => page.evaluate(() => document.querySelector('#user-id')?.textContent === '42'), 60, 100);
    const navSpan = await until('navigation span', async () => hasSpan(await get('/__items'), s => s.op === 'navigation'), 120, 250);
    return { navigated, navSpan, path: await page.evaluate(() => location.pathname) };
  });
}

await step('fetch /api/route-throw (App Router route handler throws)', async () => {
  const status = await page.evaluate(() => fetch('/api/route-throw').then(r => r.status));
  return { status, serverEvent: await until('route handler event', () => eventWith('Route handler throw'), 100, 100) };
});
await step('fetch /api/pages-hello and /api/pages-throw (Pages Router API routes)', async () => {
  const hello = await page.evaluate(() => fetch('/api/pages-hello').then(r => r.json()));
  const status = await page.evaluate(() => fetch('/api/pages-throw').then(r => r.status));
  return { hello, throwStatus: status, serverEvent: await until('pages api event', () => eventWith('Pages API throw'), 60, 100) };
});
await step('goto /server-throw (server component throws; global-error.tsx on the client)', async () => {
  await page.goto(`${app}/server-throw`, { waitUntil: 'load' });
  const serverEvent = await until('server component event', () => eventWith('Server component throw'), 100, 100);
  const clientEvent = await until('global-error captureException', async () => hasEvent(await get('/__items'), i => i.via?.side === 'browser' && String(i.exception ?? '').includes('Server Components render')), 60, 100);
  return { serverEvent, clientEvent, bodyText: (await page.evaluate(() => document.body.innerText)).slice(0, 200) };
});
await step('goto /pages-verify, click "Throw Test Error" (pages-router.mdx:291-304)', async () => {
  await page.goto(`${app}/pages-verify`, { waitUntil: 'load' });
  const up = await until('client SDK on pages route', () => page.evaluate(() => !!(window.Sentry && window.Sentry.getClient && window.Sentry.getClient())), 40);
  await page.click('text=Throw Test Error');
  const arrived = await until('pages verify event', async () => (await get('/__items')).filter(i => i.type === 'event' && String(i.exception ?? '').includes('Sentry Test Error')).length >= (variant === 'pages-router' ? 1 : 2), 100, 100);
  return { sdkUp: up, eventArrived: arrived };
});
await step('goto /pages-ssr-throw (getServerSideProps throws, pages/_error.tsx captureUnderscoreErrorException)', async () => {
  const res = await page.goto(`${app}/pages-ssr-throw`, { waitUntil: 'load' });
  return { status: res?.status(), serverEvent: await until('pages ssr event', () => eventWith('Pages SSR throw'), 100, 100), bodyText: (await page.evaluate(() => document.body.innerText)).slice(0, 120) };
});

const serverSentinelResult = await serverSentinel('sentinel-server');
await page.goto(`${app}/`, { waitUntil: 'load' });
const sentinel2 = await clientSentinel(page, 'sentinel-2');
const replayArrived = sdkUp && await until('replay envelope', async () => (await get('/__items')).some(i => i.type === 'replay_event'), 80, 250);
await page.evaluate(() => window.Sentry && window.Sentry.flush(5000)).catch(() => {});

const serverMeta = await fetch(`${app}/api/meta`).then(r => r.json()).catch(e => ({ threw: String(e) }));
const [items, raw, headers] = await Promise.all([get('/__items'), get('/__items?raw=1'), get('/__headers')]);
const readLog = p => (p ? readFileSync(p, 'utf8').split('\n').filter(Boolean) : []);

const summary = {
  itemTypes: items.map(i => `${i.via?.side}:${i.type}`),
  events: items.filter(i => i.type === 'event').map(i => ({ side: i.via?.side, path: i.via?.path, message: i.message, exception: i.exception, mechanism: i.mechanism, handled: i.handled, transaction: i.transaction, runtime: i.runtime, trace_id: i.trace_id })),
  spans: items.filter(i => i.type === 'span').flatMap(i => i.raw).map(s => ({ side: s.via?.side, op: s.op, name: s.name, is_segment: s.is_segment, segment_name: s.segment_name, source: s.source, origin: s.origin, route: s.route, url_path: s.url_path, status: s.status, trace_id: s.trace_id })),
  logs: items.filter(i => i.type === 'log').map(i => ({ side: i.via?.side, items: i.items })),
  sessions: items.filter(i => i.type === 'session').map(i => ({ side: i.via?.side, status: i.status, errors: i.errors, init: i.init })),
  replay: items.filter(i => i.type === 'replay_event').length,
  clientReports: items.filter(i => i.type === 'client_report').map(i => i.discarded_events),
  headers,
  blockedRequests,
  tunnelResponses,
};

writeFileSync(
  new URL(`./${resultName}.json`, import.meta.url),
  JSON.stringify({ variant, meta: { client: meta, server: serverMeta }, steps, sentinel1, sentinel2, serverSentinel: serverSentinelResult, pageloadArrived, replayArrived, summary, console: consoleLines, pageErrors, serverLog: readLog(process.env.SERVER_LOG), buildLog: readLog(process.env.BUILD_LOG), items, raw }, null, 2),
);
await browser.close();
console.log(`wrote ${resultName}.json (${items.length} sink items, ${pageErrors.length} page errors, sentinel=${sentinel1}/${sentinel2}, server sentinel=${serverSentinelResult.ok}, pageload=${pageloadArrived}, replay=${replayArrived}, blocked=${blockedRequests.length})`);
