import '@sentry/deno/import';
import * as Sentry from '@sentry/deno';

const APP_PORT = Number(Deno.env.get('APP_PORT'));
const SINK_PORT = Number(Deno.env.get('SINK_PORT'));

Sentry.init({
  dsn: 'https://public@example.invalid/1',
  tunnel: `http://127.0.0.1:${SINK_PORT}/`,
  tracesSampleRate: 1.0,
  sendDefaultPii: true,
  release: 'd03@1.0.0',
  environment: 'd03-env',
});

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

Deno.serve({ port: APP_PORT, hostname: '127.0.0.1' }, async (request: Request) => {
  const url = new URL(request.url);

  if (url.pathname === '/a') {
    const tag = url.searchParams.get('tag') ?? 'none';
    Sentry.setTag('reqtag', tag);
    Sentry.getActiveSpan()?.setAttribute('reqtag', tag);

    // Interleave the five in-flight requests so a shared scope would leak here.
    await delay(50 + Math.floor(Math.random() * 100));

    Sentry.captureException(new Error(`boom ${tag}`));
    return new Response(`ok ${tag}\n`, { status: 200 });
  }

  if (url.pathname === '/sentinel') {
    Sentry.captureMessage(`sentinel ${url.searchParams.get('n') ?? '1'}`);
    return new Response('sentinel\n', { status: 200 });
  }

  return new Response('not found\n', { status: 404 });
});
