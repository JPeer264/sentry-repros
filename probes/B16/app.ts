import './instrument';

import * as Sentry from '@sentry/bun';
import { Database } from 'bun:sqlite';
import { SQL, RedisClient } from 'bun';

const PORT = Number(process.env.PORT ?? 34118);
const REDIS_PORT = process.env.REDIS_PORT ?? '51847';

// Module scope on purpose: an in-request first load would hit known finding K11.
const sqlite = new Database(':memory:');
sqlite.run('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
sqlite.run("INSERT INTO users (id, name) VALUES (1, 'a'), (2, 'b')");

const sql = new SQL('mysql://root@127.0.0.1:3307/app');
const redis = new RedisClient(`redis://127.0.0.1:${REDIS_PORT}`);

Bun.serve({
  port: PORT,
  hostname: '127.0.0.1',
  routes: {
    '/sqlite': () => Response.json(sqlite.query('SELECT id, name FROM users').all()),
    '/sql': async () => Response.json(await sql`SELECT id, name FROM users`),
    '/redis': async () => {
      await redis.set('k', 'v');
      return Response.json({ v: await redis.get('k') });
    },
    '/sentinel': () => {
      Sentry.captureMessage('sentinel');
      return new Response('ok');
    },
  },
});

console.log(
  `PORT=${PORT} bun=${Bun.version} hasSQL=${typeof SQL} hasRedis=${typeof RedisClient}`,
);
