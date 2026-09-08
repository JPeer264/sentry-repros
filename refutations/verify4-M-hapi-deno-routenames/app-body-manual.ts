import Hapi from '@hapi/hapi';
import mysql from 'mysql';
import * as Sentry from '@sentry/deno';

const connection = mysql.createConnection({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app' });

const port = Number(Deno.env.get('APP_PORT'));
const server = Hapi.server({ port, host: '127.0.0.1' });

server.ext('onPreHandler', (request: any, h: any) => {
  const active = Sentry.getActiveSpan();
  console.log('ONPREHANDLER activeSpan=', !!active, 'route=', request.route?.path);
  if (active) {
    const root = Sentry.getRootSpan(active);
    root.updateName(`${request.method.toUpperCase()} ${request.route.path}`);
    root.setAttribute('sentry.source', 'route');
    root.setAttribute('http.route', request.route.path);
  }
  return h.continue;
});

server.route({ method: 'GET', path: '/users/{id}', handler: (request: any) => ({ id: request.params.id }) });
server.route({ method: 'GET', path: '/error', handler: () => { throw new Error('hapi route error'); } });
server.route({
  method: 'GET',
  path: '/db',
  handler: () =>
    new Promise((resolve, reject) => {
      connection.query('SELECT * FROM users', (err: unknown, rows: unknown) => (err ? reject(err) : resolve({ rows })));
    }),
});
server.route({ method: 'GET', path: '/sentinel', handler: () => { Sentry.captureMessage('sentinel'); return { ok: true }; } });

await server.start();
console.log('LISTENING', server.info.uri);
