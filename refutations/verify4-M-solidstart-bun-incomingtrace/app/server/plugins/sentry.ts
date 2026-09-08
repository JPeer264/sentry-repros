import { bunHttpServerIntegration, bunServerIntegration } from '@sentry/bun';
import * as Sentry from '@sentry/solidstart';
import { definePlugin } from 'nitro';

const extra = [];
if (process.env.PROBE_INT === 'bunhttp') {
  extra.push(bunHttpServerIntegration({ spans: false }));
} else if (process.env.PROBE_INT === 'bunhttp-spans') {
  extra.push(bunHttpServerIntegration());
} else if (process.env.PROBE_INT === 'bunserve') {
  extra.push(bunServerIntegration());
}

export default definePlugin(() => {
  Sentry.init({
    dsn: 'https://public@dsn.ingest.sentry.io/1337',
    tunnel: process.env.SENTRY_TUNNEL,
    tracesSampleRate: 1.0,
    traceLifecycle: (process.env.SENTRY_LIFECYCLE as 'static' | 'stream') || 'static',
    debug: !!process.env.SENTRY_DEBUG,
    integrations: extra,
  });
});
