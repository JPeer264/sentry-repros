import * as Sentry from '@sentry/solidstart';
import { winterCGFetchIntegration } from '@sentry/vercel-edge';

const fix = process.env.SENTRY_FETCH_FIX || '0';

if (process.env.SENTRY_INIT_MODE === 'instrument') {
  Sentry.init({
    dsn: 'https://public@localhost/1',
    tunnel: process.env.SENTRY_TUNNEL,
    tracesSampleRate: 1.0,
    tracePropagationTargets: [/.*/],
    traceLifecycle: (process.env.SENTRY_LIFECYCLE as 'static' | 'stream') || 'static',
    integrations: fix === '2' ? [winterCGFetchIntegration()] : [],
  });
  console.log('[probe] sentry init via instrument.server fetchfix=' + fix);
}
