import { createRequestHandler } from '@remix-run/cloudflare';
import * as SentryCF from '@sentry/cloudflare';
import { wrapRequestHandler } from '@sentry/cloudflare/request';
import { instrumentBuild } from '@sentry/remix/cloudflare';
// @ts-expect-error - produced by `remix vite:build`
import * as remixBuild from './build/server/index.js';

// Without this, wrapRequestHandler's isolation scope fork is a no-op (see README).
SentryCF.setAsyncLocalStorageAsyncContextStrategy();

const handleRequest = createRequestHandler(instrumentBuild(remixBuild as any) as any, 'production');

export default {
  async fetch(request: Request, env: unknown, ctx: ExecutionContext): Promise<Response> {
    return wrapRequestHandler(
      {
        options: {
          dsn: 'http://abc123@127.0.0.1:45731/1',
          tunnel: 'http://127.0.0.1:45731/',
          tracesSampleRate: 1.0,
          traceLifecycle: 'static',
        },
        request,
        context: ctx,
      },
      async () => handleRequest(request, { env, ctx } as any),
    );
  },
};
