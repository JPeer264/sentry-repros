import { AsyncLocalStorage } from 'node:async_hooks';
import http from 'node:http';

const als = new AsyncLocalStorage();
const port = Number(process.env.PORT);
const mode = process.env.MODE; // import | nested | both | none
let n = 9;

http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  const id = u.searchParams.get('id');
  res.setHeader('content-type', 'application/json');
  const ambient = als.getStore() ?? null;
  if (!id) { res.end(JSON.stringify({ ambient })); return; }
  als.run({ id }, async () => {
    if (mode === 'import' || mode === 'both') { n += 1; await import(`./mod${n}.mjs`); }
    if (mode === 'nested' || mode === 'both') { await als.run({ id, level: 'inner' }, async () => { await new Promise(r => setTimeout(r, 30)); }); }
    await new Promise(r => setTimeout(r, 10));
    res.end(JSON.stringify({ id, inside: als.getStore() ?? null }));
  });
}).listen(port, () => console.log('ready ' + port));
