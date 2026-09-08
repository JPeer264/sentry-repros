import { AsyncLocalStorage } from 'node:async_hooks';
const als = new AsyncLocalStorage();
let n = 0;
Deno.serve({ port: 41390, hostname: '127.0.0.1' }, async req => {
  const outer = als.getStore();
  const id = ++n;
  const store = { id };
  const res = await als.run(store, async () => {
    await new Promise(r => setTimeout(r, 60 + Math.floor(Math.random() * 120)));
    const inner = als.getStore();
    return { id, outerAtEntry: outer ? outer.id : null, innerAfterAwait: inner ? inner.id : null };
  });
  return new Response(JSON.stringify(res) + '\n');
});
