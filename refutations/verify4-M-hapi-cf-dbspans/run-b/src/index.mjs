import * as Sentry from '@sentry/cloudflare';
import Hapi from '@hapi/hapi';
import mysql from 'mysql';
import mysql2 from 'mysql2';
import { httpServerHandler } from 'cloudflare:node';

const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  database: 'app',
  connectionLimit: 2,
});

const pool2 = mysql2.createPool({
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  database: 'app',
  connectionLimit: 2,
  disableEval: true,
});

const pool2Eval = mysql2.createPool({
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
    path: '/db/{id}',
    handler: async () => {
      const rows = await new Promise((resolve, reject) => {
        pool.query('SELECT id, name FROM users', (err, res) => (err ? reject(err) : resolve(res)));
      });
      return { rows };
    },
  });
  server.route({
    method: 'GET',
    path: '/db2/{id}',
    handler: async () => {
      const [rows] = await pool2.promise().query('SELECT id, name FROM users');
      return { rows };
    },
  });
  server.route({
    method: 'GET',
    path: '/db2-eval/{id}',
    handler: async () => {
      try {
        const [rows] = await pool2Eval.promise().query('SELECT id, name FROM users');
        return { rows };
      } catch (e) {
        return { error: String(e && e.message) };
      }
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
    debug: true,
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
