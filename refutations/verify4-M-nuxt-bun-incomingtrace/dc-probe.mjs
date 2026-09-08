import { subscribe } from 'node:diagnostics_channel';
import { createServer } from 'node:http';
let fired = 0;
subscribe('http.server.request.start', () => { fired++; });
const s = createServer((req, res) => res.end('ok'));
s.listen(41322, '127.0.0.1', async () => {
  await fetch('http://127.0.0.1:41322/');
  setTimeout(() => { console.log('channel fired:', fired); process.exit(0); }, 200);
});
