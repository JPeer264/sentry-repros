import * as Sentry from '@sentry/cloudflare';
import { attachHapiErrorHandler } from '@sentry/server-utils';
import Hapi from '@hapi/hapi';
import { httpServerHandler } from 'cloudflare:node';
import { ServerResponse } from 'node:http';

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

const SINK = 'http://127.0.0.1:51447';

const trace = [];
const push = (what, extra) => trace.push(`${what} ${extra ?? ''}`);

const server = Hapi.server({ port: 8080, host: '0.0.0.0' });

// workerd's node:http shim emits 'close' on the ServerResponse while
// writableEnded is still false. hapi's Request._listen close handler reads that
// as a client disconnect and nulls _eventContext.request, which skips the
// request/'error' podium emit that Sentry's hapi error handler listens on.
// Re-arming that one listener to run after 'finish' restores the normal path.
function deferPrematureClose(res) {
  const listeners = res.listeners('close');
  const harmful = listeners[0];
  if (!harmful) return listeners.length;
  res.removeListener('close', harmful);
  res.on('close', function (...args) {
    if (!res.writableEnded && !res.destroyed) {
      res.once('finish', () => harmful.apply(this, args));
      return;
    }
    harmful.apply(this, args);
  });
  return listeners.length;
}

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

  server.route({ method: 'GET', path: '/dump', handler: () => ({ trace: trace.slice() }) });

  server.route({
    method: 'GET',
    path: '/big',
    handler: () => ({ pad: 'x'.repeat(50000) }),
  });

  server.route({
    method: 'GET',
    path: '/sentinel/{n}',
    handler: req => {
      Sentry.captureMessage(`sentinel-${req.params.n}`);
      return { ok: true };
    },
  });

  server.ext('onRequest', (request, h) => {
    const res = request.raw.res;
    const n = globalThis.__FIX === 'listener' ? deferPrematureClose(res) : res.listeners('close').length;
    push('onRequest', `${request.path} closeListeners=${n} fix=${!!globalThis.__FIX}`);
    res.on('close', () => push('res-close', `writableEnded=${res.writableEnded}`));
    res.on('finish', () => push('res-finish'));
    return h.continue;
  });

  server.ext('onPreResponse', (request, h) => {
    const r = request.response;
    push('ext-onPreResponse', `${request.path} boom=${!!r?.isBoom} status=${r?.output?.statusCode ?? r?.statusCode}`);
    return h.continue;
  });
}

let started;
function ensureStarted() {
  started ??= (async () => {
    if (globalThis.__FIX === 'emit') applyEmitFix();
    registerRoutes();
    server.events.on('response', req => {
      const r = req.response;
      push('podium-response', `${req.path} boom=${!!r?.isBoom} status=${r?.output?.statusCode ?? r?.statusCode} hasClose=${typeof r?._close} hasError=${!!r?._error}`);
    });
    server.events.on({ name: 'request', channels: ['error'] }, (req, ev) => push('podium-request-ERROR', ev?.error?.message));
    attachHapiErrorHandler(server);
    await server.start();
    push('started', `sentryState=${!!server.events.__SENTRY_HAPI_ERROR_HANDLER_STATE__}`);
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
  }),
  {
    async fetch(request, env, ctx) {
      globalThis.__FIX = env.FIX ?? 'none';
      await ensureStarted();
      return nodeHandler.fetch(request, env, ctx);
    },
  },
);
