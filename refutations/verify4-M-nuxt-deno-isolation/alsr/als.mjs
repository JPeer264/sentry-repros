import { AsyncLocalStorage } from 'node:async_hooks';
import http from 'node:http';
const als = new AsyncLocalStorage();
let n = 0;
async function handle(delay) {
  const outer = als.getStore();
  const id = ++n;
  return await als.run({ id }, async () => {
    await new Promise(r => setTimeout(r, delay));
    return { id, outerAtEntry: outer ? outer.id : null, innerAfterAwait: als.getStore()?.id ?? null };
  });
}
Deno.serve({ port: 45101, hostname: '127.0.0.1' }, async req => {
  const d = Number(new URL(req.url).searchParams.get('d') || 50);
  return new Response(JSON.stringify(await handle(d)) + '\n');
});
http.createServer(async (req, res) => {
  const d = Number(new URL(req.url, 'http://x').searchParams.get('d') || 50);
  const r = await handle(d);
  res.end(JSON.stringify(r) + '\n');
}).listen(45102, '127.0.0.1');
