import '@sentry/deno/import';
import * as Sentry from '@sentry/deno';

const SINK_PORT = Deno.env.get('SINK_PORT') ?? '41337';
const SINK = `http://127.0.0.1:${SINK_PORT}/`;

Sentry.init({
  dsn: 'https://public@example.invalid/1',
  tunnel: SINK,
  tracesSampleRate: 1.0,
});

console.log('SDK_VERSION', Sentry.SDK_VERSION, 'metrics keys:', Object.keys(Sentry.metrics ?? {}).join(','));

Sentry.metrics.count('d06.requests', 1, { attributes: { runtime: 'deno', route: '/a' } });
Sentry.metrics.count('d06.requests', 2, { attributes: { runtime: 'deno', route: '/b' } });
Sentry.metrics.gauge('d06.queue_depth', 42, { unit: 'none', attributes: { runtime: 'deno' } });
Sentry.metrics.distribution('d06.duration', 3.5, { unit: 'second', attributes: { runtime: 'deno' } });

await Sentry.startSpan({ name: 'd06-span', op: 'probe' }, async () => {
  Sentry.metrics.count('d06.in_span');
});

await new Promise(r => setTimeout(r, 7000));
const after7s = await (await fetch(`http://127.0.0.1:${SINK_PORT}/__items`)).text();
console.log('AFTER_7S', after7s);

Sentry.captureMessage('sentinel');
await Sentry.flush(5000);
await new Promise(r => setTimeout(r, 1000));
const afterFlush = await (await fetch(`http://127.0.0.1:${SINK_PORT}/__items`)).text();
console.log('AFTER_FLUSH', afterFlush);
