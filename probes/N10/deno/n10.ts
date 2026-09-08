import '@sentry/deno/import';
import * as Sentry from '@sentry/deno';
import { deepBoom } from './lib/boom.ts';

Sentry.init({
  dsn: 'https://public@example.invalid/1',
  tunnel: Deno.env.get('SINK_URL') ?? 'http://127.0.0.1:52911/',
  tracesSampleRate: 1,
  release: 'n10-deno',
});

Deno.serve({ port: Number(Deno.env.get('PORT') ?? 44927) }, (request: Request) => {
  const url = new URL(request.url);
  if (url.pathname === '/error') deepBoom(Deno.env.get('MARKER') ?? 'deno');
  if (url.pathname === '/sentinel') {
    Sentry.captureMessage('sentinel');
    return new Response('sentinel\n');
  }
  return new Response('ok\n');
});
