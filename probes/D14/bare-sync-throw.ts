// No Sentry at all: the control for the synchronous throw inside a node:http listener.
import { createServer } from 'node:http';

const APP_PORT = Number(Deno.env.get('PORT'));

globalThis.addEventListener('error', e => console.log('globalThis error event', String((e as ErrorEvent).message)));

const server = createServer((req, res) => {
  console.log('request', req.url);
  if (req.url === '/error-sync') {
    throw new Error('sync throw in listener');
  }
  res.statusCode = 200;
  res.end('hello world\n');
});

server.on('error', e => console.log("server 'error' event", String(e)));
server.listen(APP_PORT, '127.0.0.1', () => console.log('bare app on', APP_PORT));
