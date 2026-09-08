import './instrument.mjs';
import * as Sentry from '@sentry/bun';
import Fastify from 'fastify';
import mysql from 'mysql';

// Module scope on purpose: a driver first loaded inside a request gets no spans on Bun (finding K11).
const db = mysql.createConnection({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app' });

const PORT = Number(process.env.PORT || 47313);
const REC_PORT = Number(process.env.REC_PORT || 47312);

const app = Fastify();

app.get('/users/:id', async request => {
  return { id: request.params.id, name: 'ok' };
});

app.get('/error', async () => {
  throw new Error('fastify boom');
});

app.get('/iso', async request => {
  const n = Number(request.query.n || 1);
  Sentry.setTag('reqtag', String(n));
  await new Promise(r => setTimeout(r, 50 * n));
  Sentry.captureException(new Error(`iso ${n}`));
  return { n };
});

app.get('/downstream', async () => {
  const res = await fetch(`http://127.0.0.1:${REC_PORT}/hit`);
  return { downstream: res.status };
});

app.get('/db', async () => {
  const rows = await new Promise((resolve, reject) => {
    db.query('SELECT id, name FROM users', (err, result) => (err ? reject(err) : resolve(result)));
  });
  return { rows: rows.length };
});

app.get('/log', async () => {
  Sentry.logger.info('hello from fastify on bun', { route: '/log' });
  return { logged: true };
});

app.get('/sentinel', async () => {
  Sentry.captureMessage('sentinel');
  return { sentinel: true };
});

await app.listen({ port: PORT, host: '127.0.0.1' });
console.log(`fastify listening ${PORT}`);
