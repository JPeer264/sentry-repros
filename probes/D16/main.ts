import '@sentry/deno/import';
import * as Sentry from '@sentry/deno';
// @ts-types="./mysql.d.ts"
import mysql from 'mysql';

const APP_PORT = Number(Deno.env.get('APP_PORT'));
const SINK_PORT = Number(Deno.env.get('SINK_PORT'));

Sentry.init({
  dsn: 'https://public@example.invalid/1',
  tunnel: `http://127.0.0.1:${SINK_PORT}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: 'static',
  release: 'd16@1.0.0',
  environment: 'd16-env',
});

const connection = mysql.createConnection({
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  database: 'app',
});
connection.connect();

console.log(
  'injected at startup:',
  JSON.stringify((globalThis as Record<string, unknown>).__SENTRY_ORCHESTRION__),
);

function query(sql: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    connection.query(sql, (err: unknown, rows: unknown) => (err ? reject(err) : resolve(rows)));
  });
}

Deno.serve({ port: APP_PORT, hostname: '127.0.0.1' }, async (request: Request) => {
  const url = new URL(request.url);

  if (url.pathname === '/db') {
    const rows = (await query('SELECT * FROM users')) as Array<{ id: number; name: string }>;
    return new Response(`${JSON.stringify(rows.map(r => r.name))}\n`, { status: 200 });
  }

  if (url.pathname === '/error') {
    throw new Error('route boom');
  }

  if (url.pathname === '/log') {
    Sentry.logger.info('hello from deno');
    return new Response('logged\n', { status: 200 });
  }

  if (url.pathname === '/sentinel') {
    Sentry.captureMessage(`sentinel ${url.searchParams.get('n') ?? '1'}`);
    return new Response('sentinel\n', { status: 200 });
  }

  return new Response('not found\n', { status: 404 });
});
