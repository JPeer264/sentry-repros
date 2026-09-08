import * as Sentry from '@sentry/cloudflare';

interface Env {
  SINK_PORT: string;
  DOWN_PORT: string;
  NO_PROPAGATE?: string;
}

export default Sentry.withSentry(
  (env: Env) => ({
    dsn: 'https://public@127.0.0.1/1',
    tunnel: `http://127.0.0.1:${env.SINK_PORT}/`,
    tracesSampleRate: 1.0,
    release: 'c03@1.0.0',
    environment: 'probe',
    ...(env.NO_PROPAGATE ? { tracePropagationTargets: [] } : {}),
  }),
  {
    async fetch(request: Request, env: Env): Promise<Response> {
      const url = new URL(request.url);

      if (url.pathname === '/continue') {
        const res = await fetch(`http://127.0.0.1:${env.DOWN_PORT}/downstream`);
        return new Response(`downstream:${res.status}`);
      }

      if (url.pathname === '/sentinel') {
        Sentry.captureMessage('sentinel');
        return new Response('sentinel');
      }

      return new Response('ok');
    },
  },
);
