import * as Sentry from '@sentry/cloudflare';
import { withElysia } from '@sentry/elysia';
import { Elysia } from 'elysia';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  password: '',
  database: 'app',
  disableEval: true,
});

const app = withElysia(new Elysia({ aot: false }))
  .get('/plain', () => ({ ok: true }))
  .get('/users/:id', ({ params }: any) => ({ id: params.id }))
  .get('/db', async () => {
    const [rows] = await pool.query('SELECT id, name FROM users');
    return { rows };
  })
  .get('/sentinel', () => {
    Sentry.captureMessage('sentinel');
    return { ok: true };
  });

export default Sentry.withSentry(
  (env: any) => ({
    dsn: 'https://public@example.com/1',
    tunnel: `http://127.0.0.1:${env.SINK_PORT}/`,
    tracesSampleRate: 1.0,
    traceLifecycle: env.TRACE_LIFECYCLE,
    debug: true,
  }),
  {
    fetch: (request: Request) => app.fetch(request),
  } as ExportedHandler,
);
