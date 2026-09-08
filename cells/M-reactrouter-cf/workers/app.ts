import * as Sentry from '@sentry/cloudflare';
import { createRequestHandler } from 'react-router';

const SINK_PORT = 41207;

// 'static' gives transaction envelopes with nested spans[], 'stream' gives span envelopes.
const TRACE_LIFECYCLE: 'static' | 'stream' = 'static';

const requestHandler = createRequestHandler(
  () => import('virtual:react-router/server-build'),
  import.meta.env.MODE,
);

export default Sentry.withSentry(
  () => ({
    dsn: 'https://public@localhost/1',
    tunnel: `http://127.0.0.1:${SINK_PORT}/`,
    tracesSampleRate: 1.0,
    traceLifecycle: TRACE_LIFECYCLE,
    environment: 'production',
  }),
  {
    async fetch(request, env, ctx) {
      return requestHandler(request, { cloudflare: { env, ctx } });
    },
  } satisfies ExportedHandler<Env>,
);
