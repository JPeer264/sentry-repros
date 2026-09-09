// Playwright driver. Usage: node drive.mjs <variant> <page path>
// One headless system Chrome per run. Every wait is a condition on the sink or the page, never a
// sleep: the run ends with a sentinel message plus a sentinel span and polls for those, so
// everything captured before them is known to have arrived.
import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const variant = process.argv[2] ?? 'base';
const pagePath = process.argv[3] ?? '/';
const base = process.env.BASE_URL ?? 'http://localhost:4715';
const resultName = process.env.RESULT_NAME ?? `results-${variant}`;

const consoleLines = [];
const pageErrors = [];
const steps = [];

const get = path => fetch(`${base}${path}`).then(r => r.json());

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
const spans = items => items.filter(i => i.type === 'span').flatMap(i => i.raw);

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
  // A snippet that never reaches Sentry.init leaves no hooks behind; record that instead of crashing.
  if (!(await page.evaluate(() => typeof window.__qsSentinel === 'function'))) return false;
  // Without tracing the sentinel span is non-recording and never arrives, so only the message counts.
  const tracing = await page.evaluate(() => { const o = window.Sentry.getClient().getOptions(); return o.tracesSampleRate != null || o.tracesSampler != null; });
  await page.evaluate(n => window.__qsSentinel(n), name);
  const ok = await until(`sentinel ${name}`, async () => {
    const items = await get('/__items');
    return hasEvent(items, i => i.message === name) && (!tracing || hasSpan(items, s => s.name === `${name}-span`));
  });
  return ok;
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext();
const page = await context.newPage();
page.on('console', m => consoleLines.push(`${m.type()}: ${m.text()}`));
page.on('pageerror', e => pageErrors.push(String(e && e.message ? e.message : e)));

await page.goto(`${base}${pagePath}`, { waitUntil: 'load' });
const sdkUp = await until('SDK init', () => page.evaluate(() => !!(window.Sentry && window.Sentry.getClient && window.Sentry.getClient())), 60);
const appUp = await until('app rendered', () => page.evaluate(() => document.body.getAttribute('data-wired') === '1'), 40);

const meta = await page.evaluate(() => (window.__qsMeta ? window.__qsMeta() : { initialized: false }));
steps.push({ label: 'boot', result: { sdkUp, appUp, pageErrorsAtBoot: pageErrors.slice(), consoleAtBoot: consoleLines.slice(), feedbackWidget: await page.evaluate(() => !!document.querySelector('#sentry-feedback')), appHtml: await page.evaluate(() => (document.querySelector('app-root') || document.body).innerHTML.slice(0, 400)) } });

const routed = ['base', 'app-initializer', 'ngmodule', 'error-handler-custom-fixed', 'error-handler-options'].includes(variant);

if (appUp && routed) {
  // The guide's verify snippets (manual-setup.mdx:398-411, 432-449, the logs include) plus a propagation probe.
  await step('click #btn-throw (manual-setup.mdx:398-411, throwTestError() throws "Sentry Test Error")', async () => {
    await page.click('#btn-throw');
    return { captured: await until('error handler event', async () => hasEvent(await get('/__items'), i => String(i.exception).includes('Sentry Test Error')), 60, 100) };
  });
  await step('click #btn-span (manual-setup.mdx:432-449, startSpan with a setTimeout that throws after 99 ms)', async () => {
    await page.click('#btn-span');
    return { spanArrived: await until('Example Span', async () => hasSpan(await get('/__items'), s => s.name === 'Example Span'), 60, 100) };
  });
  await step('click #btn-log (logs include :12-24, Sentry.logger.*)', () => page.click('#btn-log'));
  await step('click #btn-fetch (relative + absolute same-origin fetch to /recorder)', async () => {
    await page.click('#btn-fetch');
    const ok = await until('recorder hits', async () => (await get('/__headers')).length >= 2, 60);
    return { recorderHits: ok, headers: await get('/__headers') };
  });
  await step('pageload route', () => page.evaluate(() => ({ path: location.pathname, param: document.querySelector('#user-id')?.textContent ?? null })));
}

if (appUp && variant === 'component-tracking') {
  await step('click #btn-change x2 (input change on <app-login> and <app-user-card>, ngOnChanges)', async () => {
    await page.click('#btn-change');
    await page.click('#btn-change');
    return { attempt: await page.evaluate(() => document.querySelector('#attempt')?.textContent), login: await page.evaluate(() => document.querySelector('#login')?.textContent) };
  });
  await step('click #btn-destroy (@if removes <app-user-card>, ngOnDestroy)', async () => {
    await page.click('#btn-destroy');
    return { destroyed: await until('user card destroyed', () => page.evaluate(() => document.querySelector('app-user-card') === null), 40, 100) };
  });
}

const sentinel1 = await sentinel(page, 'sentinel');
await page.evaluate(() => window.Sentry && window.Sentry.flush(5000));

// The pageload segment ends after the browser tracing idle timeout, so it lands after the sentinel.
const tracing = sdkUp && await page.evaluate(() => { const o = window.Sentry.getClient().getOptions(); return o.tracesSampleRate != null || o.tracesSampler != null; });
const pageloadArrived = tracing && await until('pageload span', async () => hasSpan(await get('/__items'), s => s.op === 'pageload'), 120, 250);
const itemsAfterVerify = await get('/__items');

if (appUp && routed) {
  await step('click #nav-home (routerLink to /, route "")', async () => {
    await page.click('#nav-home');
    const navigated = await until('home page', () => page.evaluate(() => document.querySelector('#home') !== null), 40, 100);
    const navSpan = await until('navigation span', async () => hasSpan(await get('/__items'), s => s.op === 'navigation'), 120, 250);
    return { navigated, navSpan, path: await page.evaluate(() => location.pathname) };
  });
  await step('click #nav-plain (routerLink to /plain/5, route plain/:id)', async () => {
    await page.click('#nav-plain');
    return { navigated: await until('plain page', () => page.evaluate(() => document.querySelector('#plain') !== null), 40, 100), path: await page.evaluate(() => location.pathname) };
  });
  await step('click #nav-user (routerLink to /users/7, route users/:id)', async () => {
    await page.click('#nav-user');
    return { navigated: await until('user page', () => page.evaluate(() => document.querySelector('#user-id')?.textContent === '7'), 40, 100), path: await page.evaluate(() => location.pathname) };
  });
  await sentinel(page, 'sentinel-2');
  await page.evaluate(() => window.Sentry && window.Sentry.flush(5000));
  await until('three navigation spans', async () => spans(await get('/__items')).filter(s => s.op === 'navigation').length >= 3, 60, 250);
}

if (variant === 'base') {
  // Session Replay: the buffered replay is only sent once the session is long enough
  // (`minReplayDuration`, 5s by default), so give it one more error and a bounded wait.
  await page.evaluate(() => window.Sentry.captureException(new Error('Error for the replay buffer')));
  const replayArrived = await until('replay envelope', async () => (await get('/__items')).some(i => i.type === 'replay_event'), 80, 250);
  steps.push({ label: 'replay after minReplayDuration', result: { replayArrived } });
}

await page.evaluate(() => window.Sentry && window.Sentry.flush(5000));
const metaAfter = await page.evaluate(() => (window.__qsMeta ? window.__qsMeta() : { initialized: false }));
const [items, raw, headers] = await Promise.all([get('/__items'), get('/__items?raw=1'), get('/__headers')]);

const summary = {
  itemTypes: items.map(i => i.type),
  events: items.filter(i => i.type === 'event').map(i => ({ message: i.message, exception: i.exception, mechanism: i.mechanism, handled: i.handled, exceptions: i.exceptions?.length, contexts: i.contexts, angular: i.angular, transaction: i.transaction, topFrame: i.topFrame })),
  spans: spans(items).map(s => ({ op: s.op, name: s.name, is_segment: s.is_segment, source: s.source, origin: s.origin, url_path: s.url_path, url_template: s.url_template, function: s.function, status: s.status, duration_ms: s.duration_ms, parent_span_id: s.parent_span_id, span_id: s.span_id })),
  logs: items.filter(i => i.type === 'log').flatMap(i => i.items),
  attachments: items.filter(i => i.type === 'attachment').map(i => ({ filename: i.filename, length: i.length })),
  sessions: items.filter(i => i.type === 'session').map(i => ({ status: i.status, errors: i.errors, init: i.init })),
  replay: items.filter(i => i.type === 'replay_event').length,
  headers,
};

writeFileSync(
  new URL(`./${resultName}.json`, import.meta.url),
  JSON.stringify({ variant, pagePath, mode: process.env.MODE ?? 'production', meta, metaAfter, steps, sentinel1, pageloadArrived, summary, console: consoleLines, pageErrors, itemsAfterVerify, items, headers, raw }, null, 2),
);
writeFileSync(
  new URL(`./app-${resultName.replace(/^results-/, '')}.log`, import.meta.url),
  [`# ${pagePath} page errors`, ...pageErrors, ``, `# ${pagePath} console`, ...consoleLines].join('\n'),
);

await browser.close();
console.log(`wrote ${resultName}.json (${items.length} sink items, ${pageErrors.length} page errors, sentinel=${sentinel1}, pageload=${pageloadArrived})`);
