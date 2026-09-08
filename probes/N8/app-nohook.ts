import * as Sentry from '@sentry/deno';
import mysql from 'mysql';

const SINK = Deno.env.get('SINK') ?? 'http://127.0.0.1:39147/';
const MYSQL_PORT = Number(Deno.env.get('MYSQL_PORT') ?? '3307');

const WORKER = crypto.randomUUID().slice(0, 8);

Sentry.init({
  dsn: 'https://public@example.invalid/1',
  tunnel: SINK,
  tracesSampleRate: 1.0,
  sendDefaultPii: true,
});
Sentry.setTag('worker', WORKER);
console.log(`INIT worker=${WORKER} pid=${Deno.pid}`);

const connection = mysql.createConnection({ host: '127.0.0.1', port: MYSQL_PORT, user: 'root', database: 'app' });
console.log(`MYSQL-MODULE-SCOPE worker=${WORKER}`);

function query(sql: string): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    connection.query(sql, (err: unknown, rows: unknown[]) => (err ? reject(err) : resolve(rows)));
  });
}

export async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === '/db') {
    const rows = await query('SELECT id, name FROM users');
    return Response.json({ worker: WORKER, rows });
  }

  if (url.pathname === '/tag') {
    const id = url.searchParams.get('id') ?? 'none';
    Sentry.setTag('req', id);
    Sentry.captureMessage(`tagged:${id}`);
    return Response.json({ worker: WORKER, id });
  }

  if (url.pathname === '/boom') {
    throw new Error('serve boom');
  }

  if (url.pathname === '/sentinel') {
    Sentry.captureMessage(`sentinel:${WORKER}`);
    return Response.json({ worker: WORKER });
  }

  return Response.json({ worker: WORKER, ok: true });
}
