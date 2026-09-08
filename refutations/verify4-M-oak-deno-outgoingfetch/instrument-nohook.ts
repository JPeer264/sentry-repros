// no import hook
import * as Sentry from '@sentry/deno';
import { denoFetchIntegration } from './fetch-integration.ts';

const SINK = Deno.env.get('SINK_PORT') ?? '41417';
const LIFECYCLE = (Deno.env.get('LIFECYCLE') ?? 'static') as 'static' | 'stream';
const FIX = Deno.env.get('FETCH_FIX') === '1';

Sentry.init({
  dsn: 'https://public@example.com/1',
  tunnel: `http://127.0.0.1:${SINK}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: LIFECYCLE,
  debug: Deno.env.get('SENTRY_DEBUG') === '1',
  integrations: FIX ? [denoFetchIntegration()] : [],
});
