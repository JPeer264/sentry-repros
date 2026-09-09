// Diagnostic for the missing first navigation span: logs every history.pushState/replaceState call
// made on a page (installed before any page script runs) next to the SDK's own debug lines.
// Usage: SITE_URL=http://localhost:4769 node diag-history.mjs /users/42/ /about/
import { chromium } from 'playwright-core';

const site = process.env.SITE_URL ?? 'http://localhost:4769';
const start = process.argv[2] ?? '/users/42/';
const target = process.argv[3] ?? '/about/';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext();
await context.addInitScript(() => {
  for (const m of ['pushState', 'replaceState']) {
    const orig = history[m];
    history[m] = function (...args) {
      console.log(`HISTORY ${m} url=${args[2]} href=${location.href}`);
      return orig.apply(this, args);
    };
  }
});
const page = await context.newPage();
const lines = [];
page.on('console', msg => {
  const t = msg.text();
  if (/^HISTORY|Starting sampled root span|op: navigation|op: pageload/.test(t)) lines.push(t.split('\n')[0]);
});
await page.goto(`${site}${start}`, { waitUntil: 'load' });
for (let i = 0; i < 40 && !(await page.evaluate(() => document.body.getAttribute('data-wired') === '1')); i++) await new Promise(r => setTimeout(r, 100));
lines.push(`--- navigate to ${target}`);
await page.evaluate(t => window.___navigate(t), target);
for (let i = 0; i < 40 && !(await page.evaluate(t => location.pathname === t, target)); i++) await new Promise(r => setTimeout(r, 100));
lines.push(`--- at ${await page.evaluate(() => location.pathname)}`);
await new Promise(r => setTimeout(r, 300));
await browser.close();
console.log(lines.join('\n'));
