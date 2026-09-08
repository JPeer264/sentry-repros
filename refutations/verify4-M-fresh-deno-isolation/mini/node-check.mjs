import { AsyncLocalStorage } from 'node:async_hooks';
import { createServer } from 'node:http';
const als = new AsyncLocalStorage();
let n = 0;
createServer((req, res) => {
  const storeAtEntry = als.getStore();
  const id = `r${++n}`;
  als.run(id, async () => {
    if (req.url.startsWith('/dyn')) await import(`data:text/javascript,export const x=${Math.random()};`);
    res.end(JSON.stringify({ id, path: req.url, storeAtEntry: storeAtEntry ?? null, storeInside: als.getStore() }));
  });
}).listen(47260, () => console.log('up'));
