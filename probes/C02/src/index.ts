import * as Sentry from '@sentry/cloudflare';

interface Env {
  SINK_PORT: string;
  UNCACHED?: string;
}

export default Sentry.withSentry(
  (env: Env) => ({
    dsn: 'https://public@127.0.0.1/1',
    tunnel: `http://127.0.0.1:${env.SINK_PORT}/`,
    tracesSampleRate: 1.0,
    ...(env.UNCACHED ? { cacheClient: false } : {}),
  }),
  {
    async fetch(request: Request): Promise<Response> {
      const url = new URL(request.url);

      if (url.pathname === '/a') {
        const tag = url.searchParams.get('tag') ?? 'none';
        Sentry.setTag('req', tag);
        Sentry.setUser({ id: tag });
        // Hold the invocation open so all five requests are in flight at once.
        await new Promise(resolve => setTimeout(resolve, 300));
        Sentry.captureException(new Error(`boom ${tag}`));
        return new Response(`done ${tag}`);
      }

      if (url.pathname === '/sentinel') {
        Sentry.captureMessage('sentinel');
        return new Response('sentinel');
      }

      return new Response('ok');
    },
  },
);
