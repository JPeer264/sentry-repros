import { AsyncLocalStorage } from 'node:async_hooks';
const als = new AsyncLocalStorage();
let cached;
const load = () => (cached ??= import('./mod2.mjs'));
const MODE = Deno.env.get('MODE');
let n = 0;
const port = Number(Deno.env.get('PORT'));
Deno.serve({ port, hostname: '127.0.0.1' }, async req => {
  const entry = als.getStore();
  const label = `req${++n}`;
  const out = await als.run(label, async () => {
    if (MODE === 'import') await load();
    if (MODE === 'timeout') await new Promise(r => setTimeout(r, 20));
    if (MODE === 'noop') { /* sync only */ }
    if (MODE === 'fetchmod') await import('./mod2.mjs');
    return als.getStore();
  });
  return new Response(JSON.stringify({ MODE, label, storeAtEntry: entry ?? null, storeInside: out }) + '\n');
});
