import '@sentry/deno/import';
import * as Sentry from '@sentry/deno';

const APP_PORT = Number(Deno.env.get('APP_PORT'));
const SINK_PORT = Number(Deno.env.get('SINK_PORT'));

// 'stream' (default on develop) or 'static'
const LIFECYCLE = Deno.env.get('LIFECYCLE') ?? 'stream';
// 'off' drops 'incomingRequest' from dataCollection.httpBodies
const BODIES = Deno.env.get('BODIES') ?? 'on';
// explicit denoServeIntegration({ maxRequestBodySize }) value, unset means default
const MAXSIZE = Deno.env.get('MAXSIZE') ?? '';

const integrations = MAXSIZE
  ? [Sentry.denoServeIntegration({ maxRequestBodySize: MAXSIZE as never })]
  : [];

Sentry.init({
  dsn: 'https://public@example.invalid/1',
  tunnel: `http://127.0.0.1:${SINK_PORT}/`,
  tracesSampleRate: 1.0,
  sendDefaultPii: true,
  traceLifecycle: LIFECYCLE as never,
  dataCollection: BODIES === 'off' ? { httpBodies: [] } : {},
  integrations,
});

Deno.serve({ port: APP_PORT, hostname: '127.0.0.1' }, async (request: Request) => {
  const url = new URL(request.url);

  if (url.pathname === '/throw') {
    throw new Error('route boom');
  }

  if (url.pathname === '/ok') {
    await request.text();
    return new Response('ok\n', { status: 200 });
  }

  if (url.pathname === '/sentinel') {
    Sentry.captureMessage('sentinel');
    return new Response('sentinel\n', { status: 200 });
  }

  return new Response('not found\n', { status: 404 });
});
