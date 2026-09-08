import * as Sentry from '@sentry/deno';
import { createServer } from 'node:http';
import { APP_PORT, initSentry, route } from './routes.ts';

initSentry();

createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://127.0.0.1:${APP_PORT}`);
  console.log('request', url.pathname + url.search);

  if (url.pathname === '/error-sync') {
    throw new Error('sync throw in listener');
  }

  // Not awaited on purpose: a rejection here is what /error probes.
  void route(url.pathname, url.searchParams, req.headers as Record<string, string>).then(answer => {
    res.statusCode = answer.status;
    res.end(answer.body);
  });
}).listen(APP_PORT, '127.0.0.1', () => console.log('node:http app on', APP_PORT, Sentry.getClient() ? 'sentry on' : 'sentry off'));
