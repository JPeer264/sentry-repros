import '@sentry/deno/import';
import * as Sentry from '@sentry/deno';

// deno-lint-ignore no-explicit-any
const orch = () => JSON.stringify({ runtime: (globalThis as any).__SENTRY_ORCHESTRION__?.runtime ?? [] });

console.log(`ORCH_AFTER_IMPORT_HOOK=${orch()}`);

const sinkPort = Deno.env.get('SINK_PORT');
const appPort = Number(Deno.env.get('APP_PORT'));

Sentry.init({
  dsn: 'https://public@o0.ingest.sentry.io/1',
  tunnel: `http://127.0.0.1:${sinkPort}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: 'static',
  debug: Deno.env.get('SENTRY_DEBUG') === '1',
});

console.log(`MYSQL_RESOLVED=${import.meta.resolve('mysql')}`);
const mysql = (await import('mysql')).default;
console.log(`ORCH_AFTER_MYSQL_IMPORT=${orch()}`);

const connection = mysql.createConnection({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app' });

function query(sql: string): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    connection.query(sql, (err: unknown, rows: unknown[]) => (err ? reject(err) : resolve(rows)));
  });
}

Deno.serve({ port: appPort, hostname: '127.0.0.1', onListen: () => console.log(`APP_READY ${appPort}`) }, async req => {
  const path = new URL(req.url).pathname;
  if (path === '/db') {
    const rows = await query('SELECT id, name FROM users');
    return Response.json({ rows });
  }
  if (path === '/orch') {
    return new Response(JSON.stringify({ orchestrion: JSON.parse(orch()), deno: Deno.version.deno }), {
      headers: { 'content-type': 'application/json' },
    });
  }
  if (path === '/sentinel') {
    Sentry.captureMessage('sentinel');
    await Sentry.flush(2000);
    return new Response('ok');
  }
  return new Response('not found', { status: 404 });
});
