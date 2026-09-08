import { httpServerHandler } from 'cloudflare:node';
import * as Sentry from '@sentry/cloudflare';
import express from 'express';
import mysql from 'mysql2/promise';
import mysqlLegacy from 'mysql';

const PORT = 8080;

function buildApp() {
  const app = express();

  app.get('/plain', (_req, res) => res.json({ ok: true }));

  app.get('/db', async (_req, res) => {
    const conn = await mysql.createConnection({
      host: '127.0.0.1', port: 3307, user: 'root', password: '', database: 'app', disableEval: true,
    });
    const [rows] = await conn.query('SELECT id, name FROM users');
    await conn.end();
    res.json({ rows });
  });

  app.get('/db-noeval-off', async (_req, res) => {
    try {
      const conn = await mysql.createConnection({
        host: '127.0.0.1', port: 3307, user: 'root', password: '', database: 'app',
      });
      const [rows] = await conn.query('SELECT id, name FROM users');
      await conn.end();
      res.json({ rows });
    } catch (e) {
      res.status(500).json({ err: `${e.name}: ${e.message}` });
    }
  });

  app.get('/db-legacy', async (_req, res) => {
    try {
      const conn = mysqlLegacy.createConnection({
        host: '127.0.0.1', port: 3307, user: 'root', password: '', database: 'app',
      });
      conn.on('error', () => {});
      const rows = await new Promise((resolve, reject) => {
        conn.query('SELECT id, name FROM users', (err, r) => {
          conn.end();
          err ? reject(err) : resolve(r);
        });
      });
      res.json({ rows });
    } catch (e) {
      res.status(500).json({ err: `${e.name}: ${e.message}` });
    }
  });

  app.get('/users/:id', (req, res) => res.json({ id: req.params.id }));

  app.get('/sentinel', (_req, res) => {
    Sentry.captureMessage('sentinel');
    res.json({ ok: true });
  });

  app.use((err, _req, res, _next) => {
    Sentry.captureException(err);
    res.status(500).json({ error: err.message });
  });

  return app;
}

let listening;
function ensureApp() {
  if (!listening) {
    const app = buildApp();
    listening = new Promise(resolve => app.listen(PORT, () => resolve()));
  }
  return listening;
}

const inner = httpServerHandler({ port: PORT });

export default Sentry.withSentry(
  env => ({
    dsn: 'https://public@example.com/1',
    tunnel: `http://127.0.0.1:${env.SINK_PORT}/`,
    tracesSampleRate: 1.0,
    traceLifecycle: env.LIFECYCLE || 'static',
    debug: true,
  }),
  {
    async fetch(request, env, ctx) {
      await ensureApp();
      return inner.fetch(request, env, ctx);
    },
  },
);
