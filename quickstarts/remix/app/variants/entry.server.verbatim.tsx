// docs: platform-includes/getting-started-complete/javascript.remix.mdx:313-324 pasted as printed, both
// `export const handleError` lines included. Copied over app/entry.server.tsx by run.sh for the
// `handle-error-verbatim` variant, which only builds.
import type { EntryContext } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import * as Sentry from "@sentry/remix";
import { renderToString } from "react-dom/server";

export const handleError = Sentry.wrapHandleErrorWithSentry(
  (error, { request }) => {
    // Custom handleError implementation
  }
);

// Alternative: Use the Sentry utility function if you don't need to wrap a custom function
export const handleError = Sentry.sentryHandleError;

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
) {
  const markup = renderToString(<RemixServer context={remixContext} url={request.url} />);
  responseHeaders.set("Content-Type", "text/html");
  return new Response(`<!DOCTYPE html>${markup}`, { status: responseStatusCode, headers: responseHeaders });
}
