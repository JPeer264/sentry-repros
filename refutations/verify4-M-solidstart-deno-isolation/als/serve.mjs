import { AsyncLocalStorage } from 'node:async_hooks';
const als = new AsyncLocalStorage();
let cached;
const load = () => (cached ??= import('./mod2.mjs'));
let n = 0;
const port = Number(Deno.env.get('PORT'));
Deno.serve({ port, hostname: '127.0.0.1' }, async req => {
  const entry = als.getStore();
  const label = `req${++n}`;
  const out = await als.run(label, async () => {
    const m = await load();
    await m.handler();
    await new Promise(r => setTimeout(r, 50));
    return als.getStore();
  });
  return new Response(JSON.stringify({ label, storeAtEntry: entry ?? null, storeInside: out }) + '\n');
});
