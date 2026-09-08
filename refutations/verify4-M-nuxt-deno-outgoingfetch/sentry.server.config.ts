import * as Sentry from '@sentry/nuxt';
import { winterCGFetchIntegration } from '@sentry/vercel-edge';
import { globalFetchIntegration } from './global-fetch-integration';

const fix = process.env.SENTRY_FETCH_FIX || 'none';

Sentry.init({
  dsn: 'https://public@dsn.ingest.sentry.io/1337',
  tunnel: `http://127.0.0.1:${process.env.SINK_PORT || '34011'}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: (process.env.LIFECYCLE as 'static' | 'stream') || 'stream',
  tracePropagationTargets: [/.*/],
  integrations:
    fix === 'custom' ? [globalFetchIntegration()] : fix === 'edge' ? [winterCGFetchIntegration()] : [],
  debug: true,
});
