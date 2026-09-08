import { AsyncLocalStorage } from 'node:async_hooks';
import http from 'node:http';
const als = new AsyncLocalStorage();
const port = Number(process.env.PORT);
http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  const id = u.searchParams.get('id');
  res.setHeader('content-type', 'application/json');
  if (!id) { res.end(JSON.stringify({ ambient: als.getStore() ?? null })); return; }
  als.run({ id }, async () => {
    await import('./mod1.mjs');
    await new Promise(r => setTimeout(r, 10));
    res.end(JSON.stringify({ id }));
  });
}).listen(port, () => console.log('ready ' + port));
