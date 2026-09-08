import '@sentry/deno/import';
import { Hono } from 'hono';
import * as Sentry from '@sentry/hono/deno';
import { sentry } from '@sentry/hono/deno';
import http from 'node:http';
import { denoFetchIntegration } from './fetch-integration.ts';

const SINK = Deno.env.get('SINK_PORT') ?? '41317';
const PORT = Number(Deno.env.get('APP_PORT') ?? '41318');
const LIFECYCLE = (Deno.env.get('LIFECYCLE') ?? 'static') as 'static' | 'stream';
const REC = `http://127.0.0.1:${SINK}/rec`;

const app = new Hono();

app.use(
  '*',
  sentry(app, {
    dsn: 'https://public@example.com/1',
    tunnel: `http://127.0.0.1:${SINK}/`,
    tracesSampleRate: 1.0,
    traceLifecycle: LIFECYCLE,
    debug: Deno.env.get('SENTRY_DEBUG') === '1',
    integrations: [denoFetchIntegration()],
  }),
);

app.get('/downstream', async c => {
  const r = await fetch(`${REC}/downstream-fetch`);
  await r.text();
  return c.json({ ok: true });
});

app.get('/downstream-http', async c => {
  await new Promise<void>(resolve => {
    http.get(`${REC}/downstream-http`, res => {
      res.resume();
      res.on('end', () => resolve());
    });
  });
  return c.json({ ok: true });
});

app.get('/sentinel', c => {
  Sentry.captureMessage('sentinel');
  return c.json({ ok: true });
});

Deno.serve({ port: PORT, hostname: '127.0.0.1' }, app.fetch);
