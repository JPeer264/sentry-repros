import { AsyncLocalStorage } from 'node:async_hooks';
import http from 'node:http';

const als = new AsyncLocalStorage();
const port = Number(process.env.PORT);
let n = 3;

http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  const id = u.searchParams.get('id');
  res.setHeader('content-type', 'application/json');
  const ambient = als.getStore() ?? null;
  if (!id) { res.end(JSON.stringify({ mode: 'unwrapped', ambient })); return; }
  const outer = { id, level: 'outer' };
  als.run(outer, async () => {
    n += 1;
    await import(`./mod${n}.mjs`);
    const afterImport = als.getStore() ?? null;
    await als.run({ id, level: 'inner' }, async () => {
      await new Promise(r => setTimeout(r, 30));
    });
    const afterInner = als.getStore() ?? null;
    res.end(JSON.stringify({ mode: 'wrapped', id, ambientAtEntry: ambient, afterImport, afterInner }));
  });
}).listen(port, () => console.log('als3 ready ' + port));
