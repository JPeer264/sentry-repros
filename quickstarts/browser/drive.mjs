// Playwright driver. Usage: node drive.mjs <variant> <page path>
// Variants: npm (/), cdn (/cdn.html), cjs (/cjs.html), late (/late.html)
//
// Phases, each waiting on a condition instead of a sleep:
//   1. the docs' tracing verify snippet, parsed by a real browser on a page with no SDK
//   2. the variant page: init, then one click per documented signal, then the sentinel
//   3. a `history.pushState` navigation, to see whether the browser session is renewed
//   4. one more error, to see whether the buffered replay is ever sent
import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const variant = process.argv[2] ?? 'npm';
const pagePath = process.argv[3] ?? '/';
const base = process.env.BASE_URL ?? 'http://localhost:41701';

const consoleLines = [];
const pageErrors = [];

const get = path => fetch(`${base}${path}`).then(r => r.json());

async function until(label, check, tries = 200, waitMs = 150) {
  for (let i = 0; i < tries; i++) {
    if (await check()) return true;
    await new Promise(r => setTimeout(r, waitMs));
  }
  console.error(`[drive] gave up waiting for ${label}`);
  return false;
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext();
const page = await context.newPage();
page.on('console', m => consoleLines.push(`${m.type()}: ${m.text()}`));
page.on('pageerror', e => pageErrors.push(String(e && e.message ? e.message : e)));

await page.goto(`${base}/docs-snippet.html`, { waitUntil: 'load' });
const docsSnippet = await page.evaluate(() => ({
  defined: window.__snippetDefined,
  errors: window.__scriptErrors,
}));

const snippetConsole = consoleLines.slice();
consoleLines.length = 0;
pageErrors.length = 0;

await page.goto(`${base}${pagePath}`, { waitUntil: 'load' });
await until('SDK init', () => page.evaluate(() => !!(window.Sentry && window.Sentry.getClient && window.Sentry.getClient())));
await until('buttons wired', () => page.evaluate(() => document.body.getAttribute('data-wired') === '1'));

const meta = await page.evaluate(() => window.__qsMeta());
const pageGlobals = await page.evaluate(() => ({
  preInitCaught: window.__preInitCaught ?? null,
  lateInitDone: window.__lateInitDone ?? null,
}));

await page.click('#btn-capture');
await page.click('#btn-throw');
await page.click('#btn-span');
await page.click('#btn-log');

await until('recorder fetch', async () => (await get('/__headers')).some(h => String(h.url).includes('from=span')));

await page.click('#btn-sentinel');

await until('sentinel event, log item and sentinel span', async () => {
  const items = await get('/__items');
  const sentinel = items.some(i => i.type === 'event' && i.message === 'sentinel');
  const log = items.some(i => i.type === 'log');
  const span = items.some(i => i.type === 'span' && (i.items || []).some(s => s.includes('sentinel-span')));
  return sentinel && log && span;
});

await page.evaluate(() => window.Sentry.flush(5000));

// The pageload segment span only ends after the browser tracing idle timeout, so it lands last.
await until(
  'pageload span',
  async () => (await get('/__items')).some(i => i.type === 'span' && (i.items || []).some(s => s.startsWith('pageload'))),
  120,
  250,
);

const itemsAfterVerify = await get('/__items');

// v10-to-v11 migration, "Browser Session Changes": with the `page` lifecycle a session is created
// on page load and is not renewed on navigation.
await page.evaluate(() => {
  history.pushState({}, '', '/probe/42');
  window.Sentry.captureException(new Error('Error after navigation'));
});
await until(
  'navigation span',
  async () => (await get('/__items')).some(i => i.type === 'span' && (i.items || []).some(s => s.startsWith('navigation'))),
  120,
  250,
);
const itemsAfterNavigation = await get('/__items');

// Session Replay: the buffered replay is only sent once the session is long enough
// (`minReplayDuration`, 5s by default), so give it one more error and a bounded wait.
await page.evaluate(() => window.Sentry.captureException(new Error('Error for the replay buffer')));
const replayArrived = await until(
  'replay envelope',
  async () => (await get('/__items')).some(i => i.type === 'replay_event'),
  80,
  250,
);
await page.evaluate(() => window.Sentry.flush(5000));

const [items, raw, headers] = await Promise.all([get('/__items'), get('/__items?raw=1'), get('/__headers')]);

writeFileSync(
  new URL(`./results-${variant}.json`, import.meta.url),
  JSON.stringify(
    { variant, pagePath, docsSnippet, meta, pageGlobals, replayArrived, itemsAfterVerify, itemsAfterNavigation, items, headers, raw },
    null,
    2,
  ),
);
writeFileSync(
  new URL(`./app-${variant}.log`, import.meta.url),
  [
    `# docs-snippet.html console`,
    ...snippetConsole,
    ``,
    `# ${pagePath} page errors`,
    ...pageErrors,
    ``,
    `# ${pagePath} console`,
    ...consoleLines,
  ].join('\n'),
);

await browser.close();
console.log(`wrote results-${variant}.json (${items.length} sink items, ${pageErrors.length} page errors, replay=${replayArrived})`);
