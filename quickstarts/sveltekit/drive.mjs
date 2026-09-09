// Playwright driver. Usage: node drive.mjs <variant>
// One headless system Chrome per run. Every wait is a condition on the sink or the page, never a
// sleep: the run ends with a sentinel message plus a sentinel span on both sides and polls for
// those (hard deadline 60 s), so everything captured before them is known to have arrived.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const variant = process.argv[2] ?? 'base';
const app = process.env.APP_URL ?? 'http://localhost:4755';
const sink = process.env.SINK_URL ?? 'http://127.0.0.1:4754';
const withTracing = process.env.QS_TRACING !== '0';
const resultName = `results-${variant}`;

const consoleLines = [];
const pageErrors = [];
const steps = [];

const get = path => fetch(`${sink}${path}`).then(r => r.json());
const items = () => get('/__items');

async function until(label, check, tries = 200, waitMs = 150) {
  for (let i = 0; i < tries; i++) {
    if (await check()) return true;
    await new Promise(r => setTimeout(r, waitMs));
  }
  console.error(`[drive] gave up waiting for ${label}`);
  return false;
}

const hasEvent = (list, pred) => list.some(i => i.type === 'event' && pred(i));
const countEvents = (list, pred) => list.filter(i => i.type === 'event' && pred(i)).length;
const hasSpan = (list, pred) => list.some(i => i.type === 'span' && (i.raw || []).some(s => pred(s, i)));

async function step(label, fn) {
  const before = (await items()).length;
  let result;
  try {
    result = await fn();
  } catch (e) {
    result = { threw: String(e?.message ?? e) };
  }
  steps.push({ label, result: result ?? null, itemsBefore: before });
}

async function sentinel(page, name) {
  await page.evaluate(n => window.__qsSentinel(n), name);
  const server = await fetch(`${app}/sentinel?name=${name}`).then(r => r.json()).catch(e => ({ threw: String(e) }));
  const ok = await until(`sentinel ${name}`, async () => {
    const list = await items();
    const clientEvent = hasEvent(list, i => i.side === 'client' && i.message === name);
    const serverEvent = hasEvent(list, i => i.side === 'server' && i.message === name);
    const clientSpan = !withTracing || hasSpan(list, (s, i) => i.side === 'client' && s.name === `${name}-span`);
    const serverSpan = !withTracing || hasSpan(list, (s, i) => i.side === 'server' && s.name === `${name}-span`);
    return clientEvent && serverEvent && clientSpan && serverSpan;
  }, 400, 150);
  return { ok, server };
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext();
const page = await context.newPage();
page.on('console', m => consoleLines.push(`${m.type()}: ${m.text()}`));
page.on('pageerror', e => pageErrors.push(String(e && e.message ? e.message : e)));

await page.goto(`${app}/sentry-example`, { waitUntil: 'load' });
const sdkUp = await until('SDK init', () => page.evaluate(() => !!(window.Sentry && window.Sentry.getClient && window.Sentry.getClient())), 60);
const meta = await page.evaluate(() => (window.__qsMeta ? window.__qsMeta() : { initialized: false }));
steps.push({
  label: 'boot /sentry-example',
  result: {
    sdkUp,
    pageErrorsAtBoot: pageErrors.slice(),
    feedbackWidget: await page.evaluate(() => !!document.querySelector('#sentry-feedback')),
    traceMeta: await page.evaluate(() => ({
      'sentry-trace': document.querySelector('meta[name="sentry-trace"]')?.getAttribute('content') ?? null,
      baggage: document.querySelector('meta[name="baggage"]')?.getAttribute('content') ?? null,
    })),
    fetchProxy: await page.evaluate(() => typeof window._sentryFetchProxy),
  },
});

// getting-started-complete/javascript.sveltekit.mdx:561-582: the traced button fetches /sentry-example,
// whose +server.ts (:536-540) throws, then throws "Sentry Example Frontend Error" itself.
await step('click "Throw error with trace" (:561-582, fetch /sentry-example -> +server.ts :536-540 throws)', async () => {
  await page.click('button:has-text("Throw error with trace")');
  const serverEvent = await until('server API route event', async () => hasEvent(await items(), i => i.side === 'server' && String(i.exception).includes('Sentry Example API Route Error')), 200, 150);
  const clientEvent = await until('client frontend event', async () => hasEvent(await items(), i => i.side === 'client' && String(i.exception).includes('Sentry Example Frontend Error')), 200, 150);
  return { serverEvent, clientEvent };
});

// :510-518, the plain verify page, reached by a client-side navigation.
await step('navigate #nav-example-plain and click "Throw error" (:510-518)', async () => {
  const before = countEvents(await items(), i => i.side === 'client' && String(i.exception).includes('Sentry Example Frontend Error'));
  await page.click('#nav-example-plain');
  await until('plain page', () => page.evaluate(() => location.pathname === '/sentry-example-plain' && !!document.querySelector('button')), 40, 100);
  await page.click('button:has-text("Throw error")');
  const captured = await until('plain client event', async () => countEvents(await items(), i => i.side === 'client' && String(i.exception).includes('Sentry Example Frontend Error')) > before, 200, 150);
  return { captured, path: await page.evaluate(() => location.pathname) };
});

await step('click #nav-user (client-side navigation to /users/[id], server + universal load)', async () => {
  await page.click('#nav-user');
  const navigated = await until('user page', () => page.evaluate(() => document.querySelector('#user-id')?.textContent === '42'), 40, 100);
  const navSpan = !withTracing || await until('navigation span', async () => hasSpan(await items(), (s, i) => i.side === 'client' && s.op === 'navigation'), 120, 250);
  return { navigated, navSpan, path: await page.evaluate(() => location.pathname), heading: await page.evaluate(() => document.querySelector('h1')?.textContent) };
});

await step('click #nav-load-throws (server load throws "Sentry Example Load Error")', async () => {
  await page.click('#nav-load-throws');
  const serverEvent = await until('load error event', async () => hasEvent(await items(), i => i.side === 'server' && String(i.exception).includes('Sentry Example Load Error')), 200, 150);
  const errorPage = await until('error page', () => page.evaluate(() => /error|500/i.test(document.body.innerText)), 40, 100);
  return { serverEvent, errorPage, path: await page.evaluate(() => location.pathname), bodyText: await page.evaluate(() => document.body.innerText.slice(0, 200)) };
});

await step('fetch /server-fetch from the page (server-side global fetch + event.fetch to the recorder)', async () => {
  const res = await page.evaluate(() => fetch('/server-fetch').then(r => r.json()).catch(e => ({ threw: String(e) })));
  const hits = await until('server recorder hits', async () => (await get('/__headers')).filter(h => h.url.includes('from=server')).length >= 2, 60, 100);
  return { res, hits, headers: (await get('/__headers')).filter(h => h.url.includes('from=server')) };
});

await step('fetch /api/echo from the page (trace headers the server received from the browser)', () =>
  page.evaluate(() => fetch('/api/echo').then(r => r.json()).catch(e => ({ threw: String(e) }))));

await step('fetch the cross-origin recorder from the page', async () => {
  await page.evaluate(() => fetch('http://127.0.0.1:4754/recorder?from=client-cross-origin').then(r => r.json()).catch(e => ({ threw: String(e) })));
  const hit = await until('client recorder hit', async () => (await get('/__headers')).some(h => h.url.includes('from=client')), 60, 100);
  return { hit, headers: (await get('/__headers')).filter(h => h.url.includes('from=client')) };
});

await step('GET /sentry-example from node (Accept */*, no browser trace) and GET /nope (unknown route)', async () => {
  const before = countEvents(await items(), i => i.side === 'server' && String(i.exception).includes('Sentry Example API Route Error'));
  const a = await fetch(`${app}/sentry-example`).then(r => ({ status: r.status })).catch(e => ({ threw: String(e) }));
  const b = await fetch(`${app}/nope`).then(r => ({ status: r.status })).catch(e => ({ threw: String(e) }));
  const captured = await until('second API route event', async () => countEvents(await items(), i => i.side === 'server' && String(i.exception).includes('Sentry Example API Route Error')) > before, 200, 150);
  return { sentryExample: a, nope: b, captured };
});

const sentinel1 = await sentinel(page, 'sentinel');
await page.evaluate(() => window.Sentry && window.Sentry.flush(5000));

// The pageload segment ends after the browser tracing idle timeout, so it lands after the sentinel.
const pageloadArrived = withTracing && sdkUp && (await until('pageload span', async () => hasSpan(await items(), (s, i) => i.side === 'client' && s.op === 'pageload'), 120, 250));

// Session Replay: with replaysOnErrorSampleRate 1.0 the buffered replay is only sent once the session
// is longer than `minReplayDuration` (5 s by default), so give it one more error and a bounded wait.
await page.evaluate(() => window.Sentry.captureException(new Error('Error for the replay buffer')));
const replayArrived = await until('replay envelope', async () => (await items()).some(i => i.type === 'replay_event'), 80, 250);
steps.push({ label: 'replay after minReplayDuration', result: { replayArrived } });

await page.evaluate(() => window.Sentry && window.Sentry.flush(5000));
const [list, raw, headers] = await Promise.all([items(), get('/__items?raw=1'), get('/__headers')]);

const readLog = name => (existsSync(new URL(`./${name}`, import.meta.url)) ? readFileSync(new URL(`./${name}`, import.meta.url), 'utf8').split('\n') : []);
const buildLog = readLog(`build-${variant}.log`);
const serverLog = readLog(`server-${variant}.log`);

const summary = {
  itemTypes: list.map(i => `${i.side}:${i.type}`),
  events: list.filter(i => i.type === 'event').map(i => ({ side: i.side, message: i.message, exception: i.exception, mechanism: i.mechanism, handled: i.handled, transaction: i.transaction, trace_id: i.trace_id, sdk: `${i.sdk}@${i.sdk_version}`, request: i.request?.url })),
  spans: list.filter(i => i.type === 'span').flatMap(i => i.raw.map(s => ({ side: i.side, op: s.op, name: s.name, is_segment: s.is_segment, segment_name: s.segment_name, source: s.source, origin: s.origin, route: s.route, url_path: s.url_path, status: s.status, status_code: s.status_code, trace_id: s.trace_id }))),
  logs: list.filter(i => i.type === 'log').flatMap(i => i.items),
  sessions: list.filter(i => i.type === 'session' || i.type === 'sessions').map(i => ({ side: i.side, status: i.status, errors: i.errors, init: i.init, aggregates: i.aggregates })),
  replay: list.filter(i => i.type === 'replay_event').length,
  clientReports: list.filter(i => i.type === 'client_report').map(i => i.discarded_events),
  headers,
  sdkNames: [...new Set(list.map(i => `${i.side}:${i.envSdk ?? i.sdk}`))],
};

const console_ = {
  browser: consoleLines,
  pageErrors,
  build: buildLog,
  serverHead: serverLog.slice(0, 120),
  serverSentryLogger: serverLog.filter(l => l.includes('Sentry Logger') || l.startsWith('[qs]')),
  serverWarnings: serverLog.filter(l => /warn|deprecat/i.test(l)),
};

writeFileSync(
  new URL(`./${resultName}.json`, import.meta.url),
  JSON.stringify({ variant, meta, steps, sentinel: sentinel1, pageloadArrived, summary, console: console_, items: list, raw }, null, 2),
);

await browser.close();
console.log(`wrote ${resultName}.json (${list.length} sink items, ${pageErrors.length} page errors, sentinel=${sentinel1.ok}, pageload=${pageloadArrived}, replay=${replayArrived})`);
