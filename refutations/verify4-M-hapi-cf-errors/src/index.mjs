import * as Sentry from '@sentry/cloudflare';
import { attachHapiErrorHandler } from '@sentry/server-utils';
import Hapi from '@hapi/hapi';
import { httpServerHandler } from 'cloudflare:node';

const SINK = 'http://127.0.0.1:51447';

// Module-scope trace so we can read it back on a LATER request, which survives
// the request I/O context being torn down (console.log there is dropped).
const trace = [];
const push = (what, extra) => trace.push({ t: Date.now(), what, extra });

const server = Hapi.server({ port: 8080, host: '0.0.0.0' });

function registerRoutes() {
  server.route({ method: 'GET', path: '/ok', handler: () => ({ ok: true }) });

  server.route({
    method: 'GET',
    path: '/throw/{id}',
    handler: req => {
      push('handler-throw', req.params.id);
      throw new Error(`v4-hapi-throw-${req.params.id}`);
    },
  });

  server.route({
    method: 'GET',
    path: '/dump',
    handler: () => {
      const out = trace.slice();
      trace.length = 0;
      return { trace: out };
    },
  });

  server.route({
    method: 'GET',
    path: '/sentinel/{n}',
    handler: req => {
      Sentry.captureMessage(`sentinel-${req.params.n}`);
      return { ok: true };
    },
  });

  server.ext('onPreResponse', (request, h) => {
    push('ext-onPreResponse', `${request.path} boom=${!!request.response?.isBoom}`);
    return h.continue;
  });

  server.ext('onPostResponse', (request, h) => {
    push('ext-onPostResponse', request.path);
    return h.continue;
  });
}

let started;
function ensureStarted() {
  started ??= (async () => {
    registerRoutes();
    server.events.on('response', req => push('podium-response', req.path));
    server.events.on({ name: 'request', channels: ['error'] }, (req, ev) =>
      push('podium-request-error', ev?.error?.message),
    );
    server.events.on({ name: 'request', channels: ['internal'] }, (req, ev) =>
      push('podium-request-internal', `${ev?.tags} ${ev?.error?.message ?? ''}`),
    );
    attachHapiErrorHandler(server);
    await server.start();
    push('started', `sentryState=${!!server.events.__SENTRY_HAPI_ERROR_HANDLER_STATE__}`);
  })();
  return started;
}

const nodeHandler = httpServerHandler({ port: 8080 });

// DRAIN=1 buffers the node response body inside the request I/O context so the
// node res stream closes and hapi's _finalize runs before the fetch resolves.
export default Sentry.withSentry(
  env => ({
    dsn: 'https://public@example.invalid/1',
    tunnel: `${SINK}/`,
    tracesSampleRate: 1.0,
    traceLifecycle: env.SENTRY_LIFECYCLE ?? 'static',
    debug: false,
  }),
  {
    async fetch(request, env, ctx) {
      await ensureStarted();
      const res = await nodeHandler.fetch(request, env, ctx);
      if (env.DRAIN === '1') {
        const buf = await res.arrayBuffer();
        await new Promise(r => setTimeout(r, 0));
        return new Response(buf, { status: res.status, headers: res.headers });
      }
      return res;
    },
  },
);
