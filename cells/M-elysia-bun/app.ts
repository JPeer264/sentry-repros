import './instrument';
import * as Sentry from '@sentry/elysia';
import { Elysia } from 'elysia';
import mysql from 'mysql2/promise';

const SINK_PORT = process.env.SINK_PORT ?? '41999';
const APP_PORT = Number(process.env.APP_PORT ?? 41372);

const pool = mysql.createPool({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app' });

Sentry.withElysia(new Elysia())
  .get('/users/:id', ({ params }) => ({ id: params.id }))
  .get('/boom', () => {
    throw new Error('elysia-boom');
  })
  .get('/iso/:tag', async ({ params }) => {
    Sentry.setTag('reqtag', params.tag);
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
    Sentry.captureException(new Error(`iso-${params.tag}`));
    return { ok: params.tag };
  })
  .get('/fetchout', async () => {
    await fetch(`http://127.0.0.1:${SINK_PORT}/__rec?from=elysia`);
    return { ok: true };
  })
  .get('/db', async () => {
    const [rows] = await pool.query('SELECT id, name FROM users');
    return rows;
  })
  .get('/log', () => {
    Sentry.logger.info('elysia-log-line', { where: 'handler' });
    return { ok: true };
  })
  .get('/sentinel', () => {
    Sentry.captureMessage('sentinel');
    return { ok: true };
  })
  .listen(APP_PORT);

console.log(`app listening ${APP_PORT} lifecycle=${process.env.LIFECYCLE ?? 'stream'}`);
