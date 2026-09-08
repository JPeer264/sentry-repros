import * as Sentry from '@sentry/deno';

const port = Deno.env.get('SINK_PORT') || '53217';

Sentry.init({
  dsn: 'https://public@example.invalid/1',
  tunnel: `http://127.0.0.1:${port}/`,
  tracesSampleRate: 1.0,
  release: 'x03',
});

export async function sentinel(message) {
  Sentry.captureMessage(message);
  await Sentry.flush(4000);
}
