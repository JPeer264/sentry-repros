import { createSentryHandleError, wrapSentryHandleRequest } from '@sentry/react-router';
import { renderToReadableStream } from 'react-dom/server';
import type { AppLoadContext, EntryContext } from 'react-router';
import { ServerRouter } from 'react-router';

async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: AppLoadContext,
) {
  const body = await renderToReadableStream(<ServerRouter context={routerContext} url={request.url} />, {
    signal: request.signal,
  });
  responseHeaders.set('Content-Type', 'text/html');
  return new Response(body, { headers: responseHeaders, status: responseStatusCode });
}

export default wrapSentryHandleRequest(handleRequest);
export const handleError = createSentryHandleError({ logErrors: true });
