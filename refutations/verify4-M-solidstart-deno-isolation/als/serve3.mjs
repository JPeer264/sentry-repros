import { AsyncLocalStorage } from 'node:async_hooks';
import { createServer } from 'node:http';
const als = new AsyncLocalStorage();
const SERVER = Deno.env.get('SERVER');
const EXIT = Deno.env.get('EXIT') === '1';
let n = 0;
const handle = async (path) => {
  const entry = als.getStore();
  const label = `req${++n}`;
  const out = await als.run(label, async () => {
    const spec = `./m${3 + (n % 4)}.mjs`;
    if (EXIT) await als.exit(() => import(spec));
    else await import(spec);
    return als.getStore();
  });
  return { SERVER, EXIT, label, path, storeAtEntry: entry ?? null, storeInside: out };
};
const port = Number(Deno.env.get('PORT'));
if (SERVER === 'deno') {
  Deno.serve({ port, hostname: '127.0.0.1' }, async req => new Response(JSON.stringify(await handle(new URL(req.url).pathname)) + '\n'));
} else {
  createServer(async (req, res) => { res.end(JSON.stringify(await handle(req.url)) + '\n'); }).listen(port, '127.0.0.1', () => console.log('node:http listening'));
}
