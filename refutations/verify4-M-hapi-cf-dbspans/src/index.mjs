import * as Sentry from '@sentry/cloudflare';
import Hapi from '@hapi/hapi';
import mysql from 'mysql';
import { httpServerHandler } from 'cloudflare:node';

const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  database: 'app',
  connectionLimit: 2,
});

const server = Hapi.server({ port: 8080, host: '0.0.0.0' });

function registerRoutes() {
  server.route({ method: 'GET', path: '/ok', handler: () => ({ ok: true }) });
  server.route({
    method: 'GET',
    path: '/db',
    handler: async () => {
      const rows = await new Promise((resolve, reject) => {
        pool.query('SELECT id, name FROM users', (err, res) => (err ? reject(err) : resolve(res)));
      });
      return { rows };
    },
  });
  server.route({
    method: 'GET',
    path: '/sentinel',
    handler: () => {
      Sentry.captureMessage('verify4-sentinel');
      return { ok: true };
    },
  });
}

let started;
const nodeHandler = httpServerHandler({ port: 8080 });

export default Sentry.withSentry(
  () => ({
    dsn: 'https://public@example.com/1',
    tunnel: 'http://127.0.0.1:43217/',
    tracesSampleRate: 1.0,
    traceLifecycle: 'static',
  }),
  {
    async fetch(request, env, ctx) {
      started ??= (async () => {
        registerRoutes();
        await server.start();
      })();
      await started;
      return nodeHandler.fetch(request, env, ctx);
    },
  },
);
