import * as Sentry from '@sentry/hono/cloudflare';
import { sentry } from '@sentry/hono/cloudflare';
import { Hono } from 'hono';

type Bindings = {
  SENTRY_DSN: string;
  SENTRY_TUNNEL: string;
  API_PORT: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  sentry(app, env => ({
    dsn: env.SENTRY_DSN,
    tunnel: env.SENTRY_TUNNEL,
    tracesSampleRate: 1,
  })),
);

app.get('/user/:id', c => c.json({ id: c.req.param('id') }));

app.get('/error', () => {
  throw new Error('boom from /error');
});

app.get('/downstream', async c => {
  const res = await fetch(`http://127.0.0.1:${c.env.API_PORT}/api`);
  return c.text(await res.text());
});

app.get('/sentinel', c => {
  Sentry.captureMessage('sentinel');
  return c.text('sentinel');
});

export default app;
