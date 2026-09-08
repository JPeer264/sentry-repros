import * as Sentry from '@sentry/tanstackstart-react';

// What the `sentryTanstackStart()` Vite plugin would have inlined into wrapFetchWithSentry.
// Sorted the way makeRoutePatternPlugin sorts: more segments first, static before dynamic.
globalThis.__SENTRY_ROUTE_PATTERNS__ = ['/api/user/$id', '/api/ping', '/api/sentinel', '/param/$id', '/'];

const integrations = [];
if (process.env.PROBE_BUN_HTTP === '1') {
  const { bunHttpServerIntegration } = await import('@sentry/bun');
  integrations.push(bunHttpServerIntegration());
}

Sentry.init({
  dsn: 'http://public@localhost:1/1337',
  tunnel: process.env.PROBE_TUNNEL,
  tracesSampleRate: 1,
  traceLifecycle: process.env.PROBE_LIFECYCLE || 'static',
  debug: process.env.PROBE_DEBUG === '1',
  integrations,
});
globalThis.__PROBE_SENTRY__ = Sentry;
console.log('[probe] sentry initialized, client =', !!Sentry.getClient(), 'extra integrations =', integrations.map(i => i.name));
