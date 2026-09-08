import * as Sentry from '@sentry/deno';

Sentry.init({
  dsn: 'https://public@127.0.0.1/1',
  tunnel: `http://127.0.0.1:${Deno.env.get('SINK_PORT')}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: (Deno.env.get('LIFECYCLE') ?? 'static') as 'static' | 'stream',
  debug: Deno.env.get('SENTRY_DEBUG') === '1',
});
