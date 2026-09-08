import * as Sentry from '@sentry/cloudflare';

interface Env {
  SENTRY_TUNNEL: string;
}

export default Sentry.withSentry(
  (env: Env) => ({
    dsn: 'https://public@example.ingest.sentry.io/1337',
    tunnel: env.SENTRY_TUNNEL,
    tracesSampleRate: 1.0,
    release: 'c12@1.0.0',
    environment: 'c12',
    sendDefaultPii: true,
    integrations: [Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] })],
  }),
  {
    async fetch(request: Request, _env: Env, ctx: ExecutionContext): Promise<Response> {
      const url = new URL(request.url);

      if (url.pathname === '/error') {
        throw new Error('c12 route boom');
      }

      if (url.pathname === '/sentinel') {
        Sentry.captureMessage(`sentinel ${url.searchParams.get('n') ?? ''}`.trim());
        return new Response('sentinel\n');
      }

      if (url.pathname === '/telemetry' || url.pathname === '/flush') {
        const attributes = { route: url.pathname };

        Sentry.metrics.count('c12.requests', 1, { attributes });
        Sentry.metrics.gauge('c12.gauge', 42, { unit: 'millisecond', attributes });

        Sentry.logger.info('c12 logger info', attributes);
        console.log('c12 console log', attributes);
        console.warn('c12 console warn');

        if (url.pathname === '/flush') {
          ctx.waitUntil(Sentry.flush(2000));
        }

        return new Response(`${url.pathname} ok\n`);
      }

      return new Response('ok\n');
    },
  },
);
