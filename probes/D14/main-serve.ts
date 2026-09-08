import * as Sentry from '@sentry/deno';
import { APP_PORT, initSentry, route } from './routes.ts';

initSentry();

Deno.serve({ port: APP_PORT, hostname: '127.0.0.1' }, async request => {
  const url = new URL(request.url);
  console.log('request', url.pathname + url.search);

  if (url.pathname === '/error-sync') {
    throw new Error('sync throw in listener');
  }

  const headers: Record<string, string> = {};
  request.headers.forEach((v, k) => (headers[k] = v));

  const answer = await route(url.pathname, url.searchParams, headers);
  return new Response(answer.body, { status: answer.status });
});
