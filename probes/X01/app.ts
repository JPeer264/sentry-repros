import { Hono } from 'hono';
import * as Sentry from '@sentry/hono/bun';
import { sentry } from '@sentry/hono/bun';

const app = new Hono();

app.use(
  '*',
  sentry(app, {
    dsn: 'https://abc123@o0.ingest.sentry.io/1',
    tunnel: process.env.SINK,
    tracesSampleRate: 1.0,
    debug: !!process.env.SENTRY_DEBUG,
  }),
);

app.get('/hello/:name', c => c.text(`hello ${c.req.param('name')}`));

app.get('/error', () => {
  throw new Error('hono route error');
});

const sub = new Hono();
sub.get('/item/:id', c => c.text(`item ${c.req.param('id')}`));
sub.get('/boom', () => {
  throw new Error('sub-app error');
});
app.route('/sub', sub);

app.get('/sentinel', c => {
  Sentry.captureMessage('sentinel');
  return c.text('ok');
});

export default {
  port: Number(process.env.PORT),
  fetch: app.fetch,
};
