import * as Sentry from '@sentry/solidstart';
import dc from 'node:diagnostics_channel';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app', connectionLimit: 2 });

let published = 0;
dc.tracingChannel('mysql2:query').start.subscribe(() => { published++; });

export async function GET() {
  const active = !!Sentry.getActiveSpan();
  const before = published;
  const rows = await Sentry.startSpan({ name: 'manual-wrap' }, async () => {
    const inner = !!Sentry.getActiveSpan();
    const [r] = await pool.query('SELECT id, name FROM users');
    return { r, inner };
  });
  return new Response(JSON.stringify({ activeSpanAtHandler: active, innerActive: rows.inner, publishedDelta: published - before, n: (rows.r as unknown[]).length }), { headers: { 'content-type': 'application/json' } });
}
