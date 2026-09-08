import * as Sentry from '@sentry/bun';

const MODE = process.env.MODE || 'permissive';

// permissive -> dataCollection: {} (SDK defaults, bodies allowed)
// nobodies   -> dataCollection: { httpBodies: [] } (bodies must be dropped)
const dataCollection = MODE === 'nobodies' ? { httpBodies: [] as string[] } : {};

console.log('MODE', MODE, JSON.stringify(dataCollection));

Sentry.init({
  dsn: 'https://public@example.invalid/1',
  tunnel: `http://127.0.0.1:${process.env.SINK_PORT}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: 'static',
  dataCollection,
});
