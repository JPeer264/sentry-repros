import { httpServerHandler } from 'cloudflare:node';
import * as Sentry from '@sentry/cloudflare';
import express from 'express';
import mysql from 'mysql2/promise';

const PORT = 8081;
const app = express();

app.get('/db', async (_req, res) => {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'root',
    password: '',
    database: 'app',
    disableEval: true,
  });
  const [rows] = await conn.query('SELECT id, name FROM users');
  await conn.end();
  res.json({ rows });
});

app.get('/db-noeval', async (_req, res) => {
  try {
    const conn = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3307,
      user: 'root',
      password: '',
      database: 'app',
    });
    const [rows] = await conn.query('SELECT id, name FROM users');
    await conn.end();
    res.json({ rows });
  } catch (e) {
    res.status(500).json({ err: String(e) });
  }
});

app.get('/sentinel', (_req, res) => {
  Sentry.captureMessage('sentinel');
  res.json({ ok: true });
});

app.listen(PORT);

export default Sentry.withSentry(
  env => ({
    dsn: 'https://public@example.com/1',
    tunnel: `http://127.0.0.1:${env.SINK_PORT}/`,
    tracesSampleRate: 1.0,
    traceLifecycle: env.LIFECYCLE || 'static',
    debug: true,
  }),
  httpServerHandler({ port: PORT }),
);
