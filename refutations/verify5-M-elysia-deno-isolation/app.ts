const WIRING = Deno.env.get('WIRING') || 'A';
const LIFECYCLE = Deno.env.get('LIFECYCLE') || 'stream';
const PORT = Number(Deno.env.get('APP_PORT'));
const SINK = Deno.env.get('SINK_URL');

let Sentry: any;
let withElysia: any;

if (WIRING === 'A') {
  Sentry = await import('@sentry/elysia');
  withElysia = Sentry.withElysia;
} else if (WIRING === 'B') {
  Sentry = await import('@sentry/deno');
  withElysia = (await import('./node_modules/@sentry/elysia/build/esm/withElysia.js')).withElysia;
} else if (WIRING === 'B2') {
  Sentry = await import('@sentry/deno');
  withElysia = (await import('@sentry/elysia/build/esm/withElysia.js')).withElysia;
} else if (WIRING === 'C') {
  Sentry = await import('@sentry/deno');
  withElysia = (await import('@sentry/elysia')).withElysia;
}

Sentry.init({
  dsn: 'https://abc@o1.ingest.sentry.io/1',
  tunnel: SINK,
  tracesSampleRate: 1.0,
  traceLifecycle: LIFECYCLE,
  debug: false,
});

const { Elysia } = await import('elysia');

const app = withElysia(new Elysia())
  .get('/tag/:t', async ({ params }: any) => {
    Sentry.setTag('reqtag', params.t);
    await new Promise(r => setTimeout(r, 300));
    Sentry.captureMessage(`tagged-${params.t}`);
    return { ok: params.t };
  })
  .get('/sentinel', () => {
    Sentry.captureMessage('sentinel');
    return { ok: 'sentinel' };
  });

Deno.serve({ port: PORT, onListen: () => console.log(`APP READY ${PORT} wiring=${WIRING} lifecycle=${LIFECYCLE}`) }, app.fetch);
