import * as Sentry from '@sentry/deno';
import { get as httpGet } from 'node:http';

export const APP_PORT = Number(Deno.env.get('PORT'));
export const SINK_PORT = Number(Deno.env.get('SINK'));
export const TRACE_LIFECYCLE = Deno.env.get('TRACE_LIFECYCLE') === 'static' ? 'static' : 'stream';

export function initSentry(): void {
  Sentry.init({
    dsn: 'https://public@example.invalid/1',
    tunnel: `http://127.0.0.1:${SINK_PORT}/`,
    tracesSampleRate: 1.0,
    sendDefaultPii: true,
    traceLifecycle: TRACE_LIFECYCLE as 'static' | 'stream',
  });
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function traceIds(): { traceId: string | undefined; spanId: string | undefined } {
  const ctx = Sentry.getActiveSpan()?.spanContext();
  return { traceId: ctx?.traceId, spanId: ctx?.spanId };
}

/** GET the given path on this same server over node:http, resolving to the body text. */
export function nodeHttpGet(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = httpGet({ host: '127.0.0.1', port: APP_PORT, path }, res => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', c => (body += c));
      res.on('end', () => resolve(body));
    });
    req.on('error', reject);
  });
}

/** The body every route answers with, plus the status code to answer it with. */
export type Answer = { status: number; body: string };

/** Everything except /error-sync, which must throw synchronously in the listener. */
export async function route(pathname: string, search: URLSearchParams, headers: Record<string, string>): Promise<Answer> {
  if (pathname === '/hello/world') {
    return { status: 200, body: 'hello world\n' };
  }

  if (pathname.startsWith('/echo/')) {
    const ids = traceIds();
    return {
      status: 200,
      body: JSON.stringify({ traceId: ids.traceId, spanId: ids.spanId, echo: { path: pathname, headers } }),
    };
  }

  if (pathname === '/downstream') {
    const ids = traceIds();
    const echo = await nodeHttpGet('/echo/users/7');
    return { status: 200, body: JSON.stringify({ traceId: ids.traceId, spanId: ids.spanId, echo: JSON.parse(echo).echo }) };
  }

  if (pathname === '/downstream-fetch') {
    const ids = traceIds();
    const echo = await fetch(`http://127.0.0.1:${APP_PORT}/echo/users/7`).then(r => r.json());
    return { status: 200, body: JSON.stringify({ traceId: ids.traceId, spanId: ids.spanId, echo: echo.echo }) };
  }

  if (pathname === '/captured') {
    Sentry.captureException(new Error('captured in handler'));
    return { status: 200, body: 'captured\n' };
  }

  if (pathname === '/status-500') {
    return { status: 500, body: 'server error\n' };
  }

  if (pathname === '/slow') {
    const id = search.get('id') ?? 'none';
    const ms = Number(search.get('ms') ?? '100');
    Sentry.setTag('reqId', id);
    Sentry.setUser({ id });
    await delay(ms);
    const data = Sentry.getIsolationScope().getScopeData();
    Sentry.captureMessage(`slow-${id}`);
    return {
      status: 200,
      body: JSON.stringify({ id, tagNow: data.tags?.reqId, userNow: data.user?.id, activeSpan: traceIds().spanId }),
    };
  }

  if (pathname === '/error') {
    await delay(10);
    throw new Error('async throw in handler');
  }

  if (pathname === '/sentinel') {
    Sentry.captureMessage('sentinel');
    return { status: 200, body: 'sentinel\n' };
  }

  return { status: 404, body: 'not found\n' };
}
