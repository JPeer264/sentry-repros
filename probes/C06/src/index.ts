import * as Sentry from '@sentry/cloudflare';

interface Env {
  DB: D1Database;
  SENTRY_TUNNEL?: string;
  TRACE_LIFECYCLE?: string;
}

export default Sentry.withSentry(
  (env: Env) => ({
    dsn: 'https://public@example.invalid/1',
    tunnel: env.SENTRY_TUNNEL ?? 'http://127.0.0.1:41337/',
    tracesSampleRate: 1.0,
    traceLifecycle: env.TRACE_LIFECYCLE === 'static' ? 'static' : 'stream',
  }),
  {
    async fetch(request: Request, env: Env): Promise<Response> {
      const url = new URL(request.url);

      if (url.pathname === '/d1') {
        await env.DB.exec('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)');

        await env.DB.prepare('INSERT INTO users (name) VALUES (?)').bind('alice').run();

        const all = await env.DB.prepare('SELECT id, name FROM users WHERE name = ?').bind('alice').all();

        const first = await env.DB.prepare('SELECT COUNT(*) AS n FROM users').first();

        await env.DB.batch([
          env.DB.prepare('INSERT INTO users (name) VALUES (?)').bind('bob'),
          env.DB.prepare('SELECT name FROM users WHERE name = ?').bind('bob'),
        ]);

        return Response.json({ all: all.results.length, first });
      }

      if (url.pathname === '/sentinel') {
        Sentry.captureMessage('sentinel');
        return new Response('sentinel');
      }

      return new Response('ok');
    },
  },
);
