import * as Sentry from '@sentry/cloudflare';
import { injectTraceMetaTags, wrapSentryHandleRequest } from '@sentry/react-router/cloudflare';
import { isbot } from 'isbot';
import { renderToReadableStream } from 'react-dom/server';
import type { AppLoadContext, EntryContext, HandleErrorFunction } from 'react-router';
import { ServerRouter } from 'react-router';

async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: AppLoadContext,
) {
  let didError = false;

  const body = await renderToReadableStream(<ServerRouter context={routerContext} url={request.url} />, {
    onError() {
      didError = true;
    },
  });

  if (isbot(request.headers.get('user-agent') || '')) {
    await body.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');
  return new Response(injectTraceMetaTags(body), {
    headers: responseHeaders,
    status: didError ? 500 : responseStatusCode,
  });
}

// `createSentryHandleError` is not exported from `@sentry/react-router/cloudflare`,
// so the handleError export is hand-rolled.
export const handleError: HandleErrorFunction = (error, { request }) => {
  if (!request.signal.aborted) {
    Sentry.captureException(error);
  }
};

export default wrapSentryHandleRequest(handleRequest);
