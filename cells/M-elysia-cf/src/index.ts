import * as Sentry from '@sentry/cloudflare';
import { Elysia } from 'elysia';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  database: 'app',
  disableEval: true,
});

const app = new Elysia({ aot: false })
  .get('/', () => 'ok')
  .get('/users/:id', ({ params }) => ({ id: params.id }))
  .get('/error', () => {
    throw new Error('elysia-cf-boom');
  })
  .get('/iso/:tag', ({ params }) => {
    Sentry.setTag('reqtag', params.tag);
    Sentry.captureException(new Error(`iso-${params.tag}`));
    return { tag: params.tag };
  })
  .get('/fetch', async () => {
    const res = await fetch('http://127.0.0.1:52742/recorded');
    return { recorder: await res.text() };
  })
  .get('/db', async () => {
    const [rows] = await pool.query('SELECT * FROM users');
    return { rows };
  })
  .get('/log', () => {
    Sentry.logger.info('hello from elysia handler', { where: 'cf' });
    return 'logged';
  })
  .onError(({ error, code }) => {
    if (code !== 'NOT_FOUND') {
      Sentry.captureException(error, { mechanism: { type: 'elysia.onError', handled: false } });
    }
  })
  .get('/sentinel', () => {
    Sentry.captureMessage('sentinel');
    return 'sentinel';
  });

export default Sentry.withSentry(
  (env: any) => ({
    dsn: 'https://public@example.invalid/1',
    tunnel: 'http://127.0.0.1:52745/',
    tracesSampleRate: 1.0,
    traceLifecycle: (env.TRACE_LIFECYCLE as 'static' | 'stream') || 'static',
    debug: true,
    sendDefaultPii: true,
  }),
  {
    fetch: (request: Request, _env: unknown, _ctx: ExecutionContext) => app.fetch(request),
  } satisfies ExportedHandler,
);
