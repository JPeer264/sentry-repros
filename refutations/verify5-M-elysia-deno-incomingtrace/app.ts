const MODE = Deno.env.get('MODE') || 'A';
const LIFECYCLE = (Deno.env.get('LIFECYCLE') || 'stream') as 'stream' | 'static';
const SINK = Deno.env.get('SINK')!;
const ECHO = Deno.env.get('ECHO')!;
const PORT = Number(Deno.env.get('PORT'));

const common = {
  dsn: 'https://public@example.com/1',
  tunnel: SINK,
  tracesSampleRate: 1.0,
  traceLifecycle: LIFECYCLE,
  debug: Deno.env.get('SDK_DEBUG') === '1',
};

let Sentry: any;
let withElysia: any;

if (MODE === 'A') {
  Sentry = await import('@sentry/elysia');
  withElysia = Sentry.withElysia;
  Sentry.init(common);
} else {
  Sentry = await import('@sentry/deno');
  Sentry.init(common);
  withElysia = (await import('./node_modules/@sentry/elysia/build/esm/withElysia.js')).withElysia;
}

const { Elysia } = await import('elysia');

const app = withElysia(new Elysia())
  .get('/hello/:id', (ctx: any) => ({ ok: true, id: ctx.params.id }))
  .get('/down', async () => {
    const r = await fetch(ECHO + '/echo');
    return await r.json();
  })
  .get('/sentinel', () => {
    Sentry.captureMessage('sentinel');
    return 'ok';
  });

Deno.serve({ port: PORT, hostname: '127.0.0.1' }, app.fetch);
console.log('app ready mode=' + MODE + ' lifecycle=' + LIFECYCLE);
