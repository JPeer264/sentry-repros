import * as Sentry from '@sentry/nextjs';
import { winterCGFetchIntegration } from '@sentry/vercel-edge';

const isDeno = typeof globalThis.Deno !== 'undefined';

Sentry.init({
  dsn: 'https://public@example.invalid/1',
  tunnel: `http://127.0.0.1:${process.env.SINK_PORT}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: process.env.TRACE_LIFECYCLE || 'static',
  enableRuntimeChannelInjection: false,
  integrations: isDeno ? [winterCGFetchIntegration()] : [],
  debug: true,
});
