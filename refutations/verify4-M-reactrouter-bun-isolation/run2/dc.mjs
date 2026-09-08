import dc from 'node:diagnostics_channel';
import http from 'node:http';
const seen = [];
for (const name of ['http.server.request.start', 'http.server.response.finish', 'http.client.request.start']) {
  dc.subscribe(name, () => seen.push(name));
}
const srv = http.createServer((req, res) => res.end('ok'));
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const port = srv.address().port;
await fetch(`http://127.0.0.1:${port}/x`).then(r => r.text());
setTimeout(() => { console.log(JSON.stringify({ runtime: typeof Bun !== 'undefined' ? 'bun' : 'node', seen })); srv.close(); process.exit(0); }, 300);
