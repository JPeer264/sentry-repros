import type { EntryContext } from '@remix-run/cloudflare';
import { RemixServer } from '@remix-run/react';
import { sentryHandleError } from '@sentry/remix/cloudflare';
import { renderToReadableStream } from 'react-dom/server';

export const handleError = sentryHandleError;

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
) {
  const body = await renderToReadableStream(<RemixServer context={remixContext} url={request.url} />, {
    signal: request.signal,
    onError() {
      responseStatusCode = 500;
    },
  });

  responseHeaders.set('Content-Type', 'text/html');
  return new Response(body, { headers: responseHeaders, status: responseStatusCode });
}
