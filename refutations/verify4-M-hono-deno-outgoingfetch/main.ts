import '@sentry/deno/import';
import { Hono } from 'hono';
import { sentry } from '@sentry/hono/deno';
import * as Sentry from '@sentry/hono/deno';
import http from 'node:http';
import { denoFetchIntegration } from './fetch-integration.ts';
import { winterCGFetchIntegration } from '@sentry/vercel-edge';

const PORT = Number(Deno.env.get('APP_PORT'));
const REC = Deno.env.get('REC_BASE')!;
const TUNNEL = Deno.env.get('TUNNEL')!;
const LIFECYCLE = (Deno.env.get('LIFECYCLE') || 'static') as 'static' | 'stream';
const VARIANT = Deno.env.get('VARIANT') || 'baseline';

const app = new Hono();
app.use(
  '*',
  sentry(app, {
    dsn: 'https://public@example.com/1',
    tunnel: TUNNEL,
    tracesSampleRate: 1.0,
    traceLifecycle: LIFECYCLE,
    tracePropagationTargets: [/.*/],
    integrations:
      VARIANT === 'fetchfix' ? [denoFetchIntegration()] : VARIANT === 'wintercg' ? [winterCGFetchIntegration()] : undefined,
  }),
);

app.get('/downstream', async c => {
  const r = await fetch(`${REC}/rec/downstream-fetch`);
  return c.json({ ok: r.ok });
});

app.get('/downstream-req', async c => {
  const r = await fetch(new Request(`${REC}/rec/downstream-fetch-req`));
  return c.json({ ok: r.ok });
});

app.get('/downstream-span', async c => {
  const out = await Sentry.startSpan({ name: 'manual wrapper', op: 'function' }, async () => {
    const r = await fetch(`${REC}/rec/downstream-fetch-inspan`);
    return r.ok;
  });
  return c.json({ ok: out });
});

app.get('/downstream-http', c => {
  return new Promise(resolve => {
    http.get(`${REC}/rec/downstream-http`, res => {
      res.resume();
      res.on('end', () => resolve(c.json({ ok: true })));
    });
  });
});

app.get('/sentinel', c => {
  Sentry.captureMessage(`sentinel-${c.req.query('n')}`);
  return c.json({ ok: true });
});

Deno.serve({ port: PORT, hostname: '127.0.0.1' }, app.fetch);
