import { httpServerHandler } from 'cloudflare:node';
import * as Sentry from '@sentry/cloudflare';
import express from 'express';
import mysql from 'mysql2/promise';

async function runQuery() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'root',
    database: 'app',
    disableEval: true,
  });
  const [rows] = await conn.query('SELECT id, name FROM users');
  await conn.end();
  return rows;
}

function buildApp() {
  const app = express();

  app.get('/db', async (_req, res) => {
    try {
      res.json({ rows: await runQuery() });
    } catch (e) {
      res.status(500).json({ dbError: String((e && e.stack) || e) });
    }
  });

  app.get('/sentinel', (_req, res) => {
    Sentry.captureMessage('sentinel');
    res.json({ sentinel: true });
  });

  return app;
}

let app;
let listening;
function ensureApp() {
  if (!listening) {
    app = buildApp();
    listening = new Promise(resolve => app.listen(8080, resolve));
  }
  return listening;
}

const inner = httpServerHandler({ port: 8080 });

export default Sentry.withSentry(
  () => ({
    dsn: 'https://public@example.invalid/1',
    tunnel: 'http://127.0.0.1:44821/',
    tracesSampleRate: 1.0,
    traceLifecycle: 'static',
    sendDefaultPii: true,
    debug: true,
  }),
  {
    async fetch(request, env, ctx) {
      // Bare /nodb-db path bypasses express entirely: same mysql2 query, no express in the stack.
      if (new URL(request.url).pathname === '/nodb-db') {
        try {
          return Response.json({ rows: await runQuery() });
        } catch (e) {
          return Response.json({ dbError: String((e && e.stack) || e) }, { status: 500 });
        }
      }
      await ensureApp();
      return inner.fetch(request, env, ctx);
    },
  },
);
