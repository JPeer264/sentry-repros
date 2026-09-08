import * as Sentry from '@sentry/cloudflare';

interface Env {
  /** Which body-capture configuration the Worker initialises Sentry with: "dc", "none" or "dcoff". */
  MODE: string;
  /** Port of the local envelope sink the SDK tunnels to. */
  SINK_PORT: string;
  /** Value passed to the SDK `traceLifecycle` option: "static" or "stream". */
  LIFECYCLE: string;
}

async function route(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === '/throw') {
    throw new Error('throw route boom');
  }

  if (url.pathname === '/ok') {
    return new Response('ok\n');
  }

  if (url.pathname === '/sentinel') {
    Sentry.captureMessage('sentinel');
    return new Response('sentinel\n');
  }

  return new Response('hello\n');
}

export default Sentry.withSentry(
  (env: Env) => ({
    dsn: 'https://public@example.invalid/1',
    tunnel: `http://127.0.0.1:${env.SINK_PORT}/`,
    tracesSampleRate: 1.0,
    traceLifecycle: env.LIFECYCLE === 'stream' ? ('stream' as const) : ('static' as const),
    dataCollection: env.MODE === 'dcoff' ? { httpBodies: [] } : {},
    integrations:
      env.MODE === 'none' ? [Sentry.httpServerIntegration({ maxRequestBodySize: 'none' })] : [],
  }),
  {
    fetch(request: Request): Promise<Response> {
      return route(request);
    },
  },
);
