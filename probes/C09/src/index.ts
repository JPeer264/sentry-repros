import * as Sentry from '@sentry/cloudflare';
import { wrapRequestHandler } from '@sentry/cloudflare/request';

interface Env {
  SINK: string;
  ECHO: string;
}

export async function route(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === '/error') {
    throw new Error('route boom');
  }

  if (url.pathname === '/downstream') {
    const res = await fetch(`${env.ECHO}/users/7`);
    return new Response(await res.text(), { headers: { 'content-type': 'application/json' } });
  }

  if (url.pathname === '/integrations') {
    const client = Sentry.getClient() as unknown as { _integrations?: Record<string, unknown> } | undefined;
    return Response.json({
      integrations: client ? Object.keys(client._integrations ?? {}) : [],
      hasClient: !!client,
    });
  }

  if (url.pathname === '/sentinel') {
    Sentry.captureMessage('sentinel');
    return new Response('sentinel\n');
  }

  return new Response('hello\n');
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
