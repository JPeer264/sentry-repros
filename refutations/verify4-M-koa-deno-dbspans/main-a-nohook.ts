import './instrument.ts';
import { makeApp } from './koa-app.ts';
import { makeQuery } from './mkquery.ts';
import mysql from 'mysql';

const port = Number(Deno.env.get('PORT'));
makeApp(makeQuery(mysql)).listen(port, () => console.log('listening', port));
