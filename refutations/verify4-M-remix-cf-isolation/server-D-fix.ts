import { createRequestHandler } from '@remix-run/cloudflare';
import * as SentryCF from '@sentry/cloudflare';
import { wrapRequestHandler } from '@sentry/cloudflare/request';
import { instrumentBuild } from '@sentry/remix/cloudflare';
// @ts-expect-error build output
import * as remixBuild from './build/server/index.js';

SentryCF.setAsyncLocalStorageAsyncContextStrategy();

const handleRequest = createRequestHandler(instrumentBuild(remixBuild), 'production');

export default {
  async fetch(request: Request, env: unknown, ctx: ExecutionContext): Promise<Response> {
    return wrapRequestHandler(
      {
        options: {
          dsn: 'https://public@dsn.ingest.sentry.io/1337',
          tracesSampleRate: 1.0,
          traceLifecycle: 'static',
          tunnel: 'http://127.0.0.1:47213/',
        },
        request: request as any,
        context: ctx,
      },
      async () => handleRequest(request, { env, ctx }),
    );
  },
};
