import * as Sentry from '@sentry/solidstart';
import { definePlugin } from 'nitro';
import { globalFetchIntegration } from '../fetch-integration';

const isDeno = typeof (globalThis as any).Deno !== 'undefined';

export default definePlugin(() => {
  Sentry.init({
    dsn: 'https://public@localhost/1',
    tunnel: 'http://127.0.0.1:41871/',
    tracesSampleRate: 1.0,
    traceLifecycle: (process.env.SENTRY_LIFECYCLE as 'static' | 'stream') || 'static',
    integrations: integrations => (isDeno ? [...integrations, globalFetchIntegration()] : integrations),
  });
});
