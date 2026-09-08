import * as Sentry from '@sentry/cloudflare';
import { DSN, TUNNEL } from './config';
import { routes, type Env } from './routes';

export default Sentry.withSentry(
  (env: Env) => ({
    dsn: DSN,
    tracesSampleRate: 1.0,
    debug: true,
    tunnel: TUNNEL,
  }),
  {
    async fetch(request, env, ctx) {
      return routes(request, env, ctx);
    },
  } satisfies ExportedHandler<Env>,
);
