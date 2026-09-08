// Koa's whole module graph loads BEFORE the orchestrion hook is registered,
// so its `require('*.json')` calls never go through Deno's module hooks.
import { makeApp } from './koa-app.ts';
import { makeQuery } from './mkquery.ts';
import './instrument.ts';

await import('@sentry/deno/import');
const mysql = (await import('mysql')).default;

const port = Number(Deno.env.get('PORT'));
makeApp(makeQuery(mysql)).listen(port, () => console.log('listening', port));
