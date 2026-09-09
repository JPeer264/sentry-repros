// Playwright driver. Usage: node drive.mjs <variant> <page path incl. query>
// Env: BASE_URL (default http://localhost:4734), EXPECT_SPANS=0 for the errors-only variant.
//
// Every wait is a poll on a condition, never a sleep, and every poll shares one hard deadline of
// 60 seconds from the start of the run. The last click is the sentinel (a message plus a span);
// once both are in the sink, everything clicked before them has arrived too.
import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const variant = process.argv[2] ?? 'npm';
const pagePath = process.argv[3] ?? '/';
const base = process.env.BASE_URL ?? 'http://localhost:4734';
const expectSpans = process.env.EXPECT_SPANS !== '0';

const t0 = Date.now();
const DEADLINE = t0 + 60_000;
const consoleLines = [];
const pageErrors = [];
const steps = [];

function step(name, detail) {
  steps.push({ t_ms: Date.now() - t0, name, ...(detail !== undefined ? { detail } : {}) });
}

const get = path => fetch(`${base}${path}`).then(r => r.json());

async function until(label, check, waitMs = 150) {
  while (Date.now() < DEADLINE) {
    if (await check()) {
      step(`arrived: ${label}`);
      return true;
    }
    await new Promise(r => setTimeout(r, waitMs));
  }
  step(`deadline: ${label}`);
  console.error(`[drive] gave up waiting for ${label}`);
  return false;
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext();
const page = await context.newPage();
page.on('console', m => consoleLines.push(`${m.type()}: ${m.text()}`));
page.on('pageerror', e => pageErrors.push(String(e && e.message ? e.message : e)));

step('goto', pagePath);
await page.goto(`${base}${pagePath}`, { waitUntil: 'load' });
const initialized = await until('SDK init', () =>
  page.evaluate(() => !!(window.Sentry && window.Sentry.getClient && window.Sentry.getClient())),
);
const wasmLoaded = await until('wasm module loaded', () =>
  page.evaluate(() => ['1', 'error'].includes(document.body.getAttribute('data-wired') || '')),
);
const meta = await page.evaluate(() => window.__qsMeta());
const wasmError = await page.evaluate(() => window.__qsWasmError || null);
step('meta', { initialized, wasmLoaded, wasmError, wasm: meta.wasm, callStyles: meta.callStyles });

let clicked = [];
if (wasmLoaded && !wasmError) {
  // index.mdx:148-152, the guide's "Trigger WebAssembly error" button (testWasmError, try/catch + captureException)
  await page.click('text=Trigger WebAssembly error');
  clicked.push('Trigger WebAssembly error');
  step('click', 'Trigger WebAssembly error (index.mdx:148-152 -> testWasmError, index.mdx:170-184)');

  // not in the guide: the same trap uncaught, for the global handlers
  await page.click('#btn-uncaught');
  clicked.push('uncaught trap');
  step('click', 'uncaught trap (testWasmErrorUncaught, not in the guide)');

  // index.mdx:225-229, the guide's "Test WebAssembly with tracing" button (testWasmTracing)
  await page.click('text=Test WebAssembly with tracing');
  clicked.push('Test WebAssembly with tracing');
  step('click', 'Test WebAssembly with tracing (index.mdx:225-229 -> testWasmTracing, index.mdx:242-259)');
}

await page.click('#btn-sentinel');
clicked.push('sentinel');
step('click', 'sentinel (captureMessage + sentinel-span)');

const sentinelArrived = await until(expectSpans ? 'sentinel event and sentinel span' : 'sentinel event', async () => {
  const items = await get('/__items');
  const event = items.some(i => i.type === 'event' && i.message === 'sentinel');
  const span = !expectSpans || items.some(i => i.type === 'span' && (i.items || []).some(s => s.includes('sentinel-span')));
  return event && span;
});

await page.evaluate(() => window.Sentry.flush(5000));

let pageloadArrived = null;
if (expectSpans) {
  // The pageload segment only ends after the browser tracing idle timeout, so it lands last.
  pageloadArrived = await until(
    'pageload span',
    async () => (await get('/__items')).some(i => i.type === 'span' && (i.items || []).some(s => s.startsWith('pageload'))),
    250,
  );
  await page.evaluate(() => window.Sentry.flush(5000));
}

const [items, raw] = await Promise.all([get('/__items'), get('/__items?raw=1')]);
await browser.close();
step('browser closed');

const events = items.filter(i => i.type === 'event');
const trapEvents = events.filter(e => /divide by zero/i.test(e.exception || ''));
const caught = trapEvents.find(e => e.mechanism === 'generic');
const uncaught = trapEvents.find(e => e.mechanism && e.mechanism !== 'generic');
const spans = items.filter(i => i.type === 'span').flatMap(i => i.raw || []);

const summary = {
  envelopeItemTypes: items.map(i => i.type),
  sdk: events[0] ? { name: events[0].sdk, version: events[0].sdk_version, integrations: events[0].integrations, packages: events[0].packages } : null,
  browser: events[0]?.browser ?? null,
  events: events.map(e => ({
    message: e.message,
    exception: e.exception,
    mechanism: e.mechanism,
    handled: e.handled,
    wasmFrames: e.wasmFrames,
    debug_meta: e.debug_meta ?? null,
    frameCount: e.frames.length,
  })),
  spans: spans.map(s => ({ name: s.name, op: s.op, is_segment: s.is_segment, parent_span_id: s.parent_span_id, status: s.status })),
  logs: items.filter(i => i.type === 'log').flatMap(i => i.items),
  clientReports: items.filter(i => i.type === 'client_report').map(i => i.discarded_events),
};

const checks = {
  initialized,
  wasmLoaded: wasmLoaded && !wasmError,
  wasmIntegrationInstalled: (meta.integrations || []).includes('Wasm'),
  sentinelArrived,
  pageloadArrived,
  caughtTrapEvent: !!caught,
  uncaughtTrapEvent: !!uncaught,
  caughtHasWasmFrame: !!caught?.wasmFrames?.length,
  caughtWasmFrameFields: caught?.wasmFrames?.[0]
    ? Object.fromEntries(['filename', 'instruction_addr', 'addr_mode', 'platform', 'function', 'in_app'].map(k => [k, caught.wasmFrames[0][k] ?? null]))
    : null,
  caughtDebugMetaImages: caught?.debug_meta?.images ?? null,
  uncaughtHasWasmFrame: !!uncaught?.wasmFrames?.length,
  uncaughtWasmFrameFields: uncaught?.wasmFrames?.[0]
    ? Object.fromEntries(['filename', 'instruction_addr', 'addr_mode', 'platform', 'function', 'in_app'].map(k => [k, uncaught.wasmFrames[0][k] ?? null]))
    : null,
  uncaughtDebugMetaImages: uncaught?.debug_meta?.images ?? null,
  exampleSpan: spans.find(s => s.name === 'Example Span') ?? null,
  resultLogged: consoleLines.some(l => l.startsWith('log: Result:')),
};

let status;
if (!initialized || !checks.wasmLoaded || !sentinelArrived || !caught) status = 'broken';
else if (checks.caughtHasWasmFrame && checks.caughtWasmFrameFields.addr_mode && (checks.caughtDebugMetaImages || []).length) status = 'works';
else status = 'partial';

const verdict = {
  status,
  text: !caught
    ? 'no divide-by-zero event reached the sink'
    : !checks.caughtHasWasmFrame
      ? 'the caught trap reached the sink without any wasm frame'
      : !checks.caughtWasmFrameFields.addr_mode
        ? 'the caught trap carries a wasm frame with instruction_addr and platform=native, but no addr_mode and no debug_meta.images'
        : 'the caught trap carries a wasm frame with instruction_addr, addr_mode and platform=native plus a debug_meta wasm image',
};

writeFileSync(
  new URL(`./results-${variant}.json`, import.meta.url),
  JSON.stringify(
    {
      variant,
      pagePath,
      expectSpans,
      docs: {
        install: 'docs/platforms/javascript/guides/wasm/index.mdx:43-53',
        configure: 'docs/platforms/javascript/guides/wasm/index.mdx:70-100',
        verifyIssues: 'docs/platforms/javascript/guides/wasm/index.mdx:127-184',
        verifyTracing: 'docs/platforms/javascript/guides/wasm/index.mdx:202-259',
      },
      steps,
      clicked,
      meta,
      console: consoleLines,
      pageErrors,
      summary,
      checks,
      verdict,
      items,
      raw,
    },
    null,
    2,
  ),
);
writeFileSync(
  new URL(`./app-${variant}.log`, import.meta.url),
  [`# ${pagePath} page errors`, ...pageErrors, ``, `# ${pagePath} console`, ...consoleLines].join('\n'),
);
console.log(`wrote results-${variant}.json (${items.length} sink items, ${pageErrors.length} page errors, status=${status})`);
process.exit(sentinelArrived ? 0 : 2);
