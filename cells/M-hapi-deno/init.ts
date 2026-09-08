import * as Sentry from '@sentry/deno';

const SINK = Deno.env.get('SINK_PORT') ?? '43117';

Sentry.init({
  dsn: 'https://public@example.com/1',
  tunnel: `http://127.0.0.1:${SINK}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: (Deno.env.get('LIFECYCLE') ?? 'static') as 'static' | 'stream',
});
