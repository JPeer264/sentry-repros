// Playwright driver. Usage: node drive.mjs <variant> <page path>
// One headless system Chrome per run. Every wait is a condition on the sink or the page, never a
// sleep: each phase ends with a sentinel message plus a sentinel span and polls for those (hard
// deadline 60s), so everything captured before them is known to have arrived.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const variant = process.argv[2] ?? 'base';
const pagePath = process.argv[3] ?? '/';
const site = process.env.SITE_URL ?? 'http://localhost:4769';
const sink = process.env.SINK_URL ?? 'http://localhost:4768';
const resultName = process.env.RESULT_NAME ?? `results-${variant}`;

const consoleLines = [];
const pageErrors = [];
const steps = [];

const get = path => fetch(`${sink}${path}`).then(r => r.json());

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
const spansOf = (items, op) => items.filter(i => i.type === 'span').flatMap(i => i.raw).filter(s => s.op === op);

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

await page.goto(`${site}${pagePath}`, { waitUntil: 'load' });
const sdkUp = await until('SDK init', () => page.evaluate(() => !!(window.Sentry && window.Sentry.getClient && window.Sentry.getClient())), 60);
const appUp = await until('app rendered', () => page.evaluate(() => document.body.getAttribute('data-wired') === '1'), 40);

const meta = await page.evaluate(() => (window.__qsMeta ? window.__qsMeta() : { initialized: false }));
steps.push({
  label: 'boot',
  result: {
    sdkUp,
    appUp,
    pageErrorsAtBoot: pageErrors.slice(),
    feedbackWidget: await page.evaluate(() => !!document.querySelector('#sentry-feedback')),
    path: await page.evaluate(() => location.pathname),
    userId: await page.evaluate(() => document.querySelector('#user-id')?.textContent ?? null),
  },
});

if (appUp && variant === 'base') {
  // The guide's verify buttons (index.mdx:194-203, 223-234, logs include) plus the propagation probe.
  await step('click #btn-throw (index.mdx:194-203, onClick throws "Sentry Test Error")', () => page.click('#btn-throw'));
  await step('click #btn-span (index.mdx:223-234, startSpan + synchronous throw)', () => page.click('#btn-span'));
  await step('click #btn-log (includes/logs/javascript-quick-start-verify-logs-splitlayout.mdx:13-23)', () => page.click('#btn-log'));
  await step('click #btn-fetch (same-origin page-data.json + cross-origin localhost /recorder)', async () => {
    await page.click('#btn-fetch');
    const ok = await until('recorder hit', async () => (await get('/__headers')).length >= 1, 60);
    return { recorderHit: ok, headers: await get('/__headers') };
  });
}

const sentinel1 = await sentinel(page, 'sentinel');
await page.evaluate(() => window.Sentry && window.Sentry.flush(5000));

// The pageload segment ends after the browser tracing idle timeout, so it lands after the sentinel.
const pageloadArrived = sdkUp && (await until('pageload span', async () => hasSpan(await get('/__items'), s => s.op === 'pageload'), 120, 250));
const itemsAfterVerify = await get('/__items');

if (appUp && variant === 'base') {
  await step('click #nav-user (Gatsby Link to /users/42/, a matchPath client-only route)', async () => {
    await page.click('#nav-user');
    const navigated = await until('user page', () => page.evaluate(() => document.querySelector('#user-id')?.textContent === '42'), 40, 100);
    const navSpan = await until('navigation span', async () => spansOf(await get('/__items'), 'navigation').length >= 1, 120, 250);
    return { navigated, navSpan, path: await page.evaluate(() => location.pathname) };
  });
  await step('click #nav-home (Link to /)', async () => {
    await page.click('#nav-home');
    const home = await until('home page', () => page.evaluate(() => location.pathname === '/' && document.querySelector('#nav-about') !== null), 40, 100);
    return { home };
  });
  await step('click #nav-about (Link to /about/, a static page)', async () => {
    await page.click('#nav-about');
    const about = await until('about page', () => page.evaluate(() => document.querySelector('#about-title') !== null), 40, 100);
    return { about, path: await page.evaluate(() => location.pathname) };
  });
  const sentinel2 = await sentinel(page, 'sentinel-2');
  await page.evaluate(() => window.Sentry && window.Sentry.flush(5000));
  const threeNavs = await until('three navigation spans', async () => spansOf(await get('/__items'), 'navigation').length >= 3, 60, 250);
  steps.push({ label: 'navigation spans after sentinel-2', result: { sentinel2, threeNavs, navigations: spansOf(await get('/__items'), 'navigation').map(s => ({ name: s.name, source: s.source, is_segment: s.is_segment })) } });
}

if (appUp && variant === 'client-route') {
  await step('click #nav-home (first navigation, from /users/42/ to /, a prefix of the starting URL)', async () => {
    await page.click('#nav-home');
    const home = await until('home page', () => page.evaluate(() => location.pathname === '/' && document.querySelector('#nav-about') !== null), 40, 100);
    const navSpan = await until('navigation span', async () => spansOf(await get('/__items'), 'navigation').length >= 1, 60, 250);
    return { home, navSpan };
  });
  await step('window.___navigate("/about/") (second navigation on the same document)', async () => {
    await page.evaluate(() => window.___navigate('/about/'));
    const about = await until('about page', () => page.evaluate(() => document.querySelector('#about-title') !== null), 40, 100);
    const navSpan = await until('navigation span', async () => spansOf(await get('/__items'), 'navigation').length >= 1, 60, 250);
    return { about, navSpan, navigations: spansOf(await get('/__items'), 'navigation').map(s => ({ name: s.name, url: s.url })) };
  });
  const sentinel2 = await sentinel(page, 'sentinel-2');
  await page.evaluate(() => window.Sentry && window.Sentry.flush(5000));
  steps.push({ label: 'after sentinel-2', result: { sentinel2 } });

  // Control: a fresh load of /users/42/ whose first navigation goes to a URL that is not a prefix.
  await step('reload /users/42/ then window.___navigate("/about/") as the first navigation', async () => {
    await page.goto(`${site}/users/42/`, { waitUntil: 'load' });
    const up = await until('SDK init after reload', () => page.evaluate(() => !!(window.Sentry && window.Sentry.getClient && window.Sentry.getClient() && document.body.getAttribute('data-wired') === '1')), 60);
    const before = spansOf(await get('/__items'), 'navigation').length;
    await page.evaluate(() => window.___navigate('/about/'));
    const about = await until('about page', () => page.evaluate(() => document.querySelector('#about-title') !== null), 40, 100);
    const navSpan = await until('navigation span after reload', async () => spansOf(await get('/__items'), 'navigation').length > before, 60, 250);
    return { up, about, navSpan, navigations: spansOf(await get('/__items'), 'navigation').map(s => ({ name: s.name, url: s.url })) };
  });
  const sentinel3 = await sentinel(page, 'sentinel-3');
  await page.evaluate(() => window.Sentry && window.Sentry.flush(5000));
  steps.push({ label: 'after sentinel-3', result: { sentinel3 } });
}

if (appUp && variant === 'base') {
  // Session Replay: the buffered replay is only sent once the session is long enough
  // (`minReplayDuration`, 5s by default), so give it one more error and a bounded wait.
  await page.evaluate(() => window.Sentry.captureException(new Error('Error for the replay buffer')));
  const replayArrived = await until('replay envelope', async () => (await get('/__items')).some(i => i.type === 'replay_event'), 80, 250);
  steps.push({ label: 'replay after minReplayDuration', result: { replayArrived } });
}

await page.evaluate(() => window.Sentry && window.Sentry.flush(5000));
const [items, raw, headers] = await Promise.all([get('/__items'), get('/__items?raw=1'), get('/__headers')]);

const summary = {
  itemTypes: items.map(i => i.type),
  events: items.filter(i => i.type === 'event').map(i => ({ message: i.message, exception: i.exception, mechanism: i.mechanism, handled: i.handled, exceptions: i.exceptions?.length, contexts: i.contexts, transaction: i.transaction, trace_id: i.trace_id, release: i.release })),
  spans: items.filter(i => i.type === 'span').flatMap(i => i.raw).map(s => ({ op: s.op, name: s.name, is_segment: s.is_segment, source: s.source, origin: s.origin, url: s.url, status: s.status })),
  logs: items.filter(i => i.type === 'log').flatMap(i => i.items),
  sessions: items.filter(i => i.type === 'session').map(i => ({ status: i.status, errors: i.errors, init: i.init })),
  replay: items.filter(i => i.type === 'replay_event').length,
  headers,
};

const buildLogPath = new URL('./build.log', import.meta.url);
const buildConsole = existsSync(buildLogPath)
  ? readFileSync(buildLogPath, 'utf8').split('\n').filter(l => /sentry|warn|error|source map|devtool/i.test(l))
  : null;

writeFileSync(
  new URL(`./${resultName}.json`, import.meta.url),
  JSON.stringify({ variant, pagePath, meta, steps, sentinel1, pageloadArrived, summary, buildConsole, console: consoleLines, pageErrors, itemsAfterVerify, items, headers, raw }, null, 2),
);
writeFileSync(
  new URL(`./app-${resultName.replace(/^results-/, '')}.log`, import.meta.url),
  [`# ${pagePath} page errors`, ...pageErrors, ``, `# ${pagePath} console`, ...consoleLines].join('\n'),
);

await browser.close();
console.log(`wrote ${resultName}.json (${items.length} sink items, ${pageErrors.length} page errors, sentinel=${sentinel1}, pageload=${pageloadArrived})`);
