// docs: platform-includes/getting-started-complete/javascript.remix.mdx:322-323, the `sentryHandleError`
// alternative. Copied over app/entry.server.tsx by run.sh for the `direct` handleError variants.
import type { EntryContext } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import * as Sentry from "@sentry/remix";
import { renderToString } from "react-dom/server";

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
