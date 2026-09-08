import type { EntryContext, RouterContextProvider } from "react-router";
import { ServerRouter } from "react-router";
import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";
import * as Sentry from "@sentry/react-router";

export const streamTimeout = 5_000;

// Bun resolves `react-dom/server` to server.bun.js, which has no
// renderToPipeableStream, so neither the stock template entry nor
// Sentry.createSentryHandleRequest (which requires it) can be used here.
async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: RouterContextProvider,
) {
  if (request.method.toUpperCase() === "HEAD") {
    return new Response(null, {
      status: responseStatusCode,
      headers: responseHeaders,
    });
  }

  let shellRendered = false;
  const userAgent = request.headers.get("user-agent");
  const waitForAll = (userAgent && isbot(userAgent)) || routerContext.isSpaMode;

  const stream = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      onError(error: unknown) {
        responseStatusCode = 500;
        if (shellRendered) {
          console.error(error);
        }
      },
    },
  );
  shellRendered = true;

  if (waitForAll) {
    await stream.allReady;
  }

  responseHeaders.set("Content-Type", "text/html");
  return new Response(stream, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}

export default Sentry.wrapSentryHandleRequest(handleRequest);

export const handleError = Sentry.createSentryHandleError({ logErrors: true });
