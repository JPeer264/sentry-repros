import type { EntryContext } from '@remix-run/node';
import { installGlobals } from '@remix-run/node';
import { RemixServer } from '@remix-run/react';
import { renderToString } from 'react-dom/server';
import * as Sentry from '@sentry/remix';

installGlobals();

export const handleError = Sentry.sentryHandleError;

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
) {
  const html = renderToString(<RemixServer context={remixContext} url={request.url} />);
  responseHeaders.set('Content-Type', 'text/html');
  return new Response('<!DOCTYPE html>' + html, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
