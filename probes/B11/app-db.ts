import './instrument';
import * as Sentry from '@sentry/bun';
import mysql from 'mysql';

const port = Number(process.env.PORT);

const connection = mysql.createConnection({
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  database: 'app',
});
connection.connect();

function injectionState() {
  const orchestrion = (globalThis as any).__SENTRY_ORCHESTRION__ ?? {};
  return {
    bundler: orchestrion.bundler ? [...orchestrion.bundler] : null,
    runtime: orchestrion.runtime ?? null,
    standalone: Bun.main.startsWith('/$bunfs/'),
  };
}

Bun.serve({
  port,
  routes: {
    '/injected': () => Response.json(injectionState()),
    '/db': async () => {
      const rows = await new Promise((resolve, reject) => {
        connection.query('SELECT * FROM users', (err: unknown, result: unknown) =>
          err ? reject(err) : resolve(result),
        );
      });
      return Response.json(rows);
    },
    '/sentinel': () => {
      Sentry.captureMessage('sentinel');
      return new Response('ok');
    },
  },
});

console.log(`db app listening ${port}`, JSON.stringify(injectionState()));
