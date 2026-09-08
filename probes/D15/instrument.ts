import * as Sentry from '@sentry/deno';

const SINK_PORT = Number(Deno.env.get('SINK_PORT'));

Sentry.init({
  dsn: 'https://public@example.invalid/1',
  tunnel: `http://127.0.0.1:${SINK_PORT}/`,
  tracesSampleRate: 1.0,
  sendDefaultPii: true,
});
