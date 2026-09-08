(globalThis as Record<string, unknown>).__SENTRY_ORCHESTRION__ = { runtimeUnavailable: true };

import * as Sentry from '@sentry/nestjs';
import { nativeNodeFetchIntegration } from '@sentry/node';
import { denoFetchIntegration } from './fetch-integration.ts';

const MODE = Deno.env.get('MODE') ?? 'baseline';
const LIFECYCLE = (Deno.env.get('LIFECYCLE') ?? 'static') as 'static' | 'stream';

const integrations = [];
if (MODE === 'userland') integrations.push(denoFetchIntegration());
if (MODE === 'nativefetch') integrations.push(nativeNodeFetchIntegration({ spans: true }));

Sentry.init({
  dsn: 'https://public@example.com/1',
  tunnel: `http://127.0.0.1:${Deno.env.get('SINK_PORT')}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: LIFECYCLE,
  tracePropagationTargets: [/.*/],
  debug: Deno.env.get('SENTRY_DEBUG') === '1',
  integrations,
});

if (MODE === 'undiciglobal') {
  const { fetch: undiciFetch } = await import('undici');
  (globalThis as Record<string, unknown>).fetch = undiciFetch;
}

console.log(`SENTRY_INIT mode=${MODE} lifecycle=${LIFECYCLE}`);
