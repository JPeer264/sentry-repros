import * as Sentry from '@sentry/cloudflare';

interface Env {
  SENTRY_DSN?: string;
  SENTRY_ENVIRONMENT?: string;
  SENTRY_RELEASE?: string;
  SENTRY_TRACES_SAMPLE_RATE?: string;
  SINK_URL?: string;
  CF_VERSION_METADATA?: { id: string; tag: string; timestamp: string };
}

export default Sentry.withSentry(
  (env: Env) => ({
    // No dsn, environment, release or tracesSampleRate here on purpose:
    // everything but the tunnel has to come from the Worker env.
    tunnel: env.SINK_URL,
  }),
  {
    async fetch(request: Request, env: Env): Promise<Response> {
      const url = new URL(request.url);

      if (url.pathname === '/env') {
        console.log('ENV', JSON.stringify(env));
        return new Response('env\n');
      }

      if (url.pathname === '/opts') {
        const o = Sentry.getClient()?.getOptions() as Record<string, unknown> | undefined;
        console.log(
          'OPTS',
          JSON.stringify({
            dsn: o?.dsn,
            environment: o?.environment,
            release: o?.release,
            tracesSampleRate: o?.tracesSampleRate,
            tunnel: o?.tunnel,
          }),
        );
        return new Response('opts\n');
      }

      if (url.pathname === '/hello') {
        return new Response('hello\n');
      }

      if (url.pathname === '/error') {
        throw new Error('route boom');
      }

      if (url.pathname === '/sentinel') {
        Sentry.captureMessage('sentinel');
        return new Response('sentinel\n');
      }

      return new Response('not found\n', { status: 404 });
    },
  },
);
