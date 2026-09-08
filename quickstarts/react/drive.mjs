// Playwright driver. Usage: node drive.mjs <variant> <page path>
// One headless system Chrome per run. Every wait is a condition on the sink or the page, never a
// sleep: the run ends with a sentinel message plus a sentinel span and polls for those, so
// everything captured before them is known to have arrived.
import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const variant = process.argv[2] ?? 'base';
const pagePath = process.argv[3] ?? `/${variant}.html`;
const base = process.env.BASE_URL ?? 'http://localhost:4713';
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
  if (!(await page.evaluate(() => typeof window.__qsSentinel === "function"))) return false;
  await page.evaluate(n => window.__qsSentinel(n), name);
  const ok = await until(`sentinel ${name}`, async () => {
    const items = await get('/__items');
    return hasEvent(items, i => i.message === name) && hasSpan(items, s => s.name === `${name}-span`);
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
steps.push({ label: 'boot', result: { sdkUp, appUp, pageErrorsAtBoot: pageErrors.slice(), feedbackWidget: await page.evaluate(() => !!document.querySelector('#sentry-feedback')), snippetError: await page.evaluate(() => document.body.getAttribute('data-snippet-error')) } });

if (appUp) {
  // The guide's verify buttons (index.mdx:361-370, 376-389, 397-401) plus a propagation probe.
  await step('click #btn-throw (index.mdx:361-370, onClick throws "Sentry Test Error")', () => page.click('#btn-throw'));
  await step('click #btn-span (index.mdx:376-389, startSpan + setTimeout throw)', () => page.click('#btn-span'));
  await step('click #btn-log (index.mdx:397-401, Sentry.logger.*)', () => page.click('#btn-log'));
  await step('click #btn-fetch (relative + absolute same-origin fetch to /recorder)', async () => {
    await page.click('#btn-fetch');
    const ok = await until('recorder hits', async () => (await get('/__headers')).length >= 2, 60);
    return { recorderHits: ok, headers: await get('/__headers') };
  });

  if (variant.startsWith('error-boundary')) {
    for (const id of ['btn-render-error', 'btn-render-error-fn', 'btn-render-error-hoc', 'btn-render-error-sidebar', 'btn-render-error-custom']) {
      await step(`click #${id}`, async () => {
        await page.click(`#${id}`);
        await until(`fallback for ${id}`, () => page.evaluate(i => document.querySelector(`[data-fallback-for="${i}"]`) !== null, id), 40, 100);
        return { fallbackText: await page.evaluate(i => document.querySelector(`[data-fallback-for="${i}"]`)?.textContent ?? null, id) };
      });
    }
    await step('click #btn-reset (resetError from the fallback function)', async () => {
      await page.click('#btn-reset');
      const recovered = await until('boundary reset', () => page.evaluate(() => document.querySelector('#dashboard-fn') !== null), 40, 100);
      return { recovered };
    });
  }

  if (variant === 'profiler') {
    await step('click #btn-update (prop change on the profiled App)', async () => {
      await page.click('#btn-update');
      await page.click('#btn-update');
      return { tick: await page.evaluate(() => document.querySelector('#tick')?.textContent) };
    });
    await step('click #btn-unmount (unmount the profiled App)', async () => {
      await page.click('#btn-unmount');
      return { unmounted: await until('app unmounted', () => page.evaluate(() => document.querySelector('#profiled-app') === null), 40, 100) };
    });
  }

  if (variant === 'redux') {
    await step('click #btn-dispatch (INCREMENT x2, SET_PASSWORD, GOVERNMENT_SECRETS)', async () => {
      await page.click('#btn-dispatch');
      return { state: await page.evaluate(() => window.__store.getState()) };
    });
    await step('click #btn-capture-redux (captureException after dispatching)', () => page.click('#btn-capture-redux'));
  }

  if (variant === 'react-router-v7' || variant === 'react-router-v8') {
    await step('pageload route', () => page.evaluate(() => ({ path: location.pathname, param: document.querySelector('#user-id')?.textContent ?? null })));
  }

  if (variant === 'base') {
    // Last, because an uncaught render error unmounts the whole React 19 root.
    await step('click #btn-render-error (render throws, no ErrorBoundary: onUncaughtError)', async () => {
      await page.click('#btn-render-error');
      const gone = await until('root unmounted', () => page.evaluate(() => document.querySelector('#app')?.childElementCount === 0), 40, 100);
      return { rootUnmounted: gone };
    });
  }
}

const sentinel1 = await sentinel(page, 'sentinel');
await page.evaluate(() => window.Sentry && window.Sentry.flush(5000));

// The pageload segment ends after the browser tracing idle timeout, so it lands after the sentinel.
const pageloadArrived = sdkUp && await until('pageload span', async () => hasSpan(await get('/__items'), s => s.op === 'pageload'), 120, 250);
const itemsAfterVerify = await get('/__items');

if (appUp && (variant === 'react-router-v7' || variant === 'react-router-v8')) {
  await step('click #nav-user (Link to /users/7)', async () => {
    await page.click('#nav-user');
    const navigated = await until('user page', () => page.evaluate(() => document.querySelector('#user-id')?.textContent === '7'), 40, 100);
    const navSpan = await until('navigation span', async () => hasSpan(await get('/__items'), s => s.op === 'navigation'), 120, 250);
    return { navigated, navSpan, path: await page.evaluate(() => location.pathname) };
  });
  await step('click #nav-boom (route element throws in render, errorElement boundary)', async () => {
    await page.click('#nav-boom');
    const boundary = await until('route error boundary', () => page.evaluate(() => document.querySelector('#route-error-boundary') !== null), 40, 100);
    const captured = await until('boom event', async () => hasEvent(await get('/__items'), i => String(i.exception).includes('boom')), 60, 100);
    return { boundary, captured, path: await page.evaluate(() => location.pathname) };
  });
  await step('click #nav-home (Link to /)', async () => {
    await page.click('#nav-home');
    return { home: await until('home page', () => page.evaluate(() => location.pathname === '/'), 40, 100) };
  });
  await sentinel(page, 'sentinel-2');
  await page.evaluate(() => window.Sentry && window.Sentry.flush(5000));
  await until('second navigation span', async () => (await get('/__items')).filter(i => i.type === 'span').flatMap(i => i.raw).filter(s => s.op === 'navigation').length >= 2, 60, 250);
}

if (variant === 'base' || variant.startsWith('error-boundary')) {
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
  events: items.filter(i => i.type === 'event').map(i => ({ message: i.message, exception: i.exception, mechanism: i.mechanism, handled: i.handled, exceptions: i.exceptions?.length, contexts: i.contexts, transaction: i.transaction })),
  spans: items.filter(i => i.type === 'span').flatMap(i => i.raw).map(s => ({ op: s.op, name: s.name, is_segment: s.is_segment, source: s.source, origin: s.origin, url_path: s.url_path, component: s.component, status: s.status })),
  logs: items.filter(i => i.type === 'log').flatMap(i => i.items),
  attachments: items.filter(i => i.type === 'attachment').map(i => ({ filename: i.filename, length: i.length })),
  sessions: items.filter(i => i.type === 'session').map(i => ({ status: i.status, errors: i.errors, init: i.init })),
  replay: items.filter(i => i.type === 'replay_event').length,
  headers,
};

writeFileSync(
  new URL(`./${resultName}.json`, import.meta.url),
  JSON.stringify({ variant, pagePath, mode: process.env.MODE ?? 'production', meta, steps, sentinel1, pageloadArrived, summary, console: consoleLines, pageErrors, itemsAfterVerify, items, headers, raw }, null, 2),
);
writeFileSync(
  new URL(`./app-${resultName.replace(/^results-/, '')}.log`, import.meta.url),
  [`# ${pagePath} page errors`, ...pageErrors, ``, `# ${pagePath} console`, ...consoleLines].join('\n'),
);

await browser.close();
console.log(`wrote ${resultName}.json (${items.length} sink items, ${pageErrors.length} page errors, sentinel=${sentinel1}, pageload=${pageloadArrived})`);
