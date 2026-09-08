import { subscribe } from 'node:diagnostics_channel';
import http from 'node:http';
let fired = false;
subscribe('http.server.request.start', () => { fired = true; });
const s = http.createServer((req, res) => res.end('ok'));
s.listen(48219, '127.0.0.1', async () => {
  await fetch('http://127.0.0.1:48219/x').then(r => r.text());
  console.log('http.server.request.start fired:', fired);
  s.close();
});
