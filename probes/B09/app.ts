import './instrument';
import * as Sentry from '@sentry/bun';
import { createServer } from 'node:http';

const PORT = Number(process.env.PORT);
const NODE_PORT = PORT + 1;

Bun.serve({
  port: PORT,
  hostname: '127.0.0.1',
  routes: {
    '/throw-read': async (req: Request) => {
      const body = await req.text();
      throw new Error(`route boom (read body) ${body}`);
    },
    '/throw': async (_req: Request) => {
      throw new Error('route boom (unread body)');
    },
    '/sentinel': async () => {
      Sentry.captureMessage('sentinel');
      await Sentry.flush(2000);
      return new Response('ok');
    },
  },
  async fetch(req: Request) {
    const url = new URL(req.url);
    if (url.pathname === '/fetch-throw') {
      const body = await req.text();
      throw new Error(`fetch boom (read body) ${body}`);
    }
    return new Response('not found', { status: 404 });
  },
});

// node:http comparison server: the same POST body goes here, so the sink shows
// whether request.data exists on a path the SDK does instrument for bodies.
createServer((req, res) => {
  const chunks: Buffer[] = [];
  req.on('data', c => chunks.push(c as Buffer));
  req.on('end', () => {
    if (req.url === '/node-throw') {
      Sentry.captureException(new Error(`node boom ${Buffer.concat(chunks).toString()}`));
    }
    res.end('ok');
  });
}).listen(NODE_PORT, '127.0.0.1');

console.log(`bun.serve on ${PORT}, node:http on ${NODE_PORT}`);
