import { bunHttpServerIntegration } from '@sentry/bun';
import * as Sentry from '@sentry/solidstart';
import { definePlugin } from 'nitro';

const mode = process.env.SENTRY_BUN_HTTP;

export default definePlugin(() => {
  Sentry.init({
    dsn: 'https://public@localhost/1',
    tunnel: process.env.SENTRY_TUNNEL,
    tracesSampleRate: 1.0,
    traceLifecycle: (process.env.SENTRY_LIFECYCLE as 'static' | 'stream') || 'static',
    integrations: mode === 'nospans' ? [bunHttpServerIntegration({ spans: false })] : mode ? [bunHttpServerIntegration()] : [],
    debug: !!process.env.SENTRY_DEBUG,
  });
});
