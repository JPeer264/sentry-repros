import { httpServerHandler } from 'cloudflare:node';
import * as Sentry from '@sentry/cloudflare';
import express from 'express';
import mysql from 'mysql2/promise';

let app;
function buildApp() {
  const app = express();

app.get('/plain', (_req, res) => {
  res.json({ ok: true });
});

app.get('/users/:id', (_req, res) => {
  res.json({ id: _req.params.id });
});

app.get('/boom', () => {
  throw new Error('express-cf-boom');
});

app.get('/tagged', async (req, res) => {
  const tag = String(req.query.tag);
  Sentry.setTag('probe_tag', tag);
  await new Promise(r => setTimeout(r, Number(req.query.delay || 0)));
  Sentry.setTag('probe_tag2', tag);
  Sentry.captureException(new Error(`tagged-${tag}`));
  res.json({ tag, traceId: Sentry.getActiveSpan() ? Sentry.spanToJSON(Sentry.getActiveSpan()).trace_id : null });
});

app.get('/fetchout', async (_req, res) => {
  const r = await fetch('http://127.0.0.1:41339/recorder');
  res.json({ recorded: await r.json() });
});

app.get('/logit', (_req, res) => {
  Sentry.logger.info('express-cf-log', { where: 'route' });
  res.json({ logged: true });
});

app.get('/db', async (_req, res) => {
  try {
    const conn = await mysql.createConnection({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app', disableEval: true });
    const [rows] = await conn.query('SELECT id, name FROM users');
    await conn.end();
    res.json({ rows });
  } catch (e) {
    res.status(500).json({ dbError: String(e && e.stack || e) });
  }
});

app.get('/sentinel', (_req, res) => {
  Sentry.captureMessage('sentinel');
  res.json({ sentinel: true });
});

  return app;
}

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
    tunnel: 'http://127.0.0.1:41338/',
    tracesSampleRate: 1.0,
    traceLifecycle: 'stream',
    sendDefaultPii: true,
    debug: true,
  }),
  {
    async fetch(request, env, ctx) {
      await ensureApp();
      return inner.fetch(request, env, ctx);
    },
  },
);
