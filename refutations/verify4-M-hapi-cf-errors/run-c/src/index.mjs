import * as Sentry from '@sentry/cloudflare';
import { hapiIntegration } from '@sentry/server-utils';
import Hapi from '@hapi/hapi';
import { httpServerHandler } from 'cloudflare:node';
import { ServerResponse } from 'node:http';

const SINK = 'http://127.0.0.1:51447';

let emitPatched = false;
function applyEmitFix() {
  if (emitPatched) return;
  emitPatched = true;
  const origEmit = ServerResponse.prototype.emit;
  ServerResponse.prototype.emit = function (event, ...args) {
    if (event === 'close' && !this.writableEnded && !this.destroyed) {
      this.once('finish', () => origEmit.call(this, 'close', ...args));
      return true;
    }
    return origEmit.call(this, event, ...args);
  };
}

const server = Hapi.server({ port: 8080, host: '0.0.0.0' });

function registerRoutes() {
  server.route({ method: 'GET', path: '/ok', handler: () => ({ ok: true }) });
  server.route({
    method: 'GET',
    path: '/throw/{id}',
    handler: req => {
      throw new Error(`v4c-hapi-throw-${req.params.id}`);
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
}

let started;
function ensureStarted(fix) {
  started ??= (async () => {
    if (fix === 'emit') applyEmitFix();
    registerRoutes();
    await server.start();
    console.log('started sentryState=', !!server.events.__SENTRY_HAPI_ERROR_HANDLER_STATE__);
  })();
  return started;
}

const nodeHandler = httpServerHandler({ port: 8080 });

export default Sentry.withSentry(
  env => ({
    dsn: 'https://public@example.invalid/1',
    tunnel: `${SINK}/`,
    tracesSampleRate: 1.0,
    traceLifecycle: env.SENTRY_LIFECYCLE ?? 'static',
    integrations: [hapiIntegration()],
  }),
  {
    async fetch(request, env, ctx) {
      await ensureStarted(env.FIX ?? 'none');
      return nodeHandler.fetch(request, env, ctx);
    },
  },
);
