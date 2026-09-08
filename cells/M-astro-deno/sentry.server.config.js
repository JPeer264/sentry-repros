import * as Sentry from '@sentry/astro';

const env = globalThis.Deno?.env;
const sinkPort = env?.get('SINK_PORT') ?? '47312';
const lifecycle = env?.get('SENTRY_LIFECYCLE') === 'static' ? 'static' : 'stream';

Sentry.init({
  dsn: 'http://public@127.0.0.1/1',
  tunnel: `http://127.0.0.1:${sinkPort}/`,
  tracesSampleRate: 1.0,
  sendDefaultPii: true,
  traceLifecycle: lifecycle,
});
