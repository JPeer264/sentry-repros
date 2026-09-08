import { wrapRequestHandler } from '@sentry/cloudflare/request';
import { DSN, TUNNEL } from './config';
import { routes, type Env } from './routes';

export default {
  async fetch(request, env, ctx) {
    return wrapRequestHandler(
      {
        options: {
          dsn: DSN,
          tracesSampleRate: 1.0,
          debug: true,
          tunnel: TUNNEL,
          traceLifecycle: 'static',
        },
        request,
        context: ctx,
      },
      () => routes(request, env, ctx),
    );
  },
} satisfies ExportedHandler<Env>;
