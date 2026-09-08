import Hapi from '@hapi/hapi';
import http from 'node:http';
import mysql from 'mysql';
import * as Sentry from '@sentry/deno';

const REC = Number(Deno.env.get('REC_PORT') ?? '43119');
const PORT = Number(Deno.env.get('APP_PORT') ?? '0');

const conn = mysql.createConnection({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app' });

const server = Hapi.server({ port: PORT, host: '127.0.0.1' });

server.route({
  method: 'GET',
  path: '/users/{id}',
  handler: (req: { params: { id: string } }) => ({ id: req.params.id }),
});

server.route({
  method: 'GET',
  path: '/error',
  handler: () => {
    throw new Error('hapi route boom');
  },
});

server.route({
  method: 'GET',
  path: '/db',
  handler: () =>
    new Promise(resolve => {
      conn.query('SELECT id, name FROM users', (err: unknown, rows: unknown) =>
        resolve(err ? { err: String(err) } : { rows }),
      );
    }),
});

server.route({
  method: 'GET',
  path: '/downstream',
  handler: async () => {
    const r = await fetch(`http://127.0.0.1:${REC}/api/downstream`);
    return { downstream: r.status };
  },
});

server.route({
  method: 'GET',
  path: '/downstream-http',
  handler: async () => {
    await new Promise<void>(resolve => {
      http.get(`http://127.0.0.1:${REC}/api/downstream-http`, res => {
        res.resume();
        res.on('end', () => resolve());
      });
    });
    return { ok: true };
  },
});

server.route({
  method: 'GET',
  path: '/log',
  handler: () => {
    Sentry.logger.info('hello from hapi on deno', { route: '/log' });
    return { logged: true };
  },
});

server.route({
  method: 'GET',
  path: '/iso/{tag}',
  handler: async (req: { params: { tag: string } }) => {
    const tag = req.params.tag;
    Sentry.setTag('probe', tag);
    await new Promise(r => setTimeout(r, 60 + Math.floor(Math.random() * 60)));
    Sentry.captureException(new Error(`iso ${tag}`));
    return { tag };
  },
});

server.route({
  method: 'GET',
  path: '/sentinel',
  handler: () => {
    Sentry.captureMessage('sentinel');
    return { sentinel: true };
  },
});

await server.start();
console.log('READY PORT=' + server.info.port);
