import * as Sentry from '@sentry/solidstart';
import { winterCGFetchIntegration } from '@sentry/vercel-edge';
import { definePlugin } from 'nitro';
import { denoFetchIntegration } from '../fetch-integration';

const fix = process.env.SENTRY_FETCH_FIX || '0';

function extraIntegrations() {
  if (fix === '1') return [denoFetchIntegration()];
  if (fix === '2') return [winterCGFetchIntegration()];
  if (fix === '3') return typeof (globalThis as any).Deno !== 'undefined' ? [winterCGFetchIntegration()] : [];
  return [];
}

export default definePlugin(() => {
  if (process.env.SENTRY_INIT_MODE === 'instrument') {
    console.log('[probe] nitro plugin skipped, init comes from instrument.server');
    return;
  }
  Sentry.init({
    dsn: 'https://public@localhost/1',
    tunnel: process.env.SENTRY_TUNNEL,
    tracesSampleRate: 1.0,
    tracePropagationTargets: [/.*/],
    traceLifecycle: (process.env.SENTRY_LIFECYCLE as 'static' | 'stream') || 'static',
    debug: !!process.env.SENTRY_DEBUG,
    integrations: extraIntegrations(),
  });
  console.log('[probe] sentry init fetchfix=' + fix + ' lifecycle=' + (process.env.SENTRY_LIFECYCLE || 'static'));
});
