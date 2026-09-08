import * as Sentry from '@sentry/deno';

const port = Deno.env.get('SINK_PORT') ?? '47311';

export const TAG = Deno.env.get('TAG') ?? 'dev';

Sentry.init({
  dsn: 'https://public@example.invalid/1',
  tunnel: `http://127.0.0.1:${port}/`,
  tracesSampleRate: 1.0,
});

export { Sentry };
