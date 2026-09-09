// Playwright driver. Usage: node drive.mjs <variant> <page path>
// One headless system Chrome per run. Every wait is a condition on the sink or the page, never a
// sleep: the run ends with a sentinel message plus a sentinel span and polls for those, so
// everything captured before them is known to have arrived.
import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const variant = process.argv[2] ?? 'base';
const pagePath = process.argv[3] ?? `/${variant}.html`;
const base = process.env.BASE_URL ?? 'http://localhost:4714';
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
  if (!(await page.evaluate(() => typeof window.__qsSentinel === "function"))) return false;
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
steps.push({ label: 'boot', result: { sdkUp, appUp, pageErrorsAtBoot: pageErrors.slice(), feedbackWidget: await page.evaluate(() => !!document.querySelector('#sentry-feedback')), appHtml: await page.evaluate(() => (document.querySelector('#app') || document.body).innerHTML.slice(0, 300)) } });

const routed = variant === 'base' || variant === 'vue-router-path';

if (appUp && routed) {
  // The guide's verify snippets (index.mdx:285-298, 318-337, the logs include) plus a propagation probe.
  await step('click #btn-throw (index.mdx:285-298, throwError() throws "Sentry Error")', () => page.click('#btn-throw'));
  await step('click #btn-span (index.mdx:318-337, startSpan with an async callback that throws after 99 ms)', () => page.click('#btn-span'));
  await step('click #btn-log (logs include :12-24, Sentry.logger.*)', () => page.click('#btn-log'));
  await step('click #btn-fetch (relative + absolute same-origin fetch to /recorder)', async () => {
    await page.click('#btn-fetch');
    const ok = await until('recorder hits', async () => (await get('/__headers')).length >= 2, 60);
    return { recorderHits: ok, headers: await get('/__headers') };
  });
  await step('pageload route', () => page.evaluate(() => ({ path: location.pathname, param: document.querySelector('#user-id')?.textContent ?? null })));
}

if (appUp && variant.startsWith('component-tracking')) {
  await step('click #btn-update x2 (prop change on <Pagination>, root re-render)', async () => {
    await page.click('#btn-update');
    await page.click('#btn-update');
    return { page: await page.evaluate(() => document.querySelector('#page')?.textContent) };
  });
  await step('click #btn-unmount (v-if removes <RwvHeader>)', async () => {
    await page.click('#btn-unmount');
    return { unmounted: await until('header unmounted', () => page.evaluate(() => document.querySelector('#rwv-header') === null), 40, 100) };
  });
}

if (appUp && variant === 'pinia') {
  await step('click #btn-dispatch (increment x2, setPassword("hunter2"), governmentSecrets("area51"))', async () => {
    await page.click('#btn-dispatch');
    return { state: await page.evaluate(() => JSON.parse(JSON.stringify(window.__store.$state))) };
  });
  await step('click #btn-capture (captureException after the actions)', async () => {
    await page.click('#btn-capture');
    return { captured: await until('pinia event', async () => hasEvent(await get('/__items'), i => String(i.exception).includes('pinia state')), 60, 100) };
  });
}

if (appUp && variant === 'multiple-apps') {
  for (const id of ['throw-one', 'throw-two', 'throw-three', 'throw-lazy']) {
    await step(`click #${id} (method throws inside that app)`, async () => {
      await page.click(`#${id}`);
      return { captured: await until(`event from ${id}`, async () => hasEvent(await get('/__items'), i => String(i.exception).includes(id.replace('throw-', 'app '))), 60, 100) };
    });
  }
}

if (appUp && variant === 'late-init') {
  await step('click #btn-throw (method throws in the late-defined app)', async () => {
    await page.click('#btn-throw');
    return {
      captured: await until('late-init event', async () => hasEvent(await get('/__items'), i => String(i.exception).includes('late-init')), 60, 100),
      integrationsBeforeAdd: await page.evaluate(() => window.__integrationsBeforeAdd),
    };
  });
}

const sentinel1 = await sentinel(page, 'sentinel');
await page.evaluate(() => window.Sentry && window.Sentry.flush(5000));

// The pageload segment ends after the browser tracing idle timeout (and the Vue root component
// span's 2 s debounce), so it lands after the sentinel.
const tracing = sdkUp && await page.evaluate(() => { const o = window.Sentry.getClient().getOptions(); return o.tracesSampleRate != null || o.tracesSampler != null; });
const pageloadArrived = tracing && await until('pageload span', async () => hasSpan(await get('/__items'), s => s.op === 'pageload'), 120, 250);
const itemsAfterVerify = await get('/__items');

if (appUp && routed) {
  await step('click #nav-home (router-link to /, named route "home")', async () => {
    await page.click('#nav-home');
    const navigated = await until('home page', () => page.evaluate(() => document.querySelector('#home') !== null), 40, 100);
    const navSpan = await until('navigation span', async () => hasSpan(await get('/__items'), s => s.op === 'navigation'), 120, 250);
    return { navigated, navSpan, path: await page.evaluate(() => location.pathname) };
  });
  await step('click #nav-plain (router-link to /plain/5, unnamed route /plain/:id)', async () => {
    await page.click('#nav-plain');
    return { navigated: await until('plain page', () => page.evaluate(() => document.querySelector('#plain') !== null), 40, 100), path: await page.evaluate(() => location.pathname) };
  });
  await step('click #nav-user (router-link to /users/7, named route "user")', async () => {
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
const [items, raw, headers] = await Promise.all([get('/__items'), get('/__items?raw=1'), get('/__headers')]);

const summary = {
  itemTypes: items.map(i => i.type),
  events: items.filter(i => i.type === 'event').map(i => ({ message: i.message, exception: i.exception, mechanism: i.mechanism, handled: i.handled, exceptions: i.exceptions?.length, contexts: i.contexts, vue: i.vue, transaction: i.transaction, state: i.state, breadcrumbs: i.breadcrumbs })),
  spans: spans(items).map(s => ({ op: s.op, name: s.name, is_segment: s.is_segment, source: s.source, origin: s.origin, url_path: s.url_path, component: s.component, status: s.status, duration_ms: s.duration_ms, parent_span_id: s.parent_span_id, span_id: s.span_id })),
  logs: items.filter(i => i.type === 'log').flatMap(i => i.items),
  attachments: items.filter(i => i.type === 'attachment').map(i => ({ filename: i.filename, length: i.length })),
  sessions: items.filter(i => i.type === 'session').map(i => ({ status: i.status, errors: i.errors, init: i.init })),
  replay: items.filter(i => i.type === 'replay_event').length,
  headers,
};

writeFileSync(
  new URL(`./${resultName}.json`, import.meta.url),
  JSON.stringify({ variant, pagePath, mode: process.env.MODE ?? 'production', fullBuild: process.env.FULL_BUILD !== '0', meta, steps, sentinel1, pageloadArrived, summary, console: consoleLines, pageErrors, itemsAfterVerify, items, headers, raw }, null, 2),
);
writeFileSync(
  new URL(`./app-${resultName.replace(/^results-/, '')}.log`, import.meta.url),
  [`# ${pagePath} page errors`, ...pageErrors, ``, `# ${pagePath} console`, ...consoleLines].join('\n'),
);

await browser.close();
console.log(`wrote ${resultName}.json (${items.length} sink items, ${pageErrors.length} page errors, sentinel=${sentinel1}, pageload=${pageloadArrived})`);
