import * as Sentry from '@sentry/cloudflare/nodejs_compat';

interface Env {
  /** Port of the local envelope sink the SDK tunnels to. */
  SINK_PORT: string;
}

export default Sentry.withSentry(
  (env: Env) => ({
    dsn: 'https://public@example.invalid/1',
    tunnel: `http://127.0.0.1:${env.SINK_PORT}/`,
    tracesSampleRate: 1.0,
    traceLifecycle: 'static' as const,
  }),
  {
    async fetch(request: Request): Promise<Response> {
      const url = new URL(request.url);
      if (url.pathname === '/probe') {
        return new Response(JSON.stringify({ ok: true, entrypoint: 'nodejs_compat' }) + '\n');
      }
      return new Response('hello\n');
    },
  },
);
