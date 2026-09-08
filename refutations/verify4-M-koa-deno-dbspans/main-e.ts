import './instrument.ts';
import { makeApp } from './koa-app.ts';
import { makeQueryConn } from './mkquery-conn.ts';

await import('@sentry/deno/import');
const mysql = (await import('mysql')).default;

const port = Number(Deno.env.get('PORT'));
makeApp(makeQueryConn(mysql)).listen(port, () => console.log('listening', port));
