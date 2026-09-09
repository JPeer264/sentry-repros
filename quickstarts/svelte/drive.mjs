// Playwright driver. Usage: node drive.mjs <variant> <page path>
// One headless system Chrome per run. Every wait is a condition on the sink or the page, never a
// sleep: the run ends with a sentinel message plus a sentinel span and polls for those, so
// everything captured before them is known to have arrived. A 60 s deadline bounds the whole run.
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const variant = process.argv[2] ?? 'base';
const pagePath = process.argv[3] ?? `/${variant}.html`;
const base = process.env.BASE_URL ?? 'http://localhost:4720';
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

async function sentinel(page, name) {
  if (!(await page.evaluate(() => typeof window.__qsSentinel === 'function'))) return false;
  const tracing = await page.evaluate(() => { const o = window.Sentry.getClient().getOptions(); return o.tracesSampleRate != null || o.tracesSampler != null; });
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
  const sdkUp = await until('SDK init', () => page.evaluate(() => !!(window.Sentry && window.Sentry.getClient && window.Sentry.getClient())), 60);
  const appUp = await until('app rendered', () => page.evaluate(() => document.body.getAttribute('data-wired') === '1'), 40);

  meta = await page.evaluate(() => (window.__qsMeta ? window.__qsMeta() : { initialized: false }));
  steps.push({ label: 'boot', result: { sdkUp, appUp, pageErrorsAtBoot: pageErrors.slice(), feedbackWidget: await page.evaluate(() => !!document.querySelector('#sentry-feedback')), appHtml: await page.evaluate(() => (document.querySelector('#app') || document.body).innerHTML.slice(0, 400)) } });

  if (appUp && variant === 'base') {
    await step('click #btn-throw (index.mdx:215-222, onclick throws "Sentry Frontend Error")', async () => {
      await page.click('#btn-throw');
      return { captured: await until('first error', async () => hasEvent(await get('/__items'), i => String(i.exception).includes('Sentry Frontend Error')), 60, 100) };
    });
    await step('inspect #btn-span (index.mdx:255-266 verbatim, `onClick`)', () =>
      page.evaluate(() => {
        const el = document.querySelector('#btn-span');
        return { attributeNames: el.getAttributeNames(), onclickAttribute: el.getAttribute('onclick')?.slice(0, 120) ?? null, onclickProperty: typeof el.onclick, hasOnClickProperty: 'onClick' in el };
      }),
    );
    await step('click #btn-span (index.mdx:255-266 verbatim, `onClick`)', async () => {
      await page.click('#btn-span');
      return { errorsSoFar: countEvents(await get('/__items'), i => String(i.exception).includes('Sentry Frontend Error')) };
    });
    await step('click #btn-span-fixed (the same snippet with `onclick`)', async () => {
      await page.click('#btn-span-fixed');
      // Both 99 ms timers fire in click order, so once the fixed button's error is in, the verbatim button's error (if any) is in too.
      const ok = await until('fixed error', async () => countEvents(await get('/__items'), i => String(i.exception).includes('Sentry Frontend Error')) >= 2, 60, 100);
      const items = await get('/__items');
      return { fixedErrorArrived: ok, frontendErrors: countEvents(items, i => String(i.exception).includes('Sentry Frontend Error')), exampleSpans: spans(items).filter(s => s.name === 'Example Frontend Span').length };
    });
    await step('click #btn-log (logs include :12-24, Sentry.logger.*)', () => page.click('#btn-log'));
    await step('click #btn-fetch (relative + absolute same-origin fetch to /recorder)', async () => {
      await page.click('#btn-fetch');
      const ok = await until('recorder hits', async () => (await get('/__headers')).length >= 2, 60);
      return { recorderHits: ok, headers: await get('/__headers') };
    });
  }

  sentinel1 = await sentinel(page, 'sentinel');
  await page.evaluate(() => window.Sentry && window.Sentry.flush(5000));

  // The pageload segment ends after the browser tracing idle timeout, so it lands after the sentinel.
  const tracing = sdkUp && (await page.evaluate(() => { const o = window.Sentry.getClient().getOptions(); return o.tracesSampleRate != null || o.tracesSampler != null; }));
  pageloadArrived = tracing && (await until('pageload span', async () => hasSpan(await get('/__items'), s => s.op === 'pageload'), 120, 250));
  const itemsAfterVerify = await get('/__items');

  if (appUp && variant.startsWith('component-tracking')) {
    await step('init spans after pageload', async () => ({ componentSpans: spans(await get('/__items')).filter(s => s.origin === 'auto.ui.svelte').map(s => ({ op: s.op, name: s.name, parent_span_id: s.parent_span_id, duration_ms: s.duration_ms })) }));
    await step('click #btn-update x2 (App $state change, re-render)', async () => {
      await page.click('#btn-update');
      await page.click('#btn-update');
      return { renders: await page.evaluate(() => document.querySelector('#renders')?.textContent) };
    });
    await sentinel(page, 'sentinel-2');
    await step('update spans after re-render', async () => ({ updateSpans: spans(await get('/__items')).filter(s => s.origin === 'auto.ui.svelte' && s.op !== 'ui.svelte.init' && !String(s.op).endsWith('mount')).map(s => `${s.op} ${s.name}`) }));
  }

  if (appUp && variant === 'track-component') {
    await step('init spans after pageload', async () => ({ componentSpans: spans(await get('/__items')).filter(s => s.origin === 'auto.ui.svelte').map(s => ({ op: s.op, name: s.name, parent_span_id: s.parent_span_id, duration_ms: s.duration_ms })) }));
    await step('click #btn-update (prop change flushed inside startSpan "update-click")', async () => {
      await page.click('#btn-update');
      return { value: await page.evaluate(() => document.querySelector('#value')?.textContent), runes: await page.evaluate(() => document.querySelector('#runes')?.textContent), legacy: await page.evaluate(() => document.querySelector('#legacy')?.textContent) };
    });
    await sentinel(page, 'sentinel-2');
    await step('spans after the update click', async () => {
      const all = spans(await get('/__items'));
      const click = all.find(s => s.name === 'update-click');
      return { clickSpan: click ? { span_id: click.span_id, is_segment: click.is_segment } : null, children: all.filter(s => click && s.parent_span_id === click.span_id).map(s => `${s.op} ${s.name} ${s.duration_ms}ms`), svelteSpans: all.filter(s => s.origin === 'auto.ui.svelte').map(s => `${s.op} ${s.name} parent=${s.parent_span_id}`) };
    });
  }

  if (variant === 'base') {
    // Session Replay: the buffered replay is only sent once the session is long enough
    // (`minReplayDuration`, 5 s by default), so give it one more error and a bounded wait.
    await page.evaluate(() => window.Sentry.captureException(new Error('Error for the replay buffer')));
    const replayArrived = await until('replay envelope', async () => (await get('/__items')).some(i => i.type === 'replay_event'), 80, 250);
    steps.push({ label: 'replay after minReplayDuration', result: { replayArrived } });
  }

  await page.evaluate(() => window.Sentry && window.Sentry.flush(5000));
  const [items, raw, headers] = await Promise.all([get('/__items'), get('/__items?raw=1'), get('/__headers')]);

  let compiledOnClick;
  try {
    compiledOnClick = readFileSync(new URL(`./dist/${variant}.js`, import.meta.url), 'utf8').split('\n').map((l, i) => ({ line: i + 1, text: l.trim() })).filter(l => /onClick|"Click"|'Click'/.test(l.text)).slice(0, 10);
  } catch {}

  const summary = {
    itemTypes: items.map(i => i.type),
    events: items.filter(i => i.type === 'event').map(i => ({ message: i.message, exception: i.exception, mechanism: i.mechanism, handled: i.handled, transaction: i.transaction, trace_id: i.trace_id, breadcrumbs: i.breadcrumbs })),
    spans: spans(items).map(s => ({ op: s.op, name: s.name, is_segment: s.is_segment, source: s.source, origin: s.origin, url_path: s.url_path, status: s.status, duration_ms: s.duration_ms, parent_span_id: s.parent_span_id, span_id: s.span_id })),
    logs: items.filter(i => i.type === 'log').flatMap(i => i.items),
    sessions: items.filter(i => i.type === 'session').map(i => ({ status: i.status, errors: i.errors, init: i.init })),
    replay: items.filter(i => i.type === 'replay_event').length,
    headers,
  };

  writeFileSync(
    new URL(`./${resultName}.json`, import.meta.url),
    JSON.stringify({ variant, pagePath, mode: process.env.MODE ?? 'production', build, meta, steps, sentinel1, pageloadArrived, deadlineHit, summary, console: consoleLines, pageErrors, compiledOnClick, itemsAfterVerify, items, headers, raw }, null, 2),
  );
  writeFileSync(new URL(`./app-${resultName.replace(/^results-/, '')}.log`, import.meta.url), [`# ${pagePath} page errors`, ...pageErrors, ``, `# ${pagePath} console`, ...consoleLines].join('\n'));
  console.log(`wrote ${resultName}.json (${items.length} sink items, ${pageErrors.length} page errors, sentinel=${sentinel1}, pageload=${pageloadArrived}, deadlineHit=${deadlineHit})`);
} finally {
  await browser.close();
}
