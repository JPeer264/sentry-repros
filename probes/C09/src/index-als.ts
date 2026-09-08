import * as Sentry from '@sentry/cloudflare';
import { wrapRequestHandler } from '@sentry/cloudflare/request';
import { setAsyncLocalStorageAsyncContextStrategy } from '@sentry/server-utils/no-diagnostic-channels';
import { route } from './index';

setAsyncLocalStorageAsyncContextStrategy();

interface Env {
  SINK: string;
  ECHO: string;
}

export default {
  fetch(request: Request, env: Env, context: ExecutionContext): Promise<Response> {
    return wrapRequestHandler(
      {
        options: {
          dsn: 'https://public@example.invalid/1',
          tunnel: env.SINK,
          tracesSampleRate: 1.0,
        },
        request,
        context,
      },
      () => route(request, env),
    );
  },
};
