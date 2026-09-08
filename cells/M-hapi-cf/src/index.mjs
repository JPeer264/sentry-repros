import * as Sentry from '@sentry/cloudflare';
import { hapiIntegration } from '@sentry/server-utils';
import Hapi from '@hapi/hapi';
import { httpServerHandler } from 'cloudflare:node';
import mysql from 'mysql';

const SINK = 'http://127.0.0.1:41778';

let pool;
try {
  pool = mysql.createPool({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app', connectionLimit: 2 });
} catch (e) {
  console.log('mysql pool create failed', e && e.message);
}

const server = Hapi.server({ port: 8080, host: '0.0.0.0' });

function registerRoutes() {

server.route({ method: 'GET', path: '/ok', handler: () => ({ ok: true }) });

server.route({ method: 'GET', path: '/users/{id}', handler: req => ({ id: req.params.id }) });

server.route({
  method: 'GET',
  path: '/error/{id}',
  handler: () => {
    throw new Error('hapi-cf-route-boom');
  },
});

server.route({
  method: 'GET',
  path: '/error-ext/{id}',
  handler: () => {
    throw new Error('hapi-cf-ext-boom');
  },
});

server.route({
  method: 'GET',
  path: '/isolate/{tag}',
  handler: async req => {
    const tag = req.params.tag;
    Sentry.setTag('req_tag', tag);
    await new Promise(r => setTimeout(r, 50 + Math.floor(Math.random() * 50)));
    Sentry.captureException(new Error(`iso-${tag}`));
    return { tag };
  },
});

server.route({
  method: 'GET',
  path: '/fetch',
  handler: async () => {
    const res = await fetch(`${SINK}/__record?from=hapi-cf`);
    return { downstream: await res.json() };
  },
});

server.route({
  method: 'GET',
  path: '/db',
  handler: async () => {
    try {
      const rows = await new Promise((resolve, reject) => {
        pool.query('SELECT id, name FROM users', (err, res) => (err ? reject(err) : resolve(res)));
      });
      return { rows };
    } catch (e) {
      return { dberror: String(e && e.message) };
    }
  },
});

server.route({
  method: 'GET',
  path: '/log',
  handler: () => {
    Sentry.logger.info('hapi-cf-log-from-handler', { where: 'handler' });
    return { logged: true };
  },
});

server.route({
  method: 'GET',
  path: '/sentinel',
  handler: () => {
    Sentry.captureMessage('sentinel');
    return { sentinel: true };
  },
});

server.ext('onPreResponse', (request, h) => {
  const r = request.response;
  if (request.path.startsWith('/error-ext') && r && r.isBoom) {
    Sentry.captureException(r, { mechanism: { type: 'hapi.onPreResponse', handled: false } });
  }
  return h.continue;
});

}

let started;
function ensureStarted() {
  if (!started) {
    started = (async () => {
      registerRoutes();
      server.events.on({ name: 'request', channels: ['error'] }, (req, ev) => {
        console.log('APP hapi request-error event fired:', ev && ev.error && ev.error.message);
      });
      await server.start();
      console.log('APP started; sentry error handler attached =', !!server.events['__SENTRY_HAPI_ERROR_HANDLER_STATE__']);
    })();
  }
  return started;
}

const nodeHandler = httpServerHandler({ port: 8080 });

export default Sentry.withSentry(
  env => ({
    dsn: 'https://public@example.invalid/1',
    tunnel: `${SINK}/`,
    tracesSampleRate: 1.0,
    traceLifecycle: env.SENTRY_LIFECYCLE ?? 'static',
    debug: true,
    integrations: [hapiIntegration()],
  }),
  {
    async fetch(request, env, ctx) {
      await ensureStarted();
      return nodeHandler.fetch(request, env, ctx);
    },
  },
);
