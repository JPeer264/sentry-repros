// Playwright driver. Usage: node drive.mjs <variant>
// One headless system Chrome per run. Every wait is a condition on the sink or the page, never a sleep:
// the run ends with a sentinel message plus span on both sides and polls the sink for those (60 s hard
// deadline), so everything captured before them is known to have arrived.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { chromium } from 'playwright-core';

const variant = process.argv[2] ?? 'nitro';
const app = process.env.APP_URL ?? 'http://localhost:4763';
const sink = process.env.SINK_URL ?? 'http://localhost:4762';
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

const hasEvent = (items, side, pred) => items.some(i => i.type === 'event' && i.side === side && pred(i));
const hasSpan = (items, side, pred) => items.some(i => i.type === 'span' && i.side === side && (i.raw || []).some(pred));
const spansOf = (items, side) => items.filter(i => i.type === 'span' && i.side === side).flatMap(i => i.raw);

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

async function sentinel(page, name) {
  const clientHook = await page.evaluate(() => typeof window.__qsSentinel === 'function');
  if (clientHook) await page.evaluate(n => window.__qsSentinel(n), name);
  const server = await fetch(`${app}/api/sentinel?name=${name}`).then(r => r.json()).catch(e => ({ error: String(e) }));
  // 400 x 150 ms = 60 s hard deadline per variant.
  const clientOk = clientHook && (await until(`client sentinel ${name}`, async () => {
    const items = await get('/__items');
    return hasEvent(items, 'client', i => i.message === name) && hasSpan(items, 'client', s => s.name === `${name}-span`);
  }, 400));
  const serverOk = await until(`server sentinel ${name}`, async () => {
    const items = await get('/__items');
    return hasEvent(items, 'server', i => i.message === name) && hasSpan(items, 'server', s => s.name === `${name}-span`);
  }, 400);
  return { clientOk, serverOk, serverMeta: server };
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext();
const page = await context.newPage();
page.on('console', m => consoleLines.push(`${m.type()}: ${m.text()}`));
page.on('pageerror', e => pageErrors.push(String(e && e.message ? e.message : e)));

await page.goto(`${app}/`, { waitUntil: 'load' });
const sdkUp = await until('SDK init', () => page.evaluate(() => !!(window.Sentry && window.Sentry.getClient && window.Sentry.getClient())), 60);
const hydrated = await until('hydrated', () => page.evaluate(() => document.documentElement.getAttribute('data-hydrated') === 'true'), 60);
const clientMeta = await page.evaluate(() => (window.__qsMeta ? window.__qsMeta() : { initialized: false }));
steps.push({ label: 'boot /', result: { sdkUp, hydrated, pageErrorsAtBoot: pageErrors.slice(), feedbackWidget: await page.evaluate(() => !!document.querySelector('#sentry-feedback')) } });

if (hydrated) {
  await step('click #btn-throw (index.mdx:582-591, onClick throws "Sentry Test Error")', () => page.click('#btn-throw'));
  await step('click #btn-span (index.mdx:649-669, startSpan + fetch /api/sentry-example, index.mdx:609-630 throws)', async () => {
    await page.click('#btn-span');
    const serverEvent = await until('route error event', async () => hasEvent(await get('/__items'), 'server', i => String(i.exception).includes('Sentry Example Route Error')), 100);
    return { serverEvent };
  });
  await step('click #btn-serverfn (createServerFn handler throws)', async () => {
    await page.click('#btn-serverfn');
    const serverEvent = await until('server fn event', async () => hasEvent(await get('/__items'), 'server', i => String(i.exception).includes('Server Function')), 100);
    return { serverEvent };
  });
  await step('click #btn-fetch (same-origin fetch to /api/server-fetch, which fetches the sink recorder)', async () => {
    await page.click('#btn-fetch');
    const done = await until('fetch result', () => page.evaluate(() => (document.querySelector('#fetch-result')?.textContent ?? '').length > 2), 60);
    const recorded = await until('recorder hit', async () => (await get('/__headers')).length >= 1, 60);
    return { done, recorded, echoed: await page.evaluate(() => document.querySelector('#fetch-result')?.textContent), headers: await get('/__headers') };
  });
  await step('click #nav-user (client-side navigation to /users/$userId with userId=7)', async () => {
    await page.click('#nav-user');
    const navigated = await until('user page', () => page.evaluate(() => document.querySelector('#user-id')?.textContent === '7'), 60, 100);
    const navSpan = await until('navigation span', async () => hasSpan(await get('/__items'), 'client', s => s.op === 'navigation'), 200);
    return { navigated, navSpan, path: await page.evaluate(() => location.pathname) };
  });
  await step('click #nav-loader (client-side navigation to /loader-error, loader throws)', async () => {
    await page.click('#nav-loader');
    const boundary = await until('loader error component', () => page.evaluate(() => document.querySelector('#loader-error-boundary') !== null), 60, 100);
    return { boundary, text: await page.evaluate(() => document.querySelector('#loader-error-boundary')?.textContent), path: await page.evaluate(() => location.pathname) };
  });
}

const sentinel1 = await sentinel(page, 'sentinel');
await page.evaluate(() => window.Sentry && window.Sentry.flush(5000)).catch(() => {});
const pageloadArrived = sdkUp && (await until('pageload span', async () => hasSpan(await get('/__items'), 'client', s => s.op === 'pageload'), 120, 250));

// Fresh documents: SSR of a parameterized route and of the throwing loader.
await step('goto /users/42 (SSR of the parameterized route)', async () => {
  await page.goto(`${app}/users/42`, { waitUntil: 'load' });
  const ok = await until('user 42', () => page.evaluate(() => document.querySelector('#user-id')?.textContent === '42'), 60, 100);
  return { rendered: ok };
});
await step('goto /loader-error (SSR, loader throws on the server)', async () => {
  const res = await page.goto(`${app}/loader-error`, { waitUntil: 'load' });
  const boundary = await until('ssr loader error component', () => page.evaluate(() => document.querySelector('#loader-error-boundary') !== null), 60, 100);
  return { status: res?.status(), boundary };
});
const sentinel2 = await sentinel(page, 'sentinel-2');
await page.evaluate(() => window.Sentry && window.Sentry.flush(5000)).catch(() => {});
const pageload2 = sdkUp && (await until('second pageload span', async () => spansOf(await get('/__items'), 'client').filter(s => s.op === 'pageload').length >= 3, 120, 250));

const [items, raw, headers] = await Promise.all([get('/__items'), get('/__items?raw=1'), get('/__headers')]);
const summary = {
  itemTypes: items.map(i => `${i.side}:${i.type}`),
  events: items.filter(i => i.type === 'event').map(i => ({ side: i.side, message: i.message, exception: i.exception, mechanism: i.mechanism, handled: i.handled, transaction: i.transaction, request: i.request?.url, trace_id: i.trace_id })),
  spans: items.filter(i => i.type === 'span').flatMap(i => (i.raw || []).map(s => ({ side: i.side, op: s.op, name: s.name, is_segment: s.is_segment, segment_name: s.segment_name, source: s.source, origin: s.origin, route: s.route, url_path: s.url_path, status: s.status, status_code: s.status_code, trace_id: s.trace_id }))),
  transactions: items.filter(i => i.type === 'transaction').map(i => ({ side: i.side, name: i.name, op: i.op, source: i.source })),
  logs: items.filter(i => i.type === 'log').flatMap(i => i.items),
  sessions: items.filter(i => i.type === 'session').map(i => ({ side: i.side, status: i.status, errors: i.errors, init: i.init })),
  replay: items.filter(i => i.type === 'replay_event').length,
  headers,
};

const readLog = name => (existsSync(new URL(`./${name}`, import.meta.url)) ? readFileSync(new URL(`./${name}`, import.meta.url), 'utf8').split('\n') : []);
const buildLog = readLog(`build-${variant}.log`);
const serverLog = readLog(`server-${variant}.log`);

writeFileSync(
  new URL(`./${resultName}.json`, import.meta.url),
  JSON.stringify({
    variant,
    clientMeta,
    serverMeta: sentinel1.serverMeta,
    steps,
    sentinel1: { clientOk: sentinel1.clientOk, serverOk: sentinel1.serverOk },
    sentinel2: { clientOk: sentinel2.clientOk, serverOk: sentinel2.serverOk },
    pageloadArrived,
    pageload2,
    summary,
    console: { browser: consoleLines, pageErrors, build: buildLog.filter(l => /sentry|warn|error|exit=|built in|\.output|dist\//i.test(l)), server: serverLog },
    items,
    headers,
    raw,
  }, null, 2),
);

await browser.close();
console.log(`wrote ${resultName}.json (${items.length} sink items, ${pageErrors.length} page errors, sentinel client=${sentinel1.clientOk} server=${sentinel1.serverOk}, pageload=${pageloadArrived})`);
