// Playwright driver. Usage: node drive.mjs <variant> <page path>
// One headless system Chrome per run. Every wait is a condition on the sink or the page, never a
// sleep: the run ends with a sentinel message plus a sentinel span and polls for those, so
// everything captured before them is known to have arrived. A 60 s deadline bounds the whole run.
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const variant = process.argv[2] ?? 'base';
const pagePath = process.argv[3] ?? `/${variant}.html`;
const base = process.env.BASE_URL ?? 'http://localhost:4723';
const resultName = process.env.RESULT_NAME ?? `results-${variant}`;
const deadline = Date.now() + 60_000;

const consoleLines = [];
const pageErrors = [];
const steps = [];
let deadlineHit = false;

const get = path => fetch(`${base}${path}`).then(r => r.json());

async function until(label, check, tries = 200, waitMs = 150) {
  for (let i = 0; i < tries; i++) {
    if (await check()) return true;
    if (Date.now() > deadline) {
      deadlineHit = true;
      console.error(`[drive] deadline hit while waiting for ${label}`);
      return false;
    }
    await new Promise(r => setTimeout(r, waitMs));
  }
  console.error(`[drive] gave up waiting for ${label}`);
  return false;
}

const hasEvent = (items, pred) => items.some(i => i.type === 'event' && pred(i));
const hasSpan = (items, pred) => items.some(i => i.type === 'span' && (i.raw || []).some(pred));
const spans = items => items.filter(i => i.type === 'span').flatMap(i => i.raw);
const countEvents = (items, pred) => items.filter(i => i.type === 'event' && pred(i)).length;
const compactSpan = s => ({ op: s.op, name: s.name, is_segment: s.is_segment, source: s.source, origin: s.origin, url_path: s.url_path, url_template: s.attributes?.['url.template'], params: Object.fromEntries(Object.entries(s.attributes || {}).filter(([k]) => k.startsWith('params.') || k.startsWith('url.path.parameter.'))), status: s.status, duration_ms: s.duration_ms, parent_span_id: s.parent_span_id, span_id: s.span_id, trace_id: s.trace_id });

async function step(label, fn) {
  const before = (await get('/__items')).length;
  let result;
  try {
    result = await fn();
  } catch (e) {
    result = { threw: String(e?.message ?? e) };
  }
  steps.push({ label, result: result ?? null, itemsBefore: before, itemsAfter: (await get('/__items')).length });
}

const sdkReady = page => page.evaluate(() => !!(window.Sentry && window.Sentry.getClient && window.Sentry.getClient()));
const tracingOn = page => page.evaluate(() => { const o = window.Sentry.getClient().getOptions(); return o.tracesSampleRate != null || o.tracesSampler != null; });
// Idle segments (pageload, navigation) stay active until their idle timeout; once nothing is active
// they have ended, and a sentinel span started after that lands behind them in the span stream.
const noActiveSpan = page => page.evaluate(() => !window.Sentry.getActiveSpan());

async function sentinel(page, name) {
  if (!(await page.evaluate(() => typeof window.__qsSentinel === 'function'))) return false;
  if (!(await sdkReady(page))) return false;
  const tracing = await tracingOn(page);
  await page.evaluate(n => window.__qsSentinel(n), name);
  return until(`sentinel ${name}`, async () => {
    const items = await get('/__items');
    return hasEvent(items, i => i.message === name) && (!tracing || hasSpan(items, s => s.name === `${name}-span`));
  });
}

let build = null;
try {
  build = JSON.parse(readFileSync(new URL(`./dist/${variant}.build.json`, import.meta.url), 'utf8'));
} catch {}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
let sentinel1 = false;
let pageloadArrived = false;
let meta = { initialized: false };
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('console', m => consoleLines.push(`${m.type()}: ${m.text()}`));
  page.on('pageerror', e => pageErrors.push(String(e && e.message ? e.message : e)));

  await page.goto(`${base}${pagePath}`, { waitUntil: 'load' });
  const sdkUp = await until('SDK init', () => sdkReady(page), 40, 100);
  const appUp = await until('app rendered', () => page.evaluate(() => document.body.getAttribute('data-wired') === '1'), 40);

  meta = await page.evaluate(() => (window.__qsMeta ? window.__qsMeta() : { initialized: false }));
  steps.push({ label: 'boot', result: { sdkUp, appUp, pageErrorsAtBoot: pageErrors.slice(), feedbackWidget: await page.evaluate(() => !!document.querySelector('#sentry-feedback')), appHtml: await page.evaluate(() => (document.querySelector('#app') || document.querySelector('#root') || document.body).innerHTML.slice(0, 400)) } });

  if (appUp && variant === 'base' && sdkUp) {
    await step('click #btn-throw (index.mdx:187-196, onClick throws "Sentry Test Error")', async () => {
      await page.click('#btn-throw');
      return { captured: await until('first error', async () => hasEvent(await get('/__items'), i => String(i.exception).includes('Sentry Test Error')), 60, 100) };
    });
    await step('click #btn-span (index.mdx:216-229, startSpan + setTimeout throw)', async () => {
      await page.click('#btn-span');
      const ok = await until('second error', async () => countEvents(await get('/__items'), i => String(i.exception).includes('Sentry Test Error')) >= 2, 60, 100);
      return { secondErrorArrived: ok, testErrors: countEvents(await get('/__items'), i => String(i.exception).includes('Sentry Test Error')) };
    });
    await step('click #btn-boundary (capture-errors include :6 wrapper around a child that throws during render)', async () => {
      await page.click('#btn-boundary');
      const ok = await until('boundary error', async () => hasEvent(await get('/__items'), i => String(i.exception).includes('Boundary Test Error')), 60, 100);
      return { captured: ok, fallback: await page.evaluate(() => document.querySelector('#boundary-fallback')?.textContent ?? null), bombStillMounted: await page.evaluate(() => !!document.querySelector('#bomb')) };
    });
    await step('click #btn-log (logs include :12-24, Sentry.logger.* without enableLogs)', async () => {
      const before = consoleLines.length;
      await page.click('#btn-log');
      const warned = await until('enableLogs warning', async () => consoleLines.slice(before).some(l => /enableLogs/.test(l)), 20, 100);
      return { enableLogsWarning: warned, consoleAfterClick: consoleLines.slice(before).filter(l => /log|Log/.test(l)).slice(0, 4), enableLogs: await page.evaluate(() => window.Sentry.getClient().getOptions().enableLogs ?? null) };
    });
    await step('click #btn-fetch (relative + absolute same-origin fetch to /recorder)', async () => {
      await page.click('#btn-fetch');
      const ok = await until('recorder hits', async () => (await get('/__headers')).length >= 2, 60);
      return { recorderHits: ok, headers: await get('/__headers') };
    });
  }

  if (appUp && variant === 'base' && !sdkUp) {
    await step('click #btn-throw (index.mdx:187-196) without an initialized client', async () => {
      await page.click('#btn-throw');
      await until('page error', async () => pageErrors.some(e => e.includes('Sentry Test Error')), 20, 100);
      return { pageErrors: pageErrors.slice(), client: await page.evaluate(() => String(window.Sentry.getClient())), sinkItems: (await get('/__items')).length };
    });
    await step('click #btn-boundary without an initialized client', async () => {
      await page.click('#btn-boundary');
      await until('fallback', () => page.evaluate(() => !!document.querySelector('#boundary-fallback')), 20, 100);
      return { fallback: await page.evaluate(() => document.querySelector('#boundary-fallback')?.textContent ?? null), sinkItems: (await get('/__items')).length };
    });
  }

  if (appUp && variant.startsWith('router') && sdkUp) {
    await step('click #link-user (<A href="/<variant>/users/42">)', async () => {
      await page.click('#link-user');
      const ok = await until('user route', () => page.evaluate(() => document.querySelector('#user-id')?.textContent === '42'), 40, 100);
      return { rendered: ok, pathname: await page.evaluate(() => location.pathname), activeSpan: await page.evaluate(() => { const s = window.Sentry.getActiveSpan(); return s ? window.Sentry.spanToJSON(s).description : null; }) };
    });
    await step('click #link-home (<A href="/<variant>">)', async () => {
      await page.click('#link-home');
      const ok = await until('home route', () => page.evaluate(() => !!document.querySelector('#home')), 40, 100);
      return { rendered: ok, pathname: await page.evaluate(() => location.pathname) };
    });
    await step('wait until no span is active (pageload and navigation segments ended)', async () => ({ idle: await until('no active span', () => noActiveSpan(page), 120, 250) }));
  }

  if (appUp && variant === 'error-boundary' && sdkUp) {
    await step('click #btn-render-throw (child throws during render inside SentryErrorBoundary)', async () => {
      await page.click('#btn-render-throw');
      const ok = await until('render error', async () => hasEvent(await get('/__items'), i => String(i.exception).includes('Boundary Render Error')), 60, 100);
      return { captured: ok, fallback: await page.evaluate(() => document.querySelector('#boundary-fallback')?.textContent ?? null), pageErrors: pageErrors.slice() };
    });
    await step('click #btn-reset (fallback reset(), child re-renders idle)', async () => {
      await page.click('#btn-reset');
      const ok = await until('reset', () => page.evaluate(() => document.querySelector('#bomb')?.textContent === 'bomb idle'), 40, 100);
      return { reset: ok, fallbackGone: await page.evaluate(() => !document.querySelector('#boundary-fallback')) };
    });
    await step('click #btn-handler-throw (onClick throws inside the boundary subtree)', async () => {
      await page.click('#btn-handler-throw');
      const ok = await until('handler error', async () => hasEvent(await get('/__items'), i => String(i.exception).includes('Boundary Handler Error')), 60, 100);
      return { captured: ok, fallback: await page.evaluate(() => document.querySelector('#boundary-fallback')?.textContent ?? null), pageErrors: pageErrors.slice() };
    });
    await step('click #btn-async-throw (setTimeout throw inside the boundary subtree)', async () => {
      await page.click('#btn-async-throw');
      const ok = await until('async error', async () => hasEvent(await get('/__items'), i => String(i.exception).includes('Boundary Async Error')), 60, 100);
      return { captured: ok, fallback: await page.evaluate(() => document.querySelector('#boundary-fallback')?.textContent ?? null), pageErrors: pageErrors.slice() };
    });
  }

  sentinel1 = await sentinel(page, 'sentinel');
  if (sdkUp) await page.evaluate(() => window.Sentry.flush(5000));

  // The pageload segment ends after the browser tracing idle timeout, so it can land after the sentinel.
  const tracing = sdkUp && (await tracingOn(page));
  pageloadArrived = tracing && (await until('pageload span', async () => hasSpan(await get('/__items'), s => s.op === 'pageload'), 120, 250));
  const itemsAfterVerify = await get('/__items');

  if (appUp && variant.startsWith('router') && sdkUp) {
    await step('segments after the navigations', async () => ({ segments: spans(await get('/__items')).filter(s => s.is_segment || s.op === 'pageload' || s.op === 'navigation').map(compactSpan) }));
    await step('second page load at /<variant>/users/7 (parameterized route as the landing page)', async () => {
      await page.goto(`${base}${pagePath}/users/7`, { waitUntil: 'load' });
      const up = await until('SDK init 2', () => sdkReady(page), 40, 100);
      const rendered = await until('user 7', () => page.evaluate(() => document.querySelector('#user-id')?.textContent === '7'), 40, 100);
      const idle = await until('no active span 2', () => noActiveSpan(page), 120, 250);
      const s2 = await sentinel(page, 'sentinel-2');
      const arrived = await until('pageload 2', async () => hasSpan(await get('/__items'), s => s.op === 'pageload' && s.url_path === `${pagePath}/users/7`), 80, 250);
      return { up, rendered, idle, sentinel2: s2, pageload2Arrived: arrived, pageloads: spans(await get('/__items')).filter(s => s.op === 'pageload').map(compactSpan) };
    });
  }

  if (variant === 'base' && sdkUp) {
    // Session Replay: the buffered replay is only sent once the session is long enough
    // (`minReplayDuration`, 5 s by default), so give it one more error and a bounded wait.
    await page.evaluate(() => window.Sentry.captureException(new Error('Error for the replay buffer')));
    const replayArrived = await until('replay envelope', async () => (await get('/__items')).some(i => i.type === 'replay_event'), 80, 250);
    steps.push({ label: 'replay after minReplayDuration', result: { replayArrived } });
  }

  if (sdkUp) await page.evaluate(() => window.Sentry.flush(5000));
  const [items, raw, headers] = await Promise.all([get('/__items'), get('/__items?raw=1'), get('/__headers')]);

  const summary = {
    itemTypes: items.map(i => i.type),
    events: items.filter(i => i.type === 'event').map(i => ({ message: i.message, exception: i.exception, mechanism: i.mechanism, handled: i.handled, transaction: i.transaction, trace_id: i.trace_id, topFrame: i.topFrame, breadcrumbs: i.breadcrumbs })),
    spans: spans(items).map(compactSpan),
    logs: items.filter(i => i.type === 'log').flatMap(i => i.items),
    sessions: items.filter(i => i.type === 'session').map(i => ({ status: i.status, errors: i.errors, init: i.init })),
    replay: items.filter(i => i.type === 'replay_event').length,
    headers,
  };

  writeFileSync(
    new URL(`./${resultName}.json`, import.meta.url),
    JSON.stringify({ variant, pagePath, mode: process.env.MODE ?? 'production', build, meta, steps, sentinel1, pageloadArrived, deadlineHit, summary, console: consoleLines, pageErrors, itemsAfterVerify, items, headers, raw }, null, 2),
  );
  writeFileSync(new URL(`./app-${resultName.replace(/^results-/, '')}.log`, import.meta.url), [`# ${pagePath} page errors`, ...pageErrors, ``, `# ${pagePath} console`, ...consoleLines].join('\n'));
  console.log(`wrote ${resultName}.json (${items.length} sink items, ${pageErrors.length} page errors, sentinel=${sentinel1}, pageload=${pageloadArrived}, deadlineHit=${deadlineHit})`);
} finally {
  await browser.close();
}
