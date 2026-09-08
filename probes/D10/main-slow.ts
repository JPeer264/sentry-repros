import '@sentry/deno/import';
import * as Sentry from '@sentry/deno';

const APP_PORT = Number(Deno.env.get('APP_PORT'));
const SINK_PORT = Number(Deno.env.get('SINK_PORT'));
const CHUNK_MS = Number(Deno.env.get("CHUNK_MS") ?? "3000");

Sentry.init({
  dsn: 'https://public@example.invalid/1',
  tunnel: `http://127.0.0.1:${SINK_PORT}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: 'static',
  integrations: [Sentry.denoServeIntegration({ ignoreStatusCodes: [] })],
});

function stamp(): string {
  return new Date().toISOString().slice(11, 23);
}

function log(msg: string): void {
  console.log(`[app ${stamp()}] ${msg}`);
}

function chunkStream(label: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let timer: number | undefined;
  let n = 0;
  return new ReadableStream({
    start(controller) {
      timer = setInterval(() => {
        n++;
        controller.enqueue(encoder.encode(`chunk-${n}\n`));
        log(`${label}: enqueued chunk-${n}`);
        if (n === 3) {
          clearInterval(timer);
          controller.close();
          log(`${label}: closed`);
        }
      }, CHUNK_MS);
    },
    cancel(reason) {
      clearInterval(timer);
      log(`${label}: UPSTREAM CANCELLED reason=${reason}`);
    },
  });
}

Deno.serve({ port: APP_PORT, hostname: '127.0.0.1' }, (request: Request) => {
  const url = new URL(request.url);
  log(`${request.method} ${url.pathname}`);

  if (url.pathname === '/stream-plain') {
    return new Response(chunkStream('plain'), {
      status: 200,
      headers: { 'content-type': 'text/plain' },
    });
  }

  if (url.pathname === '/stream-sse') {
    return new Response(chunkStream('sse'), {
      status: 200,
      headers: { 'content-type': 'text/event-stream' },
    });
  }

  if (url.pathname === '/stream-octet') {
    return new Response(chunkStream('octet'), {
      status: 200,
      headers: { 'content-type': 'application/octet-stream' },
    });
  }

  if (url.pathname === '/sentinel') {
    Sentry.captureMessage('sentinel');
    return new Response('sentinel\n', { status: 200 });
  }

  return new Response('not found\n', { status: 404 });
});
