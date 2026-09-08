import { createSentryHandleError, wrapSentryHandleRequest } from '@sentry/react-router';
import { isbot } from 'isbot';
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
  return new Response(body, {
    headers: responseHeaders,
    status: didError ? 500 : responseStatusCode,
  });
}

export default wrapSentryHandleRequest(handleRequest);
export const handleError = createSentryHandleError({ logErrors: true });
