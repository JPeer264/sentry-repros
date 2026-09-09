// Playwright driver. Usage: node drive.mjs <variant>
// One headless system Chrome per run. Every wait is a condition on the sink or the page, never a
// sleep: the run ends with a sentinel message plus a sentinel span and polls for those (60 s deadline),
// so everything captured before them is known to have arrived.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const variant = process.argv[2] ?? 'base';
const base = process.env.BASE_URL ?? 'http://localhost:4766';
const resultName = process.env.RESULT_NAME ?? `results-${variant}`;

const consoleLines = [];
const pageErrors = [];
const steps = [];

const get = path => fetch(`${base}${path}`).then(r => r.json());

async function until(label, check, tries = 240, waitMs = 250) {
  for (let i = 0; i < tries; i++) {
    if (await check()) return true;
    await new Promise(r => setTimeout(r, waitMs));
  }
  console.error(`[drive] gave up waiting for ${label}`);
  return false;
}

const hasEvent = (items, pred) => items.some(i => i.type === 'event' && pred(i));
const hasSpan = (items, pred) => items.some(i => i.type === 'span' && (i.raw || []).some(pred));
const hasTransaction = (items, pred) => items.some(i => i.type === 'transaction' && pred(i));

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
  if (!(await page.evaluate(() => typeof window.__qsSentinel === 'function'))) return false;
  await page.evaluate(n => window.__qsSentinel(n), name);
  return until(`sentinel ${name}`, async () => {
    const items = await get('/__items');
    return hasEvent(items, i => i.message === name) && hasSpan(items, s => s.name === `${name}-span`);
  });
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext();
const page = await context.newPage();
page.on('console', m => consoleLines.push(`${m.type()}: ${m.text()}`));
page.on('pageerror', e => pageErrors.push(String(e && e.message ? e.message : e)));

await page.goto(`${base}/`, { waitUntil: 'load' });
const sdkUp = await until('SDK init', () => page.evaluate(() => !!(window.Sentry && window.Sentry.getClient && window.Sentry.getClient())), 40);
const appUp = await until('application template rendered', () => page.evaluate(() => document.querySelector('#btn-throw') !== null), 40);

const meta = await page.evaluate(() => (window.__qsMeta ? window.__qsMeta() : { initialized: false }));
steps.push({
  label: 'boot',
  result: {
    sdkUp,
    appUp,
    pageErrorsAtBoot: pageErrors.slice(),
    bodyText: await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim().slice(0, 200)),
    emberApp: await page.evaluate(() => !!document.querySelector('.ember-application')),
    feedbackWidget: await page.evaluate(() => !!document.querySelector('#sentry-feedback')),
  },
});

if (appUp) {
  await step('click #btn-throw (index.mdx:191-206, startSpan "Example Span" + setTimeout throw "Sentry Test Error")', async () => {
    await page.click('#btn-throw');
    const eventArrived = await until('test error event', async () => hasEvent(await get('/__items'), i => String(i.exception).includes('Sentry Test Error')), 60);
    return { eventArrived };
  });
  await step('click #btn-fetch (relative + absolute same-origin fetch to /recorder)', async () => {
    await page.click('#btn-fetch');
    const recorderHits = await until('recorder hits', async () => (await get('/__headers')).length >= 2, 60);
    return { recorderHits, headers: await get('/__headers') };
  });
  await step('click #nav-user (LinkTo user route, /users/:user_id, instrumentRoutePerformance)', async () => {
    await page.click('#nav-user');
    const navigated = await until('user page', () => page.evaluate(() => document.querySelector('#user-id')?.textContent === '42'), 40);
    return {
      navigated,
      path: await page.evaluate(() => location.pathname),
      helloComponents: await page.evaluate(() => [...document.querySelectorAll('.hello')].map(e => e.textContent)),
    };
  });
  await step('click #nav-home (LinkTo index)', async () => {
    await page.click('#nav-home');
    return { home: await until('home page', () => page.evaluate(() => location.pathname === '/' && document.querySelector('#user-id') === null), 40) };
  });
}

const sentinel1 = await sentinel(page, 'sentinel');
await page.evaluate(() => window.Sentry && window.Sentry.flush(5000));

const tracingInstalled = (meta.integrations || []).includes('BrowserTracing');
const pageloadArrived = sdkUp && await until('pageload span', async () => {
  const items = await get('/__items');
  return hasSpan(items, s => s.op === 'pageload') || hasTransaction(items, t => t.op === 'pageload');
}, tracingInstalled ? 120 : 8);
const navigationArrived = sdkUp && await until('navigation span', async () => {
  const items = await get('/__items');
  return hasSpan(items, s => s.op === 'navigation') || hasTransaction(items, t => t.op === 'navigation');
}, tracingInstalled ? 120 : 4);

// Session Replay (index.mdx:72, 96-97): the buffered replay is only sent once the session is at least
// minReplayDuration (5 s) old, so give it one more error and a bounded wait.
let replayArrived = false;
if (sdkUp) {
  await page.evaluate(() => window.Sentry.captureException(new Error('Error for the replay buffer')));
  replayArrived = await until('replay envelope', async () => (await get('/__items')).some(i => i.type === 'replay_event'), 60);
  steps.push({ label: 'replay after minReplayDuration', result: { replayArrived } });
}

await page.evaluate(() => window.Sentry && window.Sentry.flush(5000));
const [items, raw, headers] = await Promise.all([get('/__items'), get('/__items?raw=1'), get('/__headers')]);

const buildLog = existsSync(new URL(`./build-${variant}.log`, import.meta.url))
  ? readFileSync(new URL(`./build-${variant}.log`, import.meta.url), 'utf8').split('\n')
  : [];

const summary = {
  itemTypes: items.map(i => i.type),
  events: items.filter(i => i.type === 'event').map(i => ({ message: i.message, exception: i.exception, mechanism: i.mechanism, handled: i.handled, transaction: i.transaction, sdk: i.sdk, sdk_version: i.sdk_version, integrations: i.integrations })),
  spans: items.filter(i => i.type === 'span').flatMap(i => i.raw).map(s => ({ op: s.op, name: s.name, is_segment: s.is_segment, segment_name: s.segment_name, source: s.source, origin: s.origin, url_path: s.url_path, url_template: s.attributes?.['url.template'], component: s.component, queue: s.attributes?.['ember.runloop.queue'], fn: s.attributes?.['code.function.name'], status: s.status, duration_ms: s.duration_ms })),
  transactions: items.filter(i => i.type === 'transaction').map(t => ({ name: t.name, op: t.op, source: t.source, spans: t.spans })),
  sessions: items.filter(i => i.type === 'session').map(i => ({ status: i.status, errors: i.errors, init: i.init })),
  logs: items.filter(i => i.type === 'log').flatMap(i => i.items),
  replay: items.filter(i => i.type === 'replay_event').length,
  headers,
  buildWarnings: buildLog.filter(l => /warn|deprecat|error/i.test(l)),
};

writeFileSync(
  new URL(`./${resultName}.json`, import.meta.url),
  JSON.stringify({ variant, meta, steps, sentinel1, pageloadArrived, navigationArrived, replayArrived, summary, console: consoleLines, pageErrors, build: buildLog, items, headers, raw }, null, 2),
);
writeFileSync(
  new URL(`./app-${variant}.log`, import.meta.url),
  [`# page errors`, ...pageErrors, ``, `# console`, ...consoleLines].join('\n'),
);

await browser.close();
console.log(`wrote ${resultName}.json (${items.length} sink items, ${pageErrors.length} page errors, sentinel=${sentinel1}, pageload=${pageloadArrived}, navigation=${navigationArrived}, replay=${replayArrived})`);
