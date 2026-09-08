import * as Sentry from '@sentry/cloudflare';
import { SINK_URL } from './config';

export interface Env {}

export async function routes(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const { pathname } = new URL(request.url);

  const user = new URLPattern({ pathname: '/users/:id' }).exec(request.url);
  if (user) {
    return Response.json({ id: user.pathname.groups.id, name: 'Ada' });
  }

  if (pathname === '/debug-sentry') {
    throw new Error('My first Sentry error!');
  }

  if (pathname === '/debug-span') {
    await Sentry.startSpan({ op: 'test', name: 'My First Test Span' }, async () => {
      await fetch(`${SINK_URL}/recorder?from=debug-span`);
    });
    return new Response('ok');
  }

  if (pathname === '/debug-log') {
    Sentry.logger.info('hello from /debug-log', { route: pathname });
    return new Response('ok');
  }

  if (pathname === '/debug-waituntil') {
    ctx.waitUntil(Promise.reject(new Error('waitUntil rejection')));
    return new Response('ok');
  }

  if (pathname === '/sentinel') {
    Sentry.captureMessage('sentinel');
    return new Response('ok');
  }

  return new Response('not found', { status: 404 });
}
